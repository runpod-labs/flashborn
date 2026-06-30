"use client";

import ModelViewer from "@/components/ModelViewer";
import { useDemoCard } from "@/app/concepts/_data";

// ── FOUNDRY ────────────────────────────────────────────────────────────────
// Heavy-industrial hazard HUD / mech containment bay.
// Molten orange #FF6B1A + amber #FFB000 on gunmetal #15181C / #0D0F12.
// Signature: chamfered clip-path panels, amber corner brackets, rivet dots,
// hazard chevron stripes, stencil uppercase headings, industrial gauges.

const MONO = { fontFamily: "var(--font-geist-mono)" } as const;

// Notch the top-left + bottom-right corners (industrial plate look).
const PLATE_CLIP =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";
// Heavier chamfer for the hero/containment frame.
const BAY_CLIP =
  "polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)";

function CornerBrackets({ color = "#FFB000" }: { color?: string }) {
  const T = "absolute h-4 w-4 pointer-events-none";
  return (
    <>
      <span className={`${T} left-[3px] top-[3px] border-l-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${T} right-[3px] top-[3px] border-r-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${T} left-[3px] bottom-[3px] border-l-2 border-b-2`} style={{ borderColor: color }} />
      <span className={`${T} right-[3px] bottom-[3px] border-r-2 border-b-2`} style={{ borderColor: color }} />
    </>
  );
}

function Rivets() {
  const dot = "absolute h-1.5 w-1.5 rounded-full";
  const style = {
    background:
      "radial-gradient(circle at 30% 30%, #5b6470, #1b1e23 70%)",
    boxShadow: "inset 0 0 0 1px #0a0c0f, 0 0 2px #000",
  } as const;
  return (
    <>
      <span className={`${dot} left-2 top-2`} style={style} />
      <span className={`${dot} right-2 top-2`} style={style} />
      <span className={`${dot} left-2 bottom-2`} style={style} />
      <span className={`${dot} right-2 bottom-2`} style={style} />
    </>
  );
}

// Brushed gunmetal panel base.
const PANEL_BG =
  "linear-gradient(155deg, #1d2127 0%, #15181c 45%, #101317 100%)";

function Plate({
  children,
  className = "",
  bracket = true,
  rivets = true,
}: {
  children: React.ReactNode;
  className?: string;
  bracket?: boolean;
  rivets?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{ clipPath: PLATE_CLIP, background: PANEL_BG }}
    >
      {/* inner steel hairline */}
      <span
        className="pointer-events-none absolute inset-[3px]"
        style={{ clipPath: PLATE_CLIP, boxShadow: "inset 0 0 0 1px #3A4049" }}
      />
      {bracket && <CornerBrackets />}
      {rivets && <Rivets />}
      <div className="relative">{children}</div>
    </div>
  );
}

function Schematic({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.34em] text-[#7c8794]"
      style={MONO}
    >
      {children}
    </span>
  );
}

