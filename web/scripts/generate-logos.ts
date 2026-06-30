/**
 * Flashborn LOGO generation — 50 cyberpunk wordmark / emblem / icon variations.
 *
 * Saves PNGs straight to .scratch/logos/ for review (no Convex). Each logo is a
 * clean, centered subject on a neutral dark background, designed so it can later
 * be turned into a 3D asset (Hunyuan3D) — so: bold legible letterforms, high
 * contrast, sharp edges, no scene, no clutter.
 *
 * Run:  npx tsx scripts/generate-logos.ts [concurrency]
 *   IMAGE_WORKER_URL  default http://localhost:8892
 */
import fs from "node:fs";
import path from "node:path";

const CONCURRENCY = parseInt(process.argv[2] || "3", 10);
const WORKER = process.env.IMAGE_WORKER_URL || "http://localhost:8892";

const outDir = path.join(__dirname, "..", "..", ".scratch", "logos");
fs.mkdirSync(outDir, { recursive: true });

// Shared style spine. Folded into every prompt. The model (HiDream dev) is
// CFG-free, so "avoid X" guidance is phrased positively where it matters.
const SPINE =
  "Cyberpunk tech brand identity for a 3D collectible-card platform called Flashborn. " +
  "Flat plain neutral dark studio background, even soft lighting, very high contrast, " +
  "crisp razor-sharp clean edges, fully isolated and centered, no scene, no busy details, " +
  "no extra paragraph text, vector-clean and uncluttered, premium and minimal, " +
  "designed to be reconstructed into a clean 3D extruded emblem.";

// Wordmark cue: keep the spelling explicit so the diffusion text comes out right.
const WORD =
  'The single word "FLASHBORN" rendered as one bold custom wordmark, correctly spelled, all letters legible, centered.';

interface Logo {
  label: string;
  prompt: string;
  w: number;
  h: number;
}

// ── Wordmark treatments (different materials / type styles) ──────────────────
const wordmarkStyles: { tag: string; style: string }[] = [
  { tag: "chrome", style: "polished liquid-chrome 3D extruded metal letters with electric-blue neon rim light" },
  { tag: "neon-tube-cyan", style: "glowing neon glass tube lettering in electric cyan, subtle bloom" },
  { tag: "holo-glitch", style: "holographic iridescent letters with a controlled magenta-violet glitch shift" },
  { tag: "circuit", style: "dark metal letters engraved with glowing teal circuit-board traces" },
  { tag: "heat-gunmetal", style: "brushed gunmetal letters with a molten orange heat glow along the edges" },
  { tag: "carbon", style: "matte carbon-fiber letters seamed with thin electric-blue light lines" },
  { tag: "stencil-red", style: "heavy industrial stencil letterforms with reactor-red accents" },
  { tag: "wireframe", style: "outlined neon wireframe vector letters, thin glowing cyan strokes" },
  { tag: "frosted-glass", style: "frosted glass letters lit from within by soft LED glow" },
  { tag: "arc-energy", style: "letters formed from crackling electric-arc lightning energy" },
  { tag: "datastream", style: "letters dissolving into a vertical digital data-stream of glowing pixels" },
  { tag: "emboss-underglow", style: "embossed dark metal letters with a cool cyan underglow" },
  { tag: "white-minimal", style: "clean minimalist white geometric tech sans-serif wordmark with a faint neon edge" },
  { tag: "molten-core", style: "dark metal letters with a glowing molten energy core bleeding through the seams" },
  { tag: "glossy-black", style: "sleek glossy black letters outlined by a thin electric-blue light" },
  { tag: "scanline-chrome", style: "retro-future chrome letters with subtle scanline reflections" },
  { tag: "violet-spectral", style: "spectral violet glowing letters with a faint corrupt-magenta haze, Ghostware vibe" },
  { tag: "teal-signal", style: "signal-teal glowing tech letters with warning-yellow micro accents, Patchrunner vibe" },
  { tag: "ice-armor", style: "ice-white armored beveled letters with electric-blue trim, Kernel Guard vibe" },
  { tag: "hazard-orange", style: "heat-orange and gunmetal aggressive angular letters, Overclock Syndicate vibe" },
  { tag: "neon-outline-pink", style: "thin neon outline letters in hot pink and cyan dual glow on black" },
  { tag: "liquid-metal", style: "flowing liquid-metal mercury letters catching neon reflections" },
  { tag: "engraved-stone", style: "dark obsidian-engraved letters with glowing inlaid neon channels" },
  { tag: "hologram-projection", style: "semi-transparent holographic projected letters with soft volumetric glow" },
];

// ── Wordmark + lightning/spark icon (the "flash" motif) ──────────────────────
const wordmarkWithIcon: { tag: string; style: string }[] = [
  { tag: "icon-bolt-above", style: "a sleek glowing lightning-bolt mark centered above the wordmark, chrome with neon-blue glow" },
  { tag: "icon-spark-burst", style: "a sharp energy spark-burst emblem above the wordmark, electric cyan" },
  { tag: "icon-power-core", style: "a glowing circular energy power-core symbol above the wordmark" },
  { tag: "icon-bolt-replace-i", style: "a lightning bolt integrated as a letter stroke within the wordmark, neon glow" },
  { tag: "icon-hex-bolt", style: "a hexagonal tech badge containing a lightning bolt, set above the wordmark" },
  { tag: "icon-chip-spark", style: "a microchip emblem emitting a spark, centered above the wordmark, teal glow" },
  { tag: "icon-orbit-ring", style: "a glowing orbital ring with a spark, above the wordmark, violet glow" },
  { tag: "icon-triangle-bolt", style: "a triangular warning-style emblem with a lightning bolt above the wordmark, orange glow" },
];

