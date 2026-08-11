"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ArtworkConfig } from "@/lib/types";
import { buildPaintingScene, type PaintingScene } from "@/lib/scene/buildScene";
import { attachTapHandler, type ScreenTapHit } from "@/lib/scene/tapHandler";
import type { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

interface Props {
  artwork: ArtworkConfig;
  reducedMotion: boolean;
  onTargetFound: () => void;
  onTargetLost: () => void;
  onError: (message: string) => void;
  onReady: () => void;
  onSymbolTap: (hit: ScreenTapHit) => void;
}

/**
 * Owns the MindAR lifecycle: camera video feed, image-target tracking, and
 * a three.js scene whose anchor.group we hand to buildPaintingScene — the
 * exact same layer-building function the camera-less digital viewer uses.
 * If the camera moves around the physical painting, MindAR keeps
 * anchor.group's matrix aligned to it every frame; we never touch that
 * matrix ourselves.
 */
export default function ARCanvas({
  artwork,
  reducedMotion,
  onTargetFound,
  onTargetLost,
  onError,
  onReady,
  onSymbolTap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onTargetFound, onTargetLost, onError, onReady, onSymbolTap });

  useEffect(() => {
    callbacksRef.current = { onTargetFound, onTargetLost, onError, onReady, onSymbolTap };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    let mindarThree: MindARThree | null = null;
    let paintingScene: PaintingScene | null = null;
    let detachTapHandler: (() => void) | null = null;

    (async () => {
      try {
        const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js");

        const instance = new MindARThree({
          container,
          imageTargetSrc: artwork.target.mindFile,
          maxTrack: artwork.ar.maxTrack,
          filterMinCF: artwork.ar.filterMinCF,
          filterBeta: artwork.ar.filterBeta,
          missTolerance: artwork.ar.missTolerance,
          warmupTolerance: artwork.ar.warmupTolerance,
          uiScanning: "no",
          uiLoading: "no",
          uiError: "no",
        });
        if (disposed) return;
        mindarThree = instance;

        // alpha:true (set inside MindARThree's own constructor) only makes the
        // canvas *capable* of transparency — it still clears each frame to
        // opaque black unless we also zero the clear alpha. Without this, the
        // live camera feed is completely hidden behind solid black wherever
        // no sprite is drawn.
        instance.renderer.setClearColor(0x000000, 0);

        const anchor = instance.addAnchor(0);
        const textureLoader = new THREE.TextureLoader();
        const scene = buildPaintingScene(artwork, textureLoader, reducedMotion);
        paintingScene = scene;
        anchor.group.add(scene.group);

        anchor.onTargetFound = () => callbacksRef.current.onTargetFound();
        anchor.onTargetLost = () => callbacksRef.current.onTargetLost();

        await instance.start();
        if (disposed) {
          instance.stop();
          return;
        }
        callbacksRef.current.onReady();

        detachTapHandler = attachTapHandler(
          container,
          () => instance.camera,
          scene,
          (screenHit) => callbacksRef.current.onSymbolTap(screenHit)
        );

        const clock = new THREE.Clock();
        const animate = () => {
          const elapsed = clock.getElapsedTime();
          scene.update(elapsed);
          instance.renderer.render(instance.scene, instance.camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();
      } catch (err) {
        callbacksRef.current.onError(
          err instanceof Error ? err.message : "The camera could not be started. Check permissions and try again."
        );
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      detachTapHandler?.();
      paintingScene?.dispose();
      if (mindarThree) {
        try {
          mindarThree.stop();
        } catch {
          // camera track may already be stopped
        }
      }
    };
    // artwork/reducedMotion changes intentionally remount the whole AR session (new target, new scene);
    // callbacks are read through callbacksRef so they don't need to be dependencies.
  }, [artwork, reducedMotion]);

  return <div ref={containerRef} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />;
}
