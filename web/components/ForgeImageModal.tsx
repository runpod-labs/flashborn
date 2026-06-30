"use client";

import { useEffect } from "react";

// Full-size inspector modal for generated artwork. Clicking the backdrop or
// pressing Escape closes it.
export default function ForgeImageModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? "Generated artwork"}
          className="max-h-[85vh] w-auto rounded-lg border border-edge shadow-[0_0_60px_-10px_rgba(25,230,193,0.5)]"
        />
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-surface text-muted transition-colors hover:border-os hover:text-os"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
