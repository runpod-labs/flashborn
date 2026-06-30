"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
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
import { Button } from "@/components/Button";
import TopNav from "@/components/TopNav";
import ForgeGate from "@/components/ForgeGate";

const INPUT_CLS =
  "w-full rounded-md border border-edge bg-surface px-3 py-2.5 text-sm text-grid-fg outline-none transition-colors placeholder:text-faint focus:border-neon focus:shadow-[0_0_0_3px_rgba(25,230,193,0.15)]";
const LABEL_CLS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint";

function NewCharacterForm() {
  const router = useRouter();
  const createProject = useMutation(api.projects.createProject);

  const [workingTitle, setWorkingTitle] = useState("");
  const [character, setCharacter] = useState("");
  const [faction, setFaction] = useState<FactionId>(FACTIONS[0]);
  const [role, setRole] = useState<RoleId>(ROLES[0]);
  const [rarity, setRarity] = useState<RarityId>(RARITIES[0]);
  const [count, setCount] = useState(6);
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/forge"
        className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-neon"
      >
        ← Back to Forge
      </Link>

      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-grid-fg">
        New <span className="text-neon">Character</span>
      </h1>
      <p className="mt-1 text-sm text-muted">
        Describe the character and choose its identity. The Forge generates the
        first batch of concepts on submit.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5 rounded-2xl panel p-6">
        <div>
          <label className={LABEL_CLS}>Working title</label>
          <input
            className={INPUT_CLS}
            value={workingTitle}
            onChange={(e) => setWorkingTitle(e.target.value)}
            placeholder="Aegis Prime"
            maxLength={60}
          />
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
    </main>
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
