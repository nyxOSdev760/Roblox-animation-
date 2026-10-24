// Browser entry: builds the scene named in ?scene= and exposes renderAt(t) for the renderer.
// Opened without the renderer (no ?frame mode), it just plays the animation on a loop.
import * as THREE from 'three';
import { createRenderer, loadTextures } from './world.js';
import { loadRobloxAssets, robloxLighting } from './roblox.js';
import { loadHeadMesh } from './r6.js';
import { loadAccessories } from './accessories.js';
import { loadClothing } from './clothing.js';
import { ACTORS } from './actors.js';
import { createPhysics } from './physics.js';

const params = new URLSearchParams(location.search);
const name = params.get('scene') || 'kick';
const scale = Number(params.get('scale') || 1);
const { meta, setup } = await import(`../scenes/${name}.js`);

// Roblox's fonts: Fredoka One for signs and screens, Montserrat Black for captions.
await Promise.all(
  [
    ['Fredoka One', 'FredokaOne-Regular.ttf'],
    ['Montserrat Black', 'Montserrat-Black.ttf'],
  ].map(async ([family, file]) => {
    const f = new FontFace(family, `url(/animation/assets/fonts/${file})`);
    document.fonts.add(await f.load());
  }),
);

const width = Math.round(meta.width * scale);
const height = Math.round(meta.height * scale);
const renderer = createRenderer(width, height);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
const [assets, faces] = await Promise.all([
  loadRobloxAssets(renderer),
  loadTextures(Object.fromEntries((meta.faces ?? []).map((f) => [f, `/assets/faces/png/${f}.png`]))),
  loadHeadMesh(),
  loadAccessories(meta.accessories ?? []),
  loadClothing(meta.clothing ?? []),
]);
const sun = robloxLighting(scene, renderer, assets);
const update = setup({ scene, camera, renderer, assets, faces, sun });

// Physics (collisions, follow-through) for scenes with characters; meta.physics = false skips it.
const physics = ACTORS.length && meta.physics !== false && params.get('physics') !== '0' ? createPhysics(scene, ACTORS, { fps: meta.fps }) : null;

window.renderAt = (t) => {
  if (physics) physics.frame(update, t);
  else update(t);
  renderer.render(scene, camera);
};
window.sceneMeta = meta;
window.physics = physics;
window.sceneReady = true;

if (!params.has('frame')) {
  const start = performance.now();
  renderer.setAnimationLoop(() => window.renderAt(((performance.now() - start) / 1000) % meta.duration));
}
