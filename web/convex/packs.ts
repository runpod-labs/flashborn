import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUserId, getProfile, PACK_COST } from "./lib";

type Rarity = "common" | "uncommon" | "rare" | "legendary";

function pick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollWildcard(): Rarity {
  const r = Math.random();
  if (r < 0.7) return "uncommon";
  if (r < 0.95) return "rare";
  return "legendary";
}

function genPublicId(): string {
  let s = "";
  for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 36).toString(36);
  return s;
}

export const openPack = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new Error("No profile");
    if (profile.credits < PACK_COST) throw new Error("Not enough credits");

    const published = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    if (published.length === 0) throw new Error("No published cards yet");

    const byRarity: Record<Rarity, Doc<"cardDefinitions">[]> = {
      common: [],
      uncommon: [],
      rare: [],
      legendary: [],
    };
    for (const c of published) byRarity[c.rarity as Rarity].push(c);

    // Graceful degrade: fall back to any published card if a tier is empty.
    const draw = (rarity: Rarity) => pick(byRarity[rarity].length ? byRarity[rarity] : published)!;

    const slots: { card: Doc<"cardDefinitions">; rarity: Rarity }[] = [];
    for (let i = 0; i < 3; i++) slots.push({ card: draw("common"), rarity: "common" });
    slots.push({ card: draw("uncommon"), rarity: "uncommon" });
    const wild = rollWildcard();
    slots.push({ card: draw(wild), rarity: wild });

    // Deduct credits + record opening.
    await ctx.db.patch(profile._id, { credits: profile.credits - PACK_COST });
    const cardIds = slots.map((s) => s.card._id);
    const openingId = await ctx.db.insert("packOpenings", {
      user: userId,
      cardsAwarded: cardIds,
      creditsSpent: PACK_COST,
      openedAt: Date.now(),
    });

    // Mint instances.
    const awarded = [];
    for (const slot of slots) {
      const prior = await ctx.db
        .query("ownedCards")
        .withIndex("by_card", (q) => q.eq("cardDefinition", slot.card._id))
        .collect();
      const serialNumber = prior.length + 1;
      const publicId = genPublicId();
      const ownedId = await ctx.db.insert("ownedCards", {
        owner: userId,
        cardDefinition: slot.card._id,
        serialNumber,
        source: "pack",
        packOpening: openingId,
        publicId,
        acquiredAt: Date.now(),
      });
      awarded.push({
        ownedId,
        publicId,
        serialNumber,
        cardId: slot.card._id,
        name: slot.card.name,
        faction: slot.card.faction,
        role: slot.card.role,
        rarity: slot.card.rarity,
        cost: slot.card.cost,
        attack: slot.card.attack,
        health: slot.card.health,
        keyword: slot.card.keyword,
        abilityText: slot.card.abilityText,
        artworkUrl: slot.card.artworkStorageId
          ? await ctx.storage.getUrl(slot.card.artworkStorageId)
          : slot.card.artworkUrl ?? null,
        modelUrl: slot.card.modelStorageId
          ? await ctx.storage.getUrl(slot.card.modelStorageId)
          : slot.card.modelUrl ?? null,
      });
    }
    return { openingId, creditsLeft: profile.credits - PACK_COST, cards: awarded };
  },
});

export const myOpenings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("packOpenings")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .order("desc")
      .collect();
  },
});
