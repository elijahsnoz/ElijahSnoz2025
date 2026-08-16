import logging
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from . import storage
from .config import ALLOWED_EXTENSIONS, FILE_TOO_LARGE_MESSAGE, MAX_FILE_SIZE_BYTES, UNSUPPORTED_FORMAT_MESSAGE
from .jobs import create_job, get_job, update_job
from .vocal_fx import InvalidKeyError, parse_key, process_vocal

logger = logging.getLogger("ai_vocal_fx")

app = FastAPI(title="AI Music Lab — Vocal FX Service")


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

    destination = storage.input_path(job_id)
    destination.write_bytes(contents)

    create_job(job_id=job_id, input_path=str(destination))

    return {"job_id": job_id}


class ProcessOptions(BaseModel):
    enhance: bool = True
    retune_strength: float = Field(default=0.0, ge=0.0, le=1.0)
    key: str | None = None


@app.post("/process/{job_id}")
async def process(job_id: str, options: ProcessOptions, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.started:
        return {"status": "already_running", "stage": job.stage}

    if options.key is not None:
        try:
            parse_key(options.key)
        except InvalidKeyError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    update_job(
        job_id,
        started=True,
        stage="processing",
        progress=10,
        message="Processing vocal…",
        enhance=options.enhance,
        retune_strength=options.retune_strength,
        key=options.key,
    )
    background_tasks.add_task(run_pipeline, job_id)

    return {"status": "started"}


async def run_pipeline(job_id: str) -> None:
    job = get_job(job_id)
    if job is None:
        return

    try:
        update_job(job_id, progress=30)
        process_vocal(
            input_path=Path(job.input_path),
            output_path=storage.output_path(job_id),
            enhance=job.enhance,
            retune_strength=job.retune_strength,
            key=job.key,
        )
        update_job(job_id, stage="done", progress=100, message="Done.")

    except Exception:
        logger.exception("Job %s: unexpected failure in run_pipeline", job_id)
        update_job(job_id, stage="error", error="Something went wrong while processing your vocal.")


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
        raise HTTPException(status_code=409, detail="This vocal is not ready yet.")

    path = storage.output_path(job_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Processed vocal not found.")

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path,
        media_type="audio/wav",
        filename="vocals - processed.wav",
        content_disposition_type=disposition,
    )
