# HiDream-O1-Image-Dev-2604 text-to-image on Runpod serverless via Flash.
#
# Single queue-based endpoint, action-dispatched:
#   {"action": "setup"}                       -> git-clone the HiDream-O1-Image repo onto the
#                                                 volume + patch out flash-attn (once)
#   {"action": "health"}                      -> liveness + whether repo/weights are cached
#   {"action": "generate", "prompt": "..."}   -> text -> PNG, returns base64 (+ upload URL)
#
# Model: HiDream-ai/HiDream-O1-Image-Dev-2604 — a 9B "unified" image generation model built on
# a Qwen3-VL backbone (~35GB safetensors, bf16). The HF repo ships only the weights + backbone
# config; the actual image-generation pipeline (the custom Qwen3VLForConditionalGeneration
# subclass + generate_image()) lives in the GitHub repo, so we vendor that repo onto the volume
# and import it. The repo is pure Python — no CUDA compilation needed (unlike pixal3d).
#
# flash-attn: the upstream pipeline hardcodes "use_flash_attn": True. Rather than build the
# flash-attn kernel (slow/fragile), we sed it to False on first setup — the model card states
# this is supported (just disables the optional speedup). The Qwen3-VL backbone is loaded with
# attn_implementation="sdpa" for the same reason.
#
# Caching (Flash-native): NetworkVolume + HF_HOME means the ~35GB weights download once on the
# first cold start and every later worker reads them from the volume cache. The cloned repo
# also lives on the volume. No baked image.
#
# NOTE: Flash ships the FUNCTION BODY to the worker — module-level names are NOT available
# remotely. Everything the handler uses (imports, constants, helpers) is defined INSIDE the
# function. This is correct for both `flash dev` and `flash deploy`.
from runpod_flash import Endpoint, GpuGroup, NetworkVolume, DataCenter


