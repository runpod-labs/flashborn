import type { FactionId } from "@flashborn/shared";
import { FACTION_THEME } from "@/lib/theme";

const SHORT: Record<FactionId, string> = {
  kernel_guard: "KG",
  overclock_syndicate: "OS",
  patchrunners: "PR",
  ghostware: "GW",
};

export function FactionBadge({
  faction,
  showName = true,
  className = "",
}: {
  faction: FactionId;
  showName?: boolean;
  className?: string;
}) {
  const t = FACTION_THEME[faction];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${className}`}
      style={{
        color: t.primary,
        background: `${t.primary}1a`,
        boxShadow: `inset 0 0 0 1px ${t.primary}66, 0 0 12px -4px ${t.glow}`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-[3px]"
        style={{ background: t.gradient, boxShadow: `0 0 8px ${t.glow}` }}
      />
      {showName ? t.name : SHORT[faction]}
    </span>
  );
}
