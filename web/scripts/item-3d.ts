/**
 * OBJECT 3D proof: take a published *item* card's existing artwork, generate
 * object-consistent multiview (front/left/back), reconstruct a textured GLB via
 * Hunyuan3D, and attach it to the card so it's viewable in-app.
 *
 * The point: prove a compact, solid, symmetric OBJECT reconstructs far cleaner
 * than the legendary humanoids (halos/beams/thin limbs) that melt.
 *
 * Run:  npx tsx scripts/item-3d.ts [slug]   (default: bulwark-core)
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import sharp from "sharp";
import { Agent, setGlobalDispatcher } from "undici";

// The 3D worker holds the HTTP connection open for the whole GPU job (cold
// start ~113s + reconstruction). Node's default fetch gives up waiting for
// response headers after ~300s — lift that ceiling to 15 min.
setGlobalDispatcher(new Agent({ headersTimeout: 900_000, bodyTimeout: 900_000 }));

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const IMG = env("IMAGE_WORKER_URL");
const TD = env("THREED_WORKER_URL");
const scratch = path.join(__dirname, "..", "..", ".scratch", "obj3d");
fs.mkdirSync(scratch, { recursive: true });

// Object-specific multiview phrasing — NOT "the same character". Objects are
// rigid + symmetric, so even approximate side/back views stay consistent.
const VIEW: Record<string, string> = {
  front: "seen straight from the front",
  left: "rotated 90 degrees to show its left side",
  back: "rotated 180 degrees to show its back",
};
function objPrompt(view: string): string {
  return [
    `Product render of the exact same single object/device from the reference image, ${VIEW[view]}.`,
    `Identical design, colors, materials, and proportions. Single solid object, centered, fully visible.`,
    `Plain neutral seamless studio background, soft even studio lighting.`,
    `No characters, no people, no hands. Clean image, no text, no logos, no watermark.`,
  ].join(" ");
}

async function genImage(prompt: string, seed: number, refB64: string): Promise<Buffer> {
  const res = await fetch(`${IMG}/hidream_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { input_data: { action: "generate", prompt, seed, width: 768, height: 1024, ref_image_b64: refB64 } },
    }),
  });
  const o = ((await res.json()) as any).output;
  if (o?.status !== "ok" || !o.image_b64) throw new Error(`img fail: ${JSON.stringify(o).slice(0, 200)}`);
  return Buffer.from(o.image_b64, "base64");
}

async function infer3D(frontUrl: string, leftUrl: string, backUrl: string): Promise<{ glb: Buffer; out: any }> {
  const res = await fetch(`${TD}/hunyuan3d_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: {
        input_data: {
          action: "infer", textured: true,
          octree_resolution: 256, num_inference_steps: 30, max_facenum: 40000,
          front_url: frontUrl, left_url: leftUrl, back_url: backUrl,
        },
      },
    }),
  });
  const o = ((await res.json()) as any).output;
  if (o?.status !== "ok" || !o.glb_url) throw new Error(`3d fail: ${JSON.stringify(o).slice(0, 400)}`);
  const glb = await fetch(o.glb_url);
  return { glb: Buffer.from(await glb.arrayBuffer()), out: o };
}

async function upload(bytes: Buffer, contentType: string): Promise<string> {
  const url = await client.mutation(api.files.generateUploadUrl, {});
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(bytes) });
  const { storageId } = (await r.json()) as { storageId: string };
  if (!storageId) throw new Error("no storageId");
  return storageId;
}

async function main() {
  const slug = process.argv[2] || "bulwark-core";
  const cards = (await client.query(api.cards.listPublished, {})) as any[];
  const card = cards.find((c) => c.slug === slug);
  if (!card) throw new Error(`card ${slug} not found`);
  console.log(`=== OBJECT 3D: ${card.name} (${card.faction}) ===`);

  // 1) reference = existing artwork
  const artBuf = Buffer.from(await (await fetch(card.artworkUrl)).arrayBuffer());
  const refB64 = (await sharp(artBuf).resize({ width: 768 }).png({ compressionLevel: 9 }).toBuffer()).toString("base64");

  // 2) object multiview front/left/back — reuse PNGs already on disk so a
  // rerun (e.g. after a 3D timeout) doesn't re-spend on image generation.
  const sids: Record<string, string> = {};
  for (const v of ["front", "left", "back"] as const) {
    const file = path.join(scratch, `${slug}_${v}.png`);
    let png: Buffer;
    if (fs.existsSync(file)) {
      png = fs.readFileSync(file);
      console.log(`  • view ${v} (cached)`);
    } else {
      png = await genImage(objPrompt(v), 7, refB64);
      fs.writeFileSync(file, png);
      console.log(`  ✓ view ${v}`);
    }
    sids[v] = await upload(png, "image/png");
  }
  const [fUrl, lUrl, bUrl] = await Promise.all([
    client.query(api.files.getUrl, { storageId: sids.front as any }),
    client.query(api.files.getUrl, { storageId: sids.left as any }),
    client.query(api.files.getUrl, { storageId: sids.back as any }),
  ]);

  // 3) reconstruct
  const { glb, out } = await infer3D(fUrl!, lUrl!, bUrl!);
  fs.writeFileSync(path.join(scratch, `${slug}.glb`), glb);
  console.log(`  ✓ GLB ${(glb.length / 1e6).toFixed(2)}MB  components=${out.components}  timings=${JSON.stringify(out.timings)}`);

  // 4) attach to card
  const glbSid = await upload(glb, "model/gltf-binary");
  await client.mutation(api.dev.setCardModel, { cardId: card._id as any, modelStorageId: glbSid as any });
  console.log(`  ✓ attached to card  →  /c/${slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
