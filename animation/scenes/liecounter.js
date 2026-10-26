// "The Lie Counter" — a Roblox story Short. Narration and word timings:
// assets/voice/liecounter (tools/narrate.py, tools/align.py); script: scripts/liecounter.md.
//
// Everyone has a number floating over their head (lies told; 100 and you vanish). Places: the
// front of the school (the rule, a kid hitting 100), the classroom (brutal honesty, then me at
// 99 and my lies), the sidewalk (grandma and the mailman), and the hallway (the crush). Inside a
// place the camera glides between framings; the jumps between places are dips to black.
import * as THREE from 'three';
import words from '../../assets/voice/liecounter/words.json' with { type: 'json' };
import { SKIN, part } from '../src/roblox.js';
import { buildClassroom, buildSchoolFront } from '../src/rooms.js';
import { Actor, POSES } from '../src/actors.js';
import { MAIN } from '../src/cast.js';
import { createCaptions } from '../src/captions.js';
import { lightingMood } from '../src/lighting.js';
import { ease } from '../src/anim.js';
import * as P from '../src/props.js';

// ---- timing ------------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function W(line, word, n = 0) {
  let c = 0;
  for (const w of words) if (w.line === line && norm(w.word) === norm(word) && c++ === n) return w.start;
  throw new Error(`word "${word}" #${n} not in line ${line}`);
}
const END = words.at(-1).end + 0.6; // end right on the punchline
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const sm = (u) => ease('Sine', 'InOut', u);

const CLASS1 = W(1, 'So') - 0.08; // front -> classroom (brutal honesty)
const SIDEWALK = W(1, 'My', 1) - 0.08; // classroom -> grandma on the sidewalk
const ME = W(2, 'Then') - 0.08; // sidewalk -> classroom (me at 99)
const HALL = W(5, 'So') - 0.08; // classroom -> hallway
const CUTS = [CLASS1, SIDEWALK, ME, HALL];

const TICK_LIAR = W(0, 'lie'); // 12 -> 13
const TICK_100 = W(0, 'hundred') + 0.15; // 99 -> 100
const POOF = W(0, 'disappear') + 0.05;
const TICK_HER = W(14, 'one'); // 0 -> 1: the twist

// ---- places ------------------------------------------------------------------------------
const C = new THREE.Vector3(3000, 0, 0); // classroom; its hallway is local x 18.5..32
const F = new THREE.Vector3(3600, 0, 0); // school front: road along x, sidewalk z 0..8

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  crush: { shirt: 'shirt-cottage-core-fairy-vintage', pants: 'pants-preppy-cottage-core-vintage', hair: 'hair-brown-wavy-ponytail', skin: SKIN.nougat },
  teacher: { shirt: 'shirt-grey-suit-black-vest', pants: 'pants-grey-suit-black-vest', hair: 'hair-business-comb-over', skin: SKIN.brown },
  grandma: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-dark-pants', hair: 'hair-silver-locks', skin: SKIN.lightOrange },
  mail: { shirt: 'shirt-mail-carrier', pants: 'pants-mail-shorts', hair: 'hair-black-short-parted', skin: SKIN.nougat },
  liar: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-gray-sweatpants', hair: 'hair-360-waves-fade', skin: SKIN.darkOrange },
  liarPal: { shirt: 'shirt-blue-stripe-shirt-neck', pants: 'pants-dark-pants', hair: 'hair-brown-side-sweep', skin: SKIN.porcelain },
  kid99: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-jeans-stars', hair: 'hair-black-messy', skin: SKIN.tan },
  kid99Pal: { shirt: 'shirt-vintage-flannel-button-up', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-afro-puff', skin: SKIN.deep },
  haircut: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-jeans-stars', hair: 'hair-black-short-layered-bob', skin: SKIN.pastelBrown },
  noGuy: { shirt: 'shirt-mu-red-flannel-black', pants: 'pants-kestrel-khaki-textured-pants', hair: 'hair-black-swept', skin: SKIN.reddishBrown },
  dinnerAsk: { shirt: 'shirt-grey-knitted-sweater-chain', pants: 'pants-ripped-black-jeans-mu', hair: 'hair-brown-messy', skin: SKIN.lightOrange },
  dinnerAns: { shirt: 'shirt-sweter-galaxy-blue-100', pants: 'pants-cargo-pants-grey-black', hair: 'hair-high-top-fade', skin: SKIN.brown },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-crimson-red-shirt-black', 'shirt-sweter-galaxy-blue-100', 'shirt-blue-stripe-shirt-neck',
  'shirt-grey-knitted-sweater-chain', 'shirt-cutesy-pink-striped-sweater', 'shirt-thrifted-striped-polo', 'shirt-mu-red-flannel-black',
  'shirt-blue-essential-vest-kalcer', 'shirt-kawaii-soft-anime-school', 'shirt-school-boy', 'shirt-tech-fleece-red-hoodie', 'shirt-black-flannel-soft-trendy-2'];
