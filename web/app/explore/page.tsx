"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TopNav from "@/components/TopNav";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";
import CardFilterBar, {
  EMPTY_FILTERS,
  type CardFilters,
} from "@/components/CardFilterBar";

type CardDoc = CardFrameData & {
  _id: string;
  slug: string;
};

export default function ExplorePage() {
  const [filters, setFilters] = useState<CardFilters>(EMPTY_FILTERS);

  // Pass the filters straight to Convex so the query does the work.
  const cards = useQuery(api.cards.listPublished, {
    faction: filters.faction ?? undefined,
    rarity: filters.rarity ?? undefined,
    role: filters.role ?? undefined,
  }) as CardDoc[] | undefined;

  const loading = cards === undefined;
  const list = cards ?? [];

  return (
    <>
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="text-center">
            <h1 className="font-display text-4xl font-black tracking-tight text-grid-fg sm:text-5xl">
              Explore <span className="holo-text">The Grid</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              The full Flashborn catalog. Browse every published character,
              filter by faction, rarity, and role, then dive into the 3D detail.
            </p>
          </div>

          <div className="mt-8 rounded-xl panel p-5">
            <CardFilterBar filters={filters} onChange={setFilters} />
          </div>

          {loading && (
            <div className="flex min-h-[40vh] items-center justify-center text-faint">
              <span className="text-xs uppercase tracking-[0.3em]">
                Loading catalog…
              </span>
            </div>
          )}

          {!loading && list.length === 0 && (
            <div className="mt-12 rounded-xl panel p-12 text-center">
              <p className="font-display text-lg text-grid-fg">
                {filters.faction || filters.rarity || filters.role
                  ? "No cards match these filters"
                  : "No published cards yet"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {filters.faction || filters.rarity || filters.role
                  ? "Try clearing some filters."
                  : "The Forge has not published any cards. Check back soon."}
              </p>
            </div>
          )}

          {!loading && list.length > 0 && (
            <>
              <p className="mt-8 mb-4 text-xs font-bold uppercase tracking-[0.25em] text-muted">
                {list.length} card{list.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap justify-center gap-5 sm:justify-start">
                {list.map((c) => (
                  <Link
                    key={c._id}
                    href={`/c/${c.slug}`}
                    className="transition-transform hover:-translate-y-1.5"
                  >
                    <CardFrame card={c} size="sm" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
