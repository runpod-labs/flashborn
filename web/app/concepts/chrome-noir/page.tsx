"use client";

import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import { useDemoCard } from "@/app/concepts/_data";

// CHROME NOIR — brutalist monochrome editorial chrome.
// Bone/silver on deep black, ONE surgical crimson accent. Hairlines, big
// uppercase type, mono side-rail of metadata, sharp chamfered rectangles.

const MONO = { fontFamily: "var(--font-geist-mono)" };
const CRIMSON = "#FF2A2A";
const BONE = "#ECE8E1";
const SILVER = "#B8B2A7";
const INK = "#060606";
const INK2 = "#0B0B0B";

// 2px chamfer on all four corners — the signature sharp-rectangle silhouette.
const CHAMFER = "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)";

/* ---------- small primitives ---------- */

function CornerTicks() {
  // Thin crimson L-brackets on the chamfered corners.
  const base = "pointer-events-none absolute h-3 w-3";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} style={{ borderColor: CRIMSON }} />
      <span className={`${base} right-0 bottom-0 border-r border-b`} style={{ borderColor: CRIMSON }} />
    </>
  );
}

function Panel({
  children,
  className = "",
  ticks = true,
}: {
  children: React.ReactNode;
  className?: string;
  ticks?: boolean;
}) {
  return (
    <section
      className={`relative border ${className}`}
      style={{
        clipPath: CHAMFER,
        borderColor: "rgba(184,178,167,0.22)",
        background: INK2,
      }}
    >
      {ticks && <CornerTicks />}
      {children}
    </section>
  );
}

function RailRow({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b" style={{ borderColor: "rgba(184,178,167,0.12)" }}>
      <span className="text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: SILVER }}>
        {k}
      </span>
      <span
        className="text-[11px] tracking-[0.06em] text-right"
        style={{ ...MONO, color: accent ? CRIMSON : BONE }}
      >
        {v}
      </span>
    </div>
  );
}

/* ---------- page ---------- */

