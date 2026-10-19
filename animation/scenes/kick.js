// "Kicked": the noob waves at the camera, a troll sneaks up and kicks him across the
// street, laughs, and the noob sits up and bawls.
//
// Character motion is keyframed in SCENE time; a 3-frame hit-stop freezes scene time at
// the moment of the kick while the camera keeps moving (real time).
import * as THREE from 'three';
import { createR6, cap, clothingTexture } from '../src/r6.js';
import { BRICK } from '../src/roblox.js';
import { buildTown } from '../src/town.js';
import { k, sample, ease } from '../src/anim.js';
import { seg, lerp } from '../src/world.js';

export const meta = {
  duration: 5.5,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['happy', 'crying', 'troll'],
  // Real-time sound cues: file in assets/sfx or a synthesized effect.
  audio: [
    { file: 'hi-rblx-se.mp3', at: 0.2, volume: 1.0 },
    { synth: 'whoosh', at: 1.47, volume: 0.8 },
    { synth: 'punch', at: 1.57, volume: 1.0 },
    { file: 'work-at-a-pizza-place-scream.mp3', at: 1.6, volume: 0.95 },
    { synth: 'thud', at: 2.5, volume: 0.9 },
    { file: 'hahaha-rblx-se.mp3', at: 2.64, volume: 1.0 },
    { file: 'roblox-crying-work-at-pizza-place.mp3', at: 3.32, volume: 1.0 },
  ],
};

// ---- timing ------------------------------------------------------------------------------
const CONTACT = 1.57; // the kick lands (scene and real time)
const FREEZE = 0.1; // hit-stop length (3 frames)
const LAND = 2.4; // noob hits the ground (scene time)
const SIT = 3.05; // noob starts sitting up (scene time)
const SHOT_LAUGH = 2.62; // cut to the troll laughing (real time)
const SHOT_CRY = 3.15; // cut back to the noob (real time)

const sceneTime = (t) => (t < CONTACT ? t : t < CONTACT + FREEZE ? CONTACT : t - FREEZE);

// ---- staging (studs; sidewalk top is y = 0, camera looks toward -z) ----------------------
const NOOB = new THREE.Vector3(1.5, 3, 0.4);
const LAND_AT = new THREE.Vector3(9.2, 0.5, 1.1); // lying face-down: torso centre 0.5 up
const TROLL_START_X = -7.6;
const TROLL_X = -1.4;
const TROLL_Z = -0.1;

const TAU = Math.PI * 2;
const wave = (t, hz, phase = 0) => Math.sin(TAU * hz * t + phase);

// ---- the noob ------------------------------------------------------------------------------
const noobKeys = {
  yaw: [k(0, 12), k(CONTACT, 12, 'Quad', 'Out'), k(CONTACT + 0.25, 90), k(SIT, 90, 'Back', 'Out'), k(SIT + 0.35, 32)],
  // + = tip forward. Whiplash back on contact, then one and a quarter forward flips into a
  // face-down landing; small bounce; then sit up leaning back.
  pitch: [
    k(0, 0),
    k(CONTACT, 0, 'Quad', 'Out'),
    k(CONTACT + 0.06, -28, 'Quad', 'Out'),
    k(LAND, 450, 'Sine', 'Out'),
    k(LAND + 0.1, 438, 'Sine', 'In'),
    k(LAND + 0.2, 450),
    k(SIT, 450, 'Back', 'Out'),
    k(SIT + 0.35, 352),
  ],
  neck: [
    k(0, [4, -6, -8]),
    k(CONTACT, [4, -6, -8], 'Quad', 'Out'),
    k(CONTACT + 0.06, [-35, 0, 0]),
    k(LAND, [0, 0, 0]),
    k(SIT, [0, 0, 0], 'Back', 'Out'),
    k(SIT + 0.35, [-14, 0, 0]),
  ],
  rArm: [
    k(0, [0, 0, -5]),
    k(CONTACT, [0, 0, -5], 'Quad', 'Out'),
    k(CONTACT + 0.06, [75, 0, -35]),
    k(LAND - 0.15, [-60, 0, -40], 'Quad', 'Out'),
    k(LAND, [-172, 0, -8]),
    k(SIT, [-172, 0, -8], 'Back', 'Out'),
    k(SIT + 0.35, [-8, 0, -14]),
  ],
  lArm: [
    k(0, [-168, 0, 14]),
    k(CONTACT, [-168, 0, 14], 'Quad', 'Out'),
    k(CONTACT + 0.06, [75, 0, 35]),
    k(LAND - 0.15, [-60, 0, 40], 'Quad', 'Out'),
    k(LAND, [-172, 0, 8]),
    k(SIT, [-172, 0, 8], 'Back', 'Out'),
    k(SIT + 0.35, [-8, 0, 14]),
  ],
  rLeg: [
    k(0, [0, 0, 0]),
    k(CONTACT, [0, 0, 0], 'Quad', 'Out'),
    k(CONTACT + 0.06, [-35, 0, 0]),
    k(LAND, [0, 0, -6]),
    k(SIT, [0, 0, -6], 'Back', 'Out'),
    k(SIT + 0.35, [-82, 0, -8]),
  ],
  lLeg: [
    k(0, [0, 0, 0]),
    k(CONTACT, [0, 0, 0], 'Quad', 'Out'),
    k(CONTACT + 0.06, [-25, 0, 0]),
    k(LAND, [0, 0, 6]),
    k(SIT, [0, 0, 6], 'Back', 'Out'),
    k(SIT + 0.35, [-82, 0, 8]),
  ],
};

