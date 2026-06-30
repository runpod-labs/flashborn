# Hunyuan3D-2 Endpoint — Hackathon Runbook

**TL;DR:** Self-hosted image→textured-3D on a Flash A100. No third-party API.
Send 1–3 images (front/back/side), get a textured `.glb` back in ~30s warm.

---

## 1. What we have

| Thing | Value |
|---|---|
| Model | Hunyuan3D-2 **MV** (shape) + Hunyuan3D-2 **Paint** (texture), self-hosted |
| GPU | A100 80GB (`GpuGroup.AMPERE_80`) on Runpod Flash serverless |
| Project dir | `/Users/timpietrusky/data/dev/runpod/hunyuan3d/` |
| Worker file | `hunyuan3d_worker.py` (single `@Endpoint`) |
| Live endpoint id | **read it from `viewer/endpoint_id.txt`** (persistent, survives reboots) — it changes on undeploy/redeploy |
| Network volume | `hunyuan3d-vol` (100GB) — holds the venv + repo + model weights, **persists across redeploys** so no rebuild |
| Gallery | `flash-hackathon/viewer/` → `http://localhost:8800` (model-viewer cards) |
| Grind daemon | `flash-hackathon/viewer/loop_daemon.sh` (forever loop, idle-verifying) |

The 10 demo assets live in the gallery; their GLBs are in `viewer/models/obj_*.glb`.

---

## 2. Call the endpoint (the only contract you need)

Action `infer`. Inputs are **base64 PNGs** (RGBA cutouts work best). `front` required,
`back`/`left` optional but improve quality (MV = multi-view).

```python
import os, json, base64, urllib.request
KEY = os.environ["RUNPOD_API_KEY"]
EP  = open("../flash-hackathon/viewer/endpoint_id.txt").read().strip()  # persistent id file
b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()

payload = {"input": {"input_data": {
    "action": "infer",
    "textured": True,            # False = shape-only (faster, no paint)
    "octree_resolution": 256,    # shape detail (128 fast … 384 max)
    "num_inference_steps": 30,   # shape steps
    "max_facenum": 40000,        # << decimate target before texture (see §4)
    "front_b64": b64("front.png"),
    "back_b64":  b64("back.png"),
    "left_b64":  b64("side.png"),
}}}
req = urllib.request.Request(f"https://api.runpod.ai/v2/{EP}/run",
        data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer "+KEY, "Content-Type": "application/json"})
job_id = json.load(urllib.request.urlopen(req))["id"]
# poll https://api.runpod.ai/v2/{EP}/status/{job_id} until COMPLETED
```

**Returns:**
```json
{"status":"ok","glb_url":"https://files.catbox.moe/xxxx.glb",
 "timings":{"load_s":0,"shape_s":16,"clean_s":0.7,"texture_s":12,"export_s":0.9,"upload_s":2,
            "raw_faces":261420,"pre_faces":40000},
 "warm":true,"seconds":31,"components":1}
```
Download the GLB with `curl -sL -o out.glb "$glb_url"`.

**Other actions:** `status` (build/ready check), `build` (recompile stack — only after wiping volume), `import_test`, `debug_texture` (faulthandler harness).

---

## 3. Performance (so you can budget the demo)

| State | Time |
|---|---|
| **Cold start** (first call after scale-up) | +~113s model load (one-time) |
| **Warm** infer, textured, 40k | **~30–35s** total |
| texture stage @ 40k / 80k / 150k faces | 12s / 24s / 44s |

Worker is **`workers=(0, 1)`** → **scales to zero when idle = no cost** (current default).
- First call after idle pays a **~113s cold start** (model load), then warm ~30s.
- For a live demo where you can't afford the cold start, pre-warm ~2 min before, OR
  switch to `workers=(1, 1)` and redeploy to keep one worker always on (continuous A100 cost).

---

## 4. The 3 gotchas that cost us a day (don't rediscover them)

1. **Decimate to ≤40k faces before texturing — non-negotiable.**
   The shape model emits ~260k faces / 12k+ disconnected pieces. Feeding that raw
   into the paint pipeline **deadlocks the CUDA rasterizer in an uninterruptible GPU
   call** (hangs forever, ignores SIGKILL *and* the RunPod execution timeout). This is
   why fal caps at 40k too. The worker now reduces with `trimesh` + `fast_simplification`
   before paint. `max_facenum` is tunable; 40k is the safe default, ≤150k still works on
   clean meshes, above that risks the hang again.

2. **pymeshlab is broken on this worker** (`Unknown format for load: ply` — its PLY
   plugin can't load because `libOpenGL.so.0` is missing). Hunyuan's own
   `FaceReducer/FloaterRemover/DegenerateFaceRemover` all route through pymeshlab, so
   they crash. The worker **monkeypatches those three classes in-place** with trimesh
   equivalents, so pymeshlab is never touched. *(Alt fix if you ever want pymeshlab back:
   add `libopengl0` to `system_dependencies`.)*

3. **`flash deploy` does NOT swap code on the running `(1,1)` worker.**
   It keeps the existing warm worker serving **old code in memory**. If a code change
   "isn't taking effect," do **`flash undeploy hunyuan3d` then `flash deploy`** to force a
   fresh worker. The named volume persists, so this is fast (no rebuild). Endpoint id
   changes — update `viewer/endpoint_id.txt`.

---

## 5. Quickstart commands

```bash
# --- endpoint lifecycle (from hunyuan3d/) ---
flash deploy                       # deploy / push code  (use undeploy+deploy to force fresh worker)
flash undeploy hunyuan3d           # tear down (volume + build survive)
flash undeploy list                # check for orphaned endpoints (cost!)

# --- health / readiness ---
EP=$(cat ../flash-hackathon/viewer/endpoint_id.txt)
curl -s https://api.runpod.ai/v2/$EP/health -H "Authorization: Bearer $RUNPOD_API_KEY"

# --- gallery (from flash-hackathon/viewer/) ---
python3 server.py                  # serves http://localhost:8800
./loop_daemon.sh &                 # forever grind/verify loop (writes loop_status.json + loop_heartbeat.txt)

# --- one-shot generate any object ---
python3 loop_retex.py              # re-textures any non-self-hosted object on the live endpoint
```

---

## 6. Input image tips (quality)
- **RGBA cutouts** (clean background removal) → far better than dark-on-dark. We used
  fal **BiRefNet** for masks (`agent-media image remove-background --provider fal`); u2net
  failed on dark objects.
- **Multi-view** (front + back + side) beats single-view: avoids the "doubled/ghosted"
  artifact that single-view + fragmented meshes produced.
- Texture quality is driven by the input images + MV diffusion, **not** face count.
  Face count only affects geometric edge sharpness.
