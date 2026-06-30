"use client";

// Shared demo-card loader for the design-concept subpages.
//
// All four concept pages render the SAME real published card so the visual
// directions can be compared apples-to-apples. We prefer a Legendary with a
// 3D model (best showcase), then any card with a model, then any with art.
//
// Owner / serial / mint metadata is synthesized deterministically from the
// card name (no Date.now / Math.random) so server and client render identically
// and every concept shows the same fake-but-stable provenance block.

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CardFrameData } from "@/components/CardFrame";
import {
  FACTION_THEME,
  RARITY_THEME,
  ROLE_LABEL,
  KIND_LABEL,
} from "@/lib/theme";
import { KEYWORD_DEFS, type KeywordId } from "@flashborn/shared";

export type DemoCard = CardFrameData & {
  _id: string;
  slug: string;
  abilityTitle?: string | null;
  lore?: string | null;
};

export type DemoProvenance = {
  serial: string; // e.g. "0042"
  serialNumber: number;
  edition: number; // edition size
  owner: string;
  acquired: string; // stable display date
  minted: string; // stable mint code
};

export type DemoView = {
  loading: boolean;
  card: DemoCard | null;
  /** Other published cards (for thumbnail rails / "more from the grid"). */
  others: DemoCard[];
  faction: (typeof FACTION_THEME)[keyof typeof FACTION_THEME];
  rarity: (typeof RARITY_THEME)[keyof typeof RARITY_THEME];
  roleLabel: string;
  kindLabel: string;
  isCharacter: boolean;
  keyword: (typeof KEYWORD_DEFS)[KeywordId] | null;
  prov: DemoProvenance;
};

function score(c: DemoCard): number {
  let s = 0;
  if (c.modelUrl) s += 100;
  if (c.artworkUrl) s += 10;
  s += RARITY_THEME[c.rarity]?.rank ?? 0;
  return s;
}

function provenance(card: DemoCard | null): DemoProvenance {
  const name = card?.name ?? "Flashborn";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const serialNumber = (h % 480) + 1;
  const serial = String(serialNumber).padStart(4, "0");
  const mint = (h % 0xffffff).toString(16).toUpperCase().padStart(6, "0");
  return {
    serialNumber,
    serial,
    edition: 500,
    owner: "tim.pietrusky",
    acquired: "2026.06.30",
    minted: `0x${mint}`,
  };
}

/**
 * Loads the showcase card for the concept pages. Returns a fully-resolved view
 * model so the page components stay focused on layout/styling.
 */
export function useDemoCard(): DemoView {
  const cards = useQuery(api.cards.listPublished, {}) as
    | DemoCard[]
    | undefined;

  const loading = cards === undefined;
  const list = cards ?? [];
  const sorted = [...list].sort((a, b) => score(b) - score(a));
  const card = sorted[0] ?? null;
  const others = sorted.slice(1, 9);

  const faction = FACTION_THEME[card?.faction ?? "kernel_guard"];
  const rarity = RARITY_THEME[card?.rarity ?? "common"];
  const roleLabel = card ? ROLE_LABEL[card.role] : "";
  const kind = card?.kind ?? "character";
  const kindLabel = KIND_LABEL[kind];
  const isCharacter = kind === "character";
  const keyword =
    card?.keyword ? KEYWORD_DEFS[card.keyword as KeywordId] ?? null : null;

  return {
    loading,
    card,
    others,
    faction,
    rarity,
    roleLabel,
    kindLabel,
    isCharacter,
    keyword,
    prov: provenance(card),
  };
}