const PANTS = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-jeans-stars', 'pants-gray-sweatpants', 'pants-cargo-pants-tan-beige', 'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-blonde-pigtails', 'hair-black-hime-short-straight',
  'hair-dejah-loc', 'hair-brown-side-sweep', 'hair-high-top-fade', 'hair-brown-fashion-model-side', 'hair-afro-puff', 'hair-california-girl-brown',
  'hair-messy-boy-black', 'hair-lazy-bun', 'hair-long-black', 'hair-black-middle-part', 'hair-short-wavy-black'];
const TONES = Object.values(SKIN);
const CROWD = HAIRS.map((hair, i) => ({ shirt: SHIRTS[(i * 5) % SHIRTS.length], pants: PANTS[(i * 4) % PANTS.length], hair, skin: TONES[(i * 4 + 1) % TONES.length] }));
const FACES = ['face-addon-blush', 'face-addon-sweat-drop', 'face-eyes-shocked', 'face-mouth-small-frown', 'face-worry-manga', 'face-terrified'];

// Everyone's lie count. Honest world: small numbers.
const COUNT = { me: 99, crush: 0, teacher: 4, grandma: 2, mail: 31, liar: 12, liarPal: 6, kid99: 99, kid99Pal: 9, haircut: 3, noGuy: 1, dinnerAsk: 7, dinnerAns: 2 };
const crowdCount = (i) => [3, 11, 0, 7, 24, 5, 2, 16, 9, 1, 13, 4, 6, 19, 8, 3][i % 16];

export const meta = {
  duration: Math.ceil(END * 30) / 30,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'happy', 'grin', 'smirk', 'suspicious', 'sad', 'angry'],
  accessories: [...new Set([...Object.values(CAST), ...CROWD].map((c) => c.hair).concat(FACES))],
  clothing: [...new Set([...Object.values(CAST), ...CROWD].flatMap((c) => [c.shirt, c.pants]))],
  audio: [],
};

