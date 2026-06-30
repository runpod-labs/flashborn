"use client";

import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import { useDemoCard } from "@/app/concepts/_data";

const MONO = "var(--font-geist-mono)";

// phosphor palette
const BG = "#030503";
const BG2 = "#050805";
const GREEN = "#00FF66";
const DIM = "#00B347";
const SHADOW = "#073B1E";

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "pointer-events-none absolute h-3 w-3";
  const map: Record<string, { c: string; border: string }> = {
    tl: { c: "left-[-1px] top-[-1px]", border: "border-l border-t" },
    tr: { c: "right-[-1px] top-[-1px]", border: "border-r border-t" },
    bl: { c: "bottom-[-1px] left-[-1px]", border: "border-b border-l" },
    br: { c: "bottom-[-1px] right-[-1px]", border: "border-b border-r" },
  };
  const m = map[pos];
  return (
    <span
      aria-hidden
      className={`${base} ${m.c} ${m.border}`}
      style={{ borderColor: GREEN }}
    />
  );
}

function Panel({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <section
      className={`relative ${className}`}
      style={{
        border: `1px solid ${DIM}`,
        background: BG2,
        boxShadow: `inset 0 0 30px rgba(7,59,30,0.5)`,
      }}
    >
      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />
      {title ? (
        <div
          className="border-b px-3 py-1.5 text-[10px] uppercase tracking-[0.32em]"
          style={{
            fontFamily: MONO,
            color: GREEN,
            borderColor: SHADOW,
            background: "rgba(0,255,102,0.04)",
          }}
        >
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Cursor() {
  return (
    <span
      aria-hidden
      className="tm-cursor inline-block align-middle"
      style={{
        width: "0.55em",
        height: "1.05em",
        background: GREEN,
        marginLeft: "0.15em",
      }}
    />
  );
}

function Meter({
  label,
  value,
  max = 12,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const filled = Math.max(0, Math.min(10, Math.round((value / max) * 10)));
  const cells = Array.from({ length: 10 }, (_, i) => i < filled);
  return (
    <div
      className="flex items-center gap-2 text-[12px]"
      style={{ fontFamily: MONO, color: GREEN }}
    >
      <span style={{ color: DIM, width: 42, display: "inline-block" }}>
        {label}
      </span>
      <span style={{ color: SHADOW }}>▐</span>
      <span className="tracking-[0.05em]">
        {cells.map((on, i) => (
          <span key={i} style={{ color: on ? GREEN : SHADOW }}>
            {on ? "█" : "░"}
          </span>
        ))}
      </span>
      <span style={{ color: SHADOW }}>▌</span>
      <span style={{ color: GREEN }}>
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

function DataRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      className="flex items-baseline gap-2 py-0.5 text-[12px] leading-relaxed"
      style={{ fontFamily: MONO }}
    >
      <span style={{ color: DIM }}>{k}</span>
      <span
        className="flex-1 overflow-hidden whitespace-nowrap"
        style={{ color: SHADOW, letterSpacing: "0.15em" }}
        aria-hidden
      >
        ································································
      </span>
      <span style={{ color: GREEN }}>{v}</span>
    </div>
  );
}

export default function TerminalConceptPage() {
  const v = useDemoCard();

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: BG, color: GREEN, fontFamily: MONO }}
    >
      {/* full-bleed background override (covers global grid) */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: BG }}
      />
      {/* CRT scanlines + vignette */}
      <div aria-hidden className="tm-scan pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="tm-vignette pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="tm-flicker pointer-events-none fixed inset-0 -z-10" />

      {/* ===== Header: TUI menu bar ===== */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          borderColor: DIM,
          background: "rgba(3,5,3,0.92)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <nav
            className="flex flex-wrap items-center gap-1 text-[12px] uppercase tracking-[0.18em]"
            style={{ fontFamily: MONO }}
          >
            <span
              className="px-2 py-0.5"
              style={{ background: GREEN, color: BG }}
            >
              flashborn
            </span>
            <span style={{ color: SHADOW }}>▸</span>
            <span style={{ color: DIM }}>explore</span>
            <span style={{ color: SHADOW }}>▸</span>
            <span style={{ color: DIM }}>collection</span>
            <span style={{ color: SHADOW }}>▸</span>
            <span style={{ color: DIM }}>packs</span>
          </nav>
          <Link
            href="/concepts"
            className="text-[11px] uppercase tracking-[0.2em] transition-colors"
            style={{ color: GREEN }}
          >
            [ ←&nbsp;cd&nbsp;../concepts ]
          </Link>
        </div>
      </header>

      {/* ===== Terminal window ===== */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div
          className="relative"
          style={{
            border: `1px solid ${GREEN}`,
            background: BG2,
            boxShadow: `0 0 40px rgba(0,255,102,0.08), inset 0 0 60px rgba(7,59,30,0.4)`,
          }}
        >
          {/* title bar */}
          <div
            className="flex items-center justify-between border-b px-3 py-2"
            style={{ borderColor: DIM, background: "rgba(0,255,102,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ border: `1px solid ${GREEN}` }}
              />
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ border: `1px solid ${DIM}` }}
              />
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ border: `1px solid ${SHADOW}` }}
              />
            </div>
            <span
              className="text-[11px] tracking-[0.12em]"
              style={{ color: GREEN }}
            >
              card_detail.sh — root@thegrid:~
            </span>
            <span className="text-[12px]" style={{ color: GREEN }}>
              [x]
            </span>
          </div>

          {/* prompt line */}
          <div
            className="border-b px-4 py-3 text-[12px]"
            style={{ borderColor: SHADOW }}
          >
            <span style={{ color: DIM }}>root@thegrid</span>
            <span style={{ color: SHADOW }}>:</span>
            <span style={{ color: GREEN }}>~$ </span>
            <span style={{ color: GREEN }}>
              query --card {v.card?.slug ?? "<none>"} --view detail
            </span>
            <Cursor />
          </div>

          {/* body */}
          <div className="p-4 md:p-6">
            {v.loading ? (
              <Loading />
            ) : !v.card ? (
              <Empty />
            ) : (
              <Body v={v} />
            )}
          </div>

          {/* footer / status line */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ borderColor: DIM, color: DIM }}
          >
            <span>
              <span style={{ color: GREEN }}>●</span> powered by Runpod Flash
            </span>
            <span>exit 0 — pipeline: concept ▸ multiview ▸ glb ▸ published</span>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tm-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
        .tm-cursor {
          animation: tm-blink 1s steps(1) infinite;
        }
        .tm-scan {
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 255, 102, 0.05) 0px,
            rgba(0, 255, 102, 0.05) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: screen;
        }
        .tm-vignette {
          background: radial-gradient(
            ellipse at center,
            transparent 55%,
            rgba(0, 0, 0, 0.55) 100%
          );
        }
        @keyframes tm-flick {
          0%,
          97%,
          100% {
            opacity: 0;
          }
          98% {
            opacity: 0.04;
          }
          99% {
            opacity: 0.02;
          }
        }
        .tm-flicker {
          background: ${GREEN};
          animation: tm-flick 6s infinite;
          mix-blend-mode: screen;
        }
      ` }} />
    </div>
  );
}

function Loading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[13px]"
      style={{ fontFamily: MONO, color: DIM }}
    >
      <div style={{ color: GREEN }}>
        $ fetching record
        <Cursor />
      </div>
      <div style={{ color: SHADOW }}>
        ▐███████░░░░░░░░░▌ establishing uplink...
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center text-[13px]"
      style={{ fontFamily: MONO }}
    >
      <div style={{ color: GREEN }}># ERR_NO_RECORD</div>
      <div style={{ color: DIM }}>No published cards yet.</div>
      <div style={{ color: SHADOW }}>
        $ forge --publish &lt;card&gt; # then retry
      </div>
    </div>
  );
}

function Body({ v }: { v: ReturnType<typeof useDemoCard> }) {
  const card = v.card!;
  const label = v.isCharacter ? v.roleLabel : v.kindLabel;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      {/* ===== LEFT: render viewport ===== */}
      <div className="flex flex-col gap-5">
        <Panel title="[ render :: model.glb ]">
          <div
            className="relative aspect-square w-full"
            style={{ background: BG }}
          >
            {/* corner ticks inside viewport */}
            <span
              aria-hidden
              className="absolute left-2 top-2 text-[10px]"
              style={{ color: SHADOW, fontFamily: MONO }}
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute right-2 top-2 text-[10px]"
              style={{ color: SHADOW, fontFamily: MONO }}
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute bottom-2 left-2 text-[10px]"
              style={{ color: SHADOW, fontFamily: MONO }}
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute bottom-2 right-2 text-[10px]"
              style={{ color: SHADOW, fontFamily: MONO }}
            >
              +
            </span>
            {card.modelUrl ? (
              <ModelViewer
                src={card.modelUrl}
                poster={card.artworkUrl ?? undefined}
              />
            ) : card.artworkUrl ? (
              <img
                src={card.artworkUrl}
                alt={card.name}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8)" }}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-[12px]"
                style={{ color: SHADOW, fontFamily: MONO }}
              >
                [ no asset :: render buffer empty ]
              </div>
            )}
            {/* viewport readout */}
            <div
              className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-1 text-[9px] uppercase tracking-[0.2em]"
              style={{
                color: DIM,
                fontFamily: MONO,
                background: "rgba(3,5,3,0.7)",
                borderTop: `1px solid ${SHADOW}`,
              }}
            >
              <span>fps: 60</span>
              <span>{card.modelUrl ? "mode: glb/orbit" : "mode: still"}</span>
              <span>tex: pbr</span>
            </div>
          </div>
        </Panel>

        {/* classification tags */}
        <Panel title="[ classify ]">
          <div className="space-y-1 px-3 py-3">
            <DataRow k="faction" v={v.faction.name} />
            <DataRow k="rarity " v={v.rarity.name} />
            <DataRow k="class  " v={label} />
            <div
              className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: SHADOW, fontFamily: MONO }}
            >
              <span>faction.hex</span>
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ background: v.faction.primary, border: `1px solid ${SHADOW}` }}
              />
              <span style={{ color: DIM }}>{v.faction.primary}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* ===== RIGHT: data ===== */}
      <div className="flex flex-col gap-5">
        {/* name header */}
        <div>
          <div
            className="mb-1 text-[11px] uppercase tracking-[0.3em]"
            style={{ color: DIM }}
          >
            $ cat ./name.txt
          </div>
          <h1
            className="break-words text-3xl font-bold uppercase leading-none tracking-[0.08em] md:text-4xl"
            style={{
              color: GREEN,
              fontFamily: MONO,
              textShadow: `0 0 12px rgba(0,255,102,0.45)`,
            }}
          >
            {card.name}
          </h1>
          <div
            className="mt-2 text-[12px]"
            style={{ color: DIM }}
          >
            {v.faction.name} / {v.rarity.name} / {label}
            <Cursor />
          </div>
        </div>

        {/* stats */}
        <Panel title="[ stats ]">
          <div className="space-y-2 px-3 py-3">
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ fontFamily: MONO, color: GREEN }}
            >
              <span style={{ color: DIM, width: 42, display: "inline-block" }}>
                COST
              </span>
              <span style={{ color: SHADOW }}>[</span>
              <span>{String(card.cost).padStart(2, "0")}</span>
              <span style={{ color: SHADOW }}>]</span>
            </div>
            {v.isCharacter ? (
              <>
                <Meter label="ATK" value={card.attack ?? 0} />
                <Meter label="HP " value={card.health ?? 0} />
              </>
            ) : (
              <div
                className="text-[11px] uppercase tracking-[0.2em]"
                style={{ color: SHADOW, fontFamily: MONO }}
              >
                # non-combat unit — cost only
              </div>
            )}
          </div>
        </Panel>

        {/* keyword */}
        {v.keyword ? (
          <Panel title="[ keyword ]">
            <div className="px-3 py-3">
              <div
                className="mb-1 text-[13px] uppercase tracking-[0.16em]"
                style={{ color: GREEN }}
              >
                &gt; {v.keyword.name}
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: DIM }}
              >
                {v.keyword.text}
              </p>
            </div>
          </Panel>
        ) : null}

        {/* ability */}
        <Panel title="[ ability ]">
          <div className="px-3 py-3">
            {card.abilityTitle ? (
              <div
                className="mb-1 text-[13px] uppercase tracking-[0.16em]"
                style={{ color: GREEN }}
              >
                &gt; {card.abilityTitle}
              </div>
            ) : null}
            <p
              className="text-[12px] leading-relaxed"
              style={{ color: DIM }}
            >
              {card.abilityText || "No combat ability."}
            </p>
          </div>
        </Panel>

        {/* lore */}
        {card.lore ? (
          <Panel title="[ lore :: //flavor ]">
            <div className="px-3 py-3">
              <p
                className="text-[12px] italic leading-relaxed"
                style={{ color: DIM }}
              >
                {card.lore.split("\n").map((line, i) => (
                  <span key={i} className="block">
                    <span style={{ color: SHADOW }}>// </span>
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </Panel>
        ) : null}

        {/* provenance */}
        <Panel title="[ provenance :: ownership.db ]">
          <div className="space-y-0 px-3 py-3">
            <DataRow
              k="serial "
              v={`#${v.prov.serial} / ${v.prov.edition}`}
            />
            <DataRow k="edition" v={`${v.prov.edition} units`} />
            <DataRow k="owner  " v={`@${v.prov.owner}`} />
            <DataRow k="acquire" v={v.prov.acquired} />
            <DataRow k="mint   " v={v.prov.minted} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
