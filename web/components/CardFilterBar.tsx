"use client";

import { FACTIONS, RARITIES, ROLES } from "@flashborn/shared";
import type { FactionId, RarityId, RoleId } from "@flashborn/shared";
import { FACTION_THEME, RARITY_THEME, ROLE_LABEL } from "@/lib/theme";

export type CardFilters = {
  faction: FactionId | null;
  rarity: RarityId | null;
  role: RoleId | null;
};

export const EMPTY_FILTERS: CardFilters = {
  faction: null,
  rarity: null,
  role: null,
};

function Chip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
        active
          ? "text-grid-bg"
          : "border-edge text-muted hover:border-neon/50 hover:text-grid-fg"
      }`}
      style={
        active
          ? {
              background: color ?? "var(--color-neon)",
              borderColor: color ?? "var(--color-neon)",
              boxShadow: `0 0 14px -2px ${color ?? "rgba(25,230,193,0.6)"}`,
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

/** Faction / rarity / role filter chips. Controlled by the parent. */
export default function CardFilterBar({
  filters,
  onChange,
}: {
  filters: CardFilters;
  onChange: (next: CardFilters) => void;
}) {
  const hasAny = filters.faction || filters.rarity || filters.role;

  function toggle<K extends keyof CardFilters>(
    key: K,
    value: CardFilters[K],
  ) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 w-16 text-[10px] font-bold uppercase tracking-[0.25em] text-faint">
          Faction
        </span>
        {FACTIONS.map((id) => (
          <Chip
            key={id}
            active={filters.faction === id}
            onClick={() => toggle("faction", id)}
            color={FACTION_THEME[id].primary}
          >
            {FACTION_THEME[id].name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 w-16 text-[10px] font-bold uppercase tracking-[0.25em] text-faint">
          Rarity
        </span>
        {RARITIES.map((id) => (
          <Chip
            key={id}
            active={filters.rarity === id}
            onClick={() => toggle("rarity", id)}
            color={RARITY_THEME[id].color}
          >
            {RARITY_THEME[id].name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 w-16 text-[10px] font-bold uppercase tracking-[0.25em] text-faint">
          Role
        </span>
        {ROLES.map((id) => (
          <Chip
            key={id}
            active={filters.role === id}
            onClick={() => toggle("role", id)}
          >
            {ROLE_LABEL[id]}
          </Chip>
        ))}
        {hasAny && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="ml-2 text-xs font-medium uppercase tracking-wider text-faint underline-offset-2 transition-colors hover:text-os hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
