import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// ---- shared enums (mirror packages/shared) ----
export const factionV = v.union(
  v.literal("kernel_guard"),
  v.literal("overclock_syndicate"),
  v.literal("patchrunners"),
  v.literal("ghostware"),
);
export const roleV = v.union(
  v.literal("striker"),
  v.literal("guardian"),
  v.literal("support"),
  v.literal("disruptor"),
);
export const rarityV = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("legendary"),
);
export const keywordV = v.union(
  v.literal("guard"),
  v.literal("shield"),
  v.literal("rush"),
  v.literal("stun"),
  v.literal("spawn"),
  v.literal("overclock"),
);
export const stageV = v.union(
  v.literal("draft"),
  v.literal("concept_generating"),
  v.literal("concepts_ready"),
  v.literal("concept_selected"),
  v.literal("multiview_generating"),
  v.literal("multiview_ready"),
  v.literal("model_generating"),
  v.literal("model_ready"),
  v.literal("card_configured"),
  v.literal("published"),
  v.literal("failed"),
);
export const jobStatusV = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);
export const sourceV = v.union(
  v.literal("pack"),
  v.literal("starter"),
  v.literal("admin_grant"),
);

export default defineSchema({
  // Convex Auth tables (users, authAccounts, authSessions, ...)
  ...authTables,

  // App-level user profile (1:1 with authTables `users` via authUserId).
  profiles: defineTable({
    authUserId: v.id("users"),
    displayName: v.string(),
    isAdmin: v.boolean(),
    credits: v.number(),
    lastFreeClaim: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_authUser", ["authUserId"]),

  // One character moving through The Forge.
  generationProjects: defineTable({
    workingTitle: v.string(),
    originalPrompt: v.string(),
    extraInstructions: v.optional(v.string()),
    faction: factionV,
    role: roleV,
    rarity: rarityV,
    stage: stageV,
    error: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    selectedCandidate: v.optional(v.id("imageCandidates")),
    selectedMultiview: v.optional(v.id("multiviewSets")),
    selectedModel: v.optional(v.id("generatedModels")),
    cardDefinition: v.optional(v.id("cardDefinitions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_stage", ["stage"])
    .index("by_faction", ["faction"]),

  imageCandidates: defineTable({
    projectId: v.id("generationProjects"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    index: v.number(),
    selected: v.boolean(),
    rejected: v.boolean(),
    promptUsed: v.string(),
    seed: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  multiviewSets: defineTable({
    projectId: v.id("generationProjects"),
    sourceCandidate: v.optional(v.id("imageCandidates")),
    frontStorageId: v.optional(v.id("_storage")),
    leftStorageId: v.optional(v.id("_storage")),
    rightStorageId: v.optional(v.id("_storage")),
    backStorageId: v.optional(v.id("_storage")),
    frontUrl: v.optional(v.string()),
    leftUrl: v.optional(v.string()),
    rightUrl: v.optional(v.string()),
    backUrl: v.optional(v.string()),
    status: jobStatusV,
    approved: v.boolean(),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  generatedModels: defineTable({
    projectId: v.id("generationProjects"),
    multiviewSet: v.optional(v.id("multiviewSets")),
    modelStorageId: v.optional(v.id("_storage")),
    modelUrl: v.optional(v.string()),
    previewStorageId: v.optional(v.id("_storage")),
    previewUrl: v.optional(v.string()),
    status: jobStatusV,
    approved: v.boolean(),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  // A published character type.
  cardDefinitions: defineTable({
    projectId: v.optional(v.id("generationProjects")),
    name: v.string(),
    slug: v.string(),
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
    artworkUrl: v.optional(v.string()),
    modelStorageId: v.optional(v.id("_storage")),
    modelUrl: v.optional(v.string()),
    published: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"])
    .index("by_rarity", ["rarity"])
    .index("by_faction", ["faction"]),

  // One collectible owned by one player.
  ownedCards: defineTable({
    owner: v.id("users"),
    cardDefinition: v.id("cardDefinitions"),
    serialNumber: v.number(),
    source: sourceV,
    packOpening: v.optional(v.id("packOpenings")),
    publicId: v.string(),
    acquiredAt: v.number(),
  })
    .index("by_owner", ["owner"])
    .index("by_publicId", ["publicId"])
    .index("by_card", ["cardDefinition"])
    .index("by_owner_card", ["owner", "cardDefinition"]),

  packOpenings: defineTable({
    user: v.id("users"),
    cardsAwarded: v.array(v.id("cardDefinitions")),
    creditsSpent: v.number(),
    openedAt: v.number(),
  }).index("by_user", ["user"]),
});
