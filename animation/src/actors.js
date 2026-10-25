// Acting on top of r15.js: an Actor places an R15 character in the world at a size, and
// POSES are small procedural animations (in degrees, see r15.js for joint conventions)
// that take the shot-local time so characters always keep a bit of life in them.
// Poses written for R6 still work: elbows, knees and the waist default to a relaxed bend.
import * as THREE from 'three';
import { createR15, JOINT_NAMES } from './r15.js';
import { ease } from './anim.js';

const TAU = Math.PI * 2;
const sin = (t, hz, ph = 0) => Math.sin(TAU * hz * t + ph);
const cos = (t, hz, ph = 0) => Math.cos(TAU * hz * t + ph);
const zero = () => [0, 0, 0];
const pos = (x) => Math.max(0, x);

/** Base pose: everything at rest, elbows a little bent. `lift` is extra root height in studs (before scaling). */
function base() {
  const p = { pitch: 0, yaw: 0, roll: 0, lift: 0 };
  for (const j of JOINT_NAMES) p[j] = zero();
  p.rElbow = [-10, 0, 0];
  p.lElbow = [-10, 0, 0];
  return p;
}

// Each pose(t, seed) returns a pose object; seed de-syncs characters doing the same thing.
export const POSES = {
  idle(t, s = 0) {
    const p = base();
    const b = sin(t, 0.35, s);
    p.rArm = [2 * b, 0, -3 - 1.5 * b];
    p.lArm = [-2 * b, 0, 3 + 1.5 * b];
    p.rElbow = [-12 - 3 * b, 0, 0];
    p.lElbow = [-12 + 3 * b, 0, 0];
    p.neck = [1.5 * sin(t, 0.2, s * 2), 6 * sin(t, 0.11, s), 0];
    return p;
  },
  talk(t, s = 0) {
    const p = POSES.idle(t, s);
    p.neck[0] += 5 * Math.abs(sin(t, 2.2, s));
    p.neck[2] = 4 * sin(t, 0.9, s);
    p.rArm = [-28 + 14 * sin(t, 1.3, s), 0, 8 + 8 * sin(t, 0.7, s)];
    p.rElbow = [-50 + 22 * sin(t, 1.3, s + 0.6), 0, 0]; // the forearm does the gesturing
    p.waist = [0, 4 * sin(t, 0.9, s), 0];
    return p;
  },
  walk(t, s = 0, amp = 40, hz = 1.7) {
    const p = base();
    const w = sin(t, hz, s);
    const c = cos(t, hz, s);
    p.rLeg = [amp * w, 0, 0];
    p.lLeg = [-amp * w, 0, 0];
    // Knees fold while the leg swings through (moving forward) and straighten to land.
    p.rKnee = [6 + 1.1 * amp * pos(-c), 0, 0];
    p.lKnee = [6 + 1.1 * amp * pos(c), 0, 0];
    p.rAnkle = [-0.3 * amp * pos(-c), 0, 0];
    p.lAnkle = [-0.3 * amp * pos(c), 0, 0];
    p.rArm = [-amp * w, 0, -3];
    p.lArm = [amp * w, 0, 3];
    // Elbows bend more on the forward swing.
    p.rElbow = [-14 - 0.6 * amp * pos(w), 0, 0];
    p.lElbow = [-14 - 0.6 * amp * pos(-w), 0, 0];
    p.waist = [0, -0.15 * amp * w, 0];
    return p;
  },
  run(t, s = 0) {
    const p = POSES.walk(t, s, 65, 2.8);
    p.pitch = 10;
    p.lift = 0.12 * Math.abs(sin(t, 2.8, s));
    p.rElbow = [-80 - 10 * sin(t, 2.8, s), 0, 0];
    p.lElbow = [-80 + 10 * sin(t, 2.8, s), 0, 0];
    p.rKnee[0] += 15;
    p.lKnee[0] += 15;
    return p;
  },
  tiptoe(t, s = 0) {
    const p = POSES.walk(t, s, 18, 1.2);
    p.rArm = [-30, 0, 25];
    p.lArm = [-30, 0, -25];
    p.rElbow = [-55, 0, 0];
    p.lElbow = [-55, 0, 0];
    p.rWrist = [40, 0, 0];
    p.lWrist = [40, 0, 0];
    p.rKnee[0] += 14;
    p.lKnee[0] += 14;
    p.pitch = 6;
    p.neck = [6, 10 * sin(t, 0.6, s), 0];
    p.lift = 0.08 * Math.abs(sin(t, 1.2, s)) - 0.05;
    return p;
  },
  laugh(t, s = 0) {
    const p = base();
    const ha = Math.abs(sin(t, 4.2, s));
    p.pitch = -6 - 4 * ha;
    p.waist = [-4 - 4 * ha, 0, 0];
    p.neck = [-12 - 6 * ha, 0, 0];
    // Hands on the belly.
    p.rArm = [-22, 0, 16];
    p.lArm = [-22, 0, -16];
    p.rElbow = [-70, 20, 0];
    p.lElbow = [-70, -20, 0];
    p.lift = 0.05 * ha;
    return p;
  },
  point(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-92 + 3 * sin(t, 1.5, s), 0, 4];
    p.rElbow = [-4, 0, 0];
    p.pitch = 4;
    return p;
  },
  pointLaugh(t, s = 0) {
    const p = POSES.laugh(t, s);
    p.rArm = [-95 + 6 * sin(t, 4.2, s), 0, 2];
    p.rElbow = [-5, 0, 0];
    return p;
  },
  cheer(t, s = 0) {
    const p = base();
    const pump = Math.abs(sin(t, 1.9, s));
    p.rArm = [-165 + 25 * pump, 0, -12];
    p.lArm = [-165 + 25 * pump, 0, 12];
    p.rElbow = [-10 - 30 * pump, 0, 0];
    p.lElbow = [-10 - 30 * pump, 0, 0];
    p.rKnee = [12 * (1 - pump), 0, 0];
    p.lKnee = [12 * (1 - pump), 0, 0];
    p.lift = 0.25 * pump;
    p.neck = [-8, 0, 0];
    return p;
  },
  chant(t, s = 0) {
    const p = base();
    const pump = Math.max(0, sin(t, 1.65, s));
    p.rArm = [-150 + 60 * pump, 0, -6];
    p.rElbow = [-15 - 45 * pump, 0, 0];
    p.lArm = [-10, 0, 6];
    p.neck = [-10, 0, 0];
    p.lift = 0.1 * pump;
    return p;
  },
  cry(t, s = 0) {
    const p = base();
    const sob = Math.max(0, sin(t, 3, s));
    // Hands up over the eyes.
    p.rArm = [-52, 0, 12];
    p.lArm = [-52, 0, -12];
    p.rElbow = [-128, 30, 0];
    p.lElbow = [-128, -30, 0];
    p.neck = [14 + 6 * sob, 0, 3 * sin(t, 1.5, s)];
    p.waist = [6 + 3 * sob, 0, 0];
    p.pitch = 3;
    p.roll = 2 * sin(t, 6, s);
    return p;
  },
  shocked(t, s = 0) {
    const p = base();
    p.rArm = [-25, 0, -42];
    p.lArm = [-25, 0, 42];
    p.rElbow = [-55, 0, 0];
    p.lElbow = [-55, 0, 0];
    p.neck = [-8, 0, 0];
    p.waist = [-4, 0, 0];
    p.pitch = -3;
    return p;
  },
  shy(t, s = 0) {
    const p = base();
    // Hands together in front, shoulders in.
    p.rArm = [-18, 0, 24];
    p.lArm = [-18, 0, -24];
    p.rElbow = [-38, 15, 0];
    p.lElbow = [-38, -15, 0];
    p.neck = [16, 8 * sin(t, 0.4, s), 0];
    p.waist = [4, 0, 0];
    p.rKnee = [10, 0, 0];
    p.lLeg = [0, 0, -4];
    p.roll = 3 * sin(t, 0.5, s);
    return p;
  },
  yell(t, s = 0) {
    const p = base();
    const j = Math.abs(sin(t, 2.4, s));
    p.pitch = 6;
    p.waist = [6, 0, 0];
    p.neck = [-14 - 4 * j, 0, 0];
    p.rArm = [-145, 0, 40];
    p.rElbow = [-30 - 15 * j, 0, 0];
    p.lArm = [5 + 8 * j, 0, 30];
    p.lElbow = [-25, 0, 0];
    return p;
  },
  wave(t, s = 0) {
    const p = POSES.idle(t, s);
    p.lArm = [-150, 0, 22];
    p.lElbow = [-35, 0, 0];
    p.lWrist = [0, 0, 25 * sin(t, 2.4, s)];
    p.lArm[2] += 10 * sin(t, 2.4, s);
    return p;
  },
  sit() {
    const p = base();
    p.rLeg = [-90, 0, 0];
    p.lLeg = [-90, 0, 0];
    p.rKnee = [85, 0, 0];
    p.lKnee = [85, 0, 0];
    p.rArm = [-24, 0, 4];
    p.lArm = [-24, 0, -4];
    p.rElbow = [-45, 0, 0];
    p.lElbow = [-45, 0, 0];
    p.lift = -1; // hips drop by a stud: sitting on a 2-stud-high seat
    return p;
  },
  kneel(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rLeg = [-90, 0, 0];
    p.rKnee = [90, 0, 0];
    p.lLeg = [-5, 0, 0];
    p.lKnee = [95, 0, 0];
    p.lAnkle = [-10, 0, 0];
    p.lift = -0.85;
    return p;
  },
  /** Lying face down (pitch 90) after a trip; the caller lowers the root. */
  lieDown() {
    const p = base();
    p.pitch = 90;
    p.rArm = [-170, 0, -20];
    p.lArm = [-170, 0, 20];
    p.rKnee = [10, 0, 0];
    p.lKnee = [20, 0, 0];
    p.lift = -2.5;
    return p;
  },
  duck(t, s = 0) {
    const p = POSES.walk(t, s, 25, 1.4);
    p.pitch = 30;
    p.waist = [10, 0, 0];
    p.neck = [-30, 0, 0];
    p.rKnee[0] += 30;
    p.lKnee[0] += 30;
    p.rLeg[0] -= 20;
    p.lLeg[0] -= 20;
    p.rElbow = [-50, 0, 0];
    p.lElbow = [-50, 0, 0];
    p.lift = -0.6;
    return p;
  },
  holdUp(t, s = 0) {
    const p = POSES.talk(t, s);
    p.rArm = [-165 + 4 * sin(t, 1.1, s), 0, -4];
    p.rElbow = [-8, 0, 0];
    return p;
  },
  holdOut(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-80, 0, 6];
    p.rElbow = [-6, 0, 0];
    return p;
  },
  micTalk(t, s = 0) {
    const p = POSES.talk(t, s);
    p.rArm = [-104, 0, 24];
    p.rElbow = [-8, 0, 0];
    p.waist = zero();
    return p;
  },
  micYell(t, s = 0) {
    const p = POSES.yell(t, s);
    p.rArm = [-118, 0, 30];
    p.rElbow = [-8, 0, 0];
    p.lArm = [-10, 0, 25 + 15 * Math.abs(sin(t, 2.4, s))];
    return p;
  },
  shush(t, s = 0) {
    const p = POSES.idle(t, s);
    // Finger to the lips.
    p.rArm = [-55, 0, 22];
    p.rElbow = [-112, 20, 0];
    p.neck = [6, 0, 0];
    return p;
  },
  crossArms(t, s = 0) {
    const p = POSES.idle(t, s);
    // Upper arms at the sides, forearms folded across the chest.
    p.rArm = [-18, 0, 12];
    p.lArm = [-14, 0, -12];
    p.rElbow = [-95, 62, 0];
    p.lElbow = [-88, -62, 0];
    p.pitch = -4;
    p.neck = [-6, 0, 0];
    return p;
  },
  strain(t, s = 0) {
    const p = base();
    const shake = sin(t, 9, s);
    p.rArm = [-85, 0, 30 + 3 * shake];
    p.lArm = [-85, 0, -30 - 3 * shake];
    p.rElbow = [-22, 0, 0];
    p.lElbow = [-22, 0, 0];
    p.pitch = -12 + 2 * shake;
    p.waist = [-6, 0, 0];
    p.neck = [-14, 0, 0];
    p.rLeg = [-14, 0, 0];
    p.lLeg = [14, 0, 0];
    p.rKnee = [18, 0, 0];
    p.lKnee = [10, 0, 0];
    return p;
  },
  dangle(t, s = 0) {
    const p = base();
    const k = sin(t, 3.2, s);
    p.rArm = [-30 * k, 0, -20];
    p.lArm = [30 * k, 0, 20];
    p.rLeg = [30 * k, 0, 0];
    p.lLeg = [-30 * k, 0, 0];
    p.rKnee = [10 + 25 * pos(k), 0, 0];
    p.lKnee = [10 + 25 * pos(-k), 0, 0];
    p.pitch = 10 * sin(t, 1.1, s);
    return p;
  },
  stir(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-50 + 10 * sin(t, 1.4, s), 12 * sin(t, 1.4, s + 1.5), 10];
    p.rElbow = [-45, 0, 0];
    return p;
  },
  stamp(t, s = 0) {
    const p = POSES.idle(t, s);
    const k = Math.max(0, sin(t, 1.6, s));
    p.rArm = [-40 - 20 * k, 0, 8];
    p.rElbow = [-30 - 25 * k, 0, 0];
    p.neck = [12, 0, 0];
    return p;
  },
  plead(t, s = 0) {
    const p = POSES.kneel(t, s);
    p.rArm = [-80, 0, 28];
    p.lArm = [-80, 0, -28];
    p.rElbow = [-30, 10, 0];
    p.lElbow = [-30, -10, 0];
    p.neck = [-10, 0, 4 * sin(t, 0.8, s)];
    return p;
  },
  nod(t, s = 0) {
    const p = POSES.idle(t, s);
    p.neck = [10 * Math.max(0, sin(t, 1.6, s)), 0, 0];
    return p;
  },
  climb(t, s = 0) {
    const p = POSES.walk(t, s, 55, 2.2);
    p.rArm = [-120 + 30 * sin(t, 2.2, s), 0, -10];
    p.lArm = [-120 - 30 * sin(t, 2.2, s), 0, 10];
    p.rElbow = [-35 - 25 * pos(sin(t, 2.2, s)), 0, 0];
    p.lElbow = [-35 - 25 * pos(-sin(t, 2.2, s)), 0, 0];
    return p;
  },
  scurry(t, s = 0) {
    const p = POSES.run(t * 1.6, s);
    p.rArm = [-60 + 50 * sin(t, 4.5, s), 0, -10];
    p.lArm = [-60 - 50 * sin(t, 4.5, s), 0, 10];
    p.rElbow = [-70, 0, 0];
    p.lElbow = [-70, 0, 0];
    return p;
  },
};