function noobPose(st) {
  const p = {
    root: { pos: NOOB.toArray(), rot: [sample(noobKeys.pitch, st), sample(noobKeys.yaw, st), 0] },
    neck: [...sample(noobKeys.neck, st)],
    rArm: [...sample(noobKeys.rArm, st)],
    lArm: [...sample(noobKeys.lArm, st)],
    rLeg: [...sample(noobKeys.rLeg, st)],
    lLeg: [...sample(noobKeys.lLeg, st)],
  };

  if (st < CONTACT) {
    // Waving hello: the raised arm rocks side to side, the body bounces a little.
    p.lArm[2] += 22 * wave(st, 2.4);
    p.root.pos[1] += 0.05 * Math.abs(wave(st, 1.2));
    p.neck[2] += 4 * wave(st, 1.2);
  } else if (st < LAND) {
    // Flung: ballistic arc, flailing limbs.
    const u = (st - CONTACT) / (LAND - CONTACT);
    p.root.pos = [
      lerp(NOOB.x, LAND_AT.x, 1 - (1 - u) ** 1.6),
      lerp(NOOB.y, LAND_AT.y, u) + 4 * 2.8 * u * (1 - u),
      lerp(NOOB.z, LAND_AT.z, u),
    ];
    const f = Math.min(1, (st - CONTACT) / 0.12) * (1 - ease('Quad', 'In', u) * 0.5);
    p.root.rot[2] = 14 * wave(st, 2.1);
    p.rArm[0] += 60 * f * wave(st, 3.4);
    p.lArm[0] -= 60 * f * wave(st, 3.4, 0.6);
    p.rLeg[0] += 40 * f * wave(st, 3.8);
    p.lLeg[0] -= 40 * f * wave(st, 3.8);
    p.neck[2] += 18 * f * wave(st, 2.6);
  } else {
    p.root.pos = LAND_AT.toArray();
    // Bounce off the ground once.
    const b = seg(st, LAND, LAND + 0.22);
    p.root.pos[1] += 0.75 * Math.sin(Math.PI * b) * (b < 1 ? 1 : 0);
    // Twitch while lying there.
    const tw = seg(st, 2.75, 2.95);
    p.rLeg[0] += -28 * Math.sin(Math.PI * tw);
    // Sit up.
    const s = ease('Back', 'Out', seg(st, SIT, SIT + 0.35));
    p.root.pos[1] = lerp(p.root.pos[1], 1.5, s);
    p.root.pos[2] = lerp(LAND_AT.z, LAND_AT.z + 0.4, s);

    // Bawling: sobs shake the shoulders and head, legs kick in a tantrum.
    const c = seg(st, SIT + 0.3, SIT + 0.5);
    if (c > 0) {
      const sob = wave(st, 3.1);
      const jerk = Math.max(0, sob);
      p.root.rot[0] += c * -6 * jerk;
      p.root.pos[1] += c * 0.07 * jerk;
      p.neck[0] += c * (-10 * jerk + 3);
      p.neck[2] += c * 7 * wave(st, 1.55);
      p.rArm[0] += c * (-14 * jerk);
      p.lArm[0] += c * (-14 * jerk);
      p.rArm[2] += c * -10 * jerk;
      p.lArm[2] += c * 10 * jerk;
      p.rLeg[0] += c * 20 * wave(st, 2.6);
      p.lLeg[0] -= c * 20 * wave(st, 2.6);
    }
  }
  return p;
}

