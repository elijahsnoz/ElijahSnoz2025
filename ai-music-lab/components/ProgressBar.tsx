import { formatTime } from "@/lib/audio";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import type { ProcessingStage } from "@/lib/types";

interface ProgressBarProps {
  stage: ProcessingStage;
  progress: number;
  elapsedSeconds?: number;
}

const STEPS_WITH_PERCENT: ProcessingStage[] = ["uploading", "separating"];

export default function ProgressBar({ stage, progress, elapsedSeconds }: ProgressBarProps) {
  const activeIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="w-full max-w-xl mx-auto" role="status" aria-live="polite">
      {typeof elapsedSeconds === "number" && stage !== "idle" && (
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Elapsed {formatTime(elapsedSeconds)}
        </p>
      )}
      <ol className="flex flex-col gap-0">
        {STAGE_ORDER.map((step, index) => {
          const isDone = activeIndex > index || stage === "done";
          const isActive = activeIndex === index && stage !== "done";
          const isLast = index === STAGE_ORDER.length - 1;
          const showPercent = isActive && STEPS_WITH_PERCENT.includes(step);

          return (
            <li key={step}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-500 ${
                    isDone
                      ? "border-aurora bg-aurora/20 text-aurora"
                      : isActive
                        ? "border-cyan text-cyan"
                        : "border-text-muted/30 text-text-muted"
                  }`}
                >
                  {isDone ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 9.5a1 1 0 1 1 1.4-1.4l3.9 3.9 6.7-6.7a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted/40" />
                  )}
                </span>

                <div className="flex-1 py-2.5">
                  <p
                    className={`font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                      isDone ? "text-aurora" : isActive ? "text-text" : "text-text-muted"
                    }`}
                  >
                    {STAGE_LABELS[step]}
                    {showPercent ? ` — ${progress}%` : ""}
                    {(isActive || isDone) && !showPercent ? "…" : ""}
                  </p>

                  {showPercent && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-[width] duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className={`ml-3 h-5 w-px transition-colors duration-500 ${isDone ? "bg-aurora/40" : "bg-text-muted/15"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
