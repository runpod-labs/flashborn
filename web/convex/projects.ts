import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { factionV, roleV, rarityV, stageV } from "./schema";
import { requireAdmin } from "./lib";

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
    const { userId } = await requireAdmin(ctx);
    const now = Date.now();
    return await ctx.db.insert("generationProjects", {
      ...args,
      stage: "draft",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

async function thumbFor(ctx: any, projectId: Id<"generationProjects">) {
  const project = await ctx.db.get(projectId);
  let candId = project?.selectedCandidate;
  if (!candId) {
    const first = await ctx.db
      .query("imageCandidates")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .first();
    candId = first?._id;
  }
  if (!candId) return null;
  const cand = await ctx.db.get(candId);
  if (cand?.storageId) return await ctx.storage.getUrl(cand.storageId);
  return cand?.url ?? null;
}

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const projects = await ctx.db.query("generationProjects").order("desc").collect();
    return await Promise.all(
      projects.map(async (p) => ({ ...p, thumbnailUrl: await thumbFor(ctx, p._id) })),
    );
  },
});

export const getProject = query({
  args: { id: v.id("generationProjects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const project = await ctx.db.get(id);
    if (!project) return null;
    return project;
  },
});

export const setStage = mutation({
  args: { id: v.id("generationProjects"), stage: stageV, error: v.optional(v.string()) },
  handler: async (ctx, { id, stage, error }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { stage, error: error ?? undefined, updatedAt: Date.now() });
  },
});

export const updateMeta = mutation({
  args: {
    id: v.id("generationProjects"),
    workingTitle: v.optional(v.string()),
    faction: v.optional(factionV),
    role: v.optional(roleV),
    rarity: v.optional(rarityV),
    extraInstructions: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireAdmin(ctx);
    const patch: any = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("generationProjects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    for (const table of ["imageCandidates", "multiviewSets", "generatedModels"] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }
    await ctx.db.delete(id);
  },
});
