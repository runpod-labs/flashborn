import Link from "next/link";
import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  FACTION_THEME,
  RARITY_THEME,
  ROLE_LABEL,
} from "@/lib/theme";
import { KEYWORD_DEFS, type KeywordId } from "@flashborn/shared";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";
import ModelViewer from "@/components/ModelViewer";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

type OwnedCard = {
  card: CardFrameData;
  serialNumber: number;
  acquiredAt: number;
  source?: string;
  ownerName: string;
};

// Single Convex client reused by both generateMetadata and the page render.
function convex(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

async function fetchOwned(publicId: string): Promise<OwnedCard | null> {
  const client = convex();
  if (!client) return null;
  try {
    return (await client.query(api.collection.ownedByPublicId, {
      publicId,
    })) as OwnedCard | null;
  } catch {
    return null;
  }
}

function formatSerial(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Link-preview metadata (OpenGraph / Twitter).
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const owned = await fetchOwned(publicId);

  if (!owned) {
    return {
      title: "Card not found · Flashborn",
      description: "This Flashborn collectible could not be found.",
    };
  }

  const { card, serialNumber, ownerName } = owned;
  const faction = FACTION_THEME[card.faction];
  const rarity = RARITY_THEME[card.rarity];
  const title = `${card.name} — ${rarity.name} ${faction.name} · Flashborn`;
  const description = `${formatSerial(serialNumber)} owned by ${ownerName}. A ${rarity.name.toLowerCase()} ${faction.name} ${ROLE_LABEL[card.role]} 3D collectible, powered by Runpod Flash.`;
  const image = card.artworkUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Flashborn",
      ...(image ? { images: [{ url: image, alt: card.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal public header (NOT the full TopNav).
// ---------------------------------------------------------------------------
function MiniHeader() {
  return (
    <header className="relative z-20 border-b border-edge/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-black uppercase tracking-[0.2em] text-grid-fg transition-opacity hover:opacity-80"
        >
          FLASH<span className="text-neon">BORN</span>
        </Link>
        <span className="hidden text-[10px] uppercase tracking-[0.3em] text-faint sm:block">
          Public collectible
        </span>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Not-found state.
// ---------------------------------------------------------------------------
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <MiniHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="relative w-full max-w-md text-center">
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-br from-accent/20 via-neon-2/10 to-neon/10 blur-3xl" />
          <div className="relative rounded-2xl panel p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-edge bg-surface text-3xl text-accent">
              ⌀
            </div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-grid-fg">
              Card not found
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This collectible has drifted off The Grid. The link may be wrong,
              or the card was never minted.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-lg border border-neon/40 bg-neon/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-neon transition-all hover:-translate-y-0.5"
            >
              Enter Flashborn
            </Link>
          </div>
        </div>
      </main>
      <PoweredByFooter />
    </div>
  );
}

function PoweredByFooter() {
  return (
    <footer className="relative z-10 border-t border-edge/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-faint sm:flex-row sm:px-6">
        <Link
          href="/"
          className="font-display font-black uppercase tracking-[0.2em] text-muted transition-opacity hover:opacity-80"
        >
          FLASH<span className="text-neon">BORN</span>
        </Link>
        <span className="uppercase tracking-[0.2em]">
          Powered by Runpod Flash
        </span>
      </div>
    </footer>
  );
}

// A labelled stat tile for the info column.
function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-lg border bg-surface/60 px-3 py-3 text-center"
      style={{ borderColor: `${color}40` }}
    >
      <span className="font-display text-2xl font-black leading-none" style={{ color }}>
        {value}
      </span>
      <span className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-faint">
        {label}
      </span>
    </div>
  );
}

function MetaRow({
  label,
  value,
  accent,
  mono = false,
}: {
  label: string;
  value: string;
  accent?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-edge/50 py-2.5 last:border-b-0">
      <span className="text-[11px] uppercase tracking-[0.2em] text-faint">
        {label}
      </span>
      <span
        className={`text-right text-sm font-semibold text-grid-fg ${mono ? "font-mono tracking-wide" : ""}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page.
// ---------------------------------------------------------------------------
export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const owned = await fetchOwned(publicId);

  if (!owned) return <NotFound />;

  const { card, serialNumber, acquiredAt, ownerName } = owned;
  const faction = FACTION_THEME[card.faction];
  const rarity = RARITY_THEME[card.rarity];
  const has3d = !!card.modelUrl;
  const keyword = card.keyword as KeywordId | null | undefined;
  const keywordDef = keyword ? KEYWORD_DEFS[keyword] : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Faction-tinted ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(90% 60% at 50% -10%, ${faction.primary}26, transparent 65%), radial-gradient(70% 50% at 100% 100%, ${faction.glow}, transparent 60%)`,
        }}
      />

      <MiniHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Faction / rarity ribbon */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{
              color: faction.secondary,
              background: `${faction.primary}1f`,
              boxShadow: `inset 0 0 0 1px ${faction.primary}66`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: faction.primary, boxShadow: `0 0 8px ${faction.primary}` }}
            />
            {faction.name}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${rarity.holo ? "holo-text" : ""}`}
            style={
              rarity.holo
                ? { boxShadow: `inset 0 0 0 1px ${rarity.color}66` }
                : { color: rarity.color, boxShadow: `inset 0 0 0 1px ${rarity.color}66` }
            }
          >
            {rarity.name}
          </span>
          <span className="inline-flex items-center rounded-full border border-edge px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            {ROLE_LABEL[card.role]}
          </span>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ---------- HERO: 3D model or card frame ---------- */}
          <div className="flex flex-col items-center">
            {has3d ? (
              <div className="relative w-full max-w-[460px]">
                <div
                  className="pointer-events-none absolute -inset-6 rounded-3xl opacity-70 blur-2xl"
                  style={{ background: faction.gradient }}
                />
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl"
                  style={{
                    background: `linear-gradient(160deg, ${faction.dark}, #05070d 70%)`,
                    boxShadow: `inset 0 0 0 2px ${faction.primary}, inset 0 0 40px -8px ${faction.glow}, 0 24px 60px -24px ${faction.glow}`,
                  }}
                >
                  <ModelViewer
                    src={card.modelUrl!}
                    poster={card.artworkUrl ?? undefined}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center pb-3">
                    <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-grid-fg/70 backdrop-blur-sm">
                      3D collectible
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-8 rounded-full opacity-60 blur-3xl"
                  style={{ background: faction.gradient }}
                />
                <CardFrame card={card} size="lg" interactive3d={false} />
              </div>
            )}
          </div>

          {/* ---------- INFO COLUMN ---------- */}
          <div className="flex flex-col">
            <h1
              className={`font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl ${rarity.holo ? "holo-text" : ""}`}
              style={rarity.holo ? undefined : { color: faction.secondary }}
            >
              {card.name}
            </h1>

            {/* Core stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile label="Cost" value={card.cost} color={faction.primary} />
              <StatTile label="Attack" value={card.attack} color={faction.primary} />
              <StatTile label="Health" value={card.health} color={faction.primary} />
            </div>

            {/* Keyword + ability */}
            {(keywordDef || card.abilityText || card.abilityTitle) && (
              <div className="mt-6 rounded-xl panel p-4">
                {keywordDef && (
                  <span
                    className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: faction.primary, background: `${faction.primary}1f` }}
                  >
                    {keywordDef.name}
                  </span>
                )}
                {card.abilityTitle && (
                  <div className="text-sm font-semibold" style={{ color: faction.secondary }}>
                    {card.abilityTitle}
                  </div>
                )}
                {card.abilityText ? (
                  <p className="mt-1 text-sm leading-relaxed text-grid-fg/80">
                    {card.abilityText}
                  </p>
                ) : keywordDef ? (
                  <p className="mt-1 text-sm leading-relaxed text-grid-fg/70">
                    {keywordDef.text}
                  </p>
                ) : null}
              </div>
            )}

            {/* Lore */}
            {card.lore && (
              <p className="mt-5 border-l-2 pl-4 text-sm italic leading-relaxed text-muted" style={{ borderColor: `${faction.primary}66` }}>
                {card.lore}
              </p>
            )}

            {/* Ownership panel */}
            <div className="mt-7 rounded-xl panel p-5">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.3em] text-faint">
                  Owned collectible
                </span>
                <span
                  className="font-mono text-lg font-black tracking-wider"
                  style={{ color: faction.primary }}
                >
                  {formatSerial(serialNumber)}
                </span>
              </div>
              <MetaRow label="Owner" value={ownerName} accent={faction.secondary} />
              <MetaRow label="Serial" value={formatSerial(serialNumber)} mono />
              <MetaRow label="Acquired" value={formatDate(acquiredAt)} />
              <MetaRow label="Rarity" value={rarity.name} accent={rarity.color} />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ShareButton
                title={`${card.name} · Flashborn`}
                text={`Check out ${card.name} ${formatSerial(serialNumber)} — a ${rarity.name} ${faction.name} collectible on Flashborn.`}
                accent={faction.primary}
              />
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-edge px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-muted transition-all hover:-translate-y-0.5 hover:text-grid-fg"
              >
                Get your own
              </Link>
            </div>

            <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-faint">
              Powered by Runpod Flash
            </p>
          </div>
        </div>
      </main>

      <PoweredByFooter />
    </div>
  );
}