export default function ChromeNoirPage() {
  const v = useDemoCard();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ background: INK, color: BONE }}>
      {/* full-bleed opaque background — owns the page, kills the global grid */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            `radial-gradient(120% 80% at 50% -10%, ${INK2} 0%, ${INK} 60%)`,
        }}
      />
      {/* fine baseline column grid feel */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(184,178,167,0.05) 1px, transparent 1px)",
          backgroundSize: "calc(100% / 12) 100%",
        }}
      />
      {/* one thin animated crimson scan line */}
      <div className="cn-scan pointer-events-none fixed left-0 right-0 -z-10" />

      <style jsx global>{`
        @keyframes cn-scan-move {
          0% { transform: translateY(-10vh); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        .cn-scan {
          top: 0;
          height: 1px;
          background: ${CRIMSON};
          box-shadow: 0 0 8px 0 ${CRIMSON};
          opacity: 0;
          animation: cn-scan-move 9s linear infinite;
        }
        @keyframes cn-blink { 0%, 70% { opacity: 1; } 71%, 100% { opacity: 0.25; } }
        .cn-blink { animation: cn-blink 2.4s steps(1) infinite; }
      `}</style>

      {/* ===================== HEADER ===================== */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-7 pb-4 sm:px-10">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-semibold uppercase tracking-[0.42em]" style={{ color: BONE }}>
              FLASHBORN
            </span>
            <span className="h-3 w-px" style={{ background: SILVER }} />
            <span className="text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: SILVER }}>
              Chrome&nbsp;Noir
            </span>
          </div>
          <nav className="flex items-center gap-7 text-[10px] uppercase tracking-[0.3em]" style={MONO}>
            <Link href="/concepts" className="transition-colors hover:text-white" style={{ color: SILVER }}>
              Concepts
            </Link>
            <span className="relative pb-1" style={{ color: BONE }}>
              Card
              <span className="absolute -bottom-0.5 left-0 h-px w-full" style={{ background: CRIMSON }} />
            </span>
            <span style={{ color: SILVER }}>Grid</span>
          </nav>
        </div>
        {/* thin top rule */}
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="h-px w-full" style={{ background: "rgba(184,178,167,0.22)" }} />
        </div>
      </header>

      {/* ===================== LOADING ===================== */}
      {v.loading && (
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-5 px-6 py-40">
          <div className="cn-blink text-[10px] uppercase tracking-[0.5em]" style={{ ...MONO, color: SILVER }}>
            Resolving collectible…
          </div>
          <div className="h-px w-40" style={{ background: CRIMSON }} />
        </div>
      )}

      {/* ===================== EMPTY ===================== */}
      {!v.loading && !v.card && (
        <div className="mx-auto max-w-[1400px] px-6 py-40 sm:px-10">
          <Panel className="p-12">
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
              No published cards yet
            </p>
            <p className="mt-3 text-3xl font-semibold uppercase tracking-tight">The vault is empty.</p>
          </Panel>
        </div>
      )}

      {/* ===================== CONTENT ===================== */}
      {!v.loading && v.card && (
        <main className="relative z-10 mx-auto max-w-[1400px] px-6 pb-24 pt-10 sm:px-10">
          {/* breadcrumb / index line */}
          <div className="mb-8 flex items-center justify-between text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: SILVER }}>
            <span>
              <span style={{ color: CRIMSON }}>/</span> COLLECTIBLE
              <span className="mx-2">·</span>
              {v.faction.name}
            </span>
            <span>NO. {v.prov.serial}</span>
          </div>

          {/* asymmetric editorial grid: hero (wide) + side rail (narrow) */}
          <div className="grid grid-cols-1 gap-px lg:grid-cols-[1.55fr_0.95fr]">
            {/* ---------- LEFT: hero stage ---------- */}
            <div className="flex flex-col gap-px">
              <Panel className="overflow-hidden">
                {/* model stage header strip */}
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "rgba(184,178,167,0.16)" }}>
                  <span className="text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: SILVER }}>
                    Asset · {v.card.modelUrl ? "GLB / 3D" : "Concept"}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: CRIMSON }}>
                    ● Live
                  </span>
                </div>

                {/* the gallery stage — clean near-black, thin chrome frame */}
                <div
                  className="relative aspect-[4/5] w-full sm:aspect-[16/12]"
                  style={{
                    background:
                      "radial-gradient(80% 70% at 50% 38%, #131313 0%, #060606 78%)",
                  }}
                >
                  {/* inner thin chrome frame */}
                  <div
                    className="pointer-events-none absolute inset-6 border"
                    style={{ borderColor: "rgba(184,178,167,0.18)", clipPath: CHAMFER }}
                  />
                  {/* single crimson tick on the frame */}
                  <span className="pointer-events-none absolute left-6 top-6 h-4 w-4 border-l border-t" style={{ borderColor: CRIMSON }} />

                  {v.card.modelUrl ? (
                    <ModelViewer src={v.card.modelUrl} poster={v.card.artworkUrl ?? undefined} />
                  ) : v.card.artworkUrl ? (
                    <img
                      src={v.card.artworkUrl}
                      alt={v.card.name}
                      className="absolute inset-0 h-full w-full object-contain p-10"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
                        No asset
                      </span>
                    </div>
                  )}

                  {/* baseline mono caption inside stage */}
                  <div className="absolute bottom-5 left-8 right-8 flex items-center justify-between text-[8px] uppercase tracking-[0.3em]" style={{ ...MONO, color: SILVER }}>
                    <span>{v.card.slug}</span>
                    <span>{v.isCharacter ? v.roleLabel : v.kindLabel}</span>
                  </div>
                </div>
              </Panel>

              {/* ability + lore block under the stage */}
              <Panel className="p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-6" style={{ background: CRIMSON }} />
                  <span className="text-[9px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
                    Dossier
                  </span>
                </div>

                {v.card.abilityTitle && (
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: BONE }}>
                    {v.card.abilityTitle}
                  </h3>
                )}
                <p className="max-w-prose text-[13px] leading-relaxed" style={{ color: SILVER }}>
                  {v.card.abilityText || "No combat ability."}
                </p>

                {v.card.lore && (
                  <>
                    <div className="my-6 h-px w-full" style={{ background: "rgba(184,178,167,0.12)" }} />
                    <p
                      className="max-w-prose border-l pl-4 text-[13px] italic leading-relaxed"
                      style={{ borderColor: CRIMSON, color: "#cfcabf" }}
                    >
                      {v.card.lore}
                    </p>
                  </>
                )}
              </Panel>
            </div>

            {/* ---------- RIGHT: name + stats + provenance rail ---------- */}
            <div className="flex flex-col gap-px">
              {/* identity / NAME */}
              <Panel className="p-7">
                <div className="mb-5 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.3em]" style={MONO}>
                  <span
                    className="inline-flex items-center gap-1.5 border px-2 py-1"
                    style={{ borderColor: "rgba(184,178,167,0.25)", color: SILVER, clipPath: CHAMFER }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.faction.primary }} />
                    {v.faction.name}
                  </span>
                  <span
                    className="border px-2 py-1"
                    style={{ borderColor: "rgba(184,178,167,0.25)", color: SILVER, clipPath: CHAMFER }}
                  >
                    {v.rarity.name}
                  </span>
                  <span
                    className="border px-2 py-1"
                    style={{ borderColor: "rgba(184,178,167,0.25)", color: SILVER, clipPath: CHAMFER }}
                  >
                    {v.isCharacter ? v.roleLabel : v.kindLabel}
                  </span>
                </div>

                {/* BIG confident name */}
                <h1 className="text-[2.6rem] font-semibold uppercase leading-[0.92] tracking-[-0.02em] sm:text-[3.2rem]" style={{ color: BONE }}>
                  {v.card.name}
                </h1>
                <div className="mt-4 flex items-center gap-3">
                  <span className="h-px flex-1" style={{ background: "rgba(184,178,167,0.22)" }} />
                  <span className="text-[9px] uppercase tracking-[0.34em]" style={{ ...MONO, color: CRIMSON }}>
                    #{v.prov.serial} / {v.prov.edition}
                  </span>
                </div>
              </Panel>

              {/* STATS — large numerals separated by hairlines */}
              <Panel className="p-7">
                <span className="text-[9px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
                  Statline
                </span>
                <div className={`mt-5 grid ${v.isCharacter ? "grid-cols-3" : "grid-cols-1"}`}>
                  <Stat label="Cost" value={v.card.cost} />
                  {v.isCharacter && (
                    <>
                      <Stat label="Attack" value={v.card.attack} divider />
                      <Stat label="Health" value={v.card.health} divider />
                    </>
                  )}
                </div>
              </Panel>

              {/* KEYWORD */}
              {v.keyword && (
                <Panel className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] uppercase tracking-[0.4em]" style={{ ...MONO, color: CRIMSON }}>
                      Keyword
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: BONE }}>
                      {v.keyword.name}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed" style={{ color: SILVER }}>
                    {v.keyword.text}
                  </p>
                </Panel>
              )}

              {/* PROVENANCE — the mono data readout */}
              <Panel className="p-7">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
                    Provenance
                  </span>
                  <span className="cn-blink text-[8px] uppercase tracking-[0.34em]" style={{ ...MONO, color: CRIMSON }}>
                    Verified
                  </span>
                </div>
                <div>
                  <RailRow k="Serial" v={`#${v.prov.serial}`} accent />
                  <RailRow k="Edition" v={`${v.prov.serialNumber} of ${v.prov.edition}`} />
                  <RailRow k="Owner" v={v.prov.owner} />
                  <RailRow k="Acquired" v={v.prov.acquired} />
                  <RailRow k="Mint" v={v.prov.minted} />
                </div>
              </Panel>

              {/* powered by */}
              <div className="flex items-center justify-between px-1 pt-2 text-[8px] uppercase tracking-[0.34em]" style={{ ...MONO, color: SILVER }}>
                <span>Powered by Runpod Flash</span>
                <span style={{ color: CRIMSON }}>■</span>
              </div>
            </div>
          </div>

          {/* ---------- footer rail: more from the grid ---------- */}
          {v.others.length > 0 && (
            <div className="mt-px">
              <Panel className="p-6" ticks={false}>
                <span className="text-[9px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
                  More from the grid
                </span>
                <div className="mt-5 flex flex-wrap gap-3">
                  {v.others.map((o) => (
                    <div
                      key={o._id}
                      className="border px-3 py-2 text-[9px] uppercase tracking-[0.24em]"
                      style={{ ...MONO, borderColor: "rgba(184,178,167,0.2)", color: SILVER, clipPath: CHAMFER }}
                    >
                      {o.name}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function Stat({ label, value, divider = false }: { label: string; value: number; divider?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center px-2 ${divider ? "border-l" : ""}`}
      style={divider ? { borderColor: "rgba(184,178,167,0.18)" } : undefined}
    >
      <span className="text-[8px] uppercase tracking-[0.4em]" style={{ ...MONO, color: SILVER }}>
        {label}
      </span>
      <span className="mt-2 text-[3rem] font-semibold leading-none tracking-tight" style={{ color: BONE }}>
        {value}
      </span>
    </div>
  );
}