// ---- the troll -----------------------------------------------------------------------------
const WIND = 1.2; // wind-up starts
const trollKeys = {
  x: [k(0, TROLL_START_X, 'Linear'), k(WIND - 0.25, TROLL_X + 0.5, 'Quad', 'Out'), k(WIND, TROLL_X)],
  pitch: [
    k(0, 14),
    k(WIND, 14, 'Back', 'Out'),
    k(WIND + 0.22, 6),
    k(1.5, 6, 'Quad', 'In'),
    k(CONTACT, -20),
    k(1.78, -20),
    k(2.0, -8),
  ],
  neck: [k(0, [0, -40, 0]), k(WIND - 0.15, [0, -40, 0]), k(WIND, [6, -5, 0]), k(1.8, [6, -5, 0]), k(2.05, [-18, -62, 0])],
  rLeg: [
    k(0, [0, 0, 0]),
    k(WIND, [0, 0, 0], 'Back', 'Out'),
    k(WIND + 0.22, [68, 0, 0]),
    k(1.5, [68, 0, 0], 'Quad', 'In'),
    k(CONTACT, [-108, 0, 0]),
    k(1.78, [-108, 0, 0]),
    k(2.02, [0, 0, 0]),
  ],
  lLeg: [k(0, [0, 0, 0]), k(WIND, [0, 0, 0]), k(WIND + 0.22, [-8, 0, 0]), k(CONTACT, [10, 0, 0]), k(1.78, [10, 0, 0]), k(2.02, [0, 0, 0])],
  rArm: [
    k(0, [-78, 0, -6]),
    k(WIND, [-78, 0, -6], 'Back', 'Out'),
    k(WIND + 0.22, [-25, 0, -60]),
    k(1.5, [-25, 0, -60], 'Quad', 'In'),
    k(CONTACT, [55, 0, -40]),
    k(1.78, [55, 0, -40]),
    k(2.02, [-96, 0, -4]),
  ],
  lArm: [
    k(0, [-78, 0, 6]),
    k(WIND, [-78, 0, 6], 'Back', 'Out'),
    k(WIND + 0.22, [35, 0, 60]),
    k(1.5, [35, 0, 60], 'Quad', 'In'),
    k(CONTACT, [-70, 0, 40]),
    k(1.78, [-70, 0, 40]),
    k(2.02, [-40, 0, -28]),
  ],
};

function trollPose(st) {
  const p = {
    root: { pos: [sample(trollKeys.x, st), 3, TROLL_Z], rot: [sample(trollKeys.pitch, st), 90, 0] },
    neck: [...sample(trollKeys.neck, st)],
    rArm: [...sample(trollKeys.rArm, st)],
    lArm: [...sample(trollKeys.lArm, st)],
    rLeg: [...sample(trollKeys.rLeg, st)],
    lLeg: [...sample(trollKeys.lLeg, st)],
  };
  if (st < WIND) {
    // Tiptoe sneak: quick little steps, bobbing.
    const step = wave(st, 2.3);
    const amp = 1 - seg(st, WIND - 0.2, WIND);
    p.rLeg[0] += 34 * step * amp;
    p.lLeg[0] -= 34 * step * amp;
    p.root.pos[1] += 0.14 * Math.abs(step) * amp;
    p.rArm[0] += 8 * step * amp;
    p.lArm[0] -= 8 * step * amp;
  }
  // Laughing: rock back and forth, pointing arm shakes.
  const l = seg(st, 2.0, 2.15);
  if (l > 0) {
    const ha = Math.abs(wave(st, 4.6));
    p.root.rot[0] += l * -8 * ha;
    p.root.pos[1] += l * 0.08 * ha;
    p.neck[0] += l * -8 * ha;
    p.rArm[0] += l * 6 * wave(st, 4.6);
    p.lArm[0] += l * -6 * ha;
  }
  return p;
}

