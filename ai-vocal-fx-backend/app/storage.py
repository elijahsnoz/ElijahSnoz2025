from pathlib import Path

from .config import STORAGE_DIR


def job_dir(job_id: str) -> Path:
    return STORAGE_DIR / job_id


def input_path(job_id: str) -> Path:
    return job_dir(job_id) / "input.wav"


def output_path(job_id: str) -> Path:
    return job_dir(job_id) / "output.wav"
