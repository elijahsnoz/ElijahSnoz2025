import Link from "next/link";
import type { Metadata } from "next";
import { artworks } from "@/content/artworks";

export const metadata: Metadata = {
  title: "The Archive",
  description: "The AJAYI VII digital art archive — paintings by Elijah Snoz (Ajayi VII).",
};

export default function ArtworkArchive() {
  return (
    <main className="min-h-[100dvh] bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs tracking-[0.3em] text-ink-soft uppercase">AJAYI VII</p>
        <h1 className="mt-3 font-display text-4xl italic">The Archive</h1>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-2">
        {artworks.map((artwork) => (
          <Link key={artwork.slug} href={`/art/${artwork.slug}`} className="group block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.image.src}
              alt={artwork.title}
              className="aspect-[4/5] w-full object-cover transition-opacity group-hover:opacity-90"
            />
            <p className="mt-3 font-display text-lg italic">{artwork.title}</p>
            <p className="text-[11px] tracking-[0.2em] text-ink-soft uppercase">
              {artwork.year} · {artwork.medium}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
