"use client";

import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import { useDemoCard } from "@/app/concepts/_data";

const MONO = { fontFamily: "var(--font-geist-mono)" } as const;

// Chamfered clip-paths — cut corners, never rounded.
const CLIP_PANEL =
  "polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";
const CLIP_HERO =
  "polygon(0 28px, 28px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 28px), calc(100% - 28px) 100%, 28px 100%, 0 calc(100% - 28px))";
const CLIP_CHIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)";

// Yellow L-shaped corner brackets for the hero frame.
function Brackets() {
  const c = "#FCEE0A";
  const len = 26;
  const w = 2;
  return (
    <>
      {/* top-left */}
      <span className="pointer-events-none absolute left-2 top-2 z-30" aria-hidden>
        <span className="absolute" style={{ width: len, height: w, background: c }} />
        <span className="absolute" style={{ width: w, height: len, background: c }} />
      </span>
      {/* top-right */}
      <span className="pointer-events-none absolute right-2 top-2 z-30" aria-hidden>
        <span className="absolute right-0" style={{ width: len, height: w, background: c }} />
        <span className="absolute right-0" style={{ width: w, height: len, background: c }} />
      </span>
      {/* bottom-left */}
      <span className="pointer-events-none absolute bottom-2 left-2 z-30" aria-hidden>
        <span className="absolute bottom-0" style={{ width: len, height: w, background: c }} />
        <span className="absolute bottom-0" style={{ width: w, height: len, background: c }} />
      </span>
      {/* bottom-right */}
      <span className="pointer-events-none absolute bottom-2 right-2 z-30" aria-hidden>
        <span className="absolute bottom-0 right-0" style={{ width: len, height: w, background: c }} />
        <span className="absolute bottom-0 right-0" style={{ width: w, height: len, background: c }} />
      </span>
    </>
  );
}