// ---- sound -------------------------------------------------------------------------------
const sfx = (file, at, volume = 0.8, extra = {}) => meta.audio.push({ file, at, volume, ...extra });
sfx('../voice/liecounter/narration.flac', 0, 1.0);
// Background music: "Feeling Blue" (Caleb Arredondo), low under the voice.
sfx('feeling-blue.mp3', 0, 0.2, { dur: END, fade: 1.2 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
const tick = (at, v = 0.7) => {
  sfx('synth/pluck_E4.wav', at, v, { pitch: 7 });
  sfx('synth/pop.wav', at, v * 0.8);
};
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.35);
sfx('synth/ambience.wav', 0, 0.22, { loop: true, dur: CLASS1, fade: 0.3 });
tick(TICK_LIAR);
tick(TICK_100, 0.8);
sfx('synth/bloop_down.wav', POOF, 0.7);
sfx('synth/whoosh.wav', POOF, 0.5);
sfx('byee-rblx-byee-se.mp3', POOF + 0.35, 0.35, { pitch: 3 });
sfx('huh-rblx-se.mp3', W(1, 'No') + 0.45, 0.4);
sfx('bleh-rblx-se.mp3', W(1, 'Disgusting') + 0.55, 0.45);
sfx('gaspp.mp3', W(1, 'feet') - 0.1, 0.55, { pitch: -3 });
FAH(W(1, 'feet') + 0.4);
sfx('synth/slide_up.wav', W(2, 'ninetynine') - 0.1, 0.45);
for (const at of [W(3, 'Lie'), W(3, 'Lie', 1), W(3, 'We')]) sfx('synth/thud.wav', at, 0.7), sfx('synth/punch.wav', at, 0.35);
sfx('ahh-rblx-scared.mp3', W(4, 'gone') + 0.25, 0.4);
sfx('synth/ambience.wav', HALL, 0.3, { loop: true, dur: W(8, 'silent') - HALL, fade: 0.25 });
sfx('hi-rblx-se.mp3', W(5, 'anyone') - 0.3, 0.35);
sfx('gaspp.mp3', W(8, 'The') + 0.05, 0.4, { pitch: -2 });
sfx('synth/squeak.wav', W(9, 'shaking') + 0.1, 0.25);
sfx('synth/ambience.wav', W(12, 'The'), 0.3, { loop: true, dur: END - W(12, 'The'), fade: 0.6 });
sfx('yeaa-rblx-se.mp3', W(12, 'cheering') - 0.35, 0.7);
sfx('yeaa-rblx-se.mp3', W(12, 'cheering') - 0.2, 0.5, { pitch: 4 });
sfx('yeaa-rblx-se.mp3', W(12, 'cheering') - 0.05, 0.5, { pitch: -3 });
tick(TICK_HER, 0.9);
FAH(TICK_HER + 0.3);

// ---- blocking ----------------------------------------------------------------------------
// School front (F, local).
const LIAR = [-2.6, 3.0];
const LIAR_PAL = [-0.4, 3.0];
const K99 = [6.4, 2.4];
const K99_PAL = [8.6, 2.4];
const GRANDMA = [-15.2, 4.0];
const MAILMAN = [-13.0, 4.0];
// Classroom (C, local): students face -z and sit SEAT_DZ behind their desk.
const DESKS = [];
for (const z of [-3, 2, 7]) for (const x of [-10, -4, 1.5, 7]) DESKS.push([x, z]);
const SEAT_DZ = 1.05;
const MY_DESK = [1.5, -3];
const KID_DESKS = DESKS.filter((d) => d !== DESKS[2]);
const HAIRCUT = [-8.4, -8.6];
const NO_GUY = [-6.2, -8.6];
const DIN_ASK = [3.6, -8.6];
const DIN_ANS = [5.8, -8.6];
const TEACHER = [-7, -11.8];
// Hallway (C, local x 18.5..32).
const H_ME = [26.3, 14];
const H_CRUSH = [24.1, 14];
const H_CROWD = [[20.3, 16.5], [20.3, 19.5], [20.4, 22.5], [20.6, 25.5], [29.8, 17.5], [29.8, 20.5], [29.6, 23.5], [29.3, 26.5],
  [20.6, 3.5], [29.6, 4.2]];

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, place, position, look-at, fov, move seconds]. Keys glide into each other
// inside a place; a key in a new place is a cut (hidden by the dip to black).
const KEYS = [
  [0, F, [-1.5, 5.3, 11.4], [-1.5, 4.0, 3.0], 50, 0],
  [W(0, 'Hit') - 0.05, F, [7.5, 5.3, 10.9], [7.5, 4.0, 2.4], 50, 0.55],
  [W(0, 'disappear') + 0.2, F, [7.4, 5.6, 11.6], [7.4, 3.8, 2.4], 52, 0.6],

  [CLASS1, C, [-7.3, 5.3, -0.2], [-7.3, 4.0, -8.6], 50, 0],
  [W(1, 'How') - 0.1, C, [4.7, 5.3, -0.2], [4.7, 4.0, -8.6], 50, 0.55],

  [SIDEWALK, F, [-14.1, 5.2, 12.4], [-14.1, 4.0, 4.0], 50, 0],

  [ME, C, [11.5, 7.6, -12.0], [1.5, 3.6, -1.5], 50, 0],
  [W(2, "I'm"), C, [2.6, 5.4, -9.6], [1.5, 4.2, -1.95], 46, 0.6],
  [W(3, 'Santa') - 0.05, C, [2.8, 5.6, -10.4], [1.4, 4.6, -2.0], 54, 0.5],
  [W(4, 'One'), C, [2.0, 5.0, -7.4], [1.5, 3.9, -1.95], 44, 0.6],

  [HALL, C, [25.6, 5.6, 4.0], [26.0, 4.0, 20], 50, 0],
  [W(6, 'Then'), C, [25.2, 5.4, 5.6], [25.2, 4.3, 14], 50, 0.6],
  [W(6, 'Her'), C, [28.2, 5.3, 8.8], [24.1, 4.5, 14], 44, 0.5],
  [W(7, 'She'), C, [27.8, 5.4, 9.0], [24.4, 4.4, 14.2], 48, 0.6],
  [W(8, 'The'), C, [25.2, 10.5, 1.0], [25.2, 3.6, 18], 58, 0.5],
  [W(8, 'Everyone'), C, [21.0, 5.6, 9.2], [26.3, 4.7, 14], 44, 0.7],
  [W(9, 'My'), C, [21.3, 5.3, 9.6], [26.3, 4.4, 14], 44, 0.5],
  [W(10, 'So'), C, [25.2, 5.4, 5.6], [25.2, 4.3, 14], 50, 0.6],
  [W(11, 'The'), C, [21.4, 5.5, 9.4], [26.3, 4.7, 14], 42, 0.5],
  [W(12, 'The') - 0.1, C, [25.2, 9.0, 2.0], [25.2, 3.8, 18], 56, 0.5],
  [W(13, 'She'), C, [28.2, 5.3, 8.8], [24.1, 4.4, 14], 44, 0.6],
  [W(14, 'And'), C, [27.6, 5.4, 9.6], [24.1, 4.7, 14], 42, 0.9],
].map(([t, o, pos, look, fov, move]) => ({ t, o, pos, look, fov, move }));

