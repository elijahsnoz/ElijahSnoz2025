"use client";

import { useEffect, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import DownloadButton from "./DownloadButton";
import { VOCAL_FX_KEYS } from "@/lib/constants";
import { buildVocalFxDownloadUrl, pollVocalFxStatus, startVocalFx } from "@/lib/vocalFx";
import type { VocalFxStage } from "@/lib/types";

interface VocalFxPanelProps {
  jobId: string;
  songName: string;
}

export default function VocalFxPanel({ jobId, songName }: VocalFxPanelProps) {
  const [enhance, setEnhance] = useState(true);
  const [retuneStrength, setRetuneStrength] = useState(35);
  const [key, setKey] = useState<string>("");
  const [phase, setPhase] = useState<VocalFxStage | "idle">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vocalFxJobId, setVocalFxJobId] = useState<string | null>(null);

  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => stopPollingRef.current?.();
  }, []);

  const isProcessing = phase === "queued" || phase === "processing";

  async function handleApply() {
    setErrorMessage(null);
    setPhase("queued");
    setMessage("Starting…");

    try {
      const { vocalFxJobId: newVocalFxJobId } = await startVocalFx(jobId, {
        enhance,
        retuneStrength: retuneStrength / 100,
        key: key || undefined,
      });
      setVocalFxJobId(newVocalFxJobId);

      stopPollingRef.current = pollVocalFxStatus(
        newVocalFxJobId,
        (status) => {
          setPhase(status.stage);
          setMessage(status.message ?? null);
          if (status.stage === "error") setErrorMessage(status.error ?? "Something went wrong.");
        },
        (errMessage) => {
          setPhase("error");
          setErrorMessage(errMessage);
        },
      );
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl border border-glass bg-surface/60 p-5 backdrop-blur-sm">
      <h3 className="font-display text-sm tracking-wide text-text">Vocal FX</h3>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted">
        Noise cleanup + pitch correction — the original vocals stem above is never changed
      </p>

      <div className="mt-5 flex flex-col gap-5">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-text-soft">Clean up vocal</span>
          <button
            type="button"
            role="switch"
            aria-checked={enhance}
            onClick={() => setEnhance((value) => !value)}
            disabled={isProcessing}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${
              enhance ? "bg-gradient-to-r from-violet to-cyan" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-void transition-transform duration-200 ${
                enhance ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between text-sm text-text-soft">
            <span>Pitch correction</span>
            <span className="font-mono text-[11px] tabular-nums text-text-muted">{retuneStrength}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={retuneStrength}
            onChange={(event) => setRetuneStrength(Number(event.target.value))}
            disabled={isProcessing}
            aria-label="Pitch correction strength"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan disabled:cursor-not-allowed"
          />
        </label>

        {retuneStrength > 0 && (
          <label className="flex flex-col gap-2">
            <span className="text-sm text-text-soft">Key (optional — tighter correction)</span>
            <select
              value={key}
              onChange={(event) => setKey(event.target.value)}
              disabled={isProcessing}
              className="rounded-full border border-glass bg-surface px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-text-soft disabled:opacity-40"
            >
              <option value="">Auto (chromatic)</option>
              {VOCAL_FX_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={handleApply}
          disabled={isProcessing || (!enhance && retuneStrength === 0)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-violet to-cyan px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-void transition-colors duration-200 hover:brightness-110 disabled:opacity-40"
        >
          {isProcessing ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-void/40 border-t-void" />
              {message ?? "Processing…"}
            </>
          ) : (
            "Apply"
          )}
        </button>

        {errorMessage && (
          <div className="rounded-xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta" role="alert">
            {errorMessage}
          </div>
        )}

        {phase === "done" && vocalFxJobId && (
          <div className="flex flex-col gap-3 border-t border-glass pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-aurora">
                Vocals (processed)
              </span>
              <DownloadButton
                href={buildVocalFxDownloadUrl(vocalFxJobId, true)}
                filename={`${songName} - Vocals (processed).wav`}
              />
            </div>
            <AudioPlayer src={buildVocalFxDownloadUrl(vocalFxJobId, false)} label="processed vocals" />
          </div>
        )}
      </div>
    </div>
  );
}
