// POST /api/forge/multiview
// Uses the project's selected concept as a reference image and asks the image
// worker (editing mode) for four consistent orthographic views, then records
// them as a multiviewSet.
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildMultiviewPrompt } from "@/lib/prompt";
import type { FactionId } from "@flashborn/shared";
import {
  convex,
  uploadToConvex,
  base64ToBytes,
  urlToBase64,
  errorMessage,
} from "../_worker";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  projectId: Id<"generationProjects">;
  // Optional hints from the client (which already has authed query results).
  // The unauthenticated server-side Convex client cannot call admin queries, so
  // the client passes the selected concept it wants to use as the reference.
  faction?: FactionId;
  selectedCandidateId?: Id<"imageCandidates">;
  refUrl?: string;
}

interface WorkerResponse {
  output?: { status?: string; image_b64?: string; error?: string };
  error?: string;
}

const VIEWS = ["front", "left", "right", "back"] as const;
type View = (typeof VIEWS)[number];

export async function POST(req: Request) {
  let setId: Id<"multiviewSets"> | null = null;
  try {
    const body = (await req.json()) as Body;
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    // Resolve faction + reference image. Prefer client-supplied hints (the
    // browser already has authenticated query results); otherwise try the
    // admin queries (only works if the server client is authenticated).
    let faction = body.faction;
    let refUrl = body.refUrl;
    let sourceCandidate = body.selectedCandidateId;

    if (!faction || !refUrl) {
      const project = await convex.query(api.projects.getProject, { id: projectId });
      if (!project) {
        return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
      }
      faction = faction ?? (project.faction as FactionId);
      const candidates = await convex.query(api.generation.listCandidates, { projectId });
      const selected =
        candidates.find((c) => c.selected) ??
        (project.selectedCandidate
          ? candidates.find((c) => c._id === project.selectedCandidate)
          : undefined);
      refUrl = refUrl ?? selected?.url ?? undefined;
      sourceCandidate = sourceCandidate ?? selected?._id;
    }

    if (!refUrl) {
      return NextResponse.json(
        { ok: false, error: "No selected concept with artwork to use as reference." },
        { status: 400 },
      );
    }
    const refBase64 = await urlToBase64(refUrl);

    // Create the set up front so the UI can show a "running" placeholder.
    setId = await convex.mutation(api.dev.createMultiviewSet, {
      projectId,
      sourceCandidate,
    });

    const workerUrl = `${process.env.IMAGE_WORKER_URL}/hidream_worker/runsync`;
    const storageIds: Partial<Record<View, Id<"_storage">>> = {};

    for (const view of VIEWS) {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            input_data: {
              action: "generate",
              prompt: buildMultiviewPrompt(view, faction),
              seed: 7,
              width: 768,
              height: 1024,
              ref_image_b64: refBase64,
            },
          },
        }),
      });
      const json = (await res.json()) as WorkerResponse;
      if (json.output?.status !== "ok" || !json.output.image_b64) {
        throw new Error(
          `${view} view failed: ${json.output?.error ?? json.error ?? `status ${res.status}`}`,
        );
      }
      storageIds[view] = await uploadToConvex(base64ToBytes(json.output.image_b64), "image/png");
    }

    await convex.mutation(api.dev.updateMultiviewSet, {
      id: setId,
      status: "completed",
      frontStorageId: storageIds.front,
      leftStorageId: storageIds.left,
      rightStorageId: storageIds.right,
      backStorageId: storageIds.back,
    });

    return NextResponse.json({ ok: true, setId });
  } catch (err) {
    const message = errorMessage(err);
    if (setId) {
      await convex
        .mutation(api.dev.updateMultiviewSet, { id: setId, status: "failed", error: message })
        .catch(() => {});
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
