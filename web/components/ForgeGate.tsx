"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";

// Wraps Forge pages with admin gating. Renders children only for admins.
// Non-admins see an "Admin only" notice; @runpod.io users get a claim button.
export default function ForgeGate({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.getMe);
  const claimAdmin = useMutation(api.users.claimAdmin);

  if (me === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-faint">
        <span className="text-xs uppercase tracking-[0.3em]">Checking access…</span>
      </div>
    );
  }

  if (me?.isAdmin) return <>{children}</>;

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-24">
      <div className="relative w-full max-w-md rounded-2xl panel p-8 text-center">
        <div className="holo-trim pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-80" />
        <h1 className="font-display text-2xl font-bold text-grid-fg">Admin only</h1>
        <p className="mt-2 text-sm text-muted">
          The Forge is restricted to Flashborn admins. Sign in with a{" "}
          <span className="text-neon">@runpod.io</span> account to access the
          generation pipeline.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {me ? (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => void claimAdmin()}
            >
              Claim admin (@runpod.io)
            </Button>
          ) : null}
          <Link
            href="/signin"
            className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-neon"
          >
            Go to sign in →
          </Link>
        </div>
      </div>
    </main>
  );
}
