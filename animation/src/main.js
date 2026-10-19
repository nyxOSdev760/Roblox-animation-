// Browser entry: builds the scene named in ?scene= and exposes renderAt(t) for the renderer.
// Opened without the renderer (no ?frame mode), it just plays the animation on a loop.
import * as THREE from 'three';
import { createRenderer, loadTextures } from './world.js';
import { loadRobloxAssets, robloxLighting } from './roblox.js';
import { loadHeadMesh } from './r6.js';

const params = new URLSearchParams(location.search);
const name = params.get('scene') || 'kick';
const scale = Number(params.get('scale') || 1);
const { meta, setup } = await import(`../scenes/${name}.js`);

const width = Math.round(meta.width * scale);
const height = Math.round(meta.height * scale);
const renderer = createRenderer(width, height);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
const [assets, faces] = await Promise.all([
  loadRobloxAssets(renderer),
  loadTextures(Object.fromEntries(meta.faces.map((f) => [f, `/assets/faces/png/${f}.png`]))),
  loadHeadMesh(),
]);
const sun = robloxLighting(scene, renderer, assets);
const update = setup({ scene, camera, renderer, assets, faces, sun });

window.renderAt = (t) => {
  update(t);
  renderer.render(scene, camera);
};
window.sceneMeta = meta;
window.sceneReady = true;

if (!params.has('frame')) {
  const start = performance.now();
  renderer.setAnimationLoop(() => window.renderAt(((performance.now() - start) / 1000) % meta.duration));
}
