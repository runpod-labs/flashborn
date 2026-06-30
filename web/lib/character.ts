/**
 * Procedural character generator for The Forge "New Character" flow.
 *
 * Produces faction-coherent names, descriptions, and full random characters so
 * an admin can spin up many candidates quickly. Everything is derived from the
 * canonical data in `@flashborn/shared` so generated content stays on-brand.
 *
 * Runs in the browser — `Math.random()` is fine here.
 */

import {
  FACTIONS,
  ROLES,
  FACTION_DEFS,
  ROLE_DEFS,
  type FactionId,
  type RoleId,
  type RarityId,
} from "@flashborn/shared";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: readonly T[], k: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < k && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

// ---- name parts (faction-flavored) ----

const NAME_PARTS: Record<
  FactionId,
  { lead: string[]; tail: string[]; callsign: string[] }
> = {
  kernel_guard: {
    lead: [
      "Aegis", "Bastion", "Bulwark", "Sentinel", "Warden", "Citadel", "Rampart",
      "Vanguard", "Paladin", "Custodian", "Ironclad", "Redoubt", "Phalanx",
      "Keystone", "Cordon", "Garrison", "Lockstep", "Praetor", "Fortify", "Mandate",
    ],
    tail: [
      "Kernel", "Protocol", "Firewall", "Checksum", "Cipher", "Quorum", "Subnet",
      "Gateway", "Failsafe", "Core", "Guard", "Shieldwall", "Edict", "Bulwark",
    ],
    callsign: ["Atlas", "Doram", "Sol", "Korr", "Vance", "Theta", "Halden"],
  },
  overclock_syndicate: {
    lead: [
      "Riot", "Havoc", "Scorch", "Nitro", "Razor", "Berserk", "Frenzy", "Magma",
      "Cinder", "Surge", "Maul", "Ravage", "Redline", "Throttle", "Backdraft",
      "Voltage", "Combust", "Wrecker", "Fang", "Blitz",
    ],
    tail: [
      "Daemon", "Reactor", "Meltdown", "Overdrive", "Afterburn", "Core", "Engine",
      "Furnace", "Spike", "Rush", "Detonator", "Coil", "Piston",
    ],
    callsign: ["Zix", "Kane", "Vyx", "Rook", "Snarl", "Ace", "Dredge"],
  },
  patchrunners: {
    lead: [
      "Patch", "Mender", "Tinker", "Relay", "Beacon", "Sprocket", "Splice",
      "Vector", "Conduit", "Tether", "Salvo", "Drift", "Quill", "Catalyst",
      "Cogwright", "Signal", "Uplink", "Rig", "Hotfix", "Bandwidth",
    ],
    tail: [
      "Runner", "Drone", "Medikit", "Rig", "Node", "Array", "Loop", "Patchwork",
      "Toolkit", "Relay", "Circuit", "Module", "Uplink",
    ],
    callsign: ["Nyra", "Pax", "Juno", "Wick", "Lin", "Echo", "Mira"],
  },
  ghostware: {
    lead: [
      "Void", "Phantom", "Specter", "Hex", "Null", "Glitch", "Revenant", "Shade",
      "Cryptid", "Banshee", "Lurker", "Mire", "Husk", "Severance", "Nilware",
      "Wraith", "Corrupt", "Static", "Hollow", "Dread",
    ],
    tail: [
      "Kernel", "Phantom", "Daemon", "Cache", "Fragment", "Echo", "Mask", "Wound",
      "Process", "Remnant", "Cipher", "Husk", "Loop",
    ],
    callsign: ["Mor", "Vex", "Sye", "Nyx", "Ghast", "Umbra", "Cael"],
  },
};

const TITLES = [
  "Prime", "Zero", "Omega", "Mk II", "Mk III", "Sigma", "Nine", "Apex", "Ultra",
];

const ROLE_TITLES: Record<RoleId, string[]> = {
  striker: ["Hunter", "Blade", "Reaver", "Slayer", "Edge"],
  guardian: ["Warden", "Bulwark", "Keeper", "Sentinel", "Shield"],
  support: ["Queen", "Medic", "Engineer", "Tactician", "Handler"],
  disruptor: ["Phantom", "Trickster", "Glitch", "Saboteur", "Specter"],
};

