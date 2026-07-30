# AI Music Lab (Beta)

Elijah Snoz's personal AI music production laboratory. Version 1 (MVP) does one
thing well: upload a demo, separate it into vocals/drums/bass/other with
Demucs, and let you play or download every stem — no download required to
listen. Marketed as a free stem splitter for fans, with AI mastering teased
as "coming soon."

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
FastAPI service (../ai-music-backend)
  │  validate (ffprobe) → run Demucs (subprocess) → zip stems → serve/stream
  ▼
Local disk (storage/{job_id}/...)
```

This repo has **two separate deployables**, siblings at the repo root:

- `ai-music-lab/` — this Next.js app (deployed to its own Vercel project)
- `ai-music-backend/` — the FastAPI + Demucs service (deployed to Render, see
  `/render.yaml`)

They are siblings, **not** nested, on purpose: Vercel's CLI actively scans a
project directory for service manifests (a `requirements.txt` + Python
entrypoint reads as "there's a FastAPI service here") and will inject it into
`vercel.json` as a second deployable — even across a `.vercelignore` entry or
an explicit single-service `vercel.json`. The only reliable way to stop it
from trying to bundle Demucs/torch into a Vercel serverless function (and
failing — the bundle is ~4.7GB against a 500MB limit) was to physically move
the backend out of the directory tree Vercel's CLI walks.

- **Why a separate backend instead of Vercel serverless functions?** Demucs
  needs PyTorch, downloads ~80MB of model weights, and can take anywhere from
  10s to a couple of minutes per song on CPU. That's incompatible with
  serverless function size/time limits regardless of the point above.
- **Why does the frontend proxy through `/api/*` instead of calling the
  backend directly?** So the backend's URL is never exposed to the browser,
  and so this page can later add auth/rate-limiting at the Next.js layer
  without touching the backend.
- **Job store is in-memory** (`ai-music-backend/app/jobs.py`). Fine for a
  single instance MVP. The first thing to change when this needs to scale
  past one backend instance, or persist upload history, is swapping that for
  Supabase/Postgres or Redis — noted here, not built yet.

## File structure

```
ai-music-lab/            (Next.js frontend — deployed to Vercel)
  app/
    layout.tsx            root layout, fonts, metadata
    page.tsx               redirects "/" → "/ai"
    ai/
      layout.tsx           <ai>-scoped metadata + SEO (title/description/JSON-LD)
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

ai-music-backend/         (FastAPI + Demucs — deployed to Render)
  app/
    main.py                  FastAPI app: /upload /process /status /download
    config.py, jobs.py, storage.py
    audio_validation.py       ffprobe-based validation (catches spoofed extensions)
    demucs_runner.py           runs Demucs as a subprocess, streams live progress
  requirements.txt, Dockerfile, .dockerignore, .env.example

render.yaml                (repo root — Render Blueprint for ai-music-backend)
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
cd ai-music-backend
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

**Backend (Render)** — connect this repo on render.com via "New +" →
"Blueprint"; it reads `/render.yaml` automatically and deploys
`ai-music-backend/` from its Dockerfile. Demucs/torch need real memory —
pick at least a 2GB+ RAM plan, the free tier will OOM. Note the resulting
service URL (e.g. `https://ai-music-lab-backend.onrender.com`).

**Frontend (Vercel)** — deploy `ai-music-lab/` as its **own** Vercel project
(Root Directory = `ai-music-lab`), separate from the main `elijahsnoz.me`
project. Set `BACKEND_URL` in that project's environment variables to the
Render URL above.

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

## Security / validation

Enforced both client-side (`lib/upload.ts`, immediate feedback) and
server-side (`app/api/upload/route.ts` and `ai-music-backend/app/main.py`,
the authoritative check):

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
