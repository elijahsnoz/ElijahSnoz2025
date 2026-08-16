import type { MasteringIntensity, ProcessingStage, StemKey } from "./types";

export const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".flac"] as const;

export const ACCEPTED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/flac",
  "audio/x-flac",
] as const;

// Keep in sync with backend/app/config.py
export const MAX_FILE_SIZE_BYTES = 60 * 1024 * 1024; // 60MB

export const UNSUPPORTED_FORMAT_MESSAGE =
  "Unsupported file format. Please upload: MP3, WAV, or FLAC.";

export const FILE_TOO_LARGE_MESSAGE = "File is too large. Maximum size is 60MB.";

export const STEM_ORDER: StemKey[] = ["vocals", "drums", "bass", "other"];

export const STEM_LABELS: Record<StemKey, string> = {
  vocals: "Vocals",
  drums: "Drums",
  bass: "Bass",
  other: "Other",
};

export const STAGE_LABELS: Record<ProcessingStage, string> = {
  idle: "",
  uploading: "Uploading",
  separating: "Separating Stems",
  analysing: "Analysing Audio",
  finishing: "Almost Finished",
  done: "Done",
  error: "Something went wrong",
};

export const STAGE_ORDER: ProcessingStage[] = [
  "uploading",
  "separating",
  "analysing",
  "finishing",
  "done",
];

export const JOB_POLL_INTERVAL_MS = 1500;

const KEY_ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Chromatic (no key) correction is always available as the default; these
// are the optional restricted-scale choices for tighter correction.
export const VOCAL_FX_KEYS: string[] = [
  ...KEY_ROOTS.map((root) => `${root} major`),
  ...KEY_ROOTS.map((root) => `${root} minor`),
];

// Fixed presets, not a bank of dials — mirrors ai-mastering-backend/app/mastering.py's PRESETS.
export const MASTERING_INTENSITIES: { value: MasteringIntensity; label: string; description: string }[] = [
  { value: "gentle", label: "Gentle", description: "Subtle glue, dynamics preserved (–16 LUFS)" },
  { value: "balanced", label: "Balanced", description: "Radio-ready loudness (–12 LUFS)" },
  { value: "loud", label: "Loud", description: "Competitive streaming loudness (–9 LUFS)" },
];
