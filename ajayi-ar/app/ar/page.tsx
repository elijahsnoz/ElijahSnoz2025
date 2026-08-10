import Link from "next/link";
import type { Metadata } from "next";
import { artworks } from "@/content/artworks";

export const metadata: Metadata = {
  title: "Living Paintings",
  description: "The AJAYI VII Living Paintings archive — augmented reality experiences for physical paintings.",
};

export default function LivingPaintingsArchive() {
  return (
    <main className="min-h-[100dvh] bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs tracking-[0.3em] text-ink-soft uppercase">AJAYI VII</p>
        <h1 className="mt-3 font-display text-4xl italic">Living Paintings</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Each physical AJAYI VII painting carries a living counterpart. Scan the code beside the work, or open its
          page below, to watch it move.
        </p>
      </div>

      <ul className="mx-auto mt-14 flex max-w-md flex-col divide-y divide-line">
        {artworks.map((artwork) => (
          <li key={artwork.slug} className="py-5">
            <Link href={`/ar/${artwork.slug}`} className="flex items-baseline justify-between gap-4">
              <span className="font-display text-xl italic">{artwork.title}</span>
              <span className="text-[11px] tracking-[0.2em] text-ink-soft uppercase">{artwork.year} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
