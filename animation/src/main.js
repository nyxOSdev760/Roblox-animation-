// Browser entry: builds the scene named in ?scene= and exposes renderAt(t) for the renderer.
// Opened without the renderer (no ?frame mode), it just plays the animation on a loop.
import * as THREE from 'three';
import { createRenderer, createWorld, loadTextures } from './world.js';

const params = new URLSearchParams(location.search);
const name = params.get('scene') || 'kick';
const scale = Number(params.get('scale') || 1);
const { meta, setup } = await import(`../scenes/${name}.js`);

const width = Math.round(meta.width * scale);
const height = Math.round(meta.height * scale);
const renderer = createRenderer(width, height);
const { scene } = createWorld();
const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 400);
const faces = await loadTextures(Object.fromEntries(meta.faces.map((f) => [f, `/assets/faces/png/${f}.png`])));
const update = setup({ scene, camera, faces });

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
