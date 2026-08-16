import { JOB_POLL_INTERVAL_MS } from "./constants";
import type { VocalFxOptions, VocalFxStartResponse, VocalFxStatusResponse } from "./types";

export async function startVocalFx(jobId: string, options: VocalFxOptions): Promise<VocalFxStartResponse> {
  const res = await fetch("/api/vocal-fx/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, options }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Could not start vocal processing.");
  }
  return body;
}

/** Polls vocal-fx job status until done/error or cancelled. Returns a cancel function. */
export function pollVocalFxStatus(
  vocalFxJobId: string,
  onUpdate: (status: VocalFxStatusResponse) => void,
  onError: (message: string) => void,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (cancelled) return;
    try {
      const res = await fetch(`/api/vocal-fx/status?jobId=${encodeURIComponent(vocalFxJobId)}`);
      if (!res.ok) throw new Error("Lost connection to the vocal processing job.");
      const status: VocalFxStatusResponse = await res.json();
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

export function buildVocalFxDownloadUrl(vocalFxJobId: string, download: boolean): string {
  const params = new URLSearchParams({ jobId: vocalFxJobId });
  if (download) params.set("download", "1");
  return `/api/vocal-fx/download?${params.toString()}`;
}
