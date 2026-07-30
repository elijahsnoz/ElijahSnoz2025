# AI Music Lab (Beta)

Elijah Snoz's personal AI music production laboratory. Version 1 (MVP) does one
thing well: upload a demo, separate it into vocals/drums/bass/other with
Demucs, and let you play or download every stem — no download required to
listen.

This app is **fully isolated** from the main `elijahsnoz.me` static site (a
plain HTML/CSS/JS project at the repo root). It has its own `package.json`,
its own dependencies, and its own deploy. Nothing in the main site was
changed to build this.

> Philosophy: **Preserve your first idea.** AI-assisted, not AI-replacing —
> a rough demo is welcome here exactly as it is.

## Architecture

```
Browser
  │  (same-origin fetch, no CORS needed)
  ▼
Next.js App Router  ──app/ai/page.tsx (UI) + app/api/* (thin proxy routes)
  │  (server-to-server fetch, BACKEND_URL env var, never exposed to the client)
  ▼
FastAPI service (/backend)
  │  validate (ffprobe) → run Demucs (subprocess) → zip stems → serve/stream
  ▼
Local disk (storage/{job_id}/...)
```

- **Why a separate backend instead of Vercel serverless functions?** Demucs
  needs PyTorch, downloads ~80MB of model weights, and can take anywhere from
  10s to a couple of minutes per song on CPU. That's incompatible with
  serverless function size/time limits. The FastAPI service is a normal
  long-running process (Docker image included) meant to run on something like
  Render, Railway, Fly.io, or your own VPS — anywhere that isn't serverless.
- **Why does the frontend proxy through `/api/*` instead of calling the
  backend directly?** So the backend's URL is never exposed to the browser,
  and so this page can later add auth/rate-limiting at the Next.js layer
  without touching the backend.
- **Job store is in-memory** (`backend/app/jobs.py`). Fine for a single
  instance MVP. The first thing to change when this needs to scale past one
  backend instance, or persist upload history, is swapping that for
  Supabase/Postgres or Redis — noted here, not built yet.

## File structure

```
ai-music-lab/
  app/
    layout.tsx            root layout, fonts, metadata
    page.tsx               redirects "/" → "/ai"
    ai/
      layout.tsx           <ai>-scoped metadata (title/description)
      page.tsx              the AI Music Lab page (hero + upload + progress + stems)
    api/
      upload/route.ts       proxies multipart upload to the backend
      process/route.ts      POST starts the job, GET polls its status
      download/route.ts     proxies stem/zip streaming (Range-request aware)
  components/
    UploadSong.tsx           drag/drop + file picker + client-side validation
    ProgressBar.tsx           the Uploading → Separating → Analysing → Almost Finished → Done tracker
    AudioPlayer.tsx           play/pause/seek/duration, no download required
    StemCard.tsx              one stem: label + player + download button
    DownloadButton.tsx
  lib/
    types.ts, constants.ts    shared shape + copy, mirrored on the backend
    upload.ts                 validation, XHR upload w/ progress, polling, URL builders
    audio.ts                  formatTime/formatBytes
    backend.ts                 server-only BACKEND_URL
  backend/
    app/
      main.py                 FastAPI app: /upload /process /status /download
      config.py, jobs.py, storage.py
      audio_validation.py      ffprobe-based validation (catches spoofed extensions)
      demucs_runner.py          runs Demucs as a subprocess
    requirements.txt, Dockerfile, .dockerignore, .env.example
```

## Running locally

**Frontend**

```bash
cd ai-music-lab
npm install
cp .env.example .env.local   # BACKEND_URL=http://127.0.0.1:8000
npm run dev
```

**Backend** (needs Python 3.11+ and `ffmpeg` on PATH)

```bash
cd ai-music-lab/backend
python3 -m venv .venv && source .venv/bin/activate
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
cp .env.example .env
# Exclude .venv/storage from the reload watcher — job output files being
# written during processing would otherwise trigger a reload mid-job:
uvicorn app.main:app --reload --reload-exclude ".venv/*" --reload-exclude "storage/*" --port 8000
```

Open `http://localhost:3000/ai`. The first Demucs run downloads the
`htdemucs` model weights (~80MB); the Docker image pre-downloads them at
build time so production doesn't pay that cost on the first request.

**Known compatibility notes** (already handled in `requirements.txt` /
`demucs_runner.py`, documented here so they aren't a surprise):

- `numpy<2` is pinned deliberately — `demucs==4.0.1` doesn't pin it itself,
  and pip otherwise resolves the newest NumPy 2.x, which breaks torch
  2.2.2's tensor↔array interop (`RuntimeError: Numpy is not available`)
  as soon as Demucs loads audio.
- The Demucs subprocess is launched with `SSL_CERT_FILE` pointed at
  `certifi`'s bundle, since some Python installs (notably python.org's
  macOS builds without `Install Certificates.command` run) have no default
  CA bundle, which otherwise breaks the HTTPS download of model weights.

## Deploying

**Frontend** — deploy `ai-music-lab/` as its **own** Vercel project (Root
Directory = `ai-music-lab`), separate from the main `elijahsnoz.me` project.
Set `BACKEND_URL` in that project's environment variables to your deployed
FastAPI URL.

Once that project has a real domain, connect it to `elijahsnoz.me/ai` by
adding a rewrite to the **existing** root `vercel.json` — this is the one
intentional touch point into the main site's config, and it's additive only
(nothing else in that file changes):

```jsonc
{
  "rewrites": [
    { "source": "/ai", "destination": "https://<your-ai-lab-project>.vercel.app/ai" },
    { "source": "/ai/:path*", "destination": "https://<your-ai-lab-project>.vercel.app/ai/:path*" }
  ]
}
```

This wasn't added automatically because the destination domain doesn't exist
until you create that second Vercel project — an unresolvable placeholder
would have made `/ai` 404/error on the live site instead of simply not
existing yet.

**Backend** — build and deploy the Docker image in `backend/` to Render,
Railway, Fly.io, or a VPS. It needs: enough RAM for Demucs (2GB+ recommended),
`ffmpeg` on the image (already in the Dockerfile), and a persistent-ish disk
for `STORAGE_DIR` (ephemeral is fine for MVP — jobs don't need to survive a
restart yet).

## Security / validation

Enforced both client-side (`lib/upload.ts`, immediate feedback) and
server-side (`app/api/upload/route.ts` and `backend/app/main.py`, the
authoritative check):

- Extension allow-list: `.mp3`, `.wav`, `.flac`
- Max upload size: 60MB (`MAX_FILE_SIZE_BYTES`, mirrored in both layers)
- `ffprobe` verifies the upload actually decodes as audio with an audio
  stream, so a renamed non-audio file with a spoofed extension is rejected
  before it ever reaches Demucs

## What's intentionally NOT built yet

Per the brief, this MVP is stem separation only. The architecture is left
ready to grow into these without a rewrite, but none of it exists yet:

- Routes: `/ai/pitch`, `/ai/producer`, `/ai/mastering`
- Pitch/BPM/key detection, AI vocal enhancement, pitch correction, AI
  mixing/mastering, instrument suggestions
- Persisting original demos, every revision, collaborators, AI changes,
  timestamps, and exported versions (the "creative archive") — this needs a
  real database (Supabase is the natural fit given the existing tech
  choice) and is a bigger decision than an MVP should make silently
- Multi-instance job state (Redis/Postgres instead of the in-memory dict)
