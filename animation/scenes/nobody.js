// "Nobody" — a Roblox story Short. Narration and word timings: assets/voice/nobody
// (tools/narrate.py, tools/align.py); script: scripts/nobody.md.
//
// In this town whatever someone calls you becomes your name, floating over your head. Places:
// the street in front of the school (the rule, the uncle's road rage), a backyard wedding,
// the school hallway and classroom (Chad renaming everyone, Lily becoming Nobody), the
// kitchen and my bedroom (nobody notices her), the gym assembly (Somebody!) and the kitchen
// again for my birthday. Inside a place the camera glides; between places it dips to black.
import * as THREE from 'three';
import words from '../../assets/voice/nobody/words.json' with { type: 'json' };
import { BRICK, SKIN, part, cylinder, ball } from '../src/roblox.js';
import { buildClassroom, buildBedroom, buildSchoolFront, buildGym, buildKitchen, buildWedding } from '../src/rooms.js';
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

// Places, in story order; each cut is a dip to black.
const C = new THREE.Vector3(3000, 0, 0); // classroom; its hallway is local x 18.5..32
const B = new THREE.Vector3(3000, 0, 400); // bedroom
const F = new THREE.Vector3(3600, 0, 0); // school front: road along x, sidewalk z 0..8
const K = new THREE.Vector3(3400, 0, 400); // kitchen
const G = new THREE.Vector3(3000, 0, -500); // gym
const WD = new THREE.Vector3(4300, 0, 0); // wedding

const T_WEDDING = W(3, 'Twenty') - 0.08;
const T_CHAD = W(4, 'Then') - 0.08;
const T_BOOGER = W(6, 'The') - 0.08;
const T_LUNCH = W(7, 'The') - 0.08;
const T_PRINCIPAL = W(8, 'The') - 0.08;
const T_SMUG = W(9, 'And') - 0.08;
const T_LILY = W(10, 'Then') - 0.08;
const T_BUMP = W(11, 'On') - 0.08;
const T_SKIP = W(14, 'Then') - 0.08;
const T_FRIENDS = W(14, 'Her') - 0.08;
const T_TRAY = W(14, 'The', 1) - 0.08; // "The lunch lady" ("the teacher" comes first)
const T_HOME = W(15, 'By') - 0.08;
const T_NIGHT = W(17, 'That') - 0.08;
const T_GYM = W(19, 'Monday') - 0.08;
const T_SOMEWHERE = W(31, "He's") - 0.08;
const T_HERO = W(32, 'Me') - 0.08;
const T_MOM = W(33, 'But') - 0.08;
const CUTS = [T_WEDDING, T_CHAD, T_BOOGER, T_LUNCH, T_PRINCIPAL, T_SMUG, T_LILY, T_BUMP, T_SKIP, T_FRIENDS, T_TRAY, T_HOME, T_NIGHT, T_GYM, T_SOMEWHERE, T_HERO, T_MOM];

const IDIOT = W(3, 'Idiot');
const BOOGER = W(6, 'Booger');
const SLOPPY = W(7, 'Now');
const PANTS = W(8, 'Now');
const NOBODY = W(12, 'Nobody');
const FADE = W(13, 'faded');
const NOBODY_TAG = W(13, 'Nobody');
const FLICKER = W(22, 'flickered');
const GOLD = W(25, 'Somebody');
const CHAD_NOBODY = W(29, 'Nobody');
const HERO = W(32, 'Hero');
const GROUNDED = W(34, 'Grounded');

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  lily: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-jeans-stars', hair: 'hair-black-cutesy-pigtails', skin: MAIN.skin, size: 0.8 },
  chad: { shirt: 'shirt-crimson-red-shirt-black', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-blonde-messy', skin: SKIN.porcelain },
  mom: { shirt: 'shirt-vintage-flannel-button-up-2', pants: 'pants-dark-pants', hair: 'hair-elegant-braided-bun', skin: MAIN.skin },
  uncle: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-business-comb-over', skin: SKIN.lightOrange },
  karen: { shirt: 'shirt-wedding-dress', pants: 'pants-wedding-skirt', hair: 'hair-blonde-fashion-model-side', skin: SKIN.pastelBrown },
  yeller: { shirt: 'shirt-mu-red-flannel-black', pants: 'pants-cargo-pants-grey-black', hair: 'hair-black-swept', skin: SKIN.tan },
  sunMom: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-california-girl-brown', skin: SKIN.brown },
  sunshine: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-pink-trendy-girls-casual', hair: 'hair-afro-puff', skin: SKIN.brown, size: 0.5 },
  mail: { shirt: 'shirt-mail-carrier', pants: 'pants-mail-shorts', hair: 'hair-black-short-parted', skin: SKIN.nougat },
  mike: { shirt: 'shirt-vintage-flannel-button-up', pants: 'pants-kestrel-khaki-textured-pants', hair: 'hair-high-top-fade', skin: SKIN.deep },
  booger: { shirt: 'shirt-school-boy', pants: 'pants-dark-pants', hair: 'hair-brown-messy', skin: SKIN.tan },
  teacher: { shirt: 'shirt-grey-suit-black-vest', pants: 'pants-grey-suit-black-vest', hair: 'hair-black-old-hollywood-waves', skin: SKIN.deep },
  lunch: { shirt: 'shirt-lunch-lady', pants: 'pants-lunch-lady', hair: 'hair-white-messy-bun-pulled', skin: SKIN.nougat },
  principal: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-black-balding-man', skin: SKIN.brown },
};
const NAME = { me: 'Jake', lily: 'Lily', chad: 'Chad', mom: 'Mom', uncle: 'Gary', karen: 'Karen', yeller: 'Rick', sunMom: 'Tina', sunshine: 'Sunshine', mail: 'Sir', mike: 'Big Mike', booger: 'Kevin', teacher: 'Mrs. Reed', lunch: 'Linda', principal: 'Mr. Hill' };
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-sweter-galaxy-blue-100', 'shirt-blue-stripe-shirt-neck', 'shirt-grey-knitted-sweater-chain',
  'shirt-thrifted-striped-polo', 'shirt-mu-red-flannel-black', 'shirt-kawaii-soft-anime-school', 'shirt-tech-fleece-red-hoodie', 'shirt-black-flannel-soft-trendy-2',
  'shirt-cottage-core-fairy-vintage', 'shirt-cutesy-pink-striped-sweater'];
const PANTS_LIST = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-jeans-stars', 'pants-gray-sweatpants', 'pants-cargo-pants-tan-beige', 'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-blonde-pigtails', 'hair-black-hime-short-straight',
  'hair-dejah-loc', 'hair-brown-side-sweep', 'hair-brown-fashion-model-side', 'hair-afro-puff', 'hair-messy-boy-black', 'hair-lazy-bun',
  'hair-long-black', 'hair-black-middle-part', 'hair-short-wavy-black', 'hair-360-waves-fade', 'hair-brown-wavy-ponytail', 'hair-black-messy',
  'hair-blonde-wavy-ponytail', 'hair-grandpa-gray', 'hair-silver-locks', 'hair-black-short-layered-bob', 'hair-curly-afro-black', 'hair-brown-messy', 'hair-black-swept'];
