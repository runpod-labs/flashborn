// Server-side helpers shared by the Forge route handlers. These run only in
// Next.js Route Handlers (Node runtime) because the local `flash dev` workers
// live on localhost and Convex cloud can't reach them. Results are written back
// to Convex via the DEV mutations (api.dev.*), which intentionally skip auth.
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export type UploadContentType = "image/png" | "model/gltf-binary";

/**
 * Upload raw bytes to Convex storage and return the resulting storageId.
 * 1. ask Convex for a short-lived upload URL
 * 2. POST the bytes there with the right Content-Type
 * 3. parse the { storageId } the upload endpoint returns
 */
export async function uploadToConvex(
  bytes: Uint8Array | ArrayBuffer,
  contentType: UploadContentType,
): Promise<Id<"_storage">> {
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
  const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: body as BodyInit,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Convex upload failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { storageId: Id<"_storage"> };
  if (!json.storageId) throw new Error("Convex upload returned no storageId");
  return json.storageId;
}

/** Decode a base64 string (raw, no data-URI prefix) into bytes. */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  return new Uint8Array(Buffer.from(clean, "base64"));
}

/** Fetch a URL and return its bytes as a base64 string (no data-URI prefix). */
export async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference image (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

/** Random-ish seed for image generation. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

/** Normalize an unknown thrown value to a readable string. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
