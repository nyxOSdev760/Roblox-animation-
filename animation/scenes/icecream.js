// "Ice Cream" — a Roblox story Short. Narration and word timings: assets/voice/icecream
// (tools/narrate.py, tools/align.py); script: scripts/icecream.md.
//
// Four places: the school hallway (the brag and the dare), the bedroom at night (begging dad),
// the front of the school (the truck, the lunchbox, the line around the building, sunset) and
// the hallway again the next morning. Inside a place the camera glides between framings; the
// jumps between places are quick dips to black.
import * as THREE from 'three';
import words from '../../assets/voice/icecream/words.json' with { type: 'json' };
import { BRICK, SKIN, part } from '../src/roblox.js';
import { buildClassroom, buildBedroom, buildSchoolFront, iceCreamTruck } from '../src/rooms.js';
import { Actor, POSES } from '../src/actors.js';
import { createCaptions } from '../src/captions.js';
import { ease } from '../src/anim.js';
import { rng } from '../src/world.js';
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

const NIGHT = W(3, 'That') - 0.08; // hallway -> bedroom
const DAY = W(4, 'The') - 0.08; // bedroom -> school front
const SUNSET = W(13, 'By') - 0.08; // the end of the day
const MORNING = W(15, 'The') - 0.08; // school front -> hallway
const CUTS = [NIGHT, DAY, SUNSET, MORNING];

// ---- places ------------------------------------------------------------------------------
const C = new THREE.Vector3(3000, 0, 0); // classroom; its hallway is local x 18.5..32
const B = new THREE.Vector3(3000, 0, 400); // bedroom
const F = new THREE.Vector3(3600, 0, 0); // school front: road along x, sidewalk z 0..8

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: { shirt: 'shirt-black-flannel-soft-trendy', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-messy-popular-boy-black', skin: SKIN.tan },
  dad: { shirt: 'shirt-white-chef-jacket', pants: 'pants-dark-tan-khakis-off', hair: 'hair-black-balding-man', skin: SKIN.tan },
  friend: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-gray-sweatpants', hair: 'hair-360-waves-fade', skin: SKIN.darkOrange },
  crush: { shirt: 'shirt-pastel-pink-axolotl-school', pants: 'pants-denim-star-belt-skirt', hair: 'hair-blonde-wavy-ponytail', skin: SKIN.porcelain },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-black-short-sleeve-tee', 'shirt-th-denim-jacket-floral', 'shirt-sweter-galaxy-blue-100',
  'shirt-blue-stripe-shirt-neck', 'shirt-white-shirt', 'shirt-grey-knitted-sweater-chain', 'shirt-avocado',
  'shirt-cutesy-pink-striped-sweater', 'shirt-thrifted-striped-polo', 'shirt-mu-red-flannel-black',
  'shirt-peach-essential-vest-kalcer', 'shirt-blue-essential-vest-kalcer', 'shirt-grey-button-up-undershirt',
  'shirt-kawaii-soft-anime-school', 'shirt-school-boy'];
const PANTS = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-pink-trendy-girls-casual', 'pants-jeans-stars', 'pants-khaki-distressed-jorts-f', 'pants-gray-sweatpants', 'pants-cargo-pants-tan-beige',
  'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-blonde-pigtails', 'hair-short-wolf-cut-ginger',
  'hair-black-hime-short-straight', 'hair-dejah-loc', 'hair-brown-side-sweep', 'hair-split-bangs-blonde', 'hair-high-top-fade', 'hair-black-messy',
  'hair-brown-fashion-model-side', 'hair-afro-puff', 'hair-black-wolf-cut', 'hair-california-girl-brown', 'hair-messy-boy-black', 'hair-pixie-cut',
  'hair-black-short-parted', 'hair-blonde-messy', 'hair-brown-messy', 'hair-lazy-bun', 'hair-long-black', 'hair-soho-brown-curly', 'hair-black-swept',
  'hair-layered-fringe', 'hair-brown-wavy-ponytail', 'hair-black-middle-part', 'hair-fluffy-ponytail-brown', 'hair-short-wavy-black', 'hair-faded-edgar-cut'];
