import { NextResponse } from "next/server";
import { VOCAL_FX_BACKEND_URL } from "@/lib/backend";
import type { VocalFxStage, VocalFxStatusResponse } from "@/lib/types";

export const runtime = "nodejs";

interface BackendVocalFxStatus {
  job_id: string;
  stage: VocalFxStage;
  progress: number;
  message?: string;
  error?: string;
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${VOCAL_FX_BACKEND_URL}/status/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "The vocal processing service is unavailable right now." }, { status: 502 });
  }

  const data: BackendVocalFxStatus = await backendResponse.json().catch(() => ({}) as BackendVocalFxStatus);

  if (!backendResponse.ok) {
    return NextResponse.json({ error: data.error ?? "Could not fetch vocal processing status." }, { status: backendResponse.status });
  }

  const body: VocalFxStatusResponse = {
    jobId: data.job_id ?? jobId,
    stage: data.stage ?? "error",
    progress: data.progress ?? 0,
    message: data.message,
    error: data.error,
  };

  return NextResponse.json(body, { status: backendResponse.status });
}
