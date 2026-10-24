// Clothing check: every shirt/pants pair from ?items= (shirt|pants,shirt|pants,...) on its own
// character. Still t = 2i shows pair i from the front, t = 2i + 1 from the back.
import { createR6 } from '../src/r6.js';
import { BRICK } from '../src/roblox.js';

const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const pairs = (query.get('items') || '').split(',').filter(Boolean).map((p) => p.split('|'));

export const meta = {
  duration: 1,
  fps: 30,
  width: 600,
  height: 600,
  faces: ['neutral'],
  clothing: [...new Set(pairs.flat().filter(Boolean))],
};

const SPACING = 8;

export function setup({ scene, camera, assets, faces }) {
  pairs.forEach(([shirt, pants], i) => {
    const skin = BRICK.brightYellow;
    const ch = createR6({ assets, faces, face: 'neutral', shirt: shirt || undefined, pants: pants || undefined, colors: { head: skin, torso: skin, rArm: skin, lArm: skin, rLeg: skin, lLeg: skin } });
    ch.pose({ root: { pos: [i * SPACING, 3, 0], rot: [0, 0, 0] }, rArm: [0, 0, -8], lArm: [0, 0, 8] });
    scene.add(ch.root);
  });
  scene.fog = null;
  return (t) => {
    const i = Math.floor(Math.round(t) / 2);
    const back = Math.round(t) % 2 === 1;
    camera.fov = 30;
    camera.position.set(i * SPACING + (back ? -2.5 : 2.5), 4, back ? -10.5 : 10.5);
    camera.lookAt(i * SPACING, 2.6, 0);
    camera.updateProjectionMatrix();
  };
}
