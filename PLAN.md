# Flashborn — Implementation Plan

Guiding principle: **build the smallest polished version that proves the complete
idea.** A single end-to-end vertical slice beats many disconnected features.

> Naming: it is **Runpod**, not "RunPod".

---

## Architecture at a glance

```
Admin (The Forge)                         Player
   │                                         │
   ▼                                         ▼
Next.js + Convex  ──orchestrates──▶  Flash image worker (concept + multiview)
   │  (data, auth, jobs, UI)         Flash 3D worker (model)
   │                                         │
   ▼                                         ▼
Convex stores asset URLs + metadata + relationships (not binaries)
   │
   ▼
Published Card Definitions ──▶ Booster packs ──▶ Owned Card Instances ──▶ Public /card/{id}
```

- **Web** (`web/`): Next.js App Router + React + Convex (data + auth). Owns the
  pipeline orchestration, prompt construction, and the browser 3D viewer.
- **Workers** (`workers/image`, `workers/3d`): Runpod Flash. Thin generation
  services. Ported from already-tested projects — not rewritten.
- **Shared** (`packages/shared`): typed vocab + starter set, consumed by web.

### Asset storage

Convex is the source of truth for **references + metadata + job state**, never
large binaries. Image/model files live in the workers' storage path (or Convex
file storage if simpler); Convex holds the URLs.

---

## Convex data model (conceptual)

| Table | Purpose |
|-------|---------|
| `users` | identity, displayName, isAdmin, credits, lastFreeClaim, createdAt |
| `generationProjects` | one character through The Forge; `stage` (PipelineStage), faction/role/intendedRarity, prompt, timestamps |
| `imageCandidates` | project ref, url, index, selected, promptUsed, metadata |
| `multiviewSets` | project ref, sourceCandidate, front/left/right/back urls, approval, metadata |
| `generatedModels` | project ref, multiviewSet ref, modelUrl, previewUrl, approval, metadata |
| `cardDefinitions` | published character type: name, slug, faction, role, rarity, cost, attack, health, keyword, ability, lore, artworkUrl, modelUrl, published |
| `ownedCardInstances` | owner, cardDefinition, serialNumber, source, packOpening ref, publicIdentifier, acquiredAt |
| `packOpenings` | user, cardsAwarded, creditsSpent, openedAt |

Status enums live in `@flashborn/shared` (`PipelineStage`, `JobStatus`,
`AcquisitionSource`).

---

## Milestones (build in order)

### M1 — Repository + data foundation  ✅ scaffolded
- [x] Monorepo structure
- [x] Shared faction/role/rarity/keyword/card definitions
- [ ] Next.js app + Convex project wired
- [ ] Convex schema (tables above)
- [ ] Basic admin authorization (isAdmin flag)
- [ ] App navigation shell

### M2 — One complete Forge vertical slice (the core proof)
Using **one** character (start with a Legendary, e.g. Void Kernel or Riot Daemon):
- [ ] Create generation project
- [ ] Call image worker → display candidates gallery
- [ ] Select candidate
- [ ] Generate multiview set → inspect each view
- [ ] Call 3D worker → interactive browser model viewer (rotate/zoom)
- [ ] Configure card (pre-filled from project + starter set)
- [ ] Publish card
> Do **not** build the player economy before this works.

### M3 — Reliable generation management
- [ ] Visible job states: pending / running / completed / failed
- [ ] Failure handling + retry per stage
- [ ] Preserve outputs from earlier stages on later failure
- [ ] Return to an earlier stage without deleting the project
- [ ] Generation history; clear approved vs rejected separation

### M4 — Player collection loop
- [ ] Auth + starter credits (300 on signup; pack = 100)
- [ ] Free credits: 100 per 6h, computed from `lastFreeClaim`
- [ ] Pack opening: 3 Common + 1 Uncommon + 1 wildcard (70/25/5), graceful degrade
- [ ] Card-instance creation w/ serial numbers
- [ ] Collection page (filters, owned + undiscovered silhouettes, completion %)
- [ ] Card detail page

### M5 — Public sharing
- [ ] Public owned-card URLs `/card/{publicIdentifier}` (no login)
- [ ] Owner display name + serial + acquisition date
- [ ] Share action; mobile-friendly

### M6 — Visual polish
- [ ] Faction frame accents + rarity treatments
- [ ] Pack-opening reveal sequence (last card strongest)
- [ ] Landing hero with rotating Legendaries
- [ ] Smooth model interaction + loading/generation states

### M7 — Content generation (demo assets)
Order: **Aegis Prime → Riot Daemon → Patch Queen Nyra → Void Kernel** → 4 Rares
→ Uncommons → Commons. Four Legendaries are the strongest demo + landing assets.

---

## Prompt construction (web-side, before calling image worker)

Each concept request combines, from `@flashborn/shared`:
overall cyberpunk collectible-game style · faction + colors + material language ·
role + silhouette · rarity visual complexity · character description · full-body,
single centered character, readable silhouette, controlled background, strong
materials, **suitable for multiview + 3D reconstruction**.

Avoid: cropped limbs, busy scenes, multiple characters, body-covering particles,
unclear anatomy, silhouette-obscuring weapons, thin disconnected pieces.

---

## Demo-safety (judging)

Live Flash generation is shown, but the rest must not depend on one live job.
Pre-bake: completed candidates, approved multiview sets, ≥4 Legendary 3D models,
published cards across all four factions, a funded player account, a populated
collection, and at least one strong public card URL.

---

## Explicitly out of scope

PvP / gameplay, trading, marketplace, real-money, blockchain/NFT, matchmaking,
chat, deck validation, balancing tools, combat animation, content beyond the
required set.

---

## Open inputs needed from the team

1. **Location of the already-tested Flash image + 3D projects** to port into
   `workers/image` and `workers/3d`. *(pending)*
2. Worker storage path for generated assets (worker storage vs Convex storage).
3. Auth choice confirmation (Convex Auth vs alternative).
