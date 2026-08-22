import { PUBLIC_BACKEND_URL } from "./backend";
import {
  ACCEPTED_EXTENSIONS,
  FILE_TOO_LARGE_MESSAGE,
  JOB_POLL_INTERVAL_MS,
  MAX_FILE_SIZE_BYTES,
  UNSUPPORTED_FORMAT_MESSAGE,
} from "./constants";
import type { JobStatusResponse, StemKey, UploadResponse, ValidationResult } from "./types";

export function validateAudioFile(file: File): ValidationResult {
  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));

  if (!hasAcceptedExtension) {
    return { valid: false, error: UNSUPPORTED_FORMAT_MESSAGE };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: FILE_TOO_LARGE_MESSAGE };
  }

  if (file.size === 0) {
    return { valid: false, error: "This file is empty." };
  }

  return { valid: true };
}

/**
 * Uploads with real progress events (fetch cannot report upload progress).
 *
 * Goes straight to the backend rather than through /api/upload: Vercel caps
 * a serverless function's request body at ~4.5MB, which most real songs
 * exceed, so proxying the file bytes through Next.js isn't an option here.
 */
export function uploadFile(file: File, onProgress: (percent: number) => void): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ jobId: data.job_id });
        } catch {
          reject(new Error("Unexpected response from server."));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.error || "Upload failed."));
        } catch {
          reject(new Error("Upload failed."));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed. Check your connection.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    xhr.open("POST", `${PUBLIC_BACKEND_URL}/upload`);
    xhr.send(formData);
  });
}

export async function startProcessing(jobId: string): Promise<void> {
  const res = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not start processing.");
  }
}

/** Polls job status until done/error or cancelled. Returns a cancel function. */
export function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatusResponse) => void,
  onError: (message: string) => void,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (cancelled) return;
    try {
      const res = await fetch(`/api/process?jobId=${encodeURIComponent(jobId)}`);
      if (!res.ok) throw new Error("Lost connection to the processing job.");
      const status: JobStatusResponse = await res.json();
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

export function buildDownloadUrl(jobId: string, stem: StemKey | "all", download: boolean): string {
  const params = new URLSearchParams({ jobId, stem });
  if (download) params.set("download", "1");
  return `/api/download?${params.toString()}`;
}
