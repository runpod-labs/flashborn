import type { RarityId } from "@flashborn/shared";
import { RARITY_THEME } from "@/lib/theme";

export function RarityBadge({
  rarity,
  className = "",
}: {
  rarity: RarityId;
  className?: string;
}) {
  const r = RARITY_THEME[rarity];
  if (r.holo) {
    return (
      <span
        className={`holo-trim inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-grid-bg ${className}`}
      >
        {r.name}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}
      style={{
        color: r.color,
        background: `${r.color}1a`,
        boxShadow: `inset 0 0 0 1px ${r.color}55`,
      }}
    >
      {r.name}
    </span>
  );
}

/** Diamond gem rank indicator (filled pips = rarity rank). */
export function RarityGem({
  rarity,
  className = "",
}: {
  rarity: RarityId;
  className?: string;
}) {
  const r = RARITY_THEME[rarity];
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2, 3].map((i) => {
        const on = i <= r.rank;
        return (
          <span
            key={i}
            className={`h-1.5 w-1.5 rotate-45 ${on ? "" : "opacity-25"}`}
            style={{
              background: on ? r.color : "#5a6781",
              boxShadow: on && r.holo ? `0 0 6px ${r.color}` : undefined,
            }}
          />
        );
      })}
    </span>
  );
}
