import asyncio
import json


class InvalidAudioError(Exception):
    pass


async def probe_audio(path: str) -> float:
    """Verifies the file is decodable audio via ffprobe and returns its duration in seconds.

    Guards against files whose extension is spoofed (e.g. a renamed .exe saved as .mp3).
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "ffprobe",
            "-v", "error",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await process.communicate()
    except FileNotFoundError as exc:
        raise InvalidAudioError("Audio validation is unavailable (ffprobe not installed).") from exc

    if process.returncode != 0:
        raise InvalidAudioError("This file could not be read as audio.")

    data = json.loads(stdout or b"{}")
    streams = data.get("streams", [])
    if not any(stream.get("codec_type") == "audio" for stream in streams):
        raise InvalidAudioError("This file does not contain an audio stream.")

    return float(data.get("format", {}).get("duration", 0) or 0)
