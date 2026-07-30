import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";
import { buildDownloadUrl } from "@/lib/upload";
import { STEM_LABELS } from "@/lib/constants";
import type { JobStatusResponse, ProcessingStage, StemKey, StemResult } from "@/lib/types";

export const runtime = "nodejs";

interface BackendStatus {
  job_id: string;
  stage: ProcessingStage;
  progress: number;
  message?: string;
  error?: string;
  stems?: string[];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jobId = body?.jobId;

  if (typeof jobId !== "string" || !jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/process/${encodeURIComponent(jobId)}`, {
      method: "POST",
    });
  } catch {
    return NextResponse.json({ error: "The AI Music Lab service is unavailable right now." }, { status: 502 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/status/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "The AI Music Lab service is unavailable right now." }, { status: 502 });
  }

  const data: BackendStatus = await backendResponse.json().catch(() => ({}) as BackendStatus);

  if (!backendResponse.ok) {
    return NextResponse.json({ error: data.error ?? "Could not fetch job status." }, { status: backendResponse.status });
  }

  const stems: StemResult[] | undefined = data.stems?.map((key) => {
    const stemKey = key as StemKey;
    return {
      key: stemKey,
      label: STEM_LABELS[stemKey],
      streamUrl: buildDownloadUrl(jobId, stemKey, false),
      downloadUrl: buildDownloadUrl(jobId, stemKey, true),
    };
  });

  const body: JobStatusResponse = {
    jobId: data.job_id ?? jobId,
    stage: data.stage ?? "error",
    progress: data.progress ?? 0,
    message: data.message,
    error: data.error,
    stems,
  };

  return NextResponse.json(body, { status: backendResponse.status });
}
