# Flashborn — Project Canon (read this first)

This file is the **single source of truth** for what Flashborn is and the rules
we must never break. If something here conflicts with code, the code is wrong.
The full product brief lives in `PLAN.md`; the machine-readable game data lives
in `packages/shared`.

> **Spelling:** It is **"Runpod"** — never "RunPod". Always.

---

## 1. What we're building

A cyberpunk **3D collectible-card platform** powered by **Runpod Flash**. Every
card starts as an AI-generated character and becomes an interactive 3D
collectible. Admins use **The Forge** to generate → review → convert to 3D →
configure → publish. Players open booster packs, collect, rotate cards in 3D,
and share owned cards via public URLs.

**The whole point:** Runpod Flash turns locally written Python generation code
into a live GPU content pipeline (concept → multiview → 3D → published
collectible) **without building/redeploying Docker images.**

There is **no playable battle** in the hackathon — but every card already stores
the data the future game needs.

### The vertical slice that defines success
concept generate → select → multiview → 3D model (rotatable in browser) →
configure stats → publish → player opens pack → collection → public `/card/{id}`
showing the 3D asset, info, owner, serial. **A polished end-to-end flow beats
many half-features.**

---

## 2. The world — The Grid

A cyberpunk megacity where physical infrastructure and digital systems merged.
Neon, chrome, glass, cables, compute-core/network motifs. Technological and
compute-inspired — but **not** every character must literally be a GPU/server.

Visual language across ALL assets: cyberpunk, dark environments, strong neon
accents, holographic interfaces, premium collectible presentation, **clear
character silhouettes**, detailed but not chaotic, suitable for multiview + 3D
reconstruction. **It must never look like unrelated AI images.**

---

## 3. Factions (4) — color identity is sacred

Faction identity must always read **stronger than** rarity identity.

| Faction | Identity | Gameplay | Colors | Frame |
|---|---|---|---|---|
| **Kernel Guard** | Corporate security, armored defenders, mechs | Defense, shields, guard, damage reduction, high health | Electric blue `#4DA3FF`, Ice white `#EAF6FF`, Steel gray `#75869A` | Blue/white glow |
| **Overclock Syndicate** | Illegal augments, street gangs, cyber-beasts, unstable reactors | High attack, rush, temp power, self-damage, risky aggression | Reactor red `#FF3347`, Heat orange `#FF8A00`, Gunmetal `#1B1D22` | Red/orange heat |
| **Patchrunners** | Hackers, engineers, med-techs, drone pilots, couriers | Buffs, healing, efficiency, drones, utility | Signal teal `#19E6C1`, Warning yellow `#FFD447`, Utility gray `#66717E` | Teal/yellow tech |
| **Ghostware** | Corrupted AI, digital phantoms, parasites, unstable entities | Stuns, debuffs, attack reduction, death effects, disruption | Spectral violet `#8B5CF6`, Corrupt magenta `#FF3DBB`, Void black `#0A0612` | Violet/magenta glitch |

Canonical data + visual-language cues: `packages/shared/src/factions.ts`.

---

## 4. Roles (4) & Rarities (4)

**Roles** (one per unit) — drive silhouette: **Striker** (aggressive, lean,
blades/claws), **Guardian** (large, armored, shields), **Support** (tools,
drones, holo controls, non-aggressive), **Disruptor** (unusual, asymmetric,
glitchy). Use a small role badge, never a full frame change.

**Rarities** — affect pack odds, frame treatment, design complexity, visual
effects — **not raw stat power.** Common (simple) · Uncommon (more detail) ·
Rare (distinctive, illuminated trim) · Legendary (centerpiece, holographic).

Data: `packages/shared/src/roles.ts`, `rarities.ts`.

---

## 5. Keywords (stored, not executed this hackathon)

