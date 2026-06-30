"use client";

import { useEffect, useState } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

// model-viewer is a custom element loaded from a CDN module script.
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  poster?: string;
  alt?: string;
  "camera-controls"?: boolean;
  "disable-zoom"?: boolean;
  "disable-pan"?: boolean;
  "disable-tap"?: boolean;
  "auto-rotate"?: boolean;
  "rotation-per-second"?: string;
  "shadow-intensity"?: string;
  "interaction-prompt"?: string;
  "auto-rotate-delay"?: string;
  "camera-orbit"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "field-of-view"?: string;
  exposure?: string;
  "environment-image"?: string;
  loading?: string;
  reveal?: string;
};

declare module "react" {
  // React 19 reads custom elements from React.JSX.IntrinsicElements.
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

const CDN_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";

let scriptInjected = false;

export default function ModelViewer({
  src,
  poster,
  className = "",
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(
    typeof window !== "undefined" &&
      !!customElements.get("model-viewer"),
  );

  // Only render the custom element after mount (SSR guard).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inject the CDN module script once on the client.
  useEffect(() => {
    if (!mounted) return;
    if (customElements.get("model-viewer")) {
      setReady(true);
      return;
    }
    if (!scriptInjected) {
      scriptInjected = true;
      const s = document.createElement("script");
      s.type = "module";
      s.src = CDN_SRC;
      document.head.appendChild(s);
    }
    let cancelled = false;
    customElements
      .whenDefined("model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {mounted && ready ? (
        <model-viewer
          src={src}
          poster={poster}
          alt="3D collectible"
          camera-controls
          disable-zoom
          disable-pan
          disable-tap
          camera-orbit="0deg 82deg 105%"
          // Drag turns the REAL 3D model left/right (true 3D, never a skewed
          // flat image). Clamped azimuth so you see the sides but never the
          // back; clamped polar so it stays upright. No auto-rotate.
          min-camera-orbit="-55deg 65deg auto"
          max-camera-orbit="55deg 98deg auto"
          field-of-view="32deg"
          shadow-intensity="1"
          exposure="1.05"
          interaction-prompt="none"
          loading="eager"
          reveal="auto"
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            "--poster-color": "transparent",
          } as React.CSSProperties}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-faint">
          <div className="relative h-10 w-10">
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em]">
            Loading 3D
          </span>
        </div>
      )}
    </div>
  );
}
