"use client";

interface Props {
  soundOn: boolean;
  soundAvailable: boolean;
  onToggleSound: () => void;
  onToggleInfo: () => void;
  onExit: () => void;
}

export default function ControlsBar({ soundOn, soundAvailable, onToggleSound, onToggleInfo, onExit }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 px-6 pb-8">
      {soundAvailable && (
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute ambient sound" : "Enable ambient sound"}
          className="rounded-full bg-ink/60 px-4 py-2 text-[11px] tracking-[0.2em] text-paper uppercase backdrop-blur-sm"
        >
          {soundOn ? "Sound On" : "Sound"}
        </button>
      )}
      <button
        type="button"
        onClick={onToggleInfo}
        aria-label="Artwork information"
        className="rounded-full bg-ink/60 px-4 py-2 text-[11px] tracking-[0.2em] text-paper uppercase backdrop-blur-sm"
      >
        Info
      </button>
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit AR"
        className="rounded-full bg-ink/60 px-4 py-2 text-[11px] tracking-[0.2em] text-paper uppercase backdrop-blur-sm"
      >
        Exit AR
      </button>
    </div>
  );
}
