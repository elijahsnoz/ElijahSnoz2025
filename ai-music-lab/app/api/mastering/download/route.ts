import { NextResponse } from "next/server";
import { MASTERING_BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

const FORWARDED_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "content-disposition"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const download = url.searchParams.get("download");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId." }, { status: 400 });
  }

  const backendUrl = new URL(`${MASTERING_BACKEND_URL}/download/${encodeURIComponent(jobId)}`);
  if (download) backendUrl.searchParams.set("download", "1");

  const range = request.headers.get("range");

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      headers: range ? { range } : undefined,
    });
  } catch {
    return NextResponse.json({ error: "The mastering service is unavailable right now." }, { status: 502 });
  }

  if (!backendResponse.ok) {
    return NextResponse.json({ error: "That mastered song could not be found." }, { status: backendResponse.status });
  }

  const headers = new Headers();
  for (const key of FORWARDED_HEADERS) {
    const value = backendResponse.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(backendResponse.body, { status: backendResponse.status, headers });
}
