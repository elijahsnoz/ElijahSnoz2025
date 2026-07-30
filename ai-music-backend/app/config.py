import os
from pathlib import Path

# Keep in sync with ai-music-lab/lib/constants.ts
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac"}
STEM_KEYS = ["vocals", "drums", "bass", "other"]

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", 60 * 1024 * 1024))
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage")).resolve()
DEMUCS_MODEL = os.getenv("DEMUCS_MODEL", "htdemucs")

UNSUPPORTED_FORMAT_MESSAGE = "Unsupported file format. Please upload: MP3, WAV, or FLAC."
FILE_TOO_LARGE_MESSAGE = f"File is too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
