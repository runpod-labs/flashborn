/**
 * Generate + publish the non-character cards (items & places) from EXTRA_CARDS.
 * Items are centered hero objects (portrait); places are wide establishing
 * shots (landscape). Concept art only — items can get 3D later via the same
 * multiview pipeline. Proves the platform handles more than characters.
 *
 * Run:  npx tsx scripts/extra-cards.ts [slug-filter]
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { EXTRA_CARDS } from "@flashborn/shared";
import { buildConceptPrompt } from "../lib/prompt";

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const IMG = env("IMAGE_WORKER_URL");
const scratch = path.join(__dirname, "..", "..", ".scratch", "extra");
fs.mkdirSync(scratch, { recursive: true });

async function genImage(prompt: string, seed: number, width: number, height: number): Promise<Buffer> {
  const res = await fetch(`${IMG}/hidream_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { input_data: { action: "generate", prompt, seed, width, height } } }),
  });
  const o = ((await res.json()) as any).output;
  if (o?.status !== "ok" || !o.image_b64) throw new Error(`img fail: ${JSON.stringify(o).slice(0, 200)}`);
  return Buffer.from(o.image_b64, "base64");
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
  let cards = EXTRA_CARDS;
  if (filter) cards = cards.filter((c) => c.slug.includes(filter));

  for (const card of cards) {
    const kind = card.kind ?? "character";
    const landscape = kind === "place";
    const [width, height] = landscape ? [1024, 768] : [768, 1024];
    const prompt = buildConceptPrompt({
      faction: card.faction,
      role: card.role,
      rarity: card.rarity,
      kind,
      character: card.visual,
    });
    // Stable per-slug seed so re-runs are reproducible.
    const seed = Math.abs([...card.slug].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7));
    console.log(`\n##### ${card.name} (${kind}, ${card.rarity}) #####`);
    console.log(`  prompt: ${prompt.slice(0, 120)}…`);

    const img = await genImage(prompt, seed, width, height);
    fs.writeFileSync(path.join(scratch, `${card.slug}.png`), img);
    const storageId = await upload(img, "image/png");

    await client.mutation(api.dev.publishCard, {
      name: card.name,
      kind,
      faction: card.faction,
      role: card.role,
      rarity: card.rarity,
      cost: card.cost,
      attack: card.attack,
      health: card.health,
      keyword: card.keyword,
      abilityTitle: card.abilityTitle,
      abilityText: card.abilityText,
      lore: card.lore,
      artworkStorageId: storageId as any,
    });
    console.log(`  ✓ PUBLISHED ${card.name}`);
  }
  console.log(`\nDONE: ${cards.length} card(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
