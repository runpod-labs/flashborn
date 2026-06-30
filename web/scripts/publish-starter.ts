/**
 * Publish the 20 starter cards using artwork picked from the faction concept
 * pools. Pool archetype indices 0..4 per faction correspond to the 5 starter
 * cards (same order as STARTER_SET), so we map starter card j -> pool candidate
 * with index j. These are provisional picks; the admin re-selects in The Forge.
 *
 * Run after the concept batch:  npx tsx scripts/publish-starter.ts
 */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { STARTER_SET, FACTIONS, type FactionId } from "@flashborn/shared";

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));

async function main() {
  const pools = (await client.query(api.dev.listPools, {})) as {
    _id: string;
    faction: FactionId;
  }[];
  const poolByFaction = new Map<FactionId, string>();
  for (const p of pools) if (!poolByFaction.has(p.faction)) poolByFaction.set(p.faction, p._id);

  let published = 0;
  for (const faction of FACTIONS) {
    const projectId = poolByFaction.get(faction);
    if (!projectId) {
      console.log(`! no pool for ${faction}`);
      continue;
    }
    const cands = (await client.query(api.dev.candidatesByProject, {
      projectId: projectId as any,
    })) as { _id: string; index: number; storageId?: string }[];
    const cards = STARTER_SET.filter((c) => c.faction === faction);
    for (let j = 0; j < cards.length; j++) {
      const card = cards[j];
      // pick candidate with matching archetype index, else any with art
      const cand =
        cands.find((c) => c.index === j && c.storageId) ||
        cands.find((c) => c.storageId);
      if (!cand?.storageId) {
        console.log(`! no candidate art for ${card.name}`);
        continue;
      }
      await client.mutation(api.dev.publishCard, {
        name: card.name,
        faction: card.faction,
        role: card.role,
        rarity: card.rarity,
        cost: card.cost,
        attack: card.attack,
        health: card.health,
        keyword: card.keyword,
        abilityText: card.abilityText,
        lore: (card as any).lore,
        artworkStorageId: cand.storageId as any,
      });
      published++;
      console.log(`  ✓ published ${card.name} (${card.rarity}) <- ${faction} #${cand.index}`);
    }
  }
  console.log(`DONE: published ${published} cards`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
