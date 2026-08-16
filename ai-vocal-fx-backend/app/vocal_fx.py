"""Vocal processing pipeline: noise reduction + presence EQ/reverb
enhancement, and WORLD-vocoder pitch correction, applied to a single vocal
stem.

Adapted from ai-music-backend/scripts/voice_enhance_prototype.py and
pitch_correct_prototype.py, each prototyped and validated separately against
a real vocal recording. Two fixes proven necessary during that prototyping
are preserved here — both silent, both destructive if reverted:

- noisereduce's prop_decrease=0.5, not the library default of 1.0. At the
  default, a real vocal recording had ~52% of its samples pushed into
  near-silence — the algorithm was gating out actual vocal content (breaths,
  word tails, quiet passages), not just noise. 0.5 keeps that close to the
  source's own natural silence ratio.
- WORLD's synthesize() does not preserve input level: a zero-correction
  round-trip alone overshot peak from 1.20 to 1.73 on real audio. Output is
  normalized to -1dBFS before writing, or every pitch-corrected result clips.

Shape note: denoise() and the Pedalboard chain both operate on the full
(channels, samples) stereo array (as validated in voice_enhance_prototype.py
— Pedalboard expects that shape). Pitch correction is inherently mono — WORLD
analyzes a single F0 contour — so the signal is collapsed to one channel
(input is always a Demucs stem with identical L/R) for that stage only, then
re-duplicated to stereo before the enhancement chain, matching how each
stage was actually tested.
"""

from __future__ import annotations

import re
from pathlib import Path

import noisereduce as nr
import numpy as np
import pyworld as pw
from pedalboard import Compressor, HighpassFilter, NoiseGate, PeakFilter, Pedalboard, Reverb
from pedalboard.io import AudioFile

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10]

TARGET_PEAK = 10 ** (-1 / 20)  # -1 dBFS headroom

ENHANCEMENT_CHAIN = Pedalboard(
    [
        HighpassFilter(cutoff_frequency_hz=90),  # cut mic rumble / handling noise
        NoiseGate(threshold_db=-45, ratio=4.0, attack_ms=2, release_ms=150),
        PeakFilter(cutoff_frequency_hz=3000, gain_db=2.0, q=1.0),  # presence/clarity
        Compressor(threshold_db=-20, ratio=2.5, attack_ms=8, release_ms=150),
        Reverb(room_size=0.35, damping=0.5, wet_level=0.18, dry_level=0.85, width=1.0),
    ]
)


class InvalidKeyError(ValueError):
    pass


def parse_key(key: str) -> list[int]:
    """'C major' / 'a minor' -> sorted list of pitch classes (0-11, C=0)."""
    match = re.match(r"^\s*([A-Ga-g])(#|b)?\s+(major|minor)\s*$", key)
    if not match:
        raise InvalidKeyError(f"Can't parse key {key!r} — expected e.g. 'C major' or 'A minor'")
    letter, accidental, mode = match.groups()
    root_name = letter.upper() + (accidental or "")
    if root_name.endswith("b"):
        flat_to_sharp = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
        root_name = flat_to_sharp.get(root_name, root_name)
    root = NOTE_NAMES.index(root_name)
    intervals = MAJOR_INTERVALS if mode.lower() == "major" else MINOR_INTERVALS
    return sorted((root + i) % 12 for i in intervals)


def _denoise_channel(channel: np.ndarray, sample_rate: int) -> np.ndarray:
    return nr.reduce_noise(y=channel, sr=sample_rate, stationary=True, prop_decrease=0.5)


def _hz_to_midi(f0: np.ndarray) -> np.ndarray:
    with np.errstate(divide="ignore"):
        return 69 + 12 * np.log2(np.where(f0 > 0, f0, np.nan) / 440.0)


def _midi_to_hz(midi: np.ndarray) -> np.ndarray:
    hz = 440.0 * 2 ** ((midi - 69) / 12)
    return np.where(np.isnan(midi), 0.0, hz)


def _nearest_target_midi(midi: np.ndarray, allowed_pitch_classes: list[int] | None) -> np.ndarray:
    if allowed_pitch_classes is None:
        return np.round(midi)
    rounded = np.floor(midi)
    target = np.full_like(midi, np.nan)
    for base in range(-1, 2):  # check the semitone below/at/above for the nearest scale tone
        candidate = rounded + base
        pitch_class = np.mod(candidate, 12)
        matches = np.isin(pitch_class, allowed_pitch_classes)
        closer = np.isnan(target) | (np.abs(candidate - midi) < np.abs(target - midi))
        target = np.where(matches & closer, candidate, target)
    return target


def _correct_pitch(
    mono_f64: np.ndarray,
    sample_rate: int,
    retune_strength: float,
    allowed_pitch_classes: list[int] | None,
) -> np.ndarray:
    f0, t = pw.harvest(mono_f64, sample_rate)
    f0 = pw.stonemask(mono_f64, f0, t, sample_rate)
    sp = pw.cheaptrick(mono_f64, f0, t, sample_rate)
    ap = pw.d4c(mono_f64, f0, t, sample_rate)

    midi = _hz_to_midi(f0)
    target_midi = _nearest_target_midi(midi, allowed_pitch_classes)
    voiced = ~np.isnan(midi)

    corrected_midi = midi.copy()
    corrected_midi[voiced] = midi[voiced] + retune_strength * (target_midi[voiced] - midi[voiced])
    corrected_f0 = _midi_to_hz(corrected_midi)
    return pw.synthesize(corrected_f0, sp, ap, sample_rate)


def _normalize(stereo: np.ndarray) -> np.ndarray:
    peak = np.max(np.abs(stereo))
    return stereo * (TARGET_PEAK / peak) if peak > TARGET_PEAK else stereo


def process_vocal(
    input_path: Path,
    output_path: Path,
    enhance: bool,
    retune_strength: float,
    key: str | None,
) -> None:
    """Denoise -> pitch-correct -> EQ/reverb -> normalize -> write.

    `input_path` must be a wav with identical L/R channels (a Demucs vocal
    stem) — that assumption is what lets pitch correction safely collapse to
    mono and re-duplicate afterward.
    """
    with AudioFile(str(input_path)) as f:
        sample_rate = f.samplerate
        stereo = f.read(f.frames)

    if enhance:
        stereo = np.stack([_denoise_channel(channel, sample_rate) for channel in stereo])

    if retune_strength > 0:
        allowed_pitch_classes = parse_key(key) if key else None
        mono_f64 = stereo[0].astype(np.float64)
        corrected_mono = _correct_pitch(mono_f64, sample_rate, retune_strength, allowed_pitch_classes)
        stereo = np.stack([corrected_mono, corrected_mono])

    if enhance:
        stereo = ENHANCEMENT_CHAIN(stereo, sample_rate)

    stereo = _normalize(stereo)

    with AudioFile(str(output_path), "w", sample_rate, stereo.shape[0]) as f:
        f.write(stereo.astype(np.float32))
