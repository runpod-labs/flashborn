# 3D Worker — Hunyuan3D-2 (Runpod Flash)

Self-hosted **image → textured 3D (.glb)** worker. Ported from the tested
`hunyuan3d` project. **Read `HACKATHON.md` first** — it has the full call
contract, performance numbers, and the 3 root-cause gotchas. Use the `flash`
CLI for all lifecycle ops, never the raw Runpod API.

| | |
|---|---|
| Worker file | `hunyuan3d_worker.py` (single queue-based `@Endpoint`) |
| Model | Hunyuan3D-2 **MV** (shape) + **Paint** (texture), self-hosted |
| Endpoint name | `flashborn-hunyuan3d` |
| Volume | `flashborn-hunyuan3d-vol` (100GB) — venv + repo + weights, persists across redeploys |
| GPU | A100 80GB (`GpuGroup.AMPERE_80`) |
| Scaling | `workers=(0,1)` — scales to zero when idle; ~113s cold start |

> **Renamed from the original** `hunyuan3d` / `hunyuan3d-vol` so Flashborn gets
> its own endpoint + volume. Because the volume name is new, the one-time build
> (below) runs fresh. To instead reuse the already-built original volume, revert
> the `name=` / `NetworkVolume(name=...)` in `hunyuan3d_worker.py`.

## Stand it up

```bash
cd workers/3d
flash deploy                       # prints the endpoint id -> save to endpoint_id.txt

# one-time build (worker won't infer until built; ~15-20 min):
#   call the endpoint with {"input":{"input_data":{"action":"build"}}}
#   then poll {"action":"status"} until ready:true
```

## Call contract (summary — see HACKATHON.md §2)

Action `infer`, inputs are base64 PNGs (`front_b64` required; `back_b64` /
`left_b64` optional, improve quality). Returns `{ status, glb_url, timings }`.
First infer also downloads model weights, so it is slower than warm (~30s).

Local dev route: `POST localhost:<port>/hunyuan3d_worker/runsync`.

## Gotchas (full detail in HACKATHON.md §4)

1. Decimate to ≤40k faces before texturing — non-negotiable (CUDA rasterizer deadlock otherwise).
2. `pymeshlab` is broken here — worker monkeypatches Hunyuan's post-processors with trimesh.
3. `flash deploy` does not swap code on a running `(1,1)` worker — use `flash undeploy` + `flash deploy`.
