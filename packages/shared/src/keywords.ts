/**
 * Initial keyword system. Stored on card definitions for the future
 * three-channel tactical game. Not executed during the hackathon.
 */

export const KEYWORDS = ["guard", "shield", "rush", "stun", "spawn", "overclock"] as const;

export type KeywordId = (typeof KEYWORDS)[number];

export interface KeywordDef {
  id: KeywordId;
  name: string;
  text: string;
}

export const KEYWORD_DEFS: Record<KeywordId, KeywordDef> = {
  guard: {
    id: "guard",
    name: "Guard",
    text: "Enemy units in the opposing channel must attack this unit before attacking the Core.",
  },
  shield: {
    id: "shield",
    name: "Shield",
    text: "Ignore the next source of damage dealt to this unit.",
  },
  rush: {
    id: "rush",
    name: "Rush",
    text: "This unit may attack on the turn it is deployed.",
  },
  stun: {
    id: "stun",
    name: "Stun",
    text: "The affected unit cannot attack during its next turn.",
  },
  spawn: {
    id: "spawn",
    name: "Spawn",
    text: "Create a smaller token unit.",
  },
  overclock: {
    id: "overclock",
    name: "Overclock",
    text: "Gain a temporary stat increase, normally until the end of the current turn.",
  },
};
