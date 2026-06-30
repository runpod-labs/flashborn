# Flashborn — 3D asset recipe (logos & emblems)

How to get a **clean** textured GLB out of the Hunyuan3D worker. This is for
**site assets** (Flashborn logo, faction emblems, trophies) — **not cards**.
Cards are artwork-only now.

> **The one rule that matters: it is the INPUT, not the settings.** The worker
> faithfully reconstructs whatever the views describe. Good views → good model.
> The settings below are already correct; don't tune them first — fix the views.

---

## 1. What reconstructs cleanly (design the asset for this)

Hunyuan3D-2mv wants a **solid, symmetric, connected, opaque** shape:

✅ **DO**
- A single compact object with real **thickness/volume** (a metal badge, a
  chunky emblem, a beveled medallion). Think "machined logo," not "neon wire."
- **Symmetry** front-to-back and left-to-right where possible.
- **Closed, connected** geometry — one solid mass.
- High contrast subject on a **plain** background (or pre-cut, see §3).
- Give every stroke **depth**: extrude letters/runes/icons so they're solid.

❌ **AVOID** (these melt or fragment)
- Thin floating parts, filaments, rings, halos, beams, sparks, glow clouds.
- Emissive haze that has no surface (the reconstructor can't find geometry).
- Asymmetric / dynamic poses; detached pieces.
- Dark-on-dark with no silhouette; fine text (HiDream garbles it anyway).
- Deep glowing inset grooves → these reconstruct as **separate shells** and
  inflate the `components` count (see §6).

**Proven example:** "Bulwark Core" (a chunky octagonal armored device) → 440k
confident raw faces, full PBR bake, **4.93 MB**, ~58s GPU. Clean. The legendary
*humanoids* (halos, beams, thin limbs) melted — same settings, bad input.

---

## 2. Input views

Generate **3 views of the exact same object**: `front`, `left`, `back`.
- ~**1024 px**, object centered, sharp, fully visible.
- Same design / colors / materials / proportions across all three (use the
  front as a reference image when generating left/back).
- Rigid symmetric objects tolerate approximate side/back views; characters do
  not (which is why characters stay 2D).

Pass them as **Convex storage URLs** (`front_url` / `left_url` / `back_url`) —
the worker downloads them, avoiding the ~10 MB base64 request cap. `*_b64` also
works for small images.

---

## 3. Background removal (critical for dark/hard-surface subjects)

- The worker auto-removes backgrounds (u2net / rembg) **only on opaque images**.
- For **dark, low-contrast, or hard-surface** subjects, pre-cut the subject to a
  **transparent RGBA** PNG yourself (e.g. fal **BiRefNet**) before sending.
  Otherwise the auto-matte clips the silhouette.

---

## 4. Worker contract

```
POST {THREED_WORKER_URL}/hunyuan3d_worker/runsync
Content-Type: application/json
{ "input": { "input_data": { ...params } } }
```

- **Run once per cold worker before the first infer:** `{"action":"build"}`.
  (Skip and `infer` fails — see workers/3d/HACKATHON.md.)
- Then `action: "infer"` with the params below.
- Response: `output.glb_url`, plus `output.components` and `output.timings`.

---

## 5. Settings

**Standard (fast, validated default):**
```json
{
  "action": "infer",
  "textured": true,
  "octree_resolution": 256,
  "num_inference_steps": 30,
  "max_facenum": 40000,
  "front_url": "…", "left_url": "…", "back_url": "…"
}
```

**Sharper (slower, for a hero logo):**
```json
{ "octree_resolution": 384, "num_inference_steps": 50, "max_facenum": 100000 }
```
- **Never exceed `max_facenum: 150000`.** Decimation ≤ the cap before texturing
  is non-negotiable (the worker enforces it; pymeshlab is patched).

---

## 6. Reading the result

- `timings.raw_faces` high (hundreds of k) before decimation = the model found a
  **confident surface** (good). Near-zero / tiny = the input was unreconstructable.
- `components` = number of disconnected shells. **Low is good** (ideally 1–~10).
  High (e.g. 83 on Bulwark Core) means glowing grooves / detached bits became
  their own shells — cosmetic for a display spin, but tighten by making the form
  more solid (shallower grooves, fewer floating accents).
- `glb_url` → download the GLB, upload to Convex storage, reference by URL.

---

## 7. Network gotcha

`runsync` holds the HTTP connection open for the **whole** GPU job. Cold start is
~113 s, so Node's default `fetch` header timeout (~300 s) can trip on a cold
worker → `UND_ERR_HEADERS_TIMEOUT`. Lift it:

```ts
import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ headersTimeout: 900_000, bodyTimeout: 900_000 }));
```

(Or warm the worker with a `build` call first.)

---

## TL;DR for the logo agent
Model the Flashborn logo / faction emblems as **solid, symmetric, extruded metal
badges** (depth on every stroke, no thin neon wires/halos). Render front/left/back
~1024px, pre-cut to transparent RGBA. Send `octree_resolution:384`,
`num_inference_steps:50`, `max_facenum:100000`, `textured:true`. Lift the fetch
timeout. Check `components` is low; if not, make the form more solid.
