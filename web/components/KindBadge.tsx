import type { CardKind } from "@flashborn/shared";
import { KIND_LABEL } from "@/lib/theme";

// Icons mirror the RoleBadge stroke style. Item = cube/relic, Location = map pin.
const ICON: Record<CardKind, string> = {
  character: "M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z",
  item: "M21 7.5 12 3 3 7.5m18 0L12 12m9-4.5v9L12 21m0-9L3 7.5m9 4.5v9M3 7.5v9L12 21",
  place: "M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
};

export function KindBadge({
  kind,
  className = "",
}: {
  kind: CardKind;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-grid-fg/80 ring-1 ring-inset ring-white/10 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d={ICON[kind]} />
      </svg>
      {KIND_LABEL[kind]}
    </span>
  );
}
