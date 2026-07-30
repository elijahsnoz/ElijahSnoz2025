// Server-only: URL of the FastAPI + Demucs service (see ../ai-music-backend). Never expose to the client.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
