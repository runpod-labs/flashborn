// DEV-ONLY mutations: no auth checks, for the local terminal generation/seed
// pipeline (bulk concept generation, legendary 3D pipeline, bulk publish).
// The browser Forge uses the authenticated mutations in projects/generation/cards.
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { factionV, roleV, rarityV, keywordV, kindV, jobStatusV } from "./schema";

export const listPools = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("generationProjects").collect();
    return projects
      .filter((p) => p.workingTitle.includes("Concept Pool"))
      .map((p) => ({ _id: p._id, faction: p.faction, title: p.workingTitle }));
  },
});

export const candidatesByProject = query({
  args: { projectId: v.id("generationProjects") },
  handler: async (ctx, { projectId }) => {
    const rows = await ctx.db
      .query("imageCandidates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return rows.map((r) => ({ _id: r._id, index: r.index, storageId: r.storageId, seed: r.seed }));
  },
});

export const listProjectsBasic = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("generationProjects").order("desc").collect();
    return projects.map((p) => ({
      _id: p._id,
      title: p.workingTitle,
      faction: p.faction,
      stage: p.stage,
      selectedCandidate: p.selectedCandidate,
      selectedMultiview: p.selectedMultiview,
      selectedModel: p.selectedModel,
    }));
  },
});

// Dump every asset URL in the generation chain for a character, by name
// substring (case-insensitive). Shows the multiview images fed into the 3D
// worker and the resulting GLB so you can inspect quality. Auth-free (CLI use).
export const dumpAssets = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const needle = name.toLowerCase();
    const url = async (id?: any) => (id ? await ctx.storage.getUrl(id) : null);

    const projects = (await ctx.db.query("generationProjects").collect()).filter((p) =>
      p.workingTitle.toLowerCase().includes(needle),
    );

    const out = [];
    for (const p of projects) {
      // selected concept (falls back to first candidate)
      let candId = p.selectedCandidate;
      if (!candId) {
        const first = await ctx.db
          .query("imageCandidates")
          .withIndex("by_project", (q) => q.eq("projectId", p._id))
          .first();
        candId = first?._id;
      }
      const cand = candId ? await ctx.db.get(candId) : null;

      // multiview set (selected, else latest)
      let mv = p.selectedMultiview ? await ctx.db.get(p.selectedMultiview) : null;
      if (!mv) {
        mv = await ctx.db
          .query("multiviewSets")
          .withIndex("by_project", (q) => q.eq("projectId", p._id))
          .order("desc")
          .first();
      }

      // model (selected, else latest)
      let model = p.selectedModel ? await ctx.db.get(p.selectedModel) : null;
      if (!model) {
        model = await ctx.db
          .query("generatedModels")
          .withIndex("by_project", (q) => q.eq("projectId", p._id))
          .order("desc")
          .first();
      }

      out.push({
        project: p.workingTitle,
        projectId: p._id,
        stage: p.stage,
        concept: cand ? { url: await url(cand.storageId), seed: cand.seed } : null,
        multiview: mv
          ? {
              status: mv.status,
              front: await url(mv.frontStorageId),
              left: await url(mv.leftStorageId),
              right: await url(mv.rightStorageId),
              back: await url(mv.backStorageId),
              metadata: mv.metadata,
            }
          : null,
        model: model
          ? {
              status: model.status,
              glb: model.modelStorageId ? await url(model.modelStorageId) : model.modelUrl,
              preview: await url(model.previewStorageId),
              metadata: model.metadata,
            }
          : null,
      });
    }
    return out;
  },
});

// Attach a generated GLB to an existing published card (for the 3D object test).
export const setCardModel = mutation({
  args: { cardId: v.id("cardDefinitions"), modelStorageId: v.id("_storage") },
  handler: async (ctx, { cardId, modelStorageId }) => {
    await ctx.db.patch(cardId, { modelStorageId });
    return "ok";
  },
});

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const clearAllGenerationData = mutation({
  args: {},
  handler: async (ctx) => {
    for (const t of ["imageCandidates", "multiviewSets", "generatedModels", "generationProjects"] as const) {
      for (const row of await ctx.db.query(t).collect()) await ctx.db.delete(row._id);
    }
    return "cleared";
  },
});

