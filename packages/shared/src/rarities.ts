/**
 * Rarity system. Rarity affects pack probability, frame treatment, design
 * complexity, and visual effects — but not raw stat power. Faction identity
 * must remain stronger than rarity identity.
 */

export const RARITIES = ["common", "uncommon", "rare", "legendary"] as const;

export type RarityId = (typeof RARITIES)[number];

export interface RarityDef {
  id: RarityId;
  name: string;
  /** Visual complexity cues for the generation prompt. */
  visual: string[];
  /** Card-frame treatment for the renderer. */
  frameTreatment: string;
}

export const RARITY_DEFS: Record<RarityId, RarityDef> = {
  common: {
    id: "common",
    name: "Common",
    visual: ["simple silhouette", "fewer accessories", "minimal frame effects", "clear and readable design"],
    frameTreatment: "Basic faction border.",
  },
  uncommon: {
    id: "uncommon",
    name: "Uncommon",
    visual: ["more detailed equipment", "stronger accent lighting", "slightly richer frame treatment"],
    frameTreatment: "Additional frame detailing.",
  },
  rare: {
    id: "rare",
    name: "Rare",
    visual: [
      "distinctive silhouette",
      "unique equipment or body feature",
      "animated-looking visual effects",
      "premium frame detailing",
    ],
    frameTreatment: "Animated or illuminated trim.",
  },
  legendary: {
    id: "legendary",
    name: "Legendary",
    visual: [
      "immediate centerpiece character",
      "iconic silhouette",
      "strong faction-specific effects",
      "holographic or animated card treatment",
    ],
    frameTreatment: "Holographic effect, animated lighting, or premium full-frame treatment.",
  },
};

/** Booster pack wildcard probabilities (the 5th card). */
export const WILDCARD_ODDS: { rarity: RarityId; weight: number }[] = [
  { rarity: "uncommon", weight: 0.7 },
  { rarity: "rare", weight: 0.25 },
  { rarity: "legendary", weight: 0.05 },
];