// ---- camera (real time) --------------------------------------------------------------------
function cameraAt(t, noobPos) {
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  let fov = 70;
  if (t < SHOT_LAUGH) {
    // Side-on shot; a slow push while he sneaks up, a punch-in on the hit, then pan with
    // the noob as he flies.
    const push = ease('Sine', 'InOut', seg(t, 0, CONTACT));
    pos.set(0.3, 3.1, lerp(10.4, 9.4, push));
    look.set(0.3, 3.7, 0);
    // Catch up with him fast, then ride along.
    const follow = ease('Quad', 'Out', seg(t, CONTACT + FREEZE, CONTACT + FREEZE + 0.4));
    const fx = Math.min(noobPos.x, LAND_AT.x) - 0.6;
    pos.x = lerp(pos.x, fx, follow);
    look.x = lerp(look.x, fx, follow);
    look.y = lerp(look.y, 2.6, follow);
    pos.y = lerp(pos.y, 3.6, follow);
    pos.z = lerp(pos.z, 10.4, follow);
    // Track the flight height a little so he never leaves the frame.
    if (t > CONTACT + FREEZE && t < LAND + FREEZE) look.y = lerp(look.y, noobPos.y, 0.6);
    const punch = t >= CONTACT && t < CONTACT + FREEZE + 0.25 ? 1 - ease('Quad', 'Out', seg(t, CONTACT + FREEZE, CONTACT + FREEZE + 0.25)) : 0;
    fov -= 12 * punch;
  } else if (t < SHOT_CRY) {
    // The troll pointing and laughing, from the front.
    const p = ease('Sine', 'Out', seg(t, SHOT_LAUGH, SHOT_CRY));
    // Side-on so the pointing arm points across the frame at the noob.
    pos.set(TROLL_X + 1.6, 3.8, TROLL_Z + lerp(9.0, 8.3, p));
    look.set(TROLL_X + 1.3, 3.3, TROLL_Z);
    fov = 62;
  } else {
    // Back on the noob, sitting there bawling; slow push in.
    const p = ease('Sine', 'InOut', seg(t, SHOT_CRY, meta.duration));
    pos.set(LAND_AT.x + lerp(3.4, 2.6, p), lerp(4.6, 4.1, p), LAND_AT.z + lerp(8.2, 6.4, p));
    look.set(LAND_AT.x + 0.3, lerp(2.2, 2.6, p), LAND_AT.z + 0.4);
    fov = 60;
  }
  // Shakes on the hit and the landing.
  const shake = (at, amp, len) => {
    const s = seg(t, at, at + len);
    return s > 0 && s < 1 ? amp * (1 - s) ** 2 : 0;
  };
  const sh = shake(CONTACT, 0.3, 0.4) + shake(LAND + FREEZE, 0.22, 0.3);
  if (sh) {
    pos.x += sh * Math.sin(t * 93);
    pos.y += sh * Math.sin(t * 127 + 1.3);
  }
  return { pos, look, fov };
}

