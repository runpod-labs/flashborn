"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import type { FactionId, RoleId, RarityId } from "@flashborn/shared";
import { api } from "@/convex/_generated/api";
import TopNav from "@/components/TopNav";
import { ButtonLink } from "@/components/Button";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";
import CardFilterBar, {
  EMPTY_FILTERS,
  type CardFilters,
} from "@/components/CardFilterBar";
import { FACTION_THEME } from "@/lib/theme";

/** Card shape shared by listPublished + myCollection.card. */
type CardDoc = CardFrameData & {
  _id: string;
  slug: string;
};

function matches(card: CardDoc, f: CardFilters): boolean {
  if (f.faction && card.faction !== f.faction) return false;
  if (f.rarity && card.rarity !== f.rarity) return false;
  if (f.role && card.role !== f.role) return false;
  return true;
}

function LockedCard({ card }: { card: CardDoc }) {
  const theme = FACTION_THEME[card.faction];
  return (
    <div className="relative w-[210px] aspect-[5/7] select-none">
      <div className="absolute inset-0 grayscale brightness-[0.4] blur-[1px] opacity-60">
        <CardFrame card={{ ...card, name: "" }} size="sm" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-grid-bg/40">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full border text-lg"
          style={{ borderColor: `${theme.primary}66`, color: theme.primary }}
        >
          🔒
        </span>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-faint">
          Locked
        </span>
        <span className="mt-0.5 max-w-[80%] truncate text-center text-[11px] text-muted">
          {card.name}
        </span>
      </div>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-2 -top-2 z-20 rounded-full border border-neon/60 bg-grid-bg px-2 py-0.5 text-xs font-black text-neon shadow-[0_0_14px_-2px_rgba(25,230,193,0.7)]">
      x{count}
    </span>
  );
}

function CollectionView() {
  const collection = useQuery(api.collection.myCollection);
  const progress = useQuery(api.collection.collectionProgress);
  const published = useQuery(api.cards.listPublished, {});
  const [filters, setFilters] = useState<CardFilters>(EMPTY_FILTERS);

  const ownedMap = useMemo(() => {
    const m = new Map<
      string,
      { card: CardDoc; count: number; slug: string }
    >();
    for (const o of collection ?? []) {
      m.set((o.card as CardDoc)._id, {
        card: o.card as CardDoc,
        count: o.count,
        slug: (o.card as CardDoc).slug,
      });
    }
    return m;
  }, [collection]);

  const loading =
    collection === undefined ||
    progress === undefined ||
    published === undefined;

  const all = (published ?? []) as CardDoc[];
  const visible = all.filter((c) => matches(c, filters));
  const ownedVisible = visible.filter((c) => ownedMap.has(c._id));
  const lockedVisible = visible.filter((c) => !ownedMap.has(c._id));

  const owned = progress?.owned ?? 0;
  const total = progress?.total ?? 0;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black tracking-tight text-grid-fg">
            Your Collection
          </h1>
          <p className="mt-1 text-muted">
            {progress?.instances ?? 0} cards owned across {owned} of {total}{" "}
            characters.
          </p>
        </div>
        <ButtonLink href="/packs" variant="outline">
          Open a pack
        </ButtonLink>
      </div>

      {/* Completion bar */}
      <div className="mt-6 rounded-xl panel p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold uppercase tracking-wider text-muted">
            Set completion
          </span>
          <span className="font-display font-black text-neon">
            {owned}/{total} · {pct}%
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon to-neon-2 transition-all duration-700"
            style={{
              width: `${pct}%`,
              boxShadow: "0 0 16px rgba(25,230,193,0.6)",
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-xl panel p-5">
        <CardFilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center text-faint">
          <span className="text-xs uppercase tracking-[0.3em]">
            Loading collection…
          </span>
        </div>
      )}

      {/* Empty published set */}
      {!loading && all.length === 0 && (
        <div className="mt-12 rounded-xl panel p-12 text-center">
          <p className="font-display text-lg text-grid-fg">
            No published cards yet
          </p>
          <p className="mt-2 text-sm text-muted">
            The Forge has not published any cards. Check back soon.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && all.length > 0 && (
        <div className="mt-8">
          {ownedVisible.length === 0 && lockedVisible.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">
              No cards match these filters.
            </p>
          )}

          {ownedVisible.length > 0 && (
            <>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-muted">
                Owned · {ownedVisible.length}
              </h2>
              <div className="flex flex-wrap gap-5">
                {ownedVisible.map((c) => {
                  const entry = ownedMap.get(c._id)!;
                  return (
                    <Link
                      key={c._id}
                      href={`/c/${c.slug}`}
                      className="group relative transition-transform hover:-translate-y-1.5"
                    >
                      <CountBadge count={entry.count} />
                      <CardFrame card={c} size="sm" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {lockedVisible.length > 0 && (
            <>
              <h2 className="mb-4 mt-10 text-xs font-bold uppercase tracking-[0.25em] text-faint">
                Locked · {lockedVisible.length}
              </h2>
              <div className="flex flex-wrap gap-5">
                {lockedVisible.map((c) => (
                  <LockedCard key={c._id} card={c} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <>
      <TopNav />
      <main className="flex-1">
        <AuthLoading>
          <div className="flex min-h-[60vh] items-center justify-center text-faint">
            <span className="text-xs uppercase tracking-[0.3em]">Loading…</span>
          </div>
        </AuthLoading>
        <Authenticated>
          <CollectionView />
        </Authenticated>
        <Unauthenticated>
          <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
            <h1 className="font-display text-3xl font-black tracking-tight text-grid-fg">
              Sign in to view your collection
            </h1>
            <p className="mt-3 text-muted">
              Track your owned cards, completion progress, and chase the full
              set.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <ButtonLink href="/signin" size="lg" className="w-full max-w-xs">
                Sign in
              </ButtonLink>
              <Link
                href="/signin"
                className="text-sm font-medium uppercase tracking-wider text-accent hover:text-neon"
              >
                Continue as guest
              </Link>
            </div>
          </div>
        </Unauthenticated>
      </main>
    </>
  );
}
