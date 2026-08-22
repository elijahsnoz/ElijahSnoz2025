import logging
import shutil
import uuid
import zipfile
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from . import storage
from .audio_validation import InvalidAudioError, probe_audio
from .config import (
    ALLOWED_EXTENSIONS,
    ALLOWED_ORIGINS,
    DEMUCS_MODEL,
    FILE_TOO_LARGE_MESSAGE,
    MAX_FILE_SIZE_BYTES,
    STEM_KEYS,
    UNSUPPORTED_FORMAT_MESSAGE,
)
from .demucs_runner import DemucsError, separate_stems
from .jobs import create_job, get_job, update_job

logger = logging.getLogger("ai_music_lab")

app = FastAPI(title="AI Music Lab — Stem Separation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=UNSUPPORTED_FORMAT_MESSAGE)

    contents = await file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=422, detail="This file is empty.")
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=422, detail=FILE_TOO_LARGE_MESSAGE)

    job_id = uuid.uuid4().hex
    storage.job_dir(job_id).mkdir(parents=True, exist_ok=True)

    destination = storage.input_path(job_id, extension)
    destination.write_bytes(contents)

    create_job(job_id=job_id, original_filename=filename, input_path=str(destination))

    return {"job_id": job_id}


@app.post("/process/{job_id}")
async def process(job_id: str, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.started:
        return {"status": "already_running", "stage": job.stage}

    update_job(job_id, started=True, stage="separating", progress=15, message="Separating stems…")
    background_tasks.add_task(run_pipeline, job_id)

    return {"status": "started"}


async def run_pipeline(job_id: str) -> None:
    job = get_job(job_id)
    if job is None:
        return

    def on_separation_progress(percent: int) -> None:
        # Demucs reports 0-100% of the separation pass itself; map that onto
        # this job's 15-70% band so overall progress keeps climbing smoothly.
        update_job(job_id, progress=min(15 + round(percent * 0.55), 70))

    try:
        await probe_audio(job.input_path)

        output_dir = storage.demucs_output_dir(job_id)
        await separate_stems(Path(job.input_path), output_dir, on_progress=on_separation_progress)

        update_job(job_id, stage="analysing", progress=70, message="Analysing audio…")

        input_stem_name = Path(job.input_path).stem  # always "input"
        produced_dir = output_dir / DEMUCS_MODEL / input_stem_name

        stems_out = storage.stems_dir(job_id)
        stems_out.mkdir(parents=True, exist_ok=True)

        for key in STEM_KEYS:
            source = produced_dir / f"{key}.wav"
            if not source.exists():
                raise RuntimeError(f"Missing expected stem output: {key}")
            shutil.move(str(source), str(storage.stem_file(job_id, key)))

        update_job(job_id, stage="finishing", progress=90, message="Almost finished…")

        with zipfile.ZipFile(storage.zip_file(job_id), "w", zipfile.ZIP_DEFLATED) as archive:
            for key in STEM_KEYS:
                archive.write(storage.stem_file(job_id, key), arcname=f"{key}.wav")

        shutil.rmtree(output_dir, ignore_errors=True)
        Path(job.input_path).unlink(missing_ok=True)

        update_job(job_id, stage="done", progress=100, message="Done.")

    except InvalidAudioError as exc:
        logger.warning("Job %s: invalid audio: %s", job_id, exc)
        update_job(job_id, stage="error", error=str(exc))
    except DemucsError as exc:
        logger.error("Job %s: demucs failed:\n%s", job_id, exc)
        update_job(job_id, stage="error", error="Stem separation failed. Please try a different file.")
    except Exception:
        logger.exception("Job %s: unexpected failure in run_pipeline", job_id)
        update_job(job_id, stage="error", error="Something went wrong while processing your song.")


@app.get("/status/{job_id}")
async def status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_id": job.job_id,
        "stage": job.stage,
        "progress": job.progress,
        "message": job.message,
        "error": job.error,
        "stems": STEM_KEYS if job.stage == "done" else None,
    }


@app.get("/download/{job_id}/{stem}")
async def download(job_id: str, stem: str, download: bool = False):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.stage != "done":
        raise HTTPException(status_code=409, detail="This song is not ready yet.")

    disposition = "attachment" if download else "inline"
    safe_name = Path(job.original_filename).stem or "song"

    if stem == "all":
        path = storage.zip_file(job_id)
        if not path.exists():
            raise HTTPException(status_code=404, detail="Stems not found.")
        return FileResponse(
            path,
            media_type="application/zip",
            filename=f"{safe_name} - stems.zip",
            content_disposition_type=disposition,
        )

    if stem not in STEM_KEYS:
        raise HTTPException(status_code=404, detail="Unknown stem.")

    path = storage.stem_file(job_id, stem)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stem not found.")

    return FileResponse(
        path,
        media_type="audio/wav",
        filename=f"{safe_name} - {stem}.wav",
        content_disposition_type=disposition,
    )
