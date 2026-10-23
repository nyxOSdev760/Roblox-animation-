// Acting on top of r6.js: an Actor places an R6 character in the world at a size, and
// POSES are small procedural animations (in degrees, see r6.js for joint conventions)
// that take the shot-local time so characters always keep a bit of life in them.
import * as THREE from 'three';
import { createR6 } from './r6.js';
import { ease } from './anim.js';

const TAU = Math.PI * 2;
const sin = (t, hz, ph = 0) => Math.sin(TAU * hz * t + ph);
const zero = () => [0, 0, 0];

/** Base pose: everything at rest. `lift` is extra root height in studs (before scaling). */
function base() {
  return { pitch: 0, yaw: 0, roll: 0, lift: 0, neck: zero(), rArm: zero(), lArm: zero(), rLeg: zero(), lLeg: zero() };
}

// Each pose(t, seed) returns a pose object; seed de-syncs characters doing the same thing.
export const POSES = {
  idle(t, s = 0) {
    const p = base();
    const b = sin(t, 0.35, s);
    p.rArm = [2 * b, 0, -3 - 1.5 * b];
    p.lArm = [-2 * b, 0, 3 + 1.5 * b];
    p.neck = [1.5 * sin(t, 0.2, s * 2), 6 * sin(t, 0.11, s), 0];
    return p;
  },
  talk(t, s = 0) {
    const p = POSES.idle(t, s);
    p.neck[0] += 5 * Math.abs(sin(t, 2.2, s));
    p.neck[2] = 4 * sin(t, 0.9, s);
    p.rArm = [-35 + 18 * sin(t, 1.3, s), 0, 8 + 8 * sin(t, 0.7, s)];
    return p;
  },
  walk(t, s = 0, amp = 40, hz = 1.7) {
    const p = base();
    const w = sin(t, hz, s);
    p.rLeg = [amp * w, 0, 0];
    p.lLeg = [-amp * w, 0, 0];
    p.rArm = [-amp * w, 0, -3];
    p.lArm = [amp * w, 0, 3];
    return p;
  },
  run(t, s = 0) {
    const p = POSES.walk(t, s, 65, 2.8);
    p.pitch = 10;
    p.lift = 0.12 * Math.abs(sin(t, 2.8, s));
    return p;
  },
  tiptoe(t, s = 0) {
    const p = POSES.walk(t, s, 18, 1.2);
    p.rArm = [-30, 0, 25];
    p.lArm = [-30, 0, -25];
    p.pitch = 6;
    p.neck = [6, 10 * sin(t, 0.6, s), 0];
    p.lift = 0.08 * Math.abs(sin(t, 1.2, s));
    return p;
  },
  laugh(t, s = 0) {
    const p = base();
    const ha = Math.abs(sin(t, 4.2, s));
    p.pitch = -8 - 6 * ha;
    p.neck = [-14 - 6 * ha, 0, 0];
    p.rArm = [-40, 0, 28];
    p.lArm = [-40, 0, -28];
    p.lift = 0.05 * ha;
    return p;
  },
  point(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-92 + 3 * sin(t, 1.5, s), 0, 4];
    p.pitch = 4;
    return p;
  },
  pointLaugh(t, s = 0) {
    const p = POSES.laugh(t, s);
    p.rArm = [-95 + 6 * sin(t, 4.2, s), 0, 2];
    return p;
  },
  cheer(t, s = 0) {
    const p = base();
    const pump = Math.abs(sin(t, 1.9, s));
    p.rArm = [-165 + 25 * pump, 0, -12];
    p.lArm = [-165 + 25 * pump, 0, 12];
    p.lift = 0.25 * pump;
    p.neck = [-8, 0, 0];
    return p;
  },
  chant(t, s = 0) {
    const p = base();
    const pump = Math.max(0, sin(t, 1.65, s));
    p.rArm = [-150 + 60 * pump, 0, -6];
    p.lArm = [-10, 0, 6];
    p.neck = [-10, 0, 0];
    p.lift = 0.1 * pump;
    return p;
  },
  cry(t, s = 0) {
    const p = base();
    const sob = Math.max(0, sin(t, 3, s));
    p.rArm = [-128, 0, 34];
    p.lArm = [-128, 0, -34];
    p.neck = [14 + 6 * sob, 0, 3 * sin(t, 1.5, s)];
    p.pitch = 6 + 3 * sob;
    p.roll = 2 * sin(t, 6, s);
    return p;
  },
  shocked(t, s = 0) {
    const p = base();
    p.rArm = [-25, 0, -42];
    p.lArm = [-25, 0, 42];
    p.neck = [-8, 0, 0];
    p.pitch = -5;
    return p;
  },
  shy(t, s = 0) {
    const p = base();
    p.rArm = [-28, 0, 30];
    p.lArm = [-28, 0, -30];
    p.neck = [16, 8 * sin(t, 0.4, s), 0];
    p.roll = 3 * sin(t, 0.5, s);
    return p;
  },
  yell(t, s = 0) {
    const p = base();
    const j = Math.abs(sin(t, 2.4, s));
    p.pitch = 10;
    p.neck = [-14 - 4 * j, 0, 0];
    p.rArm = [-145, 0, 40];
    p.lArm = [5 + 8 * j, 0, 30];
    return p;
  },
  wave(t, s = 0) {
    const p = POSES.idle(t, s);
    p.lArm = [-170, 0, 18 + 22 * sin(t, 2.4, s)];
    return p;
  },
  sit() {
    const p = base();
    p.rLeg = [-90, 0, 0];
    p.lLeg = [-90, 0, 0];
    p.rArm = [-30, 0, 0];
    p.lArm = [-30, 0, 0];
    p.lift = -1; // hips drop by a stud: sitting on a 2-stud-high seat
    return p;
  },
  kneel(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rLeg = [-90, 0, 0];
    p.lLeg = [85, 0, 0];
    p.lift = -1;
    return p;
  },
  /** Lying face down (pitch 90) after a trip; the caller lowers the root. */
  lieDown() {
    const p = base();
    p.pitch = 90;
    p.rArm = [-170, 0, -20];
    p.lArm = [-170, 0, 20];
    p.lift = -2.5;
    return p;
  },
  duck(t, s = 0) {
    const p = POSES.walk(t, s, 25, 1.4);
    p.pitch = 38;
    p.neck = [-30, 0, 0];
    p.lift = -0.6;
    return p;
  },
  holdUp(t, s = 0) {
    const p = POSES.talk(t, s);
    p.rArm = [-165 + 4 * sin(t, 1.1, s), 0, -4];
    return p;
  },
  holdOut(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-80, 0, 6];
    return p;
  },
  micTalk(t, s = 0) {
    const p = POSES.talk(t, s);
    p.rArm = [-104, 0, 24];
    return p;
  },
  micYell(t, s = 0) {
    const p = POSES.yell(t, s);
    p.rArm = [-118, 0, 30];
    p.lArm = [-10, 0, 25 + 15 * Math.abs(sin(t, 2.4, s))];
    return p;
  },
  shush(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-150, 0, 36];
    p.neck = [6, 0, 0];
    return p;
  },
  crossArms(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-70, 0, 50];
    p.lArm = [-60, 0, -50];
    p.pitch = -4;
    p.neck = [-6, 0, 0];
    return p;
  },
  strain(t, s = 0) {
    const p = base();
    const shake = sin(t, 9, s);
    p.rArm = [-85, 0, 30 + 3 * shake];
    p.lArm = [-85, 0, -30 - 3 * shake];
    p.pitch = -16 + 2 * shake;
    p.neck = [-14, 0, 0];
    p.rLeg = [-8, 0, 0];
    p.lLeg = [8, 0, 0];
    return p;
  },
  dangle(t, s = 0) {
    const p = base();
    const k = sin(t, 3.2, s);
    p.rArm = [-30 * k, 0, -20];
    p.lArm = [30 * k, 0, 20];
    p.rLeg = [30 * k, 0, 0];
    p.lLeg = [-30 * k, 0, 0];
    p.pitch = 10 * sin(t, 1.1, s);
    return p;
  },
  stir(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-80 + 10 * sin(t, 1.4, s), 12 * sin(t, 1.4, s + 1.5), 10];
    return p;
  },
  stamp(t, s = 0) {
    const p = POSES.idle(t, s);
    p.rArm = [-55 - 25 * Math.max(0, sin(t, 1.6, s)), 0, 8];
    p.neck = [12, 0, 0];
    return p;
  },
  plead(t, s = 0) {
    const p = POSES.kneel(t, s);
    p.rArm = [-80, 0, 28];
    p.lArm = [-80, 0, -28];
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
    return p;
  },
  scurry(t, s = 0) {
    const p = POSES.run(t * 1.6, s);
    p.rArm = [-60 + 50 * sin(t, 4.5, s), 0, -10];
    p.lArm = [-60 - 50 * sin(t, 4.5, s), 0, 10];
    return p;
  },
};

