// Main character candidates for the channel, side by side on a little stage.
//   node render.mjs mainchar --stills 0      lineup (A-D, waving)
//   node render.mjs mainchar --stills 1      expressions of each (happy, shocked, sad, angry)
import * as THREE from 'three';
import { BRICK, SKIN, part } from '../src/roblox.js';
import { Actor, POSES } from '../src/actors.js';
import * as P from '../src/props.js';

// Casual male looks, all with the same face (#11 on the face sheet: big eyes, big grin).
export const FACE = 'face-big-grin-retro';
export const CANDIDATES = {
  1: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-messy-popular-boy', skin: SKIN.lightOrange },
  2: { shirt: 'shirt-vintage-flannel-button-up', pants: 'pants-dark-pants', hair: 'hair-brown-side-sweep', skin: SKIN.pastelBrown },
  3: { shirt: 'shirt-black-short-sleeve-tee', pants: 'pants-cargo-pants-grey-black', hair: 'hair-high-top-fade', skin: SKIN.brown },
  4: { shirt: 'shirt-grey-knitted-sweater-chain', pants: 'pants-white-cargo-jeans-dh', hair: 'hair-black-messy-side-part', skin: SKIN.tan },
  5: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-messy-boy-blonde', skin: SKIN.porcelain },
  6: { shirt: 'shirt-sweter-galaxy-blue-100', pants: 'pants-gray-sweatpants', hair: 'hair-360-waves-fade', skin: SKIN.darkOrange },
  7: { shirt: 'shirt-mu-red-flannel-black', pants: 'pants-ripped-black-jeans-mu', hair: 'hair-black-wolf-cut', skin: SKIN.nougat },
  8: { shirt: 'shirt-black-flannel-soft-trendy', pants: 'pants-jeans-stars', hair: 'hair-faded-edgar-cut', skin: SKIN.reddishBrown },
  9: { shirt: 'shirt-school-boy', pants: 'pants-kestrel-khaki-textured-pants', hair: 'hair-brown-messy', skin: SKIN.lightOrange },
  10: { shirt: 'shirt-white-shirt', pants: 'pants-cargo-pants-grey-black-3', hair: 'hair-short-wolf-cut-ginger', skin: SKIN.pastelBrown },
};
const FACES = [FACE, 'face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop', 'face-addon-tears', 'face-addon-anger-mark-big'];

export const meta = {
  duration: 2,
  fps: 30,
  width: 1600,
  height: 1000,
  physics: false,
  faces: ['happy', 'grin', 'sad', 'angry'],
  accessories: [...Object.values(CANDIDATES).map((c) => c.hair), ...FACES],
  clothing: Object.values(CANDIDATES).flatMap((c) => [c.shirt, c.pants]),
};

export function setup({ scene, camera, assets, faces, sun }) {
  scene.add(part(assets, [80, 1, 40], [0, -0.5, 0], BRICK.brightGreen, 'Grass', { shadows: false }));
  scene.add(part(assets, [34, 1, 6], [0, 0.5, 0], BRICK.reddishBrown, 'WoodPlanks'));
  scene.add(part(assets, [36, 5, 6], [0, 2.5, -7], BRICK.reddishBrown, 'WoodPlanks'));
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
    s.position.set(-12 + (i % 5) * 6 + (i < 5 ? 0 : 3), i < 5 ? 1.9 : 5.9, i < 5 ? 1.5 : -3.9);
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
      a.set({ at: [-12 + (i % 5) * 6 + (i < 5 ? 0 : 3), i < 5 ? 0 : -7], y: i < 5 ? 1 : 5, yaw: sheet === 0 ? 0 : 0, pose, face: sheet === 0 ? FACE : mood(i) });
    });
    camera.fov = 30;
    camera.position.set(1.5, 9, 40);
    camera.lookAt(1.5, 5.4, -3.5);
    camera.updateProjectionMatrix();
  };
}
