/**
 * Generate + publish ALL Flashborn card art at one consistent size (5:7).
 *
 * Catalog = the canon starter/extra sets (packages/shared) + the per-faction
 * design files in .scratch/catalog/<faction>.json. Every card gets premium
 * full-art generated at exactly ART_WIDTH x ART_HEIGHT and is published (upsert
 * by slug) with its tags + visual brief for concept de-duplication.
 *
 * Cards are ARTWORK-ONLY now — no 3D. 3D is reserved for site assets (logos).
 *
 * Resumable: a card already marked done in .scratch/cards/done.json is skipped
 * unless --force. De-dup: repeated concepts (same slug, or heavy tag overlap
 * within a faction vs already-published cards) are flagged and skipped.
 *
 * Run:
 *   npx tsx scripts/generate-all.ts                      # everything pending
 *   npx tsx scripts/generate-all.ts --faction ghostware  # one faction
 *   npx tsx scripts/generate-all.ts --only spark-rat,aegis-prime
 *   npx tsx scripts/generate-all.ts --limit 4            # first N (validation)
 *   npx tsx scripts/generate-all.ts --force              # re-generate done ones
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { STARTER_SET, EXTRA_CARDS } from "@flashborn/shared";
import { buildConceptPrompt, ART_WIDTH, ART_HEIGHT } from "../lib/prompt";
import sharp from "sharp";
import { Agent, setGlobalDispatcher } from "undici";

// HiDream can pay a cold start; lift fetch's header/body timeout ceiling.
setGlobalDispatcher(new Agent({ headersTimeout: 600_000, bodyTimeout: 600_000 }));

const FACTIONS = ["kernel_guard", "overclock_syndicate", "patchrunners", "ghostware"] as const;
const ROLES = ["striker", "guardian", "support", "disruptor"];
const RARITIES = ["common", "uncommon", "rare", "legendary"];
const KINDS = ["character", "item", "place"];
const KEYWORDS = ["guard", "shield", "rush", "stun", "spawn", "overclock"];

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const IMG = env("IMAGE_WORKER_URL");
const cardsDir = path.join(__dirname, "..", "..", ".scratch", "cards");
const catalogDir = path.join(__dirname, "..", "..", ".scratch", "catalog");
fs.mkdirSync(cardsDir, { recursive: true });
const donePath = path.join(cardsDir, "done.json");

type Card = {
  slug: string; name: string; kind?: string; faction: string; role: string; rarity: string;
  cost: number; attack: number; health: number; keyword?: string;
  abilityTitle?: string; abilityText?: string; lore?: string; visual: string; tags?: string[];
};

// Stable per-slug seed so reruns reproduce the same art (FNV-1a).
function seedFor(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2_000_000_000;
}

function loadDone(): Set<string> {
  try { return new Set(JSON.parse(fs.readFileSync(donePath, "utf8"))); } catch { return new Set(); }
}
function saveDone(done: Set<string>) {
  fs.writeFileSync(donePath, JSON.stringify([...done], null, 0));
}

function validate(c: Card, src: string): string | null {
  if (!c.slug || !c.name || !c.visual) return "missing slug/name/visual";
  if (!FACTIONS.includes(c.faction as any)) return `bad faction ${c.faction}`;
  if (!ROLES.includes(c.role)) return `bad role ${c.role}`;
  if (!RARITIES.includes(c.rarity)) return `bad rarity ${c.rarity}`;
  if (c.kind && !KINDS.includes(c.kind)) return `bad kind ${c.kind}`;
  if (c.keyword && !KEYWORDS.includes(c.keyword)) return `bad keyword ${c.keyword}`;
  return null;
}

function loadCatalog(): Card[] {
  const out: Card[] = [];
  const seen = new Set<string>();
  const add = (c: Card, src: string) => {
    const err = validate(c, src);
    if (err) { console.log(`  ⚠ skip ${c.slug || "?"} (${src}): ${err}`); return; }
    if (seen.has(c.slug)) { console.log(`  ⚠ dup slug ${c.slug} (${src}) — keeping first`); return; }
    seen.add(c.slug); out.push(c);
  };
  // Canon sets first (authoritative stats/abilities).
  for (const c of [...STARTER_SET, ...EXTRA_CARDS] as any[]) add(c as Card, "shared");
  // Per-faction design files.
  for (const f of FACTIONS) {
    const p = path.join(catalogDir, `${f}.json`);
    if (!fs.existsSync(p)) { console.log(`  ⚠ no catalog file for ${f}`); continue; }
    let arr: Card[];
    try { arr = JSON.parse(fs.readFileSync(p, "utf8")); }
    catch (e: any) { console.log(`  ✗ ${f}.json parse error: ${e.message}`); continue; }
    for (const c of arr) add({ ...c, faction: c.faction || f }, `${f}.json`);
  }
  return out;
}

async function genImage(prompt: string, seed: number): Promise<Buffer> {
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${IMG}/hidream_worker/runsync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: { input_data: { action: "generate", prompt, seed, width: ART_WIDTH, height: ART_HEIGHT } } }),
      });
      const o = ((await res.json()) as any).output;
      if (o?.status === "ok" && o.image_b64) return Buffer.from(o.image_b64, "base64");
      lastErr = JSON.stringify(o).slice(0, 200);
    } catch (e: any) { lastErr = e.message; }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  throw new Error(`img fail after retries: ${lastErr}`);
}

async function upload(bytes: Buffer, contentType: string): Promise<string> {
  const url = await client.mutation(api.files.generateUploadUrl, {});
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(bytes) });
  const { storageId } = (await r.json()) as { storageId: string };
  if (!storageId) throw new Error("no storageId");
  return storageId;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const force = has("force");
  const factionFilter = arg("faction");
  const only = arg("only")?.split(",").map((s) => s.trim());
  const limit = arg("limit") ? parseInt(arg("limit")!, 10) : undefined;

  console.log("Loading catalog…");
  let catalog = loadCatalog();
  console.log(`Catalog: ${catalog.length} cards (${FACTIONS.map((f) => `${f.split("_")[0]} ${catalog.filter((c) => c.faction === f).length}`).join(", ")})`);

  if (factionFilter) catalog = catalog.filter((c) => c.faction === factionFilter);
  if (only) catalog = catalog.filter((c) => only.includes(c.slug));

  // Concept de-dup vs already-published cards: heavy tag overlap within a faction.
  const published = (await client.query(api.dev.existingConcepts, {})) as any[];
  const pubByFaction: Record<string, { slug: string; tags: string[] }[]> = {};
  for (const p of published) (pubByFaction[p.faction] ??= []).push({ slug: p.slug, tags: p.tags || [] });

  const done = loadDone();
  let made = 0, skipped = 0, failed = 0, processed = 0;
  const acceptedTags: Record<string, { slug: string; tags: string[] }[]> = JSON.parse(JSON.stringify(pubByFaction));

  for (const card of catalog) {
    if (limit !== undefined && processed >= limit) break;
    processed++;
    if (!force && done.has(card.slug)) { skipped++; continue; }

    // De-dup: warn if this card's tags overlap heavily with an accepted concept.
    const tags = (card.tags || []).map((t) => t.toLowerCase());
    if (tags.length) {
      const peers = acceptedTags[card.faction] || [];
      const clash = peers.find((p) => p.slug !== card.slug && p.tags.filter((t) => tags.includes(t)).length >= 4);
      if (clash) console.log(`  ⚠ ${card.slug}: concept overlaps ${clash.slug} (4+ shared tags) — generating anyway, review later`);
    }

    const kind = (card.kind ?? "character") as any;
    const prompt = buildConceptPrompt({ faction: card.faction as any, role: card.role as any, rarity: card.rarity as any, kind, character: card.visual });
    const seed = seedFor(card.slug);
    try {
      const raw = await genImage(prompt, seed);
      // Force exact 5:7 resolution so every card is pixel-consistent.
      const png = await sharp(raw).resize(ART_WIDTH, ART_HEIGHT, { fit: "cover", position: "attention" }).png({ compressionLevel: 9 }).toBuffer();
      fs.writeFileSync(path.join(cardsDir, `${card.slug}.png`), png);
      const sid = await upload(png, "image/png");
      await client.mutation(api.dev.publishCard, {
        name: card.name,
        kind,
        faction: card.faction as any,
        role: card.role as any,
        rarity: card.rarity as any,
        cost: card.cost ?? 1,
        attack: kind === "character" ? (card.attack ?? 0) : 0,
        health: kind === "character" ? (card.health ?? 0) : 0,
        keyword: (card.keyword && KEYWORDS.includes(card.keyword) ? card.keyword : undefined) as any,
        abilityTitle: card.abilityTitle,
        abilityText: card.abilityText,
        lore: card.lore,
        artworkStorageId: sid as any,
        tags: card.tags,
        visualPrompt: card.visual,
      });
      (acceptedTags[card.faction] ??= []).push({ slug: card.slug, tags });
      done.add(card.slug); saveDone(done);
      made++;
      console.log(`  ✓ [${made}] ${card.faction.split("_")[0]}/${card.rarity}/${kind} ${card.name}`);
    } catch (e: any) {
      failed++;
      console.log(`  ✗ ${card.name} FAILED: ${e.message}`);
    }
  }
  console.log(`\nDone. made=${made} skipped=${skipped} failed=${failed} (catalog ${catalog.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
