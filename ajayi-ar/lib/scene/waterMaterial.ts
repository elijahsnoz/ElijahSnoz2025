import * as THREE from "three";
import type { WaterLayerConfig } from "@/lib/types";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 10.0 + uTime * uSpeed) * uAmplitude
               + sin(pos.y * 6.0 - uTime * uSpeed * 0.7) * uAmplitude * 0.6;
    pos.x += wave * 0.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uShimmerOpacity;
  varying vec2 vUv;

  void main() {
    float band = sin(vUv.y * 14.0 - uTime * uSpeed * 1.6) * 0.5 + 0.5;
    float shimmer = smoothstep(0.75, 1.0, band) * uShimmerOpacity;
    vec3 color = uColor + shimmer * 0.35;
    float edgeFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x);
    gl_FragColor = vec4(color, 0.92 * edgeFade + 0.08);
  }
`;

export function createWaterMaterial(config: WaterLayerConfig): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: config.waveAmplitude },
      uSpeed: { value: config.waveSpeed },
      uColor: { value: new THREE.Color(...config.color) },
      uShimmerOpacity: { value: config.shimmerOpacity },
    },
  });
}

export function updateWaterMaterial(material: THREE.ShaderMaterial, t: number) {
  material.uniforms.uTime.value = t;
}
