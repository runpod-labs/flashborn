# Image Worker — HiDream-O1 (Runpod Flash)

Self-contained **text → image** worker. Ported from the tested
`flash-hackathon` project. The single file `hidream_worker.py` vendors the
HiDream-O1-Image repo at runtime (clones it onto the volume) and keeps every
import/constant inside the function body — so nothing else needs to ship with
it. **Don't change the generation logic.**

| | |
|---|---|
| Worker file | `hidream_worker.py` (single queue-based `@Endpoint`) |
| Model | `HiDream-ai/HiDream-O1-Image-Dev-2604` (text-to-image, ~35GB, needs 80GB GPU) |
| Endpoint name | `flashborn-hidream-o1` |
| Volume | `flashborn-hidream-cache` (80GB, `US_CA_2`) — must match the volume datacenter |
| GPU | `[AMPERE_80, ADA_80_PRO]` (A100 first, H100 fallback) |
| Scaling | `workers=(0,5)` — ≥5 enables supply-based GPU auto-switch |

> **Renamed from the original** `hidream-o1` / `hidream-cache` so Flashborn gets
> its own endpoint + volume. The new cache re-downloads weights on first call.
> To reuse the original cache, revert the `name=` / `NetworkVolume(name=...)`.

## Iterate (recommended — runs on a real GPU)

```bash
cd workers/image
flash dev                          # local server; functions run on a remote GPU
# POST localhost:<port>/hidream_worker/runsync
#   {"input":{"input_data":{"action":"generate","prompt":"...","seed":7}}}
# first call cold-starts (~30s load from volume + ~6s gen), returns image_b64
```

## Deploy

```bash
flash deploy
```

> **Known deploy bug:** `flash deploy` workers can fail with *"invalid container
> name or ID: value is empty"* while `flash dev` works reliably. See
> `FLASH_DEPLOY_REPRO.md`. Prefer `flash dev` for development; if deploy stalls,
> that doc has the full diagnosis.

## Don't touch

Dev-model settings are already baked in: `scheduler_name="flash"`,
`DEFAULT_TIMESTEPS`, noise `7.5/7.5/2.5`. Changing them turns output to speckle.