const TONES = Object.values(SKIN);
const N_CROWD = HAIRS.length;
const CROWD = Array.from({ length: N_CROWD }, (_, i) => ({
  shirt: SHIRTS[(i * 7) % SHIRTS.length], pants: PANTS[(i * 5) % PANTS.length], hair: HAIRS[i], skin: TONES[(i * 4 + 2) % TONES.length],
}));
const FACES = ['face-addon-blush', 'face-addon-sweat-drop', 'face-addon-tears', 'face-eyes-shocked', 'face-mouth-small-frown',
  'face-about-to-cry', 'face-worry-manga', 'face-terrified'];

export const meta = {
  duration: Math.ceil(END * 30) / 30,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'happy', 'grin', 'smirk', 'suspicious', 'sad', 'crying', 'angry'],
  accessories: [...new Set([...Object.values(CAST), ...CROWD].map((c) => c.hair).concat(FACES))],
  clothing: [...new Set([...Object.values(CAST), ...CROWD].flatMap((c) => [c.shirt, c.pants]))],
  audio: [],
};

// ---- sound -------------------------------------------------------------------------------
const sfx = (file, at, volume = 0.8, extra = {}) => meta.audio.push({ file, at, volume, ...extra });
const TRUCK_GO = W(5, 'Then') + 0.15; // the truck starts down the street
const TRUCK_STOP = W(6, 'up') + 0.35;
const SILENT = W(9, 'Everyone');
sfx('../voice/icecream/narration.flac', 0, 1.0);
// No background music: the song is added in the YouTube app at upload.
// "FAHHH" right after each punchline.
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
FAH(W(8, 'LUNCHBOX') + 0.55);
FAH(W(11, 'price') + 0.45);
FAH(W(14, 'cut') + 0.4);
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.4);
sfx('woahh-rblx-se.mp3', W(0, 'Lamborghini') + 0.3, 0.55);
sfx('woahh-rblx-se.mp3', W(0, 'Lamborghini') + 0.4, 0.4, { pitch: 3 });
sfx('hmm-rblx-se.mp3', W(1, 'Prove') - 0.4, 0.45);
sfx('gaspp.mp3', W(2, 'froze') - 0.05, 0.6);
sfx('hahaha-rblx-se.mp3', W(3, 'laughed') - 0.05, 0.6, { pitch: -4 });
sfx('synth/ambience.wav', DAY, 0.3, { loop: true, dur: SUNSET - DAY, fade: 0.5 });
sfx('synth/truck_jingle.wav', W(5, 'Then') - 0.05, 0.75, { loop: true, dur: SILENT - W(5, 'Then') + 0.05, fade: 0.3, filter: "volume='min(1,0.1+0.9*t/3.2)':eval=frame" });
sfx('synth/truck_engine.wav', TRUCK_GO, 0.35, { dur: TRUCK_STOP - TRUCK_GO + 0.6, fade: 0.5 });
sfx('synth/brakes.wav', TRUCK_STOP - 0.75, 0.4);
sfx('synth/window_slide.wav', W(6, 'window') - 0.05, 0.7);
sfx('huh-rblx-se.mp3', W(7, 'dad') + 0.25, 0.45);
sfx('gaspp.mp3', W(9, 'covered') - 0.05, 0.75, { pitch: 3 });
sfx('sadd-rblx-se.mp3', W(9, 'disappear') + 0.1, 0.45);
sfx('synth/truck_jingle.wav', W(11, 'Half'), 0.5, { loop: true, dur: SUNSET - W(11, 'Half'), fade: 0.6 });
sfx('synth/cha_ching.wav', W(11, 'price') + 0.2, 0.6);
sfx('yeaa-rblx-se.mp3', W(12, 'ran') - 0.3, 0.7);
sfx('yeaa-rblx-se.mp3', W(12, 'ran') - 0.15, 0.5, { pitch: 4 });
sfx('yeaa-rblx-se.mp3', W(12, 'ran'), 0.5, { pitch: -3 });
sfx('roblox/action_footsteps_plastic.wav', W(12, 'ran'), 0.5, { dur: 1.6, fade: 0.4 });
sfx('synth/cha_ching.wav', W(13, 'five') - 0.1, 0.7);
sfx('synth/cha_ching.wav', W(13, 'dollars') + 0.1, 0.5);
sfx('synth/pop.wav', W(14, 'fifty') - 0.1, 0.6);
sfx('yeaa-rblx-se.mp3', W(15, 'Ice') - 0.2, 0.6);
sfx('yeaa-rblx-se.mp3', W(15, 'Ice') - 0.05, 0.45, { pitch: 4 });
sfx('synth/cha_ching.wav', W(16, 'rich') + 0.05, 0.75);

