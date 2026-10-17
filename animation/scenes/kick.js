// "Kicked": a guy walks up, kicks the noob across the park, and the noob sits there crying.
import * as THREE from 'three';
import { createR6, COLORS } from '../src/r6.js';
import { seg, lerp, smooth, easeOut, easeIn, easeInOut } from '../src/world.js';

export const meta = {
  duration: 5,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'suspicious', 'sad', 'crying', 'smirk', 'grin'],
  // Sound cues: file in assets/sfx (or a generated effect), start time (s), volume.
  audio: [
    { file: 'huh-rblx-se.mp3', at: 0.84, volume: 1.0 },
    { synth: 'thud', at: 1.19, volume: 1.0 },
    { file: 'ahh-rblx-scared.mp3', at: 1.24, volume: 1.0 },
    { synth: 'thud', at: 2.2, volume: 0.7 },
    { file: 'roblox-crying-work-at-pizza-place.mp3', at: 2.42, volume: 1.0 },
    { file: 'hahaha-rblx-se.mp3', at: 3.15, volume: 0.75 },
  ],
};

const T = {
  sideShot: 0.8,
  huh: 0.84,
  stopWalk: 1.0,
  windUp: 1.12,
  impact: 1.2,
  land: 2.2,
  cut: 2.45,
};

// Both are turned a little toward the camera so we see their faces, not just profiles.
const KICKER_SPOT = new THREE.Vector3(-0.7, 2, -0.6);
const KICKER_YAW = Math.PI / 2 - 0.35;
const VICTIM_START = new THREE.Vector3(1.5, 2, 0);
const VICTIM_YAW = -Math.PI / 2 + 0.45;
const VICTIM_LAND = new THREE.Vector3(8.5, 0.5, 1.4);
const SIT_HIP = 0.5;
// Crying shot: camera off to the side so the laughing kicker shows up beside the noob.
const CRY_CAM = new THREE.Vector3(6.5, 2.4, 6.2);
const LAND_YAW = Math.atan2(CRY_CAM.x, CRY_CAM.z); // facing that camera

