import * as THREE from "three";
import type { AnimationBehavior } from "@/lib/types";

const TAU = Math.PI * 2;

export interface SpriteBase {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  phase: number;
}

interface Delta {
  dx: number;
  dy: number;
  rotZ: number;
  rotX: number;
  scaleMul: number;
  opacityMul: number;
}

const IDENTITY: Delta = { dx: 0, dy: 0, rotZ: 0, rotX: 0, scaleMul: 1, opacityMul: 1 };

function deltaFor(behavior: AnimationBehavior, t: number, phase: number): Delta {
  switch (behavior.type) {
    case "still":
      return IDENTITY;

    case "sway": {
      const amp = (behavior.amplitudeDeg * Math.PI) / 180;
      const angle = amp * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return behavior.axis === "x" ? { ...IDENTITY, rotX: angle } : { ...IDENTITY, rotZ: angle };
    }

    case "bob": {
      const dy = behavior.amplitudeMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      const rotZ = 0.05 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return { ...IDENTITY, dy, rotZ };
    }

    case "breathe": {
      const scaleMul = 1 + behavior.scaleAmplitude * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return { ...IDENTITY, scaleMul };
    }

    case "pulse": {
      const wave = 0.5 + 0.5 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return { ...IDENTITY, opacityMul: behavior.minOpacity + (behavior.maxOpacity - behavior.minOpacity) * wave };
    }

    case "drift": {
      const offset = behavior.distanceMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return behavior.axis === "x" ? { ...IDENTITY, dx: offset } : { ...IDENTITY, dy: offset };
    }

    case "swim": {
      const dx = behavior.distanceMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      const wag = (behavior.wagDeg * Math.PI) / 180;
      const rotZ = wag * Math.sin((TAU * t) / (behavior.periodSeconds / 2) + phase);
      return { ...IDENTITY, dx, rotZ };
    }

    case "glowFlicker": {
      const wave = 0.5 + 0.5 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      const jitter = behavior.jitter * (Math.sin((TAU * t * 7.3) / behavior.periodSeconds + phase * 3) * 0.5 + 0.5);
      const opacityMul = THREE.MathUtils.clamp(
        behavior.minOpacity + (behavior.maxOpacity - behavior.minOpacity) * wave + jitter,
        0,
        1.3
      );
      return { ...IDENTITY, opacityMul };
    }
  }
}

/** Applies one or several AnimationBehaviors (combined additively/multiplicatively) to a sprite mesh's transform for a given elapsed time. Called every frame; each call resets to the base transform then perturbs it, so behaviors never accumulate drift. */
export function applySpriteBehavior(
  mesh: THREE.Mesh,
  material: THREE.Material & { opacity: number },
  base: SpriteBase,
  behavior: AnimationBehavior | AnimationBehavior[],
  t: number
) {
  const behaviors = Array.isArray(behavior) ? behavior : [behavior];
  const phase = base.phase * TAU;

  let dx = 0,
    dy = 0,
    rotZ = 0,
    rotX = 0,
    scaleMul = 1,
    opacityMul = 1;

  for (const b of behaviors) {
    const d = deltaFor(b, t, phase);
    dx += d.dx;
    dy += d.dy;
    rotZ += d.rotZ;
    rotX += d.rotX;
    scaleMul *= d.scaleMul;
    opacityMul *= d.opacityMul;
  }

  mesh.position.set(base.position.x + dx, base.position.y + dy, base.position.z);
  mesh.rotation.set(base.rotation.x + rotX, base.rotation.y, base.rotation.z + rotZ);
  mesh.scale.set(base.scale.x * scaleMul, base.scale.y * scaleMul, base.scale.z);
  material.opacity = THREE.MathUtils.clamp(opacityMul, 0, 1);
}
