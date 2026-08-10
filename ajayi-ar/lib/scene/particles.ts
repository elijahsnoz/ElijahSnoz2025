import * as THREE from "three";
import type { LocalRect } from "./coords";
import type { ParticleLayerConfig } from "@/lib/types";

export interface ParticleSystem {
  points: THREE.Points;
  update: (t: number) => void;
}

const glowVertexShader = /* glsl */ `
  attribute float phase;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSize;
  varying float vAlpha;

  void main() {
    vAlpha = 0.5 + 0.5 * sin(uTime * uSpeed + phase * 6.2831853);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const glowFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, edge * vAlpha * uOpacity);
  }
`;

/** Falling (rain) or rising (bubbles) points that wrap within the layer's rect. */
export function createFallingParticles(config: ParticleLayerConfig, local: LocalRect, rising: boolean): ParticleSystem {
  const { count, size, color, opacity, speed } = config;
  const positions = new Float32Array(count * 3);
  const halfWidth = local.width / 2;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = local.centerX + (Math.random() - 0.5) * local.width;
    positions[i * 3 + 1] = THREE.MathUtils.lerp(local.bottom, local.top, Math.random());
    positions[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(...color),
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  const dir = rising ? 1 : -1;

  const update = (_t: number, dt: number) => {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + dir * speed * dt * 0.2;
      if (rising && y > local.top) y = local.bottom;
      if (!rising && y < local.bottom) y = local.top;
      pos.setY(i, y);
      const x = pos.getX(i) + Math.sin(_t * 0.5 + i) * 0.00005;
      pos.setX(i, THREE.MathUtils.clamp(x, local.centerX - halfWidth, local.centerX + halfWidth));
    }
    pos.needsUpdate = true;
  };

  return { points, update: (t: number) => update(t, 1 / 60) };
}

/** Softly flickering static points (stars). */
export function createGlowParticles(config: ParticleLayerConfig, local: LocalRect): ParticleSystem {
  const { count, size, color, opacity, speed } = config;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = local.centerX + (Math.random() - 0.5) * local.width;
    positions[i * 3 + 1] = local.centerY + (Math.random() - 0.5) * local.height;
    positions[i * 3 + 2] = 0;
    phases[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uSize: { value: size * 4000 },
      uColor: { value: new THREE.Color(...color) },
      uOpacity: { value: opacity },
    },
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    update: (t: number) => {
      material.uniforms.uTime.value = t;
    },
  };
}
