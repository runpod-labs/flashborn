// Prompt builder — the single place the validated style strategy lives.
// HiDream is CFG-free (no negative prompt), so all steering is positive:
// fixed full-art style spine + faction colors/materials + role silhouette +
// rarity complexity + subject, with explicit no-text phrasing. We use color
// NAMES (never hex) because hex codes render as literal text.
//
// Cards are now ARTWORK-ONLY (no 3D). Art is premium MTG-style full-art with
// atmospheric faction backgrounds, composed for a 5:7 portrait card frame.
import {
  FACTION_DEFS,
  ROLE_DEFS,
  RARITY_DEFS,
  type FactionId,
  type RoleId,
  type RarityId,
  type CardKind,
} from "@flashborn/shared";

/** Card art is generated at exactly 5:7 so it fills the card frame with no crop. */
export const ART_WIDTH = 880;
export const ART_HEIGHT = 1232;

export interface ConceptInput {
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  /** Defaults to "character". Items render as objects, places as environments. */
  kind?: CardKind;
  character: string;
  extra?: string;
}

// Shared full-art spine — every card reads as a premium collectible illustration.
const SPINE =
  "premium cyberpunk collectible card illustration, full-art key art, cinematic composition, dramatic volumetric neon lighting, rich atmospheric depth, highly detailed painterly concept art, vertical portrait framing";

const CLEAN = "Clean illustration with no text, no letters, no numbers, no logos, no watermark, no captions, no UI, no frame, no border.";

export function buildConceptPrompt(i: ConceptInput): string {
  const f = FACTION_DEFS[i.faction];
  const rar = RARITY_DEFS[i.rarity];
  const colors = f.colors.map((c) => c.name.toLowerCase()).join(", ");
  const subject = i.character.trim().replace(/\.$/, "");
  const extra = i.extra ? `${i.extra.trim().replace(/\.$/, "")}.` : "";
  const kind = i.kind ?? "character";

  if (kind === "item") {
    // A single hero object — gear / relic / device, dramatically lit, set in an
    // atmospheric faction environment (the look the team validated).
    return [
      `A premium hero render of ${subject}: a single iconic cyberpunk collectible object as the clear centerpiece.`,
      `${f.name} faction style: ${f.visualLanguage.join(", ")}.`,
      `Color palette ${colors}.`,
      `${rar.name} tier: ${rar.visual.join(", ")}.`,
      extra,
      `${SPINE}. Single centered object, no characters, no people, no hands, fully visible with a clear readable silhouette, dramatic neon rim lighting in ${colors}, crisp physically based materials, set against an atmospheric ${f.name} environment with soft depth of field and volumetric haze.`,
      CLEAN,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (kind === "place") {
    // An environment / location — wide cinematic establishing shot, no characters.
    return [
      `A cinematic establishing shot of ${subject}: an iconic cyberpunk location in a neon megacity.`,
      `${f.name} faction atmosphere: ${f.visualLanguage.join(", ")}.`,
      `Color palette ${colors}.`,
      `${rar.name} tier: ${rar.visual.join(", ")}.`,
      extra,
      `${SPINE}. Wide atmospheric environment, no characters, no people, no creatures, strong neon ${colors} lighting and volumetric haze, deep layered cyberpunk architecture, sense of scale and depth.`,
      CLEAN,
    ]
      .filter(Boolean)
      .join(" ");
  }

  // Character — a single hero figure in a dynamic pose, set in a faction scene.
  const r = ROLE_DEFS[i.role];
  return [
    `A premium full-body character illustration of ${subject}.`,
    `${f.name} faction style: ${f.visualLanguage.join(", ")}.`,
    `Color palette ${colors}.`,
    `${r.name} role silhouette: ${r.silhouette.join(", ")}.`,
    `${rar.name} tier: ${rar.visual.join(", ")}.`,
    extra,
    `${SPINE}. Single centered hero character, complete figure visible, dynamic confident pose, clear readable silhouette, dramatic neon rim lighting in ${colors}, physically based materials, set within an atmospheric ${f.name} environment in The Grid with cinematic depth of field and volumetric haze behind the character.`,
    CLEAN,
  ]
    .filter(Boolean)
    .join(" ");
}

// Multiview uses the selected concept as a reference image (editing mode), so
// the prompt only needs to specify the camera + keep-consistency framing.
// Retained for the legacy 3D pipeline (logo / asset 3D), not used by cards.
const VIEW_PHRASING: Record<string, string> = {
  front: "front orthographic view, facing the camera directly",
  left: "left side profile view, facing left",
  right: "right side profile view, facing right",
  back: "back view, seen from directly behind",
};

export function buildMultiviewPrompt(view: keyof typeof VIEW_PHRASING, faction: FactionId): string {
  const colors = FACTION_DEFS[faction].colors.map((c) => c.name.toLowerCase()).join(", ");
  return [
    `The exact same character from the reference image, ${VIEW_PHRASING[view]}.`,
    `Identical design, colors, and proportions. Full body, head to feet, centered.`,
    `Plain neutral seamless studio background, even soft lighting with ${colors} neon accents.`,
    `Clean image with no text, no letters, no logos, no watermark, no base, no pedestal.`,
  ].join(" ");
}
