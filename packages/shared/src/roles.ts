/**
 * Combat roles. Every unit belongs to one faction and has exactly one role.
 * The silhouette cues feed the image worker prompt builder.
 */

export const ROLES = ["striker", "guardian", "support", "disruptor"] as const;

export type RoleId = (typeof ROLES)[number];

export interface RoleDef {
  id: RoleId;
  name: string;
  purpose: string;
  silhouette: string[];
}

export const ROLE_DEFS: Record<RoleId, RoleDef> = {
  striker: {
    id: "striker",
    name: "Striker",
    purpose: "Aggressive damage dealer. Usually high attack and lower health. Frequently uses Rush or Overclock.",
    silhouette: [
      "lean or athletic silhouette",
      "forward movement",
      "blades, claws, firearms, or offensive equipment",
      "aggressive stance",
    ],
  },
  guardian: {
    id: "guardian",
    name: "Guardian",
    purpose: "Protects other units. High health. Uses Guard, Shield, or damage reduction.",
    silhouette: [
      "large silhouette",
      "heavy armor",
      "shield, barrier, or defensive equipment",
      "stable planted stance",
    ],
  },
  support: {
    id: "support",
    name: "Support",
    purpose: "Repairs, heals, buffs, reduces costs, or creates utility units.",
    silhouette: [
      "tools",
      "drones",
      "holographic controls",
      "repair equipment",
      "less aggressive pose",
    ],
  },
  disruptor: {
    id: "disruptor",
    name: "Disruptor",
    purpose: "Weakens, stuns, manipulates, or interferes with enemy units.",
    silhouette: [
      "unusual silhouette",
      "glitches or energy distortion",
      "asymmetry",
      "strange technical or supernatural equipment",
    ],
  },
};
