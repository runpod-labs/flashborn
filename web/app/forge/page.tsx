"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FACTION_THEME, RARITY_THEME, ROLE_LABEL } from "@/lib/theme";
import { ButtonLink } from "@/components/Button";
import TopNav from "@/components/TopNav";
import ForgeGate from "@/components/ForgeGate";
import ForgeStageBadge from "@/components/ForgeStageBadge";
import type { FactionId, RoleId, RarityId, PipelineStage } from "@flashborn/shared";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ProjectCard({
  project,
}: {
  project: {
    _id: string;
    workingTitle: string;
    faction: FactionId;
    role: RoleId;
    rarity: RarityId;
    stage: PipelineStage;
    updatedAt: number;
    thumbnailUrl: string | null;
  };
}) {
  const f = FACTION_THEME[project.faction];
  const r = RARITY_THEME[project.rarity];
  const failed = project.stage === "failed";

  return (
    <Link
      href={`/forge/${project._id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl panel transition-transform duration-150 hover:-translate-y-0.5"
      style={{ boxShadow: failed ? `inset 0 0 0 1px rgba(255,51,71,0.5)` : undefined }}
    >
      {/* Failed indicator */}
      {failed && (
        <span className="absolute right-3 top-3 z-10 flex h-2.5 w-2.5 animate-pulse rounded-full bg-os shadow-[0_0_10px_rgba(255,51,71,0.9)]" />
      )}

      {/* Thumbnail */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${f.dark}, #05070d)` }}
      >
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.workingTitle}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-50" style={{ color: f.primary }}>
              No concept yet
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute left-2 top-2">
          <ForgeStageBadge stage={project.stage} />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="truncate font-display text-sm font-bold text-grid-fg" title={project.workingTitle}>
          {project.workingTitle || "Untitled"}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ color: f.primary, background: `${f.primary}1f` }}
          >
            {f.name}
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
            {ROLE_LABEL[project.role]}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ color: r.color, background: `${r.color}1f` }}
          >
            {r.name}
          </span>
        </div>
        <span className="mt-auto text-[10px] text-faint">Updated {timeAgo(project.updatedAt)}</span>
      </div>
    </Link>
  );
}

function ForgeDashboard() {
  const projects = useQuery(api.projects.listProjects);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-grid-fg">
            The <span className="text-neon">Forge</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Generate, review, and publish Flashborn characters.
          </p>
        </div>
        <ButtonLink href="/forge/new" variant="primary" size="md">
          + New Character
        </ButtonLink>
      </div>

      <div className="mt-8">
        {projects === undefined ? (
          <div className="py-20 text-center text-xs uppercase tracking-[0.3em] text-faint">
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl panel py-20 text-center">
            <p className="text-sm text-muted">No characters in the Forge yet.</p>
            <ButtonLink href="/forge/new" variant="outline" size="md" className="mt-5">
              Forge your first character
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {projects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ForgePage() {
  return (
    <>
      <TopNav />
      <ForgeGate>
        <ForgeDashboard />
      </ForgeGate>
    </>
  );
}
