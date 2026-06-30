"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TopNav from "@/components/TopNav";
import { ButtonLink } from "@/components/Button";
import CardFrame, { type CardFrameData } from "@/components/CardFrame";

function FeaturedShowcase() {
  const legendaries = useQuery(api.cards.listPublished, { rarity: "legendary" });
  const [idx, setIdx] = useState(0);

  const cards = (legendaries ?? []) as CardFrameData[];
  const hasCards = cards.length > 0;

  useEffect(() => {
    if (cards.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % cards.length), 4500);
    return () => clearInterval(t);
  }, [cards.length]);

  if (!hasCards) {
    // Tasteful placeholder hero card
    return (
      <div className="relative animate-float">
        <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-br from-neon/20 via-neon-2/10 to-accent/20 blur-3xl" />
        <div className="relative w-[300px] aspect-[5/7] overflow-hidden rounded-2xl panel">
          <div className="holo-trim absolute -inset-[2px] rounded-2xl opacity-80" />
          <div className="absolute inset-[2px] flex flex-col items-center justify-center gap-4 rounded-2xl bg-grid-bg">
            <div className="h-20 w-20 rotate-45 rounded-lg bg-gradient-to-br from-neon to-neon-2 shadow-[0_0_40px_rgba(25,230,193,0.6)]" />
            <div className="text-center">
              <p className="font-display text-xl font-black uppercase tracking-widest holo-text">
                Legendary
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-faint">
                Forge incoming
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[idx % cards.length];
  return (
    <div className="relative animate-float">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-br from-neon/20 via-neon-2/10 to-accent/20 blur-3xl" />
      <CardFrame card={card} size="md" interactive3d={false} />
      {cards.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              aria-label={`Show card ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx % cards.length ? "w-6 bg-neon" : "w-1.5 bg-edge"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Feature({
  title,
  body,
  glyph,
  color,
}: {
  title: string;
  body: string;
  glyph: string;
  color: string;
}) {
  return (
    <div className="group relative rounded-xl panel p-5 transition-transform hover:-translate-y-1">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-xl"
        style={{ background: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}55` }}
      >
        {glyph}
      </div>
      <h3 className="font-display text-base font-bold text-grid-fg">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(77,163,255,0.12),transparent)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-neon">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" />
                Powered by Runpod Flash
              </span>
              <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight text-grid-fg sm:text-6xl">
                AI-born
                <br />
                <span className="holo-text">3D collectibles</span>
                <br />
                from The Grid
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
                Every Flashborn card begins as an AI-generated cyberpunk
                character and becomes a fully interactive 3D collectible. Open
                booster packs, rotate cards in your browser, and build your
                collection.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/packs" size="lg">
                  Open a pack
                </ButtonLink>
                <ButtonLink href="/explore" size="lg" variant="outline">
                  Explore cards
                </ButtonLink>
                <ButtonLink href="/signin" size="lg" variant="ghost">
                  Sign in
                </ButtonLink>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-faint">
                Concept → Multiview → 3D → Published · A Runpod Flash pipeline
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <FeaturedShowcase />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              color="#19e6c1"
              glyph="✦"
              title="AI-generated characters"
              body="Each unit is forged from a cyberpunk style spine — coherent faction art across the whole set."
            />
            <Feature
              color="#4da3ff"
              glyph="◈"
              title="Interactive 3D"
              body="Concept art is reconstructed into a real GLB model you can rotate, inspect, and own."
            />
            <Feature
              color="#ff8a00"
              glyph="⚡"
              title="Runpod Flash pipeline"
              body="Local Python generation code becomes a live GPU content pipeline — no Docker rebuilds."
            />
            <Feature
              color="#8b5cf6"
              glyph="◆"
              title="Collection loop"
              body="Spend credits on booster packs, chase legendaries, and showcase owned cards by serial."
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-edge">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-faint sm:flex-row sm:px-6">
            <span className="font-display font-black uppercase tracking-[0.2em] text-muted">
              FLASH<span className="text-neon">BORN</span>
            </span>
            <span>Powered by Runpod Flash · A cyberpunk collectible-card experiment</span>
          </div>
        </footer>
      </main>
    </>
  );
}