// ── Emblem / monogram badges ─────────────────────────────────────────────────
const emblems: { tag: string; prompt: string }[] = [
  { tag: "emblem-F-hex", prompt: 'A cyberpunk emblem: a glowing chrome letter "F" monogram fused with a lightning bolt inside a hexagonal tech badge, electric-blue neon.' },
  { tag: "emblem-FB-shield", prompt: 'A cyberpunk crest: an "FB" monogram on an armored shield badge, ice-white and electric-blue, sharp metallic bevels.' },
  { tag: "emblem-F-circuit-ring", prompt: 'A circular emblem: a stylized letter "F" formed from glowing circuit traces inside a thin neon ring, teal and cyan.' },
  { tag: "emblem-bolt-shield", prompt: 'A minimalist badge: a lightning bolt inside a rounded shield, chrome with neon rim light.' },
  { tag: "emblem-F-core", prompt: 'An emblem: a letter "F" carved into a glowing molten energy core, reactor red and orange.' },
  { tag: "emblem-diamond-bolt", prompt: 'A diamond-shaped tech sigil with a central lightning spark, spectral violet and magenta glow.' },
];

// ── Icon-only flash / spark marks (app-icon style) ───────────────────────────
const icons: { tag: string; prompt: string }[] = [
  { tag: "appicon-bolt", prompt: "A clean app-icon-style cyberpunk lightning bolt mark, polished chrome with electric-blue neon glow, centered." },
  { tag: "appicon-spark-core", prompt: "A clean app-icon-style glowing energy spark inside a rounded square tech tile, cyan neon, centered." },
  { tag: "appicon-power", prompt: "A clean app-icon-style power-button energy symbol, neon teal ring with a central spark, centered." },
  { tag: "appicon-circuit-bolt", prompt: "A clean app-icon-style lightning bolt formed from circuit traces, glowing on dark metal, centered." },
  { tag: "appicon-prism", prompt: "A clean app-icon-style faceted prism emitting a neon spark, iridescent violet and cyan, centered." },
  { tag: "appicon-hex-spark", prompt: "A clean app-icon-style hexagon tile with a glowing central energy spark, orange and gunmetal, centered." },
];

// Assemble the 50 jobs.
const logos: Logo[] = [];
for (const s of wordmarkStyles)
  logos.push({ label: `word-${s.tag}`, prompt: `Logo design. ${WORD} ${s.style}. ${SPINE}`, w: 1216, h: 704 });
for (const s of wordmarkWithIcon)
  logos.push({ label: `wordicon-${s.tag}`, prompt: `Logo lockup. ${WORD} With ${s.style}. ${SPINE}`, w: 1024, h: 1024 });
for (const e of emblems)
  logos.push({ label: e.tag, prompt: `${e.prompt} ${SPINE}`, w: 1024, h: 1024 });
for (const ic of icons)
  logos.push({ label: ic.tag, prompt: `${ic.prompt} ${SPINE}`, w: 1024, h: 1024 });

// (24 + 8 + 6 + 6 = 44) — top up to 50 with extra seeds of the strongest families.
const topUps: { label: string; src: Logo }[] = [
  { label: "word-chrome-v2", src: logos[0] },
  { label: "word-neon-tube-cyan-v2", src: logos[1] },
  { label: "word-holo-glitch-v2", src: logos[2] },
  { label: "wordicon-bolt-above-v2", src: logos[24] },
  { label: "emblem-F-hex-v2", src: logos.find((l) => l.label === "emblem-F-hex")! },
  { label: "appicon-bolt-v2", src: logos.find((l) => l.label === "appicon-bolt")! },
];
for (const t of topUps) logos.push({ ...t.src, label: t.label });

async function genImage(prompt: string, seed: number, w: number, h: number): Promise<Buffer> {
  const res = await fetch(`${WORKER}/hidream_worker/runsync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { input_data: { action: "generate", prompt, seed, width: w, height: h } },
    }),
  });
  const data = (await res.json()) as any;
  const o = data.output ?? data;
  if (o?.status !== "ok" || !o.image_b64) {
    throw new Error(`gen failed: ${JSON.stringify(o).slice(0, 300)}`);
  }
  return Buffer.from(o.image_b64, "base64");
}

async function runJob(idx: number, logo: Logo, attempt = 1): Promise<boolean> {
  const seed = 4200 + idx * 13;
  const file = path.join(outDir, `${String(idx + 1).padStart(2, "0")}_${logo.label}.png`);
  try {
    const png = await genImage(logo.prompt, seed, logo.w, logo.h);
    fs.writeFileSync(file, png);
    console.log(`  ✓ #${idx + 1} ${logo.label} (seed ${seed})`);
    return true;
  } catch (e: any) {
    if (attempt < 3) {
      console.log(`  ↻ retry #${idx + 1} ${logo.label} (${e.message?.slice(0, 80)})`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return runJob(idx, logo, attempt + 1);
    }
    console.log(`  ✗ FAIL #${idx + 1} ${logo.label}: ${e.message?.slice(0, 120)}`);
    return false;
  }
}

async function pool<T>(items: T[], n: number, fn: (t: T, i: number) => Promise<any>) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log(`Generating ${logos.length} Flashborn logos via ${WORKER} (concurrency ${CONCURRENCY})`);
  console.log(`Output: ${outDir}`);
  let done = 0,
    ok = 0;
  await pool(logos, CONCURRENCY, async (logo, idx) => {
    const r = await runJob(idx, logo);
    done++;
    if (r) ok++;
    if (done % 10 === 0) console.log(`--- progress ${done}/${logos.length} (${ok} ok) ---`);
  });
  console.log(`DONE: ${ok}/${logos.length} succeeded -> ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
