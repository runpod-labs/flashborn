# Flashborn web — build contract (read before editing)

Next.js **16.2** (App Router, React 19, React Compiler ON) + Convex + Convex Auth.
Game canon: repo-root `CLAUDE.md` + `@flashborn/shared`. Visual tokens: `lib/theme.ts`.

## Next 16 cautions (breaking vs older Next)
- Server Components by default. Add `"use client"` for any file using hooks
  (`useQuery`, `useState`, `useAuthActions`, etc.).
- `params`/`searchParams` in page/layout props are **Promises** — `await` them:
  `export default async function Page({ params }: { params: Promise<{ publicId: string }> })`.
- Don't fight the React Compiler; write normal components.

## Auth (Convex Auth)
- Providers already wired in `app/layout.tsx` + `app/ConvexClientProvider.tsx`; middleware in `middleware.ts`. Do not re-add providers.
- Client: `import { useAuthActions } from "@convex-dev/auth/react"`.
  - Sign up: `signIn("password", formData)` where formData has `email`, `password`, `flow: "signUp"`.
  - Sign in: same with `flow: "signIn"`.
  - Guest: `signIn("anonymous")`.
  - `signOut()`.
- Gating components: `import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"`.
- After auth, call `useMutation(api.users.ensureProfile)` once to create the profile (300 starter credits). `api.users.getMe` returns the profile or null (`{ displayName, isAdmin, credits, freeReady, nextFreeAt, ... }`).

## Convex API (`api` from `@/convex/_generated/api`)
Use `useQuery(api.ns.fn, args)` / `useMutation(api.ns.fn)`.

- **users**: `getMe()`, `ensureProfile()`, `setDisplayName({displayName})`, `claimFreeCredits()`, `grantSelfCredits({amount})`, `claimAdmin()`.
- **cards** (public reads): `listPublished({faction?,rarity?,role?})`, `getBySlug({slug})`, `getById({id})`; admin: `listAll()`, `publishCard({...})`, `togglePublish({id,published})`.
- **packs**: `openPack()` → `{ creditsLeft, cards: [{ownedId,publicId,serialNumber,cardId,name,faction,role,rarity,cost,attack,health,keyword,abilityText,artworkUrl,modelUrl}] }` (5 cards, last = wildcard). `myOpenings()`.
- **collection**: `myCollection()` → `[{card,count,publicId,ownedId,serialNumber}]`; `collectionProgress()` → `{owned,total,instances}`; `myInstances({cardDefinition})`; `ownedByPublicId({publicId})` (PUBLIC) → `{card,serialNumber,acquiredAt,ownerName}`.
- **projects** (admin): `createProject({...})`, `listProjects()`, `getProject({id})`, `setStage({id,stage,error?})`, `updateMeta({...})`, `remove({id})`.
- **generation** (admin): `addCandidate`, `listCandidates({projectId})`, `selectCandidate({candidateId})`, `rejectCandidate`, `createMultiviewSet`, `updateMultiviewSet`, `listMultiview({projectId})`, `approveMultiview`, `createModel`, `updateModel`, `listModels({projectId})`, `approveModel`.
- **files**: `generateUploadUrl()` (mutation), `getUrl({storageId})`.

Card objects from queries already include resolved `artworkUrl` and `modelUrl` (GLB). Faction/role/rarity are the string enums from `@flashborn/shared`.

## Generation orchestration (flash dev, local only)
Convex cloud can't reach the local `flash dev` server, so generation runs in
**Next.js Route Handlers** (`app/api/forge/.../route.ts`), which call the worker
then write results to Convex. Env (in `.env.local`):
- `IMAGE_WORKER_URL` = `http://localhost:8892` → `POST /hidream_worker/runsync`, body `{"input":{"input_data":{"action":"generate","prompt","seed","width":768,"height":1024}}}`, returns `output.image_b64`.
- `THREED_WORKER_URL` (set when the 3D worker is up) → `POST /hunyuan3d_worker/runsync`.
Prompt builder: `lib/prompt.ts` (`buildConceptPrompt`, `buildMultiviewPrompt`). Do not invent prompt text — use it.

## Routes
`/` landing · `/signin` auth · `/forge` admin dashboard + `/forge/[projectId]` pipeline · `/play` or `/packs` open packs · `/collection` · `/card/[publicId]` PUBLIC owned-card page · `/c/[slug]` card detail (optional).

## Design tokens
`lib/theme.ts` → `FACTION_THEME[faction]` (primary/secondary/dark/glow/gradient), `RARITY_THEME[rarity]` (color/rank/holo), `ROLE_LABEL[role]`. Cyberpunk dark UI; faction identity stronger than rarity.
