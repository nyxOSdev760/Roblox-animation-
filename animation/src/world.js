// Shared setup: renderer, texture loading, and small animation helpers.
import * as THREE from 'three';

export function createRenderer(width, height) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function loadTextures(urls) {
  const loader = new THREE.TextureLoader();
  return Promise.all(
    Object.entries(urls).map(async ([name, url]) => {
      const tex = await loader.loadAsync(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return [name, tex];
    }),
  ).then(Object.fromEntries);
}

// Deterministic random numbers, so every render of a scene looks the same.
export function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
/** 0..1 progress of t through [a, b]. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const smooth = (u) => u * u * (3 - 2 * u);
export const easeOut = (u) => 1 - (1 - u) ** 3;
