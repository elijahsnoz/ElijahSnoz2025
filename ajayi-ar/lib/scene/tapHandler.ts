import * as THREE from "three";
import type { PaintingScene, TapHit } from "./buildScene";

export interface ScreenTapHit {
  hit: TapHit;
  screenX: number;
  screenY: number;
}

/**
 * Wires "tap a symbol, see what it means" for a container + camera + scene.
 * Used identically by ARCanvas and DigitalPaintingViewer so the popup
 * behaves the same whether or not the camera feed is behind it.
 */
export function attachTapHandler(
  container: HTMLElement,
  getCamera: () => THREE.Camera,
  scene: PaintingScene,
  onHit: (hit: ScreenTapHit) => void
): () => void {
  const raycaster = new THREE.Raycaster();

  function handlePointerDown(event: PointerEvent) {
    const rect = container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const camera = getCamera();
    raycaster.setFromCamera(ndc, camera);
    const hit = scene.hitTest(raycaster);
    if (!hit) return;

    const projected = hit.point.clone().project(camera);
    const screenX = (projected.x * 0.5 + 0.5) * rect.width;
    const screenY = (1 - (projected.y * 0.5 + 0.5)) * rect.height;
    onHit({ hit, screenX, screenY });
  }

  container.addEventListener("pointerdown", handlePointerDown);
  return () => container.removeEventListener("pointerdown", handlePointerDown);
}
