"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FACTION_DEFS,
  ROLE_DEFS,
  RARITY_DEFS,
  FACTIONS,
  ROLES,
  RARITIES,
  type FactionId,
  type RoleId,
  type RarityId,
} from "@flashborn/shared";
import { randomCharacter, suggestNames } from "@/lib/character";
import { Button } from "@/components/Button";
import TopNav from "@/components/TopNav";
import ForgeGate from "@/components/ForgeGate";
import { FactionBadge } from "@/components/FactionBadge";
import { RarityBadge } from "@/components/RarityBadge";
import { RoleBadge } from "@/components/RoleBadge";

const INPUT_CLS =
  "w-full rounded-md border border-edge bg-surface px-3 py-2.5 text-sm text-grid-fg outline-none transition-colors placeholder:text-faint focus:border-neon focus:shadow-[0_0_0_3px_rgba(25,230,193,0.15)]";
const LABEL_CLS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint";

function NewCharacterForm() {
  const router = useRouter();
  const createProject = useMutation(api.projects.createProject);
  const existingNames = useQuery(api.projects.existingNames);
  const projects = useQuery(api.projects.listProjects);

  const [workingTitle, setWorkingTitle] = useState("");
  const [character, setCharacter] = useState("");
  const [faction, setFaction] = useState<FactionId>(FACTIONS[0]);
  const [role, setRole] = useState<RoleId>(ROLES[0]);
  const [rarity, setRarity] = useState<RarityId>(RARITIES[0]);
  const [count, setCount] = useState(6);
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);

  // Lowercased set of every name already in use (projects + published cards).
  const taken = useMemo(
    () => new Set((existingNames ?? []).map((n) => n.toLowerCase())),
    [existingNames],
  );

  // On-brand name suggestions for the current faction/role/rarity. `seed`
  // lets the reroll button regenerate without changing the selection.
  const suggestions = useMemo(
    () => suggestNames(faction, role, rarity, 8),
    // `seed` intentionally regenerates the Math.random-based suggestions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faction, role, rarity, seed],
  );

  const titleTaken =
    workingTitle.trim().length > 0 &&
    taken.has(workingTitle.trim().toLowerCase());

  function rollEverything() {
    const rc = randomCharacter(taken);
    setWorkingTitle(rc.workingTitle);
    setCharacter(rc.character);
    setFaction(rc.faction);
    setRole(rc.role);
    setRarity(rc.rarity);
    setExtra(rc.extra);
    setSeed((s) => s + 1);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!workingTitle.trim() || !character.trim()) {
      setError("Working title and character description are required.");
      return;
    }
    setBusy(true);
    try {
      const id = await createProject({
        workingTitle: workingTitle.trim(),
        originalPrompt: character.trim(),
        extraInstructions: extra.trim() || undefined,
        faction,
        role,
        rarity,
      });

      // Kick off the first concept batch (best-effort — the pipeline page can
      // re-run it if this fails).
      try {
        await fetch("/api/forge/concept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            count,
            faction,
            role,
            rarity,
            character: character.trim(),
            extra: extra.trim() || undefined,
          }),
        });
      } catch {
        // ignore — handled on the pipeline page
      }

      router.push(`/forge/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <Link
          href="/forge"
          className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-neon"
        >
          ← Back to Forge
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-grid-fg">
              New <span className="text-neon">Character</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Describe the character and choose its identity, or roll a random
              one. The Forge generates the first batch of concepts on submit.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={rollEverything}
            className="shrink-0"
          >
            🎲 Randomize
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5 rounded-2xl panel p-6">
          <div>
            <div className="flex items-center justify-between">
              <label className={LABEL_CLS}>Working title</label>
              {titleTaken && (
                <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-os">
                  ⚠ Name already taken
                </span>
              )}
            </div>
            <input
              className={`${INPUT_CLS} ${titleTaken ? "border-os/70 focus:border-os" : ""}`}
              value={workingTitle}
              onChange={(e) => setWorkingTitle(e.target.value)}
              placeholder="Aegis Prime"
              maxLength={60}
            />

            {/* Name suggestions — click to use. Taken names are struck out. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-faint">
                Suggestions
              </span>
              {suggestions.map((name) => {
                const isTaken = taken.has(name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isTaken}
                    onClick={() => setWorkingTitle(name)}
                    title={isTaken ? "Already taken" : "Use this name"}
                    className={
                      isTaken
                        ? "cursor-not-allowed rounded-full border border-os/30 bg-os/10 px-2.5 py-1 text-[11px] text-os/70 line-through"
                        : "rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] text-grid-fg/80 transition-colors hover:border-neon hover:text-neon"
                    }
                  >
                    {name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                title="New suggestions"
                className="rounded-full border border-edge bg-surface px-2 py-1 text-[11px] text-muted transition-colors hover:border-neon hover:text-neon"
              >
                ↻
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Character description</label>
            <textarea
              className={`${INPUT_CLS} min-h-[120px] resize-y`}
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              placeholder="A towering armored sentinel mech with a massive riot shield and a glowing kernel core in its chest…"
            />
            <p className="mt-1 text-[11px] text-faint">
              This becomes the project&apos;s original prompt and feeds the concept
              generator.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>Faction</label>
              <select
                className={INPUT_CLS}
                value={faction}
                onChange={(e) => setFaction(e.target.value as FactionId)}
              >
                {FACTIONS.map((id) => (
                  <option key={id} value={id}>
                    {FACTION_DEFS[id].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Role</label>
              <select
                className={INPUT_CLS}
                value={role}
                onChange={(e) => setRole(e.target.value as RoleId)}
              >
                {ROLES.map((id) => (
                  <option key={id} value={id}>
                    {ROLE_DEFS[id].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Rarity</label>
              <select
                className={INPUT_CLS}
                value={rarity}
                onChange={(e) => setRarity(e.target.value as RarityId)}
              >
                {RARITIES.map((id) => (
                  <option key={id} value={id}>
                    {RARITY_DEFS[id].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <label className={LABEL_CLS}>Candidates</label>
              <input
                type="number"
                min={1}
                max={12}
                className={INPUT_CLS}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Extra visual direction (optional)</label>
              <input
                className={INPUT_CLS}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="battle-worn plating, holographic visor"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-os/40 bg-os/10 px-3 py-2 text-xs text-os">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Forging…" : `Create & generate ${count} concepts`}
          </Button>
        </form>
      </div>

      <ExistingCharacters projects={projects} />
    </main>
  );
}

type ProjectRow = {
  _id: string;
  workingTitle: string;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  stage: string;
  thumbnailUrl: string | null;
};

function ExistingCharacters({ projects }: { projects: ProjectRow[] | undefined }) {
  const [factionFilter, setFactionFilter] = useState<FactionId | "all">("all");

  const list = (projects ?? []).filter(
    (p) => factionFilter === "all" || p.faction === factionFilter,
  );

  const perFaction = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects ?? []) counts[p.faction] = (counts[p.faction] ?? 0) + 1;
    return counts;
  }, [projects]);

  return (
    <aside className="min-w-0">
      <div className="rounded-2xl panel p-5 lg:sticky lg:top-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-grid-fg">
            Existing
          </h2>
          <span className="text-[11px] text-faint">
            {projects?.length ?? 0} total
          </span>
        </div>

        {/* Faction filter */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip
            active={factionFilter === "all"}
            onClick={() => setFactionFilter("all")}
          >
            All
          </FilterChip>
          {FACTIONS.map((f) => (
            <FilterChip
              key={f}
              active={factionFilter === f}
              onClick={() => setFactionFilter(f)}
            >
              {FACTION_DEFS[f].name.split(" ")[0]} · {perFaction[f] ?? 0}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {projects === undefined ? (
            <p className="py-6 text-center text-xs text-faint">Loading…</p>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-xs text-faint">
              No characters yet. Roll one to get started.
            </p>
          ) : (
            list.map((p) => (
              <Link
                key={p._id}
                href={`/forge/${p._id}`}
                className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-2.5 py-2 transition-colors hover:border-neon/50"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-grid-bg ring-1 ring-edge">
                  {p.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-faint">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-grid-fg">
                    {p.workingTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <FactionBadge faction={p.faction} showName={false} />
                    <RarityBadge rarity={p.rarity} />
                    <RoleBadge role={p.role} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
        active
          ? "bg-gradient-to-r from-neon to-neon-2 text-grid-bg"
          : "border border-edge bg-surface text-muted hover:text-grid-fg"
      }`}
    >
      {children}
    </button>
  );
}

export default function NewCharacterPage() {
  return (
    <>
      <TopNav />
      <ForgeGate>
        <NewCharacterForm />
      </ForgeGate>
    </>
  );
}
