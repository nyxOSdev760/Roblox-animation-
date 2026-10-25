// Main character candidates for the channel, side by side on a little stage.
//   node render.mjs mainchar --stills 0      lineup (A-D, waving)
//   node render.mjs mainchar --stills 1      expressions of each (happy, shocked, sad, angry)
import * as THREE from 'three';
import { BRICK, SKIN, part } from '../src/roblox.js';
import { Actor, POSES } from '../src/actors.js';
import * as P from '../src/props.js';

// Casual looks, all with the same chill face (dot eyes, small smile).
export const FACE = ['face-eyes-skeptical-lower', 'face-mouth-smirk'];
export const CANDIDATES = {
  A: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-messy-popular-boy', skin: SKIN.lightOrange },
  B: { shirt: 'shirt-vintage-flannel-button-up', pants: 'pants-dark-pants', hair: 'hair-brown-side-sweep', skin: SKIN.pastelBrown },
  C: { shirt: 'shirt-blue-stripe-shirt-neck', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-high-top-fade', skin: SKIN.brown },
  D: { shirt: 'shirt-grey-knitted-sweater-chain', pants: 'pants-white-cargo-jeans-dh', hair: 'hair-black-messy-side-part', skin: SKIN.tan },
};
const FACES = [...FACE, 'face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop', 'face-addon-tears', 'face-addon-anger-mark-big'];

export const meta = {
  duration: 2,
  fps: 30,
  width: 1600,
  height: 900,
  physics: false,
  faces: ['happy', 'grin', 'sad', 'angry'],
  accessories: [...Object.values(CANDIDATES).map((c) => c.hair), ...FACES],
  clothing: Object.values(CANDIDATES).flatMap((c) => [c.shirt, c.pants]),
};

export function setup({ scene, camera, assets, faces, sun }) {
  scene.add(part(assets, [80, 1, 40], [0, -0.5, 0], BRICK.brightGreen, 'Grass', { shadows: false }));
  scene.add(part(assets, [36, 1, 10], [0, 0.5, -2], BRICK.reddishBrown, 'WoodPlanks'));
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
    const s = P.sign(assets, 2.2, 1.6, k, { bg: '#ffd21f', fg: '#1b2a35', size: 150, border: '#1b2a35' });
    s.position.set(-9 + i * 6, 1.9, 0.0);
    scene.add(s);
  });
  const moods = [['happy'], ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop'], ['sad', 'face-addon-tears'], ['angry', 'face-addon-anger-mark-big']];
  const poses = [POSES.cheer, POSES.shocked, POSES.cry, POSES.yell];

  return (t) => {
    const sheet = Math.round(t);
    actors.forEach((a, i) => {
      const pose = sheet === 0 ? POSES.idle(0.3 + i * 0.4) : poses[i](0.5);
      a.set({ at: [-9 + i * 6, -2], y: 1, yaw: sheet === 0 ? 0 : 0, pose, face: sheet === 0 ? FACE : moods[i] });
    });
    camera.fov = 30;
    camera.position.set(0, 6.2, 27);
    camera.lookAt(0, 4.6, -2);
    camera.updateProjectionMatrix();
  };
}
