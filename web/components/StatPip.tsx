type Kind = "attack" | "health" | "cost";

const STYLES: Record<
  Kind,
  { color: string; glow: string; shape: string }
> = {
  // diamond-ish for cost, blade for attack, shield for health
  cost: { color: "#ffd447", glow: "rgba(255,212,71,0.6)", shape: "" },
  attack: { color: "#ff8a00", glow: "rgba(255,138,0,0.65)", shape: "" },
  health: { color: "#46d39a", glow: "rgba(70,211,154,0.6)", shape: "" },
};

const ICON: Record<Kind, string> = {
  cost: "M12 2l2.5 7H22l-6 4.5L18.5 22 12 17l-6.5 5L8 13.5 2 9h7.5L12 2z",
  attack: "M6 18L18 6M14 4h6v6M9 15l-4 4 1 1 4-4",
  health: "M12 21C7 17 4 13.5 4 9a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 4.5-3 8-8 12z",
};

export function StatPip({
  kind,
  value,
  size = "md",
}: {
  kind: Kind;
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const s = STYLES[kind];
  const box =
    size === "lg" ? "h-12 w-12 text-2xl" : size === "sm" ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg";
  const icon = size === "lg" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span
      className={`relative inline-flex flex-col items-center justify-center rounded-full font-black leading-none ${box}`}
      style={{
        color: "#fff",
        background: `radial-gradient(circle at 30% 25%, ${s.color}cc, ${s.color}33 70%, rgba(5,7,13,0.9))`,
        boxShadow: `0 0 0 1.5px ${s.color}, 0 0 14px -2px ${s.glow}, inset 0 1px 2px rgba(255,255,255,0.35)`,
        textShadow: `0 1px 3px rgba(0,0,0,0.8)`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${icon} absolute -top-0.5 opacity-70`}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d={ICON[kind]} />
      </svg>
      {value}
    </span>
  );
}
