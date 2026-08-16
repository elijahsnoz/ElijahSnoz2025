"use client";

import { useEffect, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import DownloadButton from "./DownloadButton";
import { MASTERING_INTENSITIES } from "@/lib/constants";
import { buildMasteringDownloadUrl, pollMasteringStatus, startMastering } from "@/lib/mastering";
import type { MasteringIntensity, MasteringStage } from "@/lib/types";

interface MasteringPanelProps {
  jobId: string;
  songName: string;
}

export default function MasteringPanel({ jobId, songName }: MasteringPanelProps) {
  const [intensity, setIntensity] = useState<MasteringIntensity>("balanced");
  const [phase, setPhase] = useState<MasteringStage | "idle">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [masteringJobId, setMasteringJobId] = useState<string | null>(null);

  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => stopPollingRef.current?.();
  }, []);

  const isProcessing = phase === "queued" || phase === "mastering";

  async function handleApply() {
    setErrorMessage(null);
    setPhase("queued");
    setMessage("Starting…");

    try {
      const { masteringJobId: newMasteringJobId } = await startMastering(jobId, { intensity });
      setMasteringJobId(newMasteringJobId);

      stopPollingRef.current = pollMasteringStatus(
        newMasteringJobId,
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
      <h3 className="font-display text-sm tracking-wide text-text">Mastering</h3>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted">
        Rebuilds the full mix from your stems and masters it — nothing above is changed
      </p>

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-text-soft">Intensity</span>
          <div className="flex flex-wrap gap-2">
            {MASTERING_INTENSITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntensity(option.value)}
                disabled={isProcessing}
                aria-pressed={intensity === option.value}
                className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-200 disabled:opacity-40 ${
                  intensity === option.value
                    ? "border-transparent bg-gradient-to-r from-violet to-cyan text-void"
                    : "border-glass text-text-soft hover:border-cyan/60 hover:text-cyan"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-[11px] text-text-muted">
            {MASTERING_INTENSITIES.find((option) => option.value === intensity)?.description}
          </span>
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-violet to-cyan px-6 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-void transition-colors duration-200 hover:brightness-110 disabled:opacity-40"
        >
          {isProcessing ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-void/40 border-t-void" />
              {message ?? "Mastering…"}
            </>
          ) : (
            "Master This Song"
          )}
        </button>

        {errorMessage && (
          <div className="rounded-xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta" role="alert">
            {errorMessage}
          </div>
        )}

        {phase === "done" && masteringJobId && (
          <div className="flex flex-col gap-3 border-t border-glass pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-aurora">Mastered</span>
              <DownloadButton
                href={buildMasteringDownloadUrl(masteringJobId, true)}
                filename={`${songName} - Mastered.wav`}
              />
            </div>
            <AudioPlayer src={buildMasteringDownloadUrl(masteringJobId, false)} label="mastered mix" />
          </div>
        )}
      </div>
    </div>
  );
}
