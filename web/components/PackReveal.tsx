"use client";

import { useCallback, useEffect, useState } from "react";
import type { FactionId, RoleId, RarityId, KeywordId } from "@flashborn/shared";
import { FACTION_THEME, RARITY_THEME, ROLE_LABEL } from "@/lib/theme";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";

/** A single card as returned by api.packs.openPack. */
export type PackCard = {
  ownedId: string;
  publicId: string;
  serialNumber: number;
  cardId: string;
  name: string;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  cost: number;
  attack: number;
  health: number;
  keyword?: KeywordId | null;
  abilityText?: string | null;
  artworkUrl?: string | null;
  modelUrl?: string | null;
};

function toFrame(c: PackCard): CardFrameData {
  return {
    name: c.name,
    faction: c.faction,
    role: c.role,
    rarity: c.rarity,
    cost: c.cost,
    attack: c.attack,
    health: c.health,
    keyword: c.keyword ?? null,
    abilityText: c.abilityText ?? null,
    artworkUrl: c.artworkUrl ?? null,
    modelUrl: c.modelUrl ?? null,
  };
}

/** Phases of revealing a single card. */
type Phase = "back" | "glow" | "open";

function CardBack({
  faction,
  rarity,
  wildcard,
  onClick,
}: {
  faction: FactionId;
  rarity: RarityId;
  wildcard: boolean;
  onClick: () => void;
}) {
  const f = FACTION_THEME[faction];
  return (
    <button
      onClick={onClick}
      aria-label="Reveal card"
      className={`group relative ${wildcard ? "w-[240px]" : "w-[200px]"} aspect-[5/7] cursor-pointer select-none transition-transform duration-300 hover:-translate-y-2`}
      style={{ perspective: "1400px" }}
    >
      <div className="pointer-events-none absolute -inset-2 rounded-2xl opacity-50 blur-xl transition-opacity group-hover:opacity-90" style={{ background: f.gradient }} />
      {wildcard && (
        <div className="holo-trim pointer-events-none absolute -inset-[2px] rounded-2xl opacity-80" />
      )}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(160deg, ${f.dark}, #05070d 75%)`,
          boxShadow: `inset 0 0 0 2px ${f.primary}, inset 0 0 40px -8px ${f.glow}`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_3px] opacity-30" />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-xl"
          style={{ background: f.gradient, boxShadow: `0 0 40px ${f.glow}` }}
        >
          <span className="h-8 w-8 rotate-45 rounded bg-grid-bg/80" />
        </div>
        <span className="relative mt-6 font-display text-xs font-black uppercase tracking-[0.3em] text-grid-fg/80">
          {wildcard ? "Wildcard" : "Tap to reveal"}
        </span>
        <span
          className="relative mt-1 text-[10px] uppercase tracking-[0.25em]"
          style={{ color: RARITY_THEME[rarity].color }}
        >
          ???
        </span>
      </div>
    </button>
  );
}

function RevealedCard({
  card,
  phase,
  wildcard,
}: {
  card: PackCard;
  phase: Phase;
  wildcard: boolean;
}) {
  const f = FACTION_THEME[card.faction];
  const r = RARITY_THEME[card.rarity];
  const punchy = wildcard && (card.rarity === "rare" || card.rarity === "legendary");

  return (
    <div className="relative flex flex-col items-center">
      {/* Rarity burst behind the card */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700 ${
          phase === "back" ? "h-0 w-0 opacity-0" : "h-[120%] w-[120%] opacity-70"
        }`}
        style={{ background: punchy ? "conic-gradient(from 0deg, #ff3dbb, #ffb347, #19e6c1, #4da3ff, #8b5cf6, #ff3dbb)" : `radial-gradient(circle, ${r.color}, transparent 70%)` }}
      />
      {punchy && phase !== "back" && (
        <div className="holo-trim pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-3xl opacity-30 blur-md" />
      )}

      <div
        className={`relative transition-all duration-500 ${
          phase === "open" ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        style={{ transitionDelay: phase === "open" ? "120ms" : "0ms" }}
      >
        <CardFrame card={toFrame(card)} size="lg" />
      </div>

      {/* Rarity label, fades in with the glow phase */}
      <div
        className={`mt-3 flex flex-col items-center gap-1 transition-opacity duration-500 ${
          phase === "open" ? "opacity-100" : "opacity-0"
        }`}
      >
        <span
          className={`font-display text-sm font-black uppercase tracking-[0.3em] ${r.holo ? "holo-text" : ""}`}
          style={r.holo ? undefined : { color: r.color }}
        >
          {r.name}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-faint">
          {ROLE_LABEL[card.role]} · {FACTION_THEME[card.faction].name} · #{card.serialNumber}
        </span>
      </div>
    </div>
  );
}

export default function PackReveal({
  cards,
  onDone,
}: {
  cards: PackCard[];
  /** Called once every card has been revealed. */
  onDone?: () => void;
}) {
  // revealedIndex = number of cards already revealed (0..cards.length)
  const [revealed, setRevealed] = useState(0);
  // per-card phase
  const [phase, setPhase] = useState<Phase>("back");
  const allDone = revealed >= cards.length;

  const advance = useCallback(() => {
    if (allDone) return;
    if (phase === "back") {
      setPhase("glow");
      // brief glow, then pop the card open
      window.setTimeout(() => setPhase("open"), 280);
    }
  }, [allDone, phase]);

  // When a card finishes opening, auto-advance to the next back after a beat.
  useEffect(() => {
    if (phase !== "open") return;
    const isLast = revealed === cards.length - 1;
    const t = window.setTimeout(
      () => {
        if (isLast) {
          setRevealed((n) => n + 1);
        } else {
          setRevealed((n) => n + 1);
          setPhase("back");
        }
      },
      isLast ? 900 : 1100,
    );
    return () => window.clearTimeout(t);
  }, [phase, revealed, cards.length]);

  useEffect(() => {
    if (allDone) onDone?.();
  }, [allDone, onDone]);

  if (cards.length === 0) return null;

  const current = cards[Math.min(revealed, cards.length - 1)];
  const isWildcard = Math.min(revealed, cards.length - 1) === cards.length - 1;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {cards.map((c, i) => (
          <span
            key={c.ownedId}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i < revealed ? 24 : 8,
              background:
                i < revealed
                  ? RARITY_THEME[c.rarity].color
                  : "var(--color-edge)",
            }}
          />
        ))}
      </div>

      {/* Reveal stage */}
      <div
        className="flex min-h-[620px] items-center justify-center"
        onClick={phase === "back" ? advance : undefined}
        role={phase === "back" ? "button" : undefined}
      >
        {phase === "back" ? (
          <CardBack
            faction={current.faction}
            rarity={current.rarity}
            wildcard={isWildcard}
            onClick={advance}
          />
        ) : (
          <RevealedCard card={current} phase={phase} wildcard={isWildcard} />
        )}
      </div>

      {!allDone && phase === "back" && (
        <p className="text-xs uppercase tracking-[0.3em] text-faint">
          Card {revealed + 1} of {cards.length} — tap to reveal
        </p>
      )}
    </div>
  );
}
