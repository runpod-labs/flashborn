# Bug report: `flash deploy` endpoint workers fail to start — "invalid container name or ID: value is empty"

## Summary
Every endpoint created with **`flash deploy`** provisions successfully (app/env/endpoint are
created and a `/runsync` URL is returned), but its **workers never start**. The worker log
loops on:

```
start container for runpod/flash:py3.12-latest: begin
error starting container: invalid container name or ID: value is empty
```

Because no worker ever comes up, every submitted job stays in `IN_QUEUE` and is never
dispatched. This reproduced on **every** `flash deploy`, including brand-new endpoints after a
full `flash undeploy` + redeploy.

The **same worker image (`runpod/flash:py3.12-latest`) runs fine when launched via
`flash dev`** (the "live" endpoint path) with the identical code — so the image and the handler
are not the problem. Something about the endpoint/template that `flash deploy` creates makes
Runpod try to start a container with an empty name/ID.

## Versions
- `runpod-flash` (flash CLI) **v1.17.0**
- `runpodctl` **v2.0.0-beta.1**
- Worker image: `runpod/flash:py3.12-latest`
- Host: macOS arm64

## Steps to reproduce
```bash
flash init repro-deploy && cd repro-deploy
rm -f gpu_worker.py cpu_worker.py lb_worker.py
cat > worker.py <<'EOF'
from runpod_flash import Endpoint, GpuGroup, NetworkVolume, DataCenter

@Endpoint(
    name="repro-ep",
    gpu=GpuGroup.ADA_80_PRO,
    workers=(0, 2),
    flashboot=False,                                  # see note: deploy still sets FLASHBOOT
    datacenter=DataCenter.US_CA_2,
    volume=NetworkVolume(name="repro-vol", size=10, datacenter=DataCenter.US_CA_2),
)
async def repro(input_data: dict) -> dict:
    return {"ok": True, "echo": input_data}
EOF

flash deploy            # succeeds; prints https://api.runpod.ai/v2/<EP>/runsync
```
Submit a job, then check the worker logs in the Runpod console for the container error:
```bash
EP=<endpoint_id>
curl -s -X POST https://api.runpod.ai/v2/$EP/run \
  -H "Authorization: Bearer $RUNPOD_API_KEY" -H "Content-Type: application/json" \
  -d '{"input":{"input_data":{"x":1}}}'
curl -s https://api.runpod.ai/v2/$EP/health -H "Authorization: Bearer $RUNPOD_API_KEY"
# health shows workers churning (running) but never serving; console worker log shows:
#   error starting container: invalid container name or ID: value is empty
```

## Expected vs actual
- **Expected:** `flash deploy` produces a working serverless endpoint whose workers start and
  process jobs (same as the `flash dev` live endpoint does with the same code/image).
- **Actual:** workers never start; container launch fails with
  `invalid container name or ID: value is empty`; jobs never leave `IN_QUEUE`.

## Key evidence: deploy endpoint vs working `flash dev` endpoint
Identical worker code. Pulled both via GraphQL and diffed every field. The deploy-created
endpoint differs from the working `flash dev` ("live") endpoint only in:

| field | `flash dev` (works) | `flash deploy` (broken) | notes |
|---|---|---|---|
| `flashBootType` | `OFF` | `FLASHBOOT` | deploy forces FlashBoot ON even though `flashboot=False` was set in the decorator; it does not appear in `.flash/flash_manifest.json` |
| `template.containerRegistryAuthId` | `''` (empty string) | `null` | **candidate cause** — a null vs empty container-registry auth id is a plausible source of an empty container reference at launch |
| `template.env` | base | base + `FLASH_APP`, `FLASH_ENV`, `FLASH_RESOURCE_NAME`, `_FLASH_SOURCE_FINGERPRINT` | metadata |
| `scalerValue`, `aiKey`, `id`/`name`/`templateId`, `createdAt` | — | — | incidental/identity |

Everything else identical: image `runpod/flash:py3.12-latest`, `gpuIds`, `locations`,
`containerDiskInGb=64`, `workers=(0,2)`, same `networkVolumeId`.

**Two candidate leads for the Flash team** (not confirmed — for you to judge):
1. `template.containerRegistryAuthId = null` on deploy (vs `''` on the working live endpoint) —
   could be what surfaces as the empty container name/ID at launch.
2. `flash deploy` not honoring `flashboot=False` (creates `FLASHBOOT`; not serialized in the
   manifest).

## Notes / environment quirks encountered
- `runpodctl serverless get`/`list` **cannot read any endpoint that has a network volume**:
  `failed to parse response: json: cannot unmarshal string into Go struct field
  Endpoint.networkVolumeIds`. (runpodctl v2.0.0-beta.1 bug — blocks CLI introspection.)
- Runpod GraphQL (`api.runpod.io/graphql?api_key=...`) returns **403 / Cloudflare 1010**
  unless a browser `User-Agent` header is sent; schema introspection (`__type`) is disabled.
- `flash deploy --preview` cannot run on Apple Silicon: `runpod/flash:py3.12-latest` has
  **no linux/arm64 manifest** (`no matching manifest for linux/arm64/v8`).
- `flash undeploy <name>` **requires `--force`** in a non-TTY shell — without it the confirm
  prompt crashes with `OSError: [Errno 22] Invalid argument` / `KeyError: '0 is not registered'`.

## Separate, unrelated issue (not the deploy bug)
Independently, a `flash dev` live endpoint pinned to `gpu=ADA_80_PRO` + `US-CA-2` stalled
because H100 stock in US-CA-2 dropped to "Low" (worker log: `no gpu availability for gpu type
ADA_80_PRO in selected locations (US-CA-2)`). That is a capacity issue, fixed by allowing a GPU
fallback list (`gpu=[GpuGroup.ADA_80_PRO, GpuGroup.AMPERE_80]`). **This is NOT the deploy bug
above** — the deploy bug is the container-start failure and is independent of GPU stock.

## Read full endpoint/template config via GraphQL (needs User-Agent)
```bash
APIKEY=$(grep -o "rpa_[A-Za-z0-9]*" ~/.runpod/config.toml | head -1)
curl -s "https://api.runpod.io/graphql?api_key=$APIKEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36" \
  -d '{"query":"{ myself { endpoints { id name flashBootType template { imageName containerRegistryAuthId } } } }"}'
```