/** Build a single faction/role/rarity-coherent name. */
export function makeName(
  faction: FactionId,
  role: RoleId,
  rarity: RarityId,
): string {
  const p = NAME_PARTS[faction];
  const roll = Math.random();

  if (rarity === "legendary") {
    if (roll < 0.4)
      return `${pick(p.lead)} ${pick(ROLE_TITLES[role])} ${pick(p.callsign)}`;
    if (roll < 0.7) return `${pick(p.lead)} ${pick(TITLES)}`;
    return `${pick(p.lead)} ${pick(p.tail)}`;
  }
  if (rarity === "rare") {
    if (roll < 0.3) return `${pick(p.lead)} ${pick(p.callsign)}`;
    if (roll < 0.6) return `${pick(p.lead)} ${pick(TITLES)}`;
    return `${pick(p.lead)} ${pick(p.tail)}`;
  }
  // common / uncommon — simpler two-word combos
  return `${pick(p.lead)} ${pick(p.tail)}`;
}

/** A batch of unique name suggestions (does not filter taken — caller marks them). */
export function suggestNames(
  faction: FactionId,
  role: RoleId,
  rarity: RarityId,
  n: number,
): string[] {
  const out = new Set<string>();
  let guard = 0;
  while (out.size < n && guard < n * 40) {
    out.add(makeName(faction, role, rarity));
    guard++;
  }
  return [...out];
}

// ---- description / extra ----

const RARITY_FORM: Record<RarityId, string> = {
  common: "A straightforward",
  uncommon: "A well-equipped",
  rare: "A distinctive",
  legendary: "An iconic centerpiece",
};

const FACTION_NOUN: Record<FactionId, string[]> = {
  kernel_guard: [
    "security mech", "armored enforcer", "corporate sentinel",
    "shield-bearing guardian", "riot-control unit",
  ],
  overclock_syndicate: [
    "augmented brawler", "cyber-beast", "reactor-driven berserker",
    "street-gang striker", "overclocked enforcer",
  ],
  patchrunners: [
    "field engineer", "drone handler", "med-tech runner", "hacker-courier",
    "salvage technician",
  ],
  ghostware: [
    "corrupted AI phantom", "digital parasite", "glitch-born revenant",
    "unstable entity", "fragmented memory-construct",
  ],
};

const EXTRA_POOL: Record<FactionId, string[]> = {
  kernel_guard: [
    "bright internal power core", "corporate security markings",
    "precise symmetrical plating", "heavy riot shield",
  ],
  overclock_syndicate: [
    "glowing reactor vents", "exposed augment cables", "battle-worn industrial weapon",
    "asymmetrical heat scarring",
  ],
  patchrunners: [
    "holographic visor", "swarm of support drones", "utility belt of tools",
    "antenna and comms rig",
  ],
  ghostware: [
    "glitch trails", "floating fragmented limbs", "distorted mask",
    "void-black material seams",
  ],
};

/** Build a short on-brand character description. */
export function makeDescription(
  faction: FactionId,
  role: RoleId,
  rarity: RarityId,
): string {
  const fd = FACTION_DEFS[faction];
  const rd = ROLE_DEFS[role];
  const noun = pick(FACTION_NOUN[faction]);
  const cues = sample(fd.visualLanguage, 2);
  const sil = pick(rd.silhouette);
  return `${RARITY_FORM[rarity]} ${noun} — ${cues.join(", ")}, with ${sil}.`;
}

// rarity weights: lean toward common, rare legendaries
const RARITY_WEIGHTS: { rarity: RarityId; w: number }[] = [
  { rarity: "common", w: 0.4 },
  { rarity: "uncommon", w: 0.3 },
  { rarity: "rare", w: 0.2 },
  { rarity: "legendary", w: 0.1 },
];

function weightedRarity(): RarityId {
  const r = Math.random();
  let acc = 0;
  for (const { rarity, w } of RARITY_WEIGHTS) {
    acc += w;
    if (r < acc) return rarity;
  }
  return "common";
}

export interface RandomCharacter {
  workingTitle: string;
  character: string;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  extra: string;
}

/** Fully random, on-brand character. Avoids names in `taken` (lowercased). */
export function randomCharacter(taken: Set<string>): RandomCharacter {
  const faction = pick(FACTIONS);
  const role = pick(ROLES);
  const rarity = weightedRarity();

  let workingTitle = makeName(faction, role, rarity);
  let guard = 0;
  while (taken.has(workingTitle.toLowerCase()) && guard < 50) {
    workingTitle = makeName(faction, role, rarity);
    guard++;
  }

  return {
    workingTitle,
    character: makeDescription(faction, role, rarity),
    faction,
    role,
    rarity,
    extra: pick(EXTRA_POOL[faction]),
  };
}
