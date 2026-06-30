# Flashborn

**A cyberpunk collectible-card platform where every card begins as an
AI-generated character and becomes an interactive 3D collectible — powered by
[Runpod Flash](https://docs.runpod.io).**

Administrators use **The Forge** to generate, review, convert, configure, and
publish characters. Players open booster packs, build a collection, rotate cards
in 3D, and share owned cards through public URLs.

The point Flashborn proves: Runpod Flash turns locally written Python generation
code into a live GPU-powered content pipeline — concept → multiview → 3D model →
published collectible — without repeatedly building and redeploying Docker
images.

## Monorepo layout

```text
/
├── web/                 # Next.js + React + Convex (app, auth, orchestration, viewer)
│   ├── app/
│   ├── components/
│   ├── convex/
│   └── public/
├── workers/
│   ├── image/           # Flash worker: concept + multiview generation
│   └── 3d/              # Flash worker: 3D model generation (Hunyuan 2.1 multiview)
├── packages/
│   └── shared/          # factions, roles, rarities, keywords, job status, card set
├── PLAN.md              # implementation plan + milestones
└── README.md
```

## The pipeline (vertical slice)

1. Admin generates character concepts via the **image worker**.
2. Admin selects a concept.
3. Image worker generates consistent front/left/right/back views.
4. Approved views go to the **3D worker**.
5. The model is rotated/inspected in the browser.
6. Admin adds gameplay metadata and publishes the card.
7. Players open packs, collect, inspect 3D models, and share via public URLs.

## Shared definitions

`packages/shared` is the source of truth for game vocabulary and the 20-card
starter set (5 per faction). Import in the web app via `@flashborn/shared`.

- **Factions:** Kernel Guard, Overclock Syndicate, Patchrunners, Ghostware
- **Roles:** Striker, Guardian, Support, Disruptor
- **Rarities:** Common, Uncommon, Rare, Legendary
- **Keywords:** Guard, Shield, Rush, Stun, Spawn, Overclock

## Status

Scaffolding stage. The two workers are placeholders pending the already-tested
Flash projects. See `PLAN.md` for the build order.
