// Physics pass, run after a scene has posed everyone for the frame and before rendering.
//
//   1. Bodies: characters standing too close are pushed apart, and out of walls/lockers/trucks.
//   2. Follow-through: each character carries a damped spring driven by how its body speeds
//      up, slows down and turns. Arms swing back when it starts running and forward when it
//      stops, the body leans into the change, and hair sways and settles.
//   3. Arms: every arm (upper arm, forearm, hand) is tested against the sets (the boxes each baked set recorded, see
//      bake.js) and against other characters' bodies and arms. An arm that would pass through
//      something is turned (raised, swung out, pushed forward or back) by the smallest amount
//      that clears it, so hands rest on desks and counters instead of sinking into them.
//
// Everything is a function of time: frame t is simulated from a short run-up (PRIME seconds)
// whenever frames don't arrive in order, so stills and render parts match a continuous render.
import * as THREE from 'three';

const D = Math.PI / 180;
const PRIME = 1.0; // seconds of run-up when jumping to a frame
const ARM_R = 0.42; // arm half thickness used for contact
const CELL = 6; // spatial grid cell (studs)
// Points sampled along an arm (part frame, local y): upper arm, forearm, hand and just past it.
const ARM_SAMPLES = [['UpperArm', 0.15], ['UpperArm', -0.35], ['LowerArm', 0.05], ['LowerArm', -0.4], ['Hand', -0.25]];
// Candidate corrections, tried smallest first: [pitch, outward swing] in degrees.
const FIXES = [];
for (const out of [0, 8, 16, 26, 38, 52, 70]) for (const pitch of [0, -10, 10, -20, 20, -32, 32, -48, 48]) FIXES.push([pitch, out]);
FIXES.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));

const v = new THREE.Vector3();
const lerp = (a, b, u) => a + (b - a) * u;
const inv = new THREE.Matrix4();

/** Signed distance from a point to a box given as world min/max (negative inside). */
function aabbDist(p, b) {
  const dx = Math.max(b.min.x - p.x, p.x - b.max.x);
  const dy = Math.max(b.min.y - p.y, p.y - b.max.y);
  const dz = Math.max(b.min.z - p.z, p.z - b.max.z);
  return Math.max(dx, dy, dz);
}

/** Signed distance from a point to an oriented box (centre c, half size h, in a frame). */
function obbDist(p, frameInv, c, h) {
  v.copy(p).applyMatrix4(frameInv);
  return Math.max(Math.abs(v.x - c[0]) - h[0], Math.abs(v.y - c[1]) - h[1], Math.abs(v.z - c[2]) - h[2]);
}

function segDist(p, a, b) {
  const ab = v.subVectors(b, a);
  const t = Math.max(0, Math.min(1, new THREE.Vector3().subVectors(p, a).dot(ab) / Math.max(1e-6, ab.lengthSq())));
  return p.distanceTo(new THREE.Vector3().copy(a).addScaledVector(ab, t));
}

