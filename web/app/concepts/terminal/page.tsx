"use client";

// CONCEPT — "TERMINAL" (rebuilt): a minimal, monochrome, terminal-flavored
// card surface. The chrome is grayscale on purpose; COLOR only ever appears on
// the cards themselves (faction identity) and a single logo glyph. Generous
// space (Foundry-roomy) and a related-cards rail so the page reads as a place
// to inspect, browse and collect — not a neon poster.

import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import { FACTION_THEME, RARITY_THEME, ROLE_LABEL } from "@/lib/theme";
import { useDemoCard, type DemoCard } from "@/app/concepts/_data";

// ---- monochrome system ----
const BG = "#0a0a0b";
const STAGE = "#0c0c0e";
const LINE = "rgba(255,255,255,0.10)";
const LINE_SOFT = "rgba(255,255,255,0.05)";
const INK = "#ECECEE";
const MUTE = "#8b8b93";
const FAINT = "#62626b";
const DIM = "#3a3a41";
const MONO = { fontFamily: "var(--font-geist-mono)" } as const;

export default function TerminalConcept() {
  const v = useDemoCard();

  return (
    <div className="relative min-h-screen" style={{ background: BG, color: INK }}>
      {/* opaque neutral backdrop — covers the global blue/purple grid */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(110% 70% at 50% -10%, rgba(255,255,255,0.035), transparent 60%), ${BG}`,
        }}
      />
      {/* whisper-quiet dot grid — a workspace texture, never competes with cards */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 85%)",
        }}
      />

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(10,10,11,0.72)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE_SOFT}` }}>
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            {/* the one logo glyph carries a hint of color */}
            <span className="grid h-6 w-6 place-items-center" style={{ background: "#19E6C1", color: "#04140f", clipPath: "polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)" }}>
              <span className="text-[11px] font-black">F</span>
            </span>
            <span className="text-[13px] font-bold uppercase tracking-[0.34em]" style={{ color: INK }}>
              Flashborn
            </span>
          </Link>
          <nav className="flex items-center gap-8 text-[10px] uppercase tracking-[0.28em]" style={{ ...MONO }}>
            {["explore", "collection", "packs"].map((l, i) => (
              <Link key={l} href={`/${l}`} className="transition-colors hover:text-white" style={{ color: i === 1 ? INK : FAINT }}>
                {l}
              </Link>
            ))}
            <span className="hidden items-center gap-1.5 sm:flex" style={{ color: FAINT }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#5fcf8e" }} />
              online
            </span>
          </nav>
        </div>
      </header>

      {/* ============ COMMAND LINE ============ */}
      <div className="mx-auto max-w-[1320px] px-6 pt-8 sm:px-10">
        <div className="flex items-center gap-2 text-[12px]" style={{ ...MONO, color: FAINT }}>
          <span style={{ color: DIM }}>flashborn@grid</span>
          <span style={{ color: DIM }}>~</span>
          <span style={{ color: MUTE }}>
            inspect --card {v.card?.slug ?? "…"}
          </span>
          <span className="tm-caret inline-block h-[14px] w-[7px]" style={{ background: MUTE }} />
        </div>
      </div>

      {/* ============ STATES ============ */}
      {v.loading && (
        <div className="mx-auto max-w-[1320px] px-6 py-40 text-center sm:px-10">
          <span className="text-[11px] uppercase tracking-[0.4em]" style={{ ...MONO, color: FAINT }}>
            resolving collectible
            <span className="tm-caret">_</span>
          </span>
        </div>
      )}

      {!v.loading && !v.card && (
        <div className="mx-auto max-w-[1320px] px-6 py-40 sm:px-10">
          <div className="border p-12" style={{ borderColor: LINE }}>
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ ...MONO, color: FAINT }}>
              no published cards
            </p>
            <p className="mt-3 text-2xl" style={{ color: INK }}>The grid is empty.</p>
          </div>
        </div>
      )}

      {/* ============ CONTENT ============ */}
      {!v.loading && v.card && (
        <Body v={v} />
      )}

      {/* keyframes — plain <style> (styled-jsx breaks hydration under reactCompiler) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tm-blink { 0%,55% { opacity: 1 } 56%,100% { opacity: 0 } }
        .tm-caret { animation: tm-blink 1.1s steps(1) infinite; }
      ` }} />
    </div>
  );
}

function Body({ v }: { v: ReturnType<typeof useDemoCard> }) {
  const card = v.card!;
  const faction = v.faction;

  return (
    <>
      <main className="mx-auto max-w-[1320px] px-6 pb-20 pt-7 sm:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* ---------- HERO STAGE (the only place with color) ---------- */}
          <section>
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: "4 / 5", background: STAGE, border: `1px solid ${LINE}` }}
            >
              {/* soft faction glow — the card's identity, kept subtle */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(58% 55% at 50% 42%, ${faction.primary}26, transparent 72%)` }}
              />
              {/* top read-out row */}
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.25em]" style={{ ...MONO, color: FAINT }}>
                <span>model.glb · 3d</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: card.modelUrl ? "#5fcf8e" : DIM }} />
                  {card.modelUrl ? "live" : "static"}
                </span>
              </div>

              <div className="absolute inset-0">
                {card.modelUrl ? (
                  <ModelViewer src={card.modelUrl} poster={card.artworkUrl ?? undefined} />
                ) : card.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.artworkUrl} alt={card.name} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[11px] uppercase tracking-[0.3em]" style={{ ...MONO, color: DIM }}>
                    no asset
                  </div>
                )}
              </div>

              {/* bottom faction strip */}
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.25em]" style={{ ...MONO, color: MUTE }}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2" style={{ background: faction.primary }} />
                  {faction.name}
                </span>
                <span style={{ color: FAINT }}>{v.prov.serial} / {v.prov.edition}</span>
              </div>
            </div>
            {/* one faction-colored baseline tick — meaningful, not decorative */}
            <div className="mt-px h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${faction.primary}, transparent 55%)` }} />

            <p className="mt-4 text-[11px] leading-relaxed" style={{ ...MONO, color: FAINT }}>
              {"// "}drag to rotate · reconstructed from multiview · powered by Runpod Flash
            </p>
          </section>

          {/* ---------- INFO (monochrome) ---------- */}
          <section className="flex flex-col">
            {/* kicker */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.28em]" style={{ ...MONO, color: FAINT }}>
              <span className="flex items-center gap-1.5" style={{ color: MUTE }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: faction.primary }} />
                {faction.name}
              </span>
              <span style={{ color: DIM }}>/</span>
              <span>{v.rarity.name}</span>
              <span style={{ color: DIM }}>/</span>
              <span>{v.isCharacter ? v.roleLabel : v.kindLabel}</span>
            </div>

            {/* name */}
            <h1 className="mt-4 text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl" style={{ ...MONO, color: INK }}>
              {card.name}
            </h1>

            {/* statline */}
            <div className="mt-9 grid" style={{ gridTemplateColumns: v.isCharacter ? "repeat(3,1fr)" : "1fr", borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
              <StatCell label="Cost" value={card.cost} />
              {v.isCharacter && <StatCell label="Attack" value={card.attack} divide />}
              {v.isCharacter && <StatCell label="Health" value={card.health} divide />}
            </div>

            {/* ability */}
            <div className="mt-8">
              <Label>ability</Label>
              {card.abilityTitle && (
                <p className="mt-2 text-[15px] font-semibold" style={{ color: INK }}>{card.abilityTitle}</p>
              )}
              <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: MUTE }}>
                {card.abilityText ?? "No combat ability."}
              </p>
              {v.keyword && (
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]" style={{ ...MONO, color: INK, border: `1px solid ${LINE}` }}>
                    {v.keyword.name}
                  </span>
                  <span className="text-[13px]" style={{ color: FAINT }}>{v.keyword.text}</span>
                </div>
              )}
            </div>

            {/* lore */}
            {card.lore && (
              <p className="mt-6 border-l pl-4 text-[13px] italic leading-relaxed" style={{ borderColor: LINE, color: FAINT }}>
                {card.lore}
              </p>
            )}

            {/* provenance */}
            <div className="mt-8">
              <Label>provenance</Label>
              <dl className="mt-3">
                <Row k="serial" val={`#${v.prov.serial}`} />
                <Row k="edition" val={`${v.prov.serialNumber} of ${v.prov.edition}`} />
                <Row k="owner" val={v.prov.owner} />
                <Row k="acquired" val={v.prov.acquired} />
                <Row k="mint" val={v.prov.minted} />
              </dl>
            </div>

            {/* actions */}
            <div className="mt-9 flex flex-wrap gap-3">
              <button className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-black" style={{ ...MONO, color: INK, border: `1px solid ${LINE}` }}>
                Share
              </button>
              <Link href="/concepts" className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-white" style={{ ...MONO, color: FAINT, border: `1px solid ${LINE_SOFT}` }}>
                ← concepts
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* ============ COLLECTION RAIL ============ */}
      {v.others.length > 0 && (
        <section className="mx-auto max-w-[1320px] px-6 pb-24 sm:px-10" style={{ borderTop: `1px solid ${LINE_SOFT}` }}>
          <div className="flex items-center justify-between pt-8">
            <Label>more from the grid</Label>
            <Link href="/explore" className="text-[10px] uppercase tracking-[0.25em] transition-colors hover:text-white" style={{ ...MONO, color: FAINT }}>
              view all →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {v.others.slice(0, 6).map((o) => (
              <Thumb key={o._id} card={o} />
            ))}
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `1px solid ${LINE_SOFT}` }}>
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 text-[10px] uppercase tracking-[0.28em] sm:px-10" style={{ ...MONO, color: DIM }}>
          <span style={{ color: FAINT }}>Flashborn</span>
          <span>Powered by Runpod Flash</span>
        </div>
      </footer>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.32em]" style={{ ...MONO, color: FAINT }}>
      {"// "}{children}
    </span>
  );
}

