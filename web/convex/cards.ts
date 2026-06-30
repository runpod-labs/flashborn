import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { factionV, roleV, rarityV, keywordV, kindV } from "./schema";
import { requireAdmin } from "./lib";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveCardUrls(ctx: any, card: any) {
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

export const publishCard = mutation({
  args: {
    projectId: v.optional(v.id("generationProjects")),
    name: v.string(),
    kind: v.optional(kindV),
    faction: factionV,
    role: roleV,
    rarity: rarityV,
    cost: v.number(),
    attack: v.number(),
    health: v.number(),
    keyword: v.optional(keywordV),
    abilityTitle: v.optional(v.string()),
    abilityText: v.optional(v.string()),
    lore: v.optional(v.string()),
    artworkStorageId: v.optional(v.id("_storage")),
    modelStorageId: v.optional(v.id("_storage")),
    artworkUrl: v.optional(v.string()),
    modelUrl: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let artworkStorageId = args.artworkStorageId;
    let modelStorageId = args.modelStorageId;
    let modelUrl = args.modelUrl;

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project?.selectedCandidate && !artworkStorageId) {
        const cand = await ctx.db.get(project.selectedCandidate);
        if (cand?.storageId) artworkStorageId = cand.storageId;
      }
      if (project?.selectedModel && !modelStorageId && !modelUrl) {
        const model = await ctx.db.get(project.selectedModel);
        if (model?.modelStorageId) modelStorageId = model.modelStorageId;
        else if (model?.modelUrl) modelUrl = model.modelUrl;
      }
    }

    let slug = slugify(args.name);
    const existing = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    const fields = {
      projectId: args.projectId,
      name: args.name,
      slug,
      kind: args.kind ?? "character",
      faction: args.faction,
      role: args.role,
      rarity: args.rarity,
      cost: args.cost,
      attack: args.attack,
      health: args.health,
      keyword: args.keyword,
      abilityTitle: args.abilityTitle,
      abilityText: args.abilityText,
      lore: args.lore,
      artworkStorageId,
      modelStorageId,
      artworkUrl: args.artworkUrl,
      modelUrl,
      published: args.published ?? true,
    };

    let cardId;
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      cardId = existing._id;
    } else {
      cardId = await ctx.db.insert("cardDefinitions", { ...fields, createdAt: Date.now() });
    }
    if (args.projectId) {
      await ctx.db.patch(args.projectId, {
        stage: "published",
        cardDefinition: cardId,
        updatedAt: Date.now(),
      });
    }
    return cardId;
  },
});

export const togglePublish = mutation({
  args: { id: v.id("cardDefinitions"), published: v.boolean() },
  handler: async (ctx, { id, published }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { published });
  },
});

// ---------- public reads (no auth) ----------

export const listPublished = query({
  args: { faction: v.optional(factionV), rarity: v.optional(rarityV), role: v.optional(roleV) },
  handler: async (ctx, { faction, rarity, role }) => {
    let rows = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    if (faction) rows = rows.filter((r) => r.faction === faction);
    if (rarity) rows = rows.filter((r) => r.rarity === rarity);
    if (role) rows = rows.filter((r) => r.role === role);
    return await Promise.all(rows.map((r) => resolveCardUrls(ctx, r)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const card = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return card ? await resolveCardUrls(ctx, card) : null;
  },
});

export const getById = query({
  args: { id: v.id("cardDefinitions") },
  handler: async (ctx, { id }) => {
    const card = await ctx.db.get(id);
    return card ? await resolveCardUrls(ctx, card) : null;
  },
});

// ---------- admin ----------

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("cardDefinitions").order("desc").collect();
    return await Promise.all(rows.map((r) => resolveCardUrls(ctx, r)));
  },
});
