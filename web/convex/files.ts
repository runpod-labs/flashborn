import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Client/route uploads bytes directly to this URL, then passes the returned
// storageId back into a record mutation.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => await ctx.storage.getUrl(storageId),
});
