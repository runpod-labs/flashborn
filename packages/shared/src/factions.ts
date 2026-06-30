/**
 * Flashborn factions — color identity, visual language, and gameplay direction.
 * These definitions feed both the UI (frame treatment) and the image worker
 * prompt builder (faction colors + material language).
 */

export const FACTIONS = ["kernel_guard", "overclock_syndicate", "patchrunners", "ghostware"] as const;

export type FactionId = (typeof FACTIONS)[number];

export interface FactionDef {
  id: FactionId;
  name: string;
  identity: string;
  gameplay: string;
  /** Visual language cues injected into the generation prompt. */
  visualLanguage: string[];
  /** Hex colors, ordered primary first. */
  colors: { name: string; hex: string }[];
  /** Short phrase describing the faction icon. */
  iconDirection: string;
  /** Frame treatment description used by the card renderer. */
  frameTreatment: string;
}

export const FACTION_DEFS: Record<FactionId, FactionDef> = {
  kernel_guard: {
    id: "kernel_guard",
    name: "Kernel Guard",
    identity: "Corporate security, armored defenders, enforcement mechs, and network protectors.",
    gameplay: "Defense, shields, guard effects, damage reduction, and high health.",
    visualLanguage: [
      "clean hard-surface armor",
      "riot shields",
      "heavy protective plating",
      "corporate security markings",
      "precise symmetrical silhouettes",
      "bright internal power cores",
    ],
    colors: [
      { name: "Electric blue", hex: "#4DA3FF" },
      { name: "Ice white", hex: "#EAF6FF" },
      { name: "Steel gray", hex: "#75869A" },
    ],
    iconDirection: "Shield containing a circuit or kernel core.",
    frameTreatment: "Blue and white frame glow.",
  },
  overclock_syndicate: {
    id: "overclock_syndicate",
    name: "Overclock Syndicate",
    identity: "Illegal augmentations, street gangs, cyber-beasts, unstable reactors, and aggressive fighters.",
    gameplay: "High attack, rush, temporary power increases, self-damage, and risky aggression.",
    visualLanguage: [
      "exposed cables",
      "blades, claws, and industrial weapons",
      "heat vents",
      "reactor glow",
      "asymmetrical modifications",
      "forward-leaning aggressive silhouettes",
    ],
    colors: [
      { name: "Reactor red", hex: "#FF3347" },
      { name: "Heat orange", hex: "#FF8A00" },
      { name: "Gunmetal", hex: "#1B1D22" },
    ],
    iconDirection: "Cracked speedometer, burning processor, or lightning claw.",
    frameTreatment: "Red and orange heat treatment.",
  },
  patchrunners: {
    id: "patchrunners",
    name: "Patchrunners",
    identity: "Hackers, engineers, med-techs, drone pilots, couriers, and underground technical specialists.",
    gameplay: "Buffs, healing, resource efficiency, spawning drones, and tactical utility.",
    visualLanguage: [
      "modular equipment",
      "visors and holographic interfaces",
      "utility belts and technical tools",
      "support drones",
      "antennas and communication equipment",
      "agile or practical silhouettes",
    ],
    colors: [
      { name: "Signal teal", hex: "#19E6C1" },
      { name: "Warning yellow", hex: "#FFD447" },
      { name: "Utility gray", hex: "#66717E" },
    ],
    iconDirection: "Wrench combined with a circuit, patch symbol, or connected nodes.",
    frameTreatment: "Teal and yellow technical interface treatment.",
  },
  ghostware: {
    id: "ghostware",
    name: "Ghostware",
    identity: "Corrupted AI remnants, digital phantoms, broken memories, network parasites, and unstable entities.",
    gameplay: "Stuns, debuffs, attack reduction, death effects, copying, and disruption.",
    visualLanguage: [
      "fragmented geometry",
      "floating disconnected body parts",
      "black void materials",
      "glitch trails",
      "distorted faces and masks",
      "unnatural or asymmetrical silhouettes",
    ],
    colors: [
      { name: "Spectral violet", hex: "#8B5CF6" },
      { name: "Corrupt magenta", hex: "#FF3DBB" },
      { name: "Void black", hex: "#0A0612" },
    ],
    iconDirection: "Broken eye, corrupted mask, or fragmented data core.",
    frameTreatment: "Violet and magenta glitch treatment.",
  },
};
