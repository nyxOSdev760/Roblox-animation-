// Every pose in POSES on the main character, for checking the rig (R15 elbows, knees, waist).
//   node render.mjs posesheet --stills 0,1,2,3,4,5   pages of poses (front three-quarter view)
//   node render.mjs posesheet --stills 6,7           rest pose close-ups, front and back
import { BRICK, part } from '../src/roblox.js';
import { Actor, POSES } from '../src/actors.js';
import { MAIN } from '../src/cast.js';
import * as P from '../src/props.js';

const NAMES = Object.keys(POSES);
const PER = 6;
const PAGES = Math.ceil(NAMES.length / PER);

export const meta = {
  duration: PAGES + 2,
  fps: 30,
  width: 1800,
  height: 900,
  physics: false,
  faces: ['suspicious'],
  accessories: [MAIN.hair],
  clothing: [MAIN.shirt, MAIN.pants],
};

export function setup({ scene, camera, assets, faces, sun }) {
  scene.add(part(assets, [120, 1, 60], [0, -0.5, 0], BRICK.brightGreen, 'Grass', { shadows: false }));
  sun.target.position.set(0, 0, 0);
  sun.position.set(20, 50, 40);
  const skin = MAIN.skin;
  const actors = Array.from({ length: PER }, () => {
    const a = new Actor({ assets, faces, face: MAIN.face, shirt: MAIN.shirt, pants: MAIN.pants, accessories: [MAIN.hair],
      colors: { head: skin, torso: skin, rArm: skin, lArm: skin, rLeg: skin, lLeg: skin } });
    scene.add(a.root);
    return a;
  });
  const signCache = new Map();
  const sign = (name) => {
    if (!signCache.has(name)) {
      const s = P.sign(assets, 3.4, 0.8, name, { bg: '#ffd21f', fg: '#1b2a35', size: 150, border: '#1b2a35' });
      scene.add(s);
      signCache.set(name, s);
    }
    return signCache.get(name);
  };

  return (t) => {
    const page = Math.floor(t);
    for (const s of signCache.values()) s.visible = false;
    if (page < PAGES) {
      actors.forEach((a, i) => {
        const name = NAMES[page * PER + i];
        if (!name) return a.hide();
        const x = -12.5 + i * 5;
        a.set({ at: [x, 0], yaw: 20, pose: POSES[name](0.4 + i * 0.13), face: MAIN.face });
        const s = sign(name);
        s.visible = true;
        s.position.set(x, 0.45, 2.6);
      });
      camera.fov = 30;
      camera.position.set(0, 5.5, 31);
      camera.lookAt(0, 2.4, 0);
    } else {
      const back = page > PAGES;
      actors.forEach((a, i) => (i < 3 ? a.set({ at: [-4 + i * 4, 0], yaw: (back ? 180 : 0) + (i - 1) * 35, pose: POSES.idle(0), face: MAIN.face }) : a.hide()));
      camera.fov = 30;
      camera.position.set(0, 4.5, 17);
      camera.lookAt(0, 2.9, 0);
    }
    camera.updateProjectionMatrix();
  };
}
