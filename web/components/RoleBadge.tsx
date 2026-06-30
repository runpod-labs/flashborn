import type { RoleId } from "@flashborn/shared";
import { ROLE_LABEL } from "@/lib/theme";

const ICON: Record<RoleId, string> = {
  striker: "M5 12l5-7 1 5 4-3-2 9-8-4z",
  guardian: "M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z",
  support: "M12 3v18M3 12h18M7 7l10 10M17 7L7 17",
  disruptor: "M9 3l-4 9h5l-3 9 10-12h-6l3-6z",
};

export function RoleBadge({
  role,
  className = "",
}: {
  role: RoleId;
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
        <path d={ICON[role]} />
      </svg>
      {ROLE_LABEL[role]}
    </span>
  );
}