export function setup({ scene, camera, faces }) {
  const victim = createR6({
    faces,
    face: 'neutral',
    colors: {
      head: COLORS.brightYellow,
      torso: COLORS.brightBlue,
      leftArm: COLORS.brightYellow,
      rightArm: COLORS.brightYellow,
      leftLeg: COLORS.brightGreen,
      rightLeg: COLORS.brightGreen,
    },
  });
  const kicker = createR6({
    faces,
    face: 'smirk',
    cap: COLORS.brightRed,
    colors: {
      head: COLORS.brightYellow,
      torso: COLORS.black,
      leftArm: COLORS.brightYellow,
      rightArm: COLORS.brightYellow,
      leftLeg: COLORS.darkGrey,
      rightLeg: COLORS.darkGrey,
    },
  });
  scene.add(victim.root, kicker.root);

  // Anime tear fountains, in head space so they follow the sobbing.
  const tearMat = new THREE.MeshStandardMaterial({
    color: 0x86ccff,
    emissive: 0x2b7fd6,
    emissiveIntensity: 0.35,
    roughness: 0.15,
    transparent: true,
    opacity: 0.92,
  });
  const tearGeo = new THREE.SphereGeometry(1, 12, 8);
  const tears = [];
  for (let i = 0; i < 120; i++) {
    const m = new THREE.Mesh(tearGeo, tearMat);
    m.visible = false;
    victim.neck.add(m);
    tears.push({ mesh: m, side: i % 2 ? 1 : -1, birth: T.land + 0.15 + Math.floor(i / 2) * 0.045 });
  }

  // Dust puff where the noob lands.
  const dustMat = new THREE.MeshStandardMaterial({ color: 0xd8cfbf, roughness: 1, transparent: true });
  const dust = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), dustMat);
    const a = (i / 12) * Math.PI * 2;
    m.userData.dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    m.visible = false;
    scene.add(m);
    dust.push(m);
  }

  // White impact ring at the kick.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.position.set(1.0, 1.4, 0.2);
  scene.add(ring);

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  function animateKicker(t) {
    const k = kicker;
    k.resetPose();
    k.root.rotation.y = KICKER_YAW;

    // Walk in.
    const w = seg(t, 0, T.stopWalk);
    const x = lerp(-5.5, KICKER_SPOT.x, 1 - (1 - w) ** 2);
    const phase = Math.PI * 2 * 1.9 * t;
    const amp = 0.75 * (1 - smooth(seg(t, 0.82, T.stopWalk)));
    k.root.position.set(x, 2 + 0.08 * Math.abs(Math.sin(phase)) * amp, KICKER_SPOT.z);
    k.rightHip.rotation.x = amp * Math.sin(phase);
    k.leftHip.rotation.x = -amp * Math.sin(phase);
    k.rightShoulder.rotation.x = -amp * Math.sin(phase);
    k.leftShoulder.rotation.x = amp * Math.sin(phase);

    // Wind up, kick, recover.
    const up = easeOut(seg(t, T.stopWalk, T.windUp));
    const swing = easeIn(seg(t, T.windUp, T.impact + 0.02));
    const back = easeInOut(seg(t, 1.45, 1.8));
    const kick = (1 - back) * lerp(lerp(0, 0.85, up), -1.8, swing);
    if (t > T.stopWalk) {
      k.rightHip.rotation.x = kick;
      k.body.rotation.x = (1 - back) * lerp(0.12 * up, -0.28, swing);
      k.rightShoulder.rotation.x = (1 - back) * lerp(-0.6 * up, 0.5, swing);
      k.leftShoulder.rotation.x = (1 - back) * lerp(0.6 * up, -0.7, swing);
      k.rightShoulder.rotation.z = (1 - back) * -0.5 * swing;
      k.leftShoulder.rotation.z = (1 - back) * 0.5 * swing;
    }

    // Laugh: point at the noob with one hand, hold belly with the other.
    const laugh = smooth(seg(t, 1.6, 2.0));
    const hard = 1 + 0.8 * smooth(seg(t, 3.1, 3.3)) * (1 - smooth(seg(t, 4.2, 4.6)));
    const bob = Math.abs(Math.sin(Math.PI * 2 * 4.5 * t)) * hard;
    k.body.rotation.x += laugh * (-0.14 - 0.07 * bob);
    k.neck.rotation.x += laugh * (-0.28 - 0.06 * bob);
    k.rightShoulder.rotation.x += laugh * -1.45;
    k.rightShoulder.rotation.z += laugh * 0.08;
    k.leftShoulder.rotation.x += laugh * -0.55;
    k.leftShoulder.rotation.z += laugh * -0.45;
    k.root.position.y += laugh * 0.05 * bob;

    k.setFace(t < T.windUp ? 'smirk' : 'grin');
  }

  function animateVictim(t) {
    const v = victim;
    v.resetPose();

    if (t < T.impact) {
      // Standing there, idly breathing. "Huh?" when the guy squares up.
      v.root.position.copy(VICTIM_START);
      v.root.rotation.y = VICTIM_YAW;
      const breathe = Math.sin(Math.PI * 2 * 0.8 * t);
      v.rightShoulder.rotation.z = -0.04 - 0.02 * breathe;
      v.leftShoulder.rotation.z = 0.04 + 0.02 * breathe;
      const huh = smooth(seg(t, T.huh, T.huh + 0.12));
      v.neck.rotation.z = 0.18 * huh;
      v.setFace(t < T.huh ? 'neutral' : 'suspicious');
      return;
    }

    const u = seg(t, T.impact, T.land);
    const sit = smooth(seg(u, 0.55, 1));

    // Flight: big arc, a backflip, and a spin so he lands facing the camera.
    v.root.position.set(
      lerp(VICTIM_START.x, VICTIM_LAND.x, easeOut(u) * 0.35 + u * 0.65),
      lerp(VICTIM_START.y, SIT_HIP, u) + 4 * 3.2 * u * (1 - u),
      lerp(VICTIM_START.z, VICTIM_LAND.z, u),
    );
    v.root.rotation.y = lerp(VICTIM_YAW, LAND_YAW, easeInOut(u));
    v.body.rotation.x = -Math.PI * 2 * easeInOut(seg(u, 0.05, 0.92));
    const flail = (1 - sit) * (t < T.land ? 1 : 0);
    v.rightShoulder.rotation.z = flail * -(1.3 + 0.5 * Math.sin(Math.PI * 2 * 7 * t));
    v.leftShoulder.rotation.z = flail * (1.3 + 0.5 * Math.sin(Math.PI * 2 * 7 * t + 1.7));
    v.rightHip.rotation.x = -Math.PI / 2 * sit + flail * 0.5 * Math.sin(Math.PI * 2 * 6 * t);
    v.leftHip.rotation.x = -Math.PI / 2 * sit - flail * 0.5 * Math.sin(Math.PI * 2 * 6 * t);
    v.setFace('sad');

    if (t >= T.land) {
      // Landed: bounce, settle, then sob.
      const b = seg(t, T.land, T.land + 0.3);
      v.root.position.y = SIT_HIP + 0.32 * Math.sin(Math.PI * Math.min(1, b / 0.6)) * (b < 0.6 ? 1 : 0);
      v.body.rotation.x = -0.3 * Math.sin(Math.PI * 2 * b) * (1 - b);

      const cry = smooth(seg(t, T.land + 0.1, T.land + 0.35));
      const sob = Math.sin(Math.PI * 2 * 4.2 * t);
      v.body.rotation.z += cry * 0.045 * Math.sin(Math.PI * 2 * 9 * t);
      v.body.position.y = cry * 0.05 * Math.abs(sob);
      v.neck.rotation.x = cry * (-0.28 + 0.05 * sob);
      v.rightShoulder.rotation.x = cry * (-0.95 + 0.14 * sob);
      v.leftShoulder.rotation.x = cry * (-0.95 - 0.14 * sob);
      v.rightShoulder.rotation.z = cry * 0.32;
      v.leftShoulder.rotation.z = cry * -0.32;
      v.setFace(t < T.land + 0.08 ? 'sad' : 'crying');
    }
  }

  function animateEffects(t) {
    for (const tear of tears) {
      const age = t - tear.birth;
      const life = 0.55;
      tear.mesh.visible = age > 0 && age < life;
      if (!tear.mesh.visible) continue;
      tear.mesh.position.set(
        tear.side * (0.22 + 1.7 * age),
        0.7 + 1.35 * age - 3.6 * age * age,
        0.58 + 0.75 * age,
      );
      tear.mesh.scale.setScalar(0.085 * (1 - 0.45 * (age / life)));
    }

    const d = seg(t, T.land, T.land + 0.7);
    dustMat.opacity = 0.85 * (1 - d);
    for (const m of dust) {
      m.visible = d > 0 && d < 1;
      const r = 0.6 + 2.2 * easeOut(d);
      m.position.set(VICTIM_LAND.x + m.userData.dir.x * r, 0.25 + 0.6 * d, VICTIM_LAND.z + m.userData.dir.z * r);
      m.scale.setScalar(0.22 + 0.25 * d);
    }

    const r = seg(t, T.impact - 0.01, T.impact + 0.2);
    ring.visible = r > 0 && r < 1;
    ring.material.opacity = 1 - r;
    ring.scale.setScalar(0.3 + 2.2 * easeOut(r));
    ring.lookAt(camera.position);
  }

  function shake(t, at, strength, length) {
    const s = seg(t, at, at + length);
    if (s <= 0 || s >= 1) return 0;
    return strength * (1 - s) ** 2;
  }

  const victimHead = new THREE.Vector3(VICTIM_LAND.x, SIT_HIP + 2.6, VICTIM_LAND.z);
  const kickerHead = new THREE.Vector3(KICKER_SPOT.x, 4.4, KICKER_SPOT.z);
  const cryWide = new THREE.Vector3().copy(VICTIM_LAND).add(CRY_CAM);
  const cryClose = new THREE.Vector3().copy(VICTIM_LAND).addScaledVector(CRY_CAM, 0.5).setY(3.1);
  const cryLookWide = new THREE.Vector3().lerpVectors(victimHead, kickerHead, 0.3).setY(2.6);

  function animateCamera(t) {
    camera.fov = 50;
    if (t < T.cut) {
      if (t < T.sideShot) {
        // Over the noob's shoulder: the other guy walks up smirking.
        const push = smooth(seg(t, 0, T.sideShot));
        camPos.set(lerp(6.6, 6.0, push), 3.6, lerp(9.2, 8.5, push));
        camLook.set(-0.9, 2.6, -1.4);
      } else {
        // Side-on for the "huh?" and the kick.
        const push = smooth(seg(t, T.sideShot, T.impact));
        camPos.set(0.5, 2.9, lerp(11.8, 11.0, push));
        camLook.set(0.25, 2.3, -0.3);
      }

      // Then follow the noob through the air.

      const follow = easeOut(seg(t, T.impact + 0.02, T.impact + 0.16));
      const vp = victim.root.position;
      camPos.x = lerp(camPos.x, vp.x + 1.5, follow);
      camPos.y = lerp(camPos.y, vp.y + 1.2, follow);
      camPos.z = lerp(camPos.z, 12, follow);
      camLook.x = lerp(camLook.x, vp.x, follow);
      camLook.y = lerp(camLook.y, vp.y + 0.6, follow);
      camLook.z = lerp(camLook.z, vp.z, follow);
    } else {
      // He's sitting there crying while the other guy laughs in the background; slow push in.
      const p = easeInOut(seg(t, T.cut + 0.4, meta.duration));
      camPos.lerpVectors(cryWide, cryClose, p);
      camLook.lerpVectors(cryLookWide, victimHead, p);
    }

    const s = shake(t, T.impact, 0.35, 0.35) + shake(t, T.land, 0.25, 0.3);
    if (s) {
      camPos.x += s * Math.sin(t * 97);
      camPos.y += s * Math.sin(t * 131 + 1);
      camLook.x += s * 0.5 * Math.sin(t * 89 + 2);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.updateProjectionMatrix();
  }

  return function update(t) {
    animateKicker(t);
    animateVictim(t);
    animateCamera(t);
    animateEffects(t);
  };
}
