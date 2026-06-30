"use client";

import Link from "next/link";
import type { PackCard } from "./PackReveal";
import { FACTION_THEME, RARITY_THEME } from "@/lib/theme";

/** Compact post-reveal recap row of all 5 cards. */
export default function PackSummary({ cards }: { cards: PackCard[] }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-3">
      {cards.map((c) => {
        const f = FACTION_THEME[c.faction];
        const r = RARITY_THEME[c.rarity];
        return (
          <Link
            key={c.ownedId}
            href={`/card/${c.publicId}`}
            className="group relative flex w-[150px] items-center gap-2.5 overflow-hidden rounded-lg panel p-2.5 transition-transform hover:-translate-y-1"
          >
            <span
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: f.gradient }}
            />
            <div
              className="h-12 w-12 shrink-0 overflow-hidden rounded-md"
              style={{ boxShadow: `inset 0 0 0 1px ${f.primary}66` }}
            >
              {c.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.artworkUrl}
                  alt={c.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" style={{ background: f.gradient, opacity: 0.4 }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-grid-fg">{c.name}</p>
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider ${r.holo ? "holo-text" : ""}`}
                style={r.holo ? undefined : { color: r.color }}
              >
                {r.name}
              </p>
              <p className="text-[10px] text-faint">#{c.serialNumber}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
