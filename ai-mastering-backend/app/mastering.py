"""Final-mix mastering: sum the four Demucs stems back into the full mix,
run a bus EQ/compression chain, then normalize loudness to a target LUFS and
brick-wall limit for safety.

Reconstructing the mix from stems (rather than mastering the original
upload) is deliberate: `ai-music-backend` deletes the original upload once
separation finishes — no per-job storage of it is kept — so the four stems
are the only surviving representation of the full mix. Demucs stems are
designed to sum back to (approximately) the source audio, so this loses
nothing meaningful versus mastering the original file directly.

Three fixed intensity presets, not a bank of dials — same reasoning as
EMOTION_PRESETS in ai-music-backend/scripts/emotional_mix_prototype.py: a
preset table is tunable by ear and debuggable; a wall of sliders just turns
into guesswork for a listener with no mastering background.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import numpy as np
import pyloudnorm as pyln
from pedalboard import (
    Compressor,
    Gain,
    HighpassFilter,
    HighShelfFilter,
    Limiter,
    LowShelfFilter,
    Pedalboard,
)
from pedalboard.io import AudioFile

Intensity = Literal["gentle", "balanced", "loud"]

STEM_FILENAMES = ("vocals.wav", "drums.wav", "bass.wav", "other.wav")

PRE_CHAIN_HEADROOM = 10 ** (-1 / 20)  # -1 dBFS, leaves room for the bus chain to add gain
MAX_GAIN_DB = 24.0  # clamp: guards against a near-silent stem summing to -inf LUFS
TRUE_PEAK_CEILING = 10 ** (-0.3 / 20)  # -0.3 dBFS

# Pedalboard's Limiter has no lookahead, so a fast transient can slip past its
# gain reduction before it reacts — measured directly against real stems, the
# post-limiter peak hit a dead-on 1.0 (i.e. clipped at the int16 write step)
# on every preset, well past the -0.3dB threshold passed to Limiter() below.
# That clipping also explained why loudness overshot every preset's target:
# the distortion added broadband energy the K-weighted meter reads as extra
# loudness. A final linear peak-normalize is the standard fix (a true-peak
# safety net, not a substitute for the limiter's job of gluing dynamics).

# Target integrated loudness climbs and bus compression tightens from
# gentle -> loud, matching how a mastering engineer actually moves between
# "preserve dynamics" and "competitive streaming loudness" — not a blanket
# volume boost.
PRESETS: dict[Intensity, dict[str, float]] = {
    "gentle": {
        "target_lufs": -16.0,
        "comp_threshold_db": -18.0,
        "comp_ratio": 1.8,
        "comp_attack_ms": 20.0,
        "comp_release_ms": 250.0,
    },
    "balanced": {
        "target_lufs": -12.0,
        "comp_threshold_db": -16.0,
        "comp_ratio": 2.5,
        "comp_attack_ms": 12.0,
        "comp_release_ms": 180.0,
    },
    "loud": {
        "target_lufs": -9.0,
        "comp_threshold_db": -14.0,
        "comp_ratio": 3.5,
        "comp_attack_ms": 8.0,
        "comp_release_ms": 120.0,
    },
}


def _read_stereo(path: Path) -> tuple[np.ndarray, int]:
    with AudioFile(str(path)) as f:
        return f.read(f.frames), f.samplerate


def sum_stems(stem_paths: dict[str, Path]) -> tuple[np.ndarray, int]:
    """Sums the four Demucs stems back into the full mix.

    Stems are expected to share sample rate and length (they're all outputs
    of the same Demucs separation pass); lengths are aligned defensively by
    zero-padding to the longest one rather than assuming exact equality.
    """
    arrays: list[np.ndarray] = []
    sample_rate: int | None = None

    for name in STEM_FILENAMES:
        stereo, sr = _read_stereo(stem_paths[name])
        if sample_rate is None:
            sample_rate = sr
        elif sr != sample_rate:
            raise ValueError(f"Stem {name} sample rate {sr} does not match {sample_rate}")
        arrays.append(stereo)

    assert sample_rate is not None
    max_len = max(a.shape[1] for a in arrays)
    padded = [np.pad(a, ((0, 0), (0, max_len - a.shape[1]))) for a in arrays]
    mix = np.sum(padded, axis=0)

    peak = np.max(np.abs(mix))
    if peak > PRE_CHAIN_HEADROOM:
        mix = mix * (PRE_CHAIN_HEADROOM / peak)

    return mix.astype(np.float32), sample_rate


def _bus_chain(preset: dict[str, float]) -> Pedalboard:
    return Pedalboard(
        [
            HighpassFilter(cutoff_frequency_hz=20),  # sub rumble only, never touches real bass
            LowShelfFilter(cutoff_frequency_hz=120, gain_db=0.75, q=0.7),  # warmth
            HighShelfFilter(cutoff_frequency_hz=10000, gain_db=1.5, q=0.7),  # air
            Compressor(
                threshold_db=preset["comp_threshold_db"],
                ratio=preset["comp_ratio"],
                attack_ms=preset["comp_attack_ms"],
                release_ms=preset["comp_release_ms"],
            ),
        ]
    )


def _loudness_error_db(signal: np.ndarray, meter: pyln.Meter, target_lufs: float) -> float:
    measured = meter.integrated_loudness(signal.T)
    if not np.isfinite(measured):
        return 0.0  # near-silent input: nothing meaningful to correct against
    return max(min(target_lufs - measured, MAX_GAIN_DB), -MAX_GAIN_DB)


def _apply_gain_and_limit(processed: np.ndarray, sample_rate: int, gain_db: float) -> np.ndarray:
    chain = Pedalboard([Gain(gain_db=gain_db), Limiter(threshold_db=-0.3, release_ms=250)])
    return chain(processed, sample_rate)


def master(mix: np.ndarray, sample_rate: int, intensity: Intensity) -> np.ndarray:
    preset = PRESETS[intensity]
    target_lufs = preset["target_lufs"]

    processed = _bus_chain(preset)(mix, sample_rate)
    meter = pyln.Meter(sample_rate)

    # Two-pass loudness match, not one gain calculation: brick-wall limiting
    # compresses dynamics enough to raise perceived loudness beyond what a
    # pre-limiter gain estimate predicts (the same effect the loudness wars
    # run on — squashing peaks raises average level for a fixed ceiling).
    # Verified against real stems: a single pass overshot the gentle/balanced
    # targets by 2-4 LUFS even with clipping fixed. Re-measuring the actual
    # post-limiter output and correcting once converges to within ~0.3 LUFS.
    gain_db = _loudness_error_db(processed, meter, target_lufs)
    limited = _apply_gain_and_limit(processed, sample_rate, gain_db)

    residual_db = _loudness_error_db(limited, meter, target_lufs)
    if abs(residual_db) > 0.3:
        limited = _apply_gain_and_limit(processed, sample_rate, gain_db + residual_db)

    peak = np.max(np.abs(limited))
    if peak > TRUE_PEAK_CEILING:
        limited = limited * (TRUE_PEAK_CEILING / peak)

    return np.clip(limited, -1.0, 1.0)


def master_stems(stem_paths: dict[str, Path], output_path: Path, intensity: Intensity) -> None:
    mix, sample_rate = sum_stems(stem_paths)
    mastered = master(mix, sample_rate, intensity)

    with AudioFile(str(output_path), "w", sample_rate, mastered.shape[0]) as f:
        f.write(mastered.astype(np.float32))
