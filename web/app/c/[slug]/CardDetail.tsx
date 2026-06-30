"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Authenticated } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { FactionId, RoleId, RarityId, KeywordId } from "@flashborn/shared";
import { KEYWORD_DEFS } from "@flashborn/shared";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";
import { ButtonLink } from "@/components/Button";
import ShareButton from "@/components/ShareButton";
import { FACTION_THEME, RARITY_THEME, ROLE_LABEL, KIND_LABEL } from "@/lib/theme";

type CardDoc = CardFrameData & {
  _id: Id<"cardDefinitions">;
  slug: string;
  abilityTitle?: string | null;
  lore?: string | null;
};

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-lg border px-5 py-3"
      style={{ borderColor: `${color}55`, background: `${color}12` }}
    >
      <span className="font-display text-2xl font-black" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">
        {label}
      </span>
    </div>
  );
}

function OwnedInstances({ cardId }: { cardId: Id<"cardDefinitions"> }) {
  const instances = useQuery(api.collection.myInstances, {
    cardDefinition: cardId,
  });

  if (instances === undefined) {
    return (
      <p className="text-xs uppercase tracking-[0.2em] text-faint">
        Checking your collection…
      </p>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="rounded-lg panel p-4">
        <p className="text-sm text-muted">
          You don&apos;t own this card yet.
        </p>
        <ButtonLink href="/packs" variant="outline" size="sm" className="mt-3">
          Open a pack
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="rounded-lg panel p-4">
      <p className="text-sm font-semibold text-grid-fg">
        You own {instances.length}{" "}
        {instances.length === 1 ? "copy" : "copies"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {instances.map((inst) => (
          <Link
            key={inst.ownedId}
            href={`/card/${inst.publicId}`}
            className="rounded-md border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-neon transition-colors hover:border-neon/60 hover:bg-neon/10"
          >
            #{inst.serialNumber}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">
        Each serial links to its public showcase page.
      </p>
    </div>
  );
}

export default function CardDetail({ slug }: { slug: string }) {
  const card = useQuery(api.cards.getBySlug, { slug }) as
    | CardDoc
    | null
    | undefined;

  if (card === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-faint">
        <span className="text-xs uppercase tracking-[0.3em]">Loading card…</span>
      </div>
    );
  }

  if (card === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-black text-grid-fg">
          Card not found
        </h1>
        <p className="mt-3 text-muted">
          This card doesn&apos;t exist or hasn&apos;t been published.
        </p>
        <ButtonLink href="/explore" variant="outline" className="mt-6">
          Back to explore
        </ButtonLink>
      </div>
    );
  }

  const f = FACTION_THEME[card.faction];
  const r = RARITY_THEME[card.rarity];
  const keywordDef = card.keyword ? KEYWORD_DEFS[card.keyword] : null;
  const kind = card.kind ?? "character";
  const isCharacter = kind === "character";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/explore"
        className="text-xs uppercase tracking-[0.2em] text-faint transition-colors hover:text-neon"
      >
        ← Explore
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[400px_1fr]">
        {/* Interactive 3D card */}
        <div className="flex justify-center lg:justify-start">
          <div className="sticky top-24">
            <CardFrame card={card} size="lg" interactive3d />
            {card.modelUrl && (
              <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-faint">
                Interactive 3D collectible
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]"
            style={{ background: `${f.primary}1f`, color: f.primary }}
          >
            {f.name}
          </div>

          <h1
            className={`mt-4 font-display text-5xl font-black tracking-tight ${r.holo ? "holo-text" : ""}`}
            style={r.holo ? undefined : { color: f.secondary }}
          >
            {card.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`font-semibold uppercase tracking-wider ${r.holo ? "holo-text" : ""}`}
              style={r.holo ? undefined : { color: r.color }}
            >
              {r.name}
            </span>
            <span className="text-faint">·</span>
            <span className="text-muted">
              {isCharacter ? ROLE_LABEL[card.role] : KIND_LABEL[kind]}
            </span>
          </div>

          {/* Stats — items/places only carry an energy cost; the effect is the ability. */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Stat label="Cost" value={card.cost} color={f.secondary} />
            {isCharacter && (
              <>
                <Stat label="Attack" value={card.attack} color={f.primary} />
                <Stat label="Health" value={card.health} color={f.primary} />
              </>
            )}
          </div>

          {/* Share — this is the global, public page for this card */}
          <div className="mt-6">
            <ShareButton
              title={`${card.name} — Flashborn`}
              text={`${card.name} — a ${r.name} ${ROLE_LABEL[card.role]} from the ${f.name} faction in Flashborn.`}
              accent={f.primary}
            />
          </div>

          {/* Keyword */}
          {keywordDef && (
            <div
              className="mt-6 rounded-lg border px-4 py-3"
              style={{ borderColor: `${f.primary}55`, background: `${f.primary}10` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: f.primary }}
              >
                {keywordDef.name}
              </p>
              <p className="mt-1 text-sm text-muted">{keywordDef.text}</p>
            </div>
          )}

          {/* Ability */}
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
              Ability
            </h2>
            {card.abilityTitle && (
              <p className="mt-1 font-semibold" style={{ color: f.secondary }}>
                {card.abilityTitle}
              </p>
            )}
            <p className="mt-1 text-grid-fg/90">
              {card.abilityText ?? "No combat ability."}
            </p>
          </div>

          {/* Lore */}
          {card.lore && (
            <div className="mt-6 border-l-2 pl-4" style={{ borderColor: `${f.primary}66` }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
                Lore
              </h2>
              <p className="mt-1 text-sm italic leading-relaxed text-muted">
                {card.lore}
              </p>
            </div>
          )}

          {/* Ownership (auth only) */}
          <div className="mt-8">
            <Authenticated>
              <OwnedInstances cardId={card._id} />
            </Authenticated>
          </div>
        </div>
      </div>
    </div>
  );
}
