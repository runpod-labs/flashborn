import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Concepts — Flashborn",
  description:
    "Four cyberpunk design directions for the Flashborn card detail page.",
};

type Concept = {
  slug: string;
  index: string;
  name: string;
  tagline: string;
  note: string;
  accent: string;
  ink: string;
  bg: string;
  swatches: string[];
};

const CONCEPTS: Concept[] = [
  {
    slug: "night-city",
    index: "01",
    name: "Night City",
    tagline: "Cyberpunk 2077 homage",
    note: "Hazard yellow on black, glitch text, scanlines, chamfered corners.",
    accent: "#FCEE0A",
    ink: "#050505",
    bg: "linear-gradient(135deg,#0a0a0a,#141400)",
    swatches: ["#FCEE0A", "#00F0FF", "#FF003C", "#0A0A0A"],
  },
  {
    slug: "terminal",
    index: "02",
    name: "Terminal",
    tagline: "Minimal monochrome",
    note: "Gray/white terminal chrome, generous space, color only on the cards. (Latest)",
    accent: "#E8E8EA",
    ink: "#0a0a0b",
    bg: "linear-gradient(135deg,#0a0a0b,#141417)",
    swatches: ["#ECECEE", "#8b8b93", "#3a3a41", "#0a0a0b"],
  },
  {
    slug: "foundry",
    index: "03",
    name: "Foundry",
    tagline: "Industrial hazard HUD",
    note: "Molten orange + gunmetal, rivets, chevrons, schematic gauges.",
    accent: "#FF6B1A",
    ink: "#0D0F12",
    bg: "linear-gradient(135deg,#0d0f12,#1a1208)",
    swatches: ["#FF6B1A", "#FFB000", "#3A4049", "#15181C"],
  },
  {
    slug: "chrome-noir",
    index: "04",
    name: "Chrome Noir",
    tagline: "Brutalist monochrome",
    note: "Bone + silver on black, one crimson accent, sharp editorial whitespace.",
    accent: "#FF2A2A",
    ink: "#060606",
    bg: "linear-gradient(135deg,#070707,#111)",
    swatches: ["#ECE8E1", "#B8B2A7", "#FF2A2A", "#060606"],
  },
];

const CLIP = "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))";

export default function ConceptsIndex() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e8e8ea]">
      {/* opaque background, covers the global blue/purple grid */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.05), transparent 60%), #050505",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-black uppercase tracking-[0.3em] text-white"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            FLASH<span className="text-white/50">BORN</span>
          </Link>
          <span
            className="text-[10px] uppercase tracking-[0.35em] text-white/40"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Design / R&amp;D
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <p
          className="text-[11px] uppercase tracking-[0.4em] text-white/40"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          // card detail · 4 directions
        </p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-white sm:text-7xl">
          Design Concepts
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/50">
          Four completely different cyberpunk treatments of the card detail page,
          each a standalone subpage — header and all. Same card, four worlds.
          Nothing in the live app changes until we pick one.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {CONCEPTS.map((c) => (
            <Link
              key={c.slug}
              href={`/concepts/${c.slug}`}
              className="group relative block overflow-hidden p-7 transition-transform duration-200 hover:-translate-y-1"
              style={{
                background: c.bg,
                clipPath: CLIP,
                boxShadow: `inset 0 0 0 1px ${c.accent}55`,
              }}
            >
              {/* corner bracket */}
              <span
                className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2"
                style={{ borderColor: c.accent }}
              />
              <div className="flex items-start justify-between gap-4">
                <span
                  className="text-xs uppercase tracking-[0.35em]"
                  style={{ fontFamily: "var(--font-geist-mono)", color: c.accent }}
                >
                  {c.index}
                </span>
                <div className="flex gap-1.5">
                  {c.swatches.map((s) => (
                    <span
                      key={s}
                      className="h-3 w-3"
                      style={{ background: s, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }}
                    />
                  ))}
                </div>
              </div>

              <h2
                className="mt-8 text-3xl font-black uppercase tracking-tight"
                style={{ color: c.accent }}
              >
                {c.name}
              </h2>
              <p
                className="mt-1 text-[11px] uppercase tracking-[0.3em] text-white/55"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {c.tagline}
              </p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
                {c.note}
              </p>

              <span
                className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: c.accent }}
              >
                View concept
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>

        <p
          className="mt-16 text-[10px] uppercase tracking-[0.35em] text-white/30"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Powered by Runpod Flash
        </p>
      </main>
    </div>
  );
}
