"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  FACTION_DEFS,
  ROLE_DEFS,
  RARITY_DEFS,
  KEYWORD_DEFS,
  FACTIONS,
  ROLES,
  RARITIES,
  KEYWORDS,
  type FactionId,
  type RoleId,
  type RarityId,
  type KeywordId,
  type PipelineStage,
} from "@flashborn/shared";
import { FACTION_THEME } from "@/lib/theme";
import { Button, ButtonLink } from "@/components/Button";
import CardFrame from "@/components/CardFrame";
import ModelViewer from "@/components/ModelViewer";
import ForgeStageBadge from "@/components/ForgeStageBadge";
import ForgeImageModal from "@/components/ForgeImageModal";

// ---- which pipeline steps are reachable, given the current stage ----
type StepKey = "concepts" | "multiview" | "model" | "configure" | "publish";
const STEP_ORDER: StepKey[] = ["concepts", "multiview", "model", "configure", "publish"];
const STEP_LABEL: Record<StepKey, string> = {
  concepts: "Concepts",
  multiview: "Multiview",
  model: "3D Model",
  configure: "Configure",
  publish: "Publish",
};

// Lowest step the admin should be able to reach for a given stage.
function defaultStep(stage: PipelineStage): StepKey {
  switch (stage) {
    case "multiview_generating":
    case "multiview_ready":
      return "multiview";
    case "model_generating":
    case "model_ready":
      return "model";
    case "card_configured":
      return "configure";
    case "published":
      return "publish";
    default:
      return "concepts";
  }
}

const INPUT_CLS =
  "w-full rounded-md border border-edge bg-surface px-3 py-2.5 text-sm text-grid-fg outline-none transition-colors placeholder:text-faint focus:border-neon focus:shadow-[0_0_0_3px_rgba(25,230,193,0.15)]";
const LABEL_CLS = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint";

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-faint">
      <span className="relative h-10 w-10">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em]">{label}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-os/40 bg-os/10 px-3 py-2 text-xs text-os">
      {message}
    </div>
  );
}

function SectionShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl panel p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-grid-fg">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ForgePipeline({ projectId }: { projectId: Id<"generationProjects"> }) {
  const project = useQuery(api.projects.getProject, { id: projectId });

  if (project === undefined) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Spinner label="Loading project…" />
      </main>
    );
  }
  if (project === null) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-20 text-center">
        <p className="text-sm text-muted">Project not found.</p>
        <ButtonLink href="/forge" variant="outline" size="md" className="mt-5">
          Back to Forge
        </ButtonLink>
      </main>
    );
  }

  return <PipelineInner projectId={projectId} project={project} />;
}

type Project = NonNullable<FunctionReturnType<typeof api.projects.getProject>>;

