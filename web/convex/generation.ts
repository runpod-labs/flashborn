import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { jobStatusV } from "./schema";
import { requireAdmin } from "./lib";

// ---------- image candidates ----------

export const addCandidate = mutation({
  args: {
    projectId: v.id("generationProjects"),
    storageId: v.id("_storage"),
    index: v.number(),
    promptUsed: v.string(),
    seed: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("imageCandidates", {
      ...args,
      selected: false,
      rejected: false,
      createdAt: Date.now(),
    });
  },
});

async function withUrl(ctx: any, row: any, idField = "storageId", urlField = "url") {
  if (row[idField]) return { ...row, [urlField]: await ctx.storage.getUrl(row[idField]) };
  return row;
}

export const listCandidates = query({
  args: { projectId: v.id("generationProjects") },
  handler: async (ctx, { projectId }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("imageCandidates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return await Promise.all(rows.map((r) => withUrl(ctx, r)));
  },
});

export const selectCandidate = mutation({
  args: { candidateId: v.id("imageCandidates") },
  handler: async (ctx, { candidateId }) => {
    await requireAdmin(ctx);
    const cand = await ctx.db.get(candidateId);
    if (!cand) throw new Error("No candidate");
    const siblings = await ctx.db
      .query("imageCandidates")
      .withIndex("by_project", (q) => q.eq("projectId", cand.projectId))
      .collect();
    for (const s of siblings) {
      if (s.selected) await ctx.db.patch(s._id, { selected: false });
    }
    await ctx.db.patch(candidateId, { selected: true, rejected: false });
    await ctx.db.patch(cand.projectId, {
      selectedCandidate: candidateId,
      stage: "concept_selected",
      updatedAt: Date.now(),
    });
  },
});

export const rejectCandidate = mutation({
  args: { candidateId: v.id("imageCandidates"), rejected: v.optional(v.boolean()) },
  handler: async (ctx, { candidateId, rejected }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(candidateId, { rejected: rejected ?? true, selected: false });
  },
});

// ---------- multiview sets ----------

export const createMultiviewSet = mutation({
  args: {
    projectId: v.id("generationProjects"),
    sourceCandidate: v.optional(v.id("imageCandidates")),
    status: jobStatusV,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.projectId, { stage: "multiview_generating", updatedAt: Date.now() });
    return await ctx.db.insert("multiviewSets", {
      projectId: args.projectId,
      sourceCandidate: args.sourceCandidate,
      status: args.status,
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
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireAdmin(ctx);
    const patch: any = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(id, patch);
    const set = await ctx.db.get(id);
    if (set && rest.status === "completed") {
      await ctx.db.patch(set.projectId, { stage: "multiview_ready", updatedAt: Date.now() });
    }
  },
});

export const listMultiview = query({
  args: { projectId: v.id("generationProjects") },
  handler: async (ctx, { projectId }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("multiviewSets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    return await Promise.all(
      rows.map(async (r) => ({
        ...r,
        frontUrl: r.frontStorageId ? await ctx.storage.getUrl(r.frontStorageId) : r.frontUrl,
        leftUrl: r.leftStorageId ? await ctx.storage.getUrl(r.leftStorageId) : r.leftUrl,
        rightUrl: r.rightStorageId ? await ctx.storage.getUrl(r.rightStorageId) : r.rightUrl,
        backUrl: r.backStorageId ? await ctx.storage.getUrl(r.backStorageId) : r.backUrl,
      })),
    );
  },
});

export const approveMultiview = mutation({
  args: { id: v.id("multiviewSets") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const set = await ctx.db.get(id);
    if (!set) throw new Error("No set");
    await ctx.db.patch(id, { approved: true });
    await ctx.db.patch(set.projectId, { selectedMultiview: id, updatedAt: Date.now() });
  },
});

// ---------- generated models ----------

export const createModel = mutation({
  args: {
    projectId: v.id("generationProjects"),
    multiviewSet: v.optional(v.id("multiviewSets")),
    status: jobStatusV,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.projectId, { stage: "model_generating", updatedAt: Date.now() });
    return await ctx.db.insert("generatedModels", {
      projectId: args.projectId,
      multiviewSet: args.multiviewSet,
      status: args.status,
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
    await requireAdmin(ctx);
    const patch: any = {};
    for (const [k, val] of Object.entries(rest)) if (val !== undefined) patch[k] = val;
    await ctx.db.patch(id, patch);
    const model = await ctx.db.get(id);
    if (model && rest.status === "completed") {
      await ctx.db.patch(model.projectId, { stage: "model_ready", updatedAt: Date.now() });
    }
  },
});

export const listModels = query({
  args: { projectId: v.id("generationProjects") },
  handler: async (ctx, { projectId }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("generatedModels")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    return await Promise.all(
      rows.map(async (r) => ({
        ...r,
        modelUrl: r.modelStorageId ? await ctx.storage.getUrl(r.modelStorageId) : r.modelUrl,
        previewUrl: r.previewStorageId ? await ctx.storage.getUrl(r.previewStorageId) : r.previewUrl,
      })),
    );
  },
});

export const approveModel = mutation({
  args: { id: v.id("generatedModels") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const model = await ctx.db.get(id);
    if (!model) throw new Error("No model");
    await ctx.db.patch(id, { approved: true });
    await ctx.db.patch(model.projectId, { selectedModel: id, updatedAt: Date.now() });
  },
});