/** Blend two poses (u = 0 -> a, 1 -> b). */
export function blend(a, b, u) {
  const out = base();
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

export class Actor {
  constructor(opts) {
    this.r6 = createR6(opts);
    this.root = this.r6.root;
    this.held = {}; // props attached to hands
  }

  hide() {
    this.root.visible = false;
  }

  /**
   * Place and pose the character for this frame.
   *   at: [x, z] world position, y: ground height, yaw: facing in degrees (0 = +z),
   *   size: scale (1 = normal R6), pose: object from POSES, face: face name(s).
   */
  set({ at, y = 0, yaw = 0, size = 1, pose, face }) {
    const p = pose ?? POSES.idle(0);
    this.root.visible = true;
    this.root.scale.setScalar(size);
    this.r6.pose({
      root: { pos: [at[0], y + (3 + p.lift) * size, at[1]], rot: [p.pitch, yaw + p.yaw, p.roll] },
      neck: p.neck,
      rArm: p.rArm,
      lArm: p.lArm,
      rLeg: p.rLeg,
      lLeg: p.lLeg,
    });
    if (face) this.r6.setFace(face);
    for (const k of Object.keys(this.held)) this.held[k].visible = false;
  }

  /** Attach a prop to a hand ('r' or 'l'), keyed by name; show it this frame with hold(). */
  attach(name, obj, hand = 'r', offset = [0, 0, 0], rot = [0, 0, 0]) {
    const arm = hand === 'r' ? this.r6.joints.rArm : this.r6.joints.lArm;
    const g = new THREE.Group();
    g.add(obj);
    g.position.set((hand === 'r' ? -0.5 : 0.5) + offset[0], -1.6 + offset[1], offset[2]);
    g.rotation.set(rot[0], rot[1], rot[2]);
    g.visible = false;
    arm.add(g);
    this.held[name] = g;
    return g;
  }

  hold(name) {
    if (this.held[name]) this.held[name].visible = true;
  }

  /** World position of a hand ('r' or 'l'), for props that hang from it. */
  handPos(hand = 'r', target = new THREE.Vector3()) {
    const arm = hand === 'r' ? this.r6.joints.rArm : this.r6.joints.lArm;
    arm.updateWorldMatrix(true, false);
    return target.set(hand === 'r' ? -0.5 : 0.5, -1.9, 0).applyMatrix4(arm.matrixWorld);
  }

  /** World position of the head centre (for aiming cameras). */
  headPos(target = new THREE.Vector3()) {
    return this.r6.headPoint(0, 0.5, 0, target);
  }
}
