import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function getProfile(ctx: QueryCtx | MutationCtx, authUserId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_authUser", (q) => q.eq("authUserId", authUserId as any))
    .unique();
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await requireUserId(ctx);
  const profile = await getProfile(ctx, userId);
  if (!profile?.isAdmin) throw new Error("Admin only");
  return { userId, profile };
}

export const STARTER_CREDITS = 300;
export const PACK_COST = 100;
export const FREE_CREDITS = 100;
export const FREE_CREDITS_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
