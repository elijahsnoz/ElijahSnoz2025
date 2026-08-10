import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug, listArtworkSlugs } from "@/content/artworks";
import ARExperience from "@/components/ar/ARExperience";

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

  const description = `Experience "${artwork.title}" by ${artwork.artist} through an interactive augmented reality artwork. Point your phone at the physical painting and watch it come alive.`;

  return {
    title: artwork.title,
    description,
    alternates: { canonical: `/ar/${artwork.slug}` },
    openGraph: {
      title: `AJAYI VII — Living Paintings | ${artwork.title}`,
      description,
      images: [{ url: artwork.image.src, width: artwork.image.width, height: artwork.image.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: `AJAYI VII — Living Paintings | ${artwork.title}`,
      description,
      images: [artwork.image.src],
    },
  };
}

export default async function ArtworkARPage({ params }: Params) {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);
  if (!artwork) notFound();

  return <ARExperience artwork={artwork} />;
}