// Industrial horizontal fill-meter with tick marks.
function Gauge({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative">
      <div className="mb-1.5 flex items-baseline justify-between">
        <Schematic>{label}</Schematic>
        <span
          className="text-[15px] font-bold tabular-nums text-[#EAEFF5]"
          style={MONO}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <div
        className="relative h-3 w-full overflow-hidden border border-[#3A4049]"
        style={{ background: "#0a0c0f" }}
      >
        {/* tick marks */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 9px, #3A4049 9px 10px)",
          }}
        />
        <div
          className="relative h-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}99, inset 0 0 0 1px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

// Hazard chevron strip (orange/black) used as hero trim + header underline.
function Hazard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`fb-hazard ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, #FF6B1A 0 16px, #0D0F12 16px 32px)",
      }}
    />
  );
}

export default function FoundryConceptPage() {
  const v = useDemoCard();

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (v.loading) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div
            className="h-10 w-10 animate-spin border-2 border-[#3A4049] border-t-[#FF6B1A]"
            style={{ clipPath: PLATE_CLIP }}
          />
          <Schematic>● SPINNING UP CONTAINMENT BAY…</Schematic>
        </div>
        <Styles />
      </Shell>
    );
  }

  // ── EMPTY ────────────────────────────────────────────────────────────────
  if (!v.card) {
    return (
      <Shell>
        <div className="mx-auto mt-24 max-w-md">
          <Plate className="px-7 py-8 text-center">
            <Schematic>FOUNDRY // STATUS</Schematic>
            <h2
              className="mt-3 text-2xl font-black uppercase tracking-wide text-[#FFB000]"
              style={{ textShadow: "0 0 18px #FF6B1A66" }}
            >
              Bay Empty
            </h2>
            <p className="mt-2 text-sm text-[#8b95a1]">
              No published cards yet. The forge is cold.
            </p>
          </Plate>
        </div>
        <Styles />
      </Shell>
    );
  }

  const card = v.card;
  const accent = "#FF6B1A";
  const amber = "#FFB000";

  return (
    <Shell>
      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-7 sm:px-6">
        {/* breadcrumb / spec line */}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Schematic>UNIT SPEC // REV 4.8</Schematic>
          <span className="h-3 w-px bg-[#3A4049]" />
          <Schematic>CONTAINMENT BAY 07</Schematic>
          <span className="h-3 w-px bg-[#3A4049]" />
          <span className="text-[10px] uppercase tracking-[0.34em]" style={{ ...MONO, color: amber }}>
            CLEARANCE: ADMIN
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* ── HERO: CONTAINMENT BAY ──────────────────────────────────── */}
          <section className="relative">
            <div
              className="relative"
              style={{ clipPath: BAY_CLIP, background: PANEL_BG }}
            >
              <span
                className="pointer-events-none absolute inset-[4px] z-20"
                style={{ clipPath: BAY_CLIP, boxShadow: "inset 0 0 0 1px #3A4049" }}
              />
              <CornerBrackets color={amber} />

              {/* top hazard trim */}
              <Hazard className="h-3 w-full" />

              {/* bay readout strip */}
              <div className="flex items-center justify-between border-b border-[#23272d] bg-[#0d0f12] px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{ background: amber, boxShadow: `0 0 8px ${amber}` }}
                  />
                  <Schematic>SPECIMEN LOCKED</Schematic>
                </div>
                <span className="text-[10px] tracking-[0.3em] text-[#7c8794]" style={MONO}>
                  {v.prov.minted}
                </span>
              </div>

              {/* the 3D model bay */}
              <div
                className="relative h-[380px] w-full sm:h-[460px]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 38%, #232830 0%, #14171b 55%, #0a0c0f 100%)",
                }}
              >
                {/* blueprint dotted grid */}
                <div className="fb-blueprint pointer-events-none absolute inset-0 z-0" />
                {/* faint floor glow in molten orange */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40"
                  style={{
                    background: `radial-gradient(ellipse at 50% 100%, ${accent}33, transparent 70%)`,
                  }}
                />
                <div className="absolute inset-0 z-10">
                  {card.modelUrl ? (
                    <ModelViewer
                      src={card.modelUrl}
                      poster={card.artworkUrl ?? undefined}
                    />
                  ) : card.artworkUrl ? (
                    <img
                      src={card.artworkUrl}
                      alt={card.name}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[#5b6470]" style={MONO}>
                        [ NO VISUAL FEED ]
                      </span>
                    </div>
                  )}
                </div>

                {/* corner targeting ticks over the bay */}
                <span className="pointer-events-none absolute left-4 top-12 z-20 h-5 w-5 border-l-2 border-t-2" style={{ borderColor: `${amber}88` }} />
                <span className="pointer-events-none absolute right-4 top-12 z-20 h-5 w-5 border-r-2 border-t-2" style={{ borderColor: `${amber}88` }} />
              </div>

              {/* bottom amber status readout strip */}
              <div className="relative z-20 flex items-center justify-between border-t border-[#23272d] bg-[#0d0f12] px-4 py-2">
                <span className="text-[10px] uppercase tracking-[0.3em]" style={{ ...MONO, color: amber }}>
                  ◤ STRUCTURAL INTEGRITY 100%
                </span>
                <span className="text-[10px] tracking-[0.3em] text-[#7c8794]" style={MONO}>
                  CAM-07 · LIVE
                </span>
              </div>

              {/* bottom hazard trim */}
              <Hazard className="h-3 w-full" />
            </div>

            {/* provenance plate sits under the bay */}
            <Plate className="mt-6 px-5 py-5">
              <div className="mb-3 flex items-center justify-between border-b border-[#23272d] pb-2">
                <Schematic>◤ CHAIN OF CUSTODY</Schematic>
                <span className="text-[10px] tracking-[0.3em]" style={{ ...MONO, color: accent }}>
                  REG // {v.prov.serial}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="SERIAL" value={`#${v.prov.serial} / ${v.prov.edition}`} accent={amber} />
                <Field label="EDITION" value={`${v.prov.edition} UNITS`} />
                <Field label="OPERATOR" value={v.prov.owner} accent={amber} />
                <Field label="ACQUIRED" value={v.prov.acquired} />
                <div className="col-span-2">
                  <Field label="MINT CODE" value={v.prov.minted} />
                </div>
              </dl>
            </Plate>
          </section>

          {/* ── INFO COLUMN ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            {/* identity header */}
            <Plate className="px-6 py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tag color={accent}>{v.faction.name}</Tag>
                <Tag color={amber}>{v.rarity.name}</Tag>
                <Tag>{v.isCharacter ? v.roleLabel : v.kindLabel}</Tag>
                <span className="ml-auto flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: v.faction.primary,
                      boxShadow: `0 0 6px ${v.faction.primary}`,
                    }}
                  />
                  <span className="text-[9px] tracking-[0.25em] text-[#7c8794]" style={MONO}>
                    FAC
                  </span>
                </span>
              </div>

              <Schematic>DESIGNATION</Schematic>
              <h1
                className="mt-1 text-4xl font-black uppercase leading-[0.95] tracking-tight text-[#F4F7FA] sm:text-5xl"
                style={{ textShadow: `0 0 24px ${accent}40` }}
              >
                {card.name}
              </h1>
              <div
                className="mt-4 h-px w-full"
                style={{
                  background: `linear-gradient(90deg, ${accent}, ${amber}55, transparent)`,
                }}
              />
            </Plate>

            {/* stats / gauges */}
            <Plate className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <Schematic>◤ TELEMETRY</Schematic>
                <span className="text-[10px] tracking-[0.3em] text-[#7c8794]" style={MONO}>
                  RT-FEED
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <Gauge label="COST // CYCLES" value={card.cost} max={10} color={amber} />
                {v.isCharacter && (
                  <>
                    <Gauge label="ATTACK // DMG" value={card.attack} max={12} color={accent} />
                    <Gauge label="HEALTH // HULL" value={card.health} max={12} color="#E11D0B" />
                  </>
                )}
              </div>
            </Plate>

            {/* keyword */}
            {v.keyword && (
              <Plate className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0D0F12]"
                    style={{
                      ...MONO,
                      background: amber,
                      clipPath:
                        "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
                    }}
                  >
                    {v.keyword.name}
                  </span>
                  <p className="text-sm leading-relaxed text-[#aab4c0]">
                    {v.keyword.text}
                  </p>
                </div>
              </Plate>
            )}

            {/* ability */}
            <Plate className="px-6 py-5">
              <Schematic>◤ COMBAT PROTOCOL</Schematic>
              {card.abilityTitle && (
                <h3
                  className="mt-2 text-lg font-bold uppercase tracking-wide"
                  style={{ color: accent }}
                >
                  {card.abilityTitle}
                </h3>
              )}
              <p className="mt-2 text-sm leading-relaxed text-[#c2ccd6]">
                {card.abilityText || "No combat ability."}
              </p>
            </Plate>

            {/* lore */}
            {card.lore && (
              <Plate className="px-6 py-5">
                <Schematic>◤ FIELD LOG</Schematic>
                <p
                  className="mt-2 border-l-2 pl-3 text-sm italic leading-relaxed text-[#9aa4b0]"
                  style={{ borderColor: `${accent}99` }}
                >
                  {card.lore}
                </p>
              </Plate>
            )}

            {/* footer / runpod flash */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#5b6470]" style={MONO}>
                FOUNDRY-OS v4.8
              </span>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#7c8794]" style={MONO}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                Powered by Runpod Flash
              </span>
            </div>
          </section>
        </div>

        {/* ── OTHER UNITS RAIL ─────────────────────────────────────────── */}
        {v.others.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-center gap-3">
              <Schematic>◤ ADJACENT BAYS // INVENTORY</Schematic>
              <span className="h-px flex-1 bg-[#23272d]" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {v.others.map((o) => (
                <div
                  key={o._id}
                  className="relative overflow-hidden"
                  style={{ clipPath: PLATE_CLIP, background: PANEL_BG }}
                >
                  <span
                    className="pointer-events-none absolute inset-[2px] z-10"
                    style={{ clipPath: PLATE_CLIP, boxShadow: "inset 0 0 0 1px #2a2f36" }}
                  />
                  <div
                    className="relative h-28 w-full"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 40%, #20252c, #0d0f12)",
                    }}
                  >
                    {o.artworkUrl ? (
                      <img src={o.artworkUrl} alt={o.name} className="h-full w-full object-cover opacity-90" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#5b6470]" style={MONO}>
                        ◫
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1" style={{ background: `repeating-linear-gradient(135deg, ${accent} 0 8px, #0D0F12 8px 16px)` }} />
                  </div>
                  <div className="px-3 py-2">
                    <p className="truncate text-[11px] font-bold uppercase tracking-wide text-[#dbe2ea]">
                      {o.name}
                    </p>
                    <span className="text-[9px] tracking-[0.2em] text-[#7c8794]" style={MONO}>
                      {(RARITY_NAME(o.rarity) || "—").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Styles />
    </Shell>
  );
}

// tiny helper so the rail doesn't need the theme map import
function RARITY_NAME(r: string) {
  return r?.replace(/_/g, " ");
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-[0.28em] text-[#6f7986]" style={MONO}>
        {label}
      </dt>
      <dd
        className="mt-0.5 text-sm font-semibold tabular-nums"
        style={{ ...MONO, color: accent ?? "#dbe2ea" }}
      >
        {value}
      </dd>
    </div>
  );
}

function Tag({
  children,
  color = "#3A4049",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{
        ...MONO,
        color: color === "#3A4049" ? "#aab4c0" : color,
        border: `1px solid ${color}`,
        background: `${color}14`,
        clipPath:
          "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)",
      }}
    >
      {children}
    </span>
  );
}

// ── SHELL: full-bleed background + bespoke header ───────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-[#dbe2ea]" style={{ background: "#0D0F12" }}>
      {/* full-bleed opaque background — covers the global blue/purple grid */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, #1a1e24 0%, #0d0f12 50%), #0D0F12",
        }}
      />
      <div className="fb-blueprint pointer-events-none fixed inset-0 -z-10 opacity-50" />

      {/* HEADER — thick gunmetal bar */}
      <header className="sticky top-0 z-30">
        <div
          className="border-b border-[#23272d]"
          style={{
            background: "linear-gradient(180deg, #1c2027, #14171b)",
            boxShadow: "0 2px 0 #0a0c0f, 0 8px 24px #000a",
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-4">
              <a
                href="/concepts"
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#8b95a1] transition-colors hover:text-[#FFB000]"
                style={MONO}
              >
                <span className="text-[#FF6B1A]">◄</span> BACK
              </a>
              <span className="h-5 w-px bg-[#3A4049]" />
              <span
                className="text-xl font-black uppercase tracking-[0.18em] text-[#F4F7FA]"
                style={{ textShadow: "0 0 16px #FF6B1A55" }}
              >
                FLASH<span style={{ color: "#FF6B1A" }}>BORN</span>
              </span>
            </div>

            {/* amber status pill */}
            <span
              className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                ...MONO,
                color: "#FFB000",
                border: "1px solid #FFB00055",
                background: "#FFB0000f",
                clipPath:
                  "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
              }}
            >
              <span className="fb-blink h-2 w-2 rounded-full" style={{ background: "#FFB000", boxShadow: "0 0 8px #FFB000" }} />
              ONLINE / GRID-LINK
            </span>
          </div>
        </div>
        {/* chevron hazard underline */}
        <div
          className="h-2 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #FF6B1A 0 14px, #0D0F12 14px 28px)",
          }}
        />
      </header>

      {children}
    </div>
  );
}

function Styles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .fb-blueprint {
        background-image: radial-gradient(#2a313a 1px, transparent 1px);
        background-size: 22px 22px;
        background-position: -1px -1px;
      }
      .fb-blink {
        animation: fb-blink 1.6s steps(1, end) infinite;
      }
      @keyframes fb-blink {
        0%,
        70% {
          opacity: 1;
        }
        71%,
        100% {
          opacity: 0.25;
        }
      }
    ` }} />
  );
}
