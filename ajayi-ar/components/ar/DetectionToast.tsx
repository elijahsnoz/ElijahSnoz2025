"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Increment this to re-trigger the toast (e.g. every time the target is (re)found). */
  triggerKey: number;
}

export default function DetectionToast({ triggerKey }: Props) {
  const [visible, setVisible] = useState(false);
  const [lastKey, setLastKey] = useState(triggerKey);

  if (triggerKey !== lastKey) {
    setLastKey(triggerKey);
    if (triggerKey !== 0) setVisible(true);
  }

  useEffect(() => {
    if (triggerKey === 0) return;
    const timeout = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timeout);
  }, [triggerKey]);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 text-center transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="rounded-full bg-ink/70 px-5 py-2 text-[11px] tracking-[0.25em] text-paper uppercase backdrop-blur-sm">
        Living Painting Detected
      </p>
    </div>
  );
}
