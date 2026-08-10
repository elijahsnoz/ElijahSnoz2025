import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug, listArtworkSlugs } from "@/content/artworks";
import QRCodeImage from "@/components/ui/QRCode";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return listArtworkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);
  if (!artwork) return {};

  return {
    title: artwork.title,
    description: artwork.description,
    alternates: { canonical: `/art/${artwork.slug}` },
    openGraph: {
      title: `${artwork.title} — AJAYI VII`,
      description: artwork.description,
      images: [{ url: artwork.image.src, width: artwork.image.width, height: artwork.image.height }],
    },
  };
}

export default async function ArtworkPage({ params }: Params) {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);
  if (!artwork) notFound();

  const arUrl = `https://elijahsnoz.me/ar/${artwork.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    creator: { "@type": "Person", name: artwork.artist },
    dateCreated: String(artwork.year),
    artMedium: artwork.medium,
    description: artwork.description,
    image: `https://elijahsnoz.me${artwork.image.src}`,
    url: `https://elijahsnoz.me/art/${artwork.slug}`,
  };

  return (
    <main className="min-h-[100dvh] bg-paper px-6 py-16 text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artwork.image.src} alt={artwork.title} className="w-full object-cover" />

        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase">AJAYI VII</p>
          <h1 className="mt-3 font-display text-3xl italic">{artwork.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {artwork.year} · {artwork.medium} · {artwork.dimensions}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">{artwork.description}</p>

          <Link
            href={`/ar/${artwork.slug}`}
            className="mt-8 inline-block border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase transition-colors hover:bg-ink hover:text-paper"
          >
            Experience in AR
          </Link>

          <div className="mt-10 border-t border-line pt-8">
            <QRCodeImage url={arUrl} label="Scan for the Living Painting" />
          </div>
        </div>
      </div>
    </main>
  );
}