Guard · Shield · Rush · Stun · Spawn · Overclock — see
`packages/shared/src/keywords.ts`. Every unit has cost, attack, health, one
predefined ability, optional keyword. **Stats/abilities are static per card
definition — never randomized on open/play.**

---

## 6. Future game (data must support, don't build)

2 players, 20 Core Integrity, **three board channels**, units attack the
opposing-channel unit or the Core. Resource = **Cycles** (start 1 max, +1/turn,
refill each turn, cap 10). No resource cards. Card types: **Unit** (built now,
gets art+3D), **Command** & **Relic** (defined, no 3D, not built).

---

## 7. Starter set — 20 units (5 per faction)

Source of truth: `packages/shared/src/cards.ts` (`STARTER_SET`). Asset
generation priority (best demo first): **Aegis Prime → Riot Daemon → Patch Queen
Nyra → Void Kernel** (the four Legendaries) → Rares → Uncommons → Commons.

---

## 8. Economy

300 starter credits · pack = 100 credits · free 100 credits / 6h (computed from
`lastFreeClaim`, no cron). Pack = 5 cards: **3 Common + 1 Uncommon + 1 wildcard**
(wildcard: 70% Uncommon / 25% Rare / 5% Legendary — `WILDCARD_ODDS`). If too few
published cards for clean distribution, **degrade gracefully, never block.**

---

## 9. Architecture & hard technical rules

- **Monorepo:** `web/` (Next.js + React + Convex), `workers/image` (HiDream
  text→image, Flash), `workers/3d` (Hunyuan3D multiview→GLB, Flash),
  `packages/shared` (TS canon).
- **Auth:** Convex Auth (Clerk deferred).
- **Storage:** **Convex storage** for all assets (images + GLBs). No external
  non-Runpod-compliant storage. Convex holds URLs/metadata/job state — never
  large binaries in normal fields.
- **Flash usage:** **`flash dev` ONLY — never `flash deploy`** (deploy has a
  known container-start bug; dev is faster and runs on real GPUs). Consequence:
  **generation is orchestrated from local Next.js server routes** (Convex cloud
  cannot reach the localhost `flash dev` server). Browser/Next route → local
  `flash dev` → remote GPU → results written to Convex.
- **Workers were renamed** to `flashborn-*` endpoints + volumes so we don't
  share the originals. We do NOT edit the workers' generation logic.
  - Image worker gotcha: don't touch scheduler/timesteps/noise (speckle).
  - 3D worker gotchas: decimate ≤40k faces before texture; pymeshlab patched;
    must run `{"action":"build"}` once before infer. See `workers/3d/HACKATHON.md`.
- **Vercel:** project `flashborn` under the `runpod` team; Convex provisioned via
  the Vercel→Convex marketplace integration (resource `convex-copper-drum`).

---

## 10. Failure handling (every generation stage)

States: pending · running · completed · failed · retry. Preserve successful
outputs when a later stage fails. Admin can return to an earlier stage without
deleting the project. Show useful errors to admins, not to players.

---

## 11. Out of scope (do NOT build)

PvP/gameplay, trading, marketplace, real-money, blockchain/NFT, matchmaking,
chat, deck validation, balancing tools, combat animation, content beyond the
required set. Trading especially — it drags in offers/locking/notifications.

---

## 12. Image style strategy (keep all art coherent)

Every concept prompt is assembled from a **fixed style spine** + per-faction
colors/materials + per-role silhouette + rarity complexity + the character
description, with negative prompts and seed control. The builder lives in the
web app (`web/lib/prompt`), driven by `packages/shared`. Style spine, in short:
*full-body single centered character, premium cyberpunk collectible card concept
art, controlled neutral/dark studio background, strong neon rim light in faction
colors, clean readable silhouette, crisp PBR materials, suitable for consistent
multiview + 3D reconstruction.* Negatives: cropped limbs, busy scenes, multiple
characters, body-covering particles, unclear anatomy, silhouette-obscuring
weapons, thin disconnected pieces.
