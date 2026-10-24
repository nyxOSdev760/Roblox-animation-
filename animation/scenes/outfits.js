// Lineup for checking classic clothing: t = 0 front, 1 back, 2 the character's left side.
import { createR6 } from '../src/r6.js';
import { BRICK, SKIN } from '../src/roblox.js';
import { buildTown } from '../src/town.js';

const CAST = [
  { shirt: 'shirt-black-short-sleeve-tee', pants: 'pants-jeans-stars', hair: 'hair-messy-popular-boy', skin: SKIN.pastelBrown },
  { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-pink-trendy-girls-casual', hair: 'hair-long-brunette', skin: SKIN.lightOrange },
  { shirt: 'shirt-suit-tv-host', pants: 'pants-suit-tv-host', hair: 'hair-black-middle-part', skin: SKIN.nougat },
  { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-business-comb-over', skin: SKIN.porcelain },
  { shirt: 'shirt-lunch-lady', pants: 'pants-lunch-lady', hair: 'hair-black-messy-buns', skin: SKIN.brown },
  { shirt: 'shirt-mail-carrier', pants: 'pants-mail-shorts', hair: 'hair-messy-boy-black-2', skin: SKIN.tan },
  { shirt: 'shirt-doctor', pants: 'pants-scrubs', hair: 'hair-grandpa-gray', skin: SKIN.lightOrange },
  { shirt: 'shirt-grad-gown', pants: 'pants-grad-gown', hair: 'hair-messy-boy-black', skin: SKIN.reddishBrown },
  { shirt: 'shirt-gotcha-crew', pants: 'pants-ripped-black-jeans-mu', hair: 'hair-high-top-fade', skin: SKIN.deep },
];

export const meta = {
  duration: 3,
  fps: 30,
  width: 1920,
  height: 1080,
  faces: ['neutral'],
  accessories: CAST.map((c) => c.hair),
  clothing: CAST.flatMap((c) => [c.shirt, c.pants]),
};

export function setup({ scene, camera, assets, faces }) {
  buildTown(scene, assets);
  const people = CAST.map((c, i) => {
    const p = createR6({
      assets,
      faces,
      face: 'neutral',
      shirt: c.shirt,
      pants: c.pants,
      accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin },
    });
    scene.add(p.root);
    return p;
  });
  return (t) => {
    const yaw = [0, 180, 90][Math.round(t)] ?? 0;
    people.forEach((p, i) => p.pose({ root: { pos: [(i - 4) * 3.2, 3, 0], rot: [0, yaw, 0] }, rArm: [0, 0, -6], lArm: [0, 0, 6] }));
    camera.fov = 40;
    camera.position.set(0, 4, 21);
    camera.lookAt(0, 2.9, 0);
    camera.updateProjectionMatrix();
  };
}
