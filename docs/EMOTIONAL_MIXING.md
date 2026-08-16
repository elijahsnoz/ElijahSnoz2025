# Emotional AI Mixing — Design Doc

Status: **draft, DSP side prototyped**. Companion to `ai-music-lab/README.md`,
which already lists "AI mixing/mastering" under "What's intentionally NOT
built yet." This doc scopes one specific slice of that: mixing driven by the
emotional content of the lyrics rather than by literal technical instructions.

## Prototype status

`ai-music-backend/scripts/emotional_mix_prototype.py` implements the
emotion→preset table below with real Pedalboard effects chains and runs
against a real separated vocal stem already in local `storage/`:

```
.venv/bin/python scripts/emotional_mix_prototype.py \
  --input storage/<job_id>/stems/vocals.wav \
  --output-dir storage/_prototype/emotional_mixing
```

Verified: all 8 presets render cleanly against a 78-second real vocal stem
with zero clipped samples, and each is audibly distinct from the unprocessed
baseline (peak level drops from 0.66 to 0.21–0.35 across presets, mostly from
the compressor). Deps are in `scripts/requirements-prototype.txt`, kept out of
the main `requirements.txt` since this isn't wired into the served app yet.

**Not yet tested**: `classify_lyrics_emotions()` in the same script implements
the Claude structured-output classification call, but this environment has no
`ANTHROPIC_API_KEY` (and no `ant` CLI) to actually run it against. The code
follows the shape in "Classification: Claude, structured output" below;
exercising it live is the next step once credentials are available.

**What listening to the output would tell you next**: whether the preset
table's directions are right (does "angry" actually sound angrier?) and
whether the magnitudes need tuning — that's real ear-tuning work, not
something to guess further in a doc.

## The idea

Instead of a user (or a preset) saying "more compression" or "more reverb,"
the system reads what the lyrics *mean* and picks the mix moves itself:

- Vulnerable lyric → soften transients, add warmth, widen gently
- Angry lyric → add slight distortion, narrow the vocal, push presence

The mix responds to meaning, not to knob names.

## Where this fits in the existing pipeline

`ai-music-backend` currently does exactly one thing: Demucs stem separation.
`app/main.py`'s `run_pipeline()` goes `separating (15–70%) → analysing (70%) →
finishing (90%) → done (100%)`. The `"analysing"` stage is **currently a
no-op** — it's a label on the progress bar (`ProgressBar.tsx`:
"Uploading → Separating → Analysing → Almost Finished → Done") with no actual
analysis behind it yet.

Emotional mixing is the natural thing to build under that existing stage:

```
Demucs separation (unchanged)
        │
        ▼
"analysing" stage (currently a no-op) — becomes:
  1. Classify each lyric section's emotion (Claude)
  2. Map each emotion → a DSP parameter preset
  3. Apply the preset to the vocal stem (Pedalboard)
        │
        ▼
