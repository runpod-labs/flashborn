# Hunyuan3D-2 (Tencent, open weight) multi-view image-to-3D on Runpod serverless via Flash.
#
# Actions (queue-based, action-dispatched):
#   {"action":"build"}                              compile the stack into the volume (once)
#   {"action":"status"}                             tail the build log
#   {"action":"import_test"}                        verify in-process import
#   {"action":"infer","front_b64":..,"back_b64":..,"left_b64":..}  -> textured GLB url
#
# Build = clone Tencent/Hunyuan3D-2 + venv(--system-site-packages, pinned torch) + install hy3dgen
# + compile custom_rasterizer & differentiable_renderer (texture CUDA exts). Pipeline is loaded once
# and cached on `sys` for warm reuse. Images come in as base64 (no external host needed).
from runpod_flash import Endpoint, GpuGroup, NetworkVolume

VOL = "/runpod-volume"


@Endpoint(
    name="flashborn-hunyuan3d",
    gpu=GpuGroup.AMPERE_80,             # A100 80GB (sm_80); ext compiled for this arch
    workers=(0, 1),                    # scale-to-zero when idle (no cost); ~113s cold start on first call. max 1: texture stage hangs under parallel contention
    max_concurrency=1,
    idle_timeout=1200,                 # keep the worker warm 20 min between requests (demo)
    flashboot=False,                   # fresh code on each redeploy
    execution_timeout_ms=1800000,      # 30 min cap — fresh-volume build (clone+venv+CUDA ext) needs headroom
    volume=NetworkVolume(name="flashborn-hunyuan3d-vol", size=100),
    dependencies=["requests", "fast_simplification"],
    system_dependencies=["git", "build-essential", "libgl1", "libglib2.0-0", "ffmpeg"],
    env={"HF_HOME": "/runpod-volume/hf", "HF_HUB_ENABLE_HF_TRANSFER": "0"},
)
async def hunyuan3d(input_data: dict) -> dict:
    import os
    import subprocess
    import time

    # flash dev ships only the function body, so module-level constants are not
    # available remotely — define VOL here (see flash gotcha #1).
    VOL = "/runpod-volume"
    VENV = f"{VOL}/venv"
    VENV_PY = f"{VENV}/bin/python"
    SRC = f"{VOL}/src"
    REPO = f"{SRC}/Hunyuan3D-2"
    HF_HOME = f"{VOL}/hf"
    READY = f"{VOL}/.hy3d_ready"
    BUILD_LOG = f"{VOL}/build.log"
    LOCK = f"{VOL}/.build.lock"
    SITE = f"{VENV}/lib/python3.12/site-packages"

    g = input_data or {}
    action = g.get("action", "infer")
    os.makedirs(VOL, exist_ok=True)

    # ---- status ----
    if action == "status":
        tail = ""
        if os.path.exists(BUILD_LOG):
            with open(BUILD_LOG, "r", errors="replace") as f:
                tail = "".join(f.readlines()[-45:])
        return {"ready": os.path.exists(READY), "building": os.path.exists(LOCK), "log_tail": tail}

    # ---- import_test ----
    if action == "import_test":
        import sys
        import traceback
        os.environ.setdefault("HF_HOME", HF_HOME)
        for p in (SITE, REPO):
            if p not in sys.path:
                sys.path.insert(0, p)
        info = {}
        try:
            import torch
            info["torch"] = torch.__version__
            info["cuda"] = torch.cuda.is_available()
            from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline  # noqa: F401
            import custom_rasterizer  # noqa: F401
            info["import"] = "OK"
        except Exception:  # noqa: BLE001
            info["import"] = "FAILED"
            info["trace"] = traceback.format_exc()[-1500:]
        return info

    # ---- build ----
    if action == "build":
        if os.path.exists(READY) and not g.get("force"):
            return {"status": "already_built"}
        if os.path.exists(LOCK) and not g.get("force"):
            return {"status": "build_in_progress"}

        build_script = r"""
set -o pipefail
export CUDA_HOME=/usr/local/cuda
export PATH=$CUDA_HOME/bin:$PATH
export TORCH_CUDA_ARCH_LIST=${TORCH_CUDA_ARCH_LIST:-8.0}
export FORCE_CUDA=1
export MAX_JOBS=4
VENV="%(venv)s"; SRC="%(src)s"; REPO="%(repo)s"
mkdir -p "$SRC"
[ -n "$FORCE_EXT" ] && { echo "FORCE_EXT clean"; rm -rf "$VENV"; }

step(){ echo ""; echo "===== $* ====="; date -u +%%H:%%M:%%S; }

step "venv (system-site-packages -> native torch)"
if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import torch; assert torch.__version__.startswith('2.9')" 2>/dev/null; then
  echo "reuse venv"
else
  rm -rf "$VENV"; python -m venv --system-site-packages "$VENV" || exit 5
  "$VENV/bin/python" -m pip install -U pip wheel --no-warn-script-location || exit 6
fi
PY="$VENV/bin/python"

step "constraints (freeze torch stack + hub<1.0)"
CONS="%(vol)s/constraints.txt"
$PY - > "$CONS" <<'PYEOF'
import importlib.metadata as m
for p in ("torch","torchvision","torchaudio","triton"):
    try: print(f"{p}=={m.version(p)}")
    except Exception: pass
PYEOF
echo "huggingface-hub<1.0,>=0.23" >> "$CONS"
cat "$CONS"
PIP="$PY -m pip install -c $CONS --no-warn-script-location"

step "clone Hunyuan3D-2"
[ -d "$REPO" ] || git clone -q https://github.com/Tencent/Hunyuan3D-2.git "$REPO" || exit 11

step "requirements"
$PIP -r "$REPO/requirements.txt" || exit 12
echo "torch after reqs:"; $PY -c "import torch;print(torch.__version__,torch.version.cuda)" || exit 12

step "install hy3dgen package"
( cd "$REPO" && $PIP -e . ) || exit 13

step "custom_rasterizer (CUDA ext)"
$PY -c "import custom_rasterizer" 2>/dev/null || ( cd "$REPO/hy3dgen/texgen/custom_rasterizer" && $PY setup.py install ) || exit 14

step "differentiable_renderer (CUDA ext)"
( cd "$REPO/hy3dgen/texgen/differentiable_renderer" && $PY setup.py install ) || exit 15

step "extra deps (rembg for preprocess, trimesh/pymeshlab)"
$PIP rembg onnxruntime trimesh pymeshlab pillow || true

step "verify import"
PYTHONPATH="$REPO" $PY -c "
import torch
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
import custom_rasterizer
print('torch', torch.__version__, 'cuda', torch.version.cuda)
print('IMPORTS_OK')
" || exit 51

echo ""; echo "BUILD_COMPLETE"
""" % {"venv": VENV, "src": SRC, "repo": REPO, "vol": VOL}

        build_env = dict(os.environ)
        if g.get("arch"):
            build_env["TORCH_CUDA_ARCH_LIST"] = str(g["arch"])
        if g.get("force_ext"):
            build_env["FORCE_EXT"] = "1"
        open(LOCK, "w").close()
        if os.path.exists(READY):
            os.remove(READY)
        t0 = time.time()
        try:
            with open(BUILD_LOG, "w") as log:
                proc = subprocess.run(["bash", "-lc", build_script], stdout=log,
                                      stderr=subprocess.STDOUT, text=True, env=build_env)
            with open(BUILD_LOG, "r", errors="replace") as f:
                lines = f.readlines()
            ok = proc.returncode == 0 and any("BUILD_COMPLETE" in l for l in lines)
            if ok:
                open(READY, "w").close()
            return {"status": "built" if ok else "build_failed", "returncode": proc.returncode,
                    "elapsed_min": round((time.time() - t0) / 60, 1), "log_tail": "".join(lines[-60:])}
        finally:
            if os.path.exists(LOCK):
                os.remove(LOCK)

    # ---- debug_texture: pinpoint WHERE the texture stage hangs (faulthandler stack dumps) ----
    if action == "debug_texture":
        import base64 as _b64
        work = f"{VOL}/work"
        os.makedirs(work, exist_ok=True)
        for v in ("front", "back", "left"):
            b = g.get(v + "_b64")
            if b:
                open(f"{work}/_dbg_{v}.png", "wb").write(_b64.b64decode(b))
        dbg = r'''
import faulthandler, sys, os, time
faulthandler.dump_traceback_later(40, repeat=True)   # if a step hangs, dump all thread stacks every 40s
sys.path.insert(0, "%(site)s"); sys.path.insert(0, "%(repo)s")
os.environ["HF_HOME"]="%(hf)s"; os.environ.setdefault("ATTN_BACKEND","sdpa")
from PIL import Image
W="%(work)s"
im=lambda v: Image.open(f"{W}/_dbg_{v}.png").convert("RGBA")
print("STEP load shape pipe", flush=True); t=time.time()
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
sp=Hunyuan3DDiTFlowMatchingPipeline.from_pretrained("tencent/Hunyuan3D-2mv", subfolder="hunyuan3d-dit-v2-mv")
print("  shape pipe", round(time.time()-t,1), flush=True)
imgs={"front":im("front"),"back":im("back"),"left":im("left")}
print("STEP shape gen", flush=True); t=time.time()
mesh=sp(image=imgs, num_inference_steps=20, octree_resolution=256)[0]
nf=len(getattr(mesh,"faces",[])); nv=len(getattr(mesh,"vertices",[]))
print(f"  shape done {round(time.time()-t,1)}s faces={nf} verts={nv}", flush=True)
print("STEP load paint pipe", flush=True); t=time.time()
import diffusers.pipelines.pipeline_loading_utils as plu
_o=plu.get_class_from_dynamic_module
def _t(*a,**k):
    k["trust_remote_code"]=True; return _o(*a,**k)
plu.get_class_from_dynamic_module=_t
from hy3dgen.texgen import Hunyuan3DPaintPipeline
pp=Hunyuan3DPaintPipeline.from_pretrained("tencent/Hunyuan3D-2")
print("  paint pipe", round(time.time()-t,1), flush=True)
print("STEP clean+reduce mesh (FloaterRemover/DegenerateFaceRemover/FaceReducer 40k)", flush=True); t=time.time()
from hy3dgen.shapegen import FloaterRemover, DegenerateFaceRemover, FaceReducer
mesh=FloaterRemover()(mesh); mesh=DegenerateFaceRemover()(mesh); mesh=FaceReducer()(mesh, max_facenum=40000)
print(f"  cleaned {round(time.time()-t,1)}s faces={len(getattr(mesh,'faces',[]))}", flush=True)
print("STEP texture bake", flush=True); t=time.time()
tm=pp(mesh, image=imgs["front"])
print(f"  PAINT DONE {round(time.time()-t,1)}s", flush=True)
''' % {"site": SITE, "repo": REPO, "hf": HF_HOME, "work": work}
        env = dict(os.environ)
        env.update({"HF_HOME": HF_HOME, "CUDA_HOME": "/usr/local/cuda"})
        t0 = time.time()
        try:
            proc = subprocess.run([VENV_PY, "-X", "faulthandler", "-c", dbg],
                                  env=env, capture_output=True, text=True, timeout=int(g.get("timeout", 300)))
            out, err, rc, timed = proc.stdout, proc.stderr, proc.returncode, False
        except subprocess.TimeoutExpired as e:  # hang -> capture partial output incl faulthandler dumps
            out = (e.stdout.decode() if isinstance(e.stdout, bytes) else e.stdout) or ""
            err = (e.stderr.decode() if isinstance(e.stderr, bytes) else e.stderr) or ""
            rc, timed = None, True
        combined = (out or "") + "\n--- STDERR (faulthandler stack dumps appear here on hang) ---\n" + (err or "")
        return {"returncode": rc, "timed_out": timed, "elapsed_s": round(time.time() - t0, 1), "log": combined[-6000:]}

    # ---- infer (warm, in-process) ----
    if not os.path.exists(READY):
        return {"error": "stack not built — call {'action':'build'} first"}

    import base64
    import json as _json
    import sys
    import traceback
    import requests

    octree = int(g.get("octree_resolution", 256))
    steps = int(g.get("num_inference_steps", 30))
    seed = int(g.get("seed", 42))
    textured = bool(g.get("textured", True))
    job_id = "".join(c for c in str(g.get("job_id") or f"hy_{seed}") if c.isalnum() or c in "-_")[:40]

    work = f"{VOL}/work"
    os.makedirs(work, exist_ok=True)
    out_path = f"{work}/{job_id}.glb"

    def _save(r):
        with open(f"{work}/last_result.json", "w") as f:
            _json.dump(r, f)
        return r

    os.environ.setdefault("HF_HOME", HF_HOME)
    os.environ["CUDA_HOME"] = "/usr/local/cuda"
    for p in (SITE, REPO):
        if p not in sys.path:
            sys.path.insert(0, p)

    timings = {}
    warm = None
    t_all = time.time()
    try:
        import io
        import torch  # noqa: F401
        from PIL import Image
        from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline

        import numpy as np
        rembg = getattr(sys, "_hy3d_rembg", None)
        if rembg is None:
            try:
                from hy3dgen.rembg import BackgroundRemover
                rembg = BackgroundRemover()
            except Exception:  # noqa: BLE001
                rembg = "pkg"
            sys._hy3d_rembg = rembg

        def _fetch(b64key, urlkey):
            # Prefer a URL (e.g. a Convex storage URL) so big images don't have to
            # be inlined as base64 in the request body (Runpod's ~10MB request cap).
            if g.get(urlkey):
                import requests
                return requests.get(g[urlkey], timeout=300, headers={"User-Agent": "Mozilla/5.0"}).content
            if g.get(b64key):
                return base64.b64decode(g[b64key])
            return None

        def _img(data):
            im = Image.open(io.BytesIO(data))
            opaque = (im.mode != "RGBA") or int(np.array(im.convert("RGBA"))[:, :, 3].min()) >= 250
            if opaque:  # solid background -> strip it on the worker
                rgb = im.convert("RGB")
                if rembg == "pkg":
                    import rembg as _r
                    im = _r.remove(rgb)
                else:
                    im = rembg(rgb)
            return im.convert("RGBA")

        warm = getattr(sys, "_hy3d_shape", None) is not None
        if warm:
            shape_pipe = sys._hy3d_shape
            paint_pipe = getattr(sys, "_hy3d_paint", None)
            timings["load_s"] = 0.0
        else:
            t = time.time()
            shape_pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
                "tencent/Hunyuan3D-2mv", subfolder="hunyuan3d-dit-v2-mv")
            sys._hy3d_shape = shape_pipe
            paint_pipe = None
            if textured:
                # Newer diffusers refuses the hunyuanpaint custom pipeline without trust_remote_code.
                # hy3dgen doesn't pass it, so force it on the dynamic-module loader.
                import diffusers.pipelines.pipeline_loading_utils as _plu
                _orig = _plu.get_class_from_dynamic_module
                def _trusted(*a, **k):  # noqa: ANN001
                    k["trust_remote_code"] = True
                    return _orig(*a, **k)
                _plu.get_class_from_dynamic_module = _trusted
                from hy3dgen.texgen import Hunyuan3DPaintPipeline
                paint_pipe = Hunyuan3DPaintPipeline.from_pretrained("tencent/Hunyuan3D-2")
                sys._hy3d_paint = paint_pipe
            timings["load_s"] = round(time.time() - t, 1)

        images = {}
        for _view in ("front", "back", "left"):
            _data = _fetch(f"{_view}_b64", f"{_view}_url")
            if _data:
                images[_view] = _img(_data)
        if not images:
            return {"error": "provide front_b64/front_url (+ optional back/left)"}

        t = time.time()
        mesh = shape_pipe(image=images, num_inference_steps=steps, octree_resolution=octree,
                          generator=torch.manual_seed(seed))[0]
        timings["shape_s"] = round(time.time() - t, 1)

        if textured and paint_pipe is not None:
            # CRITICAL: the raw shape mesh has 12k+ disconnected components and 100k+ faces.
            # Feeding that straight into paint_pipe makes xatlas UV-unwrap / custom_rasterizer
            # hang forever in an uninterruptible GPU call. fal caps at ~40k tris for exactly
            # this reason. Hunyuan's own FaceReducer uses pymeshlab, which on this worker
            # can't load .ply ("Unknown format for load: ply"), so we clean + decimate with
            # trimesh + fast_simplification directly — no pymeshlab, fully reliable.
            t = time.time()
            import trimesh as _tm
            import numpy as _np

            # pymeshlab is broken on this worker (can't load .ply). Hunyuan's postprocessors
            # (FloaterRemover/DegenerateFaceRemover/FaceReducer) all route through it, and the
            # paint pipeline may call them internally. Patch the class methods IN PLACE with
            # trimesh equivalents so pymeshlab is never touched anywhere in the process.
            def _as_mesh(m):
                if isinstance(m, _tm.Scene):
                    return _tm.util.concatenate(tuple(m.geometry.values()))
                return m

            def _patch_postprocessors():
                try:
                    from hy3dgen.shapegen import postprocessors as _pp
                except Exception:  # noqa: BLE001
                    return
                if getattr(_pp, "_trimesh_patched", False):
                    return

                def _floater(self, mesh, *a, **k):
                    mesh = _as_mesh(mesh)
                    try:
                        cs = mesh.split(only_watertight=False)
                        if len(cs) > 1:
                            cs = sorted(cs, key=lambda x: len(x.faces), reverse=True)
                            keep = [c for c in cs if len(c.faces) >= 0.01 * len(cs[0].faces)]
                            mesh = _tm.util.concatenate(keep) if keep else cs[0]
                    except Exception:  # noqa: BLE001
                        pass
                    return mesh

                def _degen(self, mesh, *a, **k):
                    mesh = _as_mesh(mesh)
                    mesh.merge_vertices()
                    mesh.update_faces(mesh.nondegenerate_faces())
                    mesh.update_faces(mesh.unique_faces())
                    mesh.remove_unreferenced_vertices()
                    return mesh

                def _reduce(self, mesh, max_facenum=40000, *a, **k):
                    mesh = _as_mesh(mesh)
                    if len(mesh.faces) > max_facenum:
                        import fast_simplification as _fs
                        v, f = _fs.simplify(_np.asarray(mesh.vertices, dtype=_np.float32),
                                            _np.asarray(mesh.faces, dtype=_np.int32),
                                            target_count=int(max_facenum))
                        mesh = _tm.Trimesh(vertices=v, faces=f, process=False)
                    return mesh

                for _cls, _fn in (("FloaterRemover", _floater),
                                  ("DegenerateFaceRemover", _degen),
                                  ("FaceReducer", _reduce)):
                    c = getattr(_pp, _cls, None)
                    if c is not None:
                        c.__call__ = _fn
                _pp._trimesh_patched = True

            _patch_postprocessors()

            if isinstance(mesh, _tm.Scene):
                mesh = _tm.util.concatenate(tuple(mesh.geometry.values()))
            mesh.merge_vertices()
            mesh.update_faces(mesh.nondegenerate_faces())
            mesh.update_faces(mesh.unique_faces())
            mesh.remove_unreferenced_vertices()
            timings["raw_faces"] = int(len(mesh.faces))
            # drop floater components (< 1% of the largest piece's face count)
            try:
                comps = mesh.split(only_watertight=False)
                if len(comps) > 1:
                    comps = sorted(comps, key=lambda m: len(m.faces), reverse=True)
                    keep = [c for c in comps if len(c.faces) >= 0.01 * len(comps[0].faces)]
                    mesh = _tm.util.concatenate(keep) if keep else comps[0]
            except Exception:  # noqa: BLE001
                pass
            target = int(g.get("max_facenum", 40000))
            if len(mesh.faces) > target:
                import fast_simplification as _fs
                v, f = _fs.simplify(_np.asarray(mesh.vertices, dtype=_np.float32),
                                    _np.asarray(mesh.faces, dtype=_np.int32),
                                    target_count=target)
                mesh = _tm.Trimesh(vertices=v, faces=f, process=False)
            timings["pre_faces"] = int(len(mesh.faces))
            timings["clean_s"] = round(time.time() - t, 1)
            t = time.time()
            mesh = paint_pipe(mesh, image=images.get("front"))
            timings["texture_s"] = round(time.time() - t, 1)

        t = time.time()
        mesh.export(out_path)
        timings["export_s"] = round(time.time() - t, 1)

        # QC: count big connected components (>1 == doubled/ghosted object)
        components = None
        try:
            import trimesh
            _m = trimesh.load(out_path, force="mesh")
            _parts = _m.split(only_watertight=False)
            _sz = sorted([len(p.faces) for p in _parts], reverse=True) or [len(_m.faces)]
            components = int(sum(1 for s in _sz if s > 0.05 * _sz[0]))
        except Exception:  # noqa: BLE001
            components = None
    except Exception:  # noqa: BLE001
        return _save({"status": "infer_failed", "job_id": job_id, "warm": warm,
                      "trace": traceback.format_exc()[-2500:], "timings": timings,
                      "seconds": round(time.time() - t_all, 1)})

    size_mb = round(os.path.getsize(out_path) / 1e6, 2)
    t = time.time()
    ua = {"User-Agent": "Mozilla/5.0 hy3d-flash/1.0"}
    glb_url = None
    try:
        with open(out_path, "rb") as f:
            r = requests.post("https://catbox.moe/user/api.php", data={"reqtype": "fileupload"},
                              files={"fileToUpload": ("model.glb", f, "model/gltf-binary")}, headers=ua, timeout=300)
        if r.status_code == 200 and r.text.startswith("http"):
            glb_url = r.text.strip()
    except Exception:  # noqa: BLE001
        glb_url = None
    timings["upload_s"] = round(time.time() - t, 1)

    return _save({"status": "ok", "job_id": job_id, "warm": warm, "glb_url": glb_url,
                  "glb_size_mb": size_mb, "octree_resolution": octree, "num_inference_steps": steps,
                  "textured": textured, "components": components, "timings": timings, "seconds": round(time.time() - t_all, 1)})