const FIRST = ['Mia', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Ruby', 'Sam', 'Ivy', 'Max', 'Nora', 'Owen', 'Lucy', 'Finn', 'Ella', 'Theo', 'June', 'Kai', 'Rose', 'Ben', 'Gran', 'Pops', 'Cleo', 'Jay'];
const TONES = Object.values(SKIN);
const CROWD = HAIRS.map((hair, i) => ({ shirt: SHIRTS[(i * 4) % SHIRTS.length], pants: PANTS_LIST[(i * 5) % PANTS_LIST.length], hair, skin: TONES[(i * 4 + 3) % TONES.length] }));
const FACES = ['face-addon-blush', 'face-addon-sweat-drop', 'face-addon-tears', 'face-eyes-shocked', 'face-mouth-small-frown', 'face-worry-manga',
  'face-terrified', 'face-about-to-cry', 'face-addon-anger-mark-big'];

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
sfx('../voice/nobody/narration.flac', 0, 1.0);
sfx('feeling-blue.mp3', 0, 0.2, { dur: END, fade: 1.2 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
const rename = (at, v = 0.6) => (sfx('synth/pluck_C4.wav', at, v, { pitch: 7 }), sfx('synth/pop.wav', at, v * 0.7));
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.25);
sfx('synth/ambience.wav', 0, 0.25, { loop: true, dur: T_WEDDING, fade: 0.3 });
sfx('synth/brakes.wav', W(3, 'honked') - 0.05, 0.3, { pitch: 7 });
sfx('angry-roblox.mp3', IDIOT - 0.1, 0.35);
rename(IDIOT + 0.4);
FAH(W(3, 'Idiot', 1) + 0.55);
rename(BOOGER + 0.25);
sfx('huh-rblx-se.mp3', W(6, 'Here') + 0.4, 0.4);
rename(SLOPPY);
rename(PANTS);
FAH(W(8, 'Pants') + 0.45);
sfx('synth/thud.wav', W(11, 'bumped'), 0.6);
sfx('synth/squeak.wav', W(11, 'spilled') + 0.1, 0.35);
sfx('gaspp.mp3', W(11, 'shoes') + 0.2, 0.4);
sfx('synth/bloop_down.wav', FADE, 0.6);
sfx('sadd-rblx-se.mp3', NOBODY_TAG + 0.3, 0.4);
sfx('synth/ambience.wav', T_GYM, 0.3, { loop: true, dur: END - T_GYM - 2, fade: 0.8 });
sfx('synth/pluck_E4.wav', FLICKER, 0.5);
sfx('synth/pluck_E4.wav', FLICKER + 0.18, 0.4, { pitch: 3 });
for (let k = 0; k < 4; k++) sfx('yeaa-rblx-se.mp3', W(24, 'chanting') + 0.25 + k * 0.6, 0.35, { pitch: [0, 4, -3, 2][k] });
sfx('synth/slide_up.wav', GOLD - 0.25, 0.55);
sfx('yeaa-rblx-se.mp3', GOLD + 0.3, 0.6);
sfx('roblox-crying-work-at-pizza-place.mp3', W(26, 'crying') + 0.2, 0.3);
sfx('synth/bloop_down.wav', CHAD_NOBODY + 0.15, 0.6);
rename(HERO + 0.1);
sfx('roblox-angry-noise.mp3', W(33, 'found') - 0.1, 0.35);
rename(GROUNDED + 0.15, 0.8);
FAH(GROUNDED + 0.45);

// ---- blocking (local to each place) ---------------------------------------------------------
// Classroom desks (students face -z, sit SEAT_DZ behind their desk).
const DESKS = [];
for (const z of [-3, 2, 7]) for (const x of [-10, -4, 1.5, 7]) DESKS.push([x, z]);
const SEAT_DZ = 1.05;
const TEACHER = [0.5, -10.6];
// Gym: Chad on stage; the mic at the front of the stage.
const STAGE_Y = 3;
const CHAD_STAGE = [-2.2, -15.5];
const MIC = [1.6, -13.4];
const GYM_ROWS = [];
for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) GYM_ROWS.push([-11 + k * 4.4 + (row % 2) * 1.2, -2 + row * 4.2]);

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, place, position, look-at, fov, move seconds].
const KEYS = [
  [0, F, [9, 9, 30], [0, 4, 2], 52, 0],
  [W(1, 'It') - 0.05, F, [-6.4, 5.2, 12.6], [-6.4, 4.0, 4.4], 46, 0.6],
  [W(1, 'It', 1), F, [-6.4, 6.2, 11.4], [-6.4, 5.8, 4.4], 42, 0.5],
  [W(2, 'Moms') - 0.1, F, [5.0, 5.0, 12.4], [5.0, 3.6, 4.4], 48, 0.6],
  [W(2, 'Everybody') - 0.05, F, [12.6, 5.2, 12.4], [12.6, 4.0, 4.4], 46, 0.6],
  [W(2, 'And') - 0.05, F, [-6, 6.5, 6.5], [4, 2.8, 15], 54, 0.6],
  [W(3, 'He') - 0.1, F, [9.0, 5.6, 8.4], [1.0, 3.8, 14.0], 50, 0.6],
  [W(3, 'Idiot') - 0.3, F, [9.2, 5.6, 7.6], [0.6, 4.4, 13.4], 48, 0.4],

  [T_WEDDING, WD, [7.5, 6.0, 9.0], [7.5, 4.8, -4.0], 52, 0],
  [W(3, 'Congratulations'), WD, [7.5, 5.6, 4.6], [7.5, 5.4, -4.0], 46, 0.6],

  [T_CHAD, C, [24.6, 5.5, 4.6], [25.6, 4.3, 14.0], 50, 0],
  [W(5, 'And') - 0.05, C, [25.0, 5.3, 7.0], [25.6, 4.4, 14.0], 44, 0.6],

  [T_BOOGER, C, [3.6, 6.4, -10.6], [4.0, 3.6, -1.0], 52, 0],
  [W(6, 'Now') - 0.05, C, [2.6, 6.0, -9.4], [2.0, 3.8, -1.5], 46, 0.6],

  [T_LUNCH, C, [23.2, 5.6, 28.8], [28.4, 4.2, 23.6], 50, 0],
  [W(7, 'Now') - 0.1, C, [24.2, 5.8, 28.6], [29.6, 5.0, 24.8], 50, 0.5],

  [T_PRINCIPAL, C, [26.4, 5.6, 4.0], [20.6, 5.0, -4.6], 50, 0],
  [W(8, 'Now') - 0.05, C, [25.4, 6.0, 2.6], [19.6, 6.0, -5.0], 46, 0.6],

  [T_SMUG, C, [24.6, 5.5, 4.6], [25.6, 4.3, 14.0], 52, 0],
  [W(9, 'Because') - 0.05, C, [25.6, 5.5, 7.0], [25.6, 4.4, 14.0], 46, 0.6],

  [T_LILY, F, [-1.0, 5.0, 11.4], [-1.0, 3.6, 2.8], 48, 0],
  [W(10, 'She') - 0.05, F, [-1.0, 4.6, 9.2], [-1.0, 3.4, 2.8], 44, 0.6],

  [T_BUMP, C, [25.2, 5.4, 4.0], [25.2, 3.6, 14.0], 50, 0],
  [W(12, 'He') - 0.1, C, [27.6, 5.6, 9.2], [25.4, 4.2, 14.0], 46, 0.5],
  [W(13, 'The') - 0.05, C, [25.6, 5.6, 9.4], [24.6, 4.4, 14.0], 42, 0.6],

  [T_SKIP, C, [3.6, 6.4, -10.6], [3.0, 3.6, -1.0], 52, 0],
  [T_FRIENDS, C, [25.2, 5.4, 4.0], [25.2, 3.8, 16.0], 48, 0],
  [T_TRAY, C, [23.2, 5.6, 28.8], [28.0, 4.0, 23.6], 50, 0],

  [T_HOME, K, [-1.0, 6.2, 8.6], [-1.0, 3.4, 1.0], 58, 0],
  [W(15, 'My') - 0.1, K, [0, 7.2, 8.4], [0, 2.8, 1.5], 54, 0.6],
  [W(16, 'Because') - 0.05, K, [3.6, 5.0, 7.8], [-2.8, 4.0, 5.0], 44, 0.6],

  [T_NIGHT, B, [4.6, 5.4, 9.0], [4.4, 3.4, 1.0], 46, 0],
  [W(18, 'I') - 0.05, B, [4.4, 4.8, 7.4], [4.4, 3.6, 1.0], 40, 0.6],

  [T_GYM, G, [0, 9.0, 21.0], [0, 4.0, -12.0], 56, 0],
  [W(19, 'Every') - 0.05, G, [-6, 8.0, 14.0], [10, 4.0, -2.0], 56, 0.9],
  [W(20, 'I') - 0.05, G, [6.0, 6.4, -1.0], [2.0, 5.0, -12.0], 50, 0.6],
  [W(21, 'Everybody') - 0.05, G, [1.6, 7.2, -4.4], [1.4, 6.2, -13.2], 46, 0.6],
  [W(22, 'The'), G, [0.8, 8.4, -4.0], [0.8, 7.0, -13.4], 40, 0.5],
  [W(24, 'The') - 0.05, G, [4.0, 6.6, -9.0], [-2.0, 3.0, 4.0], 56, 0.6],
  [W(24, 'The', 1) - 0.1, G, [0, 10.0, -9.5], [0, 3.0, 8.0], 60, 0.8],
  [W(25, 'And') - 0.05, G, [0.8, 8.4, -4.0], [0.8, 7.0, -13.4], 40, 0.6],
  [W(26, 'My') - 0.05, G, [3.8, 6.4, -3.6], [2.0, 4.6, -12.4], 50, 0.5],
  [W(27, 'Chad') - 0.05, G, [-0.4, 7.0, -5.6], [0.2, 6.0, -13.4], 48, 0.5],
  [W(28, 'And') - 0.05, G, [0, 9.0, 10.0], [0, 5.0, -13.0], 56, 0.6],
  [CHAD_NOBODY - 0.1, G, [0.0, 8.2, -4.4], [0.2, 6.8, -13.4], 42, 0.4],
  [W(30, 'And') - 0.05, G, [0, 8.0, 6.0], [0, 4.5, -12.0], 56, 0.9],

  [T_SOMEWHERE, C, [25.2, 5.4, 3.0], [25.2, 4.0, 16.0], 50, 0],
  [T_HERO, C, [25.0, 5.4, 4.6], [27.0, 4.4, 14.0], 46, 0],
  [W(32, 'Its', 1) - 0.1, C, [25.4, 5.2, 6.0], [29.2, 4.4, 12.0], 48, 0.5],

  [T_MOM, K, [-0.3, 6.0, -5.2], [-0.2, 4.4, 5.0], 56, 0],
  [W(34, 'So') - 0.1, K, [0.4, 5.4, -4.2], [0.4, 4.6, 5.0], 50, 0.6],
  [W(34, 'Happy') - 0.05, K, [0.4, 5.2, -3.0], [0.4, 4.8, 5.0], 44, 0.5],
].map(([t, o, pos, look, fov, move]) => ({ t, o, pos, look, fov, move }));

