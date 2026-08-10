export interface ARSupport {
  hasCamera: boolean;
  hasWebGL: boolean;
  supported: boolean;
}

/** Checks the two things MindAR actually needs (getUserMedia + WebGL) — not a WebXR check, since this AR runs entirely on camera + canvas tracking, not the WebXR device API (which iOS Safari doesn't implement at all). */
export function checkARSupport(): ARSupport {
  const hasCamera =
    typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;

  let hasWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    hasWebGL = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    hasWebGL = false;
  }

  return { hasCamera, hasWebGL, supported: hasCamera && hasWebGL };
}
