"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useEnsureProfile } from "./useEnsureProfile";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative px-1 py-1 text-sm font-medium uppercase tracking-wider transition-colors ${
        active ? "text-neon" : "text-muted hover:text-grid-fg"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-0.5 left-0 h-px w-full bg-neon shadow-[0_0_8px_rgba(25,230,193,0.9)]" />
      )}
    </Link>
  );
}

export default function TopNav() {
  useEnsureProfile();
  const pathname = usePathname();
  const me = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();

  const links: { href: string; label: string }[] = [
    { href: "/explore", label: "Explore" },
    { href: "/collection", label: "Collection" },
    { href: "/packs", label: "Open Pack" },
  ];
  if (me?.isAdmin) links.push({ href: "/forge", label: "Forge" });

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-grid-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-neon to-neon-2">
            <span className="h-3 w-3 rotate-45 bg-grid-bg" />
          </span>
          <span className="font-display text-lg font-black uppercase tracking-[0.2em] text-grid-fg">
            FLASH<span className="text-neon">BORN</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              label={l.label}
              active={pathname === l.href || pathname.startsWith(l.href + "/")}
            />
          ))}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          <Authenticated>
            {me ? (
              <div className="flex items-center gap-3">
                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <span className="text-sm font-semibold text-grid-fg">
                    {me.displayName}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-pr-2">
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-pr-2" />
                    {me.credits} credits
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-md border border-edge px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted transition-colors hover:border-os/60 hover:text-os"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <span className="text-xs text-faint">Loading…</span>
            )}
          </Authenticated>
          <Unauthenticated>
            <Link
              href="/signin"
              className="rounded-md bg-gradient-to-r from-neon to-neon-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-grid-bg shadow-[0_0_18px_-4px_rgba(25,230,193,0.7)] transition-all hover:brightness-110"
            >
              Sign in
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
