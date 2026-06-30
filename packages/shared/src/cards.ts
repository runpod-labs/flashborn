/**
 * Card type definitions and the initial 20-card starter set.
 *
 * The starter set is the design source of truth for stats/abilities. Card
 * Definitions in Convex are seeded/configured from these, then enriched with
 * generated artwork + model URLs during publishing.
 */

import type { FactionId } from "./factions";
import type { RoleId } from "./roles";
import type { RarityId } from "./rarities";
import type { KeywordId } from "./keywords";

/** Card categories. Only "unit" is implemented for the hackathon. */
export const CARD_TYPES = ["unit", "command", "relic"] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** Static gameplay + identity definition for a published character type. */
export interface UnitCardDef {
  slug: string;
  name: string;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  cost: number;
  attack: number;
  health: number;
  keyword?: KeywordId;
  abilityTitle?: string;
  abilityText?: string;
  lore?: string;
  /** Short visual brief used to seed the concept-generation prompt. */
  visual: string;
}

export const STARTER_SET: UnitCardDef[] = [
  // ---------------- Kernel Guard ----------------
  {
    slug: "firewall-cadet",
    name: "Firewall Cadet",
    faction: "kernel_guard",
    role: "guardian",
    rarity: "common",
    cost: 1,
    attack: 1,
    health: 3,
    keyword: "guard",
    abilityText: "When deployed, gain Shield.",
    visual: "Compact armored security bot with a riot shield and blue visor.",
  },
  {
    slug: "channel-marshal",
    name: "Channel Marshal",
    faction: "kernel_guard",
    role: "guardian",
    rarity: "common",
    cost: 3,
    attack: 2,
    health: 5,
    keyword: "guard",
    abilityText: "Allied units in adjacent channels gain +1 Health.",
    visual: "Bulky mech officer with reinforced shoulder armor.",
  },
  {
    slug: "checksum-warden",
    name: "Checksum Warden",
    faction: "kernel_guard",
    role: "support",
    rarity: "uncommon",
    cost: 3,
    attack: 1,
    health: 4,
    abilityText: "When deployed, give another allied unit Shield.",
    visual: "Hovering defense drone with scanning beams and shield emitters.",
  },
  {
    slug: "bastion-executor",
    name: "Bastion Executor",
    faction: "kernel_guard",
    role: "guardian",
    rarity: "rare",
    cost: 5,
    attack: 4,
    health: 7,
    abilityText: "Takes one less damage from attacks.",
    visual: "Heavy siege mech with a barrier arm and bright internal core.",
  },
  {
    slug: "aegis-prime",
    name: "Aegis Prime",
    faction: "kernel_guard",
    role: "guardian",
    rarity: "legendary",
    cost: 7,
    attack: 5,
    health: 10,
    abilityText: "When deployed, all allied units gain Shield.",
    visual: "Elite mech commander with large neon shield wings.",
  },

  // ---------------- Overclock Syndicate ----------------
  {
    slug: "spark-rat",
    name: "Spark Rat",
    faction: "overclock_syndicate",
    role: "striker",
    rarity: "common",
    cost: 1,
    attack: 2,
    health: 1,
    keyword: "rush",
    visual: "Small cable-covered cyber-beast with red eyes.",
  },
  {
    slug: "alley-reaver",
    name: "Alley Reaver",
    faction: "overclock_syndicate",
    role: "striker",
    rarity: "common",
    cost: 2,
    attack: 3,
    health: 2,
    abilityText: "When attacking, gain +1 Attack for that attack.",
    visual: "Augmented street fighter with blade arms.",
  },
  {
    slug: "heatfang-runner",
    name: "Heatfang Runner",
    faction: "overclock_syndicate",
    role: "striker",
    rarity: "uncommon",
    cost: 3,
    attack: 4,
    health: 3,
    keyword: "rush",
    abilityText: "Takes one damage when deployed.",
    visual: "Wolf-like cyber-beast with a reactor spine.",
  },
  {
    slug: "overclock-brute",
    name: "Overclock Brute",
    faction: "overclock_syndicate",
    role: "striker",
    rarity: "rare",
    cost: 5,
    attack: 5,
    health: 6,
    abilityText: "Whenever this unit survives combat, gain +1 Attack.",
    visual: "Massive industrial gang enforcer with piston arms.",
  },
  {
    slug: "riot-daemon",
    name: "Riot Daemon",
    faction: "overclock_syndicate",
    role: "striker",
    rarity: "legendary",
    cost: 7,
    attack: 8,
    health: 5,
    keyword: "rush",
    abilityText: "When deployed, deal two damage to the enemy unit in this channel.",
    visual: "Demonic cyber-beast and humanoid hybrid with molten neon lines.",
  },

  // ---------------- Patchrunners ----------------
  {
    slug: "cache-pixie",
    name: "Cache Pixie",
    faction: "patchrunners",
    role: "support",
    rarity: "common",
    cost: 1,
    attack: 1,
    health: 2,
    abilityText: "When deployed, another allied unit gains +1 Attack this turn.",
    visual: "Small support drone with holographic wings.",
  },
  {
    slug: "relay-jockey",
    name: "Relay Jockey",
    faction: "patchrunners",
    role: "support",
    rarity: "common",
    cost: 2,
    attack: 2,
    health: 3,
    abilityText: "Reduce the cost of the next card played this turn by one.",
    visual: "Hacker courier with a visor and cable pack.",
  },
  {
    slug: "med-loop-engineer",
    name: "Med-Loop Engineer",
    faction: "patchrunners",
    role: "support",
    rarity: "uncommon",
    cost: 3,
    attack: 1,
    health: 4,
    abilityText: "When deployed, repair three damage from an allied unit.",
    visual: "Cyber medic surrounded by floating repair drones.",
  },
  {
    slug: "drone-shepherd",
    name: "Drone Shepherd",
    faction: "patchrunners",
    role: "support",
    rarity: "rare",
    cost: 4,
    attack: 3,
    health: 4,
    keyword: "spawn",
    abilityText: "When deployed, create a 1/1 Support Drone in another available channel.",
    visual: "Operator controlling a swarm of small drones.",
  },
  {
    slug: "patch-queen-nyra",
    name: "Patch Queen Nyra",
    faction: "patchrunners",
    role: "support",
    rarity: "legendary",
    cost: 6,
    attack: 4,
    health: 6,
    abilityText: "At the end of the owner's turn, give another allied unit +1 Attack and +1 Health.",
    visual: "Hacker leader with a holographic crown and throne-like drone formation.",
  },

  // ---------------- Ghostware ----------------
  {
    slug: "packet-wisp",
    name: "Packet Wisp",
    faction: "ghostware",
    role: "disruptor",
    rarity: "common",
    cost: 1,
    attack: 1,
    health: 1,
    abilityText: "When destroyed, deal one damage to the enemy unit in this channel.",
    visual: "Small floating glitch spirit made from fragmented particles.",
  },
  {
    slug: "null-echo",
    name: "Null Echo",
    faction: "ghostware",
    role: "disruptor",
    rarity: "common",
    cost: 2,
    attack: 2,
    health: 2,
    abilityText: "When deployed, an enemy unit loses one Attack until the next turn.",
    visual: "Humanoid phantom with a broken digital mask.",
  },
  {
    slug: "lag-specter",
    name: "Lag Specter",
    faction: "ghostware",
    role: "disruptor",
    rarity: "uncommon",
    cost: 3,
    attack: 2,
    health: 3,
    keyword: "stun",
    abilityText: "When deployed, Stun the enemy unit in this channel.",
    visual: "Tall floating entity with offset limbs and motion-smear effects.",
  },
  {
    slug: "memory-leech",
    name: "Memory Leech",
    faction: "ghostware",
    role: "disruptor",
    rarity: "rare",
    cost: 4,
    attack: 3,
    health: 5,
    abilityText: "Whenever this damages a unit, that unit permanently loses one Attack.",
    visual: "Corrupted parasite construct with data-siphoning tendrils.",
  },
  {
    slug: "void-kernel",
    name: "Void Kernel",
    faction: "ghostware",
    role: "disruptor",
    rarity: "legendary",
    cost: 7,
    attack: 5,
    health: 8,
    abilityText: "When deployed, Stun all enemy units that cost three Cycles or less.",
    visual: "Massive floating core entity with shattered rings and a black-violet halo.",
  },
];

/** Asset-generation priority order (Legendaries first for the demo). */
export const GENERATION_PRIORITY = [
  "aegis-prime",
  "riot-daemon",
  "patch-queen-nyra",
  "void-kernel",
] as const;
