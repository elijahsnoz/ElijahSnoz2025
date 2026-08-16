import { NextResponse } from "next/server";
import { BACKEND_URL, VOCAL_FX_BACKEND_URL } from "@/lib/backend";
import type { VocalFxOptions } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jobId = body?.jobId;
  const options: VocalFxOptions | undefined = body?.options;

  if (typeof jobId !== "string" || !jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }
  if (!options) {
    return NextResponse.json({ error: "Missing options." }, { status: 400 });
  }

  // Pull the Demucs job's separated vocal stem — this service has no
  // storage of its own, it only ever operates on a stem forwarded to it.
  let vocalStem: Response;
  try {
    vocalStem = await fetch(`${BACKEND_URL}/download/${encodeURIComponent(jobId)}/vocals`);
  } catch {
    return NextResponse.json({ error: "The AI Music Lab service is unavailable right now." }, { status: 502 });
  }
  if (!vocalStem.ok) {
    return NextResponse.json({ error: "Could not find that song's vocal stem." }, { status: vocalStem.status });
  }

  const vocalBlob = await vocalStem.blob();
  const uploadForm = new FormData();
  uploadForm.append("file", vocalBlob, "vocals.wav");

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(`${VOCAL_FX_BACKEND_URL}/upload`, {
      method: "POST",
      body: uploadForm,
    });
  } catch {
    return NextResponse.json({ error: "The vocal processing service is unavailable right now." }, { status: 502 });
  }

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    return NextResponse.json({ error: uploadData.error ?? "Could not upload vocal for processing." }, { status: uploadResponse.status });
  }

  const vocalFxJobId: string = uploadData.job_id;

  let processResponse: Response;
  try {
    processResponse = await fetch(`${VOCAL_FX_BACKEND_URL}/process/${encodeURIComponent(vocalFxJobId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enhance: options.enhance,
        retune_strength: options.retuneStrength,
        key: options.key ?? null,
      }),
    });
  } catch {
    return NextResponse.json({ error: "The vocal processing service is unavailable right now." }, { status: 502 });
  }

  const processData = await processResponse.json().catch(() => ({}));
  if (!processResponse.ok) {
    return NextResponse.json({ error: processData.error ?? "Could not start vocal processing." }, { status: processResponse.status });
  }

  return NextResponse.json({ vocalFxJobId });
}
