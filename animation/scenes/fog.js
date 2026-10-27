// "The Fog Doesn't Take Names" — a Roblox story Short. Narration and word timings:
// assets/voice/fog (tools/narrate.py, tools/align.py); script: scripts/fog.md.
//
// One place: a small town around a square, at night (src/rooms.js buildFogTown). The fog is
// a ring of soft puffs around the town whose radius follows the story; whatever it takes
// (the bakery, Gus, Mrs. Harlow's porch, houses) vanishes and snaps back when someone says
// its name, and names float up in gold as they're called.
import * as THREE from 'three';
import words from '../../assets/voice/fog/words.json' with { type: 'json' };
import { SKIN, part, ball } from '../src/roblox.js';
import { buildFogTown } from '../src/rooms.js';
import { Actor, POSES } from '../src/actors.js';
import { MAIN } from '../src/cast.js';
import { createCaptions } from '../src/captions.js';
import { lightingMood } from '../src/lighting.js';
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
const pop = (t, at, dur = 0.35) => (t < at ? 0 : ease('Back', 'Out', seg(t, at, at + dur)));

const O = new THREE.Vector3(5000, 0, 0); // the town square

// Story beats.
const CRACK = W(6, 'cracked');
const WHISPER = W(6, 'whisper');
const PAST_FENCE = W(6, 'rolled');
const SIGN_BLANK = W(6, 'blank');
const BAKERY_GONE = W(6, 'bakery', 1) + 0.1;
const NO_VOICE = W(7, 'no');
const GUS_OUT = W(8, 'out');
const GUS2_OUT = W(8, 'Two');
const PORCH_GONE = W(8, 'vanished');
const HARLOW_IN = W(8, 'stepped');
const DORIS_SAID = W(12, 'Doris');
const DORIS_BACK = W(13, 'snapped');
const RAY_SAID = W(14, 'Ray');
const TWINS_SAID = W(14, 'twins');
const DOG_SAID = W(14, 'screamed') + 0.3;
const BACKED_UP = W(14, 'backed');
const TOWN_SHOUTS = W(15, 'shouting');
const ALL_BACK = W(15, 'shouting') + 0.4;
const FENCE_AGAIN = W(15, 'slid');
const SIT = W(16, 'sat');
const COLD = W(17, 'Cold');
const FADE = W(19, 'fade');
const TURN = W(19, 'People');
const SISTER = W(20, 'pushed');
const THEO = W(21, 'Theo');
const SNAP = W(22, 'snapped');
const NOW = W(23, 'Now');
const SHOUT = W(24, 'THEO');

// Fog ring radius (studs from the crate) over time.
const RING = [[0, 48], [PAST_FENCE, 48], [BAKERY_GONE + 0.3, 37], [GUS_OUT, 34], [W(9, 'The'), 27], [DOG_SAID, 27], [BACKED_UP + 0.5, 34], [W(15, 'And'), 34], [W(15, 'fence'), 48]];
function ringAt(t) {
  for (let k = 0; k + 1 < RING.length; k++) if (t < RING[k + 1][0]) return lerp(RING[k][1], RING[k + 1][1], sm(seg(t, RING[k][0], RING[k + 1][0])));
  return RING.at(-1)[1];
}

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  sister: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-jeans-stars', hair: 'hair-black-cutesy-pigtails', skin: MAIN.skin },
  pell: { shirt: 'shirt-vintage-flannel-button-up-2', pants: 'pants-dark-pants', hair: 'hair-grandpa-gray', skin: SKIN.nougat },
  doris: { shirt: 'shirt-cottage-core-fairy-vintage', pants: 'pants-dark-pants', hair: 'hair-silver-locks', skin: SKIN.porcelain },
  ray: { shirt: 'shirt-mu-red-flannel-black', pants: 'pants-cargo-pants-grey-black', hair: 'hair-business-comb-over', skin: SKIN.brown },
  twinA: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-blonde-pigtails', skin: SKIN.lightOrange },
  twinB: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-blonde-pigtails', skin: SKIN.lightOrange },
  harlow: { shirt: 'shirt-grey-knitted-sweater-chain', pants: 'pants-dark-pants', hair: 'hair-white-messy-bun-pulled', skin: SKIN.tan },
  mail: { shirt: 'shirt-mail-carrier', pants: 'pants-mail-shorts', hair: 'hair-black-short-parted', skin: SKIN.deep },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-sweter-galaxy-blue-100', 'shirt-blue-stripe-shirt-neck', 'shirt-grey-knitted-sweater-chain',
  'shirt-thrifted-striped-polo', 'shirt-mu-red-flannel-black', 'shirt-tech-fleece-red-hoodie', 'shirt-black-flannel-soft-trendy-2', 'shirt-cottage-core-fairy-vintage'];
const PANTS_LIST = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-gray-sweatpants', 'pants-cargo-pants-tan-beige', 'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-brown-side-sweep', 'hair-dejah-loc', 'hair-brown-fashion-model-side',
  'hair-afro-puff', 'hair-lazy-bun', 'hair-long-black', 'hair-black-middle-part', 'hair-short-wavy-black', 'hair-360-waves-fade', 'hair-brown-wavy-ponytail',
  'hair-grandpa-white', 'hair-black-short-layered-bob', 'hair-brown-messy'];
