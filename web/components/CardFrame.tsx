"use client";

import { useRef, useState } from "react";
import type { FactionId, RoleId, RarityId, KeywordId, CardKind } from "@flashborn/shared";
import { FACTION_THEME, RARITY_THEME } from "@/lib/theme";
import { FactionBadge } from "./FactionBadge";
import { RoleBadge } from "./RoleBadge";
import { KindBadge } from "./KindBadge";
import { RarityGem } from "./RarityBadge";

// Each stat reads by its ICON first (energy/attack/health), grouped together so
// you can see all three at a glance.
const STAT_META = {
  cost: { color: "#FFD447", label: "Energy cost", icon: "M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" },
  attack: { color: "#FF8A00", label: "Attack", icon: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" },
  health: { color: "#46D39A", label: "Health", icon: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" },
} as const;

function StatBar({
  cost,
  attack,
  health,
  size,
  combat,
}: {
  cost: number;
  attack: number;
  health: number;
  size: Size;
  combat: boolean;
}) {
  const big = size === "lg";
  const compact = size === "sm";
  // Characters carry the full combat triad; items/places only have an energy
  // cost — their effect lives in the ability text, so we don't show 0/0.
  const entries = (
    combat
      ? [["cost", cost], ["attack", attack], ["health", health]]
      : [["cost", cost]]
  ) as ReadonlyArray<readonly ["cost" | "attack" | "health", number]>;
  return (
    <div className={`grid gap-1.5 ${combat ? "grid-cols-3" : "grid-cols-1"}`}>
      {entries.map(([kind, value]) => {
        const m = STAT_META[kind];
        return (
          <div
            key={kind}
            title={`${m.label}: ${value}`}
            className={`flex items-center justify-center gap-1.5 rounded-md ${big ? "py-1.5" : "py-1"}`}
            style={{ background: `${m.color}1a`, boxShadow: `inset 0 0 0 1px ${m.color}66` }}
          >
            <svg
              viewBox="0 0 24 24"
              className={big ? "h-[18px] w-[18px]" : compact ? "h-3 w-3" : "h-3.5 w-3.5"}
              fill="none"
              stroke={m.color}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={m.icon} />
            </svg>
            <span
              className={`font-display font-black leading-none text-white ${big ? "text-2xl" : compact ? "text-sm" : "text-lg"}`}
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type CardFrameData = {
  name: string;
  kind?: CardKind | null;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  cost: number;
  attack: number;
  health: number;
  keyword?: KeywordId | null;
  abilityTitle?: string | null;
  abilityText?: string | null;
  lore?: string | null;
  artworkUrl?: string | null;
  modelUrl?: string | null;
};

type Size = "sm" | "md" | "lg";

const SIZE_W: Record<Size, string> = {
  sm: "w-[210px]",
  md: "w-[300px]",
  lg: "w-[400px]",
};

export default function CardFrame({
  card,
  size = "md",
}: {
  card: CardFrameData;
  size?: Size;
  // Accepted for call-site compatibility; cards are artwork-only now (no 3D).
  interactive3d?: boolean;
}) {
  const f = FACTION_THEME[card.faction];
  const r = RARITY_THEME[card.rarity];
  const isLegendary = r.holo;
  const compact = size === "sm";
  const kind = card.kind ?? "character";
  const isCharacter = kind === "character";

  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [rot, setRot] = useState({ rx: 0, ry: 0, dragging: false });

  // Tilt the WHOLE card like holding it in your hand — ONLY while click-dragging
  // (not on hover, which felt jumpy). Rotation tracks the drag delta from where
  // you grabbed, so clicking doesn't snap. The model/artwork skews together with
  // the frame; nothing changes position and the model never orbits on its own.
  const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setRot((r) => ({ ...r, dragging: true }));
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!start.current || !el) return;
    const b = el.getBoundingClientRect();
    const dx = (e.clientX - start.current.x) / b.width;
    const dy = (e.clientY - start.current.y) / b.height;
    setRot({ rx: clamp(-dy * 55, 18), ry: clamp(dx * 75, 30), dragging: true });
  }
  function endDrag() {
    start.current = null;
    setRot({ rx: 0, ry: 0, dragging: false });
  }

  const transform = `rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`;

  return (
    <div
      className={`group relative ${SIZE_W[size]} aspect-[5/7] select-none`}
      style={{ perspective: "1400px" }}
    >
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-full w-full touch-none rounded-2xl"
        style={{
          transform,
          transformStyle: "preserve-3d",
          // Instant 1:1 tracking while dragging; smooth ease back to flat on release.
          transition: rot.dragging ? "none" : "transform 280ms ease-out",
          cursor: rot.dragging ? "grabbing" : "grab",
        }}
      >
        {/* Legendary holographic trim ring */}
        {isLegendary && (
          <div className="holo-trim pointer-events-none absolute -inset-[2px] rounded-2xl opacity-90" />
        )}

        {/* Frame body */}
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(160deg, ${f.dark}, #05070d 70%)`,
            boxShadow: `inset 0 0 0 ${isLegendary ? "3px" : "2px"} ${f.primary}, inset 0 0 30px -6px ${f.glow}, 0 18px 40px -18px ${f.glow}`,
          }}
        >
          {/* Faction texture wash */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
            style={{
              background: `radial-gradient(120% 60% at 50% -10%, ${f.primary}30, transparent 60%)`,
            }}
          />

          {/* ---------- Header ---------- */}
          <div className="relative z-10 flex items-start justify-between gap-2 px-3 pt-3">
            <FactionBadge faction={card.faction} showName={!compact} />
            {isCharacter ? <RoleBadge role={card.role} /> : <KindBadge kind={kind} />}
          </div>

          {/* ---------- Art / 3D area ---------- */}
          <div className="relative mx-3 mt-2.5 flex-1 overflow-hidden rounded-lg">
            <div
              className="absolute inset-0"
              style={{
                boxShadow: `inset 0 0 0 1px ${f.primary}66`,
                background: `linear-gradient(180deg, ${f.dark}, #05070d)`,
              }}
            />
            {card.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.artworkUrl}
                alt={card.name}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="text-center"
                  style={{ color: `${f.primary}` }}
                >
                  <div className="mx-auto mb-2 h-14 w-14 rounded-md" style={{ background: f.gradient, opacity: 0.5 }} />
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-60">
                    Awaiting art
                  </span>
                </div>
              </div>
            )}
            {/* subtle scanline only — no moving shine over the art / 3D model */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_3px] opacity-30" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          </div>

          {/* ---------- Name banner ---------- */}
          <div className="relative z-10 mx-3 mt-2 flex items-center justify-between gap-2">
            <h3
              className={`truncate font-display font-bold tracking-tight ${
                compact ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg"
              } ${isLegendary ? "holo-text" : ""}`}
              style={isLegendary ? undefined : { color: f.secondary }}
              title={card.name}
            >
              {card.name}
            </h3>
            <RarityGem rarity={card.rarity} />
          </div>

          {/* ---------- Ability box (lore lives on the detail page, not here) ---------- */}
          {!compact && (
            <div className="relative z-10 mx-3 mt-2 rounded-md px-3 py-2 panel">
              {card.keyword && (
                <span
                  className="mb-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: f.primary, background: `${f.primary}1f` }}
                >
                  {card.keyword}
                </span>
              )}
              {card.abilityTitle && (
                <div className="text-[11px] font-semibold" style={{ color: f.secondary }}>
                  {card.abilityTitle}
                </div>
              )}
              {card.abilityText ? (
                <p className={`text-grid-fg/80 ${size === "lg" ? "text-sm" : "text-[11px]"} leading-snug`}>
                  {card.abilityText}
                </p>
              ) : (
                !card.keyword && (
                  <p className="text-[11px] italic text-faint">No combat ability.</p>
                )
              )}
            </div>
          )}

          {/* ---------- Stats footer: energy cost / attack / health, grouped with icons ---------- */}
          <div className="relative z-10 px-3 pb-3 pt-2">
            <StatBar cost={card.cost} attack={card.attack} health={card.health} size={size} combat={isCharacter} />
          </div>
        </div>
      </div>
    </div>
  );
}