export function createPhysics(scene, actors, { fps = 30 } = {}) {
  const dt = 1 / fps;

  // ---- set colliders -------------------------------------------------------------------
  const grid = new Map();
  const dynamic = []; // baked groups that move (e.g. a truck): boxes in their own frame
  const key = (i, k) => `${i},${k}`;
  const addToGrid = (b) => {
    for (let i = Math.floor(b.min.x / CELL); i <= Math.floor(b.max.x / CELL); i++)
      for (let k = Math.floor(b.min.z / CELL); k <= Math.floor(b.max.z / CELL); k++) {
        const c = key(i, k);
        if (!grid.has(c)) grid.set(c, []);
        grid.get(c).push(b);
      }
  };
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    const boxes = o.userData.colliders;
    if (!boxes) return;
    const moving = o.parent !== scene || !o.matrixWorld.equals(new THREE.Matrix4());
    for (const b of boxes) {
      const sx = b.max.x - b.min.x;
      const sz = b.max.z - b.min.z;
      if (b.max.y < 0.3 || sx > 60 || sz > 60) continue; // floors, ground, whole buildings
      if (moving) dynamic.push({ owner: o, local: b, world: new THREE.Box3() });
      else addToGrid(b);
    }
  });
  function nearbyBoxes(x, z, r) {
    const out = new Set();
    for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++)
      for (let k = Math.floor((z - r) / CELL); k <= Math.floor((z + r) / CELL); k++) for (const b of grid.get(key(i, k)) ?? []) out.add(b);
    for (const d of dynamic) if (d.owner.visible !== false) out.add(d.world);
    return [...out].filter((b) => b.max.x > x - r && b.min.x < x + r && b.max.z > z - r && b.min.z < z + r);
  }

  // ---- per-character state ---------------------------------------------------------------
  const state = new Map();
  for (const a of actors) state.set(a, { p: null, vel: new THREE.Vector3(), yaw: 0, spin: 0, s: new THREE.Vector2(), sv: new THREE.Vector2(), hair: [], fix: { rArm: [0, 0], lArm: [0, 0] } });
  for (const a of actors) {
    const st = state.get(a);
    a.rig.joints.neck.traverse((m) => m.userData.accessoryKind === 'hair' && st.hair.push(m));
  }

  const visible = () => actors.filter((a) => a.root.visible);

  // 1. Bodies apart, and out of tall obstacles.
  function separate(list) {
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const A = list[i].root.position;
          const B = list[j].root.position;
          if (Math.abs(A.y - B.y) > 3) continue;
          const dx = B.x - A.x;
          const dz = B.z - A.z;
          const d = Math.hypot(dx, dz);
          const min = 1.8 * Math.min(list[i].root.scale.x, list[j].root.scale.x);
          if (d >= min || d < 1e-4) continue;
          const push = Math.min(0.5, (min - d) / 2);
          A.x -= (dx / d) * push;
          A.z -= (dz / d) * push;
          B.x += (dx / d) * push;
          B.z += (dz / d) * push;
        }
    }
    for (const a of list) {
      const p = a.root.position;
      const r = 0.75 * a.root.scale.x;
      for (const b of nearbyBoxes(p.x, p.z, 2)) {
        if (b.max.y - b.min.y < 3 || b.min.y > p.y + 1 || b.max.y < p.y - 1) continue; // only walls, lockers, big bodies
        const cx = Math.max(b.min.x, Math.min(p.x, b.max.x));
        const cz = Math.max(b.min.z, Math.min(p.z, b.max.z));
        const dx = p.x - cx;
        const dz = p.z - cz;
        const d = Math.hypot(dx, dz);
        if (d >= r) continue;
        if (d < 1e-4) continue; // centre inside: leave it (scene put them there on purpose)
        const push = Math.min(0.6, r - d);
        p.x += (dx / d) * push;
        p.z += (dz / d) * push;
      }
    }
  }

  // 2. Follow-through springs.
  function springs(list) {
    for (const a of actors) {
      const st = state.get(a);
      const p = a.root.position;
      const yaw = a.root.rotation.y;
      if (!a.root.visible || !st.p || st.p.distanceTo(p) > 2.5) {
        // New, hidden or teleported (a cut): start at rest.
        st.p = p.clone();
        st.vel.set(0, 0, 0);
        st.yaw = yaw;
        st.spin = 0;
        st.s.set(0, 0);
        st.sv.set(0, 0);
        st.fix = { rArm: [0, 0], lArm: [0, 0] };
        continue;
      }
      const vel = new THREE.Vector3().subVectors(p, st.p).divideScalar(dt);
      const acc = new THREE.Vector3().subVectors(vel, st.vel).divideScalar(dt);
      let dyaw = yaw - st.yaw;
      dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      const spin = dyaw / dt;
      // Acceleration in the character's frame: x = right, y = forward.
      const fwd = acc.x * Math.sin(yaw) + acc.z * Math.cos(yaw);
      const side = acc.x * Math.cos(yaw) - acc.z * Math.sin(yaw) + (spin - st.spin) / dt * 0.15;
      const force = new THREE.Vector2(side, fwd).clampLength(0, 120);
      // s'' = -k s - c s' - force * g
      const k = 70;
      const c = 11;
      const g = 0.006;
      st.sv.x += (-k * st.s.x - c * st.sv.x - force.x * g * k) * dt;
      st.sv.y += (-k * st.s.y - c * st.sv.y - force.y * g * k) * dt;
      st.s.addScaledVector(st.sv, dt);
      st.s.clampLength(0, 0.6);
      st.p.copy(p);
      st.vel.copy(vel);
      st.yaw = yaw;
      st.spin = spin;
    }
    for (const a of list) {
      const st = state.get(a);
      const { rArm, lArm } = a.rig.joints;
      const back = -st.s.y; // + when the body surged forward: arms trail back
      rArm.rotation.x += back * 40 * D;
      lArm.rotation.x += back * 40 * D;
      rArm.rotation.z += st.s.x * 25 * D;
      lArm.rotation.z += st.s.x * 25 * D;
      a.root.rotation.x += -back * 9 * D; // lean into the change
      a.root.rotation.z += -st.s.x * 5 * D;
      for (const h of st.hair) h.rotation.set(back * 9 * D, 0, st.s.x * 7 * D);
    }
  }

  // 3. Arms that would pass through things.
  function arms(list) {
    for (const a of list) a.root.updateMatrixWorld(true);
    const bodies = list.map((a) => {
      const j = a.rig.joints;
      return {
        a,
        torso: inv.clone().copy(a.root.matrixWorld).invert(),
        head: new THREE.Matrix4().copy(j.neck.matrixWorld).invert(),
        rLeg: new THREE.Matrix4().copy(j.rLeg.matrixWorld).invert(),
        lLeg: new THREE.Matrix4().copy(j.lLeg.matrixWorld).invert(),
      };
    });
    const prefix = (side) => (side === 'rArm' ? 'Right' : 'Left');
    // The arm as two segments: shoulder -> elbow -> just past the hand.
    const armSegs = (a, side) => {
      const P = a.rig.parts;
      const sh = new THREE.Vector3().setFromMatrixPosition(a.rig.joints[side].matrixWorld);
      const el = new THREE.Vector3().setFromMatrixPosition(a.rig.joints[side === 'rArm' ? 'rElbow' : 'lElbow'].matrixWorld);
      const hand = new THREE.Vector3(0, -0.25, 0).applyMatrix4(P[`${prefix(side)}Hand`].matrixWorld);
      return [[sh, el], [el, hand]];
    };
    const resolved = []; // [actor, segment start, end] of arms already placed this frame

    for (const a of list) {
      const p = a.root.position;
      const s = a.root.scale.x;
      const boxes = nearbyBoxes(p.x, p.z, 4 * s);
      const others = bodies.filter((b) => b.a !== a && b.a.root.position.distanceTo(p) < 7 * s);
      for (const side of ['rArm', 'lArm']) {
        const j = a.rig.joints[side];
        const frames = ARM_SAMPLES.map(([part, y]) => [a.rig.parts[prefix(side) + part], y]);
        const outward = side === 'rArm' ? -1 : 1;
        const base = j.rotation.clone();
        const r = ARM_R * s;
        const pts = ARM_SAMPLES.map(() => new THREE.Vector3());
        const cost = () => {
          j.updateWorldMatrix(false, true);
          let pen = 0;
          frames.forEach(([f, y], i) => pts[i].set(0, y, 0).applyMatrix4(f.matrixWorld));
          for (const q of pts) {
            if (q.y < 0.2) pen += 0.2 - q.y; // the ground
            for (const b of boxes) {
              const d = aabbDist(q, b);
              if (d < r - 0.08) pen += r - d;
            }
            for (const o of others) {
              const sc = o.a.root.scale.x;
              const dd = Math.min(
                obbDist(q, o.torso, [0, 0, 0], [1, 1, 0.5]),
                obbDist(q, o.head, [0, 0.5, 0], [0.6, 0.6, 0.6]),
                obbDist(q, o.rLeg, [0, -1, 0], [0.5, 1, 0.5]),
                obbDist(q, o.lLeg, [0, -1, 0], [0.5, 1, 0.5]),
              ) * sc;
              if (dd < r - 0.08) pen += r - dd;
            }
            for (const [who, s0, s1] of resolved) {
              if (who === a) continue;
              const dd = segDist(q, s0, s1) - (r + ARM_R * who.root.scale.x);
              if (dd < -0.1) pen += -dd;
            }
          }
          return pen;
        };
        const prev = state.get(a).fix[side];
        let target = [0, 0];
        if (cost() > 0) {
          stats.armsFixed++;
          let bestScore = Infinity;
          for (const [pitch, out] of FIXES) {
            j.rotation.set(base.x + pitch * D, base.y, base.z + outward * out * D);
            const c = cost();
            // Smallest correction that clears, preferring last frame's so arms don't flicker.
            const score = c * 400 + Math.hypot(pitch, out) + 0.6 * Math.hypot(pitch - prev[0], out - prev[1]);
            if (score < bestScore) {
              bestScore = score;
              target = [pitch, out];
            }
          }
        }
        // Ease toward the correction (and back to the scene's pose once clear).
        const fix = [lerp(prev[0], target[0], 0.6), lerp(prev[1], target[1], 0.6)];
        state.get(a).fix[side] = fix;
        j.rotation.set(base.x + fix[0] * D, base.y, base.z + outward * fix[1] * D);
        j.updateWorldMatrix(false, true);
        for (const seg of armSegs(a, side)) resolved.push([a, ...seg]);
      }
    }
  }

  const stats = { armsFixed: 0, colliders: [...grid.values()].reduce((n, b) => n + b.length, 0), dynamic: dynamic.length };
  let lastT = null;
  function afterUpdate(full) {
    const list = visible();
    separate(list);
    springs(list);
    if (!full) return; // the run-up only needs the springs
    for (const d of dynamic) {
      d.owner.updateWorldMatrix(true, false);
      d.world.copy(d.local).applyMatrix4(d.owner.matrixWorld);
    }
    arms(list);
  }

  return {
    stats,
    /** Run the scene's update for time t with physics, priming from a run-up when needed. */
    frame(update, t) {
      if (lastT === null || Math.abs(t - lastT - dt) > 1e-4) {
        for (const a of actors) state.get(a).p = null;
        for (let s = Math.max(0, t - PRIME); s < t - 1e-6; s += dt) {
          update(s);
          afterUpdate(t - s < 0.25); // arms settle over the last few run-up frames
        }
      }
      update(t);
      afterUpdate(true);
      lastT = t;
    },
  };
}
