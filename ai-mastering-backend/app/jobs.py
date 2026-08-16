import threading
from dataclasses import dataclass
from typing import Optional

# In-memory job store. Fine for a single-instance MVP — same tradeoff as
# ai-music-backend/app/jobs.py; swap for Supabase/Redis if this needs to
# scale across instances or persist history.


@dataclass
class MasteringJob:
    job_id: str
    stem_dir: str
    stage: str = "queued"  # queued -> mastering -> done | error
    progress: int = 0
    message: Optional[str] = None
    error: Optional[str] = None
    started: bool = False
    intensity: str = "balanced"


_jobs: dict[str, MasteringJob] = {}
_lock = threading.Lock()


def create_job(job_id: str, stem_dir: str) -> MasteringJob:
    job = MasteringJob(job_id=job_id, stem_dir=stem_dir, message="Queued.")
    with _lock:
        _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[MasteringJob]:
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **fields) -> None:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return
        for key, value in fields.items():
            setattr(job, key, value)
