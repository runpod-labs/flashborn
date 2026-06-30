/**
 * Pipeline + generation job status definitions shared between the web app
 * (Convex) and the worker integration layer.
 */

/** Stage of a generation project as it moves through The Forge. */
export const PIPELINE_STAGES = [
  "draft",
  "concept_generating",
  "concepts_ready",
  "concept_selected",
  "multiview_generating",
  "multiview_ready",
  "model_generating",
  "model_ready",
  "card_configured",
  "published",
  "failed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Generic status for any single GPU job (concept / multiview / 3d). */
export const JOB_STATUSES = ["pending", "running", "completed", "failed"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** How an owned card instance was acquired. */
export const ACQUISITION_SOURCES = ["pack", "starter", "admin_grant"] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];
