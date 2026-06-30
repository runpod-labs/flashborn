/**
 * Full pipeline for the showcase Legendaries: concept -> multiview (editing
 * mode) -> 3D model (Hunyuan3D) -> publish. Creates a dedicated generationProject
 * per legendary so The Forge shows 4 complete pipelines, and the published
 * legendary cards get an interactive GLB.
 *
 * Prereq: 3D worker build ready (status ready:true).
 * Run:  npx tsx scripts/legendary-3d.ts [slug-filter]
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { STARTER_SET, FACTION_DEFS } from "@flashborn/shared";
import { buildConceptPrompt, buildMultiviewPrompt } from "../lib/prompt";
import sharp from "sharp";

// Hunyuan3D MV doesn't need high input res (texture quality comes from the
// diffusion, not pixel count). Downscale each view so the 3 base64 images stay
// well under Flash's 10MB request limit (full-res 768x1024 PNGs blow past it).
async function shrinkB64(buf: Buffer): Promise<string> {
  const out = await sharp(buf).resize({ width: 512 }).png({ compressionLevel: 9 }).toBuffer();
  return out.toString("base64");
}

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const IMG = env("IMAGE_WORKER_URL");
const TD = env("THREED_WORKER_URL");
const scratch = path.join(__dirname, "..", "..", ".scratch", "legendary");
fs.mkdirSync(scratch, { recursive: true });

async function genImage(prompt: string, seed: number, refB64?: string): Promise<Buffer> {
  const input: any = { action: "generate", prompt, seed, width: 768, height: 1024 };
  if (refB64) input.ref_image_b64 = refB64;
  const res = await fetch(`${IMG}/hidream_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { input_data: input } }),
  });
  const o = ((await res.json()) as any).output;
  if (o?.status !== "ok" || !o.image_b64) throw new Error(`img fail: ${JSON.stringify(o).slice(0, 200)}`);
  return Buffer.from(o.image_b64, "base64");
}

async function infer3D(frontUrl: string, leftUrl: string, backUrl: string): Promise<Buffer> {
  // Pass Convex storage URLs; the worker downloads them (tiny request, full res,
  // no 10MB base64 cap).
  const res = await fetch(`${TD}/hunyuan3d_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: {
        input_data: {
          action: "infer",
          textured: true,
          octree_resolution: 256,
          num_inference_steps: 30,
          max_facenum: 40000,
          front_url: frontUrl,
          left_url: leftUrl,
          back_url: backUrl,
        },
      },
    }),
  });
  const o = ((await res.json()) as any).output;
  if (o?.status !== "ok" || !o.glb_url) throw new Error(`3d fail: ${JSON.stringify(o).slice(0, 300)}`);
  console.log(`    glb_url ${o.glb_url} (${JSON.stringify(o.timings)})`);
  const glb = await fetch(o.glb_url);
  return Buffer.from(await glb.arrayBuffer());
}

async function upload(bytes: Buffer, contentType: string): Promise<string> {
  const url = await client.mutation(api.files.generateUploadUrl, {});
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(bytes) });
  const { storageId } = (await r.json()) as { storageId: string };
  if (!storageId) throw new Error("no storageId");
  return storageId;
}

async function main() {
  const filter = process.argv[2];
  let legendaries = STARTER_SET.filter((c) => c.rarity === "legendary");
  if (filter) legendaries = legendaries.filter((c) => c.slug.includes(filter));
  console.log(`Legendary 3D pipeline for: ${legendaries.map((c) => c.name).join(", ")}`);

  for (const card of legendaries) {
    console.log(`\n=== ${card.name} (${card.faction}) ===`);
    try {
      const projectId = (await client.mutation(api.dev.createProject, {
        workingTitle: card.name,
        originalPrompt: card.visual,
        faction: card.faction,
        role: card.role,
        rarity: card.rarity,
      })) as string;

      // 1) concept
      const cPrompt = buildConceptPrompt({ faction: card.faction, role: card.role, rarity: card.rarity, character: card.visual });
      const conceptPng = await genImage(cPrompt, 4242);
      fs.writeFileSync(path.join(scratch, `${card.slug}_concept.png`), conceptPng);
      const conceptSid = await upload(conceptPng, "image/png");
      const candId = (await client.mutation(api.dev.addCandidate, {
        projectId: projectId as any, storageId: conceptSid as any, index: 0, promptUsed: cPrompt, seed: 4242,
      })) as string;
      await client.mutation(api.dev.selectCandidate, { candidateId: candId as any });
      console.log("  ✓ concept");

      // 2) multiview (editing mode, ref = concept)
      const refB64 = conceptPng.toString("base64");
      const setId = (await client.mutation(api.dev.createMultiviewSet, { projectId: projectId as any, sourceCandidate: candId as any })) as string;
      const views: Record<string, Buffer> = {};
      for (const v of ["front", "left", "right", "back"] as const) {
        views[v] = await genImage(buildMultiviewPrompt(v, card.faction), 7, refB64);
        fs.writeFileSync(path.join(scratch, `${card.slug}_${v}.png`), views[v]);
        console.log(`  ✓ view ${v}`);
      }
      const [fSid, lSid, rSid, bSid] = await Promise.all([
        upload(views.front, "image/png"), upload(views.left, "image/png"),
        upload(views.right, "image/png"), upload(views.back, "image/png"),
      ]);
      await client.mutation(api.dev.updateMultiviewSet, {
        id: setId as any, status: "completed", approved: true,
        frontStorageId: fSid as any, leftStorageId: lSid as any, rightStorageId: rSid as any, backStorageId: bSid as any,
      });

      // 3) 3D
      const modelId = (await client.mutation(api.dev.createModel, { projectId: projectId as any, multiviewSet: setId as any })) as string;
      const [fUrl, lUrl, bUrl] = await Promise.all([
        client.query(api.files.getUrl, { storageId: fSid as any }),
        client.query(api.files.getUrl, { storageId: lSid as any }),
        client.query(api.files.getUrl, { storageId: bSid as any }),
      ]);
      const glb = await infer3D(fUrl!, lUrl!, bUrl!);
      fs.writeFileSync(path.join(scratch, `${card.slug}.glb`), glb);
      const glbSid = await upload(glb, "model/gltf-binary");
      await client.mutation(api.dev.updateModel, { id: modelId as any, status: "completed", modelStorageId: glbSid as any });
      console.log(`  ✓ 3D model (${(glb.length / 1e6).toFixed(1)}MB)`);

      // 4) publish (pulls artwork + model from the project)
      await client.mutation(api.dev.publishCard, {
        projectId: projectId as any,
        name: card.name, faction: card.faction, role: card.role, rarity: card.rarity,
        cost: card.cost, attack: card.attack, health: card.health,
        keyword: card.keyword, abilityText: card.abilityText, lore: (card as any).lore,
      });
      console.log(`  ✓ PUBLISHED ${card.name} with 3D`);
    } catch (e: any) {
      console.log(`  ✗ ${card.name} FAILED: ${e.message}`);
    }
  }
  console.log("\nlegendary pipeline done");
}

main().catch((e) => { console.error(e); process.exit(1); });
