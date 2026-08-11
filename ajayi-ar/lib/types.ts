/**
 * Shared type system for the artwork configuration. One config drives both
 * AR mode (MindAR image tracking) and Digital mode (camera-less viewer) —
 * see lib/scene/buildScene.ts, which is the only place that reads these
 * layers and turns them into three.js objects.
 */

/** Fractional rect against the source painting image, origin top-left, y-down — i.e. ordinary image/CSS coordinates. Converted internally to MindAR's centered/y-up anchor space. */
export interface LayerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnimationBehavior =
  | { type: "sway"; amplitudeDeg: number; periodSeconds: number; axis?: "z" | "x" }
  | { type: "bob"; amplitudeMeters: number; periodSeconds: number }
  | { type: "breathe"; scaleAmplitude: number; periodSeconds: number }
  | { type: "pulse"; minOpacity: number; maxOpacity: number; periodSeconds: number }
  | { type: "drift"; distanceMeters: number; periodSeconds: number; axis: "x" | "y" }
  | { type: "swim"; distanceMeters: number; periodSeconds: number; wagDeg: number }
  | { type: "glowFlicker"; minOpacity: number; maxOpacity: number; periodSeconds: number; jitter: number }
  | { type: "still" };

export interface SpriteLayerConfig {
  id: string;
  kind: "sprite";
  label: string;
  /** Transparent PNG cut from the source painting, alpha outside the element. */
  asset: string;
  rect: LayerRect;
  /** Small stacking offset (toward camera), keep tiny (e.g. 0.001–0.02) to stay flush with the painting. */
  depth?: number;
  /** One behavior, or several combined (e.g. sway + bob at once) for richer motion. */
  animation: AnimationBehavior | AnimationBehavior[];
  reducedMotion?: AnimationBehavior | AnimationBehavior[];
  /** Shown in a small popup where the visitor taps, if they tap this element. */
  meaning?: string;
}

export interface WaterLayerConfig {
  id: string;
  kind: "water";
  label: string;
  /** The painting region this water shader plane covers. */
  rect: LayerRect;
  depth?: number;
  color: [number, number, number];
  waveAmplitude: number;
  waveSpeed: number;
  shimmerOpacity: number;
  /** Shown in a small popup where the visitor taps, if they tap this element. */
  meaning?: string;
}

export interface ParticleLayerConfig {
  id: string;
  kind: "particles-rain" | "particles-bubbles" | "particles-glow";
  label: string;
  rect: LayerRect;
  depth?: number;
  count: number;
  color: [number, number, number];
  size: number;
  speed: number;
  opacity: number;
}

export type LayerConfig = SpriteLayerConfig | WaterLayerConfig | ParticleLayerConfig;

export interface AudioConfig {
  enabled: boolean;
  /** Off by default; user must opt in after a tap (mobile autoplay restrictions). */
  defaultOn: false;
  source: string;
  volume: number;
  loop: boolean;
}

export interface ARSettings {
  /** Physical width of the painting on the wall, in meters — used for scale-aware UI copy, not for tracking itself. */
  physicalWidthMeters: number;
  maxTrack: number;
  filterMinCF?: number;
  filterBeta?: number;
  missTolerance?: number;
  warmupTolerance?: number;
}

export interface ArtworkConfig {
  id: string;
  slug: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  description: string;
  statement?: string;
  image: {
    /** Full source photo of the physical painting — hero image, digital-mode background, og:image, and the raw asset the .mind target is compiled from. */
    src: string;
    width: number;
    height: number;
  };
  target: {
    mindFile: string;
  };
  layers: LayerConfig[];
  audio: AudioConfig;
  ar: ARSettings;
}
