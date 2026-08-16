import threading
from dataclasses import dataclass
from typing import Optional

# In-memory job store. Fine for a single-instance MVP — same tradeoff as
# ai-music-backend/app/jobs.py; swap for Supabase/Redis if this needs to
# scale across instances or persist history.


@dataclass
class VocalFxJob:
    job_id: str
    input_path: str
    stage: str = "queued"  # queued -> processing -> done | error
    progress: int = 0
    message: Optional[str] = None
    error: Optional[str] = None
    started: bool = False
    enhance: bool = True
    retune_strength: float = 0.0
    key: Optional[str] = None


_jobs: dict[str, VocalFxJob] = {}
_lock = threading.Lock()


def create_job(job_id: str, input_path: str) -> VocalFxJob:
    job = VocalFxJob(job_id=job_id, input_path=input_path, message="Queued.")
    with _lock:
        _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[VocalFxJob]:
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **fields) -> None:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return
        for key, value in fields.items():
            setattr(job, key, value)
