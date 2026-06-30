// Client-side faction/rarity visual tokens for the card frame + UI.
// Mirrors packages/shared color identity; here as ready-to-use CSS values.
import type { FactionId, RarityId, RoleId } from "@flashborn/shared";

export const FACTION_THEME: Record<
  FactionId,
  { name: string; primary: string; secondary: string; dark: string; glow: string; gradient: string }
> = {
  kernel_guard: {
    name: "Kernel Guard",
    primary: "#4DA3FF",
    secondary: "#EAF6FF",
    dark: "#0a1828",
    glow: "rgba(77,163,255,0.55)",
    gradient: "linear-gradient(135deg,#4DA3FF,#EAF6FF)",
  },
  overclock_syndicate: {
    name: "Overclock Syndicate",
    primary: "#FF3347",
    secondary: "#FF8A00",
    dark: "#1B1D22",
    glow: "rgba(255,51,71,0.55)",
    gradient: "linear-gradient(135deg,#FF3347,#FF8A00)",
  },
  patchrunners: {
    name: "Patchrunners",
    primary: "#19E6C1",
    secondary: "#FFD447",
    dark: "#07201c",
    glow: "rgba(25,230,193,0.5)",
    gradient: "linear-gradient(135deg,#19E6C1,#FFD447)",
  },
  ghostware: {
    name: "Ghostware",
    primary: "#8B5CF6",
    secondary: "#FF3DBB",
    dark: "#0A0612",
    glow: "rgba(139,92,246,0.55)",
    gradient: "linear-gradient(135deg,#8B5CF6,#FF3DBB)",
  },
};

export const RARITY_THEME: Record<
  RarityId,
  { name: string; color: string; rank: number; holo: boolean }
> = {
  common: { name: "Common", color: "#9aa7b4", rank: 0, holo: false },
  uncommon: { name: "Uncommon", color: "#46d39a", rank: 1, holo: false },
  rare: { name: "Rare", color: "#4da3ff", rank: 2, holo: false },
  legendary: { name: "Legendary", color: "#ffb347", rank: 3, holo: true },
};

export const ROLE_LABEL: Record<RoleId, string> = {
  striker: "Striker",
  guardian: "Guardian",
  support: "Support",
  disruptor: "Disruptor",
};