// ---- props -------------------------------------------------------------------------------
/** A Roblox BillboardGui-style number over a character's head. */
function counter() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.45, 0.72, 1);
  sprite.position.y = 3.0; // above the hair (root is the torso centre)
  sprite.renderOrder = 3;
  let shown = null;
  sprite.userData.show = (n) => {
    if (n === shown) return;
    shown = n;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    const color = n >= 90 ? '#ff3b30' : n >= 50 ? '#ffd21f' : '#ffffff';
    P.drawText(ctx, String(n), 128, 66, 240, 104, { color, stroke: '#111', strokeW: 14 });
    tex.needsUpdate = true;
  };
  return sprite;
}

/** Sparkles bursting out where someone vanished. */
function poofBurst(a) {
  const g = new THREE.Group();
  const bits = [];
  for (let k = 0; k < 18; k++) {
    const m = part(a, [0.28, 0.28, 0.28], [0, 0, 0], [0xffffff, 0xffd21f, 0x80bbdc][k % 3], 'Neon', { shadows: false });
    const th = (k / 18) * Math.PI * 2;
    bits.push({ m, dir: new THREE.Vector3(Math.cos(th), 0.6 + (k % 4) * 0.35, Math.sin(th)).normalize(), spin: k });
    g.add(m);
  }
  g.userData.at = (u) => {
    g.visible = u > 0 && u < 1;
    for (const b of bits) {
      b.m.position.copy(b.dir).multiplyScalar(0.4 + 3.2 * ease('Quad', 'Out', u));
      b.m.position.y += 3 - 1.2 * u * u;
      b.m.scale.setScalar(Math.max(0.01, 1 - u));
      b.m.rotation.set(u * 6 + b.spin, u * 4, 0);
    }
  };
  return g;
}

