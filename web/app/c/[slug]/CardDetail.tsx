"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Authenticated } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { FactionId, RoleId, RarityId, KeywordId } from "@flashborn/shared";
import { KEYWORD_DEFS, FACTION_DEFS } from "@flashborn/shared";
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
  const factionDef = FACTION_DEFS[card.faction];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/explore"
          className="text-xs uppercase tracking-[0.2em] text-faint transition-colors hover:text-neon"
        >
          ← Explore
        </Link>
        <ShareButton
          iconOnly
          title={`${card.name} — Flashborn`}
          text={`${card.name} — a ${r.name} ${isCharacter ? ROLE_LABEL[card.role] : KIND_LABEL[kind]} in Flashborn.`}
          accent={f.primary}
        />
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[400px_1fr]">
        {/* Interactive 3D card — it already carries the name, faction, role,
            rarity, stats and ability, so the column beside it must NOT repeat
            any of that. It holds the background context instead. */}
        <div className="flex justify-center lg:justify-start">
          <div className="sticky top-24">
            <CardFrame card={card} size="lg" interactive3d />
          </div>
        </div>

        {/* Background & reference — context you can't read off the card. */}
        <div className="flex flex-col justify-center">
          <div className="lg:max-w-md">
            {/* Faction background */}
            <h2
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: f.primary }}
            >
              {factionDef.name}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-grid-fg/85">
              {factionDef.identity}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <span className="font-semibold text-grid-fg/80">Doctrine — </span>
              {factionDef.gameplay}
            </p>

            {/* Card / character background */}
            {card.lore && (
              <div
                className="mt-7 border-l-2 pl-4"
                style={{ borderColor: `${f.primary}66` }}
              >
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-faint">
                  {isCharacter ? "Dossier" : "Background"}
                </h3>
                <p className="mt-1.5 text-sm italic leading-relaxed text-muted">
                  {card.lore}
                </p>
              </div>
            )}

            {/* Keyword rules — the card shows the tag, this explains the rule. */}
            {keywordDef && (
              <div
                className="mt-7 rounded-lg border px-4 py-3"
                style={{ borderColor: `${f.primary}55`, background: `${f.primary}10` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-faint">
                  Keyword
                </p>
                <p
                  className="mt-1 text-sm font-bold uppercase tracking-[0.15em]"
                  style={{ color: f.primary }}
                >
                  {keywordDef.name}
                </p>
                <p className="mt-1 text-sm text-muted">{keywordDef.text}</p>
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
    </div>
  );
}
