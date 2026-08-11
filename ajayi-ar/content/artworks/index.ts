import type { ArtworkConfig } from "@/lib/types";
import { aje } from "./aje";
import { theWatchfulEye } from "./the-watchful-eye";

/**
 * Every artwork in the Living Paintings archive registers itself here.
 * Adding painting #2 means: drop a new file in content/artworks/, export
 * its ArtworkConfig, and add it to this list — nothing else in the app
 * needs to change. See ajayi-ar/README.md for the full checklist.
 */
export const artworks: ArtworkConfig[] = [aje, theWatchfulEye];

export function getArtworkBySlug(slug: string): ArtworkConfig | undefined {
  return artworks.find((artwork) => artwork.slug === slug);
}

export function listArtworkSlugs(): string[] {
  return artworks.map((artwork) => artwork.slug);
}
