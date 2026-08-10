import * as THREE from "three";
import type { AnimationBehavior } from "@/lib/types";

const TAU = Math.PI * 2;

export interface SpriteBase {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  phase: number;
}

/** Applies one AnimationBehavior to a sprite mesh's transform for a given elapsed time. Called every frame; each call resets to the base transform then perturbs it, so behaviors never accumulate drift. */
export function applySpriteBehavior(
  mesh: THREE.Mesh,
  material: THREE.Material & { opacity: number },
  base: SpriteBase,
  behavior: AnimationBehavior,
  t: number
) {
  mesh.position.copy(base.position);
  mesh.rotation.copy(base.rotation);
  mesh.scale.copy(base.scale);
  material.opacity = 1;

  const phase = base.phase * TAU;

  switch (behavior.type) {
    case "still":
      return;

    case "sway": {
      const amp = (behavior.amplitudeDeg * Math.PI) / 180;
      const angle = amp * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      if (behavior.axis === "x") mesh.rotation.x = base.rotation.x + angle;
      else mesh.rotation.z = base.rotation.z + angle;
      return;
    }

    case "bob": {
      mesh.position.y = base.position.y + behavior.amplitudeMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      mesh.rotation.z = base.rotation.z + 0.03 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      return;
    }

    case "breathe": {
      const s = 1 + behavior.scaleAmplitude * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      mesh.scale.set(base.scale.x * s, base.scale.y * s, base.scale.z);
      return;
    }

    case "pulse": {
      const wave = 0.5 + 0.5 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      material.opacity = behavior.minOpacity + (behavior.maxOpacity - behavior.minOpacity) * wave;
      return;
    }

    case "drift": {
      const offset = behavior.distanceMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      if (behavior.axis === "x") mesh.position.x = base.position.x + offset;
      else mesh.position.y = base.position.y + offset;
      return;
    }

    case "swim": {
      mesh.position.x = base.position.x + behavior.distanceMeters * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      const wag = (behavior.wagDeg * Math.PI) / 180;
      mesh.rotation.z = base.rotation.z + wag * Math.sin((TAU * t) / (behavior.periodSeconds / 2) + phase);
      return;
    }

    case "glowFlicker": {
      const wave = 0.5 + 0.5 * Math.sin((TAU * t) / behavior.periodSeconds + phase);
      const jitter = behavior.jitter * (Math.sin((TAU * t * 7.3) / behavior.periodSeconds + phase * 3) * 0.5 + 0.5);
      material.opacity = THREE.MathUtils.clamp(
        behavior.minOpacity + (behavior.maxOpacity - behavior.minOpacity) * wave + jitter,
        0,
        1
      );
      return;
    }
  }
}
