from pathlib import Path

from .config import STORAGE_DIR


def job_dir(job_id: str) -> Path:
    return STORAGE_DIR / job_id


def input_path(job_id: str, extension: str) -> Path:
    return job_dir(job_id) / f"input{extension}"


def demucs_output_dir(job_id: str) -> Path:
    return job_dir(job_id) / "demucs_out"


def stems_dir(job_id: str) -> Path:
    return job_dir(job_id) / "stems"


def stem_file(job_id: str, stem: str) -> Path:
    return stems_dir(job_id) / f"{stem}.wav"


def zip_file(job_id: str) -> Path:
    return stems_dir(job_id) / "all.zip"
