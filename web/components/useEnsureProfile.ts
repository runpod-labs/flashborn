"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

/**
 * Ensures an app profile exists once the user is authenticated.
 * Safe to call from multiple mounted components — guarded so the
 * mutation only fires once per authenticated session.
 */
export function useEnsureProfile() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureProfile = useMutation(api.users.ensureProfile);
  const done = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || done.current) return;
    done.current = true;
    ensureProfile().catch(() => {
      // allow a retry if it failed
      done.current = false;
    });
  }, [isAuthenticated, isLoading, ensureProfile]);
}
