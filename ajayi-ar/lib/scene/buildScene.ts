import * as THREE from "three";
import type { ArtworkConfig, AnimationBehavior } from "@/lib/types";
import { paintingAspect, rectToLocal, phaseFromId } from "./coords";
import { applySpriteBehavior, type SpriteBase } from "./behaviors";
import { createWaterMaterial, updateWaterMaterial } from "./waterMaterial";
import { createFallingParticles, createGlowParticles, type ParticleSystem } from "./particles";

export interface TapHit {
  label: string;
  meaning: string;
  point: THREE.Vector3;
}

export interface PaintingScene {
  group: THREE.Group;
  /** t is seconds elapsed since the scene started (or since it was detected, in AR mode). */
  update: (t: number) => void;
  /** Raycaster must already have `.setFromCamera(ndc, camera)` called. Returns the nearest tappable element under it, if any. */
  hitTest: (raycaster: THREE.Raycaster) => TapHit | null;
  dispose: () => void;
}

interface SpriteEntry {
  mesh: THREE.Mesh;
  material: THREE.Material & { opacity: number };
  base: SpriteBase;
  behavior: AnimationBehavior | AnimationBehavior[];
}

interface Tappable {
  mesh: THREE.Object3D;
  label: string;
  meaning: string;
}

/**
 * Builds one three.js Group from an ArtworkConfig's layers. Used identically
 * by AR mode (as a child of MindAR's anchor.group) and Digital mode (as a
 * child of a plain camera-less scene) — this function is the single place
 * that knows how a "living painting" is put together.
 */
export function buildPaintingScene(
  config: ArtworkConfig,
  textureLoader: THREE.TextureLoader,
  reducedMotion: boolean
): PaintingScene {
  const group = new THREE.Group();
  const aspect = paintingAspect(config.image.width, config.image.height);

  const sprites: SpriteEntry[] = [];
  const waterMaterials: THREE.ShaderMaterial[] = [];
  const particleSystems: ParticleSystem[] = [];
  const loadedTextures: THREE.Texture[] = [];
  const tappables: Tappable[] = [];

  for (const layer of config.layers) {
    const local = rectToLocal(layer.rect, aspect);
    const depth = layer.depth ?? 0.005;

    if (layer.kind === "sprite") {
      const texture = textureLoader.load(layer.asset);
      texture.colorSpace = THREE.SRGBColorSpace;
      loadedTextures.push(texture);

      const geometry = new THREE.PlaneGeometry(local.width, local.height);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(local.centerX, local.centerY, depth);
      mesh.renderOrder = Math.round(depth * 1000);

      const base: SpriteBase = {
        position: mesh.position.clone(),
        rotation: mesh.rotation.clone(),
        scale: mesh.scale.clone(),
        phase: phaseFromId(layer.id),
      };

      const behavior: AnimationBehavior | AnimationBehavior[] = reducedMotion
        ? layer.reducedMotion ?? { type: "still" }
        : layer.animation;

      sprites.push({ mesh, material, base, behavior });
      group.add(mesh);
      if (layer.meaning) tappables.push({ mesh, label: layer.label, meaning: layer.meaning });
      continue;
    }

    if (layer.kind === "water") {
      const geometry = new THREE.PlaneGeometry(local.width, local.height, 24, 24);
      const material = createWaterMaterial(layer);
      if (reducedMotion) material.uniforms.uAmplitude.value = 0;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(local.centerX, local.centerY, depth);
      mesh.renderOrder = Math.round(depth * 1000);
      waterMaterials.push(material);
      group.add(mesh);
      if (layer.meaning) tappables.push({ mesh, label: layer.label, meaning: layer.meaning });
      continue;
    }

    // particle layers
    const isRising = layer.kind === "particles-bubbles";
    const system =
      layer.kind === "particles-glow"
        ? createGlowParticles(layer, local)
        : createFallingParticles(layer, local, isRising);
    system.points.position.z = depth;
    system.points.renderOrder = Math.round(depth * 1000);
    if (!reducedMotion) particleSystems.push(system);
    group.add(system.points);
  }

  function update(t: number) {
    for (const sprite of sprites) {
      applySpriteBehavior(sprite.mesh, sprite.material, sprite.base, sprite.behavior, t);
    }
    for (const material of waterMaterials) {
      updateWaterMaterial(material, t);
    }
    for (const system of particleSystems) {
      system.update(t);
    }
  }

  function hitTest(raycaster: THREE.Raycaster): TapHit | null {
    const meshes = tappables.map((t) => t.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    const hit = hits[0];
    const tappable = tappables.find((t) => t.mesh === hit.object);
    if (!tappable) return null;
    return { label: tappable.label, meaning: tappable.meaning, point: hit.point };
  }

  function dispose() {
    for (const texture of loadedTextures) texture.dispose();
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }

  return { group, update, hitTest, dispose };
}
