"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ArtworkConfig } from "@/lib/types";
import { paintingAspect } from "@/lib/scene/coords";
import { buildPaintingScene } from "@/lib/scene/buildScene";
import { attachTapHandler, type ScreenTapHit } from "@/lib/scene/tapHandler";

interface Props {
  artwork: ArtworkConfig;
  reducedMotion: boolean;
  className?: string;
  onSymbolTap?: (hit: ScreenTapHit) => void;
}

/**
 * The camera-less "the painting exists in two dimensions" viewer — same
 * layer system as AR mode (buildPaintingScene), just without MindAR's
 * anchor tracking. Used as the fallback when a device can't run AR, and
 * from the artwork archive pages.
 */
export default function DigitalPaintingViewer({ artwork, reducedMotion, className, onSymbolTap }: Props) {
  const onSymbolTapRef = useRef(onSymbolTap);
  useEffect(() => {
    onSymbolTapRef.current = onSymbolTap;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const aspect = paintingAspect(artwork.image.width, artwork.image.height);
    const scene = new THREE.Scene();

    const viewWidth = 1.08;
    const viewHeight = viewWidth * (container.clientHeight / container.clientWidth || aspect);
    const camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 0.01, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // alpha:true alone still clears to opaque black otherwise
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load(artwork.image.src);
    backgroundTexture.colorSpace = THREE.SRGBColorSpace;
    const backgroundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, aspect),
      new THREE.MeshBasicMaterial({ map: backgroundTexture, toneMapped: false })
    );
    backgroundMesh.position.z = 0;
    scene.add(backgroundMesh);

    const paintingScene = buildPaintingScene(artwork, textureLoader, reducedMotion);
    scene.add(paintingScene.group);

    let frameId = 0;
    const start = performance.now();

    function animate() {
      const elapsed = (performance.now() - start) / 1000;
      paintingScene.update(elapsed);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const newViewHeight = viewWidth * (height / width || aspect);
      camera.top = newViewHeight / 2;
      camera.bottom = -newViewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", handleResize);

    const detachTapHandler = attachTapHandler(container, () => camera, paintingScene, (screenHit) =>
      onSymbolTapRef.current?.(screenHit)
    );

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      detachTapHandler();
      paintingScene.dispose();
      backgroundTexture.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [artwork, reducedMotion]);

  return <div ref={containerRef} className={className ?? "aspect-[4/5] w-full"} />;
}