export const createProject = mutation({
  args: {
    workingTitle: v.string(),
    originalPrompt: v.string(),
    extraInstructions: v.optional(v.string()),
    faction: factionV,
    role: roleV,
    rarity: rarityV,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("generationProjects", {
      ...args,
      stage: "concepts_ready",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addCandidate = mutation({
  args: {
    projectId: v.id("generationProjects"),
    storageId: v.id("_storage"),
    index: v.number(),
    promptUsed: v.string(),
    seed: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("imageCandidates", {
      ...args,
      selected: false,
      rejected: false,
      createdAt: Date.now(),
    }),
});

export const selectCandidate = mutation({
  args: { candidateId: v.id("imageCandidates") },
  handler: async (ctx, { candidateId }) => {
    const cand = await ctx.db.get(candidateId);
    if (!cand) throw new Error("no candidate");
    await ctx.db.patch(candidateId, { selected: true });
    await ctx.db.patch(cand.projectId, {
      selectedCandidate: candidateId,
      stage: "concept_selected",
      updatedAt: Date.now(),
    });
  },
});

export const createMultiviewSet = mutation({
  args: { projectId: v.id("generationProjects"), sourceCandidate: v.optional(v.id("imageCandidates")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { stage: "multiview_generating", updatedAt: Date.now() });
    return await ctx.db.insert("multiviewSets", {
      projectId: args.projectId,
      sourceCandidate: args.sourceCandidate,
      status: "running",
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const updateMultiviewSet = mutation({
  args: {
    id: v.id("multiviewSets"),
    status: v.optional(jobStatusV),
    frontStorageId: v.optional(v.id("_storage")),
    leftStorageId: v.optional(v.id("_storage")),
    rightStorageId: v.optional(v.id("_storage")),
    backStorageId: v.optional(v.id("_storage")),
    error: v.optional(v.string()),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch: any = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(id, patch);
    const set = await ctx.db.get(id);
    if (set && rest.status === "completed") {
      await ctx.db.patch(set.projectId, {
        stage: "multiview_ready",
        selectedMultiview: id,
        updatedAt: Date.now(),
      });
    }
  },
});

export const createModel = mutation({
  args: { projectId: v.id("generationProjects"), multiviewSet: v.optional(v.id("multiviewSets")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, { stage: "model_generating", updatedAt: Date.now() });
    return await ctx.db.insert("generatedModels", {
      projectId: args.projectId,
      multiviewSet: args.multiviewSet,
      status: "running",
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const updateModel = mutation({
  args: {
    id: v.id("generatedModels"),
    status: v.optional(jobStatusV),
    modelStorageId: v.optional(v.id("_storage")),
    modelUrl: v.optional(v.string()),
    previewStorageId: v.optional(v.id("_storage")),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...rest }) => {
    const patch: any = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(id, patch);
    const model = await ctx.db.get(id);
    if (model && rest.status === "completed") {
      await ctx.db.patch(model.projectId, {
        stage: "model_ready",
        selectedModel: id,
        updatedAt: Date.now(),
      });
    }
  },
});

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
    modelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let { artworkStorageId, modelStorageId, modelUrl } = args;
    if (args.projectId) {
      const p = await ctx.db.get(args.projectId);
      if (p?.selectedCandidate && !artworkStorageId) {
        const c = await ctx.db.get(p.selectedCandidate);
        if (c?.storageId) artworkStorageId = c.storageId;
      }
      if (p?.selectedModel && !modelStorageId && !modelUrl) {
        const m = await ctx.db.get(p.selectedModel);
        if (m?.modelStorageId) modelStorageId = m.modelStorageId;
        else if (m?.modelUrl) modelUrl = m.modelUrl;
      }
    }
    const slug = slugify(args.name);
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
      modelUrl,
      published: true,
    };
    let id;
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      id = existing._id;
    } else {
      id = await ctx.db.insert("cardDefinitions", { ...fields, createdAt: Date.now() });
    }
    if (args.projectId) {
      await ctx.db.patch(args.projectId, { stage: "published", cardDefinition: id, updatedAt: Date.now() });
    }
    return id;
  },
});
