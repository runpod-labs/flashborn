/**
 * Bulk concept generation: N images per faction -> Convex storage -> imageCandidates,
 * under one "concept pool" generationProject per faction. Uses the validated
 * prompt strategy (lib/prompt) and the local `flash dev` HiDream worker.
 *
 * Run:  npx tsx scripts/generate-concepts.ts [perFaction] [concurrency]
 *   IMAGE_WORKER_URL  default http://localhost:8892
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { FACTIONS, FACTION_DEFS, type FactionId } from "@flashborn/shared";
import { buildConceptPrompt } from "../lib/prompt";
import { ARCHETYPES } from "./archetypes";

const PER_FACTION = parseInt(process.argv[2] || "50", 10);
const CONCURRENCY = parseInt(process.argv[3] || "3", 10);
const WORKER = process.env.IMAGE_WORKER_URL || "http://localhost:8892";

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing in .env.local`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}

const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const scratch = path.join(__dirname, "..", "..", ".scratch", "pool");
fs.mkdirSync(scratch, { recursive: true });

async function genImage(prompt: string, seed: number): Promise<Buffer> {
  const res = await fetch(`${WORKER}/hidream_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { input_data: { action: "generate", prompt, seed, width: 768, height: 1024 } },
    }),
  });
  const data = (await res.json()) as any;
  const o = data.output ?? data;
  if (o?.status !== "ok" || !o.image_b64) {
    throw new Error(`gen failed: ${JSON.stringify(o).slice(0, 300)}`);
  }
  return Buffer.from(o.image_b64, "base64");
}

async function upload(png: Buffer): Promise<string> {
  const url = await client.mutation(api.files.generateUploadUrl, {});
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: new Uint8Array(png),
  });
  const { storageId } = (await r.json()) as { storageId: string };
  if (!storageId) throw new Error("upload returned no storageId");
  return storageId;
}

interface Job {
  faction: FactionId;
  projectId: string;
  index: number;
  prompt: string;
  seed: number;
  saveSample: boolean;
}

async function runJob(job: Job, attempt = 1): Promise<boolean> {
  try {
    const png = await genImage(job.prompt, job.seed);
    const storageId = await upload(png);
    await client.mutation(api.dev.addCandidate, {
      projectId: job.projectId as any,
      storageId: storageId as any,
      index: job.index,
      promptUsed: job.prompt,
      seed: job.seed,
    });
    if (job.saveSample) {
      fs.writeFileSync(path.join(scratch, `${job.faction}_${job.index}.png`), png);
    }
    console.log(`  ✓ ${job.faction} #${job.index} (seed ${job.seed})`);
    return true;
  } catch (e: any) {
    if (attempt < 3) {
      console.log(`  ↻ retry ${job.faction} #${job.index} (${e.message?.slice(0, 80)})`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return runJob(job, attempt + 1);
    }
    console.log(`  ✗ FAIL ${job.faction} #${job.index}: ${e.message?.slice(0, 120)}`);
    return false;
  }
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<any>) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log(`Generating ${PER_FACTION}/faction via ${WORKER} (concurrency ${CONCURRENCY})`);
  const jobs: Job[] = [];
  for (const faction of FACTIONS) {
    const projectId = await client.mutation(api.dev.createProject, {
      workingTitle: `${FACTION_DEFS[faction].name} — Concept Pool`,
      originalPrompt: `Bulk concept pool for ${FACTION_DEFS[faction].name}`,
      faction,
      role: ARCHETYPES[faction][0].role,
      rarity: "rare",
    });
    console.log(`project ${faction} -> ${projectId}`);
    const arts = ARCHETYPES[faction];
    for (let k = 0; k < PER_FACTION; k++) {
      const a = arts[k % arts.length];
      jobs.push({
        faction,
        projectId: projectId as string,
        index: k,
        prompt: buildConceptPrompt({ faction, role: a.role, rarity: a.rarity, character: a.character }),
        seed: 1000 + k * 7 + faction.length,
        saveSample: k < 2,
      });
    }
  }
  console.log(`total jobs: ${jobs.length}`);
  let done = 0,
    ok = 0;
  await pool(jobs, CONCURRENCY, async (j) => {
    const r = await runJob(j);
    done++;
    if (r) ok++;
    if (done % 10 === 0) console.log(`--- progress ${done}/${jobs.length} (${ok} ok) ---`);
  });
  console.log(`DONE: ${ok}/${jobs.length} succeeded`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
