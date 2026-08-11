"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { ArtworkConfig } from "@/lib/types";
import { checkARSupport } from "@/lib/arSupport";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useAmbientAudio } from "@/lib/useAmbientAudio";
import type { ScreenTapHit } from "@/lib/scene/tapHandler";
import LandingScreen from "./LandingScreen";
import ControlsBar from "./ControlsBar";
import DetectionToast from "./DetectionToast";
import InfoPanel from "./InfoPanel";
import SymbolCaption, { type ActiveSymbol } from "./SymbolCaption";

const ARCanvas = dynamic(() => import("./ARCanvas"), { ssr: false });
const DigitalPaintingViewer = dynamic(() => import("./DigitalPaintingViewer"), { ssr: false });

type Stage = "landing" | "unsupported" | "ar" | "ar-error" | "digital";

interface Props {
  artwork: ArtworkConfig;
}

export default function ARExperience({ artwork }: Props) {
  const [stage, setStage] = useState<Stage>("landing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedKey, setDetectedKey] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<ActiveSymbol | null>(null);
  const reducedMotion = useReducedMotion();
  const sound = useAmbientAudio(artwork.audio);

  const handleSymbolTap = useCallback(({ hit, screenX, screenY, containerWidth, containerHeight }: ScreenTapHit) => {
    setActiveSymbol((prev) => ({
      label: hit.label,
      meaning: hit.meaning,
      x: screenX,
      y: screenY,
      containerWidth,
      containerHeight,
      key: (prev?.key ?? 0) + 1,
    }));
  }, []);

  const handleEnter = useCallback(() => {
    const support = checkARSupport();
    setStage(support.supported ? "ar" : "unsupported");
  }, []);

  const handleTargetFound = useCallback(() => setDetectedKey((key) => key + 1), []);
  const handleTargetLost = useCallback(() => undefined, []);
  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setStage("ar-error");
  }, []);

  if (stage === "landing") {
    return <LandingScreen artwork={artwork} onEnter={handleEnter} />;
  }

  if (stage === "unsupported" || stage === "ar-error") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-indigo-deep px-6 text-center text-paper">
        <p className="text-xs tracking-[0.25em] text-paper/60 uppercase">AJAYI VII</p>
        <p className="max-w-xs font-display text-xl italic">
          {stage === "unsupported"
            ? "Your device doesn't currently support this AR experience."
            : errorMessage ?? "The AR experience couldn't start."}
        </p>
        <button
          type="button"
          onClick={() => setStage("digital")}
          className="border border-paper/40 px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-paper hover:text-indigo-deep"
        >
          View Digital Painting
        </button>
      </div>
    );
  }

  if (stage === "digital") {
    return (
      <div className="relative min-h-[100dvh] bg-indigo-deep">
        <DigitalPaintingViewer
          artwork={artwork}
          reducedMotion={reducedMotion}
          className="h-[100dvh] w-full"
          onSymbolTap={handleSymbolTap}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 text-paper">
          <p className="text-[11px] tracking-[0.25em] uppercase">{artwork.title} · Digital Mode</p>
          <button type="button" onClick={() => setInfoOpen(true)} className="text-[11px] tracking-[0.2em] uppercase underline">
            Info
          </button>
        </div>
        <SymbolCaption symbol={activeSymbol} onDismiss={() => setActiveSymbol(null)} />
        <InfoPanel artwork={artwork} open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink">
      <ARCanvas
        artwork={artwork}
        reducedMotion={reducedMotion}
        onTargetFound={handleTargetFound}
        onTargetLost={handleTargetLost}
        onError={handleError}
        onReady={() => undefined}
        onSymbolTap={handleSymbolTap}
      />
      <DetectionToast triggerKey={detectedKey} />
      <ControlsBar
        soundOn={sound.on}
        soundAvailable={sound.available}
        onToggleSound={sound.toggle}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        onExit={() => setStage("landing")}
      />
      <SymbolCaption symbol={activeSymbol} onDismiss={() => setActiveSymbol(null)} />
      <InfoPanel artwork={artwork} open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
