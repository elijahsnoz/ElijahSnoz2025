import asyncio
import os
import re
import sys
from pathlib import Path
from typing import AsyncIterator, Callable, Optional

import certifi

from .config import DEMUCS_MODEL

_TQDM_PERCENT = re.compile(r"(\d{1,3})%\|")


class DemucsError(Exception):
    pass


async def _iter_stream_updates(stream: asyncio.StreamReader) -> AsyncIterator[str]:
    """Yields each progress update from a stream that uses '\\r' (tqdm) or '\\n' line endings."""
    buffer = b""
    while True:
        chunk = await stream.read(1024)
        if not chunk:
            if buffer:
                yield buffer.decode(errors="ignore")
            return
        buffer += chunk
        while True:
            cut = min((i for i in (buffer.find(b"\r"), buffer.find(b"\n")) if i != -1), default=-1)
            if cut == -1:
                break
            yield buffer[:cut].decode(errors="ignore")
            buffer = buffer[cut + 1:]


async def separate_stems(
    input_path: Path,
    output_dir: Path,
    on_progress: Optional[Callable[[int], None]] = None,
) -> None:
    """Runs Demucs (via ffmpeg-backed decoding) to split a track into 4 stems.

    Streams stderr as it's produced (rather than waiting for the process to
    exit) so tqdm's per-segment progress can be parsed and reported live.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # This Python install may not have a CA bundle configured (common on
    # macOS python.org builds), which otherwise breaks the HTTPS download of
    # the model weights on first run. certifi's bundle works everywhere.
    env = {**os.environ, "SSL_CERT_FILE": certifi.where()}

    process = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "demucs",
        "-n", DEMUCS_MODEL,
        "-o", str(output_dir),
        str(input_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env,
    )

    assert process.stdout is not None and process.stderr is not None
    tail: list[str] = []

    async def consume_stderr() -> None:
        async for update in _iter_stream_updates(process.stderr):
            if update.strip():
                tail.append(update.strip())
                del tail[:-5]
            match = _TQDM_PERCENT.search(update)
            if match and on_progress:
                on_progress(int(match.group(1)))

    async def drain_stdout() -> None:
        while await process.stdout.read(4096):
            pass

    await asyncio.gather(consume_stderr(), drain_stdout())
    returncode = await process.wait()

    if returncode != 0:
        raise DemucsError("\n".join(tail) or "Demucs failed to separate stems.")
