import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";
import { validateAudioFile } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }

  const validation = validateAudioFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: backendForm,
    });
  } catch {
    return NextResponse.json({ error: "The AI Music Lab service is unavailable right now." }, { status: 502 });
  }

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json({ error: data.error ?? "Upload failed." }, { status: backendResponse.status });
  }

  return NextResponse.json({ jobId: data.job_id }, { status: backendResponse.status });
}
