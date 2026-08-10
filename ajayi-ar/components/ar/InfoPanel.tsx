"use client";

import type { ArtworkConfig } from "@/lib/types";

interface Props {
  artwork: ArtworkConfig;
  open: boolean;
  onClose: () => void;
}

export default function InfoPanel({ artwork, open, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${artwork.title} — artwork information`}
      className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-paper px-6 pt-6 pb-10 text-ink shadow-2xl transition-transform duration-300 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
      <p className="text-[11px] tracking-[0.25em] text-ink-soft uppercase">AJAYI VII</p>
      <h2 className="mt-2 font-display text-2xl italic">{artwork.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {artwork.year} · {artwork.medium}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{artwork.description}</p>
      {artwork.statement && (
        <p className="mt-4 font-display text-base italic leading-relaxed text-ink-soft">“{artwork.statement}”</p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-8 w-full border border-ink/15 py-3 text-[11px] tracking-[0.2em] uppercase"
      >
        Close
      </button>
    </div>
  );
}