const TONES = Object.values(SKIN);
const CROWD = HAIRS.map((hair, i) => ({ shirt: SHIRTS[(i * 4) % SHIRTS.length], pants: PANTS_LIST[(i * 3) % PANTS_LIST.length], hair, skin: TONES[(i * 4 + 1) % TONES.length] }));
const FACES = ['face-addon-blush', 'face-addon-sweat-drop', 'face-addon-tears', 'face-eyes-shocked', 'face-mouth-small-frown', 'face-worry-manga',
  'face-terrified', 'face-about-to-cry'];

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
sfx('../voice/fog/narration.flac', 0, 1.0);
sfx('feeling-blue.mp3', 0, 0.2, { dur: END, fade: 1.2 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
sfx('synth/ambience.wav', 0, 0.18, { loop: true, dur: END, fade: 1.0, pitch: -5 });
FAH(W(1, 'lunch') + 0.45);
sfx('synth/thud.wav', W(2, 'letters') + 0.3, 0.3, { pitch: 6 });
FAH(W(2, 'it') + 0.4);
sfx('synth/whoosh_long.wav', PAST_FENCE - 0.1, 0.45, { pitch: -6 });
const gone = (at) => sfx('synth/bloop_down.wav', at, 0.5);
const back = (at) => (sfx('synth/slide_up.wav', at - 0.05, 0.45), sfx('synth/pop.wav', at, 0.6));
gone(SIGN_BLANK);
gone(BAKERY_GONE);
gone(GUS_OUT + 0.3);
gone(GUS2_OUT + 0.3);
gone(PORCH_GONE);
for (const k of [0, 0.4, 0.8, 1.2]) gone(W(9, 'house') + k);
for (const k of [0, 0.18, 0.36]) sfx('synth/thud.wav', W(11, 'banged') + k, 0.7);
sfx('synth/squeak.wav', W(11, 'opened'), 0.35, { pitch: -5 });
back(DORIS_BACK);
back(RAY_SAID + 0.25);
back(TWINS_SAID + 0.25);
sfx('ahh-rblx-scared.mp3', DOG_SAID - 0.15, 0.35, { pitch: 5 });
sfx('synth/whoosh.wav', BACKED_UP, 0.5);
for (let k = 0; k < 4; k++) sfx('hi-rblx-se.mp3', TOWN_SHOUTS + k * 0.35, 0.28, { pitch: [0, 4, -3, 2][k] });
back(ALL_BACK);
sfx('yeaa-rblx-se.mp3', W(16, 'cheered') - 0.25, 0.6);
sfx('yeaa-rblx-se.mp3', W(16, 'cheered') - 0.1, 0.4, { pitch: 4 });
sfx('synth/whoosh_long.wav', COLD - 0.3, 0.3, { pitch: -8 });
sfx('gaspp.mp3', TURN, 0.4, { pitch: -2 });
sfx('synth/whoosh.wav', SNAP, 0.6);
sfx('synth/slide_up.wav', SNAP, 0.5);
for (let k = 0; k < 3; k++) sfx('yeaa-rblx-se.mp3', SHOUT - 0.05 + k * 0.12, 0.45, { pitch: [0, 4, -3][k] });
FAH(W(25, 'one') + 0.25);

// ---- blocking (town local) -----------------------------------------------------------------
const CRATE_TOP = 1.6;
// Doorsteps and porch spots come from the set; these are the square's gathering spots.
const RING_CROWD = Array.from({ length: 12 }, (_, i) => {
  const an = Math.PI * 0.15 + (i / 11) * Math.PI * 0.7; // a half ring in front of the crate (+z side)
  const r = 8.4 + (i % 2) * 1.6;
  return [Math.cos(an) * r * 1.1, Math.sin(an) * r];
});

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, position, look-at, fov, move seconds] in town space.
const KEYS = [
  [0, [0, 22, 48], [0, 2, -10], 56, 0],
  [W(1, 'lampposts') - 0.1, [-9.4, 5.4, 24.0], [-15, 5.0, 15], 46, 0],
  [W(1, 'Gus', 1) - 0.15, [9.4, 5.4, 24.0], [15, 5.0, 15], 46, 0.4],
  [W(1, 'Linda') - 0.2, [-7.0, 5.4, -4.0], [-15, 5.0, -15], 46, 0],
  [W(1, 'Mr') - 0.05, [-8.0, 4.6, 13.6], [-8.0, 3.4, 6.0], 44, 0],
  [W(2, 'Once') - 0.05, [11.4, 6.0, 23.0], [11.4, 1.6, 15.2], 44, 0],
  [W(3, "I'm") - 0.05, [0, 6.4, 10.4], [0, 5.6, 0], 46, 0],
  [W(3, 'midnight') - 0.2, [0, 9.0, 4.0], [0, 14.4, -14], 40, 0.4],
  [W(3, 'I') - 0.05, [0, 6.4, 10.4], [0, 5.6, 0], 46, 0.4],
  [W(3, '212') - 0.1, [0, 16, 32], [0, 4, -12], 56, 0.8],
  [W(4, 'As') - 0.05, [10, 6.5, 30], [22, 4, 47], 52, 0],
  [W(5, 'Last') - 0.05, [0.8, 6.4, 8.4], [0, 5.9, 0], 42, 0],
  [W(6, 'The') - 0.05, [0, 20, 40], [0, 2, -6], 58, 0],
  [W(6, 'bakery') - 0.1, [16, 6.0, -5.0], [31, 5.6, -12], 48, 0.5],
  [W(7, 'By') - 0.05, [0.8, 6.4, 8.4], [0, 5.9, 0], 42, 0],
  [W(8, 'Gus') - 0.05, [-7.0, 6.0, 23.0], [-15, 6.4, 15], 46, 0],
  [W(8, 'Gus', 1) - 0.05, [7.0, 6.0, 23.0], [15, 6.4, 15], 46, 0],
  [W(8, 'Mrs') - 0.05, [14, 6.4, 7.0], [26, 3.6, 2.0], 48, 0],
  [W(9, 'The') - 0.05, [2, 13, 14], [-18, 2, -20], 58, 0],
  [W(10, 'I') - 0.05, [0.8, 6.4, 8.4], [0, 5.9, 0], 42, 0],
  [W(11, 'I') - 0.05, [-17.0, 5.4, 7.0], [-25.6, 3.8, -1.0], 48, 0],
  [W(12, 'Doris') - 0.15, [-16.0, 7.0, 3.0], [-30, 5.0, -13], 54, 0.5],
  [W(14, 'I') - 0.05, [-15.6, 4.6, -5.4], [-25.6, 4.4, -13.4], 50, 0],
  [RAY_SAID + 0.2, [-16.4, 4.4, -17.6], [-20, 4.4, -26.6], 50, 0],
  [W(14, 'The', 1) - 0.1, [10.2, 4.0, -17.8], [7, 3.8, -26.6], 50, 0.4],
  [W(15, 'Then') - 0.05, [0, 16, 22], [0, 3, -15], 60, 0],
  [W(15, 'And') - 0.05, [0, 22, 48], [0, 2, -10], 56, 0.8],
  [W(16, 'Everyone') - 0.05, [0, 6.6, 14.0], [0, 4.0, 0], 52, 0],
  [W(17, "That's") - 0.05, [1.6, 4.0, 7.4], [0, 2.4, 0], 50, 0],
  [W(18, 'I') - 0.05, [0.6, 4.8, 6.6], [0, 4.0, 0], 42, 0.5],
  [W(19, 'My') - 0.05, [1.0, 4.4, 8.4], [0, 3.0, 0], 50, 0.5],
  [W(19, 'People') - 0.05, [0, 9.5, 15.0], [0, 3.0, 0], 56, 0.5],
  [W(20, 'Then') - 0.05, [2.6, 8.0, 12.5], [0, 3.0, 3.0], 52, 0.5],
  [THEO - 0.15, [1.4, 6.3, 8.2], [0.1, 4.6, 0.0], 44, 0.5],
  [SNAP - 0.05, [0, 10.0, 16.0], [0, 3.0, 0], 58, 0.4],
  [NOW - 0.05, [0, 6.6, 10.6], [0, 5.6, 0], 48, 0],
  [SHOUT - 0.1, [0, 7.4, -8.0], [0, 4.0, 8.0], 58, 0],
  [W(25, 'And') - 0.05, [0.4, 6.6, 7.6], [0, 6.2, 0], 44, 0],
].map(([t, pos, look, fov, move]) => ({ t, pos, look, fov, move }));
const CUTS = KEYS.filter((k, i) => i > 0 && k.move === 0).map((k) => k.t);

// ---- props -------------------------------------------------------------------------------
function puffTexture() {
  return P.canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/** A floating gold name, like a Roblox name tag that glows. */
function label(text, scale = 1) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  P.drawText(ctx, text, 256, 70, 500, 76, { color: '#ffe08a', stroke: '#3a2400', strokeW: 10 });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  s.userData.base = [3.6 * scale, 0.9 * scale];
  s.renderOrder = 4;
  return s;
}

function sandwich(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.9, 0.2, 0.9], [0, 0, 0], 0xe0b07a, 'Plastic', { shadows: false }));
  g.add(part(a, [0.95, 0.08, 0.95], [0, 0.13, 0], 0x4b974b, 'Plastic', { shadows: false }));
  g.add(part(a, [0.88, 0.1, 0.88], [0, 0.22, 0], 0xc4281c, 'Plastic', { shadows: false }));
  g.add(part(a, [0.9, 0.2, 0.9], [0, 0.36, 0], 0xe0b07a, 'Plastic', { shadows: false }));
  g.add(part(a, [0.04, 0.6, 0.04], [0, 0.7, 0], 0xd9c7a0, 'Wood', { shadows: false }));
  const flag = P.sign(a, 0.7, 0.32, 'KEVIN', { bg: '#ffffff', fg: '#c4281c', size: 110 });
  flag.position.set(0.36, 0.86, 0);
  g.add(flag);
  return g;
}

