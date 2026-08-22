// Server-only: URL of the FastAPI + Demucs service (see ../ai-music-backend). Never expose to the client.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

// Server-only: URL of the vocal FX service (see ../ai-vocal-fx-backend) — a
// separate deploy from BACKEND_URL on purpose (its DSP dependencies conflict
// with the Demucs service's numpy pin). Never expose to the client.
export const VOCAL_FX_BACKEND_URL = process.env.VOCAL_FX_BACKEND_URL ?? "http://127.0.0.1:8001";

// Server-only: URL of the mastering service (see ../ai-mastering-backend) —
// its own deploy for the same reason as VOCAL_FX_BACKEND_URL: no Demucs/torch
// dependency here, so no need to share a runtime with one that has the
// numpy<2 pin. Never expose to the client.
export const MASTERING_BACKEND_URL = process.env.MASTERING_BACKEND_URL ?? "http://127.0.0.1:8002";

// Public on purpose: the browser uploads the raw song file directly to this
// URL (see lib/upload.ts) instead of through /api/upload, because Vercel
// caps a serverless function's request body at ~4.5MB — far below real
// songs. Every other call (process/status/download) stays proxied through
// BACKEND_URL above since those bodies are small JSON/streamed files.
export const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