"finishing" stage (unchanged) — zip stems, including the new mixed vocal
```

No new pipeline stage needs to be invented — the progress-bar copy already
promised this step; it just needs a body.

## Emotion taxonomy (v1: fixed, not open-ended)

A closed set is deliberate. An open-ended emotion label from an LLM can't be
looked up in a deterministic parameter table, and "distortion amount for
'wistful-but-defiant'" isn't a knob anyone can tune by ear. Start with a small
set that covers common lyrical territory, and treat it as versioned config —
tunable by ear later without touching the classification logic.

| Emotion | Typical lyric cue | Mix intent |
|---|---|---|
| `vulnerable` | confession, fear, tenderness | soften, warm, open up |
| `angry` | confrontation, rage, defiance-with-edge | roughen, focus, push forward |
| `heartbroken` | loss, grief, longing | soften further, add space, let it breathe |
| `joyful` | celebration, love, triumph | brighten, open wide, energize |
| `anxious` | dread, urgency, spiraling thought | tighten, add tension, less space |
| `confident` | swagger, self-assurance, resolve | punch, presence, controlled width |
| `nostalgic` | memory, reflection, bittersweetness | warm, soft-focus, moderate space |
| `neutral` | narrative, scene-setting, no strong charge | baseline — no special treatment |

`neutral` matters as much as the others: most songs have narrative sections
between emotional peaks, and applying an emotional preset to a section that
isn't emotionally loaded is how this feature turns into random dial-twisting.

## Emotion → DSP parameter mapping

Each emotion maps to a **preset**, not a formula — a fixed table of parameter
deltas applied to the vocal stem's baseline chain. Values below are directional
starting points to prototype against, not tuned numbers:

| Emotion | Transient shaping | Warmth (EQ) | Stereo width | Distortion/saturation | Presence (3–5kHz) | Compression |
|---|---|---|---|---|---|---|
| `vulnerable` | soften attack (−) | low-shelf boost, high-shelf cut | widen slightly | none | flat/slight cut | gentle, slow attack |
| `angry` | none / slight harden | none | narrow | light drive | boost | faster attack, higher ratio |
| `heartbroken` | soften attack (−−) | low-shelf boost | widen (more than vulnerable) | none | cut | gentle |
| `joyful` | none | slight high-shelf boost | widen | none | slight boost | moderate |
| `anxious` | harden attack (+) | slight high-shelf boost | narrow | none | boost | faster, tighter |
| `confident` | none | none | moderate/centered | light saturation | boost | punchy, moderate ratio |
| `nostalgic` | soften attack (−) | low-shelf boost, gentle high cut | moderate | light tape-style saturation | slight cut | gentle |
| `neutral` | baseline (no change) | baseline | baseline | none | baseline | baseline |

This table is the thing to tune by ear once a prototype exists — it's exactly
the kind of decision that should be made against real mixes, not guessed in a
doc.

## Pipeline detail

### 1. Input: lyrics text

MVP takes lyrics as a plain text box the user pastes alongside their upload —
no forced alignment to audio timing yet (see "Deferred" below). The whole
song's lyrics go in as one block, optionally pre-split into sections
(verse/chorus) by blank lines.

### 2. Classification: Claude, structured output

One call per song (not per section) using `output_config.format` with a JSON
schema, so the response is guaranteed parseable — no regex extraction, no
retry-on-malformed-JSON loop:

```json
{
  "type": "object",
  "properties": {
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {"type": "string"},
          "text": {"type": "string"},
          "emotion": {
            "type": "string",
            "enum": ["vulnerable", "angry", "heartbroken", "joyful",
                     "anxious", "confident", "nostalgic", "neutral"]
          }
        },
        "required": ["label", "text", "emotion"],
        "additionalProperties": false
      }
    }
  },
  "required": ["sections"],
  "additionalProperties": false
}
```

Model: default to `claude-opus-5` per house default; `claude-haiku-4-5` is a
credible cost/latency downgrade for a task this simple (short text in, short
enum out) and worth A/B-ing once real cost data exists — but that's the kind
of tradeoff to measure, not assume.

### 3. Mapping: emotion → DSP preset

Plain lookup against the table above. Deterministic, versioned, no model call
— this is what makes the whole feature debuggable and tunable independent of
the LLM.

### 4. Apply: DSP on the vocal stem

Use [Pedalboard](https://github.com/spotify/pedalboard) (already a natural
fit: Python, built for exactly this — chainable audio effects, runs in-process,
no subprocess like the Demucs runner needs). New dependency in
`ai-music-backend/requirements.txt`. Build a `Pedalboard([...])` chain per
preset (compressor, distortion, high/low-shelf filters, a stereo widener) and
render it over the separated `vocals.wav`.

### 5. Output

Keep the original `vocals.wav` untouched and add `vocals_mixed.wav` alongside
it in the stems zip — additive, not destructive. This matches the product's
stated philosophy in `ai-music-lab/README.md`: *"Preserve your first idea."*
The raw stem stays available for anyone who wants it; the emotional mix is an
option, not a replacement.

## API surface changes

- `POST /upload`: accept an optional `lyrics` text field alongside the audio
  file.
- `GET /status/{job_id}`: add an `emotions` field — the per-section
  classification result — once the `analysing` stage completes, so the UI can
  show *why* the mix sounds the way it does ("this section mixed for:
  angry").
- `GET /download/{job_id}/{stem}`: add `vocals_mixed` as a valid `stem` value
  alongside the existing `STEM_KEYS`.

## Frontend changes (`ai-music-lab`)

- A lyrics textarea in the upload flow (optional — skip emotional mixing
  entirely if empty).
- A small "mixed for: vulnerable / angry / …" readout per section, sourced
  from the new `emotions` field — transparency into what the AI decided,
  echoing the `AudioPlayer`/`StemCard` pattern already in place.
- `StemCard` gains a second player for `vocals_mixed`, sitting next to the
  existing raw `vocals` player for A/B comparison.

## Rollout

1. **MVP**: whole-song single dominant emotion (one Claude call, one preset,
   applied uniformly to the vocal stem). Simplest possible version — no
   per-section timing problem to solve yet.
2. **Stage 2**: per-section granularity, using the blank-line-separated
   sections from the pasted lyrics. Introduces the boundary problem — need a
   short crossfade between presets so section transitions don't sound like a
   hard cut.
3. **Stage 3**: align lyric sections to actual audio timing (forced alignment
   via something like WhisperX transcription against the separated vocal
   stem) instead of relying on manual paste order. This removes the current
   MVP's implicit assumption that pasted-lyrics order matches audio order.

## Open questions / deferred

- **Timing alignment** (stage 3 above) is the biggest unknown — it's a real
  audio-processing problem (forced alignment), not just a mixing one.
- **Multi-emotion sections**: a bridge that's both vulnerable and defiant
  isn't representable in a single-label taxonomy. Deferred; blend/interpolate
  between two nearest presets is a plausible v2 answer, not a v1 one.
- **Vocal-only vs. full mix**: v1 only touches the vocal stem. Extending
  presets to drums/bass/other (e.g. angry → tighter low end) is a natural
  follow-on once the vocal-only version is validated.
- **Preset tuning**: the DSP table above is a starting point for prototyping,
  not a tuned result — expect to revise it by ear against real songs.
