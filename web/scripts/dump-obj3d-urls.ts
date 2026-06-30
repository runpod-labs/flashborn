/** Upload the cached object-3D inputs/output to Convex and print their URLs. */
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

function env(key: string): string {
  const file = path.join(__dirname, "..", ".env.local");
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) throw new Error(`${key} missing`);
  return m[1].replace(/^["']|["']$/g, "").trim();
}
const client = new ConvexHttpClient(env("NEXT_PUBLIC_CONVEX_URL"));
const scratch = path.join(__dirname, "..", "..", ".scratch", "obj3d");

async function upload(bytes: Buffer, contentType: string): Promise<string> {
  const url = await client.mutation(api.files.generateUploadUrl, {});
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(bytes) });
  const { storageId } = (await r.json()) as { storageId: string };
  return storageId;
}

async function main() {
  const slug = process.argv[2] || "bulwark-core";
  const files: [string, string, string][] = [
    [`${slug}_front.png`, "image/png", "FRONT view"],
    [`${slug}_left.png`, "image/png", "LEFT view"],
    [`${slug}_back.png`, "image/png", "BACK view"],
    [`${slug}.glb`, "model/gltf-binary", "GLB model"],
  ];
  for (const [name, ct, label] of files) {
    const p = path.join(scratch, name);
    if (!fs.existsSync(p)) { console.log(`  (missing) ${name}`); continue; }
    const sid = await upload(fs.readFileSync(p), ct);
    const url = await client.query(api.files.getUrl, { storageId: sid as any });
    console.log(`${label}\n  ${url}\n`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
