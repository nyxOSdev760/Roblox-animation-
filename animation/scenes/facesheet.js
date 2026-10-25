// Every everyday face (decals and UGC face accessories) on one numbered sheet, for picking
// a main character's face.   node render.mjs facesheet --stills 0,1,2,...
import { BRICK, SKIN, part } from '../src/roblox.js';
import { createR6 } from '../src/r6.js';
import * as P from '../src/props.js';

const DECALS = ['neutral', 'happy', 'smirk', 'suspicious', 'grin'];
const UGC = ['face-big-smile', 'face-big-smile-blush', 'face-wink-happy', 'face-kawaii-silly-blush', 'face-rockstar', 'face-big-grin-retro',
  'face-squint-tongue', 'face-derp-silly', 'face-eyes-sleepy', 'face-sleepy', 'face-skeptical-eyes', 'face-eyes-skeptical-lower', 'face-eyes-gyaru-lashes',
  ['face-eyes-skeptical-lower', 'face-mouth-smirk'], ['face-eyes-gyaru-lashes', 'face-mouth-smirk'], ['face-skeptical-eyes', 'face-mouth-slight-frown'], 'face-mouth-smirk'];
const ALL = [...DECALS, ...UGC];
const COLS = 6;

export const meta = {
  duration: 1,
  fps: 30,
  width: 400,
  height: 400,
  physics: false,
  faces: DECALS,
  accessories: [...new Set(UGC.flat())],
};

export function setup({ scene, camera, assets, faces, sun }) {
  scene.fog = null;
  scene.add(part(assets, [60, 40, 1], [12, 0, -3], 0x2b3a55, 'Plastic', { shadows: false }));
  sun.target.position.set(12, -4, 0);
  sun.position.set(22, 30, 40);
  ALL.forEach((f, i) => {
    const x = (i % COLS) * 4.6;
    const y = -Math.floor(i / COLS) * 5.4;
    const ch = createR6({ assets, faces, face: f, colors: { head: SKIN.lightOrange, torso: BRICK.mediumStoneGrey, rArm: SKIN.lightOrange, lArm: SKIN.lightOrange, rLeg: BRICK.darkStoneGrey, lLeg: BRICK.darkStoneGrey } });
    ch.pose({ root: { pos: [x, y, 0], rot: [0, 0, 0] } });
    scene.add(ch.root);
    const s = P.sign(assets, 1.6, 1.0, String(i + 1), { bg: '#ffd21f', fg: '#1b2a35', size: 150 });
    s.position.set(x, y + 0.1, 0.6);
    scene.add(s);
  });
  // Still i is a close-up of face i (numbered on the chest).
  return (t) => {
    const i = Math.min(ALL.length - 1, Math.round(t));
    const x = (i % COLS) * 4.6;
    const y = -Math.floor(i / COLS) * 5.4;
    camera.fov = 30;
    camera.position.set(x, y + 1.3, 5.2);
    camera.lookAt(x, y + 1.1, 0);
    camera.updateProjectionMatrix();
  };
}
