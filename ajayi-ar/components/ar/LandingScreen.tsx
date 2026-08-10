import type { ArtworkConfig } from "@/lib/types";

interface Props {
  artwork: ArtworkConfig;
  onEnter: () => void;
}

export default function LandingScreen({ artwork, onEnter }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between bg-indigo-deep px-6 py-10 text-paper">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-xs tracking-[0.3em] text-paper/60 uppercase">AJAYI VII</p>
        <p className="mt-2 text-xs tracking-[0.3em] text-paper/60 uppercase">Living Paintings</p>

        <h1 className="mt-10 font-display text-4xl italic text-balance sm:text-5xl">{artwork.title}</h1>

        <p className="mt-6 max-w-xs font-display text-lg italic text-paper/80">
          &ldquo;Point your camera at the painting.&rdquo;
        </p>

        <button
          type="button"
          onClick={onEnter}
          className="mt-12 border border-paper/40 px-8 py-4 text-xs tracking-[0.25em] uppercase transition-colors hover:bg-paper hover:text-indigo-deep"
        >
          Enter the Living Painting
        </button>
      </div>

      <ol className="flex w-full max-w-xs flex-col gap-2 text-xs text-paper/60">
        <li className="flex gap-3">
          <span className="text-paper/40">1</span>
          <span>Allow camera access</span>
        </li>
        <li className="flex gap-3">
          <span className="text-paper/40">2</span>
          <span>Point your camera at the artwork</span>
        </li>
        <li className="flex gap-3">
          <span className="text-paper/40">3</span>
          <span>Watch it come alive</span>
        </li>
      </ol>
    </div>
  );
}
