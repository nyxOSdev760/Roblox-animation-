// Lighting check: the sets and the main character under the realistic lighting (post.js,
// lighting.js). One shot per second:
//   0  classroom, sun through the windows      1  medium shot at a desk
//   2  bedroom at night (lamp, monitor, LEDs)   3  school front, afternoon
//   4  hallway                                  5  classroom with the sun behind the building
//   6  the window wall: sun patches and shafts
//   node render.mjs lighttest --scale 0.5 --stills 0,1,2,3,4,5
//   node render.mjs lighttest --scale 0.5 --stills 0,1 --no-post    (compare without post)
import * as THREE from 'three';
import { SKIN } from '../src/roblox.js';
import { buildClassroom, buildBedroom, buildSchoolFront } from '../src/rooms.js';
import { Actor, POSES } from '../src/actors.js';
import { MAIN } from '../src/cast.js';
import { lightingMood } from '../src/lighting.js';

const C = new THREE.Vector3(0, 0, 0);
const B = new THREE.Vector3(0, 0, 400);
const F = new THREE.Vector3(600, 0, 0);
const DESKS = [[-9, -4], [-3, -4], [3, -4], [9, -4], [-9, 4], [-3, 4], [3, 4], [9, 4]];
const SEAT_DZ = 1.05;
const KIDS = [
  { shirt: 'shirt-black-flannel-soft-trendy', pants: 'pants-white-cargo-jeans-dh', hair: 'hair-fluffy-messy-black', skin: SKIN.brown },
  { shirt: 'shirt-vintage-flannel-button-up', pants: 'pants-white-cargo-jeans-dh', hair: 'hair-fluffy-messy-black', skin: SKIN.porcelain },
  { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-white-cargo-jeans-dh', hair: 'hair-fluffy-messy-black', skin: SKIN.tan },
];

export const meta = {
  duration: 7,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['suspicious', 'happy'],
  accessories: [MAIN.hair],
  clothing: [...new Set([MAIN.shirt, MAIN.pants, ...KIDS.flatMap((k) => [k.shirt, k.pants])])],
};

const SHOTS = [
  // [place, camera position, look at, fov, sun offset from the place, mood]
  [C, [14, 9, 13], [-4, 2.5, -4], 52, [-70, 45, 18], 'interior'],
  [C, [-1.2, 4.6, 13.5], [-3, 3.6, 5], 40, [-70, 45, 18], 'interior'],
  [B, [6, 6.5, 8], [-1, 3, -5], 55, [30, 60, 40], 'night'],
  [F, [14, 8, 30], [0, 4, -4], 50, [30, 60, 40], 'day'],
  [C, [25.2, 5.5, 26], [25.2, 4, -6], 50, [30, 60, 40], 'interior'],
  [C, [14, 9, 13], [-4, 2.5, -4], 52, [30, 60, 40], 'day'],
  [C, [4, 10, 12], [-12, 1, 0], 60, [-70, 45, 18], 'interior'],
];

export function setup({ scene, camera, assets, faces, sun }) {
  buildClassroom(scene, assets, C, { desks: DESKS, seatDz: SEAT_DZ });
  const room = buildBedroom(scene, assets, B);
  buildSchoolFront(scene, assets, F);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -40;
  sc.right = sc.top = 40;
  sc.updateProjectionMatrix();

  const mk = (c) => {
    const a = new Actor({ assets, faces, face: MAIN.face, shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
    scene.add(a.root);
    return a;
  };
  const me = mk(MAIN);
  const kids = DESKS.slice(1).map((_, i) => mk(KIDS[i % KIDS.length]));

  const seated = (t, s) => {
    const p = POSES.sit();
    p.lift = 1.75 - 2;
    p.neck = POSES.idle(t, s).neck;
    p.rArm = [-55, 0, 6];
    p.lArm = [-55, 0, -6];
    p.rElbow = [-30, 0, 0];
    p.lElbow = [-30, 0, 0];
    return p;
  };

  return (t) => {
    const [o, cam, look, fov, sunOff, mood] = SHOTS[Math.min(SHOTS.length - 1, Math.floor(t))];
    const night = mood === 'night';
    lightingMood(scene, sun, mood);
    for (const l of room.lights) l.visible = night;
    sun.target.position.copy(o);
    sun.position.set(o.x + sunOff[0], sunOff[1], o.z + sunOff[2]);

    if (o === C) {
      me.set({ at: [C.x + DESKS[0][0], C.z + DESKS[0][1] + SEAT_DZ], pose: seated(t, 0), yaw: 180, face: MAIN.face });
      kids.forEach((k, i) => k.set({ at: [C.x + DESKS[i + 1][0], C.z + DESKS[i + 1][1] + SEAT_DZ], pose: seated(t, i + 1), yaw: 180, face: 'happy' }));
      if (t >= 4 && t < 5) {
        me.set({ at: [C.x + 25.2, C.z + 4], pose: POSES.walk(t), yaw: 180, face: MAIN.face });
        kids[0].set({ at: [C.x + 23.8, C.z + 9], pose: POSES.talk(t), yaw: 160, face: 'happy' });
      }
    } else if (o === B) {
      me.set({ at: [B.x + 2, B.z - 2], pose: POSES.idle(t), yaw: 20, face: MAIN.face });
      kids.forEach((k) => k.hide());
    } else {
      me.set({ at: [F.x - 1.5, F.z + 3], pose: POSES.walk(t), yaw: 90, face: MAIN.face });
      kids.forEach((k, i) => (i < 3 ? k.set({ at: [F.x + 4 + i * 2.5, F.z + 1 + (i % 2) * 2], pose: POSES.talk(t, i), yaw: -100, face: 'happy' }) : k.hide()));
    }
    camera.fov = fov;
    camera.position.set(o.x + cam[0], cam[1], o.z + cam[2]);
    camera.lookAt(o.x + look[0], look[1], o.z + look[2]);
    camera.updateProjectionMatrix();
  };
}
