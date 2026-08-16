import { NextResponse } from "next/server";
import { BACKEND_URL, MASTERING_BACKEND_URL } from "@/lib/backend";
import { STEM_ORDER } from "@/lib/constants";
import type { MasteringOptions } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jobId = body?.jobId;
  const options: MasteringOptions | undefined = body?.options;

  if (typeof jobId !== "string" || !jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }
  if (!options) {
    return NextResponse.json({ error: "Missing options." }, { status: 400 });
  }

  // Pull all four Demucs stems and forward them so the mastering service can
  // sum them back into the full mix — the original upload is deleted once
  // separation finishes, so the stems are the only surviving representation
  // of it (see ai-mastering-backend/app/mastering.py).
  const uploadForm = new FormData();
  for (const stem of STEM_ORDER) {
    let stemResponse: Response;
    try {
      stemResponse = await fetch(`${BACKEND_URL}/download/${encodeURIComponent(jobId)}/${stem}`);
    } catch {
      return NextResponse.json({ error: "The AI Music Lab service is unavailable right now." }, { status: 502 });
    }
    if (!stemResponse.ok) {
      return NextResponse.json({ error: `Could not find that song's ${stem} stem.` }, { status: stemResponse.status });
    }
    uploadForm.append(stem, await stemResponse.blob(), `${stem}.wav`);
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(`${MASTERING_BACKEND_URL}/upload`, {
      method: "POST",
      body: uploadForm,
    });
  } catch {
    return NextResponse.json({ error: "The mastering service is unavailable right now." }, { status: 502 });
  }

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    return NextResponse.json(
      { error: uploadData.error ?? "Could not upload stems for mastering." },
      { status: uploadResponse.status },
    );
  }

  const masteringJobId: string = uploadData.job_id;

  let processResponse: Response;
  try {
    processResponse = await fetch(`${MASTERING_BACKEND_URL}/process/${encodeURIComponent(masteringJobId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: options.intensity }),
    });
  } catch {
    return NextResponse.json({ error: "The mastering service is unavailable right now." }, { status: 502 });
  }

  const processData = await processResponse.json().catch(() => ({}));
  if (!processResponse.ok) {
    return NextResponse.json({ error: processData.error ?? "Could not start mastering." }, { status: processResponse.status });
  }

  return NextResponse.json({ masteringJobId });
}
