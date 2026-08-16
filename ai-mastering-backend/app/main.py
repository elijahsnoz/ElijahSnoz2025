import logging
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from . import storage
from .config import ALLOWED_EXTENSIONS, FILE_TOO_LARGE_MESSAGE, MAX_FILE_SIZE_BYTES, UNSUPPORTED_FORMAT_MESSAGE
from .jobs import create_job, get_job, update_job
from .mastering import PRESETS, STEM_FILENAMES, master_stems

logger = logging.getLogger("ai_mastering")

app = FastAPI(title="AI Music Lab — Mastering Service")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(
    vocals: UploadFile = File(...),
    drums: UploadFile = File(...),
    bass: UploadFile = File(...),
    other: UploadFile = File(...),
):
    stems = {"vocals.wav": vocals, "drums.wav": drums, "bass.wav": bass, "other.wav": other}

    job_id = uuid.uuid4().hex
    target_dir = storage.job_dir(job_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    for filename, upload_file in stems.items():
        extension = Path(upload_file.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=422, detail=UNSUPPORTED_FORMAT_MESSAGE)

        contents = await upload_file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=422, detail=f"Stem {filename} is empty.")
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=422, detail=FILE_TOO_LARGE_MESSAGE)

        (target_dir / filename).write_bytes(contents)

    create_job(job_id=job_id, stem_dir=str(target_dir))

    return {"job_id": job_id}


class ProcessOptions(BaseModel):
    intensity: str = "balanced"


@app.post("/process/{job_id}")
async def process(job_id: str, options: ProcessOptions, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.started:
        return {"status": "already_running", "stage": job.stage}

    if options.intensity not in PRESETS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown intensity {options.intensity!r}. Expected one of: {', '.join(PRESETS)}.",
        )

    update_job(
        job_id,
        started=True,
        stage="mastering",
        progress=20,
        message="Mastering…",
        intensity=options.intensity,
    )
    background_tasks.add_task(run_pipeline, job_id)

    return {"status": "started"}


async def run_pipeline(job_id: str) -> None:
    job = get_job(job_id)
    if job is None:
        return

    try:
        update_job(job_id, progress=40)
        stem_dir = Path(job.stem_dir)
        stem_paths = {name: stem_dir / name for name in STEM_FILENAMES}
        master_stems(stem_paths, storage.output_path(job_id), job.intensity)
        update_job(job_id, stage="done", progress=100, message="Done.")

    except Exception:
        logger.exception("Job %s: unexpected failure in run_pipeline", job_id)
        update_job(job_id, stage="error", error="Something went wrong while mastering your song.")


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
    }


@app.get("/download/{job_id}")
async def download(job_id: str, download: bool = False):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.stage != "done":
        raise HTTPException(status_code=409, detail="This master is not ready yet.")

    path = storage.output_path(job_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Mastered mix not found.")

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path,
        media_type="audio/wav",
        filename="mastered.wav",
        content_disposition_type=disposition,
    )