// ---- blocking ----------------------------------------------------------------------------
// Hallway (C, local): the kid against the lockers, his audience around him.
const H_ME = [28.4, 4];
const H_FRIEND = [24.6, 5.4];
const H_CROWD = [[26.4, 8.2], [24.3, 8.0], [22.6, 6.2], [22.3, 4.1], [26.2, 6.6]];
// Bedroom (B, local).
const R_ME = [2.5, 1.0];
const R_DAD = [6.6, 1.2];
// School front (F, local). The truck stops with its window at x -2..4 (centre 1).
const S_ME = [1, 1.0];
const S_FRIEND = [-1.6, 0.9];
const S_CRUSH = [-4.4, 0.2];
const TRUCK_Z = 11.8;
const WINDOW_X = 1;
const LINE = [[1.5, 7.1], [4, 6.4], [40, 5.6], [46, 1], [52, -8], [53.5, -20], [53.5, -70]];

function alongLine(d) {
  for (let k = 0; k + 1 < LINE.length; k++) {
    const [ax, az] = LINE[k];
    const [bx, bz] = LINE[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (d <= len || k + 2 === LINE.length) {
      const u = d / len;
      return { x: ax + (bx - ax) * u, z: az + (bz - az) * u, yaw: (Math.atan2(ax - bx, az - bz) * 180) / Math.PI };
    }
    d -= len;
  }
}

// Where the crowd waits out front, spaced out on the sidewalk and lawn.
const WAIT = (() => {
  const r = rng(21);
  const out = [];
  const taken = [S_ME, S_FRIEND, S_CRUSH, [18, -3]];
  while (out.length < N_CROWD) {
    const p = [-18 + r() * 36, -6 + r() * 12];
    if (p[0] > 9 && p[0] < 17 && p[1] > 0.5 && p[1] < 3.5) continue; // bike rack
    if (p[0] > -7 && p[0] < 7.5 && p[1] > -1.6) continue; // keep the camera lane in front of the main three clear
    if ([...taken, ...out].some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2.3)) continue;
    out.push(p);
  }
  return out;
})();

// ---- props -------------------------------------------------------------------------------
function bill(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.55, 0.95, 0.04], [0, 0, 0], 0x6fbf73, 'Plastic', { shadows: false }));
  g.add(part(a, [0.4, 0.75, 0.05], [0, 0, 0], 0x4f9f58, 'Plastic', { shadows: false }));
  g.add(part(a, [0.22, 0.22, 0.06], [0, 0, 0], 0xd8f0c8, 'Plastic', { shadows: false }));
  return g;
}

function cashFan(a) {
  const g = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const b = bill(a);
    b.position.set(0, 0.45, 0.01 * k);
    const pivot = new THREE.Group();
    pivot.add(b);
    pivot.rotation.z = (k - 2.5) * 0.28;
    g.add(pivot);
  }
  return g;
}

function cashStack(a) {
  const g = new THREE.Group();
  for (let k = 0; k < 8; k++) {
    const b = part(a, [0.95, 0.06, 0.55], [(k % 3) * 0.03, k * 0.065, (k % 2) * 0.03], k % 2 ? 0x6fbf73 : 0x5fae66, 'Plastic');
    g.add(b);
  }
  g.add(part(a, [0.2, 0.55, 0.57], [0, 0.26, 0], 0xf5cd30, 'Plastic', { shadows: false }));
  return g;
}

function lunchbox(a) {
  const g = new THREE.Group();
  g.add(part(a, [1.4, 1.0, 0.6], [0, 0, 0], 0x1e88e5, 'Plastic'));
  g.add(part(a, [1.42, 0.12, 0.62], [0, 0.2, 0], 0xf5cd30, 'Plastic'));
  g.add(part(a, [0.7, 0.12, 0.12], [0, 0.62, 0], BRICK.black, 'Plastic'));
  return g;
}

