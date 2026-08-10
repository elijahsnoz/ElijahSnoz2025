import type { LayerRect } from "@/lib/types";

/**
 * MindAR's anchor.group local space (see mind-ar's three.js postMatrix):
 * the tracked image spans x ∈ [-0.5, 0.5] (width = 1) and
 * y ∈ [-0.5 * aspect, 0.5 * aspect] where aspect = imageHeight / imageWidth,
 * origin at the CENTER of the painting, +y up, +z toward the viewer.
 *
 * Artwork configs author `rect` in ordinary top-left-origin, y-down,
 * fractional image coordinates instead, because that's what a human
 * eyeballing the source photo can reason about. This module is the one
 * place that converts between the two, so AR mode and Digital mode read
 * layers identically.
 */
export function paintingAspect(imageWidth: number, imageHeight: number): number {
  return imageHeight / imageWidth;
}

export interface LocalRect {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  top: number;
  bottom: number;
}

export function rectToLocal(rect: LayerRect, aspect: number): LocalRect {
  const width = rect.width;
  const height = rect.height * aspect;
  const centerX = rect.x + rect.width / 2 - 0.5;
  const centerY = (0.5 - (rect.y + rect.height / 2)) * aspect;
  const top = (0.5 - rect.y) * aspect;
  const bottom = (0.5 - (rect.y + rect.height)) * aspect;
  return { centerX, centerY, width, height, top, bottom };
}

/** Deterministic 0..1 phase offset from a layer id, so identical behaviors on different layers don't move in lockstep. */
export function phaseFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}
