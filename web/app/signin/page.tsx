"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";

type Flow = "signIn" | "signUp";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const ensureProfile = useMutation(api.users.ensureProfile);

  const [flow, setFlow] = useState<Flow>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "credentials" | "guest">(null);

  async function finish() {
    try {
      await ensureProfile();
    } catch {
      // profile may already exist — ignore
    }
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("credentials");
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);
      fd.set("flow", flow);
      await signIn("password", fd);
      await finish();
    } catch (err) {
      setError(
        flow === "signUp"
          ? "Could not create that account. Try a different email or a stronger password."
          : "Invalid email or password.",
      );
      setBusy(null);
    }
  }

  async function handleGuest() {
    setError(null);
    setBusy("guest");
    try {
      await signIn("anonymous");
      await finish();
    } catch {
      setError("Guest sign-in failed. Please try again.");
      setBusy(null);
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,0.14),transparent)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-neon to-neon-2">
            <span className="h-3.5 w-3.5 rotate-45 bg-grid-bg" />
          </span>
          <span className="font-display text-xl font-black uppercase tracking-[0.2em]">
            FLASH<span className="text-neon">BORN</span>
          </span>
        </Link>

        <div className="relative rounded-2xl panel p-7">
          <div className="holo-trim pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-80" />

          <h1 className="font-display text-2xl font-bold text-grid-fg">
            {flow === "signIn" ? "Enter The Grid" : "Create your runner"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {flow === "signIn"
              ? "Sign in to access your collection and packs."
              : "Sign up and claim 300 starter credits."}
          </p>

          {/* Flow toggle */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-edge bg-surface p-1">
            {(["signIn", "signUp"] as Flow[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFlow(f);
                  setError(null);
                }}
                className={`rounded-md py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  flow === f
                    ? "bg-gradient-to-r from-neon to-neon-2 text-grid-bg"
                    : "text-muted hover:text-grid-fg"
                }`}
              >
                {f === "signIn" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="runner@thegrid.net"
                className="w-full rounded-md border border-edge bg-surface px-3 py-2.5 text-sm text-grid-fg outline-none transition-colors placeholder:text-faint focus:border-neon focus:shadow-[0_0_0_3px_rgba(25,230,193,0.15)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-faint">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-edge bg-surface px-3 py-2.5 text-sm text-grid-fg outline-none transition-colors placeholder:text-faint focus:border-neon focus:shadow-[0_0_0_3px_rgba(25,230,193,0.15)]"
              />
            </div>

            {error && (
              <div className="rounded-md border border-os/40 bg-os/10 px-3 py-2 text-xs text-os">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={busy !== null}
            >
              {busy === "credentials"
                ? "Connecting…"
                : flow === "signIn"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-faint">
            <span className="h-px flex-1 bg-edge" />
            or
            <span className="h-px flex-1 bg-edge" />
          </div>

          <button
            onClick={handleGuest}
            disabled={busy !== null}
            className="w-full rounded-md border border-accent/50 bg-accent/10 px-5 py-3 text-sm font-bold uppercase tracking-wider text-accent transition-all hover:border-accent hover:bg-accent/20 disabled:opacity-50"
          >
            {busy === "guest" ? "Entering…" : "Continue as guest"}
          </button>
          <p className="mt-3 text-center text-[11px] text-faint">
            Guests get 300 credits and a full collection — no email required.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          <Link href="/" className="hover:text-neon">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
