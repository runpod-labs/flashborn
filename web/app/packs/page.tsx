"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api";
import TopNav from "@/components/TopNav";
import { Button, ButtonLink } from "@/components/Button";
import PackReveal, { type PackCard } from "@/components/PackReveal";
import PackSummary from "@/components/PackSummary";

const PACK_COST = 100;

function formatCountdown(ms: number): string {
  if (ms <= 0) return "ready";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function PackExperience() {
  const me = useQuery(api.users.getMe);
  const openPack = useMutation(api.packs.openPack);
  const claimFree = useMutation(api.users.claimFreeCredits);
  const grant = useMutation(api.users.grantSelfCredits);

  const [opening, setOpening] = useState(false);
  const [cards, setCards] = useState<PackCard[] | null>(null);
  const [revealComplete, setRevealComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "free" | "grant">(null);

  const credits = me?.credits ?? 0;
  const canOpen = credits >= PACK_COST && !opening;

  const nextFreeIn = useMemo(() => {
    if (!me?.nextFreeAt) return 0;
    return me.nextFreeAt - Date.now();
  }, [me?.nextFreeAt]);

  async function handleOpen() {
    setError(null);
    setOpening(true);
    setCards(null);
    setRevealComplete(false);
    try {
      const res = await openPack();
      setCards(res.cards as PackCard[]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not open the pack. Try again.",
      );
    } finally {
      setOpening(false);
    }
  }

  function reset() {
    setCards(null);
    setRevealComplete(false);
    setError(null);
  }

  async function handleClaimFree() {
    setBusy("free");
    setError(null);
    try {
      await claimFree();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Free credits not ready yet.");
    } finally {
      setBusy(null);
    }
  }

  async function handleGrant() {
    setBusy("grant");
    setError(null);
    try {
      await grant({ amount: 500 });
    } finally {
      setBusy(null);
    }
  }

  // ---- Reveal mode ----
  if (cards) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <PackReveal cards={cards} onDone={() => setRevealComplete(true)} />

        {revealComplete && (
          <div className="mt-10 flex flex-col items-center gap-7">
            <div className="text-center">
              <h2 className="font-display text-2xl font-black uppercase tracking-wide text-grid-fg">
                Pack complete
              </h2>
              <p className="mt-1 text-sm text-muted">
                5 cards added to your collection.
              </p>
            </div>
            <PackSummary cards={cards} />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleOpen}
                disabled={!canOpen}
                title={!canOpen ? "Not enough credits" : undefined}
              >
                Open another — {PACK_COST}
              </Button>
              <ButtonLink size="lg" variant="outline" href="/collection">
                Go to collection
              </ButtonLink>
              <Button size="lg" variant="ghost" onClick={reset}>
                Done
              </Button>
            </div>
            <p className="text-xs text-faint">
              {credits} credits remaining
            </p>
          </div>
        )}
      </div>
    );
  }

  // ---- Idle / open mode ----
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-neon">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" />
          Booster Pack
        </span>
        <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-grid-fg sm:text-5xl">
          Open a <span className="holo-text">Flashborn</span> pack
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Five cards per pack — three Common, one Uncommon, and one wildcard
          with a shot at Rare or Legendary.
        </p>
      </div>

      {/* Credits panel */}
      <div className="mx-auto mt-10 max-w-md rounded-2xl panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-faint">
              Your credits
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-4xl font-black text-pr-2">
              <span className="inline-block h-3 w-3 rotate-45 bg-pr-2 shadow-[0_0_12px_rgba(255,212,71,0.8)]" />
              {credits}
            </p>
          </div>
          <button
            onClick={handleGrant}
            disabled={busy !== null}
            className="rounded-md border border-edge px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-faint transition-colors hover:border-neon/50 hover:text-neon disabled:opacity-50"
            title="Demo helper: grant yourself 500 credits"
          >
            {busy === "grant" ? "…" : "+ credits"}
          </button>
        </div>

        <div className="mt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={handleOpen}
            disabled={!canOpen}
          >
            {opening
              ? "Opening…"
              : `Open Pack — ${PACK_COST} credits`}
          </Button>
          {credits < PACK_COST && (
            <p className="mt-2 text-center text-xs text-os">
              Not enough credits. Claim free credits below.
            </p>
          )}
        </div>

        {/* Free credits */}
        <div className="mt-4 border-t border-edge pt-4">
          {me?.freeReady ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClaimFree}
              disabled={busy !== null}
            >
              {busy === "free" ? "Claiming…" : "Claim free credits"}
            </Button>
          ) : (
            <p className="text-center text-xs text-faint">
              Next free credits in{" "}
              <span className="text-muted">{formatCountdown(nextFreeIn)}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-os/40 bg-os/10 px-3 py-2 text-center text-xs text-os">
            {error}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-faint">
        Pack = 100 credits · Free credits every 6 hours
      </p>
    </div>
  );
}

export default function PacksPage() {
  return (
    <>
      <TopNav />
      <main className="flex-1">
        <AuthLoading>
          <div className="flex min-h-[60vh] items-center justify-center text-faint">
            <span className="text-xs uppercase tracking-[0.3em]">Loading…</span>
          </div>
        </AuthLoading>
        <Authenticated>
          <PackExperience />
        </Authenticated>
        <Unauthenticated>
          <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
            <h1 className="font-display text-3xl font-black tracking-tight text-grid-fg">
              Sign in to open packs
            </h1>
            <p className="mt-3 text-muted">
              Create a runner or continue as a guest to claim 300 starter
              credits and open your first booster pack.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <ButtonLink href="/signin" size="lg" className="w-full max-w-xs">
                Sign in
              </ButtonLink>
              <Link
                href="/signin"
                className="text-sm font-medium uppercase tracking-wider text-accent hover:text-neon"
              >
                Continue as guest
              </Link>
            </div>
          </div>
        </Unauthenticated>
      </main>
    </>
  );
}