export default function NightCityConcept() {
  const v = useDemoCard();

  return (
    <div className="nc relative min-h-screen w-full overflow-hidden bg-[#050505] text-[#EDEDED]">
      {/* full-bleed opaque background — kills the global blue grid */}
      <div className="fixed inset-0 -z-10 bg-[#050505]" aria-hidden>
        <div className="absolute inset-0 nc-hazard-bg" />
        <div className="absolute inset-0 nc-vignette" />
      </div>

      {/* ===== HEADER ===== */}
      <header className="relative z-20 border-b border-[#FCEE0A]/30 bg-[#050505]">
        {/* hazard stripe along the very top */}
        <div className="h-1.5 w-full nc-stripe" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-5">
            <Link
              href="/concepts"
              className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#9a9a9a] transition-colors hover:text-[#FCEE0A]"
              style={MONO}
            >
              <span className="text-[#FCEE0A]">{"<<"}</span>
              <span>back</span>
            </Link>
            <div className="hidden h-5 w-px bg-[#FCEE0A]/30 sm:block" />
            <span className="text-lg font-black uppercase tracking-[0.18em]">
              FLASH<span className="text-[#FCEE0A]">BORN</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="hidden text-[10px] uppercase tracking-[0.3em] text-[#5e5e5e] md:inline"
              style={MONO}
            >
              // wake up, samurai
            </span>
            <button
              type="button"
              className="bg-[#FCEE0A] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#050505] transition-transform hover:-translate-y-px active:translate-y-0"
              style={{ ...MONO, clipPath: CLIP_CHIP }}
            >
              jack in
            </button>
          </div>
        </div>
      </header>

      {/* ===== LOADING ===== */}
      {v.loading && (
        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <div className="nc-stripe h-2 w-48" />
          <span
            className="animate-pulse text-[12px] uppercase tracking-[0.4em] text-[#FCEE0A]"
            style={MONO}
          >
            // breaching grid...
          </span>
        </div>
      )}

      {/* ===== EMPTY ===== */}
      {!v.loading && !v.card && (
        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div
            className="border border-[#FF003C]/60 bg-[#101012] px-8 py-6"
            style={{ clipPath: CLIP_PANEL }}
          >
            <p className="text-[#FF003C]" style={MONO}>
              // ERR_NO_SIGNAL
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[#9a9a9a]">
              No published cards yet
            </p>
          </div>
        </div>
      )}

      {/* ===== CONTENT ===== */}
      {!v.loading && v.card && (
        <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-8">
          {/* breadcrumb readout */}
          <div
            className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.25em] text-[#5e5e5e]"
            style={MONO}
          >
            <span>// the_grid</span>
            <span className="text-[#FCEE0A]">/</span>
            <span>{v.faction.name}</span>
            <span className="text-[#FCEE0A]">/</span>
            <span className="text-[#EDEDED]">{v.card.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* ===== HERO (3D) ===== */}
            <section className="relative">
              <div
                className="relative aspect-[4/5] w-full border border-[#FCEE0A]/40 bg-[#0A0A0A]"
                style={{ clipPath: CLIP_HERO }}
              >
                <Brackets />

                {/* the asset */}
                <div className="absolute inset-0">
                  {v.card.modelUrl ? (
                    <ModelViewer
                      src={v.card.modelUrl}
                      poster={v.card.artworkUrl ?? undefined}
                    />
                  ) : v.card.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.card.artworkUrl}
                      alt={v.card.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]">
                      <span
                        className="text-[11px] uppercase tracking-[0.3em] text-[#5e5e5e]"
                        style={MONO}
                      >
                        // no_asset
                      </span>
                    </div>
                  )}
                </div>

                {/* scanline overlay */}
                <div className="pointer-events-none absolute inset-0 z-20 nc-scanlines" />

                {/* faction dot — tiny secondary accent only */}
                <div
                  className="absolute left-5 top-5 z-30 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#cfcfcf]"
                  style={MONO}
                >
                  <span
                    className="inline-block h-2 w-2"
                    style={{ background: v.faction.primary }}
                  />
                  <span>{v.faction.name}</span>
                </div>

                {/* serial overlay */}
                <div
                  className="absolute bottom-5 right-5 z-30 text-right text-[10px] uppercase tracking-[0.25em] text-[#FCEE0A]"
                  style={MONO}
                >
                  #{v.prov.serial}
                  <span className="text-[#5e5e5e]"> / {v.prov.edition}</span>
                </div>
              </div>

              {/* hazard divider under hero */}
              <div className="nc-stripe mt-4 h-2 w-full" />
            </section>

            {/* ===== INFO COLUMN ===== */}
            <section className="flex flex-col gap-5">
              {/* chips: faction / rarity / role-or-kind */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="bg-[#FCEE0A] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#050505]"
                  style={{ ...MONO, clipPath: CLIP_CHIP }}
                >
                  {v.rarity.name}
                </span>
                <span
                  className="border border-[#FCEE0A]/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCEE0A]"
                  style={{ ...MONO, clipPath: CLIP_CHIP }}
                >
                  {v.isCharacter ? v.roleLabel : v.kindLabel}
                </span>
                <span
                  className="border border-[#3a3a3a] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#9a9a9a]"
                  style={{ ...MONO, clipPath: CLIP_CHIP }}
                >
                  {v.faction.name}
                </span>
              </div>

              {/* NAME — glitch centerpiece */}
              <h1
                className="nc-glitch text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
                data-text={v.card.name}
              >
                {v.card.name}
              </h1>

              {/* STATS */}
              <div className="flex flex-wrap gap-3">
                <StatTile label="cost" value={v.card.cost} filled />
                {v.isCharacter && (
                  <>
                    <StatTile label="atk" value={v.card.attack} />
                    <StatTile label="hp" value={v.card.health} />
                  </>
                )}
              </div>

              {/* KEYWORD */}
              {v.keyword && (
                <div
                  className="border border-[#00F0FF]/40 bg-[#101012] p-4"
                  style={{ clipPath: CLIP_PANEL }}
                >
                  <div
                    className="mb-1 text-[10px] uppercase tracking-[0.3em] text-[#00F0FF]"
                    style={MONO}
                  >
                    // keyword
                  </div>
                  <div className="text-sm font-bold uppercase tracking-[0.15em] text-[#EDEDED]">
                    {v.keyword.name}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#9a9a9a]">
                    {v.keyword.text}
                  </p>
                </div>
              )}

              {/* ABILITY */}
              <div
                className="border border-[#FCEE0A]/30 bg-[#101012] p-4"
                style={{ clipPath: CLIP_PANEL }}
              >
                <div
                  className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#FCEE0A]"
                  style={MONO}
                >
                  <span className="nc-stripe inline-block h-3 w-3" />
                  // ability
                </div>
                {v.card.abilityTitle && (
                  <div className="text-sm font-bold uppercase tracking-[0.15em] text-[#FCEE0A]">
                    {v.card.abilityTitle}
                  </div>
                )}
                <p className="mt-1 text-sm leading-relaxed text-[#cfcfcf]">
                  {v.card.abilityText || "No combat ability."}
                </p>
              </div>

              {/* LORE */}
              {v.card.lore && (
                <div className="relative border-l-2 border-[#FCEE0A] bg-[#0A0A0A]/60 py-2 pl-4">
                  <p className="text-sm italic leading-relaxed text-[#8a8a8a]">
                    {v.card.lore}
                  </p>
                </div>
              )}

              {/* PROVENANCE — data readout */}
              <div
                className="border border-[#FCEE0A]/30 bg-[#101012]"
                style={{ clipPath: CLIP_PANEL }}
              >
                <div className="nc-stripe h-1.5 w-full" />
                <div className="p-4">
                  <div
                    className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#FCEE0A]"
                    style={MONO}
                  >
                    // provenance.dat
                  </div>
                  <dl
                    className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]"
                    style={MONO}
                  >
                    <Row k="serial" val={`#${v.prov.serial}`} />
                    <Row k="edition" val={`${v.prov.edition}`} />
                    <Row k="owner" val={v.prov.owner} accent />
                    <Row k="acquired" val={v.prov.acquired} />
                    <Row k="mint" val={v.prov.minted} span />
                  </dl>
                </div>
              </div>

              {/* powered by */}
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#5e5e5e]"
                style={MONO}
              >
                // powered by <span className="text-[#FCEE0A]">Runpod Flash</span>
              </div>
            </section>
          </div>
        </main>
      )}

      {/* ===== component-scoped CSS ===== */}
      <style jsx global>{`
        .nc-stripe {
          background: repeating-linear-gradient(
            45deg,
            #fcee0a 0 10px,
            #050505 10px 20px
          );
        }
        .nc-hazard-bg {
          background-image: repeating-linear-gradient(
            45deg,
            rgba(252, 238, 10, 0.025) 0 2px,
            transparent 2px 26px
          );
        }
        .nc-vignette {
          background: radial-gradient(
            120% 90% at 50% 0%,
            rgba(252, 238, 10, 0.05),
            transparent 55%
          );
        }
        .nc-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0 2px,
            rgba(0, 0, 0, 0.28) 2px 4px
          );
          mix-blend-mode: multiply;
        }
        .nc-glitch {
          position: relative;
          color: #ffffff;
          text-shadow:
            -1.5px 0 rgba(255, 0, 60, 0.55),
            1.5px 0 rgba(0, 240, 255, 0.55);
          animation: nc-skew 6s infinite steps(1);
        }
        @keyframes nc-skew {
          0%, 92%, 100% {
            transform: skewX(0deg);
            text-shadow:
              -1.5px 0 rgba(255, 0, 60, 0.55),
              1.5px 0 rgba(0, 240, 255, 0.55);
          }
          93% {
            transform: skewX(-3deg);
            text-shadow:
              -3px 0 rgba(255, 0, 60, 0.85),
              3px 0 rgba(0, 240, 255, 0.85);
          }
          95% {
            transform: skewX(2deg);
          }
          97% {
            transform: skewX(-1deg);
            text-shadow:
              -2px 0 rgba(255, 0, 60, 0.7),
              2px 0 rgba(0, 240, 255, 0.7);
          }
        }
      `}</style>
    </div>
  );
}

