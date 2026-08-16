import { NextResponse } from "next/server";
import { MASTERING_BACKEND_URL } from "@/lib/backend";
import type { MasteringStage, MasteringStatusResponse } from "@/lib/types";

export const runtime = "nodejs";

interface BackendMasteringStatus {
  job_id: string;
  stage: MasteringStage;
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
    backendResponse = await fetch(`${MASTERING_BACKEND_URL}/status/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "The mastering service is unavailable right now." }, { status: 502 });
  }

  const data: BackendMasteringStatus = await backendResponse.json().catch(() => ({}) as BackendMasteringStatus);

  if (!backendResponse.ok) {
    return NextResponse.json({ error: data.error ?? "Could not fetch mastering status." }, { status: backendResponse.status });
  }

  const body: MasteringStatusResponse = {
    jobId: data.job_id ?? jobId,
    stage: data.stage ?? "error",
    progress: data.progress ?? 0,
    message: data.message,
    error: data.error,
  };

  return NextResponse.json(body, { status: backendResponse.status });
}