/** A floating speech card with one of my lies, and a red LIE stamp. */
function lieCard(a, text) {
  const g = new THREE.Group();
  g.add(P.sign(a, 3.0, 1.1, text, { bg: '#ffffff', fg: '#1b2a35', size: 105, border: '#1b2a35' }));
  const stamp = P.sign(a, 1.3, 0.62, 'LIE', { bg: '#e53935', fg: '#ffffff', size: 150, border: '#7f0000' });
  stamp.position.set(0.95, -0.55, 0.18);
  stamp.rotation.z = -0.22;
  g.add(stamp);
  g.userData.stamp = stamp;
  return g;
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  const { door } = buildClassroom(scene, assets, C, { desks: DESKS, seatDz: SEAT_DZ, seed: 7 });
  door.rotation.y = 0;
  buildSchoolFront(scene, assets, F);

  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45;
  sc.right = sc.top = 45;
  sc.updateProjectionMatrix();
  function light(mood, o, x, z, sunFrom) {
    lightingMood(scene, sun, mood);
    sun.target.position.set(o.x + x, 0, o.z + z);
    sun.position.set(o.x + x + sunFrom[0], sunFrom[1], o.z + z + sunFrom[2]);
  }

  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), ...crowd];
  for (const a of everyone) scene.add(a.root);
  // Number over every head.
  const num = new Map();
  for (const [k, a] of Object.entries(A)) {
    const s = counter();
    s.userData.show(COUNT[k]);
    a.root.add(s);
    num.set(a, s);
  }
  crowd.forEach((a, i) => {
    const s = counter();
    s.userData.show(crowdCount(i));
    a.root.add(s);
    num.set(a, s);
  });

  const burst = poofBurst(assets);
  scene.add(burst);
  const cards = ['SANTA IS REAL', 'I DID MY\nHOMEWORK', 'THE DOG\nATE IT'].map((text) => {
    const g = lieCard(assets, text);
    scene.add(g);
    return g;
  });
  const CARD_TIMES = [
    [W(3, 'Santa') - 0.1, W(3, 'Lie')],
    [W(3, 'My') - 0.05, W(3, 'Lie', 1)],
    [W(3, 'The') - 0.05, W(3, 'We')],
  ];

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  const at = (o, who, x, z, { hold = [], ...opts } = {}) => {
    who.set({ at: [o.x + x, o.z + z], ...opts });
    for (const h of hold) who.hold(h);
  };
  const yawTo = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;

  function cameraAt(t) {
    let i = 0;
    while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
    const cur = KEYS[i];
    const next = KEYS[i + 1];
    let { pos, look, fov } = cur;
    if (next && next.o === cur.o && t > next.t - next.move) {
      const u = sm(seg(t, next.t - next.move, next.t));
      pos = pos.map((v, k) => lerp(v, next.pos[k], u));
      look = look.map((v, k) => lerp(v, next.look[k], u));
      fov = lerp(fov, next.fov, u);
    }
    const held = t - cur.t;
    const o = cur.o;
    camera.position.set(o.x + pos[0] + Math.sin(held * 0.5) * 0.08, pos[1] + 0.009 * held, o.z + pos[2]);
    camera.lookAt(o.x + look[0], look[1], o.z + look[2]);
    camera.fov = fov - Math.min(3, held * 0.18);
    camera.updateProjectionMatrix();
  }

  const faceOf = (i, opts) => opts[i % opts.length];
  // A pulse that makes a number swell and glow when it changes (or when it's in danger).
  const pop = (sprite, t, when, glow = 1) => {
    const u = seg(t, when, when + 0.35);
    const k = u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0;
    sprite.scale.set(1.45 * (1 + 0.45 * k), 0.72 * (1 + 0.45 * k), 1);
    sprite.material.color.setScalar(1 + glow * 2.2 * k);
  };
  const rest = (sprite) => {
    sprite.scale.set(1.45, 0.72, 1);
    sprite.material.color.setScalar(1);
  };

  const touchHair = (t) => {
    const p = POSES.talk(t, 3);
    p.rArm = [-150, 0, -30];
    p.rElbow = [-95, 30, 0];
    p.neck = [-4, 10, 6];
    return p;
  };
  const seated = (t, s) => {
    const p = POSES.sit();
    p.lift = 1.75 - 2;
    p.neck = POSES.idle(t, s).neck;
    p.rArm = [-50, 0, 6];
    p.lArm = [-50, 0, -6];
    p.rElbow = [-35, 0, 0];
    p.lElbow = [-35, 0, 0];
    return p;
  };

  // ---- the front of the school: the rule ---------------------------------------------
  function front(t) {
    // The liar tells his friend something; his number ticks up.
    let lp = POSES.talk(t);
    let lf = 'grin';
    if (t > TICK_LIAR) (lf = ['smirk', 'face-addon-sweat-drop']), (lp = POSES.idle(t));
    at(F, A.liar, ...LIAR, { yaw: 50, pose: lp, face: lf });
    num.get(A.liar).userData.show(t > TICK_LIAR ? COUNT.liar + 1 : COUNT.liar);
    pop(num.get(A.liar), t, TICK_LIAR);
    at(F, A.liarPal, ...LIAR_PAL, { yaw: -50, pose: t > TICK_LIAR ? POSES.crossArms(t, 2) : POSES.idle(t, 2), face: t > TICK_LIAR + 0.2 ? 'suspicious' : 'neutral' });

    // The kid at 99 slips: 100, and he's gone.
    const k = num.get(A.kid99);
    k.userData.show(t > TICK_100 ? 100 : 99);
    pop(k, t, TICK_100, 1.6);
    if (t < POOF + 0.32) {
      const u = seg(t, POOF, POOF + 0.32);
      let pose = POSES.talk(t, 4);
      let face = 'grin';
      if (t > TICK_100) (pose = POSES.shocked(t, 4)), (face = ['face-terrified', 'face-addon-sweat-drop']);
      at(F, A.kid99, ...K99, { yaw: 50 + 540 * u * u, size: Math.max(0.01, 1 - u), pose, face });
    }
    burst.position.set(F.x + K99[0], 0, F.z + K99[1]);
    burst.userData.at(seg(t, POOF + 0.1, POOF + 1.1));
    let pp = POSES.idle(t, 5);
    let pf = 'neutral';
    if (t > TICK_100) (pp = POSES.shocked(t, 5)), (pf = ['face-eyes-shocked', 'face-mouth-small-frown']);
    at(F, A.kid99Pal, ...K99_PAL, { yaw: -50, pose: pp, face: pf });

    // Background: kids on the lawn and sidewalk.
    [[-9, -3], [-6.5, -5.5], [3.5, -4.5], [12.5, -2.5], [-12, 1.5], [15, -6]].forEach(([x, z], i) =>
      at(F, crowd[i], x, z, { yaw: ((i * 53) % 120) - 60, pose: i % 3 === 0 ? POSES.talk(t, i) : POSES.idle(t, i), face: faceOf(i, ['happy', 'neutral', 'smirk']) }));
  }

  // ---- the classroom: brutal honesty -------------------------------------------------
  function honesty(t) {
    const asked = W(1, 'No');
    let hp = touchHair(t);
    let hf = 'happy';
    if (t > asked) (hp = POSES.idle(t, 3)), (hf = ['sad', 'face-mouth-small-frown']);
    at(C, A.haircut, ...HAIRCUT, { yaw: 50, pose: hp, face: hf });
    at(C, A.noGuy, ...NO_GUY, { yaw: -50, pose: t > asked - 0.1 ? POSES.crossArms(t, 5) : POSES.idle(t, 5), face: t > asked - 0.1 ? 'neutral' : 'suspicious' });
    const disgust = W(1, 'Disgusting');
    at(C, A.dinnerAsk, ...DIN_ASK, { yaw: 50, pose: t > disgust ? POSES.shocked(t, 6) : POSES.talk(t, 6), face: t > disgust ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'happy' });
    let dp = POSES.idle(t, 7);
    let df = 'neutral';
    if (t > disgust - 0.1) (dp = POSES.talk(t, 7)), (dp.neck[0] -= 8), (df = 'angry');
    at(C, A.dinnerAns, ...DIN_ANS, { yaw: -50, pose: dp, face: df });
    seatClass(t, [0, 1, 2, 3]);
  }

  // Classmates in their seats (skipping the front-row desks listed in `empty`).
  function seatClass(t, empty = []) {
    KID_DESKS.forEach(([x, z], i) => {
      if (empty.includes(DESKS.indexOf(KID_DESKS[i]))) return;
      at(C, crowd[i], x, z + SEAT_DZ, { yaw: 180, pose: seated(t, i), face: faceOf(i, ['neutral', 'happy', 'neutral', 'suspicious']) });
    });
  }

  // ---- the sidewalk: grandma and the mailman ------------------------------------------
  function sidewalk(t) {
    const feet = W(1, 'feet');
    let gp = POSES.talk(t, 2);
    if (t > W(1, 'smells')) (gp = POSES.point(t, 2)), (gp.neck = [-6, 0, 0]);
    at(F, A.grandma, ...GRANDMA, { yaw: 50, pose: gp, face: t > W(1, 'smells') ? 'smirk' : 'happy' });
    let mp = POSES.idle(t, 3);
    mp.rArm = [-55, 0, 10];
    mp.rElbow = [-60, 0, 0];
    let mf = 'happy';
    if (t > feet - 0.15) (mp = POSES.shocked(t, 3)), (mf = ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop']);
    at(F, A.mail, ...MAILMAN, { yaw: -50, pose: mp, face: mf });
  }

  // ---- the classroom: me at 99 ------------------------------------------------------------
  function myDesk(t) {
    seatClass(t);
    KID_DESKS.forEach(([x], i) => (num.get(crowd[i]).visible = x !== MY_DESK[0])); // keep my number clear
    const tp = POSES.idle(t);
    tp.rArm = [-150 + 8 * Math.sin(t * 6), 0, 10]; // writing on the board
    tp.rElbow = [-20, 0, 0];
    at(C, A.teacher, ...TEACHER, { yaw: 180, pose: tp, face: 'neutral' });
    let pose = seated(t, 0);
    let face = 'suspicious';
    if (t > W(2, "I'm")) face = ['sad', 'face-addon-sweat-drop'];
    if (t > W(3, 'Santa')) face = ['smirk', 'face-addon-blush', 'face-addon-sweat-drop'];
    if (t > W(3, 'We')) face = ['face-eyes-shocked', 'face-addon-blush'];
    if (t > W(4, 'One')) {
      pose = seated(t, 0);
      pose.rArm = [-50 + 3 * Math.sin(t * 40), 0, 6];
      pose.lArm = [-50 - 3 * Math.sin(t * 37), 0, -6];
      pose.neck = [-4, 0, 0];
      face = ['face-terrified', 'face-addon-sweat-drop'];
    }
    at(C, A.me, MY_DESK[0], MY_DESK[1] + SEAT_DZ, { yaw: 180, pose, face });
    const s = num.get(A.me);
    pop(s, t, W(2, 'ninetynine'), 1.2);
    if (t > W(4, 'One')) {
      const k = 0.5 + 0.5 * Math.sin(t * 9);
      s.scale.set(1.45 * (1 + 0.15 * k), 0.72 * (1 + 0.15 * k), 1);
      s.material.color.setScalar(1 + 1.8 * k);
    }
    // My lies, one card at a time over my head, each stamped LIE.
    cards.forEach((g, i) => {
      const [show, stamp] = CARD_TIMES[i];
      const hide = i < 2 ? CARD_TIMES[i + 1][0] : W(4, 'One') - 0.1;
      g.visible = t > show && t < hide;
      if (!g.visible) return;
      const grow = ease('Back', 'Out', seg(t, show, show + 0.25));
      g.scale.setScalar(Math.max(0.01, grow));
      g.position.set(C.x + MY_DESK[0] - 0.1, 7.2, C.z + MY_DESK[1] + SEAT_DZ - 0.6);
      g.lookAt(camera.position);
      const st = g.userData.stamp;
      st.visible = t > stamp;
      st.scale.setScalar(t > stamp ? lerp(2.2, 1, ease('Quad', 'Out', seg(t, stamp, stamp + 0.15))) : 1);
    });
  }

  // ---- the hallway: the crush -------------------------------------------------------------
  function hallway(t) {
    const stop = W(6, 'Then');
    // Me: walking in with my hand over my mouth, then facing her.
    let pos = H_ME;
    let yaw = -130;
    let pose = POSES.idle(t);
    let face = ['neutral', 'face-addon-sweat-drop'];
    if (t < stop) {
      const u = seg(t, HALL, stop - 0.1);
      pos = [lerp(26.0, H_ME[0], u), lerp(27, H_ME[1], u)];
      yaw = 180;
      pose = u < 1 ? POSES.walk(t, 0, 32, 1.6) : POSES.idle(t);
      pose.rArm = [-55, 0, 22];
      pose.rElbow = [-112, 20, 0];
    } else {
      yaw = lerp(180, 230, sm(seg(t, stop, stop + 0.5)));
    }
    if (t > W(6, 'Her')) face = ['face-eyes-shocked', 'face-addon-blush'];
    if (t > W(7, 'Do')) (face = ['face-terrified', 'face-addon-blush', 'face-addon-sweat-drop']), (pose = POSES.shocked(t));
    if (t > W(8, 'The')) (pose = POSES.idle(t)), (face = ['face-worry-manga', 'face-addon-sweat-drop']);
    if (t > W(9, 'My')) {
      pose = POSES.idle(t);
      const j = Math.sin(t * 45);
      pose.rArm = [-38 + 4 * j, 0, 14];
      pose.lArm = [-38 - 4 * j, 0, -14];
      pose.rElbow = [-62, 18, 0];
      pose.lElbow = [-62, -18, 0];
      face = ['face-terrified', 'face-addon-sweat-drop'];
    }
    if (t > W(10, 'So')) (pose = POSES.shy(t)), (face = ['sad', 'face-addon-blush']);
    if (t > W(10, 'Yes')) (pose = POSES.shy(t)), (face = ['happy', 'face-addon-blush']);
    if (t > W(11, 'The')) (pose = POSES.idle(t)), (face = ['face-eyes-shocked', 'face-addon-sweat-drop']);
    if (t > W(11, 'ninetynine')) (pose = POSES.idle(t)), (face = ['happy', 'face-addon-blush']);
    if (t > W(12, 'cheering') - 0.2) (pose = POSES.cheer(t)), (face = 'grin');
    if (t > W(13, 'She')) (pose = POSES.shy(t)), (face = ['happy', 'face-addon-blush']);
    if (t > TICK_HER) (pose = POSES.shocked(t)), (face = ['face-eyes-shocked', 'face-mouth-small-frown']);
    at(C, A.me, ...pos, { yaw, pose, face });
    const mine = num.get(A.me);
    rest(mine);
    if (t > W(8, 'Everyone') && t < W(12, 'The')) {
      const k = 0.5 + 0.5 * Math.sin(t * 8);
      mine.scale.set(1.45 * (1 + 0.12 * k), 0.72 * (1 + 0.12 * k), 1);
      mine.material.color.setScalar(1 + 1.4 * k);
    }

    // The crush walks up from the classroom door.
    if (t > stop - 0.6) {
      const u = seg(t, stop - 0.6, W(6, 'hallway') + 0.2);
      const cpos = [lerp(19.4, H_CRUSH[0], u), lerp(10.2, H_CRUSH[1], u)];
      let cp = u < 1 ? POSES.walk(t, 1, 30, 1.6) : POSES.idle(t, 1);
      let cf = 'happy';
      if (t > W(6, "She's")) (cp = POSES.shy(t, 1)), (cf = ['happy', 'face-addon-blush']);
      if (t > W(7, 'asked')) (cp = POSES.shy(t, 1)), (cf = ['neutral', 'face-addon-blush']);
      if (t > W(8, 'The')) cp = POSES.idle(t, 1);
      if (t > W(10, 'Yes')) cf = ['face-eyes-shocked', 'face-addon-blush'];
      if (t > W(12, 'cheering') - 0.2) (cp = POSES.idle(t, 1)), (cf = ['happy', 'face-addon-blush']);
      if (t > W(13, 'smiled')) (cp = POSES.shy(t, 1)), (cf = ['happy', 'face-addon-blush']);
      if (t > TICK_HER) (cp = POSES.idle(t, 1)), (cf = ['smirk', 'face-addon-sweat-drop']);
      at(C, A.crush, ...cpos, { yaw: u < 1 ? yawTo([19.4, 10.2], H_CRUSH) : 130, pose: cp, face: cf });
      const hers = num.get(A.crush);
      hers.userData.show(t > TICK_HER ? 1 : 0);
      rest(hers);
      pop(hers, t, TICK_HER, 1.4);
    }

    // The hallway: everyone stops and stares at my number; then cheers.
    H_CROWD.forEach(([x, z], i) => {
      const c = crowd[(i + 4) % crowd.length];
      const watching = t > W(6, 'Then');
      const yaw = watching ? yawTo([x, z], [25.2, 14]) : x < 25 ? 90 + (i % 3) * 25 : -90 - (i % 3) * 25;
      let p = i % 4 === 1 ? POSES.talk(t, i) : POSES.idle(t, i);
      let f = faceOf(i, ['neutral', 'happy', 'smirk']);
      if (!watching && i === 2 && t > W(5, 'anyone') - 0.5) (p = POSES.wave(t, i)), (f = 'happy');
      if (t > W(7, 'Do')) (p = POSES.idle(t, i)), (f = faceOf(i, ['face-eyes-shocked', 'suspicious', 'face-eyes-shocked']));
      if (t > W(8, 'Everyone')) f = faceOf(i, ['face-eyes-shocked', 'face-worry-manga', 'suspicious']);
      if (t > W(12, 'cheering') - 0.3) (p = i % 3 === 0 ? POSES.cheer(t, i) : i % 3 === 1 ? POSES.chant(t, i) : POSES.wave(t, i)), (f = faceOf(i, ['happy', 'grin']));
      if (t > TICK_HER) f = faceOf(i, ['face-eyes-shocked', 'happy', 'face-eyes-shocked']);
      at(C, c, x, z, { yaw, pose: p, face: f });
    });
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    for (const g of cards) g.visible = false;
    burst.visible = false;
    for (const s of num.values()) rest(s), (s.visible = true);
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    cameraAt(t);
    if (t < CLASS1) {
      light('day', F, 0, 0, [30, 60, 40]);
      front(t);
    } else if (t < SIDEWALK) {
      light('interior', C, -2, -4, [-70, 45, 18]);
      honesty(t);
    } else if (t < ME) {
      light('day', F, -14, 0, [30, 60, 40]);
      sidewalk(t);
    } else if (t < HALL) {
      light('interior', C, 0, -2, [-70, 45, 18]);
      myDesk(t);
    } else {
      light('interior', C, 25, 12, [-70, 45, 18]);
      hallway(t);
    }
    captions(t);
  };
}
