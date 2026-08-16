import os
from pathlib import Path

# This service only ever receives Demucs-separated stems forwarded by the
# Next.js layer, never an arbitrary user upload — no ffprobe/extension
# allow-list needed beyond a simple wav check, unlike ai-music-backend.
ALLOWED_EXTENSIONS = {".wav"}

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", 60 * 1024 * 1024))
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage")).resolve()

UNSUPPORTED_FORMAT_MESSAGE = "Unsupported file format. Expected a WAV file."
FILE_TOO_LARGE_MESSAGE = f"File is too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
