// POST /api/forge/model
// Feeds the approved (or latest) multiview set into the Hunyuan3D worker to
// produce a textured GLB, downloads it, and stores it in Convex.
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convex, uploadToConvex, urlToBase64, errorMessage } from "../_worker";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  projectId: Id<"generationProjects">;
  // Optional hints from the client. The unauthenticated server Convex client
  // can't call admin queries, so the browser passes the multiview it wants.
  multiviewSetId?: Id<"multiviewSets">;
  frontUrl?: string;
  backUrl?: string;
  leftUrl?: string;
}

interface WorkerResponse {
  output?: { status?: string; glb_url?: string; error?: string };
  error?: string;
}

function isWarmingUp(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("build") || m.includes("not built") || m.includes("warming");
}

export async function POST(req: Request) {
  let modelId: Id<"generatedModels"> | null = null;
  try {
    const body = (await req.json()) as Body;
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    let { frontUrl, backUrl, leftUrl } = body;
    let multiviewSetId = body.multiviewSetId;

    if (!frontUrl || !backUrl || !leftUrl) {
      const sets = await convex.query(api.generation.listMultiview, { projectId });
      const set = sets.find((s) => s.approved && s.status === "completed") ?? sets[0];
      if (!set || set.status !== "completed") {
        return NextResponse.json(
          { ok: false, error: "No completed multiview set available." },
          { status: 400 },
        );
      }
      frontUrl = frontUrl ?? set.frontUrl ?? undefined;
      backUrl = backUrl ?? set.backUrl ?? undefined;
      leftUrl = leftUrl ?? set.leftUrl ?? undefined;
      multiviewSetId = multiviewSetId ?? set._id;
    }

    if (!frontUrl || !backUrl || !leftUrl) {
      return NextResponse.json(
        { ok: false, error: "Multiview set is missing required views." },
        { status: 400 },
      );
    }

    modelId = await convex.mutation(api.dev.createModel, {
      projectId,
      multiviewSet: multiviewSetId,
    });

    const workerUrl = `${process.env.THREED_WORKER_URL}/hunyuan3d_worker/runsync`;
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 3D infer is slow (30-120s warm, longer cold). No client timeout.
      // Pass Convex storage URLs; the worker downloads them (no 10MB base64 cap).
      body: JSON.stringify({
        input: {
          input_data: {
            action: "infer",
            textured: true,
            octree_resolution: 256,
            num_inference_steps: 30,
            max_facenum: 40000,
            front_url: frontUrl,
            back_url: backUrl,
            left_url: leftUrl,
          },
        },
      }),
    });

    const json = (await res.json()) as WorkerResponse;
    if (json.output?.status === "error" || (!json.output?.glb_url && (json.output?.error || json.error))) {
      throw new Error(json.output?.error ?? json.error ?? `status ${res.status}`);
    }
    if (!json.output?.glb_url) {
      throw new Error(`3D worker returned no model (status ${res.status}).`);
    }

    const glbRes = await fetch(json.output.glb_url);
    if (!glbRes.ok) throw new Error(`Failed to download GLB (${glbRes.status}).`);
    const glbBytes = new Uint8Array(await glbRes.arrayBuffer());
    const modelStorageId = await uploadToConvex(glbBytes, "model/gltf-binary");

    await convex.mutation(api.dev.updateModel, {
      id: modelId,
      status: "completed",
      modelStorageId,
    });

    return NextResponse.json({ ok: true, modelId });
  } catch (err) {
    let message = errorMessage(err);
    if (isWarmingUp(message)) {
      message = "3D worker still warming up, retry shortly.";
    }
    if (modelId) {
      await convex
        .mutation(api.dev.updateModel, { id: modelId, status: "failed", error: message })
        .catch(() => {});
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
