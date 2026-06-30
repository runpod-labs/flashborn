import type { FactionId, RoleId, RarityId } from "@flashborn/shared";

export interface Archetype {
  character: string;
  role: RoleId;
  rarity: RarityId;
}

// ~12 character archetypes per faction (5 starter visuals + extras) spanning
// roles/rarities. The batch cycles through these with varied seeds to produce
// a rich, on-style pool to choose from.
export const ARCHETYPES: Record<FactionId, Archetype[]> = {
  kernel_guard: [
    { character: "a compact armored corporate security bot with a riot shield and a glowing blue visor", role: "guardian", rarity: "common" },
    { character: "a bulky mech officer with reinforced shoulder armor and corporate security insignia", role: "guardian", rarity: "common" },
    { character: "a hovering defense drone with scanning beams and shield emitters", role: "support", rarity: "uncommon" },
    { character: "a heavy siege mech with a barrier arm and a bright internal power core", role: "guardian", rarity: "rare" },
    { character: "an elite mech commander with large neon shield wings", role: "guardian", rarity: "legendary" },
    { character: "an armored sentinel with a tall tower riot shield and a glowing kernel core chest", role: "guardian", rarity: "uncommon" },
    { character: "a sleek security enforcer android holding an energy baton", role: "striker", rarity: "common" },
    { character: "a quad-legged guardian walker mech with a dome shield projector", role: "guardian", rarity: "rare" },
    { character: "a riot-control heavy trooper in white and blue powered armor", role: "guardian", rarity: "common" },
    { character: "a firewall warden surrounded by layered hexagonal energy shields", role: "support", rarity: "rare" },
    { character: "a corporate paladin mech carrying an energy sword and shield", role: "guardian", rarity: "legendary" },
    { character: "a compact patrol drone-bot with twin stun batons", role: "striker", rarity: "common" },
  ],
  overclock_syndicate: [
    { character: "a small cable-covered cyber-beast with glowing red eyes", role: "striker", rarity: "common" },
    { character: "an augmented street fighter with blade arms", role: "striker", rarity: "common" },
    { character: "a wolf-like cyber-beast with a glowing reactor spine", role: "striker", rarity: "uncommon" },
    { character: "a massive industrial gang enforcer with hydraulic piston arms", role: "striker", rarity: "rare" },
    { character: "a demonic cyber-beast and humanoid hybrid with molten glowing neon lines", role: "striker", rarity: "legendary" },
    { character: "a feral cyborg panther with glowing orange heat vents", role: "striker", rarity: "uncommon" },
    { character: "a punk augmented brawler with an overclocked reactor backpack", role: "striker", rarity: "common" },
    { character: "a horned cyber-demon wielding twin plasma cleavers", role: "striker", rarity: "rare" },
    { character: "a scrapyard berserker mech with a spinning buzzsaw arm", role: "striker", rarity: "uncommon" },
    { character: "a lean speed-hacker assassin holding a heat-blade", role: "striker", rarity: "common" },
    { character: "a hulking reactor-powered juggernaut leaking molten energy", role: "guardian", rarity: "legendary" },
    { character: "a rabid mechanical hound pack-leader with exposed glowing wiring", role: "striker", rarity: "common" },
  ],
  patchrunners: [
    { character: "a small support drone with holographic wings", role: "support", rarity: "common" },
    { character: "a hacker courier with a visor and a cable pack", role: "support", rarity: "common" },
    { character: "a cyber medic surrounded by floating repair drones", role: "support", rarity: "uncommon" },
    { character: "an operator controlling a swarm of small drones", role: "support", rarity: "rare" },
    { character: "a hacker leader with a holographic crown and a throne-like drone formation", role: "support", rarity: "legendary" },
    { character: "an agile rooftop courier with teal light-trail skates", role: "striker", rarity: "common" },
    { character: "an engineer with a multi-tool gauntlet and an antenna backpack", role: "support", rarity: "uncommon" },
    { character: "a med-tech with a holographic healing interface and a halo of drones", role: "support", rarity: "rare" },
    { character: "a scout with deployable recon drones and a glowing visor HUD", role: "support", rarity: "common" },
    { character: "a signal hacker working at floating holographic keyboards", role: "disruptor", rarity: "uncommon" },
    { character: "a utility rigger with a cabled tool harness and bright yellow accents", role: "support", rarity: "common" },
    { character: "a drone-pilot ace with a shoulder-mounted drone launch rack", role: "support", rarity: "legendary" },
  ],
  ghostware: [
    { character: "a small floating glitch spirit made from fragmented particles", role: "disruptor", rarity: "common" },
    { character: "a humanoid phantom with a broken digital mask", role: "disruptor", rarity: "common" },
    { character: "a tall floating entity with offset limbs and motion-smear effects", role: "disruptor", rarity: "uncommon" },
    { character: "a corrupted parasite construct with data-siphoning tendrils", role: "disruptor", rarity: "rare" },
    { character: "a massive floating core entity with shattered rings and a black-violet halo", role: "disruptor", rarity: "legendary" },
    { character: "a glitching digital wraith with fragmented floating limbs", role: "disruptor", rarity: "uncommon" },
    { character: "a corrupted AI mask-spirit trailing streams of magenta code", role: "disruptor", rarity: "common" },
    { character: "a shattered hologram phantom surrounded by floating shards", role: "disruptor", rarity: "rare" },
    { character: "a void parasite with writhing tendrils of broken data", role: "disruptor", rarity: "common" },
    { character: "a distorted memory-ghost with duplicated overlapping faces", role: "disruptor", rarity: "uncommon" },
    { character: "a spectral hacker phantom dissolving into pixels", role: "striker", rarity: "common" },
    { character: "a broken sentinel AI husk leaking violet corruption", role: "guardian", rarity: "legendary" },
  ],
};
