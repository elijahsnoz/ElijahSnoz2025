import threading
from dataclasses import dataclass
from typing import Optional

# In-memory job store. Fine for a single-instance MVP; swap for Supabase/Redis
# once the AI Music Lab needs to scale across instances or persist history.


@dataclass
class Job:
    job_id: str
    original_filename: str
    input_path: str
    stage: str = "separating"
    progress: int = 0
    message: Optional[str] = None
    error: Optional[str] = None
    started: bool = False


_jobs: dict[str, Job] = {}
_lock = threading.Lock()


def create_job(job_id: str, original_filename: str, input_path: str) -> Job:
    job = Job(
        job_id=job_id,
        original_filename=original_filename,
        input_path=input_path,
        message="Queued for separation.",
    )
    with _lock:
        _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[Job]:
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **fields) -> None:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return
        for key, value in fields.items():
            setattr(job, key, value)
