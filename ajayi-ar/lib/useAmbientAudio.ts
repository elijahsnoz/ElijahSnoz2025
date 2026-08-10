"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioConfig } from "@/lib/types";

/**
 * Ambient sound is off until the visitor explicitly taps to enable it —
 * mobile browsers block autoplay with sound anyway, but this is also the
 * spec: "Default should be OFF until the user enables it."
 */
export function useAmbientAudio(audio: AudioConfig) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!audio.enabled) return;
    const el = new Audio(audio.source);
    el.loop = audio.loop;
    el.volume = audio.volume;
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, [audio]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (on) {
      el.pause();
      setOn(false);
    } else {
      el.play().catch(() => undefined);
      setOn(true);
    }
  }

  return { on, toggle, available: audio.enabled };
}