const sunsetSky = () => {
  const tex = P.canvasTexture(4, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5a4fa8');
    gr.addColorStop(0.45, '#f08a5d');
    gr.addColorStop(0.75, '#ffc27a');
    gr.addColorStop(1, '#ffe2a8');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  });
  return tex;
};

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, place, position, look-at, fov, move seconds]. Keys glide into each other
// inside a place; a key in a new place is a cut (hidden by the dip to black).
const KEYS = [
  [0, C, [22.0, 5.4, -0.6], [28.4, 4.0, 4], 42, 0],
  [W(0, 'said'), C, [29.7, 5.8, 0.8], [24.4, 3.8, 6.6], 56, 0.6],
  [W(1, 'Then'), C, [29.7, 5.2, 1.2], [24.6, 4.0, 5.4], 44, 0.6],
  [W(2, 'I'), C, [22.0, 5.2, 1.2], [28.4, 4.0, 4], 40, 0.5],
  [W(2, 'Everyone') + 0.1, C, [29.7, 5.4, 0.8], [24, 3.8, 6], 56, 0.6],
  [W(2, 'So'), C, [22.4, 5.2, -1.0], [28.4, 4.0, 4], 42, 0.5],

  [NIGHT, B, [4.6, 6.0, 9.6], [4.6, 3.3, 1.1], 60, 0],
  [W(3, 'He'), B, [0.6, 5.2, 4.8], [6.6, 4.3, 1.2], 40, 0.6],
  [W(3, "Don't"), B, [1.4, 5.2, 4.3], [6.6, 4.3, 1.2], 38, 0.5],
  [W(3, 'got') + 0.15, B, [8.6, 4.8, 4.6], [2.5, 3.1, 1.0], 40, 0.5],

  [DAY, F, [10, 8, 27], [0, 3.5, -1], 56, 0],
  [W(4, 'whole') + 0.5, F, [6, 7.5, 21], [0, 3.5, 0], 54, 1.2],
  [W(4, 'Even'), F, [-3.0, 4.9, 7.4], [-4.4, 3.9, 0.2], 40, 0.6],
  [W(5, 'Then'), F, [2.8, 5.0, 8.2], [1, 4.0, 1.0], 40, 0.6],
  [W(5, 'Ice') - 0.1, F, [-8, 4.5, 13.5], [30, 4, 12.5], 50, 0.7],
  [W(6, 'The') + 0.1, F, [-17, 8, 3.5], [0, 4, 6.5], 58, 0.7],
  [W(6, 'window') - 0.1, F, [4.2, 6.2, 2.0], [1, 6.0, 8.6], 42, 0.6],
  [W(7, 'It'), F, [3.0, 6.2, 3.4], [1, 6.0, 9.0], 38, 0.9],
  [W(8, 'leaned'), F, [3.8, 6.6, 2.2], [0.2, 6.6, 8.8], 52, 0.6],
  [SILENT, F, [-3.0, 7.2, 7.8], [0, 3.4, -2], 62, 0.6],
  [W(9, 'My'), F, [-3.0, 4.9, 7.4], [-4.4, 3.9, 0.2], 40, 0.5],
  [W(9, 'I'), F, [2.8, 5.0, 7.9], [1, 4.0, 1.0], 40, 0.5],
  [W(10, 'Then'), F, [0.8, 5.0, 7.9], [0.4, 4.0, 0.9], 48, 0.5],
  [W(11, 'My'), F, [3.4, 6.2, 2.6], [1, 6.0, 9.0], 38, 0.6],
  [W(12, 'The') + 0.05, F, [-18, 10, 14], [8, 2, 2], 58, 0.6],
  [W(12, 'line') - 0.1, F, [14, 40, 34], [32, 0, -6], 58, 1.0],
  [SUNSET, F, [3.4, 6.2, 2.2], [1, 5.8, 9.0], 40, 0],
  [W(14, 'He'), F, [-5.0, 5.6, 3.2], [1, 5.0, 6.6], 50, 0.6],
  [W(14, 'Your') - 0.05, F, [1.8, 5.6, -1.0], [1, 5.0, 6.5], 46, 0.5],

  [MORNING, C, [25, 5.6, 2], [25, 4.0, 22], 50, 0],
  [W(15, 'Ice'), C, [25, 5.2, 0.5], [25, 4.1, 12], 46, 1.0],
  [W(16, 'And'), C, [25.2, 5.2, 0.6], [25, 4.6, 9.0], 48, 0.8],
  [W(16, 'actually'), C, [25.1, 5.1, 1.6], [25, 4.6, 9.0], 44, 1.2],
].map(([t, o, pos, look, fov, move]) => ({ t, o, pos, look, fov, move }));

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  const { door } = buildClassroom(scene, assets, C, { desks: [], seed: 5 });
  door.rotation.y = 0;
  const room = buildBedroom(scene, assets, B);
  buildSchoolFront(scene, assets, F);
  const truck = iceCreamTruck(assets);
  scene.add(truck.root);

  // A paper sign on a locker for the next morning.
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.6),
    new THREE.MeshStandardMaterial({ map: P.canvasTexture(260, 160, (ctx, w, h) => {
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(0, 0, w, h);
      P.drawText(ctx, 'ICE CREAM', w / 2, h * 0.33, w * 0.9, 50, { color: '#ff4d8d' });
      P.drawText(ctx, 'BOY', w / 2, h * 0.72, w * 0.9, 56, { color: '#1e88e5' });
    }), roughness: 0.9 }),
  );
  sign.position.set(C.x + 29.93, 6.4, C.z + 12);
  sign.rotation.set(0, -Math.PI / 2, 0.06);
  scene.add(sign);

  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45;
  sc.right = sc.top = 45;
  sc.updateProjectionMatrix();
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  const daySky = scene.background;
  const dusk = sunsetSky();
  const fogDay = scene.fog.color.clone();
  function light(mood, o, x = 0, z = 0) {
    const night = mood === 'night';
    const eve = mood === 'sunset';
    sun.intensity = night ? 0.3 : eve ? 1.9 : 2.3;
    sun.color.set(night ? 0x9db4ff : eve ? 0xffa766 : 0xfff4e6);
    hemi.intensity = night ? 1.0 : eve ? 1.0 : 1.35;
    hemi.color.set(night ? 0xa4acd2 : eve ? 0xffc9a8 : 0xf4f2ee);
    hemi.groundColor.set(night ? 0x3a3550 : eve ? 0x8a6a5a : 0xa8a196);
    scene.environmentIntensity = night ? 0.05 : 0.12;
    scene.background = eve ? dusk : daySky;
    scene.fog.color.set(eve ? 0xf6b48a : fogDay);
    for (const l of room.lights) l.visible = night;
    sun.target.position.set(o.x + x, 0, o.z + z);
    if (eve) sun.position.set(o.x + x + 70, 28, o.z + z + 30);
    else sun.position.set(o.x + x + 30, 60, o.z + z + 40);
  }

  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), ...crowd];
  for (const a of everyone) scene.add(a.root);
  A.dad.attach('lunchbox', lunchbox(assets), 'r', [0, -0.75, 0], [Math.PI, 0, 0]);
  A.dad.attach('stack', cashStack(assets), 'l', [0, -0.3, 0], [Math.PI / 2, 0, 0]);
  A.dad.attach('bill', bill(assets), 'r', [0, -0.55, 0], [Math.PI / 2, 0, 0]);
  A.me.attach('bill', bill(assets), 'r', [0, -0.55, 0], [Math.PI / 2, 0, 0]);
  A.me.attach('fan', cashFan(assets), 'r', [0, -0.45, 0], [Math.PI / 2, 0, 0]);

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  // Place a character; `hold` lists hand props to show this frame (set() hides them all first).
  const at = (o, who, x, z, { hold = [], ...opts } = {}) => {
    who.set({ at: [o.x + x, o.z + z], ...opts });
    for (const h of hold) who.hold(h);
  };

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

  // ---- the hallway: the brag and the dare -------------------------------------------
  function hallway(t) {
    const lambo = W(0, 'said');
    const froze = W(2, 'I');
    let pose = POSES.talk(t);
    let face = 'grin';
    if (t > lambo && t < W(1, 'Then')) {
      pose = POSES.cheer(t);
      face = 'grin';
    }
    if (t > W(1, 'Then')) face = 'smirk';
    if (t > froze) {
      pose = POSES.idle(t);
      face = ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop'];
    }
    if (t > W(2, 'So')) {
      pose = POSES.crossArms(t);
      face = ['smirk', 'face-addon-sweat-drop'];
    }
    at(C, A.me, ...H_ME, { yaw: -90, pose, face });
    let fp = POSES.idle(t, 2);
    let ff = 'neutral';
    if (t > W(0, 'Lamborghini')) ff = 'suspicious';
    if (t > W(1, 'Then')) {
      fp = t < W(1, 'Prove') ? POSES.talk(t, 2) : POSES.point(t, 2);
      ff = 'smirk';
    }
    if (t > froze) fp = POSES.crossArms(t, 2);
    at(C, A.friend, ...H_FRIEND, { yaw: 95, pose: fp, face: ff });
    H_CROWD.forEach(([x, z], i) => {
      const c = crowd[i];
      const yaw = (Math.atan2(H_ME[0] - x, H_ME[1] - z) * 180) / Math.PI;
      let p = POSES.idle(t, i);
      let f = faceOf(i, ['neutral', 'happy', 'smirk']);
      if (t > W(0, 'Lamborghini') && t < W(1, 'Then')) (f = faceOf(i, ['face-eyes-shocked', 'happy', 'grin'])), (p = i % 2 ? POSES.shocked(t, i) : p);
      if (t > W(1, 'Prove')) f = faceOf(i, ['suspicious', 'smirk', 'neutral']);
      if (t > W(2, 'Everyone')) f = faceOf(i, ['suspicious', 'face-eyes-shocked', 'neutral']);
      at(C, c, x, z, { yaw, pose: p, face: f });
    });
  }

  // ---- the bedroom: begging dad ------------------------------------------------------
  function bedroom(t) {
    let kp = POSES.plead(t);
    let kf = ['sad', 'face-worry-manga'];
    if (t > W(3, 'got')) (kp = POSES.kneel(t)), (kf = ['happy', 'face-eyes-shocked']);
    at(B, A.me, ...R_ME, { yaw: 90, pose: kp, face: kf });
    let dp = POSES.idle(t);
    let df = 'neutral';
    if (t > W(3, 'He')) (dp = POSES.laugh(t)), (df = 'happy');
    if (t > W(3, 'Then')) (dp = POSES.talk(t)), (df = 'smirk');
    if (t > W(3, "Don't")) {
      dp = POSES.point(t);
      dp.rArm = [-100, 0, 20];
      df = 'smirk';
    }
    at(B, A.dad, ...R_DAD, { yaw: -90, pose: dp, face: df });
  }

  // ---- the school front --------------------------------------------------------------
  const truckX = (t) => 90 * (1 - ease('Quad', 'Out', seg(t, TRUCK_GO, TRUCK_STOP)));
  function placeTruck(t) {
    const tx = truckX(t);
    truck.root.position.set(F.x + tx, 0, F.z + TRUCK_Z);
    truck.root.rotation.y = Math.PI;
    for (const w of truck.wheels) w.rotation.z = -(90 - tx) / 1.15;
    const u = sm(seg(t, W(6, 'window') - 0.05, W(6, 'open') + 0.25));
    for (const p of truck.panes) p.position.x = lerp(p.userData.home, -5.6, u);
    return tx;
  }

  function dadInTruck(t, tx) {
    const reveal = W(6, 'window');
    // Inside the truck: truck-local (-1, 2) is world (tx + 1, TRUCK_Z - 2).
    let z = TRUCK_Z - 2.6;
    let pose = POSES.idle(t);
    let face = 'neutral';
    const hold = [];
    if (t > reveal) face = 'grin';
    if (t > W(8, 'leaned') && t < SUNSET) {
      const u = sm(seg(t, W(8, 'leaned'), W(8, 'yelled')));
      z = lerp(TRUCK_Z - 2.6, TRUCK_Z - 3.4, u);
      pose = POSES.holdOut(t);
      pose.rArm = [-165 + 10 * Math.sin(t * 7), 0, -6]; // waving the lunchbox over his head
      pose.pitch = 18 * u;
      face = t < W(9, 'Everyone') ? 'happy' : 'grin';
      hold.push('lunchbox');
      if (t > W(9, 'Everyone') && t < W(11, 'My')) face = 'neutral';
      if (t > W(11, 'My')) {
        pose = POSES.talk(t);
        pose.pitch = 12;
        face = 'grin';
      }
      if (t > W(12, 'The')) {
        // Serving the line.
        pose = POSES.idle(t);
        pose.rArm = [-90 + 25 * Math.sin(t * 6), 0, 4];
        pose.lArm = [-90 - 25 * Math.sin(t * 6), 0, -4];
        pose.pitch = 12;
        face = 'happy';
      }
    }
    if (t >= SUNSET) {
      z = TRUCK_Z - 3.2;
      pose = POSES.idle(t);
      pose.lArm = [-70, 0, -10];
      pose.rArm = [-75 + 12 * Math.abs(Math.sin(t * 9)), 0, 12];
      pose.pitch = 10;
      face = 'grin';
      hold.push('stack');
      if (t > W(14, 'handed') - 0.2) {
        pose.rArm = [-95, 0, 4];
        if (t < W(14, 'fifty') + 0.15) hold.push('bill');
        face = 'happy';
      }
    }
    at(F, A.dad, tx + WINDOW_X, z, { y: 1.9, yaw: 180, pose, face, hold });
  }

  function front(t) {
    const tx = placeTruck(t);
    dadInTruck(t, tx);
    const music = W(5, 'Then') + 0.2;
    const run = W(12, 'ran') - 0.2;
    const look = (x, z) => {
      // Neck turn (degrees) for someone facing +z to look at the truck.
      const dx = tx + WINDOW_X - x;
      return Math.max(-45, Math.min(45, (Math.atan2(dx, TRUCK_Z - z) * 180) / Math.PI));
    };
    if (t < SUNSET) {
      // The kid.
      let pose = POSES.idle(t);
      let face = ['neutral', 'face-addon-sweat-drop'];
      let pos = S_ME;
      let yaw = 0;
      if (t > music) pose.neck = [0, look(...S_ME), 0];
      if (t > W(6, 'The')) face = ['face-eyes-shocked', 'face-mouth-small-frown'];
      if (t > W(8, 'He')) (face = ['face-terrified', 'face-addon-blush', 'face-addon-sweat-drop']), (pose = POSES.shocked(t));
      if (t > SILENT) (face = ['sad', 'face-addon-blush', 'face-addon-sweat-drop']), (pose = POSES.shy(t));
      if (t > W(10, 'Wait')) (face = ['face-eyes-shocked', 'face-addon-blush']), (pose = POSES.idle(t));
      if (t > W(11, 'Half')) face = ['happy', 'face-addon-blush'];
      if (t > run) {
        pos = [-3.0, 4.6];
        yaw = 25;
        face = 'grin';
        pose = POSES.idle(t);
      }
      at(F, A.me, ...pos, { yaw, pose, face });

      // Crush and best friend.
      let cp = POSES.idle(t, 4);
      let cf = 'neutral';
      if (t > music) cp.neck = [0, look(...S_CRUSH) - 20, 0];
      if (t > W(8, 'He')) (cp = POSES.shocked(t, 4)), (cf = ['face-eyes-shocked', 'face-mouth-small-frown']);
      if (t > W(9, 'covered') - 0.1) {
        cp = POSES.idle(t, 4);
        cp.rArm = [-150, 0, -30];
        cp.lArm = [-150, 0, 30];
        cf = ['face-eyes-shocked', 'face-addon-blush'];
      }
      if (t > W(11, 'Half')) (cp = POSES.idle(t, 4)), (cf = 'happy');
      let fp = POSES.idle(t, 6);
      let ff = 'smirk';
      if (t > music) fp.neck = [0, look(...S_FRIEND), 0];
      if (t > W(8, 'He')) (fp = POSES.shocked(t, 6)), (ff = ['face-eyes-shocked', 'face-mouth-small-frown']);
      if (t > W(10, 'Then')) {
        fp = POSES.idle(t, 6);
        fp.pitch = 8;
        fp.neck = [10, -30, 0];
        ff = 'suspicious';
      }
      if (t > W(10, 'free') - 0.2) ff = 'grin';
      const friendPos = t > W(10, 'Then') ? [lerp(S_FRIEND[0], -0.3, seg(t, W(10, 'Then'), W(10, 'whispered'))), S_FRIEND[1]] : S_FRIEND;
      const friendYaw = t > W(10, 'Then') ? 50 : 10;

      // Everyone runs to the truck and lines up around the building.
      const slot = (k) => alongLine(k * 2.3);
      const runTo = (who, from, k, i, waitYaw, waitPose, waitFace) => {
        if (t < run) return at(F, who, ...from, { yaw: waitYaw, pose: waitPose, face: waitFace });
        const s = slot(k);
        const dist = Math.hypot(s.x - from[0], s.z - from[1]);
        const go = run + (i % 7) * 0.05;
        const u = seg(t, go, go + dist / 28);
        if (u < 1) {
          const yaw = (Math.atan2(s.x - from[0], s.z - from[1]) * 180) / Math.PI;
          return at(F, who, lerp(from[0], s.x, u), lerp(from[1], s.z, u), { yaw, pose: POSES.run(t, i), face: 'grin' });
        }
        const p = i % 4 === 0 ? POSES.cheer(t, i) : POSES.idle(t, i);
        at(F, who, s.x, s.z, { yaw: s.yaw, pose: p, face: faceOf(i, ['happy', 'grin', 'happy']) });
      };
      runTo(A.friend, friendPos, 0, 1, friendYaw, fp, ff);
      runTo(A.crush, S_CRUSH, 1, 2, 20, cp, cf);
      crowd.forEach((c, i) => {
        const [x, z] = WAIT[i];
        let p = POSES.idle(t, i);
        let f = faceOf(i, ['neutral', 'happy', 'smirk', 'neutral']);
        let yaw = ((i * 37) % 70) - 35;
        if (i % 5 === 0 && t < music) (p = POSES.talk(t, i)), (yaw += 40);
        if (t > music) p.neck = [0, Math.max(-70, Math.min(70, look(x, z) - yaw)), 0];
        if (t > W(7, 'It')) f = faceOf(i, ['face-eyes-shocked', 'suspicious', 'neutral']);
        if (t > W(8, 'SON')) f = faceOf(i, ['face-eyes-shocked', 'face-mouth-small-frown', 'suspicious', 'smirk']);
        if (t > W(10, 'free')) f = faceOf(i, ['suspicious', 'happy', 'face-eyes-shocked']);
        if (t > W(11, 'Half')) f = faceOf(i, ['happy', 'grin']);
        runTo(c, [x, z], i + 2, i + 3, yaw, p, f);
      });
    } else {
      // Sunset: everyone's gone home; dad hands over the kid's cut.
      let pose = POSES.idle(t);
      let face = 'neutral';
      const hold = [];
      if (t > W(13, 'five')) face = ['face-eyes-shocked'];
      if (t > W(14, 'handed')) {
        pose = POSES.holdOut(t);
        pose.rArm = [-80, 0, 4];
        face = 'happy';
      }
      if (t > W(14, 'fifty') + 0.15) {
        pose = POSES.idle(t);
        pose.rArm = [-118, 0, 32];
        face = 'grin';
        hold.push('bill');
      }
      // He steps up to the counter for his cut.
      at(F, A.me, WINDOW_X, lerp(2.6, 6.5, sm(seg(t, W(14, 'He') - 0.3, W(14, 'handed') + 0.3))), { yaw: lerp(0, 180, sm(seg(t, W(14, 'fifty') + 0.3, W(14, 'Your')))), pose, face, hold });
    }
  }

  // ---- the next morning: Ice Cream Boy --------------------------------------------------
  function morning(t) {
    const stop = W(16, 'And') - 0.2;
    const u = seg(t, MORNING + 0.1, stop);
    const z = lerp(24, 9, u);
    let pose = u < 1 ? POSES.walk(t, 0, 30, 1.5) : POSES.idle(t);
    let face = 'smirk';
    const hold = [];
    if (u >= 1) {
      pose = POSES.idle(t);
      pose.rArm = [-80, 0, 30]; // the cash fanned out under his grin
      face = 'grin';
      hold.push('fan');
    }
    at(C, A.me, 25, z, { yaw: 180, pose, face, hold });
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side > 0 ? 29.0 : 20.8;
      const zz = 5 + Math.floor(i / 2) * 3.4 + (side > 0 ? 1.2 : 0);
      const c = crowd[(i + 5) % N_CROWD];
      const p = i % 3 === 0 ? POSES.cheer(t, i) : i % 3 === 1 ? POSES.chant(t, i) : POSES.wave(t, i);
      const toKid = (Math.atan2(25 - x, z - zz) * 180) / Math.PI;
      at(C, c, x, zz, { yaw: toKid, pose: p, face: faceOf(i, ['happy', 'grin', 'happy', 'grin']) });
    }
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    sign.visible = t > MORNING;
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    cameraAt(t);
    if (t < NIGHT) {
      light('day', C, 25, 5);
      hallway(t);
    } else if (t < DAY) {
      light('night', B, 0, -4);
      bedroom(t);
    } else if (t < MORNING) {
      light(t < SUNSET ? 'day' : 'sunset', F, 15, 0);
      front(t);
    } else {
      light('day', C, 25, 10);
      morning(t);
    }
    captions(t);
  };
}

