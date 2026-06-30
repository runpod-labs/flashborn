"use client";

import { useRef, useState } from "react";
import type { FactionId, RoleId, RarityId, KeywordId } from "@flashborn/shared";
import { FACTION_THEME, RARITY_THEME } from "@/lib/theme";
import { FactionBadge } from "./FactionBadge";
import { RoleBadge } from "./RoleBadge";
import { RarityGem } from "./RarityBadge";
import { StatPip } from "./StatPip";
import ModelViewer from "./ModelViewer";

export type CardFrameData = {
  name: string;
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
  interactive3d = false,
}: {
  card: CardFrameData;
  size?: Size;
  interactive3d?: boolean;
}) {
  const f = FACTION_THEME[card.faction];
  const r = RARITY_THEME[card.rarity];
  const isLegendary = r.holo;
  const show3d = interactive3d && !!card.modelUrl;
  const compact = size === "sm";

  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });

  function onMove(e: React.MouseEvent) {
    if (show3d) return; // let the model-viewer own pointer
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width - 0.5;
    const py = (e.clientY - b.top) / b.height - 0.5;
    setTilt({ rx: -py * 9, ry: px * 11, active: true });
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0, active: false });
  }

  return (
    <div
      className={`group relative ${SIZE_W[size]} aspect-[5/7] select-none`}
      style={{ perspective: "1400px" }}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative h-full w-full rounded-2xl transition-transform duration-200 ease-out"
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.02)`
            : "rotateX(0) rotateY(0)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Outer faction glow */}
        <div
          className="pointer-events-none absolute -inset-1 rounded-2xl opacity-70 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: f.gradient }}
        />

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
            {/* Cost gem top-left */}
            <StatPip kind="cost" value={card.cost} size={compact ? "sm" : size === "lg" ? "lg" : "md"} />
            <div className="flex flex-col items-end gap-1.5">
              <FactionBadge faction={card.faction} showName={!compact} />
              <div className="flex items-center gap-1.5">
                <RoleBadge role={card.role} />
              </div>
            </div>
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
            {show3d ? (
              <ModelViewer src={card.modelUrl!} poster={card.artworkUrl ?? undefined} className="rounded-lg" />
            ) : card.artworkUrl ? (
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
            {/* scanline + holo sheen */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_3px] opacity-30" />
            {isLegendary && (
              <div className="holo-trim pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-color-dodge" />
            )}
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

          {/* ---------- Ability / lore box ---------- */}
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
              {card.lore && size === "lg" && (
                <p className="mt-1.5 border-t border-edge pt-1.5 text-[11px] italic leading-snug text-muted">
                  {card.lore}
                </p>
              )}
            </div>
          )}

          {/* ---------- Stats footer (attack bottom-left, health bottom-right) ---------- */}
          <div className="relative z-10 flex items-end justify-between px-3 pb-3 pt-2">
            <StatPip kind="attack" value={card.attack} size={compact ? "sm" : size === "lg" ? "lg" : "md"} />
            {compact && <RarityGem rarity={card.rarity} />}
            <StatPip kind="health" value={card.health} size={compact ? "sm" : size === "lg" ? "lg" : "md"} />
          </div>
        </div>
      </div>
    </div>
  );
}