function StatCell({ label, value, divide }: { label: string; value: number; divide?: boolean }) {
  return (
    <div className="px-5 py-5" style={divide ? { borderLeft: `1px solid ${LINE}` } : undefined}>
      <div className="text-[9px] uppercase tracking-[0.3em]" style={{ ...MONO, color: FAINT }}>{label}</div>
      <div className="mt-1.5 text-4xl font-bold tabular-nums" style={{ ...MONO, color: INK }}>
        {String(value).padStart(2, "0")}
      </div>
    </div>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
      <dt className="w-24 shrink-0 text-[10px] uppercase tracking-[0.22em]" style={{ ...MONO, color: FAINT }}>{k}</dt>
      <span className="h-px flex-1" style={{ background: `repeating-linear-gradient(90deg, ${DIM} 0 2px, transparent 2px 5px)` }} />
      <dd className="text-[12px]" style={{ ...MONO, color: INK }}>{val}</dd>
    </div>
  );
}

function Thumb({ card }: { card: DemoCard }) {
  const fc = FACTION_THEME[card.faction].primary;
  const rarity = RARITY_THEME[card.rarity].name;
  return (
    <Link href={`/c/${card.slug}`} className="group block">
      <div className="relative overflow-hidden" style={{ aspectRatio: "3 / 4", background: STAGE, border: `1px solid ${LINE}` }}>
        {card.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.artworkUrl} alt={card.name} className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" draggable={false} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 50% 40%, ${fc}22, transparent 70%)` }} />
        )}
        {/* faction tick — the meaningful color */}
        <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: fc }} />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0" style={{ background: fc }} />
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide" style={{ color: INK }}>{card.name}</span>
      </div>
      <div className="text-[9px] uppercase tracking-[0.25em]" style={{ ...MONO, color: FAINT }}>
        {rarity} · {ROLE_LABEL[card.role]}
      </div>
    </Link>
  );
}