function PipelineInner({
  projectId,
  project,
}: {
  projectId: Id<"generationProjects">;
  project: Project;
}) {
  const f = FACTION_THEME[project.faction as FactionId];
  const [step, setStep] = useState<StepKey>(defaultStep(project.stage));
  const [modal, setModal] = useState<{ src: string; alt?: string } | null>(null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/forge"
            className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-neon"
          >
            ← Back to Forge
          </Link>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-grid-fg">
            {project.workingTitle || "Untitled"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ForgeStageBadge stage={project.stage} />
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: f.primary, background: `${f.primary}1f` }}
            >
              {f.name}
            </span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              {ROLE_DEFS[project.role as RoleId].name}
            </span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              {RARITY_DEFS[project.rarity as RarityId].name}
            </span>
          </div>
        </div>
      </div>

      {project.error && project.stage === "failed" && (
        <div className="mt-4">
          <ErrorBanner message={`Last failure: ${project.error}`} />
        </div>
      )}

      {/* Stepper nav */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {STEP_ORDER.map((s, i) => {
          const active = step === s;
          return (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                active
                  ? "border-neon/60 bg-neon/10 text-neon"
                  : "border-edge text-muted hover:border-neon/40 hover:text-grid-fg"
              }`}
            >
              <span className="opacity-60">{i + 1}</span>
              {STEP_LABEL[s]}
            </button>
          );
        })}
      </nav>

      {/* Stage content */}
      <div className="mt-6 space-y-6">
        {step === "concepts" && (
          <ConceptsStage project={project} projectId={projectId} onInspect={setModal} onContinue={() => setStep("multiview")} />
        )}
        {step === "multiview" && (
          <MultiviewStage
            project={project}
            projectId={projectId}
            onInspect={setModal}
            onBack={() => setStep("concepts")}
            onContinue={() => setStep("model")}
          />
        )}
        {step === "model" && (
          <ModelStage
            projectId={projectId}
            onBack={() => setStep("multiview")}
            onContinue={() => setStep("configure")}
          />
        )}
        {step === "configure" && (
          <ConfigureStage project={project} projectId={projectId} onContinue={() => setStep("publish")} />
        )}
        {step === "publish" && <PublishStage project={project} projectId={projectId} />}
      </div>

      {modal && <ForgeImageModal src={modal.src} alt={modal.alt} onClose={() => setModal(null)} />}
    </main>
  );
}

// ============================================================
// 1. CONCEPTS
// ============================================================
function ConceptsStage({
  project,
  projectId,
  onInspect,
  onContinue,
}: {
  project: Project;
  projectId: Id<"generationProjects">;
  onInspect: (m: { src: string; alt?: string }) => void;
  onContinue: () => void;
}) {
  const candidates = useQuery(api.generation.listCandidates, { projectId });
  const selectCandidate = useMutation(api.generation.selectCandidate);
  const rejectCandidate = useMutation(api.generation.rejectCandidate);
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSelected = candidates?.some((c) => c.selected) ?? false;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forge/concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          count,
          faction: project.faction,
          role: project.role,
          rarity: project.rarity,
          character: project.originalPrompt,
          extra: project.extraInstructions ?? undefined,
          startIndex: (candidates ?? []).reduce((max, c) => Math.max(max, c.index + 1), 0),
        }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error ?? "Generation failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  const generating = project.stage === "concept_generating";

  return (
    <SectionShell title="1 · Concepts">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={LABEL_CLS}>Count</label>
          <input
            type="number"
            min={1}
            max={12}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className={`${INPUT_CLS} w-24`}
          />
        </div>
        <Button onClick={generate} disabled={busy} size="md">
          {busy ? "Generating…" : candidates && candidates.length > 0 ? `Generate ${count} more` : `Generate ${count} concepts`}
        </Button>
        {hasSelected && (
          <Button onClick={onContinue} variant="outline" size="md">
            Continue with selected →
          </Button>
        )}
      </div>

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      <div className="mt-5">
        {candidates === undefined ? (
          <Spinner label="Loading concepts…" />
        ) : candidates.length === 0 ? (
          (busy || generating) ? (
            <Spinner label="Generating concepts…" />
          ) : (
            <p className="py-8 text-center text-sm text-faint">
              No concepts yet. Generate the first batch above.
            </p>
          )
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {candidates.map((c) => (
              <div
                key={c._id}
                className={`group relative overflow-hidden rounded-lg border transition-colors ${
                  c.selected
                    ? "border-neon shadow-[0_0_20px_-4px_rgba(25,230,193,0.7)]"
                    : c.rejected
                      ? "border-edge opacity-40"
                      : "border-edge hover:border-neon/40"
                }`}
              >
                <div className="relative aspect-[3/4] bg-surface">
                  {c.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.url}
                      alt={`Concept ${c.index}`}
                      className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
                      onClick={() => c.url && onInspect({ src: c.url, alt: `Concept ${c.index}` })}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-faint">
                      no image
                    </div>
                  )}
                  {c.selected && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-neon px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-grid-bg">
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 p-2">
                  <button
                    onClick={() => void selectCandidate({ candidateId: c._id })}
                    className="flex-1 rounded border border-neon/50 py-1 text-[10px] font-bold uppercase tracking-wider text-neon transition-colors hover:bg-neon/10"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => void rejectCandidate({ candidateId: c._id, rejected: !c.rejected })}
                    className="flex-1 rounded border border-edge py-1 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:border-os/60 hover:text-os"
                  >
                    {c.rejected ? "Unreject" : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ============================================================
// 2. MULTIVIEW
// ============================================================
const VIEW_KEYS = ["front", "left", "right", "back"] as const;

function MultiviewStage({
  project,
  projectId,
  onInspect,
  onBack,
  onContinue,
}: {
  project: Project;
  projectId: Id<"generationProjects">;
  onInspect: (m: { src: string; alt?: string }) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const sets = useQuery(api.generation.listMultiview, { projectId });
  const candidates = useQuery(api.generation.listCandidates, { projectId });
  const approveMultiview = useMutation(api.generation.approveMultiview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = sets?.[0];
  const running = latest?.status === "running" || latest?.status === "pending" || busy;
  const selectedConcept = candidates?.find((c) => c.selected);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forge/multiview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          faction: project.faction,
          selectedCandidateId: selectedConcept?._id,
          refUrl: selectedConcept?.url ?? undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error ?? "Multiview generation failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Multiview generation failed.");
    } finally {
      setBusy(false);
    }
  }

  const hasSelectedConcept = !!project.selectedCandidate;

  return (
    <SectionShell title="2 · Multiview">
      {!hasSelectedConcept && (
        <div className="mb-4">
          <ErrorBanner message="Select a concept first (step 1) to use as the reference image." />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={busy || !hasSelectedConcept} size="md">
          {busy ? "Generating…" : latest ? "Regenerate multiview" : "Generate multiview"}
        </Button>
        <Button onClick={onBack} variant="ghost" size="md">
          ← Back to concepts
        </Button>
        {latest?.status === "completed" && (
          <Button onClick={onContinue} variant="outline" size="md">
            Continue to 3D →
          </Button>
        )}
      </div>

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      <div className="mt-5">
        {sets === undefined ? (
          <Spinner label="Loading multiview…" />
        ) : !latest ? (
          <p className="py-8 text-center text-sm text-faint">
            No multiview set yet. Generate one from the selected concept.
          </p>
        ) : latest.status === "failed" ? (
          <div className="space-y-3">
            <ErrorBanner message={latest.error ?? "Multiview generation failed."} />
            <Button onClick={generate} disabled={busy} size="sm">
              Retry
            </Button>
          </div>
        ) : running ? (
          <Spinner label="Generating 4 views…" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VIEW_KEYS.map((view) => {
                const url = latest[`${view}Url` as const] as string | undefined | null;
                return (
                  <div key={view} className="overflow-hidden rounded-lg border border-edge">
                    <div className="relative aspect-[3/4] bg-surface">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`${view} view`}
                          className="absolute inset-0 h-full w-full cursor-zoom-in object-cover"
                          onClick={() => onInspect({ src: url, alt: `${view} view` })}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-faint">
                          —
                        </div>
                      )}
                    </div>
                    <div className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                      {view}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void approveMultiview({ id: latest._id })}
                size="md"
                disabled={latest.approved}
              >
                {latest.approved ? "Approved ✓" : "Approve"}
              </Button>
              {latest.approved && (
                <span className="text-xs uppercase tracking-wider text-neon">
                  Approved — ready for 3D
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </SectionShell>
  );
}

// ============================================================
// 3. MODEL
// ============================================================
function ModelStage({
  projectId,
  onBack,
  onContinue,
}: {
  projectId: Id<"generationProjects">;
  onBack: () => void;
  onContinue: () => void;
}) {
  const models = useQuery(api.generation.listModels, { projectId });
  const multiviewSets = useQuery(api.generation.listMultiview, { projectId });
  const approveModel = useMutation(api.generation.approveModel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = models?.[0];
  const running = latest?.status === "running" || latest?.status === "pending" || busy;
  const sourceSet =
    multiviewSets?.find((s) => s.approved && s.status === "completed") ??
    multiviewSets?.find((s) => s.status === "completed");
  const hasMultiview = !!sourceSet;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forge/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          multiviewSetId: sourceSet?._id,
          frontUrl: sourceSet?.frontUrl ?? undefined,
          backUrl: sourceSet?.backUrl ?? undefined,
          leftUrl: sourceSet?.leftUrl ?? undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error ?? "3D generation failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "3D generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionShell title="3 · 3D Model">
      {!hasMultiview && (
        <div className="mb-4">
          <ErrorBanner message="Generate a multiview set first (step 2)." />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={generate} disabled={busy || !hasMultiview} size="md">
          {busy ? "Generating…" : latest ? "Regenerate 3D model" : "Generate 3D model"}
        </Button>
        <Button onClick={onBack} variant="ghost" size="md">
          ← Back to multiview
        </Button>
        {latest?.status === "completed" && (
          <Button onClick={onContinue} variant="outline" size="md">
            Continue to configure →
          </Button>
        )}
      </div>

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      <div className="mt-5">
        {models === undefined ? (
          <Spinner label="Loading models…" />
        ) : !latest ? (
          <p className="py-8 text-center text-sm text-faint">
            No 3D model yet. 3D inference can take 30–120s (longer on a cold start).
          </p>
        ) : latest.status === "failed" ? (
          <div className="space-y-3">
            <ErrorBanner message={latest.error ?? "3D generation failed."} />
            <Button onClick={generate} disabled={busy} size="sm">
              Retry
            </Button>
          </div>
        ) : running ? (
          <Spinner label="Building 3D model…" />
        ) : latest.modelUrl ? (
          <div className="space-y-4">
            <div className="aspect-square w-full max-w-md overflow-hidden rounded-xl border border-edge bg-surface">
              <ModelViewer src={latest.modelUrl} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void approveModel({ id: latest._id })}
                size="md"
                disabled={latest.approved}
              >
                {latest.approved ? "Approved ✓" : "Approve"}
              </Button>
              <Button onClick={generate} variant="danger" size="md" disabled={busy}>
                Reject &amp; regenerate
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-faint">Model completed but no URL available.</p>
        )}
      </div>
    </SectionShell>
  );
}

// ============================================================
// 4 + 5. CONFIGURE + PUBLISH share the configured-card state
// ============================================================
interface StatFields {
  cost: number;
  attack: number;
  health: number;
  keyword: KeywordId | "";
  abilityTitle: string;
  abilityText: string;
  lore: string;
}

type CachedConfig = StatFields & {
  name: string;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
};

function useConfiguredCard(project: Project, cached: CachedConfig | undefined) {
  const [name, setName] = useState(cached?.name ?? project.workingTitle ?? "");
  const [faction, setFaction] = useState<FactionId>(cached?.faction ?? (project.faction as FactionId));
  const [role, setRole] = useState<RoleId>(cached?.role ?? (project.role as RoleId));
  const [rarity, setRarity] = useState<RarityId>(cached?.rarity ?? (project.rarity as RarityId));
  const [stats, setStats] = useState<StatFields>(
    cached
      ? {
          cost: cached.cost,
          attack: cached.attack,
          health: cached.health,
          keyword: cached.keyword,
          abilityTitle: cached.abilityTitle,
          abilityText: cached.abilityText,
          lore: cached.lore,
        }
      : { cost: 3, attack: 3, health: 3, keyword: "", abilityTitle: "", abilityText: "", lore: "" },
  );
  return { name, setName, faction, setFaction, role, setRole, rarity, setRarity, stats, setStats };
}

// Lift the configured state up so Configure + Publish share it within a session.
function ConfigureStage({
  project,
  projectId,
  onContinue,
}: {
  project: Project;
  projectId: Id<"generationProjects">;
  onContinue: () => void;
}) {
  return <ConfigurePublishShared project={project} projectId={projectId} mode="configure" onContinue={onContinue} />;
}

function PublishStage({
  project,
  projectId,
}: {
  project: Project;
  projectId: Id<"generationProjects">;
}) {
  return <ConfigurePublishShared project={project} projectId={projectId} mode="publish" />;
}

// We keep a single component instance per step; to truly share state across the
// two steps the parent would need to lift it. To keep earlier outputs and a live
// preview without losing edits, we persist the config in module-level storage
// keyed by projectId.
const configCache = new Map<string, CachedConfig>();

function ConfigurePublishShared({
  project,
  projectId,
  mode,
  onContinue,
}: {
  project: Project;
  projectId: Id<"generationProjects">;
  mode: "configure" | "publish";
  onContinue?: () => void;
}) {
  const updateMeta = useMutation(api.projects.updateMeta);
  const publishCard = useMutation(api.cards.publishCard);
  const setStage = useMutation(api.projects.setStage);

  // Module cache keeps the configured card consistent when the admin jumps
  // between the Configure and Publish steps within a session.
  const cfg = useConfiguredCard(project, configCache.get(projectId));

  function persist() {
    configCache.set(projectId, {
      name: cfg.name,
      faction: cfg.faction,
      role: cfg.role,
      rarity: cfg.rarity,
      ...cfg.stats,
    });
  }

  // Keep the session cache live so edits survive jumping between steps.
  useEffect(persist, [
    projectId,
    cfg.name,
    cfg.faction,
    cfg.role,
    cfg.rarity,
    cfg.stats,
  ]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Live preview card data.
  const previewArtwork = useProjectArtwork(projectId);
  const previewModel = useProjectModel(projectId);

  const cardData = useMemo(
    () => ({
      name: cfg.name || "Unnamed",
      faction: cfg.faction,
      role: cfg.role,
      rarity: cfg.rarity,
      cost: cfg.stats.cost,
      attack: cfg.stats.attack,
      health: cfg.stats.health,
      keyword: (cfg.stats.keyword || null) as KeywordId | null,
      abilityTitle: cfg.stats.abilityTitle || null,
      abilityText: cfg.stats.abilityText || null,
      lore: cfg.stats.lore || null,
      artworkUrl: previewArtwork,
      modelUrl: previewModel,
    }),
    [cfg.name, cfg.faction, cfg.role, cfg.rarity, cfg.stats, previewArtwork, previewModel],
  );

  async function saveMeta() {
    setBusy(true);
    setError(null);
    setSavedNote(null);
    try {
      await updateMeta({
        id: projectId,
        workingTitle: cfg.name,
        faction: cfg.faction,
        role: cfg.role,
        rarity: cfg.rarity,
      });
      await setStage({ id: projectId, stage: "card_configured" });
      persist();
      setSavedNote("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      await publishCard({
        projectId,
        name: cfg.name,
        faction: cfg.faction,
        role: cfg.role,
        rarity: cfg.rarity,
        cost: cfg.stats.cost,
        attack: cfg.stats.attack,
        health: cfg.stats.health,
        keyword: cfg.stats.keyword || undefined,
        abilityTitle: cfg.stats.abilityTitle || undefined,
        abilityText: cfg.stats.abilityText || undefined,
        lore: cfg.stats.lore || undefined,
      });
      setPublishedSlug(slugify(cfg.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  const setStat = <K extends keyof StatFields>(k: K, v: StatFields[K]) => {
    cfg.setStats({ ...cfg.stats, [k]: v });
  };

  return (
    <SectionShell title={mode === "configure" ? "4 · Configure" : "5 · Publish"}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <div className="space-y-4">
          {mode === "configure" ? (
            <>
              <div>
                <label className={LABEL_CLS}>Card name</label>
                <input className={INPUT_CLS} value={cfg.name} onChange={(e) => cfg.setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLS}>Faction</label>
                  <select className={INPUT_CLS} value={cfg.faction} onChange={(e) => cfg.setFaction(e.target.value as FactionId)}>
                    {FACTIONS.map((id) => (
                      <option key={id} value={id}>{FACTION_DEFS[id].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Role</label>
                  <select className={INPUT_CLS} value={cfg.role} onChange={(e) => cfg.setRole(e.target.value as RoleId)}>
                    {ROLES.map((id) => (
                      <option key={id} value={id}>{ROLE_DEFS[id].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Rarity</label>
                  <select className={INPUT_CLS} value={cfg.rarity} onChange={(e) => cfg.setRarity(e.target.value as RarityId)}>
                    {RARITIES.map((id) => (
                      <option key={id} value={id}>{RARITY_DEFS[id].name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>Cost</label>
              <input type="number" min={0} max={10} className={INPUT_CLS} value={cfg.stats.cost} onChange={(e) => setStat("cost", Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Attack</label>
              <input type="number" min={0} className={INPUT_CLS} value={cfg.stats.attack} onChange={(e) => setStat("attack", Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Health</label>
              <input type="number" min={0} className={INPUT_CLS} value={cfg.stats.health} onChange={(e) => setStat("health", Number(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Keyword (optional)</label>
            <select className={INPUT_CLS} value={cfg.stats.keyword} onChange={(e) => setStat("keyword", e.target.value as KeywordId | "")}>
              <option value="">None</option>
              {KEYWORDS.map((id) => (
                <option key={id} value={id}>{KEYWORD_DEFS[id].name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Ability title (optional)</label>
            <input className={INPUT_CLS} value={cfg.stats.abilityTitle} onChange={(e) => setStat("abilityTitle", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Ability text (optional)</label>
            <textarea className={`${INPUT_CLS} min-h-[70px] resize-y`} value={cfg.stats.abilityText} onChange={(e) => setStat("abilityText", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Lore (optional)</label>
            <textarea className={`${INPUT_CLS} min-h-[70px] resize-y`} value={cfg.stats.lore} onChange={(e) => setStat("lore", e.target.value)} />
          </div>

          {error && <ErrorBanner message={error} />}

          {mode === "configure" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={saveMeta} disabled={busy} size="md">
                {busy ? "Saving…" : "Save configuration"}
              </Button>
              {savedNote && <span className="text-xs uppercase tracking-wider text-neon">{savedNote}</span>}
              {onContinue && (
                <Button onClick={() => { persist(); onContinue(); }} variant="outline" size="md">
                  Continue to publish →
                </Button>
              )}
            </div>
          ) : publishedSlug ? (
            <div className="space-y-3 rounded-lg border border-neon/40 bg-neon/5 p-4">
              <p className="text-sm font-semibold text-neon">Card published ✓</p>
              <p className="text-xs text-muted">
                {cfg.name} is now live and can appear in booster packs.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/explore" variant="primary" size="sm">
                  View in Explore
                </ButtonLink>
                <ButtonLink href={`/c/${publishedSlug}`} variant="outline" size="sm">
                  Card page
                </ButtonLink>
              </div>
            </div>
          ) : (
            <Button onClick={publish} disabled={busy || !cfg.name.trim()} size="lg" className="w-full">
              {busy ? "Publishing…" : "Publish card"}
            </Button>
          )}
        </div>

        {/* Live preview */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] text-faint">Live preview</span>
          <CardFrame card={cardData} size="md" interactive3d={mode === "publish"} />
        </div>
      </div>
    </SectionShell>
  );
}

// ---- preview helpers: resolve the project's selected artwork + model URLs ----
function useProjectArtwork(projectId: Id<"generationProjects">): string | null {
  const candidates = useQuery(api.generation.listCandidates, { projectId });
  const sel = candidates?.find((c) => c.selected) ?? candidates?.[0];
  return sel?.url ?? null;
}

function useProjectModel(projectId: Id<"generationProjects">): string | null {
  const models = useQuery(api.generation.listModels, { projectId });
  const approved = models?.find((m) => m.approved && m.status === "completed");
  const completed = models?.find((m) => m.status === "completed");
  return (approved ?? completed)?.modelUrl ?? null;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
