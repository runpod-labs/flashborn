// Prompt builder — the single place the validated style strategy lives.
// HiDream is CFG-free (no negative prompt), so all steering is positive:
// fixed style spine + faction colors/materials + role silhouette + rarity
// complexity + character, with explicit no-text / no-base phrasing. We use
// color NAMES (never hex) because hex codes render as literal text.
import {
  FACTION_DEFS,
  ROLE_DEFS,
  RARITY_DEFS,
  type FactionId,
  type RoleId,
  type RarityId,
  type CardKind,
} from "@flashborn/shared";

export interface ConceptInput {
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  /** Defaults to "character". Items render as objects, places as environments. */
  kind?: CardKind;
  character: string;
  extra?: string;
}

export function buildConceptPrompt(i: ConceptInput): string {
  const f = FACTION_DEFS[i.faction];
  const rar = RARITY_DEFS[i.rarity];
  const colors = f.colors.map((c) => c.name.toLowerCase()).join(", ");
  const subject = i.character.trim().replace(/\.$/, "");
  const extra = i.extra ? `${i.extra.trim().replace(/\.$/, "")}.` : "";
  const kind = i.kind ?? "character";

  if (kind === "item") {
    // A single hero object — gear / relic / device. Centered for 3D capture.
    return [
      `A premium product render of ${subject}: a single cyberpunk collectible object.`,
      `${f.name} faction: ${f.visualLanguage.join(", ")}.`,
      `Color palette ${colors}.`,
      `${rar.name} tier: ${rar.visual.join(", ")}.`,
      extra,
      `Single centered object, no characters, no people, no hands, fully visible, clear readable silhouette, floating on a plain neutral seamless dark studio background, dramatic neon rim lighting in ${colors}, crisp physically based materials, highly detailed professional collectible product render.`,
      `Clean image with no text, no letters, no numbers, no logos, no watermark, no captions, no UI.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (kind === "place") {
    // An environment / location — wide establishing shot, no characters.
    return [
      `A cinematic establishing shot of ${subject}: an iconic cyberpunk location in a neon megacity.`,
      `${f.name} faction atmosphere: ${f.visualLanguage.join(", ")}.`,
      `Color palette ${colors}.`,
      `${rar.name} tier: ${rar.visual.join(", ")}.`,
      extra,
      `Wide atmospheric environment, no characters, no people, no creatures, strong neon ${colors} lighting and volumetric haze, deep cyberpunk architecture, premium collectible card key art, highly detailed.`,
      `Clean image with no text, no letters, no numbers, no logos, no watermark, no captions, no UI.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const r = ROLE_DEFS[i.role];
  return [
    `A full-body character render of ${subject}.`,
    `${f.name} faction: ${f.visualLanguage.join(", ")}.`,
    `Color palette ${colors}.`,
    `${r.name} role: ${r.silhouette.join(", ")}.`,
    `${rar.name} tier: ${rar.visual.join(", ")}.`,
    extra,
    `Single centered character, complete body visible head to feet, clear readable silhouette, plain neutral seamless studio background, dramatic neon rim lighting in ${colors}, physically based materials, highly detailed professional video-game character concept render.`,
    `Clean image with no text, no letters, no numbers, no logos, no watermark, no captions, no UI, no base, no pedestal.`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Multiview uses the selected concept as a reference image (editing mode), so
// the prompt only needs to specify the camera + keep-consistency framing.
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
