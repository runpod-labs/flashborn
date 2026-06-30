import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId, getProfile } from "./lib";

async function cardWithUrls(ctx: any, card: any) {
  return {
    ...card,
    artworkUrl: card.artworkStorageId
      ? await ctx.storage.getUrl(card.artworkStorageId)
      : card.artworkUrl ?? null,
    modelUrl: card.modelStorageId
      ? await ctx.storage.getUrl(card.modelStorageId)
      : card.modelUrl ?? null,
  };
}

// Owned cards grouped by definition, with counts.
export const myCollection = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const owned = await ctx.db
      .query("ownedCards")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();
    const byCard = new Map<string, { count: number; latest: any }>();
    for (const o of owned) {
      const key = o.cardDefinition;
      const entry = byCard.get(key) ?? { count: 0, latest: o };
      entry.count += 1;
      if (o.acquiredAt >= entry.latest.acquiredAt) entry.latest = o;
      byCard.set(key, entry);
    }
    const out = [];
    for (const [cardId, { count, latest }] of byCard) {
      const card = await ctx.db.get(cardId as any);
      if (!card) continue;
      out.push({
        card: await cardWithUrls(ctx, card),
        count,
        publicId: latest.publicId,
        ownedId: latest._id,
        serialNumber: latest.serialNumber,
      });
    }
    return out;
  },
});

export const collectionProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const owned = await ctx.db
      .query("ownedCards")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();
    const distinct = new Set(owned.map((o) => o.cardDefinition)).size;
    const published = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    return { owned: distinct, total: published.length, instances: owned.length };
  },
});

export const myInstances = query({
  args: { cardDefinition: v.id("cardDefinitions") },
  handler: async (ctx, { cardDefinition }) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("ownedCards")
      .withIndex("by_owner_card", (q) =>
        q.eq("owner", userId).eq("cardDefinition", cardDefinition),
      )
      .collect();
    return rows.map((r) => ({
      ownedId: r._id,
      publicId: r.publicId,
      serialNumber: r.serialNumber,
      acquiredAt: r.acquiredAt,
      source: r.source,
    }));
  },
});

// PUBLIC — no auth. Powers /card/{publicId}.
export const ownedByPublicId = query({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    const owned = await ctx.db
      .query("ownedCards")
      .withIndex("by_publicId", (q) => q.eq("publicId", publicId))
      .first();
    if (!owned) return null;
    const card = await ctx.db.get(owned.cardDefinition);
    if (!card) return null;
    const ownerProfile = await getProfile(ctx, owned.owner);
    return {
      card: await cardWithUrls(ctx, card),
      serialNumber: owned.serialNumber,
      acquiredAt: owned.acquiredAt,
      source: owned.source,
      ownerName: ownerProfile?.displayName ?? "Unknown Runner",
    };
  },
});