// ---- setup --------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  buildTown(scene, assets);

  const noob = createR6({
    assets,
    faces,
    face: 'happy',
    colors: {
      head: BRICK.brightYellow,
      torso: BRICK.brightBlue,
      rArm: BRICK.brightYellow,
      lArm: BRICK.brightYellow,
      rLeg: BRICK.brYellowishGreen,
      lLeg: BRICK.brYellowishGreen,
    },
  });
  // Black tee with a white "LOL" print.
  const tee = clothingTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1b2a35';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2f3f3';
    ctx.font = `900 ${Math.round(h * 0.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOL', w / 2, h * 0.45);
  });
  const troll = createR6({
    assets,
    faces,
    face: 'troll',
    shirtFront: tee,
    accessories: cap(BRICK.brightRed),
    colors: {
      head: BRICK.nougat,
      torso: BRICK.black,
      rArm: BRICK.nougat,
      lArm: BRICK.nougat,
      rLeg: BRICK.darkStoneGrey,
      lLeg: BRICK.darkStoneGrey,
    },
  });
  scene.add(noob.root, troll.root);

  // Keep the sun's shadow box on the action.
  sun.target.position.set(3, 0, 0);
  sun.position.set(3 + 30, 60, 40);

  // Impact burst: a white ring and spikes at the contact point.
  const burst = new THREE.Group();
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, side: THREE.DoubleSide });
  burst.add(new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 40), white));
  for (let i = 0; i < 8; i++) {
    const spike = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.9), white);
    const a = (i / 8) * TAU + 0.2;
    spike.position.set(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0);
    spike.rotation.z = a - Math.PI / 2;
    burst.add(spike);
  }
  burst.renderOrder = 10;
  burst.position.set(0.5, 2.5, 0.5);
  scene.add(burst);

  // Dust puff on landing.
  const dustMat = new THREE.MeshStandardMaterial({ color: 0xc9c3b6, roughness: 1, transparent: true, depthWrite: false });
  const dust = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), dustMat);
    const a = (i / 10) * TAU + 0.3;
    m.userData.dir = new THREE.Vector3(Math.cos(a) * 1.6, 0, Math.sin(a));
    m.visible = false;
    scene.add(m);
    dust.push(m);
  }

  // Anime tear fountains, in head space so they follow the sobbing.
  const tearMat = new THREE.MeshStandardMaterial({ color: 0x8fd0ff, emissive: 0x3a8ee0, emissiveIntensity: 0.4, roughness: 0.1, transparent: true, opacity: 0.95 });
  const tearGeo = new THREE.SphereGeometry(1, 12, 8);
  const tears = [];
  for (let i = 0; i < 110; i++) {
    const m = new THREE.Mesh(tearGeo, tearMat);
    m.visible = false;
    noob.joints.neck.add(m);
    tears.push({ mesh: m, side: i % 2 ? 1 : -1, birth: SIT + 0.32 + Math.floor(i / 2) * 0.04 });
  }

  return function update(t) {
    const st = sceneTime(t);

    const np = noobPose(st);
    noob.pose(np);
    noob.setFace(st < CONTACT ? 'happy' : 'crying');
    troll.pose(trollPose(st));

    const r = seg(t, CONTACT, CONTACT + FREEZE + 0.15);
    burst.visible = r > 0 && r < 1;
    white.opacity = 1 - ease('Quad', 'In', r);
    burst.scale.setScalar(0.4 + 0.8 * ease('Quad', 'Out', r));

    const d = seg(st, LAND, LAND + 0.7);
    dustMat.opacity = 0.7 * (1 - d) ** 1.5;
    for (const m of dust) {
      m.visible = d > 0 && d < 1;
      const rr = 0.8 + 2.2 * ease('Quad', 'Out', d);
      m.position.set(LAND_AT.x + m.userData.dir.x * rr, 0.15 + 0.6 * d, LAND_AT.z + m.userData.dir.z * rr);
      m.scale.setScalar(0.16 + 0.22 * d);
    }

    for (const tear of tears) {
      const age = st - tear.birth;
      const life = 0.5;
      tear.mesh.visible = age > 0 && age < life;
      if (!tear.mesh.visible) continue;
      // Eyes sit ~0.15 above the head centre (head centre is 0.5 above the neck joint).
      tear.mesh.position.set(tear.side * (0.24 + 1.9 * age), 0.68 + 1.5 * age - 4.2 * age * age, 0.6 + 0.8 * age);
      tear.mesh.scale.setScalar(0.085 * (1 - 0.4 * (age / life)));
    }

    const cam = cameraAt(t, noob.root.position);
    camera.fov = cam.fov;
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    camera.updateProjectionMatrix();
    burst.quaternion.copy(camera.quaternion);
  };
}