function nightSky() {
  const r = rng(5);
  const tex = P.canvasTexture(512, 1024, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#050914');
    gr.addColorStop(0.55, '#0e1a33');
    gr.addColorStop(1, '#25324e');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 260; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
      const s = r() < 0.1 ? 2.5 : 1.4;
      ctx.fillRect(r() * w, r() * h * 0.7, s, s);
    }
    ctx.fillStyle = '#f4f1e0';
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.14, 26, 0, Math.PI * 2);
    ctx.fill();
  });
  return tex;
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  const town = buildFogTown(scene, assets, O);
  const H = town.houses;
  const L = town.lamps;
  scene.background = nightSky();
  scene.fog.color.set(0x1a2438);
  scene.fog.near = 40;
  scene.fog.far = 170;
  lightingMood(scene, sun, 'night');
  sun.target.position.set(O.x, 0, O.z);
  sun.position.set(O.x - 30, 60, O.z + 30);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -55;
  sc.right = sc.top = 55;
  sc.updateProjectionMatrix();

  const add = (obj, x, y, z, ry = 0) => {
    obj.position.set(O.x + x, y, O.z + z);
    obj.rotation.y = ry;
    scene.add(obj);
    return obj;
  };

  // The fog: a ring of soft puffs around the town, and a little cloud that can gather at my feet.
  const puffTex = puffTexture();
  const puffMat = (o) => new THREE.SpriteMaterial({ map: puffTex, color: 0xcfd8e6, transparent: true, opacity: o, depthWrite: false, fog: false });
  const r = rng(77);
  const puffs = Array.from({ length: 170 }, () => {
    const s = new THREE.Sprite(puffMat(0.5));
    s.userData = { an: r() * Math.PI * 2, dr: (r() - 0.5) * 9, y: 0.6 + r() * r() * 8, size: 4 + r() * 5.5, spin: (r() - 0.5) * 0.02, bob: r() * 6 };
    s.renderOrder = 1;
    scene.add(s);
    return s;
  });
  const feet = Array.from({ length: 22 }, (_, i) => {
    const s = new THREE.Sprite(puffMat(0.55));
    s.userData = { an: (i / 22) * Math.PI * 2 + r(), rad: 0.9 + r() * 1.3, y: CRATE_TOP + 0.1 + r() * 0.9, size: 1.0 + r() * 1.0 };
    s.renderOrder = 1;
    scene.add(s);
    return s;
  });

  // Names that float up when they're said.
  const labels = {};
  const named = (key, text, x, y, z, scale = 1) => (labels[key] = add(label(text, scale), x, y, z));
  named('doris', 'DORIS', -32, 13.5, -13);
  named('pell', 'MR. PELL', -32, 13.5, 0);
  named('corner', 'THE KIMS', -32, 13.5, 14);
  named('ray', 'RAY', -20, 13.5, -33);
  named('twins', 'THE TWINS', 7, 13.5, -33);
  named('blue', 'MS. OKAFOR', 20, 13.5, -33);
  named('harlow', 'MRS. HARLOW', 32, 13.5, 2);
  named('green', 'THE BAKERS', 32, 13.5, 15);
  named('bakery', 'SWEET ROSE', 32, 12.5, -12);
  named('gus', 'GUS', -15, 11, 15);
  named('gus2', 'GUS TWO', 15, 11, 15);
  named('linda', 'LINDA', -15, 11, -15);
  named('bob', 'BOB', 15, 11, -15);
  named('dog', 'BISCUIT!', 9, 5.2, -24.2, 0.8);
  const theo = add(label('THEO', 1.3), 0, 0, 0);

  // Props.
  const kevin = sandwich(assets);
  const letters = Array.from({ length: 4 }, () => add(part(assets, [0.7, 0.04, 0.45], [0, 0, 0], 0xf8f8f2, 'SmoothPlastic', { shadows: false }), 0, 0, 0));
  const pup = add(P.dog(assets), 9, 0.6, -25.6, 0);

  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), ...crowd];
  for (const a of everyone) scene.add(a.root);
  A.pell.attach('kevin', kevin, 'r', [0, 0.1, 0.3], [0, 0, 0]);
  // My legs can fade: give them their own see-through-capable materials.
  const legMats = [];
  for (const name of ['LowerTorso', 'RightUpperLeg', 'RightLowerLeg', 'RightFoot', 'LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot'])
    // Only the part's own mesh: its frame also holds the joints below it.
    for (const o of A.me.rig.parts[name].children) {
      if (!o.isMesh) continue;
      o.material = o.material.clone();
      o.material.transparent = true;
      legMats.push(o.material);
    }

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  const at = (who, x, z, { hold = [], ...opts } = {}) => {
    who.set({ at: [O.x + x, O.z + z], ...opts });
    for (const h of hold) who.hold(h);
  };
  const yawTo = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;
  const faceOf = (i, opts) => opts[i % opts.length];

  function cameraAt(t) {
    let i = 0;
    while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
    const cur = KEYS[i];
    const next = KEYS[i + 1];
    let { pos, look, fov } = cur;
    if (next && next.move > 0 && t > next.t - next.move) {
      const u = sm(seg(t, next.t - next.move, next.t));
      pos = pos.map((v, k) => lerp(v, next.pos[k], u));
      look = look.map((v, k) => lerp(v, next.look[k], u));
      fov = lerp(fov, next.fov, u);
    }
    const held = t - cur.t;
    camera.position.set(O.x + pos[0] + Math.sin(held * 0.5) * 0.08, pos[1] + 0.009 * held, O.z + pos[2]);
    camera.lookAt(O.x + look[0], look[1], O.z + look[2]);
    camera.fov = fov - Math.min(3, held * 0.18);
    camera.updateProjectionMatrix();
  }

  // ---- poses -----------------------------------------------------------------------------
  const calling = (t, s = 0) => {
    const p = POSES.yell(t, s);
    p.rArm = [-150 + 12 * Math.sin(t * 5), 0, 30];
    p.rElbow = [-25, 0, 0];
    p.lArm = [-40, 0, 20];
    p.lElbow = [-95, 25, 0]; // hand by my mouth
    return p;
  };
  const cough = (t) => {
    const p = POSES.idle(t);
    const k = Math.max(0, Math.sin(t * 7));
    p.rArm = [-60, 0, 20];
    p.rElbow = [-115, 25, 0];
    p.waist = [12 + 10 * k, 0, 0];
    p.neck = [10 + 6 * k, 0, 0];
    return p;
  };
  const throat = (t) => {
    const p = POSES.idle(t);
    p.rArm = [-45, 0, 22];
    p.lArm = [-45, 0, -22];
    p.rElbow = [-120, 35, 0];
    p.lElbow = [-120, -35, 0];
    p.neck = [-8, 6 * Math.sin(t * 3), 0];
    return p;
  };
  const seatedOnCrate = (t, s) => {
    const p = POSES.sit();
    p.neck = POSES.idle(t, s).neck;
    p.rArm = [-30, 0, 10];
    p.lArm = [-30, 0, -10];
    p.rElbow = [-50, 0, 0];
    p.lElbow = [-50, 0, 0];
    return p;
  };
  const shout = (t, s) => {
    const p = POSES.yell(t, s);
    p.rArm = [-120, 0, 30];
    p.rElbow = [-60, 20, 0];
    return p;
  };

  // ---- the world over time -------------------------------------------------------------------
  const R_HOUSE = { corner: W(9, 'house'), doris: W(9, 'house') + 0.4, ray: W(9, 'house') + 0.8, twins: W(9, 'time'), blue: W(9, 'quiet'), green: W(9, 'like'), harlow: W(9, 'list') };
  const RETURN = { doris: DORIS_BACK, ray: RAY_SAID + 0.25, twins: TWINS_SAID + 0.25 };
  function world(t) {
    // Houses: taken one at a time, back when named.
    for (const [k, h] of Object.entries(H)) {
      const goneAt = R_HOUSE[k];
      const backAt = RETURN[k] ?? ALL_BACK;
      const taken = goneAt !== undefined && t > goneAt && t < backAt;
      h.group.visible = !taken;
      const u = goneAt !== undefined && t >= backAt ? pop(t, backAt) : 1;
      h.group.scale.setScalar(t >= backAt && goneAt !== undefined ? Math.max(0.01, 0.6 + 0.4 * u) : 1);
      h.light.visible = !taken;
    }
    H.harlow.porch.visible = !(t > PORCH_GONE && t < ALL_BACK);
    town.bakery.group.visible = !(t > BAKERY_GONE && t < ALL_BACK);
    const blank = t > SIGN_BLANK && t < ALL_BACK;
    town.bakery.sign.material.map = town.bakery.sign.material.emissiveMap = blank ? town.bakery.blank : town.bakery.full;
    town.bakery.group.scale.setScalar(t > ALL_BACK ? Math.max(0.01, 0.6 + 0.4 * pop(t, ALL_BACK)) : 1);
    // Lamps: Gus and Gus Two go out, then get taken.
    for (const [k, outAt] of [['gus', GUS_OUT], ['gus2', GUS2_OUT]]) {
      const l = L[k];
      const out = t > outAt && t < ALL_BACK;
      l.bulb.visible = !out;
      l.fixture.visible = !out;
      l.group.visible = !(t > outAt + 0.35 && t < ALL_BACK);
    }
    // Mr. Pell's door.
    H.pell.doorPivot.rotation.y = -1.4 * sm(seg(t, W(11, 'opened') - 0.1, W(11, 'opened') + 0.4)) * (t < W(15, 'Then') ? 1 : 0);
    H.harlow.doorPivot.rotation.y = -1.4 * sm(seg(t, HARLOW_IN - 0.2, HARLOW_IN + 0.2)) * (1 - seg(t, W(9, 'The') - 0.3, W(9, 'The')));

    // The fog ring.
    const R = ringAt(t);
    const thick = 1 + 0.4 * seg(t, PAST_FENCE, BAKERY_GONE) * (1 - seg(t, W(15, 'And'), W(15, 'fence')));
    // Clear pockets: houses the fog hasn't taken, or has given back.
    const pockets = [[H.pell.at, 15]];
    for (const [k, h] of Object.entries(H)) if (k !== 'pell' && t > (RETURN[k] ?? ALL_BACK)) pockets.push([h.at, 15]);
    const cam = camera.position;
    const smooth = (a, b, x) => sm(seg(x, a, b));
    puffs.forEach((s, i) => {
      const d = s.userData;
      const an = d.an + t * d.spin;
      const rad = R + d.dr * thick + Math.sin(t * 0.4 + d.bob) * 1.2;
      const x = Math.cos(an) * rad;
      const z = Math.sin(an) * rad;
      s.position.set(O.x + x, d.y + Math.sin(t * 0.6 + d.bob) * 0.4, O.z + z);
      s.scale.setScalar(d.size * (0.9 + 0.1 * Math.sin(t * 0.5 + i)));
      let o = 0.22 + 0.1 * thick;
      o *= smooth(3, 12, s.position.distanceTo(cam)); // never a wall of white over the lens
      for (const [[px, pz], pr] of pockets) o *= smooth(pr * 0.5, pr, Math.hypot(x - px, z - pz));
      s.material.opacity = o;
      s.visible = o > 0.01;
    });
    // Cold at my feet; then it snaps away.
    const gather = seg(t, COLD - 0.6, COLD + 1.2) * (t < SNAP ? 1 : 0);
    const blast = seg(t, SNAP, SNAP + 0.7);
    feet.forEach((s) => {
      const d = s.userData;
      const show = (t > COLD - 0.6 && t < SNAP + 0.7) || false;
      s.visible = show;
      if (!show) return;
      const rad = (t < SNAP ? lerp(4, d.rad, gather) : d.rad + blast * 9) * (1 + 0.08 * Math.sin(t * 2 + d.an));
      const an = d.an + t * 0.3;
      s.position.set(O.x + Math.cos(an) * rad, d.y + seg(t, FADE, FADE + 2) * 0.3, O.z + Math.sin(an) * rad);
      s.scale.setScalar(d.size * (t < SNAP ? 0.6 + 0.4 * gather + 0.2 * seg(t, FADE, TURN) : 1 - blast * 0.6));
      s.material.opacity = (t < SNAP ? 0.45 * gather : 0.45 * (1 - blast));
    });
    // My legs fade with the cold, and come back with my name.
    const legs = t > FADE - 0.2 && t < SNAP ? 1 - 0.8 * seg(t, FADE - 0.2, TURN + 0.6) : 1;
    for (const m of legMats) m.opacity = legs;

    // Names.
    for (const s of Object.values(labels)) s.visible = false;
    const showLabel = (key, at, until = Infinity) => {
      const s = labels[key];
      if (t < at || t > until + 0.6) return;
      const u = pop(t, at);
      const fade = 1 - seg(t, until, until + 0.6);
      s.visible = true;
      s.scale.set(s.userData.base[0] * u, s.userData.base[1] * u, 1);
      s.material.opacity = fade;
      s.material.color.setScalar(1 + 0.8 * (1 - seg(t, at, at + 0.5)));
    };
    // The nightly call: names light up around the square, one after another.
    const order = ['doris', 'pell', 'corner', 'ray', 'twins', 'blue', 'harlow', 'green', 'bakery', 'gus', 'gus2', 'linda', 'bob'];
    order.forEach((k, i) => showLabel(k, W(3, '212') + 0.1 + i * 0.32, W(4, 'As') + 0.5));
    showLabel('doris', DORIS_SAID, DORIS_BACK + 1.2);
    showLabel('ray', RAY_SAID, RAY_SAID + 1.0);
    showLabel('twins', TWINS_SAID, TWINS_SAID + 1.0);
    showLabel('dog', DOG_SAID - 0.1, BACKED_UP + 0.6);
    order.forEach((k, i) => showLabel(k, TOWN_SHOUTS + (i % 7) * 0.12, W(16, 'Everyone')));
    theo.visible = false;
    const theoAt = (when, until, big) => {
      if (t < when || t > until) return;
      theo.visible = true;
      const u = pop(t, when);
      const k = big ? 1.4 : 0.8;
      theo.scale.set(3.6 * 1.3 * k * u, 0.9 * 1.3 * k * u, 1);
      theo.material.opacity = 1;
      theo.material.color.setScalar(1 + (1 - seg(t, when, when + 0.6)));
    };
    theoAt(THEO + 0.1, SNAP + 1.5, false);
    theoAt(SHOUT, END + 1, true);
    const meHead = A.me.headPos(new THREE.Vector3());
    theo.position.set(meHead.x, meHead.y + 2.6, meHead.z);
  }

  // ---- characters ----------------------------------------------------------------------------
  function people(t) {
    const run = t > W(11, 'I') && t < W(16, 'Everyone');
    // Me.
    let pose = calling(t);
    let face = ['happy'];
    let pos = [0, 0];
    let y = CRATE_TOP;
    let yaw = 0;
    if (t < W(3, "I'm")) (pose = calling(t)), (face = 'happy');
    if (t > W(5, 'Last')) (pose = cough(t)), (face = ['sad', 'face-addon-sweat-drop']);
    if (t > W(6, 'By')) (pose = calling(t)), (face = ['sad', 'face-addon-sweat-drop']);
    if (t > CRACK) face = ['face-eyes-shocked', 'face-addon-sweat-drop'];
    if (t > WHISPER) (pose = cough(t)), (face = ['face-worry-manga', 'face-addon-sweat-drop']);
    if (t > NO_VOICE) (pose = throat(t)), (face = ['face-terrified', 'face-addon-sweat-drop']);
    if (t > W(10, 'I')) (pose = POSES.idle(t)), (face = ['face-worry-manga', 'face-addon-sweat-drop']);
    if (t > W(10, 'But')) face = ['smirk', 'face-addon-sweat-drop'];
    if (run) {
      // Door to door: Mr. Pell's, then along the houses pointing.
      y = 0;
      const path = [[0, 0, W(11, 'I')], [-23.6, 0.6, W(11, 'banged') - 0.15], [-23.6, 0.6, W(14, 'I')], [-22.4, -10.6, W(14, 'Point')], [-20.6, -22.8, W(14, 'Point', 1)], [-6.0, -24.0, W(14, 'Point', 2)], [4.6, -22.6, W(14, 'twins') + 0.4], [4.6, -22.6, W(15, 'Then')], [0, 6.6, W(16, 'Everyone')]];
      let k = 0;
      while (k + 2 < path.length && t > path[k + 1][2]) k++;
      const [ax, az, at0] = path[k];
      const [bx, bz, at1] = path[k + 1];
      const u = seg(t, at0, at1);
      pos = [lerp(ax, bx, u), lerp(az, bz, u)];
      const moving = u > 0 && u < 1 && Math.hypot(bx - ax, bz - az) > 0.5;
      yaw = moving ? yawTo([ax, az], [bx, bz]) : yawTo(pos, [-30, 0]);
      pose = moving ? POSES.run(t) : POSES.idle(t);
      face = ['smirk', 'face-addon-sweat-drop'];
      if (t > W(11, 'banged') - 0.15 && t < W(11, 'opened')) (pose = POSES.idle(t)), (pose.rArm = [-80 + 25 * Math.sin(t * 22), 0, 10]), (pose.rElbow = [-60, 0, 0]), (yaw = -90);
      if (t > W(11, 'pointed') - 0.1 && t < W(14, 'I')) (pose = POSES.point(t)), (yaw = yawTo(pos, [-30, -13])), (face = ['face-worry-manga', 'face-addon-sweat-drop']);
      if (t > DORIS_BACK && t < W(14, 'I')) face = ['grin', 'face-addon-sweat-drop'];
      for (const pt of ['Point', 'Point1', 'Point2']) {
        const n = pt === 'Point' ? 0 : Number(pt.slice(5));
        const tp = W(14, 'Point', n);
        if (t > tp && t < tp + 0.45) (pose = POSES.point(t)), (face = 'grin');
      }
      if (t > W(14, 'twins') + 0.4 && t < W(15, 'Then')) (pose = POSES.cheer(t)), (face = 'grin'), (yaw = 180);
      if (t > W(15, 'Then')) face = 'grin';
    }
    if (t > W(16, 'Everyone')) (y = CRATE_TOP), (pos = [0, 0]), (yaw = 0), (pose = POSES.cheer(t)), (face = 'grin');
    if (t > SIT) {
      pose = seatedOnCrate(t, 0);
      y = CRATE_TOP - 0.7;
      face = 'happy';
    }
    if (t > COLD) face = ['face-eyes-shocked', 'face-addon-sweat-drop'];
    if (t > W(18, 'I')) face = ['sad', 'face-about-to-cry'];
    if (t > FADE) face = ['face-terrified', 'face-addon-tears'];
    if (t > THEO) face = ['face-eyes-shocked', 'face-addon-tears'];
    if (t > SNAP) (face = ['happy', 'face-addon-tears']), (pose = seatedOnCrate(t, 0)), (pose.neck = [-6, 20, 0]);
    if (t > NOW) (pose = calling(t)), (y = CRATE_TOP), (face = 'happy');
    if (t > SHOUT) (pose = POSES.cheer(t)), (face = ['grin', 'face-addon-blush']);
    if (t > W(25, 'And')) (pose = POSES.idle(t)), (face = ['happy', 'face-addon-blush']);
    at(A.me, ...pos, { y, yaw, pose, face });

    // Mr. Pell: lunch on a bench; later at his door.
    if (t > W(1, 'Mr') - 0.1 && t < W(2, 'Once')) {
      const p = POSES.sit();
      p.lift = -1 + 0.2;
      p.rArm = [-75, 0, 14];
      p.rElbow = [-60, 0, 0];
      at(A.pell, -8, 6.2, { y: 0, yaw: 0, pose: p, face: t > W(1, 'Kevin') ? 'happy' : 'neutral', hold: ['kevin'] });
    }
    if (t > W(11, 'opened') - 0.1 && t < W(14, 'I') + 0.6) {
      let p = POSES.idle(t, 1);
      let f = ['face-eyes-shocked'];
      if (t > W(11, 'pointed')) f = 'suspicious';
      if (t > DORIS_SAID - 0.2) (p = POSES.point(t, 1)), (f = 'happy');
      at(A.pell, -26.4, 0.2, { y: 0.6, yaw: t > DORIS_SAID - 0.2 ? yawTo([-26.4, 0.2], [-30, -13]) : 90, pose: p, face: f });
    }

    // Mail carrier dropping letters into the hole.
    if (t > W(2, 'Once') - 0.1 && t < W(3, "I'm")) {
      const p = POSES.idle(t, 2);
      p.rArm = [-70, 0, 14];
      p.rElbow = [-20, 0, 0];
      at(A.mail, 13.0, 15.0, { yaw: -90, pose: p, face: t > W(2, 'letters') ? 'suspicious' : 'neutral' });
      letters.forEach((l, i) => {
        const t0 = W(2, 'letters') - 0.2 + i * 0.35;
        const u = seg(t, t0, t0 + 0.6);
        l.visible = t > t0 && u < 1;
        l.position.set(O.x + lerp(12.2, 11.2, u), lerp(3.6, -1.0, u * u), O.z + 15.2);
        l.rotation.set(u * 3 + i, u * 2, 0);
      });
    } else letters.forEach((l) => (l.visible = false));

    // Mrs. Harlow on her porch, then safely inside.
    if (t > W(8, 'Mrs') - 0.1 && t < W(9, 'The')) {
      const inside = seg(t, HARLOW_IN, HARLOW_IN + 0.8);
      const hp = inside > 0 ? POSES.walk(t, 2, 30, 1.8) : t > PORCH_GONE ? POSES.shocked(t, 2) : POSES.idle(t, 2);
      if (inside < 1) at(A.harlow, lerp(25.2, 27.6, inside), 2.0, { y: 0.6, yaw: inside > 0 ? 90 : -90, pose: hp, face: t > PORCH_GONE ? ['face-terrified', 'face-addon-sweat-drop'] : 'happy' });
    }

    // Doris, Ray and the twins call the next name from their porches.
    const porchCall = (who, x, z, yaw, from, until, s) => {
      if (t < from || t > until) return;
      at(who, x, z, { y: 0.6, yaw, pose: shout(t, s), face: 'grin' });
    };
    porchCall(A.doris, -25.6, -13.0, 90, DORIS_BACK, W(15, 'Then'), 3);
    porchCall(A.ray, -20.0, -26.6, 0, RAY_SAID + 0.2, W(15, 'Then'), 4);
    if (t > TWINS_SAID + 0.2 && t < W(15, 'Then')) {
      at(A.twinA, 5.8, -26.6, { y: 0.6, size: 0.75, yaw: 0, pose: t > DOG_SAID - 0.2 ? POSES.cheer(t, 5) : POSES.idle(t, 5), face: t > DOG_SAID - 0.2 ? ['grin', 'face-addon-blush'] : 'happy' });
      at(A.twinB, 8.2, -26.6, { y: 0.6, size: 0.75, yaw: 0, pose: t > DOG_SAID - 0.2 ? POSES.cheer(t, 6) : POSES.idle(t, 6), face: t > DOG_SAID - 0.2 ? ['grin', 'face-addon-blush'] : 'happy' });
    }
    pup.visible = t > TWINS_SAID + 0.2 && t < W(15, 'Then');
    pup.userData.tail.rotation.y = 0.6 * Math.sin(t * 16);

    // The whole town out on the porches, shouting names; then gathered in the square.
    const porches = [H.pell, H.doris, H.ray, H.twins, H.harlow, H.corner, H.blue, H.green];
    const townsfolk = [A.pell, A.doris, A.ray, A.twinA, A.harlow, crowd[0], crowd[1], crowd[2]];
    if (t > W(15, 'Then') && t < W(16, 'Everyone')) {
      porches.forEach((h, i) => {
        const ds = h.doorstep;
        const towards = yawTo(ds, [0, 0]);
        const off = [Math.sin((towards * Math.PI) / 180) * -1.8, Math.cos((towards * Math.PI) / 180) * -1.8];
        at(townsfolk[i], ds[0] + off[0], ds[1] + off[1], { y: 0.6, yaw: towards + (i % 2 ? 25 : -25), pose: shout(t, i), face: 'grin', size: townsfolk[i] === A.twinA ? 0.75 : 1 });
      });
    }
    if (t > W(16, 'Everyone')) {
      const gathered = [A.pell, A.doris, A.ray, A.twinA, A.twinB, A.harlow, A.mail, ...crowd.slice(0, 5)];
      gathered.forEach((who, i) => {
        let [x, z] = RING_CROWD[i];
        // The crowd parts for my sister.
        if (t > SISTER - 0.4 && Math.abs(x) < 3) x += Math.sign(x || 1) * 1.6 * seg(t, SISTER - 0.4, SISTER + 0.3);
        let p = t < SIT ? POSES.cheer(t, i) : POSES.idle(t, i);
        let f = faceOf(i, ['grin', 'happy']);
        if (t > COLD) f = faceOf(i, ['happy', 'neutral']);
        if (t > TURN) (p = POSES.idle(t, i)), (f = faceOf(i, ['face-eyes-shocked', 'face-worry-manga', 'sad']));
        if (t > SNAP) (p = POSES.cheer(t, i)), (f = faceOf(i, ['grin', 'happy']));
        if (t > NOW) (p = POSES.idle(t, i)), (f = 'happy');
        if (t > SHOUT - 0.1) (p = shout(t, i)), (f = 'grin');
        const look = t > TURN || t < SIT ? 0 : 0;
        at(who, x, z, { yaw: yawTo([x, z], [0, 0]) + look, size: who === A.twinA || who === A.twinB ? 0.75 : 1, pose: p, face: f });
      });
      // My little sister pushes through.
      if (t > SISTER - 0.5) {
        const u = seg(t, SISTER - 0.5, THEO - 0.1);
        const sp = t > SNAP + 0.8 ? [lerp(0.6, 1.9, seg(t, SNAP + 0.8, NOW)), lerp(2.4, 1.2, seg(t, SNAP + 0.8, NOW))] : [lerp(0.2, 0.6, u), lerp(11.5, 2.4, u)];
        let p = u < 1 ? POSES.run(t, 7) : POSES.idle(t, 7);
        let f = ['face-worry-manga', 'face-addon-sweat-drop'];
        if (t > THEO - 0.1) (p = POSES.idle(t, 7)), (f = ['sad', 'face-addon-tears']);
        if (t > SNAP) (p = POSES.cheer(t, 7)), (f = ['grin', 'face-addon-tears']);
        if (t > NOW) (p = POSES.idle(t, 7)), (f = 'happy');
        if (t > SHOUT - 0.1) (p = shout(t, 7)), (f = 'grin');
        at(A.sister, ...sp, { yaw: t > NOW ? 20 : 200, size: 0.8, pose: p, face: f });
      }
    }
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    lightingMood(scene, sun, 'night');
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.12)) * 0.85);
    cameraAt(t);
    people(t);
    world(t); // after people: my name floats over where I am this frame
    captions(t);
  };
}