/* ---- stat tile ---- */
function StatTile({
  label,
  value,
  filled = false,
}: {
  label: string;
  value: number;
  filled?: boolean;
}) {
  const clip =
    "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)";
  return (
    <div
      className="flex min-w-[78px] flex-col items-center px-4 py-2"
      style={{
        clipPath: clip,
        background: filled ? "#FCEE0A" : "transparent",
        border: filled ? "none" : "1px solid rgba(252,238,10,0.5)",
      }}
    >
      <span
        className="text-3xl font-black tabular-nums"
        style={{ color: filled ? "#050505" : "#FCEE0A" }}
      >
        {value}
      </span>
      <span
        className="text-[9px] uppercase tracking-[0.3em]"
        style={{ ...MONO, color: filled ? "#050505" : "#9a9a9a" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ---- provenance row ---- */
function Row({
  k,
  val,
  accent = false,
  span = false,
}: {
  k: string;
  val: string;
  accent?: boolean;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <dt className="text-[9px] uppercase tracking-[0.25em] text-[#5e5e5e]">
        // {k}
      </dt>
      <dd
        className="mt-0.5 truncate text-[13px]"
        style={{ color: accent ? "#FCEE0A" : "#EDEDED" }}
      >
        {val}
      </dd>
    </div>
  );
}