/** Blend two poses (u = 0 -> a, 1 -> b). */
export function blend(a, b, u) {
  const out = base();
  a = { ...out, ...a };
  b = { ...out, ...b };
  for (const k of Object.keys(out)) {
    out[k] = Array.isArray(out[k]) ? a[k].map((v, i) => v + (b[k][i] - v) * u) : a[k] + (b[k] - a[k]) * u;
  }
  return out;
}

/** "Bloop" size change: from -> to over `dur` seconds starting at `at`, with an overshoot. */
export function bloop(t, at, from, to, dur = 0.28) {
  if (t <= at) return from;
  const u = Math.min(1, (t - at) / dur);
  return from + (to - from) * ease('Back', 'Out', u);
}

/** Size after a list of bloops [[time, size], ...] starting from `start`. */
export function sizeAt(t, start, steps, dur = 0.28) {
  let s = start;
  for (const [at, to] of steps) s = bloop(t, at, s, to, dur);
  return s;
}

/** Every Actor created, for the physics pass (physics.js). */
export const ACTORS = [];

const REST = base();
const GRIP_Y = -0.25; // hand centre -> grip point, 0.1 below the hand like R6's (the hand is 0.3 tall)

export class Actor {
  constructor(opts) {
    ACTORS.push(this);
    this.rig = createR15(opts);
    this.root = this.rig.root;
    this.held = {}; // props attached to hands
  }