// ---- props -------------------------------------------------------------------------------
/** A Roblox-style name over a character's head (white with a dark outline). */
function nameTag() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(2.6, 0.65, 1);
  s.position.y = 2.95;
  s.renderOrder = 3;
  let shown = null;
  s.userData.show = (text, color = '#ffffff') => {
    const key = text + color;
    if (key === shown) return;
    shown = key;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    P.drawText(ctx, text, 256, 70, 500, 78, { color, stroke: '#111', strokeW: 12 });
    tex.needsUpdate = true;
  };
  return s;
}

const paperSign = (a, w, h, text, opts = {}) => P.sign(a, w, h, text, { bg: '#ffffff', fg: '#1b2a35', size: 90, border: '#1b2a35', ...opts });

function car(a, color) {
  const g = new THREE.Group();
  g.add(part(a, [8, 1.6, 4], [0, 1.4, 0], color, 'SmoothPlastic'));
  // A convertible, so whoever's driving stays in view.
  g.add(part(a, [0.25, 1.2, 3.6], [1.4, 2.8, 0], 0x9fd0ef, 'Glass', { shadows: false, mat: { opacity: 0.5 } }));
  g.add(part(a, [3.0, 0.7, 3.4], [-1.6, 2.5, 0], 0x2a2a2a, 'Fabric'));
  g.add(part(a, [0.4, 1.4, 3.4], [-3.0, 2.8, 0], 0x2a2a2a, 'Fabric'));
  for (const [x, z] of [[-2.6, 2], [2.6, 2], [-2.6, -2], [2.6, -2]]) {
    const w = cylinder(a, 0.85, 0.6, [x, 0.85, z], 0x1b1b1b, 'Plastic');
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  for (const z of [-1.4, 1.4]) g.add(part(a, [0.1, 0.4, 0.7], [4.02, 1.6, z], 0xfff3c4, 'Neon', { shadows: false }));
  return g;
}

function cake(a, text, tiers = 3, signW = 3.6) {
  const g = new THREE.Group();
  for (let k = 0; k < tiers; k++) {
    const r = 1.2 - k * 0.32;
    g.add(cylinder(a, r, 0.7, [0, 0.35 + k * 0.7, 0], 0xfff8ee, 'SmoothPlastic'));
    g.add(cylinder(a, r + 0.04, 0.12, [0, 0.06 + k * 0.7, 0], 0xff9fcf, 'Fabric'));
  }
  const top = tiers * 0.7;
  if (tiers === 1) for (let k = 0; k < 5; k++) {
    const x = Math.cos(k * 1.26) * 0.7;
    const z = Math.sin(k * 1.26) * 0.7;
    g.add(cylinder(a, 0.06, 0.5, [x, top + 0.25, z], [0x80bbdc, 0xff98dc, 0xf5cd30][k % 3], 'Plastic'));
    g.add(ball(a, 0.08, [x, top + 0.58, z], 0xffb04a, 'Neon'));
  }
  const s = P.sign(a, signW, signW / 3.6, text, { bg: '#fff2f7', fg: '#c2185b', size: 70, border: '#c2185b' });
  s.position.set(0, top + 1.2, 0);
  g.add(s);
  return g;
}

function plate(a) {
  return cylinder(a, 0.55, 0.06, [0, 0, 0], 0xffffff, 'SmoothPlastic');
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  const { door } = buildClassroom(scene, assets, C, { desks: DESKS, seatDz: SEAT_DZ, seed: 8 });
  door.rotation.y = 0;
  const room = buildBedroom(scene, assets, B);
  buildSchoolFront(scene, assets, F);
  const kitchen = buildKitchen(scene, assets, K);
  buildGym(scene, assets, G);
  buildWedding(scene, assets, WD);
  const add = (obj, o, x, y, z, ry = 0) => {
    obj.position.set(o.x + x, y, o.z + z);
    obj.rotation.y = ry;
    scene.add(obj);
    return obj;
  };

  // Street: cars. Uncle's car heading +x, the yeller's car alongside.
  const uncleCar = add(car(assets, 0x0d69ac), F, 2, 0, 12.6, 0);
  const yellCar = add(car(assets, 0xc4281c), F, 2, 0, 17.6, 0);
  const trafficCars = [0xf5cd30, 0x4b974b, 0xf2f3f3].map((c, i) => add(car(assets, c), F, -30 + i * 22, 0, 17.6 - (i % 2) * 5, 0));
  // Wedding cake.
  add(cake(assets, 'CONGRATULATIONS\nKAREN & IDIOT'), WD, 7.5, 3.18, -3.2);
  // School: lunch counter at the far end of the hallway, the principal's door, my locker sign.
  const counterG = new THREE.Group();
  counterG.add(part(assets, [7, 3.2, 2.2], [0, 1.6, 0], 0xc0c4c8, 'Metal'));
  counterG.add(part(assets, [7.2, 0.2, 2.4], [0, 3.3, 0], 0x8d8f94, 'Metal'));
  counterG.add(part(assets, [7, 0.1, 1.2], [0, 5.0, 0.2], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.3 } }));
  for (let k = 0; k < 4; k++) {
    counterG.add(part(assets, [1.4, 0.3, 1.0], [-2.4 + k * 1.6, 3.55, -0.3], 0x8d8f94, 'Metal'));
    counterG.add(part(assets, [1.1, 0.12, 0.8], [-2.4 + k * 1.6, 3.75, -0.3], [0xe2b33c, 0xc4281c, 0x4b974b, 0xe2b33c][k], 'Plastic'));
  }
  add(counterG, C, 29.2, 0, 25.2, -Math.PI / 2);
  const pantsDoor = new THREE.Group();
  pantsDoor.add(part(assets, [4, 7.4, 0.3], [0, 3.7, 0], 0x6b4a33, 'WoodPlanks'));
  pantsDoor.add(part(assets, [0.35, 0.35, 0.3], [1.4, 3.6, 0.25], BRICK.brightYellow, 'Metal'));
  const plaque = paperSign(assets, 3.6, 0.9, 'PRINCIPAL PANTS', { bg: '#1b2a35', fg: '#f2b632', border: '#f2b632', size: 80 });
  plaque.position.set(0, 8.2, 0.2);
  pantsDoor.add(plaque);
  add(pantsDoor, C, 19.0, 0, -6.0, Math.PI / 2);
  const heroSign = add(paperSign(assets, 1.8, 0.7, 'HERO', { bg: '#f2b632', fg: '#1b2a35', size: 110 }), C, 30.85, 5.6, 12.0, -Math.PI / 2);
  // Gym: the trophy table, the mic, a "MOST POPULAR" sign.
  const gymMic = P.micStand(assets);
  add(gymMic, G, MIC[0], STAGE_Y, MIC[1]);
  const award = paperSign(assets, 5, 1.2, 'MOST POPULAR', { bg: '#f2b632', fg: '#1b2a35', size: 90 });
  add(award, G, -2.2, 9.6, -17.6);
  // Kitchen: plates for three (four seats), the birthday cake.
  const plates = [[-2.2, 2.5], [2.2, 2.5], [0, 3.9]].map(([x, z]) => add(plate(assets), K, x, kitchen.tableTop + 0.03, z));
  const bday = add(cake(assets, 'HAPPY BIRTHDAY\nGROUNDED', 1, 2.6), K, 1.9, kitchen.tableTop, 3.2, Math.PI);
  const pup = add(P.dog(assets), K, 3, 0, 6);
  // Hand props.
  const license = paperSign(assets, 1.6, 1.0, "DRIVER'S\nLICENSE:\nBIG MIKE", { bg: '#cfe6ff', size: 60 });
  const drawing = paperSign(assets, 1.5, 1.1, 'ME + JAKE\nSUPERHEROES', { bg: '#fffbe6', fg: '#e53935', size: 48 });
  const milk = new THREE.Group();
  milk.add(part(assets, [0.5, 0.8, 0.5], [0, 0, 0], 0x8b4a2b, 'Plastic'));
  milk.add(part(assets, [0.52, 0.25, 0.52], [0, 0.25, 0], 0xffffff, 'Plastic'));
  const puddle = add(cylinder(assets, 1.1, 0.03, [0, 0, 0], 0x7a4426, 'SmoothPlastic'), C, 25.3, 0.03, 14.6);
  const trophy = new THREE.Group();
  trophy.add(cylinder(assets, 0.3, 0.3, [0, 0, 0], 0x6b4a33, 'Wood'));
  trophy.add(cylinder(assets, 0.12, 0.6, [0, 0.45, 0], 0xf2b632, 'Metal'));
  trophy.add(ball(assets, 0.4, [0, 0.95, 0], 0xf2b632, 'Metal'));
  const tray = part(assets, [1.4, 0.12, 1.0], [0, 0, 0], 0x8d8f94, 'Plastic');

  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45;
  sc.right = sc.top = 45;
  sc.updateProjectionMatrix();
  function light(mood, o, x, z, from) {
    lightingMood(scene, sun, mood);
    sun.target.position.set(o.x + x, 0, o.z + z);
    sun.position.set(o.x + x + from[0], from[1], o.z + z + from[2]);
  }
  const bedroomLights = room.lights;

  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), ...crowd];
  for (const a of everyone) scene.add(a.root);
  const tag = new Map();
  for (const [k, a] of Object.entries(A)) {
    const s = nameTag();
    s.userData.show(NAME[k]);
    a.root.add(s);
    tag.set(a, s);
  }
  crowd.forEach((a, i) => {
    const s = nameTag();
    s.userData.show(FIRST[i]);
    a.root.add(s);
    tag.set(a, s);
  });
  A.mike.attach('license', license, 'r', [0, 0.1, 0.25], [0, 0, 0]);
  A.lily.attach('drawing', drawing, 'r', [0, 0.1, 0.25], [0, 0, 0]);
  A.lily.attach('milk', milk, 'r', [0, 0.25, 0.1], [0, 0, 0]);
  A.chad.attach('trophy', trophy, 'r', [0, 0.1, 0.1], [-Math.PI / 2, 0, 0]);
  A.lunch.attach('tray', tray, 'r', [0, -0.05, 0.4], [-Math.PI / 2, 0, 0]);
  A.mom.attach('plate', plate(assets), 'r', [0, 0, 0.35], [-Math.PI / 2, 0, 0]);

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  const at = (o, who, x, z, { hold = [], ...opts } = {}) => {
    who.set({ at: [o.x + x, o.z + z], ...opts });
    for (const h of hold) who.hold(h);
  };
  const yawTo = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;
  const faceOf = (i, opts) => opts[i % opts.length];
  const pop = (s, t, when) => {
    const u = seg(t, when, when + 0.4);
    const k = u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0;
    s.scale.set(2.6 * (1 + 0.5 * k), 0.65 * (1 + 0.5 * k), 1);
    s.material.color.setScalar(1 + 1.6 * k);
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
  const raiseHand = (t, s) => {
    const p = seated(t, s);
    p.rArm = [-170, 0, -8];
    p.rElbow = [-10, 0, 0];
    return p;
  };
  const holdUp = (t, s) => {
    const p = POSES.idle(t, s);
    p.rArm = [-80, 0, 12];
    p.rElbow = [-55, 0, 0];
    return p;
  };
  // Townspeople strolling along the sidewalk with their names over their heads.
  function strollers(t, o, n = 10) {
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      const x = ((i * 9.7 + dir * t * 3.2 + 300) % 60) - 30;
      const z = 0.4 + (i % 3) * 0.9;
      at(o, crowd[i], x, z, { yaw: dir > 0 ? 90 : -90, pose: POSES.walk(t, i, 30, 1.5), face: faceOf(i, ['happy', 'neutral', 'smirk']) });
    }
  }

  // ---- the street: the rule, careful people, the uncle -------------------------------------
  function street(t) {
    strollers(t, F, t < W(2, 'And') ? 10 : 0);
    if (t < W(2, 'And')) at(F, A.me, -1.2, 5.0, { yaw: 30, pose: POSES.idle(t), face: MAIN.face });
    // Big Mike holds up his license, then his name floats above.
    at(F, A.mike, -6.4, 4.4, { yaw: 0, pose: t > W(1, 'drivers') - 0.3 ? holdUp(t, 1) : POSES.talk(t, 1), face: 'happy', hold: t > W(1, 'drivers') - 0.3 ? ['license'] : [] });
    // Sunshine and her mom; the mailman "Sir".
    at(F, A.sunMom, 4.2, 4.4, { yaw: 40, pose: POSES.talk(t, 2), face: 'happy' });
    at(F, A.sunshine, 5.8, 4.6, { yaw: -40, size: 0.5, pose: POSES.cheer(t, 3), face: 'grin' });
    at(F, A.mail, 12.6, 4.4, { yaw: 20, pose: t > W(2, 'Sir') - 0.2 ? POSES.wave(t, 4) : POSES.idle(t, 4), face: 'happy' });
    // The road: uncle and the guy who yells at him.
    const drive = (t - W(2, 'And')) * 6;
    trafficCars.forEach((c, i) => (c.position.x = F.x + ((-30 + i * 22 + t * 9 + 90) % 90) - 45));
    const ux = t > W(3, 'He') ? 2 : 2 + drive;
    uncleCar.position.x = F.x + ux;
    yellCar.position.x = F.x + ux + 0.4;
    at(F, A.uncle, ux - 1.4, 12.6 - 0.8, { y: 0.2, yaw: 90, pose: seated(t, 5), face: t > IDIOT + 0.3 ? ['face-eyes-shocked', 'face-mouth-small-frown'] : t > W(3, 'honked') ? 'angry' : 'neutral' });
    const yp = seated(t, 6);
    if (t > IDIOT - 0.2) (yp.lArm = [-120, 0, -20]), (yp.lElbow = [-20, 0, 0]);
    at(F, A.yeller, ux - 1.0, 17.6 - 0.8, { y: 0.2, yaw: 90, pose: yp, face: t > IDIOT - 0.2 ? ['angry', 'face-addon-anger-mark-big'] : 'neutral' });
    tag.get(A.uncle).userData.show(t > IDIOT + 0.4 ? 'Idiot' : 'Gary');
    pop(tag.get(A.uncle), t, IDIOT + 0.4);
  }

  function wedding(t) {
    at(WD, A.uncle, 6.1, -5.2, { yaw: 10, pose: POSES.idle(t), face: 'happy' });
    at(WD, A.karen, 8.9, -5.2, { yaw: -10, pose: t > W(3, 'Idiot', 1) ? POSES.shy(t, 2) : POSES.idle(t, 2), face: t > W(3, 'Idiot', 1) ? ['smirk', 'face-addon-sweat-drop'] : 'happy' });
    tag.get(A.uncle).userData.show('Idiot');
    for (let i = 0; i < 8; i++) at(WD, crowd[i + 4], (i % 2 ? 1 : -1) * (3.6 + (i % 4) * 1.6), 4.5 + Math.floor(i / 4) * 2.6, { yaw: 180, pose: seated(t, i), face: faceOf(i, ['happy', 'grin']) });
  }

  // ---- school: Chad's renaming ------------------------------------------------------------
  function hallwayCrowd(t, n = 8, look = null) {
    const spots = [[20.4, 16.5], [20.4, 19.5], [20.6, 22.5], [29.8, 17.5], [29.8, 20.5], [29.6, 23.0], [20.6, 4.0], [29.6, 4.5]];
    for (let i = 0; i < n; i++) {
      const [x, z] = spots[i];
      const c = crowd[i + 8];
      const yaw = look ? yawTo([x, z], look) : x < 25 ? 90 : -90;
      at(C, c, x, z, { yaw, pose: i % 3 === 1 ? POSES.talk(t, i) : POSES.idle(t, i), face: faceOf(i, ['neutral', 'happy', 'suspicious']) });
    }
  }

  function chadIntro(t, smug) {
    let cp = POSES.crossArms(t, 2);
    let cf = 'smirk';
    if (smug && t > W(9, 'he')) (cp = POSES.point(t, 2)), (cf = 'grin');
    at(C, A.chad, 25.6, 14.0, { yaw: 180, pose: cp, face: cf });
    // Fans and kids too scared to talk.
    hallwayCrowd(t, 8, [25.6, 14]);
    if (smug) for (let i = 0; i < 3; i++) at(C, crowd[16 + i], [22.4, 23.2, 28.6][i], [12.8, 11.0, 12.0][i], { yaw: yawTo([[22.4, 23.2, 28.6][i], [12.8, 11.0, 12.0][i]], [25.6, 14]), pose: t > W(9, 'open') ? POSES.shocked(t, i) : POSES.idle(t, i), face: t > W(9, 'he') ? ['face-eyes-shocked', 'face-addon-sweat-drop'] : 'neutral' });
  }

  function classroom(t, skipLily) {
    DESKS.forEach(([x, z], i) => {
      if (i === 2) return; // the new kid's desk / Lily's desk
      const c = crowd[i];
      at(C, c, x, z + SEAT_DZ, { yaw: 180, pose: seated(t, i), face: faceOf(i, ['neutral', 'happy', 'suspicious']) });
    });
    const [x, z] = DESKS[2];
    if (!skipLily) {
      let p = seated(t, 3);
      let f = 'neutral';
      if (t > W(6, 'sneezed') && t < W(6, 'sneezed') + 0.5) (p.neck = [25, 0, 0]), (f = ['face-eyes-shocked']);
      if (t > BOOGER) f = ['sad', 'face-addon-blush'];
      if (t > W(6, 'Here') - 0.1) (p = raiseHand(t, 3)), (f = ['sad', 'face-addon-blush', 'face-addon-sweat-drop']);
      at(C, A.booger, x, z + SEAT_DZ, { yaw: 180, pose: p, face: f });
      tag.get(A.booger).userData.show(t > BOOGER + 0.25 ? 'Booger' : 'Kevin');
      pop(tag.get(A.booger), t, BOOGER + 0.25);
      at(C, A.chad, 7, -3 + SEAT_DZ, { yaw: t > BOOGER - 0.4 ? 230 : 180, pose: t > BOOGER - 0.4 ? (() => { const p2 = seated(t, 9); p2.rArm = [-95, 0, 25]; p2.rElbow = [-5, 0, 0]; return p2; })() : seated(t, 9), face: t > BOOGER - 0.4 ? 'grin' : 'smirk' });
      const tp = POSES.talk(t, 4);
      tp.rArm = [-70, 0, 10];
      tp.rElbow = [-60, 0, 0];
      at(C, A.teacher, ...TEACHER, { yaw: 0, pose: t > W(6, 'Now') ? tp : POSES.idle(t, 4), face: 'neutral' });
    } else {
      // Lily raises her hand; the teacher reads past her.
      at(C, A.lily, x, z + SEAT_DZ, { yaw: 180, size: 0.8, pose: raiseHand(t, 3), face: ['sad', 'face-worry-manga'] });
      tag.get(A.lily).userData.show('Nobody', '#9aa3ad');
      const tp = POSES.talk(t, 4);
      tp.rArm = [-70, 0, 10];
      tp.rElbow = [-60, 0, 0];
      at(C, A.teacher, ...TEACHER, { yaw: 0, pose: tp, face: 'neutral' });
    }
  }

  function lunchLine(t, lilyTurn) {
    let lp = POSES.idle(t, 2);
    let lf = 'happy';
    const hold = [];
    if (!lilyTurn) {
      if (t > W(7, 'small') - 0.3) (lp = holdUp(t, 2)), hold.push('tray');
      if (t > SLOPPY) (lf = ['sad', 'face-mouth-small-frown']), (lp = POSES.idle(t, 2)), (hold.length = 0);
      tag.get(A.lunch).userData.show(t > SLOPPY ? 'Sloppy Joe' : 'Linda');
      pop(tag.get(A.lunch), t, SLOPPY);
      at(C, A.chad, 26.6, 22.8, { yaw: 60, pose: t > W(7, 'Now') - 0.5 ? POSES.point(t, 3) : POSES.idle(t, 3), face: t > W(7, 'small') ? 'angry' : 'smirk' });
    } else {
      tag.get(A.lunch).userData.show('Sloppy Joe');
      lf = 'neutral';
      at(C, A.lily, 26.6, 23.6, { yaw: 60, size: 0.8, pose: holdUp(t, 1), face: ['sad', 'face-about-to-cry'] });
      tag.get(A.lily).userData.show('Nobody', '#9aa3ad');
      // The lunch lady hands a tray to the kid behind her instead.
      lp = holdUp(t, 2);
      hold.push('tray');
      at(C, crowd[20], 24.4, 21.8, { yaw: 40, pose: POSES.idle(t, 5), face: 'happy' });
    }
    at(C, A.lunch, 30.0, 25.2, { yaw: -90, pose: lp, face: lf, hold });
    for (let i = 0; i < 3; i++) at(C, crowd[9 + i], 24.4 - i * 0.6, 19.5 - i * 2.4, { yaw: 30, pose: POSES.idle(t, i), face: 'neutral' });
  }

  function principal(t) {
    let pp = POSES.idle(t, 3);
    let pf = 'angry';
    if (t > W(8, 'detention') - 0.2) (pp = POSES.point(t, 3)), (pf = ['angry', 'face-addon-anger-mark-big']);
    if (t > PANTS) (pp = POSES.idle(t, 3)), (pf = ['sad', 'face-addon-sweat-drop']);
    at(C, A.principal, 21.4, -3.2, { yaw: 120, pose: pp, face: pf });
    tag.get(A.principal).userData.show(t > PANTS ? 'Principal Pants' : 'Mr. Hill');
    pop(tag.get(A.principal), t, PANTS);
    at(C, A.chad, 24.0, -1.8, { yaw: -70, pose: t > W(8, 'detention') ? POSES.crossArms(t, 2) : POSES.idle(t, 2), face: 'smirk' });
  }

  // ---- Lily ------------------------------------------------------------------------------------
  function lilyArrives(t) {
    at(F, A.me, 0.1, 2.6, { yaw: -30, pose: POSES.idle(t), face: 'happy' });
    const give = t > W(10, 'draws') - 0.2;
    at(F, A.lily, -2.0, 2.8, { yaw: 40, size: 0.8, pose: give ? holdUp(t, 1) : POSES.cheer(t, 1), face: 'grin', hold: give ? ['drawing'] : [] });
    tag.get(A.lily).userData.show('Lily');
    strollers(t, F, 6);
  }

  function bump(t) {
    const hit = W(11, 'bumped');
    // Lily hurries up the hallway with her milk and bumps into Chad.
    const u = seg(t, T_BUMP, hit);
    const lpos = [lerp(25.0, 25.0, u), lerp(6.5, 12.6, u)];
    let lp = u < 1 ? POSES.walk(t, 1, 34, 1.9) : POSES.shocked(t, 1);
    let lf = u < 1 ? 'happy' : ['face-eyes-shocked', 'face-addon-sweat-drop'];
    if (t > W(12, 'He')) (lp = POSES.shy(t, 1)), (lf = ['face-worry-manga', 'face-addon-sweat-drop']);
    if (t > NOBODY + 0.3) lf = ['sad', 'face-about-to-cry'];
    const lyaw = u < 1 ? 0 : 20;
    at(C, A.lily, ...lpos, { yaw: lyaw, size: 0.8, pose: lp, face: lf, hold: t < hit + 0.2 ? ['milk'] : [] });
    puddle.visible = t > W(11, 'spilled');
    puddle.scale.setScalar(Math.max(0.01, seg(t, W(11, 'spilled'), W(11, 'spilled') + 0.5)));
    let cp = POSES.talk(t, 2);
    let cf = 'smirk';
    if (t > W(11, 'spilled')) (cp = POSES.shocked(t, 2)), (cf = ['angry', 'face-addon-anger-mark-big']);
    if (t > W(12, 'looked')) (cp = POSES.crossArms(t, 2)), (cp.neck = [22, 0, 0]), (cf = 'smirk');
    if (t > W(12, 'Nobody') - 0.1) (cp = POSES.point(t, 2)), (cp.neck = [18, 0, 0]), (cf = 'grin');
    at(C, A.chad, 25.6, 14.4, { yaw: 200, pose: cp, face: cf });
    hallwayCrowd(t, 6, [25.4, 13.6]);
    // Her name fades away, then "Nobody".
    const s = tag.get(A.lily);
    if (t < FADE) s.userData.show('Lily');
    else if (t < NOBODY_TAG - 0.6) (s.userData.show('Lily'), (s.material.opacity = 1 - seg(t, FADE, FADE + 1.0)));
    else (s.userData.show('Nobody', '#9aa3ad'), (s.material.opacity = seg(t, NOBODY_TAG - 0.6, NOBODY_TAG - 0.1)));
  }

  function friendsWalkPast(t) {
    at(C, A.lily, 25.2, 12.0, { yaw: 0, size: 0.8, pose: POSES.wave(t, 1), face: ['happy', 'face-addon-sweat-drop'] });
    tag.get(A.lily).userData.show('Nobody', '#9aa3ad');
    for (let i = 0; i < 3; i++) {
      const z = lerp(20, 4, seg(t, T_FRIENDS, T_TRAY + 0.4)) + i * 1.2;
      at(C, crowd[12 + i], 23.6 + i * 1.4, z, { yaw: 180, pose: POSES.walk(t, i, 30, 1.6), face: faceOf(i, ['happy', 'neutral', 'grin']) });
    }
  }

  // ---- home -------------------------------------------------------------------------------------
  function home(t) {
    const sad = t > W(16, 'Because') - 0.1;
    at(K, A.lily, -2.8, 5.0, { yaw: sad ? 60 : 30, size: 0.8, pose: sad ? POSES.idle(t, 1) : POSES.wave(t, 1), face: sad ? ['sad', 'face-addon-tears'] : ['happy', 'face-worry-manga'] });
    tag.get(A.lily).userData.show('Nobody', '#9aa3ad');
    // The dog trots right past her.
    const u = seg(t, T_HOME + 0.2, W(15, 'My'));
    pup.visible = true;
    pup.position.set(K.x + lerp(-5, 5, u), 0, K.z + lerp(8.2, 6.5, u));
    pup.rotation.y = Math.PI / 2;
    pup.userData.tail.rotation.y = 0.5 * Math.sin(t * 14);
    // Mom sets three plates and never looks at her.
    const n = Math.floor(seg(t, W(15, 'set') - 0.2, W(15, 'three') + 0.1) * 3.99);
    plates.forEach((p, i) => (p.visible = i < n));
    at(K, A.mom, lerp(-1.5, 1.5, seg(t, W(15, 'set'), W(15, 'three'))), 0.6, { yaw: 0, pose: holdUp(t, 2), face: 'happy', hold: n < 3 ? ['plate'] : [] });
    at(K, A.me, 3.4, 2.5 + SEAT_DZ * 0, { y: 0, yaw: -90, pose: (() => { const p = seated(t, 0); p.lift = -0.4; return p; })(), face: t > W(15, 'three') ? ['face-eyes-shocked', 'face-addon-sweat-drop'] : MAIN.face });
  }

  function bedroom(t) {
    const sit = (s) => {
      const p = POSES.sit();
      p.lift = -0.35;
      p.neck = POSES.idle(t, s).neck;
      return p;
    };
    let mp = sit(0);
    mp.rArm = [-30, 0, 18];
    mp.rElbow = [-40, 0, 0];
    let mf = ['sad', 'face-addon-blush'];
    if (t > W(18, 'I')) (mf = 'happy'), (mp.neck = [0, 25, 0]);
    if (t > W(18, 'idea')) mf = 'grin';
    at(B, A.me, 5.6, 1.0, { yaw: 0, pose: mp, face: mf });
    const lp = sit(1);
    lp.neck = [10, -20, 0];
    at(B, A.lily, 3.4, 1.0, { yaw: 20, size: 0.8, pose: lp, face: t > W(18, 'see') ? ['happy', 'face-addon-tears'] : ['sad', 'face-addon-tears'] });
    tag.get(A.lily).userData.show('Nobody', '#9aa3ad');
  }

  // ---- the gym assembly ----------------------------------------------------------------------
  function gym(t) {
    const goUp = W(20, 'I');
    const lookAtChad = W(28, 'But');
    const turnAway = W(30, 'And');
    // Crowd: rows of chairs in the middle, bleachers on the sides.
    GYM_ROWS.forEach(([x, z], i) => {
      const c = crowd[i];
      let p = seated(t, i);
      let f = faceOf(i, ['neutral', 'happy', 'suspicious']);
      let yaw = 180;
      if (t > W(24, 'whole') - 0.2 && t < W(27, 'Chad')) (p = i % 2 ? POSES.cheer(t, i) : POSES.chant(t, i)), (p.lift = 0), (f = faceOf(i, ['grin', 'happy']));
      if (t > lookAtChad) (p = POSES.idle(t, i)), (f = faceOf(i, ['angry', 'suspicious', 'smirk']));
      if (t > turnAway) (yaw = 0), (p = POSES.walk(t, i, 25, 1.4)), (f = 'happy');
      const zz = t > turnAway ? z + (t - turnAway) * 3 : z;
      at(G, c, x, zz, { y: 0, yaw, pose: t > W(24, 'whole') - 0.2 || t > lookAtChad ? p : (() => { p.lift = -0.25; return p; })(), face: f });
    });
    // Bleacher kids.
    for (let i = 18; i < 24; i++) {
      const s = i % 2 ? 1 : -1;
      const row = (i - 18) % 3;
      const x = s * (21.5 + row * 2.2);
      const y = 1.35 + row * 1.1;
      let p = seated(t, i);
      if (t > W(24, 'whole') - 0.2 && t < W(27, 'Chad')) (p = POSES.cheer(t, i)), (p.lift = 0);
      at(G, crowd[i], x, -4 + (i - 18) * 3, { y: t > W(24, 'whole') - 0.2 && t < W(27, 'Chad') ? y : y + 0.25, yaw: s > 0 ? -90 : 90, pose: p, face: faceOf(i, ['happy', 'grin', 'neutral']) });
    }
    // Named grown-ups standing at the front: the new kid, Sloppy Joe, Principal Pants, Mom.
    const stand = (who, x, z, key, i) => {
      let p = POSES.idle(t, i);
      let f = 'neutral';
      if (t > key - 0.15 && t < W(27, 'Chad')) (p = POSES.cheer(t, i)), (f = 'grin');
      if (t > lookAtChad) (p = POSES.crossArms(t, i)), (f = 'smirk');
      at(G, who, x, z, { yaw: 180, pose: p, face: f });
    };
    stand(A.booger, -7.5, -6.0, W(24, 'She\'s'), 1);
    stand(A.lunch, -5.0, -5.6, W(24, 'Sloppy'), 2);
    stand(A.principal, 5.6, -5.6, W(24, 'Principal'), 3);
    tag.get(A.booger).userData.show('Booger');
    tag.get(A.lunch).userData.show('Sloppy Joe');
    tag.get(A.principal).userData.show('Principal Pants');
    let momF = 'neutral';
    if (t > GOLD) momF = 'happy';
    if (t > W(26, 'crying') - 0.2) momF = ['happy', 'face-addon-tears'];
    at(G, A.mom, 8.2, -6.0, { yaw: 200, pose: t > GOLD ? POSES.cry(t, 4) : POSES.idle(t, 4), face: momF });
    // Chad on stage with his trophy.
    let cp = holdUp(t, 2);
    let cf = 'grin';
    const ch = [];
    if (t < goUp + 1) ch.push('trophy');
    let cpos = CHAD_STAGE;
    if (t > goUp) (cp = POSES.crossArms(t, 2)), (cf = 'suspicious');
    if (t > W(24, 'whole')) cf = ['angry', 'face-addon-anger-mark-big'];
    if (t > W(27, 'Chad')) {
      cpos = [lerp(CHAD_STAGE[0], MIC[0] - 1.2, seg(t, W(27, 'Chad'), W(27, 'grabbed') + 0.3)), lerp(CHAD_STAGE[1], MIC[1] - 0.2, seg(t, W(27, 'Chad'), W(27, 'grabbed') + 0.3))];
      cp = POSES.micTalk(t, 2);
      cf = 'smirk';
    }
    if (t > lookAtChad) (cp = POSES.idle(t, 2)), (cf = ['face-eyes-shocked', 'face-addon-sweat-drop']);
    if (t > turnAway) (cp = POSES.wave(t, 2)), (cf = ['face-worry-manga', 'face-addon-sweat-drop']);
    at(G, A.chad, ...cpos, { y: STAGE_Y, yaw: t > W(27, 'Chad') ? 20 : 0, pose: cp, face: cf, hold: ch });
    const cs = tag.get(A.chad);
    cs.userData.show(t > CHAD_NOBODY + 0.15 ? 'Nobody' : 'Chad', t > CHAD_NOBODY + 0.15 ? '#9aa3ad' : '#ffffff');
    pop(cs, t, CHAD_NOBODY + 0.15);
    // Me and Lily walk up to the mic.
    const walkU = seg(t, goUp, W(20, 'hand') + 0.2);
    const mePos = t < goUp ? [9.0, -4.0] : [lerp(9.0, MIC[0] + 0.6, walkU), lerp(-4.0, MIC[1] + 0.2, walkU)];
    const onStage = walkU >= 1;
    // At the mic I gesture with my left hand, away from Lily (she's on my right).
    const talkLeft = (tt) => {
      const p = POSES.talk(tt);
      p.lArm = [p.rArm[0], -p.rArm[1], -p.rArm[2]];
      p.lElbow = [p.rElbow[0], -p.rElbow[1], 0];
      p.rArm = [-4, 0, -4];
      p.rElbow = [-14, 0, 0];
      return p;
    };
    let mp = t < goUp ? POSES.idle(t) : walkU < 1 ? POSES.walk(t, 0, 30, 1.6) : talkLeft(t);
    let mf = ['neutral', 'face-addon-sweat-drop'];
    if (onStage) mf = 'smirk';
    if (t > W(23, 'Say')) (mp = POSES.chant(t)), (mf = 'grin');
    if (t > W(24, 'The')) (mp = POSES.cheer(t)), (mf = 'grin');
    if (t > W(27, 'Chad')) (mp = POSES.crossArms(t)), (mf = 'smirk');
    if (t > turnAway) (mp = POSES.idle(t)), (mf = 'happy');
    at(G, A.me, ...mePos, { y: onStage ? STAGE_Y : 0, yaw: onStage ? (t > W(27, 'Chad') ? -60 : 0) : yawTo(mePos, MIC), pose: mp, face: mf });
    tag.get(A.me).userData.show('Jake');
    const lilyPos = [mePos[0] + (onStage ? -2.0 : 1.6), mePos[1] + (onStage ? 0.2 : 0.4)];
    let lp = walkU < 1 && t > goUp ? POSES.walk(t, 1, 30, 1.6) : POSES.idle(t, 1);
    let lf = ['sad', 'face-worry-manga'];
    if (t > FLICKER) lf = ['face-eyes-shocked', 'face-addon-blush'];
    if (t > GOLD) (lp = POSES.cheer(t, 1)), (lf = ['grin', 'face-addon-blush']);
    if (t > W(26, 'dog') && t < W(27, 'Chad')) lf = ['happy', 'face-addon-blush'];
    if (t > W(27, 'Chad')) (lp = POSES.idle(t, 1)), (lf = 'smirk');
    at(G, A.lily, ...lilyPos, { y: onStage ? STAGE_Y : 0, yaw: onStage ? (t > W(27, 'Chad') ? -50 : 15) : yawTo(mePos, MIC), size: 0.8, pose: lp, face: lf });
    const ls = tag.get(A.lily);
    if (t < FLICKER) (ls.userData.show('Nobody', '#9aa3ad'), (ls.material.opacity = 1));
    else if (t < GOLD - 0.1) {
      // Flickering between the two, faster as the chant grows.
      const rate = lerp(4, 14, seg(t, FLICKER, GOLD));
      const on = Math.sin(t * rate * Math.PI * 2) > 0;
      ls.userData.show(on ? 'Somebody' : 'Nobody', on ? '#ffe9a8' : '#9aa3ad');
    } else ls.userData.show('Somebody', '#f2b632');
    pop(ls, t, GOLD - 0.1);
    if (t > GOLD) ls.material.color.setScalar(Math.max(ls.material.color.r, 1.5));
    // The dog runs up and licks her face.
    pup.visible = t > W(26, 'My') - 0.3;
    const du = seg(t, W(26, 'My') - 0.3, W(26, 'licked'));
    pup.position.set(G.x + lerp(9, lilyPos[0] + 0.2, du), (onStage ? STAGE_Y : 0) * du, G.z + lerp(-4, lilyPos[1] + 1.6, du));
    pup.rotation.y = du < 1 ? Math.PI + 0.6 : Math.PI;
    pup.userData.tail.rotation.y = 0.6 * Math.sin(t * 18);
  }

  // ---- after ----------------------------------------------------------------------------------
  function somewhere(t) {
    at(C, A.chad, 25.0, 14.0, { yaw: 180, pose: POSES.wave(t, 2), face: ['face-worry-manga', 'face-addon-sweat-drop'] });
    tag.get(A.chad).userData.show('Nobody', '#9aa3ad');
    for (let i = 0; i < 5; i++) {
      const z = lerp(22, 2, seg(t, T_SOMEWHERE + i * 0.25, T_HERO)) + i * 1.5;
      const x = 23.6 + (i % 3) * 1.4;
      at(C, crowd[i + 3], x, z, { yaw: 180, pose: POSES.walk(t, i, 30, 1.6), face: faceOf(i, ['happy', 'neutral', 'grin']) });
    }
  }

  function hero(t) {
    heroSign.visible = true;
    at(C, A.me, 27.6, 12.4, { yaw: -150, pose: t > W(32, 'Its', 1) ? POSES.crossArms(t) : POSES.cheer(t), face: 'grin' });
    tag.get(A.me).userData.show('Hero', '#f2b632');
    pop(tag.get(A.me), t, HERO + 0.1);
    for (let i = 0; i < 4; i++) at(C, crowd[i + 10], 22.6 + i * 1.2, 15.5 + (i % 2) * 2, { yaw: yawTo([22.6 + i * 1.2, 15.5], [27.6, 12.4]), pose: i % 2 ? POSES.cheer(t, i) : POSES.wave(t, i), face: 'grin' });
  }

  function grounded(t) {
    bday.visible = true;
    const mad = t > W(33, 'found');
    const mp = mad ? POSES.crossArms(t, 2) : POSES.idle(t, 2);
    at(K, A.mom, -2.6, 6.6, { yaw: 160, pose: mp, face: mad ? ['angry', 'face-addon-anger-mark-big'] : 'neutral' });
    at(K, A.me, 0, 5.2, { yaw: 180, pose: (() => { const p = POSES.sit(); p.lift = -1.05 + 0.75; p.rKnee = [85, 0, 0]; p.lKnee = [85, 0, 0]; p.neck = [10, 0, 0]; return p; })(), face: t > GROUNDED ? ['sad', 'face-addon-tears'] : t > W(34, 'cake') ? ['face-eyes-shocked', 'face-addon-sweat-drop'] : ['happy', 'face-addon-sweat-drop'] });
    tag.get(A.me).userData.show(t > GROUNDED + 0.15 ? 'Grounded' : 'Hero', t > GROUNDED + 0.15 ? '#ff6b5e' : '#f2b632');
    pop(tag.get(A.me), t, GROUNDED + 0.15);
    at(K, A.lily, 2.8, 6.2, { yaw: -160, size: 0.8, pose: POSES.laugh(t, 1), face: 'grin' });
    tag.get(A.lily).userData.show('Somebody', '#f2b632');
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    for (const s of tag.values()) {
      s.scale.set(2.6, 0.65, 1);
      s.material.color.setScalar(1);
      s.material.opacity = 1;
    }
    for (const [k, a] of Object.entries(A)) tag.get(a).userData.show(NAME[k]);
    crowd.forEach((a, i) => tag.get(a).userData.show(FIRST[i]));
    for (const o of [bday, heroSign, pup, puddle]) o.visible = false;
    plates.forEach((p) => (p.visible = false));
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    cameraAt(t);
    if (t < T_WEDDING) {
      light('day', F, 0, 6, [30, 60, 40]);
      street(t);
    } else if (t < T_CHAD) {
      light('day', WD, 6, -2, [40, 55, 30]);
      wedding(t);
    } else if (t < T_BOOGER) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      chadIntro(t, false);
    } else if (t < T_LUNCH) {
      light('interior', C, 0, 0, [-70, 45, 18]);
      classroom(t, false);
    } else if (t < T_PRINCIPAL) {
      light('interior', C, 25, 20, [-70, 45, 18]);
      lunchLine(t, false);
    } else if (t < T_SMUG) {
      light('interior', C, 22, -3, [-70, 45, 18]);
      principal(t);
    } else if (t < T_LILY) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      chadIntro(t, true);
    } else if (t < T_BUMP) {
      light('day', F, 0, 4, [30, 60, 40]);
      lilyArrives(t);
    } else if (t < T_SKIP) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      bump(t);
    } else if (t < T_FRIENDS) {
      light('interior', C, 0, 0, [-70, 45, 18]);
      classroom(t, true);
    } else if (t < T_TRAY) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      friendsWalkPast(t);
    } else if (t < T_HOME) {
      light('interior', C, 25, 20, [-70, 45, 18]);
      lunchLine(t, true);
    } else if (t < T_NIGHT) {
      light('interior', K, 0, 0, [12, 40, -70]);
      home(t);
    } else if (t < T_GYM) {
      light('night', B, 0, -4, [30, 60, 40]);
      if (bedroomLights) for (const l of bedroomLights) l.visible = true;
      bedroom(t);
    } else if (t < T_SOMEWHERE) {
      light('interior', G, 0, 0, [-70, 45, 10]);
      gym(t);
    } else if (t < T_HERO) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      somewhere(t);
    } else if (t < T_MOM) {
      light('interior', C, 25, 12, [-70, 45, 18]);
      hero(t);
    } else {
      light('interior', K, 0, 0, [12, 40, -70]);
      grounded(t);
    }
    if (bedroomLights && !(t >= T_NIGHT && t < T_GYM)) for (const l of bedroomLights) l.visible = false;
    captions(t);
  };
}
