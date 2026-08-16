import { JOB_POLL_INTERVAL_MS } from "./constants";
import type { MasteringOptions, MasteringStartResponse, MasteringStatusResponse } from "./types";

export async function startMastering(jobId: string, options: MasteringOptions): Promise<MasteringStartResponse> {
  const res = await fetch("/api/mastering/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, options }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Could not start mastering.");
  }
  return body;
}

/** Polls mastering job status until done/error or cancelled. Returns a cancel function. */
export function pollMasteringStatus(
  masteringJobId: string,
  onUpdate: (status: MasteringStatusResponse) => void,
  onError: (message: string) => void,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (cancelled) return;
    try {
      const res = await fetch(`/api/mastering/status?jobId=${encodeURIComponent(masteringJobId)}`);
      if (!res.ok) throw new Error("Lost connection to the mastering job.");
      const status: MasteringStatusResponse = await res.json();
      if (cancelled) return;
      onUpdate(status);
      if (status.stage !== "done" && status.stage !== "error") {
        timer = setTimeout(tick, JOB_POLL_INTERVAL_MS);
      }
    } catch (err) {
      if (!cancelled) onError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  tick();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

export function buildMasteringDownloadUrl(masteringJobId: string, download: boolean): string {
  const params = new URLSearchParams({ jobId: masteringJobId });
  if (download) params.set("download", "1");
  return `/api/mastering/download?${params.toString()}`;
}
