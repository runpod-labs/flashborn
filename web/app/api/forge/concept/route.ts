// POST /api/forge/concept
// Generates `count` concept images via the local HiDream image worker, uploads
// each PNG to Convex storage, and records it as an imageCandidate.
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buildConceptPrompt } from "@/lib/prompt";
import type { FactionId, RoleId, RarityId } from "@flashborn/shared";
import {
  convex,
  uploadToConvex,
  base64ToBytes,
  randomSeed,
  errorMessage,
} from "../_worker";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  projectId: Id<"generationProjects">;
  count?: number;
  faction: FactionId;
  role: RoleId;
  rarity: RarityId;
  character: string;
  extra?: string;
  // Client-supplied next index so "Generate more" keeps appending. The server
  // Convex client is unauthenticated and can't read the admin candidate list.
  startIndex?: number;
}

interface WorkerResponse {
  output?: { status?: string; image_b64?: string; error?: string };
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { projectId, faction, role, rarity, character, extra } = body;
    const count = Math.max(1, Math.min(body.count ?? 6, 12));

    if (!projectId || !faction || !role || !rarity || !character) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const prompt = buildConceptPrompt({ faction, role, rarity, character, extra });
    const workerUrl = `${process.env.IMAGE_WORKER_URL}/hidream_worker/runsync`;

    let added = 0;
    const failures: string[] = [];

    // Next free candidate index so "Generate more" keeps appending. Prefer the
    // client hint; fall back to the admin query if the server client happens to
    // be authenticated, else start at 0.
    let nextIndex = body.startIndex ?? 0;
    if (body.startIndex === undefined) {
      try {
        const existing = await convex.query(api.generation.listCandidates, { projectId });
        nextIndex = existing.reduce((max, c) => Math.max(max, c.index + 1), 0);
      } catch {
        nextIndex = 0;
      }
    }

    for (let i = 0; i < count; i++) {
      const seed = randomSeed();
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: {
              input_data: {
                action: "generate",
                prompt,
                seed,
                width: 768,
                height: 1024,
              },
            },
          }),
        });
        const json = (await res.json()) as WorkerResponse;
        if (json.output?.status !== "ok" || !json.output.image_b64) {
          throw new Error(
            json.output?.error ?? json.error ?? `Worker returned status ${res.status}`,
          );
        }
        const bytes = base64ToBytes(json.output.image_b64);
        const storageId = await uploadToConvex(bytes, "image/png");
        await convex.mutation(api.dev.addCandidate, {
          projectId,
          storageId,
          index: nextIndex++,
          promptUsed: prompt,
          seed,
        });
        added++;
      } catch (err) {
        failures.push(errorMessage(err));
      }
    }

    if (added === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: failures[0] ?? "No concepts were generated.",
          failures,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, added, failures });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
  }
}
