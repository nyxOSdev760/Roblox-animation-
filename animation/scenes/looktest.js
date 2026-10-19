// Still frames for checking the Roblox look: characters standing on the street.
import { createR6, cap, clothingTexture } from '../src/r6.js';
import { BRICK } from '../src/roblox.js';
import { buildTown } from '../src/town.js';

export const meta = {
  duration: 3,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['happy', 'troll', 'crying'],
  audio: [],
};

export function setup({ scene, camera, assets, faces }) {
  buildTown(scene, assets);
  const noob = createR6({
    assets,
    faces,
    face: 'happy',
    colors: { head: BRICK.brightYellow, torso: BRICK.brightBlue, rArm: BRICK.brightYellow, lArm: BRICK.brightYellow, rLeg: BRICK.brYellowishGreen, lLeg: BRICK.brYellowishGreen },
  });
  const hoodie = clothingTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1b2a35';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#26394a';
    ctx.fillRect(w * 0.22, h * 0.62, w * 0.56, h * 0.3);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(w * 0.4, 0, w * 0.04, h * 0.3);
    ctx.fillRect(w * 0.56, 0, w * 0.04, h * 0.3);
  });
  const bully = createR6({
    assets,
    faces,
    face: 'troll',
    shirtFront: hoodie,
    accessories: cap(BRICK.brightRed),
    colors: { head: BRICK.nougat, torso: BRICK.black, rArm: BRICK.black, lArm: BRICK.black, rLeg: BRICK.darkStoneGrey, lLeg: BRICK.darkStoneGrey },
  });
  scene.add(noob.root, bully.root);

  return (t) => {
    noob.pose({ root: { pos: [1, 3, 0], rot: [0, 70 - 60 * (t / 3), 0] }, rArm: [0, 0, -160], neck: [0, -40, 0] });
    bully.pose({ root: { pos: [-2.5, 3, -0.5], rot: [10, 90, 0] }, rArm: [-80, 0, 0], lArm: [-80, 0, 0], rLeg: [30, 0, 0], lLeg: [-25, 0, 0] });
    camera.position.set(0, 3.4, 8.5);
    camera.lookAt(-0.3, 3.0, 0);
  };
}
