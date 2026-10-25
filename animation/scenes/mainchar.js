// Main character candidates for the channel, side by side on a little stage.
//   node render.mjs mainchar --stills 0      lineup (A-D, waving)
//   node render.mjs mainchar --stills 1      expressions of each (happy, shocked, sad, angry)
import * as THREE from 'three';
import { BRICK, SKIN, part } from '../src/roblox.js';
import { Actor, POSES } from '../src/actors.js';
import * as P from '../src/props.js';

// Hair F (big fluffy messy black), a slightly darker skin, white cargo pants, different shirts.
export const FACE = 'suspicious';
const LOOK = { pants: 'pants-white-cargo-jeans-dh', hair: 'hair-fluffy-messy-black', skin: SKIN.lightOrange };
export const CANDIDATES = Object.fromEntries(
  ['shirt-black-short-sleeve-tee', 'shirt-black-flannel-soft-trendy', 'shirt-vintage-flannel-button-up', 'shirt-mu-red-flannel-black',
    'shirt-tech-fleece-red-hoodie', 'shirt-sweter-galaxy-blue-100']
    .map((shirt, i) => [String.fromCharCode(65 + i), { ...LOOK, shirt }]),
);
const FACES = ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop', 'face-addon-tears', 'face-addon-anger-mark-big'];

export const meta = {
  duration: 2,
  fps: 30,
  width: 1600,
  height: 800,
  physics: false,
  faces: ['happy', 'grin', 'sad', 'angry', 'suspicious'],
  accessories: [...Object.values(CANDIDATES).map((c) => c.hair), ...FACES.filter((f) => f.startsWith('face-'))],
  clothing: [...new Set(Object.values(CANDIDATES).flatMap((c) => [c.shirt, c.pants]))],
};

export function setup({ scene, camera, assets, faces, sun }) {
  scene.add(part(assets, [80, 1, 40], [0, -0.5, 0], BRICK.brightGreen, 'Grass', { shadows: false }));
  scene.add(part(assets, [34, 1, 6], [0, 0.5, 0], BRICK.reddishBrown, 'WoodPlanks'));
  sun.target.position.set(0, 0, 0);
  sun.position.set(20, 50, 40);
  const keys = Object.keys(CANDIDATES);
  const actors = keys.map((k) => {
    const c = CANDIDATES[k];
    return new Actor({ assets, faces, face: 'happy', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  });
  for (const a of actors) scene.add(a.root);
  keys.forEach((k, i) => {
    const s = P.sign(assets, 2.2, 1.4, k, { bg: '#ffd21f', fg: '#1b2a35', size: 150, border: '#1b2a35' });
    s.position.set(-12.5 + i * 5, 1.9, 1.5);
    scene.add(s);
  });
  const moods = [['happy'], ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop'], ['sad', 'face-addon-tears'], ['angry', 'face-addon-anger-mark-big']];
  const poses = [POSES.cheer, POSES.shocked, POSES.cry, POSES.yell];
  const mood = (i) => moods[i % moods.length];
  const act = (i) => poses[i % poses.length];

  return (t) => {
    const sheet = Math.round(t);
    actors.forEach((a, i) => {
      const pose = sheet === 0 ? POSES.idle(0.3 + i * 0.4) : act(i)(0.5);
      a.set({ at: [-12.5 + i * 5, 0], y: 1, yaw: sheet === 0 ? 0 : 0, pose, face: sheet === 0 ? FACE : mood(i) });
    });
    camera.fov = 30;
    camera.position.set(0, 6.0, 29);
    camera.lookAt(0, 4.4, -1);
    camera.updateProjectionMatrix();
  };
}
