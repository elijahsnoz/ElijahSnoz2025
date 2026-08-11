"use client";

import { useEffect, useState } from "react";

export interface ActiveSymbol {
  label: string;
  meaning: string;
  x: number;
  y: number;
  /** Bumped on every tap, including re-tapping the same symbol, to restart the auto-dismiss timer. */
  key: number;
}

interface Props {
  symbol: ActiveSymbol | null;
  onDismiss: () => void;
}

/** A small caption bubble anchored to wherever the visitor tapped, naming and explaining that element. Auto-dismisses; tapping elsewhere (handled by the parent) also clears it. */
export default function SymbolCaption({ symbol, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [lastKey, setLastKey] = useState<number | null>(null);

  if (symbol && symbol.key !== lastKey) {
    setLastKey(symbol.key);
    setVisible(true);
  }

  useEffect(() => {
    if (!symbol) return;
    const timeout = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(timeout);
  }, [symbol]);

  useEffect(() => {
    if (visible || !symbol) return;
    const timeout = setTimeout(onDismiss, 400);
    return () => clearTimeout(timeout);
  }, [visible, symbol, onDismiss]);

  if (!symbol) return null;

  const left = Math.min(Math.max(symbol.x, 90), (typeof window !== "undefined" ? window.innerWidth : 400) - 90);
  const placeAbove = symbol.y > 140;

  return (
    <div
      className={`pointer-events-none absolute z-20 w-[180px] -translate-x-1/2 text-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left,
        top: placeAbove ? symbol.y - 14 : symbol.y + 14,
        transform: `translate(-50%, ${placeAbove ? "-100%" : "0"})`,
      }}
    >
      <div className="rounded-xl bg-ink/85 px-3 py-2.5 shadow-lg backdrop-blur-sm">
        <p className="font-display text-[13px] italic text-paper">{symbol.label}</p>
        <p className="mt-1 text-[11px] leading-snug text-paper/80">{symbol.meaning}</p>
      </div>
    </div>
  );
}
