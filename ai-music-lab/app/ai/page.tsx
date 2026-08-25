"use client";

import { useEffect, useRef, useState } from "react";
import UploadSong from "@/components/UploadSong";
import ProgressBar from "@/components/ProgressBar";
import StemCard from "@/components/StemCard";
import DownloadButton from "@/components/DownloadButton";
import VocalFxPanel from "@/components/VocalFxPanel";
import MasteringPanel from "@/components/MasteringPanel";
import { buildDownloadUrl, pollJobStatus, startProcessing, uploadFile } from "@/lib/upload";
import { STEM_ORDER } from "@/lib/constants";
import type { ProcessingStage, StemResult } from "@/lib/types";

const STUDIO_TOOLS = [
  {
    name: "Stem Splitter",
    description: "Separate any song into vocals, drums, bass and instrumentals.",
  },
  {
    name: "AI Mastering",
    description: "Master the mix to gentle, balanced or loud streaming targets.",
  },
  {
    name: "Vocal Tuning",
    description: "Pitch-correct the vocal chromatically or to a chosen key.",
  },
];

export default function AiMusicLabPage() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [songName, setSongName] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [stems, setStems] = useState<StemResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => stopPollingRef.current?.();
  }, []);

  const isProcessing = stage !== "idle" && stage !== "done" && stage !== "error";

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  async function handleFileAccepted(file: File) {
    setErrorMessage(null);
    setSongName(file.name.replace(/\.[^/.]+$/, ""));
    setStage("uploading");
    setProgress(0);
    setElapsedSeconds(0);

    try {
      const { jobId: newJobId } = await uploadFile(file, setProgress);
      setJobId(newJobId);
      setStage("separating");
      setProgress(20);

      await startProcessing(newJobId);

      stopPollingRef.current = pollJobStatus(
        newJobId,
        (status) => {
          setStage(status.stage);
          setProgress(status.progress);
          if (status.stage === "done" && status.stems) setStems(status.stems);
          if (status.stage === "error") setErrorMessage(status.error ?? "Something went wrong while processing your song.");
        },
        (message) => {
          setStage("error");
          setErrorMessage(message);
        },
      );
    } catch (err) {
      setStage("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function reset() {
    stopPollingRef.current?.();
    setStage("idle");
    setProgress(0);
    setJobId(null);
    setStems([]);
    setErrorMessage(null);
    setSongName("");
    setElapsedSeconds(0);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-void px-6 py-20 sm:py-28">
      <BackgroundGlow />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-glass px-4 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan">
            Beta
          </span>
          <span className="rounded-full border border-aurora/30 bg-aurora/10 px-4 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-aurora">
            100% Free
          </span>
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-violet">Elijah Snoz AI Music Lab</p>

        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Free AI Music Studio
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-text-soft sm:text-lg">
          A free gift from Elijah Snoz to fans and fellow creators. Upload one song and the Lab splits it into
          stems, masters it to streaming loudness, and tunes the vocal — powered by AI, no signup required.
        </p>

        <p className="mt-3 font-display italic text-text-muted">Preserve your first idea.</p>

        {stage === "idle" && (
          <div className="mt-12 w-full">
            <UploadSong onFileAccepted={handleFileAccepted} />

            {/* Rendered in the idle state on purpose: the three tools otherwise
                only appear after a separation finishes, so neither a first-time
                visitor nor a crawler would ever see what the Lab actually does.
                Order matches JSON_LD featureList in ./layout.tsx. */}
            <ul className="mt-12 grid gap-4 text-left sm:grid-cols-3">
              {STUDIO_TOOLS.map((tool) => (
                <li key={tool.name} className="rounded-2xl border border-glass px-5 py-4">
                  <h2 className="font-display text-sm font-semibold text-text">{tool.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-soft">{tool.description}</p>
                </li>
              ))}
            </ul>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
              Upload once — mastering &amp; vocal tuning unlock after the split
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="mt-16 w-full">
            <p className="mb-8 truncate font-mono text-xs uppercase tracking-[0.2em] text-text-soft">{songName}</p>
            <ProgressBar stage={stage} progress={progress} elapsedSeconds={elapsedSeconds} />
          </div>
        )}

        {stage === "error" && (
          <div className="mt-12 w-full max-w-xl">
            <div className="rounded-2xl border border-magenta/30 bg-magenta/10 px-6 py-5 text-sm text-magenta" role="alert">
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full border border-glass px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-text-soft transition-colors hover:border-cyan/60 hover:text-cyan"
            >
              Try Again
            </button>
          </div>
        )}

        {stage === "done" && jobId && (
          <div className="mt-16 w-full text-left">
            <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-aurora">
              Song uploaded successfully
            </p>

            <div className="flex flex-col gap-4">
              {STEM_ORDER.map((key) => {
                const stem = stems.find((s) => s.key === key);
                if (!stem) return null;
                return <StemCard key={key} stem={stem} songName={songName} />;
              })}
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <VocalFxPanel jobId={jobId} songName={songName} />
              <MasteringPanel jobId={jobId} songName={songName} />
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <DownloadButton
                href={buildDownloadUrl(jobId, "all", true)}
                filename={`${songName} - stems.zip`}
                label="Download All"
                variant="solid"
              />
              <button
                type="button"
                onClick={reset}
                className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-cyan"
              >
                Upload another song
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[10%] h-[360px] w-[360px] rounded-full bg-cyan/10 blur-[120px]" />
    </div>
  );
}
