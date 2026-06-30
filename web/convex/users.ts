import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  getProfile,
  requireUserId,
  requireAdmin,
  STARTER_CREDITS,
  FREE_CREDITS,
  FREE_CREDITS_INTERVAL_MS,
} from "./lib";

// Current signed-in profile (null if not authed / no profile yet).
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await getProfile(ctx, userId);
    if (!profile) return null;
    const freeReady =
      !profile.lastFreeClaim ||
      Date.now() - profile.lastFreeClaim >= FREE_CREDITS_INTERVAL_MS;
    const nextFreeAt = profile.lastFreeClaim
      ? profile.lastFreeClaim + FREE_CREDITS_INTERVAL_MS
      : Date.now();
    return { ...profile, freeReady, nextFreeAt };
  },
});

// Lazily create the app profile on first authenticated load.
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await getProfile(ctx, userId);
    if (existing) return existing._id;
    const authUser = await ctx.db.get(userId);
    const email = (authUser as any)?.email as string | undefined;
    const name = (authUser as any)?.name as string | undefined;
    const isAdmin = !!email && email.toLowerCase().endsWith("@runpod.io");
    const displayName =
      name || (email ? email.split("@")[0] : `Runner-${userId.slice(-4)}`);
    return await ctx.db.insert("profiles", {
      authUserId: userId,
      displayName,
      isAdmin,
      credits: STARTER_CREDITS,
      createdAt: Date.now(),
    });
  },
});

export const setDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    const userId = await requireUserId(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new Error("No profile");
    await ctx.db.patch(profile._id, { displayName: displayName.slice(0, 40) });
  },
});

export const claimFreeCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new Error("No profile");
    const now = Date.now();
    if (
      profile.lastFreeClaim &&
      now - profile.lastFreeClaim < FREE_CREDITS_INTERVAL_MS
    ) {
      throw new Error("Free credits not ready yet");
    }
    await ctx.db.patch(profile._id, {
      credits: profile.credits + FREE_CREDITS,
      lastFreeClaim: now,
    });
    return profile.credits + FREE_CREDITS;
  },
});

// Demo/admin convenience: grant credits to self.
export const grantSelfCredits = mutation({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    const userId = await requireUserId(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new Error("No profile");
    await ctx.db.patch(profile._id, {
      credits: profile.credits + Math.max(0, Math.min(amount, 100000)),
    });
  },
});

// Make the current signed-in user an admin (dev convenience, @runpod.io only).
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const profile = await getProfile(ctx, userId);
    if (!profile) throw new Error("No profile");
    const authUser = await ctx.db.get(userId);
    const email = (authUser as any)?.email as string | undefined;
    if (email && email.toLowerCase().endsWith("@runpod.io")) {
      await ctx.db.patch(profile._id, { isAdmin: true });
      return true;
    }
    return false;
  },
});
