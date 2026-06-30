"use client";

import type { PipelineStage } from "@flashborn/shared";

// Visual treatment for each pipeline stage. Mirrors the cyberpunk token set.
const STAGE_META: Record<
  PipelineStage,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: { label: "Draft", color: "#8492aa", bg: "rgba(132,146,170,0.12)", border: "rgba(132,146,170,0.4)" },
  concept_generating: { label: "Concepts…", color: "#4da3ff", bg: "rgba(77,163,255,0.12)", border: "rgba(77,163,255,0.4)" },
  concepts_ready: { label: "Concepts ready", color: "#4da3ff", bg: "rgba(77,163,255,0.14)", border: "rgba(77,163,255,0.5)" },
  concept_selected: { label: "Concept picked", color: "#19e6c1", bg: "rgba(25,230,193,0.12)", border: "rgba(25,230,193,0.45)" },
  multiview_generating: { label: "Multiview…", color: "#19e6c1", bg: "rgba(25,230,193,0.12)", border: "rgba(25,230,193,0.4)" },
  multiview_ready: { label: "Multiview ready", color: "#19e6c1", bg: "rgba(25,230,193,0.16)", border: "rgba(25,230,193,0.55)" },
  model_generating: { label: "3D model…", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.4)" },
  model_ready: { label: "Model ready", color: "#8b5cf6", bg: "rgba(139,92,246,0.16)", border: "rgba(139,92,246,0.55)" },
  card_configured: { label: "Configured", color: "#ffd447", bg: "rgba(255,212,71,0.12)", border: "rgba(255,212,71,0.45)" },
  published: { label: "Published", color: "#46d39a", bg: "rgba(70,211,154,0.16)", border: "rgba(70,211,154,0.6)" },
  failed: { label: "Failed", color: "#ff3347", bg: "rgba(255,51,71,0.16)", border: "rgba(255,51,71,0.6)" },
};

export default function ForgeStageBadge({ stage }: { stage: PipelineStage }) {
  const meta = STAGE_META[stage] ?? STAGE_META.draft;
  const animated =
    stage === "concept_generating" ||
    stage === "multiview_generating" ||
    stage === "model_generating";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${animated ? "animate-pulse" : ""}`}
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}
