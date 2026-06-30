"use client";

import { useState } from "react";

/**
 * Share/copy button for the public owned-card page.
 * Uses the Web Share API when available (mobile), otherwise copies the
 * current URL to the clipboard and shows a transient "Copied!" confirmation.
 *
 * Themed via the `accent` prop (faction primary color) so it reads as part of
 * the card's faction identity.
 */
export default function ShareButton({
  title,
  text,
  accent = "#19e6c1",
  iconOnly = false,
}: {
  title?: string;
  text?: string;
  accent?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onShare() {
    if (busy) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    // Prefer the native share sheet on supporting devices (mostly mobile).
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        setBusy(true);
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the share sheet, or it failed — fall back to copy.
      } finally {
        setBusy(false);
      }
    }

    // Clipboard fallback.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Legacy fallback for non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently ignore — nothing more we can do.
    }
  }

  const icon = copied ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onShare}
        aria-label={copied ? "Link copied" : "Copy link to share"}
        title={copied ? "Link copied" : "Copy link"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        style={{
          color: accent,
          borderColor: `${accent}55`,
          background: `${accent}12`,
        }}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Share this card"
      className="group inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5 active:translate-y-0"
      style={{
        color: accent,
        borderColor: `${accent}66`,
        background: `${accent}12`,
        boxShadow: `0 0 18px -6px ${accent}99`,
      }}
    >
      {icon}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