  /** Old name for the rig (scenes written for R6 reach joints through it). */
  get r6() {
    return this.rig;
  }

  hide() {
    this.root.visible = false;
  }

  /**
   * Place and pose the character for this frame.
   *   at: [x, z] world position, y: ground height, yaw: facing in degrees (0 = +z),
   *   size: scale (1 = normal), pose: object from POSES, face: face name(s).
   * Joints a pose leaves out keep their rest values (elbows slightly bent).
   */
  set({ at, y = 0, yaw = 0, size = 1, pose, face }) {
    const p = { ...REST, ...(pose ?? POSES.idle(0)) };
    this.root.visible = true;
    this.root.scale.setScalar(size);
    const angles = Object.fromEntries(JOINT_NAMES.map((j) => [j, p[j]]));
    this.rig.pose({ root: { pos: [at[0], y + (3 + p.lift) * size, at[1]], rot: [p.pitch, yaw + p.yaw, p.roll] }, ...angles });
    if (face) this.rig.setFace(face);
    for (const k of Object.keys(this.held)) this.held[k].visible = false;
  }

  /**
   * Attach a prop to a hand ('r' or 'l'), keyed by name; show it this frame with hold().
   * offset/rot are in the hand's frame (arm hanging down = -y), measured from the grip point
   * just under the hand, where R6's grip was, so R6 offsets still fit; props follow the forearm.
   */
  attach(name, obj, hand = 'r', offset = [0, 0, 0], rot = [0, 0, 0]) {
    const g = new THREE.Group();
    g.add(obj);
    g.position.set(offset[0], GRIP_Y + offset[1], offset[2]);
    g.rotation.set(rot[0], rot[1], rot[2]);
    g.visible = false;
    this.handFrame(hand).add(g);
    this.held[name] = g;
    return g;
  }

  hold(name) {
    if (this.held[name]) this.held[name].visible = true;
  }

  handFrame(hand = 'r') {
    return this.rig.parts[hand === 'r' ? 'RightHand' : 'LeftHand'];
  }

  /** World position of a hand ('r' or 'l'), for props that hang from it. */
  handPos(hand = 'r', target = new THREE.Vector3()) {
    const f = this.handFrame(hand);
    f.updateWorldMatrix(true, false);
    return target.set(0, -0.55, 0).applyMatrix4(f.matrixWorld);
  }

  /** World position of the head centre (for aiming cameras). */
  headPos(target = new THREE.Vector3()) {
    return this.rig.headPoint(0, 0.5, 0, target);
  }
}