@Endpoint(
    name="flashborn-hidream-o1",
    gpu=[GpuGroup.AMPERE_80, GpuGroup.ADA_80_PRO, GpuGroup.HOPPER_141],  # A100 first, then H100, then H200 — widen supply in US-CA-2
    workers=(0, 5),                    # >=5 enables supply-based GPU auto-switch across the list
    max_concurrency=1,                 # one diffusion job per worker (GPU-bound)
    idle_timeout=300,
    flashboot=False,                   # avoid snapshot-restoring a stale env across dep changes
    execution_timeout_ms=0,            # unlimited: first cold start downloads ~35GB
    datacenter=DataCenter.US_CA_2,     # storage-capable DC with proven Hopper supply (see cosmos3)
    volume=NetworkVolume(name="flashborn-hidream-cache", size=80, datacenter=DataCenter.US_CA_2),
    system_dependencies=["git"],
    dependencies=[
        "torch",
        "torchvision",
        "transformers==4.57.1",        # config.json -> transformers 4.57.x; custom modeling needs it
        "diffusers",
        "accelerate",
        "einops",
        "numpy",
        "pillow",
        "scipy",
        "requests",
    ],
    env={
        "HF_HOME": "/runpod-volume/hf",
        "HF_HUB_ENABLE_HF_TRANSFER": "0",
    },
)
async def hidream(input_data: dict) -> dict:
    import os
    import time

    # --- paths (inside the body: only the function body ships to the worker) ---
    VOL = "/runpod-volume"
    REPO_DIR = f"{VOL}/HiDream-O1-Image"          # vendored GitHub repo (the pipeline code)
    HF_HOME = f"{VOL}/hf"
    MODEL_ID = "HiDream-ai/HiDream-O1-Image-Dev-2604"
    READY = f"{VOL}/.hidream_setup_done"
    REPO_URL = "https://github.com/HiDream-ai/HiDream-O1-Image.git"

    os.environ["HF_HOME"] = HF_HOME
    os.makedirs(VOL, exist_ok=True)

    g = input_data or {}
    action = g.get("action", "generate")

    def _do_setup():
        """Clone the repo onto the volume and disable flash-attn. Idempotent."""
        import subprocess
        if not os.path.isdir(os.path.join(REPO_DIR, ".git")):
            subprocess.run(["git", "clone", "--depth", "1", REPO_URL, REPO_DIR],
                           check=True, capture_output=True, text=True)
        # patch out the hardcoded flash-attn use (content-based, not line-number-based)
        pipeline_py = os.path.join(REPO_DIR, "models", "pipeline.py")
        if os.path.exists(pipeline_py):
            with open(pipeline_py, "r") as f:
                src = f.read()
            patched = src.replace('"use_flash_attn": True', '"use_flash_attn": False')
            if patched != src:
                with open(pipeline_py, "w") as f:
                    f.write(patched)
        open(READY, "w").close()

    # ---- setup: clone + patch (run once before the first generate) ----
    if action == "setup":
        import traceback
        try:
            _do_setup()
            return {"status": "setup_done", "repo_present": os.path.isdir(REPO_DIR)}
        except subprocess.CalledProcessError as e:  # noqa: F821
            return {"status": "setup_failed", "stderr": (e.stderr or "")[-1500:]}
        except Exception:  # noqa: BLE001
            return {"status": "setup_failed", "trace": traceback.format_exc()[-1500:]}

    # ---- health: is the worker up, repo cloned, weights cached? ----
    if action == "health":
        import torch
        hub = f"{HF_HOME}/hub"
        weights_cached = os.path.isdir(hub) and any("HiDream" in d for d in os.listdir(hub))
        return {
            "status": "ok",
            "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
            "repo_present": os.path.isdir(REPO_DIR),
            "setup_done": os.path.exists(READY),
            "weights_cached": weights_cached,
        }

    # ---- generate: text -> image ----
    import sys
    import traceback
    import uuid

    prompt = g.get("prompt")
    if not prompt:
        return {"error": "provide a 'prompt'"}

    def _ip(k, d):
        v = g.get(k); return int(v) if v not in (None, "") else d

    def _fp(k, d):
        v = g.get(k); return float(v) if v not in (None, "") else d

    height = _ip("height", 1024)
    width = _ip("width", 1024)

    # Reference images (editing / image-conditioned generation). Accept base64 or URLs,
    # single value or list. With exactly 1 ref the pipeline runs EDITING mode; >1 composes.
    def _as_list(v):
        if v in (None, ""):
            return []
        return v if isinstance(v, list) else [v]
    ref_b64s = _as_list(g.get("ref_image_b64"))
    ref_urls = _as_list(g.get("ref_image_url"))
    is_editing = (len(ref_b64s) + len(ref_urls)) == 1

    # inference.py dev branch:
    #   no ref  -> scheduler "flash" + noise params (text-to-image)
    #   1 ref   -> scheduler "flow_match" (editing); noise params unused
    #   timesteps_list = DEFAULT_TIMESTEPS, guidance 0.0, shift 1.0, 28 steps in all dev cases.
    # "default" under-denoises into grainy speckle — never use it for the dev model.
    num_inference_steps = _ip("num_inference_steps", 28)     # == len(DEFAULT_TIMESTEPS)
    guidance_scale = _fp("guidance_scale", 0.0)              # dev: CFG-free
    shift = _fp("shift", 1.0)                                # dev
    scheduler_name = g.get("scheduler_name") or ("flow_match" if is_editing else "flash")
    noise_scale_start = _fp("noise_scale_start", 7.5)        # dev defaults (flash scheduler only)
    noise_scale_end = _fp("noise_scale_end", 7.5)
    noise_clip_std = _fp("noise_clip_std", 2.5)
    keep_original_aspect = bool(g.get("keep_original_aspect", False))
    seed = _ip("seed", 32)

    timings = {}
    warm = None
    t_all = time.time()
    try:
        # ensure the vendored pipeline code is present, then make it importable
        if not os.path.exists(READY) or not os.path.isdir(REPO_DIR):
            _do_setup()
        if REPO_DIR not in sys.path:
            sys.path.insert(0, REPO_DIR)

        import torch
        from transformers import AutoProcessor
        from models.qwen3_vl_transformers import Qwen3VLForConditionalGeneration
        from models.pipeline import generate_image, DEFAULT_TIMESTEPS

        # Warm model/processor stashed on `sys` so they survive across requests on a warm worker.
        warm = getattr(sys, "_hidream_model", None) is not None
        if warm:
            model, processor = sys._hidream_model, sys._hidream_processor
            timings["load_s"] = 0.0
        else:
            t = time.time()
            processor = AutoProcessor.from_pretrained(MODEL_ID)
            model = Qwen3VLForConditionalGeneration.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.bfloat16,
                device_map="cuda",
                attn_implementation="sdpa",   # avoid requiring the flash-attn package
            ).eval()
            sys._hidream_model, sys._hidream_processor = model, processor
            timings["load_s"] = round(time.time() - t, 1)

        diag = {"gpu": torch.cuda.get_device_name(0)}

        # Materialize any reference images to files on the volume (generate_image takes paths).
        ref_dir = f"{VOL}/refs"
        os.makedirs(ref_dir, exist_ok=True)
        ref_image_paths = []
        for i, b64 in enumerate(ref_b64s):
            import base64 as _b64
            p = f"{ref_dir}/{uuid.uuid4().hex}_{i}.png"
            with open(p, "wb") as f:
                f.write(_b64.b64decode(b64))
            ref_image_paths.append(p)
        for i, url in enumerate(ref_urls):
            import requests
            p = f"{ref_dir}/{uuid.uuid4().hex}_u{i}.png"
            with open(p, "wb") as f:
                f.write(requests.get(url, timeout=120, headers={"User-Agent": "Mozilla/5.0"}).content)
            ref_image_paths.append(p)
        diag["num_ref_images"] = len(ref_image_paths)
        diag["mode"] = "editing" if is_editing else ("compose" if ref_image_paths else "text2image")

        t = time.time()
        image = generate_image(
            model=model,
            processor=processor,
            prompt=prompt,
            ref_image_paths=ref_image_paths or None,
            height=height,
            width=width,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            shift=shift,
            timesteps_list=DEFAULT_TIMESTEPS,   # dev: the distilled 28-step schedule
            scheduler_name=scheduler_name,      # text2image: "flash"; editing: "flow_match"
            noise_scale_start=noise_scale_start,
            noise_scale_end=noise_scale_end,
            noise_clip_std=noise_clip_std,
            keep_original_aspect=keep_original_aspect,
            seed=seed,
        )
        # unwrap any list/tuple nesting down to a single PIL image
        while isinstance(image, (list, tuple)):
            image = image[0]
        timings["gen_s"] = round(time.time() - t, 1)

        out_dir = f"{VOL}/outputs"
        os.makedirs(out_dir, exist_ok=True)
        out_path = f"{out_dir}/{uuid.uuid4().hex}.png"
        image.save(out_path, format="PNG")
        with open(out_path, "rb") as f:
            png_bytes = f.read()
    except Exception:  # noqa: BLE001
        return {"status": "generate_failed", "warm": warm, "timings": timings,
                "trace": traceback.format_exc()[-3000:], "seconds": round(time.time() - t_all, 1)}

    import base64

    return {
        "status": "ok",
        "volume_path": out_path,
        "size_mb": round(len(png_bytes) / 1e6, 2),
        "image_b64": base64.b64encode(png_bytes).decode(),
        "diag": diag,
        "prompt": prompt,
        "seed": seed,
        "params": {"height": height, "width": width, "num_inference_steps": num_inference_steps,
                   "guidance_scale": guidance_scale, "shift": shift, "scheduler_name": scheduler_name,
                   "noise_scale_start": noise_scale_start, "noise_scale_end": noise_scale_end,
                   "noise_clip_std": noise_clip_std},
        "warm": warm,
        "timings": timings,
        "seconds": round(time.time() - t_all, 1),
    }
