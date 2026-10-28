// "Return to Sender" — a Roblox story Short. Narration and word timings:
// assets/voice/returntosender (tools/narrate.py, tools/align.py); script: scripts/returntosender.md.
//
// In this town whatever you throw away comes back by morning, so every house fills up with
// junk, and Mayor Crumb gets rid of his by giving it away as gifts (you can't throw a gift
// away). Places: the town (buildFogTown in daylight), our junk-filled house, Grandma's living
// room with a boat in it, and my guest room. R6 characters, 2D faces only, no music.
import * as THREE from 'three';
import words from '../../assets/voice/returntosender/words.json' with { type: 'json' };
import { SKIN, part, cylinder, ball, wedge } from '../src/roblox.js';
import { buildFogTown, buildKitchen, buildBedroom } from '../src/rooms.js';
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
const popIn = (t, at, dur = 0.35) => (t < at ? 0 : ease('Back', 'Out', seg(t, at, at + dur)));
const rad = (deg) => (deg * Math.PI) / 180;
const yawToward = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;

// Places.
const T = new THREE.Vector3(5000, 0, 0); // the town
const K = new THREE.Vector3(5000, 0, 400); // our house (full of junk)
const G = new THREE.Vector3(5400, 0, 400); // Grandma's living room (full of boat)
const B = new THREE.Vector3(5800, 0, 400); // my guest room

// Beats.
const TOSS = W(0, 'throw');
const LAND = TOSS + 0.4;
const BAG_BACK = W(0, 'morning') - 0.15;
const SPOT = W(0, 'Same');
const SMELL = W(0, 'Same', 1);
const NOBODY = W(1, 'So');
const GARBAGE = W(1, 'Garbage');
const DENTIST = W(1, 'My');
const DRAWER = W(1, 'drawer');
const REGRETS = W(1, 'Regrets');
const UNCLE = W(1, 'And');
const PEEL_THROW = W(1, 'throw');
const PEEL_BACK = W(1, '1998') - 0.1;
const MUSEUM = W(1, "It's");
const WARM = W(1, 'warm');
const FULL = W(2, "Everyone's");
const T_HOME = W(2, 'My') - 0.08;
const COUCH = W(2, 'couch');
const T_MAYOR = W(3, 'Then') - 0.08;
const LOOPHOLE = W(3, 'loophole');
const GIVES = W(4, 'He');
const SOFA = W(5, 'Congratulations');
const PIANO = W(5, 'A', 1);
const FRIDGE = W(5, 'Happy');
const FIRE = W(5, 'also');
const DRAG = W(6, 'And');
const BOUNCE = W(6, 'rule');
const FILLING = W(6, 'So');
const BOAT_GIFT = W(7, 'Then');
const ACTUAL = W(8, 'An');
const UPSTAIRS = W(8, 'She');
const LAUNCH = W(8, 'It');
const CRASH = W(8, 'wall') - 0.06;
const T_GLIVING = W(8, "She's") - 0.08;
const OWN_ROOM = W(8, 'In', 1);
const T_MOSTLY = W(8, 'Because') - 0.08;
const DOCTOR = W(9, 'The');
const COLLAPSE = W(9, 'collapse');
const FESTIVAL = W(10, 'So');
const WALK = W(10, 'I');
const STATUE = W(10, 'a');
const SMILE = W(10, 'I', 1);
const GIFT_YOU = W(10, 'Mayor');
const HOLD_CARD = W(10, 'gift');
const CARD = W(11, 'I');
const LAUGH = W(12, 'He');
const OPEN = W(13, 'Open');
const LIST = W(14, 'Inside');
const EVERY = W(14, 'Every');
const RETURN = W(14, 'Return');
const SENDER = W(14, 'sender');
const CHEER = W(15, 'The');
const MARCH = W(15, 'Then');
const ITEMS = [W(15, 'boat'), W(15, 'piano'), W(15, 'fridge'), W(15, 'banana')];
const THANK = W(16, 'Thank');
const ONE = W(16, 'one');
const THUNKS = [W(16, 'Thunk'), W(16, 'Thunk', 1), W(16, 'Thunk', 2)];
const STILL = W(17, "He's");
const PULL = W(17, 'Nobody');
const NEW_MAYOR = W(18, 'And');
const KEEP = W(18, 'The', 1);
const INCLUDING = W(18, 'Including');
const T_GUEST = W(19, "He's") - 0.08;
const CUTS = [T_HOME, T_MAYOR, T_GLIVING, T_MOSTLY, T_GUEST];
const IMPACTS = [[CRASH, 0.35], ...THUNKS.map((k) => [k, 0.22])];

// ---- the town (as buildFogTown lays it out) ---------------------------------------------
const HOUSES = { corner: [-32, 14, 90], pell: [-32, 0, 90], doris: [-32, -13, 90], ray: [-20, -33, 0], twins: [7, -33, 0], blue: [20, -33, 0], harlow: [32, 2, -90], green: [32, 15, -90] };
const facing = (name) => HOUSES[name][2]; // yaw of someone facing out of the house
// A point `dist` studs out from a house's centre along the way it faces, `side` studs to the
// right as seen from the street.
function spot(name, dist, side = 0) {
  const [x, z, yaw] = HOUSES[name];
  const f = [Math.sin(rad(yaw)), Math.cos(rad(yaw))];
  return [x + f[0] * dist + f[1] * side, z + f[1] * dist - f[0] * side];
}

/**
 * A stage: a ground spot `c` seen by a camera looking along yaw `a` (degrees, 0 = +z).
 * p(u, v) is a point u studs to screen-right and v studs away from the camera; yaw(cheat) faces
 * the camera, turned `cheat` degrees toward screen-right; cam() is a [position, look, fov] key.
 */
function stage(c, a) {
  const d = [Math.sin(rad(a)), Math.cos(rad(a))];
  const r = [-Math.cos(rad(a)), Math.sin(rad(a))];
  const p = (u = 0, v = 0) => [c[0] + r[0] * u + d[0] * v, c[1] + r[1] * u + d[1] * v];
  const cam = (dist, y, lookY, fov, { u = 0, lookU = u, lookV = 0 } = {}) => {
    const [x, z] = p(u, lookV - dist);
    const [lx, lz] = p(lookU, lookV);
    return [[x, y, z], [lx, lookY, lz], fov];
  };
  return { a, p, cam, yaw: (cheat = 0) => a + 180 + cheat };
}
const houseStage = (name, dist) => stage(spot(name, dist), facing(name) + 180);

const S_OPEN = stage([-21.5, 14], 180);
const S_DENT = houseStage('ray', 10.6);
const S_UNCLE = houseStage('pell', 10.6);
const S_MUSEUM = stage([-5, -7], 180);
const S_MAYOR = houseStage('harlow', 10.8);
const S_GIFT = ['doris', 'twins', 'blue'].map((n) => houseStage(n, 11));
const S_DRAG = stage([-20.5, -13], 180);
const S_BOAT = houseStage('green', 11.5);
const S_WALL = houseStage('green', 5);
const S_DOC = houseStage('green', 11);
const S_FEST = stage([1.5, 6.5], 180);
const S_DOOR = stage([20.8, 2], 0);

// The procession to the mayor's house along z = 3: the boat first, then the piano, the
// burning fridge and the banana peel. The whip-pan centres each one as the narrator names it.
const PATH_Z = 3;
const lead = (t) => 4 + 3.2 * (t - MARCH);
const ITEM_OFF = [0, -9, -14.5, -22];
const whip = (k, dist = 9.5, fov = 54, lookY = 4.4, camY = 4.8, dx = 0) => {
  const x = lead(ITEMS[k]) + ITEM_OFF[k] + dx;
  return [[x, camY, PATH_Z + dist], [x, lookY, PATH_Z], fov];
};

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  mayor: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-business-comb-over', skin: SKIN.porcelain },
  mom: { shirt: 'shirt-vintage-flannel-button-up-2', pants: 'pants-dark-pants', hair: 'hair-elegant-braided-bun', skin: MAIN.skin },
  sister: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-jeans-stars', hair: 'hair-black-cutesy-pigtails', skin: MAIN.skin },
  grandma: { shirt: 'shirt-cottage-core-fairy-vintage', pants: 'pants-dark-pants', hair: 'hair-silver-locks', skin: SKIN.lightOrange },
  dentist: { shirt: 'shirt-doctor', pants: 'pants-kestrel-khaki-textured-pants', hair: 'hair-black-short-parted', skin: SKIN.brown },
  doctor: { shirt: 'shirt-doctor', pants: 'pants-dark-pants', hair: 'hair-grandpa-gray', skin: SKIN.deep },
  uncle: { shirt: 'shirt-mu-red-flannel-black', pants: 'pants-jeans-hip-hop-retro', hair: 'hair-short-wavy-black', skin: MAIN.skin },
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

export const meta = {
  duration: Math.ceil(END * 30) / 30,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'happy', 'grin', 'smirk', 'suspicious', 'sad', 'angry'],
  accessories: [...new Set([...Object.values(CAST), ...CROWD].map((c) => c.hair))],
  clothing: [...new Set([...Object.values(CAST), ...CROWD].flatMap((c) => [c.shirt, c.pants]))],
  audio: [],
};

// ---- sound: voice, effects, and the owner's pick of music under it -------------------------
const sfx = (file, at, volume = 0.8, extra = {}) => meta.audio.push({ file, at, volume, ...extra });
sfx('../voice/returntosender/narration.flac', 0, 1.0);
sfx('temporex-numbers-loop.mp3', 0, 0.22, { dur: END, fade: 1.0 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.3);
sfx('synth/ambience.wav', 0, 0.25, { loop: true, dur: T_HOME, fade: 0.3 });
sfx('synth/whoosh.wav', TOSS, 0.5);
sfx('synth/thud.wav', LAND, 0.4);
sfx('synth/bloop_up.wav', BAG_BACK - 0.05, 0.5);
sfx('synth/pop.wav', BAG_BACK, 0.6);
sfx('bleh-rblx-se.mp3', SMELL + 0.2, 0.45);
sfx('synth/window_slide.wav', DRAWER - 0.1, 0.6);
sfx('synth/whoosh_long.wav', UNCLE - 0.15, 0.3, { pitch: 5 });
sfx('synth/whoosh.wav', PEEL_THROW + 0.1, 0.5);
sfx('synth/bloop_down.wav', PEEL_BACK - 0.3, 0.4);
sfx('synth/punch.wav', PEEL_BACK, 0.6);
sfx('synth/whoosh_long.wav', MUSEUM - 0.15, 0.3, { pitch: 5 });
FAH(WARM + 0.4);
sfx('synth/squeak.wav', W(2, 'bathtub'), 0.35);
sfx('synth/ambience.wav', T_MAYOR, 0.25, { loop: true, dur: T_GLIVING - T_MAYOR, fade: 0.3 });
sfx('mwahahaha.mp3', LOOPHOLE + 0.1, 0.35);
for (const g of [SOFA, PIANO, FRIDGE]) (sfx('synth/pop.wav', g + 0.05, 0.6), sfx('synth/cha_ching.wav', g + 0.1, 0.35));
sfx('huh-rblx-se.mp3', W(5, 'sofa') + 0.3, 0.4);
sfx('sadd-rblx-se.mp3', W(5, 'piano') + 0.25, 0.4);
sfx('ahh-rblx-scared.mp3', FIRE + 0.25, 0.45);
FAH(W(5, 'fire') + 0.45);
sfx('synth/bloop_up.wav', BOUNCE - 0.05, 0.5);
sfx('synth/pop.wav', BOUNCE, 0.6);
sfx('synth/pop.wav', BOAT_GIFT + 0.6, 0.6);
sfx('synth/cha_ching.wav', BOAT_GIFT + 0.65, 0.35);
sfx('gaspp.mp3', ACTUAL + 0.1, 0.5);
sfx('synth/whoosh.wav', LAUNCH, 0.6);
sfx('synth/thud.wav', CRASH, 0.9);
sfx('synth/punch.wav', CRASH + 0.04, 0.5);
sfx('snoree-rblx-se.mp3', T_GLIVING + 0.3, 0.45);
FAH(W(8, 'boat', 2) + 0.45);
sfx('synth/squeak.wav', COLLAPSE - 0.1, 0.4, { pitch: -8 });
sfx('synth/squeak.wav', COLLAPSE + 0.3, 0.35, { pitch: -10 });
sfx('synth/ambience.wav', FESTIVAL - 0.1, 0.3, { loop: true, dur: T_GUEST - FESTIVAL, fade: 0.6 });
sfx('woahh-rblx-se.mp3', STATUE + 0.3, 0.35);
sfx('synth/pop.wav', CARD + 0.55, 0.5);
sfx('hahaha-rblx-se.mp3', LAUGH, 0.5, { pitch: -3 });
sfx('synth/slide_up.wav', RETURN - 0.1, 0.5);
sfx('yeaa-rblx-se.mp3', CHEER - 0.1, 0.6);
sfx('yeaa-rblx-se.mp3', CHEER + 0.05, 0.45, { pitch: 4 });
sfx('roblox/action_footsteps_plastic.wav', MARCH + 0.2, 0.45, { loop: true, dur: THANK - MARCH - 0.4, fade: 0.4 });
for (const k of THUNKS) (sfx('synth/thud.wav', k, 0.9), sfx('synth/punch.wav', k + 0.03, 0.4));
sfx('grrr-rblx-se.mp3', PULL + 0.1, 0.35);
sfx('yeaa-rblx-se.mp3', NEW_MAYOR + 0.3, 0.5);
sfx('hi-rblx-se.mp3', INCLUDING + 0.3, 0.35);
sfx('grrr-rblx-se.mp3', W(19, 'throw') - 0.3, 0.3);
FAH(W(19, 'away') + 0.3);

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, place, position, look-at, fov, move seconds]; move 0 is a cut.
const KEYS = [
  [0, T, ...S_OPEN.cam(12.5, 4.8, 3.0, 54, { u: 0.6 }), 0],
  [BAG_BACK + 0.6, T, ...S_OPEN.cam(10.5, 4.6, 2.6, 50, { u: -1.4 }), 0.9],
  [NOBODY - 0.05, T, [-5, 9.5, 19], [-27, 3, -2], 56, 0],
  [W(1, 'Ever') - 0.05, T, [-7, 8.5, 16], [-27, 3, -2], 52, 0.6],
  [GARBAGE - 0.05, T, [-14.4, 5.4, 21.4], [-15, 4.6, 15.3], 40, 0],
  [DENTIST - 0.05, T, ...S_DENT.cam(10, 4.8, 3.2, 52), 0],
  [DRAWER - 0.25, T, ...S_DENT.cam(5.5, 6.4, 2.0, 46, { u: -1.2 }), 0.5],
  [UNCLE - 0.05, T, ...S_UNCLE.cam(8.5, 4.6, 3.6, 50, { u: 0.4 }), 0],
  [MUSEUM - 0.05, T, ...S_MUSEUM.cam(11, 5.0, 4.6, 54), 0],
  [WARM + 0.2, T, ...S_MUSEUM.cam(6.5, 5.2, 4.2, 44), 0.7],
  [FULL - 0.05, T, [-15.5, 7.5, -25], [-27, 3.2, 6], 52, 0],

  [T_HOME, K, [-5.0, 5.4, 4.6], [-5.0, 2.8, -3.6], 54, 0],
  [COUCH - 0.2, K, [-6.5, 6.4, 8.4], [-2.6, 3.0, -0.6], 60, 0.7],

  [T_MAYOR, T, ...S_MAYOR.cam(9.5, 5.0, 3.6, 50), 0],
  [LOOPHOLE - 0.3, T, ...S_MAYOR.cam(6.5, 4.8, 4.2, 44), 0.6],
  [GIVES - 0.05, T, ...S_MAYOR.cam(6.0, 4.6, 4.0, 44, { u: -0.3 }), 0],
  [SOFA - 0.05, T, ...S_GIFT[0].cam(11.5, 5.2, 3.2, 54, { u: 3.0, lookU: 0.2 }), 0], // clear of the planter
  [PIANO - 0.05, T, ...S_GIFT[1].cam(11.5, 5.2, 3.4, 54, { u: 0.2 }), 0],
  [FRIDGE - 0.05, T, ...S_GIFT[2].cam(13.0, 6.0, 4.6, 56, { u: 0.2 }), 0],
  [FIRE - 0.1, T, ...S_GIFT[2].cam(10.5, 7.0, 6.0, 52, { u: -0.6 }), 0.4],
  [DRAG - 0.05, T, ...S_DRAG.cam(13, 5.0, 2.8, 54), 0],
  [FILLING - 0.05, T, [-8, 13, 16], [-29, 2, -2], 54, 0],
  [BOAT_GIFT - 0.05, T, ...S_BOAT.cam(14, 5.6, 3.0, 54, { u: 3.0, lookU: 0 }), 0], // clear of the planter
  [ACTUAL - 0.05, T, ...S_BOAT.cam(7, 4.6, 4.2, 46, { u: 1.6, lookU: 1.2, lookV: 1.4 }), 0],
  [UPSTAIRS - 0.05, T, ...S_WALL.cam(13, 8.5, 6.8, 50), 0],
  [CRASH + 0.4, T, ...S_WALL.cam(14.5, 8.0, 7.0, 52), 0.5],

  [T_GLIVING, G, [-1.5, 9.5, -1.2], [-6.4, 2.6, -1.8], 46, 0], // from her feet, so her face is upright
  [OWN_ROOM - 0.1, G, [-4.5, 7.0, 7.0], [-6.0, 2.6, -1.8], 56, 0],

  [T_MOSTLY, T, [10, 7.5, 10], [28, 5.5, 15], 54, 0],
  [DOCTOR - 0.05, T, ...S_DOC.cam(10.5, 5.6, 4.8, 54, { u: 0.4 }), 0],

  [FESTIVAL - 0.05, T, [1.5, 8.5, 27], [2.5, 5, 2], 58, 0],
  [WALK - 0.05, T, ...S_FEST.cam(13, 5.5, 3.8, 54, { u: -1.0 }), 0],
  [STATUE - 0.05, T, [3.0, 2.0, 11.5], [5.9, 9.0, 2.5], 56, 0],
  [SMILE - 0.05, T, ...S_FEST.cam(5.5, 4.6, 4.3, 42, { u: -1.1 }), 0],
  [GIFT_YOU - 0.05, T, ...S_FEST.cam(8.5, 5.0, 4.0, 50), 0],
  [CARD + 0.6, T, ...S_FEST.cam(7.0, 4.8, 4.0, 46), 1.0],
  [LAUGH - 0.05, T, ...S_FEST.cam(5.5, 4.8, 4.3, 42, { u: 0, lookU: 1.1 }), 0],
  [OPEN - 0.05, T, ...S_FEST.cam(7.0, 5.0, 3.8, 42, { u: -0.4, lookU: -1.1 }), 0],
  [LIST - 0.05, T, null, null, 36, 0], // over the mayor's shoulder (worked out in setup)
  [SENDER - 0.05, T, ...S_FEST.cam(5.5, 4.8, 4.3, 42, { u: 0, lookU: 1.1 }), 0],
  [CHEER - 0.05, T, [1.5, 7.5, 22], [1.5, 4.5, 3], 58, 0],
  [MARCH - 0.05, T, [26, 6.5, -5], [6, 3, 3], 56, 0],
  [ITEMS[0] - 0.2, T, ...whip(0, 11, 56, 6.0, 5.6), 0],
  [ITEMS[1] - 0.05, T, ...whip(1), 0.35],
  [ITEMS[2] - 0.05, T, ...whip(2, 10.5, 54, 5.0), 0.35],
  [ITEMS[3] - 0.05, T, ...whip(3, 6.0, 46, 2.8, 4.8, 2.2), 0.35],
  [THANK - 0.05, T, ...S_DOOR.cam(11, 5.6, 4.0, 54, { u: 0.6 }), 0],
  [STILL - 0.05, T, ...S_DOOR.cam(12.5, 6.4, 4.8, 54, { u: -0.2 }), 0],
  [NEW_MAYOR - 0.05, T, [0, 6.4, 10.4], [0, 5.6, 0], 46, 0],
  [KEEP - 0.05, T, ...S_DOOR.cam(8.5, 5.0, 4.2, 50, { u: 1.6 }), 0],
  [INCLUDING - 0.05, T, ...S_DOOR.cam(8.0, 8.4, 7.6, 48, { u: 0.4, lookU: -1.4 }), 0.5],

  [T_GUEST, B, [4.0, 5.2, 8.2], [1.9, 3.6, -3.8], 50, 0],
].map(([t, o, pos, look, fov, move]) => ({ t, o, pos, look, fov, move }));
KEYS.forEach((k, i) => {
  if (i && k.t < KEYS[i - 1].t) throw new Error(`camera key ${i} is out of order`);
});

// ---- props -------------------------------------------------------------------------------
const box = (g, a, size, pos, color, mat = 'Plastic', shadows = true) => {
  const m = part(a, size, pos, color, mat, { shadows });
  g.add(m);
  return m;
};

function bow(a, s = 1, color = 0xe53935) {
  const g = new THREE.Group();
  for (const sgn of [-1, 1]) {
    const loop = ball(a, 0.45 * s, [sgn * 0.42 * s, 0.25 * s, 0], color, 'Fabric');
    loop.scale.set(1.2, 0.7, 0.6);
    g.add(loop);
  }
  g.add(ball(a, 0.25 * s, [0, 0.25 * s, 0], 0xb71c1c, 'Fabric'));
  return g;
}

/** Ribbon around a box of size [w, h, d] (standing on y = 0) plus a bow on top. */
function wrap(a, g, w, h, d, color = 0xe53935) {
  box(g, a, [0.25, h + 0.04, d + 0.04], [0, h / 2, 0], color, 'Fabric', false);
  box(g, a, [w + 0.04, h + 0.04, 0.25], [0, h / 2, 0], color, 'Fabric', false);
  const b = bow(a, Math.max(1, Math.min(w, d) / 2.4), color);
  b.position.y = h;
  g.add(b);
  return b;
}

function trashBag(a) {
  const g = new THREE.Group();
  const sack = ball(a, 0.6, [0, 0.55, 0], 0x23312a, 'Plastic');
  sack.scale.set(1, 1.15, 0.9);
  g.add(sack);
  g.add(ball(a, 0.18, [0, 1.2, 0], 0x23312a, 'Plastic'));
  return g;
}

function sofa(a, color = 0x8a5a7a) {
  const g = new THREE.Group();
  const cushion = new THREE.Color(color).offsetHSL(0, 0, 0.1).getHex();
  box(g, a, [4.2, 1.0, 2.0], [0, 0.8, 0], color, 'Fabric');
  box(g, a, [4.2, 1.8, 0.5], [0, 1.6, -0.75], color, 'Fabric');
  for (const s of [-1, 1]) box(g, a, [0.5, 1.5, 2.0], [s * 2.1, 1.05, 0], color, 'Fabric');
  for (const s of [-1, 1]) box(g, a, [1.8, 0.35, 1.5], [s * 0.95, 1.45, 0.15], cushion, 'Fabric');
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) box(g, a, [0.25, 0.3, 0.25], [x, 0.15, z], 0x3a2a1a, 'Wood');
  return g;
}

function piano(a) {
  const g = new THREE.Group();
  box(g, a, [4.4, 3.4, 1.4], [0, 1.9, -0.3], 0x1b1b1b, 'SmoothPlastic');
  box(g, a, [4.4, 0.3, 1.0], [0, 2.3, 0.85], 0x1b1b1b, 'SmoothPlastic');
  box(g, a, [4.0, 0.12, 0.8], [0, 2.5, 0.95], 0xf4f4f0, 'SmoothPlastic');
  for (let k = 0; k < 13; k++) if (k % 7 !== 2 && k % 7 !== 6) box(g, a, [0.14, 0.12, 0.45], [-1.85 + k * 0.3, 2.6, 0.75], 0x1b1b1b, 'SmoothPlastic', false);
  box(g, a, [0.9, 0.14, 0.82], [0.9, 2.46, 0.95], 0x2a2a2a, 'Plastic', false); // missing keys
  const lid = box(g, a, [4.4, 0.15, 1.5], [0.3, 3.85, 0.1], 0x1b1b1b, 'SmoothPlastic');
  lid.rotation.z = -0.35; // hanging off one hinge
  for (const s of [-1, 1]) box(g, a, [0.3, 2.0, 0.3], [s * 2.0, 1.0, 1.1], 0x1b1b1b, 'SmoothPlastic');
  return g;
}

/** Fire: glowing tongues that rise, shrink and fade; call userData.at(t) every frame. */
function flames() {
  const g = new THREE.Group();
  const bits = [];
  for (let k = 0; k < 24; k++) {
    const color = new THREE.Color([0xff3d00, 0xff7a00, 0xffb300][k % 3]).multiplyScalar(2.2); // over 1, so it blooms
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 5), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    g.add(m);
    bits.push(m);
  }
  g.userData.at = (t) =>
    bits.forEach((m, k) => {
      const life = (t * 1.6 + k * 0.137) % 1;
      const r = 1.1 * (1 - life) * (0.55 + 0.45 * Math.sin(k * 1.9));
      m.position.set(Math.cos(k * 2.4) * r, 0.2 + life * 2.2, Math.sin(k * 2.4) * r * 0.8);
      const s = (1 - life) * (0.8 + 0.4 * Math.sin(t * 20 + k));
      m.scale.set(s, s * 1.3, s);
      m.rotation.y = t * 3 + k;
      m.material.opacity = 0.95 * (1 - life * 0.6);
    });
  return g;
}

function boat(a) {
  const g = new THREE.Group();
  box(g, a, [7.0, 1.8, 3.2], [-0.8, 1.1, 0], 0xf4f4f0, 'SmoothPlastic');
  g.add(wedge(a, [3.2, 1.8, 2.6], [3.95, 1.1, 0], 0xf4f4f0, 'SmoothPlastic', -Math.PI / 2));
  box(g, a, [7.05, 0.35, 3.25], [-0.8, 0.55, 0], 0x1f4f9a, 'SmoothPlastic', false);
  box(g, a, [7.05, 0.15, 3.25], [-0.8, 2.0, 0], 0x1f4f9a, 'SmoothPlastic', false);
  box(g, a, [3.0, 1.5, 2.4], [-1.8, 2.75, 0], 0xf4f4f0, 'SmoothPlastic');
  box(g, a, [3.05, 0.6, 2.45], [-1.8, 3.0, 0], 0x7fb4d9, 'Glass', false);
  box(g, a, [0.15, 2.2, 0.15], [-0.2, 3.6, 0], 0x8d8f94, 'Metal');
  for (const s of [-1, 1]) {
    const name = P.sign(a, 3.2, 0.6, 'S.S. CRUMB', { bg: '#f4f4f0', fg: '#1f4f9a', size: 110 });
    name.position.set(-1.0, 1.3, s * 1.64);
    name.rotation.y = s > 0 ? 0 : Math.PI;
    name.scale.z = 0.3;
    g.add(name);
  }
  const b = bow(a, 1.8);
  b.position.set(0.6, 2.05, 0);
  g.add(b);
  g.userData.bow = b;
  return g;
}

function trailer(a) {
  const g = new THREE.Group();
  box(g, a, [8.0, 0.4, 2.6], [0, 0.9, 0], 0x5d6066, 'Metal');
  box(g, a, [2.2, 0.25, 0.25], [5.0, 0.9, 0], 0x5d6066, 'Metal');
  for (const s of [-1, 1]) {
    const w = cylinder(a, 0.6, 0.4, [0, 0.6, s * 1.4], 0x1b1b1b, 'Plastic');
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  return g;
}

function bathtub(a) {
  const g = new THREE.Group();
  box(g, a, [5.2, 0.3, 3.0], [0, 0.55, 0], 0xf4f4f0, 'SmoothPlastic');
  for (const s of [-1, 1]) box(g, a, [5.2, 1.5, 0.25], [0, 1.3, s * 1.4], 0xf4f4f0, 'SmoothPlastic');
  for (const s of [-1, 1]) box(g, a, [0.25, 1.5, 3.0], [s * 2.5, 1.3, 0], 0xf4f4f0, 'SmoothPlastic');
  for (const [x, z] of [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]]) g.add(ball(a, 0.3, [x, 0.3, z], 0xe2b33c, 'Metal'));
  box(g, a, [0.3, 0.9, 0.3], [-2.4, 2.4, -1.0], 0xc0c4c8, 'Metal');
  return g;
}

function cabinet(a) {
  const g = new THREE.Group();
  box(g, a, [2.6, 3.4, 1.6], [0, 1.7, 0], 0xf4f4f0, 'SmoothPlastic');
  const drawer = new THREE.Group();
  box(drawer, a, [2.2, 0.9, 0.12], [0, 0, 0.85], 0xe8e8e0, 'SmoothPlastic');
  box(drawer, a, [2.1, 0.12, 1.5], [0, -0.38, 0.1], 0xd8d8d0, 'SmoothPlastic');
  for (const s of [-1, 1]) box(drawer, a, [0.1, 0.6, 1.5], [s * 1.0, -0.15, 0.1], 0xd8d8d0, 'SmoothPlastic');
  const r = rng(9);
  for (let k = 0; k < 48; k++) box(drawer, a, [0.16, 0.2, 0.16], [-0.9 + r() * 1.8, -0.22 + r() * 0.12, -0.55 + r() * 1.3], 0xfffbea, 'SmoothPlastic', false);
  const label = P.sign(a, 1.6, 0.42, 'REGRETS', { bg: '#fffbea', fg: '#1b2a35', size: 140, border: '#1b2a35' });
  label.position.set(0, 0.1, 0.94);
  label.scale.z = 0.2;
  drawer.add(label);
  drawer.position.set(0, 2.5, 0);
  g.add(drawer);
  for (const y of [1.4, 0.4]) box(g, a, [2.2, 0.8, 0.1], [0, y + 0.1, 0.82], 0xe8e8e0, 'SmoothPlastic', false);
  g.userData.drawer = drawer;
  return g;
}

/** A banana peel: the empty top, a stem and four strips flopped open. */
function bananaPeel(a, s = 1) {
  const g = new THREE.Group();
  g.add(cylinder(a, 0.2 * s, 0.5 * s, [0, 0.45 * s, 0], 0xf5d33c, 'Plastic'));
  g.add(cylinder(a, 0.08 * s, 0.3 * s, [0, 0.85 * s, 0], 0x6b4a33, 'Plastic'));
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Group();
    spoke.rotation.y = k * (Math.PI / 2) + 0.4;
    spoke.position.y = 0.3 * s;
    const hinge = new THREE.Group();
    hinge.rotation.x = -1.05;
    hinge.add(part(a, [0.32 * s, 0.75 * s, 0.07 * s], [0, -0.37 * s, 0], 0xf5d33c, 'Plastic', { shadows: false }));
    hinge.add(part(a, [0.12 * s, 0.12 * s, 0.08 * s], [0.05 * s, -0.6 * s, 0], 0x6b4a33, 'Plastic', { shadows: false }));
    spoke.add(hinge);
    g.add(spoke);
  }
  return g;
}

function museumCase(a) {
  const g = new THREE.Group();
  box(g, a, [2.4, 2.6, 2.4], [0, 1.3, 0], 0xe8e2d2, 'Marble');
  box(g, a, [2.7, 0.25, 2.7], [0, 2.7, 0], 0xd8d0be, 'Marble');
  g.add(part(a, [2.2, 1.8, 2.2], [0, 3.75, 0], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.18 } }));
  box(g, a, [2.3, 0.12, 2.3], [0, 4.7, 0], 0xc0a060, 'Metal');
  const peel = bananaPeel(a, 1.25);
  peel.position.y = 2.82;
  g.add(peel);
  const plaque = P.sign(a, 2.2, 1.0, "UNCLE GARY'S\nBANANA PEEL, 1998", { bg: '#1b2a35', fg: '#f2b632', size: 90 });
  plaque.position.set(0, 1.7, 1.24);
  plaque.scale.z = 0.3;
  g.add(plaque);
  return g;
}

/** The town museum: a little marble pavilion around the banana peel's case, facing +z. */
function museum(a) {
  const g = new THREE.Group();
  box(g, a, [7.4, 0.35, 6.4], [0, 0.17, 0], 0xd8d0be, 'Marble');
  box(g, a, [6.8, 0.35, 5.8], [0, 0.52, 0], 0xe8e2d2, 'Marble');
  for (const [x, z] of [[-2.9, 2.4], [2.9, 2.4], [-2.9, -2.4], [2.9, -2.4]]) {
    g.add(cylinder(a, 0.35, 5.6, [x, 3.5, z], 0xf2efe6, 'Marble'));
    box(g, a, [0.9, 0.3, 0.9], [x, 0.85, z], 0xd8d0be, 'Marble');
    box(g, a, [0.9, 0.3, 0.9], [x, 6.15, z], 0xd8d0be, 'Marble');
  }
  box(g, a, [7.2, 0.7, 6.2], [0, 6.65, 0], 0xe8e2d2, 'Marble');
  const roofShape = new THREE.Shape([new THREE.Vector2(-3.8, 0), new THREE.Vector2(3.8, 0), new THREE.Vector2(0, 1.6)]);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 6.4, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xd8d0be, roughness: 0.5 }));
  roof.position.set(0, 7.0, -3.2);
  roof.castShadow = true;
  g.add(roof);
  const sign = P.sign(a, 5.2, 0.6, 'TOWN MUSEUM', { bg: '#e8e2d2', fg: '#6b4a33', size: 120 });
  sign.position.set(0, 6.65, 3.12);
  sign.scale.z = 0.2;
  g.add(sign);
  const exhibit = museumCase(a);
  exhibit.position.y = 0.7;
  g.add(exhibit);
  for (const x of [-1.8, 1.8]) {
    g.add(cylinder(a, 0.08, 1.4, [x, 1.4, 1.9], 0xc0a060, 'Metal'));
    g.add(ball(a, 0.14, [x, 2.15, 1.9], 0xc0a060, 'Metal'));
  }
  const rope = cylinder(a, 0.06, 3.6, [0, 1.85, 1.9], 0xb71c1c, 'Fabric');
  rope.rotation.z = Math.PI / 2;
  g.add(rope);
  return g;
}

/** Wavy lines (stink or steam) as a sprite. */
function wavySprite(color, outline = null) {
  const tex = P.canvasTexture(64, 128, (ctx, w, h) => {
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = h - 8; y > 8; y -= 2) {
      const x = w / 2 + Math.sin(y / 14) * w * 0.26;
      if (y === h - 8) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 12;
      ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.stroke();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.5, 1.0, 1);
  return s;
}

function textSprite(text, color = '#ffffff', w = 512) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 128;
  P.drawText(c.getContext('2d'), text, w / 2, 70, w - 12, 80, { color, stroke: '#1b2a35', strokeW: 10 });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

/** A pile of junk filling [w, d] up to height h; grow it with scale.y. */
function junkPile(a, seed, w, d, h) {
  const r = rng(seed);
  const g = new THREE.Group();
  const colors = [0xb5835a, 0xa8753e, 0xc49a6c, 0x8d8f94, 0x6f8fb0, 0xc4281c, 0x4b974b, 0xe2b33c, 0x7a5130, 0xf2f2f2, 0x5d6066];
  const n = Math.round(w * d * h * 0.55);
  for (let k = 0; k < n; k++) {
    const y = h * (1 - Math.sqrt(1 - r())) * 0.92; // more at the bottom
    const spread = 1 - (y / h) * 0.55;
    const s = 0.6 + r() * 1.2 * (1 - (y / h) * 0.5);
    const x = (r() - 0.5) * w * spread;
    const z = (r() - 0.5) * d * spread;
    const c = colors[Math.floor(r() * colors.length)];
    const kind = r();
    let m;
    if (kind < 0.12) {
      m = cylinder(a, 0.5 * s, 0.4 * s, [x, y + 0.3 * s, z], 0x1b1b1b, 'Plastic');
      m.rotation.x = Math.PI / 2;
    } else if (kind < 0.2) m = ball(a, 0.4 * s, [x, y + 0.4 * s, z], c, 'Plastic');
    else m = part(a, [s * (0.8 + r() * 0.6), s * (0.5 + r() * 0.6), s * (0.8 + r() * 0.6)], [x, y + 0.35 * s, z], c, kind < 0.6 ? 'Fabric' : 'WoodPlanks');
    m.rotation.y = r() * Math.PI;
    m.rotation.z = (r() - 0.5) * 0.4;
    g.add(m);
  }
  return g;
}

function card(a) {
  const g = new THREE.Group();
  g.add(part(a, [1.3, 0.9, 0.05], [0, 0, 0], 0xff98dc, 'SmoothPlastic', { shadows: false }));
  g.add(part(a, [0.4, 0.4, 0.06], [0, 0, 0], 0xe53935, 'Plastic', { shadows: false }));
  return g;
}

function listPaper(lines, footer) {
  return P.canvasTexture(480, 640, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ff98dc';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    P.drawText(ctx, 'THANK YOU!', w / 2, 70, w * 0.85, 58, { color: '#c2185b' });
    lines.forEach((l, i) => P.drawText(ctx, l, w / 2, 145 + i * 54, w * 0.86, 38, { color: '#1b2a35' }));
    if (footer) {
      P.drawText(ctx, 'RETURN ALL GIFTS', w / 2, h - 110, w * 0.88, 50, { color: '#d50000' });
      P.drawText(ctx, 'TO SENDER.', w / 2, h - 52, w * 0.88, 50, { color: '#d50000' });
    }
  });
}

function sash(a, text) {
  const g = new THREE.Group();
  for (const z of [0.52, -0.52]) {
    const m = part(a, [0.4, 2.7, 0.05], [0, 0, z], 0xc4281c, 'Fabric', { shadows: false });
    m.rotation.z = -0.78;
    g.add(m);
  }
  if (text) {
    const s = P.sign(a, 1.0, 0.3, text, { bg: '#c4281c', fg: '#f2b632', size: 130 });
    s.position.set(-0.05, 0.05, 0.56);
    s.rotation.z = -0.78;
    s.scale.z = 0.2;
    g.add(s);
  }
  return g;
}

function bowl(a) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, side: THREE.DoubleSide, roughness: 0.4 }));
  b.position.y = 0.45;
  g.add(b);
  g.add(cylinder(a, 0.4, 0.05, [0, 0.38, 0], 0xe2b33c, 'Plastic'));
  return g;
}

function clipboard(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.8, 1.0, 0.06], [0, 0, 0], 0x8a5a3a, 'Wood', { shadows: false }));
  g.add(part(a, [0.7, 0.85, 0.07], [0, -0.04, 0], 0xffffff, 'SmoothPlastic', { shadows: false }));
  return g;
}

function present(a) {
  const g = new THREE.Group();
  box(g, a, [1.0, 0.9, 1.0], [0, 0.45, 0], 0x1f4f9a, 'SmoothPlastic');
  wrap(a, g, 1.0, 0.9, 1.0, 0xf2b632);
  return g;
}

function stall(a, color) {
  const g = new THREE.Group();
  box(g, a, [4.2, 1.6, 2.0], [0, 0.8, 0], 0xb5835a, 'WoodPlanks');
  for (const [x, z] of [[-2, -0.9], [2, -0.9], [-2, 0.9], [2, 0.9]]) box(g, a, [0.2, 4.2, 0.2], [x, 2.1, z], 0xf2f2f2, 'WoodPlanks');
  for (let k = 0; k < 6; k++) box(g, a, [0.72, 0.3, 2.6], [-1.8 + k * 0.72, 4.3, 0], k % 2 ? color : 0xf2f2f2, 'Fabric');
  for (let k = 0; k < 4; k++) g.add(ball(a, 0.3, [-1.2 + k * 0.8, 1.9, 0.2], [0xe53935, 0xf5cd30, 0x4b974b, 0xff98dc][k], 'Plastic'));
  return g;
}

/**
 * A seamless daytime sky (the Roblox skybox's faces don't quite match, and the seam shows when
 * a shot looks into a corner): an equirectangular gradient with soft clouds that wrap around.
 */
function daySky() {
  const tex = P.canvasTexture(2048, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h / 2);
    g.addColorStop(0, '#3f82d0');
    g.addColorStop(0.65, '#7fbbe8');
    g.addColorStop(1, '#d4e9f4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#d4e9f4';
    ctx.fillRect(0, h / 2, w, h / 2);
    const r = rng(5);
    for (let k = 0; k < 70; k++) {
      const y = h * (0.2 + r() * 0.26);
      const flat = 0.25 + (y / h - 0.2) * 0.4; // flatter toward the horizon
      const size = (1 - (y / h - 0.2) * 2.2) * (30 + r() * 70);
      const x = r() * w;
      const alpha = 0.45 + r() * 0.35;
      const puffs = Array.from({ length: 6 }, () => [(r() - 0.5) * size * 2.4, (r() - 0.5) * size * flat, size * (0.5 + r() * 0.6)]);
      for (const dx of [-w, 0, w])
        for (const [px, py, pr] of puffs) {
          // A soft round puff (a radial gradient), squashed flat.
          ctx.save();
          ctx.translate(x + dx + px, y + py);
          ctx.scale(1, flat * 1.6);
          const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, pr);
          soft.addColorStop(0, `rgba(255,255,255,${alpha})`);
          soft.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.8})`);
          soft.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = soft;
          ctx.fillRect(-pr, -pr, pr * 2, pr * 2);
          ctx.restore();
        }
    }
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

/** A white flag on a stick that runs on past the hand (down the arm's -y). */
function whiteFlag(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.14, 3.0, 0.14], [0, -1.5, 0], 0x6b4a33, 'Wood', { shadows: false }));
  g.add(part(a, [1.3, 0.85, 0.05], [0.7, -2.55, 0], 0xf8f8f8, 'Fabric', { shadows: false }));
  return g;
}

function tv(a) {
  const g = new THREE.Group();
  box(g, a, [3.4, 1.4, 1.4], [0, 0.7, 0], 0x6b4a33, 'Wood');
  box(g, a, [3.0, 1.8, 0.2], [0, 2.4, 0], 0x1b1b1b, 'SmoothPlastic');
  box(g, a, [2.8, 1.6, 0.05], [0, 2.4, 0.11], 0x2a3a4a, 'Glass', false);
  return g;
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, renderer, assets, faces, sun }) {
  const town = buildFogTown(scene, assets, T, { plaques: false });
  const H = town.houses;
  // Only the poster's lamppost stays: the others stand in front of the house shots.
  for (const name of ['gus2', 'linda', 'lamp4']) town.lamps[name].group.visible = false;
  buildKitchen(scene, assets, K);
  buildKitchen(scene, assets, G, { seed: 19 });
  buildBedroom(scene, assets, B);
  scene.background = daySky();
  // Daytime: the houses' glowing evening windows become plain glass, the porch bulbs go dim.
  scene.traverse((o) => {
    const m = o.isMesh && o.material;
    if (!m || Array.isArray(m) || !m.emissive) return;
    if (m.emissive.getHex() === 0xffc46b) {
      m.color.setHex(0x8fb4cf);
      m.emissive.setHex(0x000000);
      m.roughness = 0.15;
      m.metalness = 0.3;
    }
    if (m.emissive.getHex() === 0xffd9a0) m.emissiveIntensity = 0.3;
  });
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -55;
  sc.right = sc.top = 55;
  sc.updateProjectionMatrix();
  function light(mood, o, from) {
    lightingMood(scene, sun, mood);
    sun.target.position.set(o.x, 0, o.z);
    sun.position.set(o.x + from[0], from[1], o.z + from[2]);
  }

  // Put a prop at local [x, z] of place o, its front (+z) turned to yawDeg.
  const place = (obj, o, xz, y = 0, yawDeg = 0) => {
    obj.visible = true;
    obj.position.set(o.x + xz[0], y, o.z + xz[1]);
    obj.rotation.set(0, rad(yawDeg), 0);
    return obj;
  };
  const put = (obj, o, xz, y = 0, yawDeg = 0) => {
    scene.add(obj);
    return place(obj, o, xz, y, yawDeg);
  };
  // The yaw that points a prop's +x axis (the boat's bow) along [dx, dz].
  const bowYaw = (dx, dz) => (Math.atan2(-dz, dx) * 180) / Math.PI;

  // ---- town props ----
  const bag = put(trashBag(assets), T, [0, 0]);
  const stink = [0, 1, 2].map(() => put(wavySprite('#7cb342'), T, [0, 0]));
  const steam = [0, 1, 2].map(() => put(wavySprite('#ffffff', '#7a8a99'), T, [0, 0]));
  const poster = put(P.sign(assets, 1.4, 1.6, 'MISSING:\nGARBAGE\nTRUCK', { bg: '#fffbea', fg: '#c4281c', size: 70, border: '#1b2a35' }), T, [-15, 15.28], 4.6);
  poster.scale.z = 0.2;
  const dentCab = put(cabinet(assets), T, S_DENT.p(-1.3, 0.3), 0, S_DENT.yaw(15));
  put(museum(assets), T, [-5, -7]);
  put(P.sign(assets, 4.4, 1.0, 'MAYOR CRUMB', { bg: '#1b2a35', fg: '#f2b632', size: 110, border: '#f2b632' }), T, spot('harlow', 7.9), 6.0, facing('harlow'));
  // Junk on every porch but the mayor's; more piles out front once the gifts start.
  const porchPiles = ['corner', 'pell', 'doris', 'ray', 'twins', 'blue', 'green'].map((name, i) =>
    put(junkPile(assets, 30 + i, 3.2, 2.2, 3.3), T, spot(name, 6.1, i % 2 ? 2.6 : -2.6), 0.6, facing(name)));
  const lawnPiles = ['corner', 'pell', 'doris', 'ray', 'twins', 'blue'].map((name, i) =>
    put(junkPile(assets, 40 + i, 3.0, 2.6, 3.6), T, spot(name, 9.8, i % 2 ? -3.4 : 3.4), 0, facing(name)));
  const DOOR = S_DOOR.p(-1.6, 0);
  const mayorPile = put(junkPile(assets, 77, 6.5, 5.0, 7.6), T, S_DOOR.p(-1.6, 0.3));
  // Gifts.
  const giftSofa = put(sofa(assets), T, [0, 0]);
  wrap(assets, giftSofa, 4.2, 2.5, 2.0);
  const giftPiano = put(piano(assets), T, [0, 0]);
  wrap(assets, giftPiano, 4.4, 3.9, 1.6);
  const giftFridge = put(P.fridge(assets), T, [0, 0]);
  wrap(assets, giftFridge, 3.4, 7.5, 3.0);
  const fire = put(flames(), T, [0, 0]);
  const theBoat = put(boat(assets), T, [0, 0]);
  const theTrailer = put(trailer(assets), T, [0, 0]);
  const debris = Array.from({ length: 10 }, (_, k) => put(part(assets, [0.7, 0.4, 0.3], [0, 0, 0], [0xa9c9a0, 0xf2f2f2, 0x5a3b2b][k % 3], 'WoodPlanks'), T, [0, 0]));
  const peel = put(bananaPeel(assets, 0.8), T, [0, 0]);
  const bananaCase = put(museumCase(assets), T, [0, 0]);
  bananaCase.scale.setScalar(0.5);
  const zzz = textSprite('Z z z', '#cfe8ff', 384);
  scene.add(zzz);
  // Festival decorations (only on festival day).
  const festival = new THREE.Group();
  const flagColors = [0xe53935, 0xf5cd30, 0x1f4f9a, 0x4b974b, 0xff98dc];
  const corners = [[-15, 15], [15, 15], [15, -15], [-15, -15]];
  corners.forEach(([ax, az], c) => {
    const [bx, bz] = corners[(c + 1) % 4];
    for (let k = 1; k < 16; k++) {
      const u = k / 16;
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 3), new THREE.MeshStandardMaterial({ color: flagColors[k % 5], roughness: 0.8 }));
      flag.rotation.x = Math.PI;
      flag.position.set(lerp(ax, bx, u), 8.4 - Math.sin(u * Math.PI) * 1.0, lerp(az, bz, u));
      festival.add(flag);
    }
  });
  for (const [x, z] of corners) festival.add(part(assets, [0.3, 8.6, 0.3], [x, 4.3, z], 0xf2f2f2, 'WoodPlanks'));
  const banner = P.sign(assets, 9, 1.6, 'TOWN FESTIVAL', { bg: '#f2b632', fg: '#c4281c', size: 120, border: '#c4281c' });
  banner.position.set(0, 10.5, -11.3);
  festival.add(banner);
  for (const [x, ry, color] of [[-11, 0.5, 0xe53935], [11, -0.5, 0x1f4f9a]]) {
    const st = stall(assets, color);
    st.position.set(x, 0, -10);
    st.rotation.y = ry;
    festival.add(st);
  }
  for (let k = 0; k < 9; k++) festival.add(ball(assets, 0.45, [-12 + (k % 3) * 0.7, 6 + Math.floor(k / 3) * 0.6, 10 + (k % 2) * 0.5], flagColors[k % 5], 'SmoothPlastic'));
  festival.position.copy(T);
  scene.add(festival);
  const STATUE_AT = S_FEST.p(4.4, 4.0);
  const dolly = put(new THREE.Group(), T, STATUE_AT);
  box(dolly, assets, [4.4, 0.7, 4.4], [0, 0.75, 0], 0x5d6066, 'Metal');
  for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
    const w = cylinder(assets, 0.4, 0.3, [x, 0.4, z], 0x1b1b1b, 'Plastic');
    w.rotation.x = Math.PI / 2;
    dolly.add(w);
  }
  wrap(assets, dolly, 4.4, 1.1, 4.4);
  const LIST_LINES = ['1 SOFA', '1 PIANO (BROKEN)', '1 FRIDGE (ON FIRE)', '1 BOAT', '1 STATUE (4 TONS)', '3,112 OTHER THINGS'];
  const listTex = [listPaper(LIST_LINES.slice(0, 3), false), listPaper(LIST_LINES, false), listPaper(LIST_LINES, true)];
  const bigList = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.73), new THREE.MeshStandardMaterial({ roughness: 0.9, map: listTex[0], side: THREE.DoubleSide }));
  scene.add(bigList);

  // Our house: junk everywhere, the couch on the table, the family in the tub.
  put(junkPile(assets, 51, 5, 4, 4.5), K, [5.0, -3.0]);
  put(junkPile(assets, 52, 4, 3, 3.5), K, [7.5, 5.0]);
  put(junkPile(assets, 53, 5, 3, 5), K, [2.0, -6.0]);
  put(junkPile(assets, 54, 3, 3, 3), K, [-9.0, 6.0]);
  put(sofa(assets, 0x4f6a8a), K, [0, 2.4], 3.2, -40); // the couch we can't get rid of, on the table
  put(bathtub(assets), K, [-5.0, -3.6]);
  // Grandma's living room: TV, sofa, armchair, and a boat through the wall.
  put(tv(assets), G, [7.5, -4.5], 0, -60);
  put(sofa(assets, 0x9a6a4a), G, [6.0, 5.0], 0, 200);
  put(P.chair(assets, 0x8a5a7a, 'Fabric'), G, [3.5, 6.0], 0, 180);
  const gBoat = put(boat(assets), G, [-7.0, -1.8], 0.2);
  gBoat.rotation.z = 0.06;
  gBoat.userData.bow.visible = false;
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.0, 4.8), new THREE.MeshBasicMaterial({ color: 0xbfe4ff })).translateX(G.x - 10.94).translateY(2.6).translateZ(G.z - 1.8));
  for (let k = 0; k < 9; k++) {
    const r = rng(70 + k);
    const plank = part(assets, [0.3, 0.2 + r() * 0.3, 1 + r() * 1.2], [G.x - 10.0 + r() * 2.5, 0.12, G.z - 4.6 + r() * 5.6], [0xf3e7cf, 0xa9c9a0, 0x6b4a33][k % 3], 'WoodPlanks');
    plank.rotation.y = r() * 3;
    scene.add(plank);
  }
  put(part(assets, [2.4, 0.3, 1.7], [0, 0, 0], 0xc96f8e, 'Fabric'), G, [-3.9, -1.8], 3.45); // over her legs
  put(part(assets, [0.9, 0.4, 1.4], [0, 0, 0], 0xf4f4f0, 'Fabric'), G, [-7.4, -1.8], 2.55);
  const gZzz = textSprite('Z z z', '#cfe8ff', 384);
  scene.add(gZzz);

  // ---- cast ----
  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const grey = 0xa3a2a5;
  const statue = new Actor({ assets, faces, face: 'smirk', colors: { head: grey, torso: grey, rArm: grey, lArm: grey, rLeg: grey, lLeg: grey } });
  const everyone = [...Object.values(A), ...crowd, statue];
  for (const a of everyone) scene.add(a.root);
  A.me.attach('bag', trashBag(assets), 'r', [0, -0.2, 0], [0, 0, 0]);
  A.me.attach('card', card(assets), 'r', [0, 0.1, 0.25], [Math.PI / 2, 0, 0]);
  A.me.attach('clip', clipboard(assets), 'r', [0, 0.1, 0.3], [-Math.PI / 2 + 0.3, 0, 0]);
  A.mayor.attach('card', card(assets), 'r', [0, 0.1, 0.25], [Math.PI / 2, 0, 0]);
  A.mayor.attach('present', present(assets), 'r', [0.5, -0.5, 0.2], [0, 0, 0]);
  A.mayor.attach('bowl', bowl(assets), 'r', [0, -0.1, 0.2], [Math.PI / 2, 0, 0]);
  A.mayor.attach('flag', whiteFlag(assets), 'l', [0, -0.1, 0]);
  A.doctor.attach('clip', clipboard(assets), 'r', [0, 0.1, 0.3], [-Math.PI / 2 + 0.3, 0, 0]);
  A.uncle.attach('peel', bananaPeel(assets, 0.6), 'r', [0, -0.2, 0], [Math.PI, 0, 0]);
  const mayorSash = sash(assets, 'MAYOR');
  A.mayor.root.add(mayorSash);
  const mySash = sash(assets, 'MAYOR');
  A.me.root.add(mySash);
  const grandmaLegs = [A.grandma.r6.joints.rLeg, A.grandma.r6.joints.lLeg];

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);
  const stamp = document.createElement('div'); // the flashback's year, like an old camcorder
  stamp.textContent = '1998';
  Object.assign(stamp.style, { position: 'fixed', left: '7vw', top: '6vh', fontFamily: '"Montserrat Black", sans-serif', fontSize: '11vw', color: '#fff6d8',
    WebkitTextStroke: '1.4vw #3a2a1a', paintOrder: 'stroke fill', pointerEvents: 'none', display: 'none' });
  document.body.appendChild(stamp);

  const at = (o, who, xz, opts = {}) => {
    const { hold = [], ...rest } = opts;
    who.set({ at: [o.x + xz[0], o.z + xz[1]], ...rest });
    for (const h of hold) who.hold(h);
  };
  const faceOf = (i, opts) => opts[i % opts.length];

  // Over-the-shoulder on the list in the mayor's hands.
  const MAYOR_F = S_FEST.p(1.1, 0);
  const MAYOR_F_YAW = S_FEST.yaw(-50);
  const mf = [Math.sin(rad(MAYOR_F_YAW)), Math.cos(rad(MAYOR_F_YAW))];
  const mr = [-Math.cos(rad(MAYOR_F_YAW)), Math.sin(rad(MAYOR_F_YAW))]; // his right hand side
  const LIST_AT = [MAYOR_F[0] + mf[0] * 1.9, 4.7, MAYOR_F[1] + mf[1] * 1.9];
  const OTS = KEYS.find((k) => k.t === LIST - 0.05);
  OTS.pos = [MAYOR_F[0] - mf[0] * 1.2 + mr[0] * 1.8, 5.8, MAYOR_F[1] - mf[1] * 1.2 + mr[1] * 1.8];
  OTS.look = [LIST_AT[0], LIST_AT[1] - 0.15, LIST_AT[2]];

  function shake(t) {
    let s = 0;
    for (const [at0, amp] of IMPACTS) if (t >= at0 && t < at0 + 0.5) s += amp * (1 - (t - at0) / 0.5);
    return s;
  }
  function cameraAt(t) {
    let i = 0;
    while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
    const cur = KEYS[i];
    const next = KEYS[i + 1];
    let { pos, look, fov } = cur;
    if (next && next.move > 0 && next.o === cur.o && t > next.t - next.move) {
      const u = sm(seg(t, next.t - next.move, next.t));
      pos = pos.map((v, k) => lerp(v, next.pos[k], u));
      look = look.map((v, k) => lerp(v, next.look[k], u));
      fov = lerp(fov, next.fov, u);
    }
    const held = t - cur.t;
    const o = cur.o;
    const sk = shake(t);
    camera.position.set(o.x + pos[0] + Math.sin(held * 0.5) * 0.08 + sk * Math.sin(t * 71), pos[1] + 0.009 * held + sk * Math.sin(t * 53), o.z + pos[2]);
    camera.lookAt(o.x + look[0], look[1], o.z + look[2]);
    camera.fov = fov - Math.min(3, held * 0.18);
    camera.updateProjectionMatrix();
  }

  // ---- poses ----
  const both = (t, s, ang = -80) => {
    const p = POSES.idle(t, s);
    p.rArm = [ang, 0, 8];
    p.lArm = [ang, 0, -8];
    return p;
  };
  const sitIn = (t, s) => {
    const p = POSES.sit();
    p.neck = POSES.idle(t, s).neck;
    p.rArm = [-20, 0, 12];
    p.lArm = [-20, 0, -12];
    return p;
  };
  const shrug = (t, s) => {
    const p = POSES.idle(t, s);
    p.rArm = [-20, 0, -55];
    p.lArm = [-20, 0, 55];
    p.neck = [0, 0, 8 * Math.sin(t * 2 + s)];
    return p;
  };
  const push = (t, s) => {
    const p = POSES.walk(t, s, 28, 1.4);
    p.rArm = [-88, 0, 10];
    p.lArm = [-88, 0, -10];
    p.pitch = 14;
    return p;
  };
  const carryUp = (t, s) => {
    const p = POSES.walk(t, s, 30, 1.6);
    p.rArm = [-175, 0, -6];
    p.lArm = [-175, 0, 6];
    return p;
  };
  const carryFront = (t, s) => {
    const p = POSES.walk(t, s, 30, 1.6);
    p.rArm = [-80, 0, 10];
    p.lArm = [-80, 0, -10];
    return p;
  };

  // ---- the opening: the trash comes back ----
  function opening(t) {
    const road = S_OPEN.p(3.6, 0.6);
    const step = S_OPEN.p(-2.3, 0);
    let yaw = S_OPEN.yaw(55);
    let pose = POSES.idle(t);
    let face = 'smirk';
    pose.rArm = [lerp(25, -150, ease('Quad', 'Out', seg(t, TOSS - 0.35, TOSS + 0.15))), 0, -8];
    if (t > BAG_BACK + 0.15) (yaw = S_OPEN.yaw(-55)), (pose = POSES.shocked(t)), (face = 'suspicious');
    if (t > SPOT) face = 'angry';
    if (t > SMELL - 0.1) (pose = POSES.shush(t)), (face = 'sad');
    at(T, A.me, S_OPEN.p(-0.6, 0), { yaw, pose, face, hold: t < TOSS + 0.05 ? ['bag'] : [] });
    // The bag: flies to the curb, then it's back on the step.
    bag.visible = t > TOSS + 0.05;
    if (t < BAG_BACK) {
      const v = seg(t, TOSS + 0.05, LAND);
      const hand = A.me.handPos('r');
      bag.position.set(lerp(hand.x, T.x + road[0], v), Math.max(0, lerp(hand.y - 0.6, 0, v) + 2.2 * Math.sin(v * Math.PI)), lerp(hand.z, T.z + road[1], v));
      bag.rotation.set(v * 4, 0, v * 2);
      bag.scale.setScalar(Math.max(0.01, 1 - seg(t, BAG_BACK - 0.12, BAG_BACK)));
    } else {
      place(bag, T, step, 0.3, 30);
      bag.scale.setScalar(Math.max(0.01, popIn(t, BAG_BACK)));
    }
    stink.forEach((s, k) => {
      s.visible = t > SMELL - 0.3;
      const ph = (t * 0.8 + k / 3) % 1;
      s.position.set(T.x + step[0] + (k - 1) * 0.45, 1.6 + ph * 1.4, T.z + step[1] + 0.3);
      s.scale.set(0.45, 0.9, 1);
      s.material.opacity = Math.sin(ph * Math.PI);
    });
  }

  // ---- life in town: hoarding, the poster, the dentist ----
  function hoarders(t) {
    if (t < GARBAGE - 0.05)
      ['corner', 'pell', 'doris'].forEach((name, i) =>
        at(T, crowd[i], spot(name, 10.6, i === 1 ? -1.6 : 1.6), { yaw: facing(name) + (i - 1) * 25, pose: POSES.crossArms(t, i), face: faceOf(i, ['suspicious', 'angry', 'neutral']) }));
    if (t < DENTIST - 0.05) return;
    // The dentist and his drawer of regrets.
    dentCab.userData.drawer.position.z = 1.2 * sm(seg(t, DRAWER - 0.1, DRAWER + 0.4));
    const point = POSES.point(t, 2);
    point.rArm = [-60, 0, 30];
    at(T, A.dentist, S_DENT.p(1.1, 0), { yaw: S_DENT.yaw(-35), pose: t > DRAWER - 0.2 ? point : POSES.talk(t, 2), face: t > REGRETS ? 'sad' : 'happy' });
  }

  // ---- 1998: my uncle throws out a banana peel ----
  function flashback(t) {
    const out = S_UNCLE.p(3.0, -3.5);
    let pose = POSES.idle(t, 6);
    pose.rArm = [lerp(20, -140, ease('Quad', 'Out', seg(t, PEEL_THROW - 0.3, PEEL_THROW + 0.15))), 0, -10];
    let face = 'smirk';
    const holding = t < PEEL_THROW + 0.1;
    at(T, A.uncle, S_UNCLE.p(-0.5, 0), { yaw: S_UNCLE.yaw(t < PEEL_THROW + 0.2 ? 40 : 10), pose, face, hold: holding ? ['peel'] : [] });
    if (holding) return;
    peel.visible = true;
    const head = A.uncle.headPos();
    if (t < PEEL_BACK) {
      // Out, a hover, then back like a boomerang.
      const go = ease('Quad', 'Out', seg(t, PEEL_THROW + 0.1, PEEL_THROW + 0.5));
      const back = ease('Quad', 'In', seg(t, PEEL_BACK - 0.35, PEEL_BACK));
      const p = new THREE.Vector3().lerpVectors(A.uncle.handPos('r'), new THREE.Vector3(T.x + out[0], 3.0, T.z + out[1]), go).lerp(head, back);
      p.y += 1.2 * Math.sin(go * Math.PI) * (1 - back);
      peel.position.copy(p);
      peel.rotation.set(t * 9, t * 5, 0);
      face = t > PEEL_BACK - 0.4 ? 'suspicious' : 'smirk';
    } else {
      peel.position.set(head.x, head.y + 0.35, head.z);
      peel.rotation.set(0, 0, 0);
      pose = POSES.idle(t, 6);
      pose.rArm = [-20, 0, -30];
      pose.lArm = [-20, 0, 30];
      face = 'sad';
    }
    at(T, A.uncle, S_UNCLE.p(-0.5, 0), { yaw: S_UNCLE.yaw(10), pose, face });
  }

  function museumShot(t) {
    steam.forEach((s, k) => {
      s.visible = t > WARM - 0.3;
      const ph = (t * 0.6 + k / 3) % 1;
      const [x, z] = S_MUSEUM.p((k - 1) * 0.35, 0);
      s.position.set(T.x + x, 4.6 + ph * 1.2, T.z + z);
      s.scale.set(0.3, 0.7, 1);
      s.material.opacity = 0.85 * Math.sin(ph * Math.PI);
    });
  }

  function familyTub(t) {
    at(K, A.me, [-6.6, -4.3], { y: -1.0, yaw: 15, pose: sitIn(t, 0), face: 'sad' });
    at(K, A.mom, [-5.0, -4.3], { y: -1.0, yaw: 0, pose: sitIn(t, 1), face: 'neutral' });
    at(K, A.sister, [-3.5, -4.3], { y: -0.8, yaw: -15, size: 0.8, pose: sitIn(t, 2), face: 'happy' });
  }

  // ---- Mayor Crumb and his gifts ----
  function mayorIntro(t) {
    let pose = POSES.crossArms(t, 1);
    let face = 'smirk';
    let hold = [];
    if (t > LOOPHOLE - 0.2) (pose = POSES.holdUp(t, 1)), (face = 'grin');
    if (t > GIVES - 0.05) {
      pose = POSES.holdOut(t, 1);
      pose.rArm = [-75, 0, 2];
      face = t > W(4, 'gives') ? 'grin' : 'smirk';
      hold = ['present'];
    }
    at(T, A.mayor, S_MAYOR.p(0, 0), { yaw: S_MAYOR.yaw(10), pose, face, hold });
  }

  // A gift delivered at a house: the gift, Mayor Crumb, the unlucky homeowner.
  function delivery(t, k, gift, from) {
    const S = S_GIFT[k];
    place(gift, T, S.p(-1.3, 0.3), 0, S.yaw(15));
    gift.scale.setScalar(Math.max(0.01, popIn(t, from)));
    at(T, A.mayor, S.p([2.0, 2.0, 2.5][k], -0.3), { yaw: S.yaw(-40), pose: t < from + 0.6 ? POSES.cheer(t, 1) : POSES.point(t, 1), face: 'grin' });
    const upset = t > from + 0.5;
    at(T, crowd[3 + k], S.p([0, 0, 1.0][k], [2.2, 2.2, 2.6][k]), { yaw: S.yaw(-10), pose: upset ? POSES.shocked(t, k) : POSES.idle(t, k), face: upset ? 'sad' : 'neutral' });
  }

  function gifts(t) {
    if (t < PIANO - 0.05) delivery(t, 0, giftSofa, SOFA);
    else if (t < FRIDGE - 0.05) delivery(t, 1, giftPiano, PIANO);
    else {
      delivery(t, 2, giftFridge, FRIDGE);
      fire.visible = t > FIRE;
      const [fx, fz] = S_GIFT[2].p(-1.3, 0.3);
      fire.position.set(T.x + fx, 7.6, T.z + fz);
      fire.scale.setScalar(Math.max(0.01, popIn(t, FIRE, 0.5)) * 1.4);
      fire.userData.at(t);
    }
  }

  // You can't throw a gift away: pushed to the curb, it pops right back.
  function boomerang(t) {
    const back = t > BOUNCE;
    const su = back ? -1.0 : lerp(-1.0, 3.4, sm(seg(t, DRAG + 0.15, BOUNCE - 0.1)));
    place(giftSofa, T, S_DRAG.p(su, 0.4), 0, S_DRAG.yaw(0));
    giftSofa.scale.setScalar(back ? Math.max(0.01, popIn(t, BOUNCE)) : 1);
    at(T, crowd[3], S_DRAG.p(back ? 0.9 : su - 2.6, 0.4), { yaw: back ? S_DRAG.yaw(-55) : S_DRAG.yaw(60), pose: back ? POSES.shocked(t, 3) : push(t, 3), face: back ? 'angry' : 'sad' });
  }

  function filling(t) {
    porchPiles.forEach((p, i) => p.scale.set(1, lerp(0.85, 1, sm(seg(t, FILLING + i * 0.12, FILLING + 1.6 + i * 0.12))), 1));
    lawnPiles.forEach((p, i) => p.scale.set(1, Math.max(0.01, sm(seg(t, FILLING + 0.4 + i * 0.15, FILLING + 2.0 + i * 0.15))), 1));
    const walk = POSES.walk(t, 1);
    walk.lArm = [-170, 0, 18 + 22 * Math.sin(t * 15)];
    at(T, A.mayor, [-12, lerp(8, -4, seg(t, FILLING, BOAT_GIFT))], { yaw: 180, pose: walk, face: 'grin', hold: ['present'] });
    ['corner', 'pell', 'doris'].forEach((name, k) => at(T, crowd[8 + k], spot(name, 10.6, 1.6), { yaw: facing(name) + 10, pose: shrug(t, k), face: 'sad' }));
  }

  // ---- Grandma's boat ----
  const BOAT_AT = S_BOAT.p(-2.2, 1.0);
  const bowAt = S_BOAT.p(-2.2 - 0.5, 1.0 - 0.85); // bow toward the camera, a little left
  const TRAILER_YAW = bowYaw(bowAt[0] - BOAT_AT[0], bowAt[1] - BOAT_AT[1]);
  const WALL_AT = spot('green', 5.0);
  const WALL_YAW = bowYaw(-Math.sin(rad(facing('green'))), -Math.cos(rad(facing('green'))));

  function boatInWall() {
    place(theBoat, T, WALL_AT, 6.6, WALL_YAW);
    theBoat.rotation.z = 0.1;
    theBoat.userData.bow.visible = false;
    theBoat.scale.setScalar(1);
  }

  function boatGift(t) {
    place(theTrailer, T, BOAT_AT, 0, TRAILER_YAW);
    if (t < LAUNCH) {
      place(theBoat, T, BOAT_AT, 1.1, TRAILER_YAW);
      theBoat.userData.bow.visible = true;
      theBoat.scale.setScalar(Math.max(0.01, popIn(t, BOAT_GIFT + 0.6)));
    } else if (t < CRASH) {
      // Off the trailer, spinning, into the upstairs wall.
      const u = seg(t, LAUNCH, CRASH);
      place(theBoat, T, [lerp(BOAT_AT[0], WALL_AT[0], u), lerp(BOAT_AT[1], WALL_AT[1], u)], lerp(1.1, 6.6, u) + 5 * Math.sin(u * Math.PI), lerp(TRAILER_YAW, WALL_YAW - 360, u));
      theBoat.userData.bow.visible = true;
      theBoat.scale.setScalar(1);
    } else {
      boatInWall();
      const shake = t < CRASH + 0.6 ? 0.08 * Math.sin(t * 60) * (1 - seg(t, CRASH, CRASH + 0.6)) : 0;
      H.green.group.position.z = T.z + HOUSES.green[1] + shake;
      debris.forEach((d, k) => {
        const v = seg(t, CRASH, CRASH + 1.1);
        d.visible = v > 0 && v < 1;
        const [bx, bz] = spot('green', 5.2 + 4 * v, Math.cos(k * 1.7) * 2.0 + Math.sin(k * 2.3) * 2.5 * v);
        d.position.set(T.x + bx, 7.4 + 4 * v - 11 * v * v, T.z + bz);
        d.rotation.set(v * 9 + k, v * 5, 0);
      });
    }
    if (t < UPSTAIRS - 0.05) {
      at(T, A.mayor, S_BOAT.p(-0.4, -0.8), { yaw: S_BOAT.yaw(-60), pose: POSES.cheer(t, 1), face: 'grin' });
      const shocked = t > W(7, 'boat');
      at(T, A.grandma, S_BOAT.p(1.2, 1.4), { yaw: S_BOAT.yaw(-25), pose: shocked ? POSES.shocked(t, 4) : POSES.idle(t, 4), face: shocked ? 'sad' : 'happy' });
    } else if (t < CRASH) {
      // Waving from her upstairs window (her legs are behind the porch roof).
      at(T, A.grandma, spot('green', 5.1), { y: 2.2, yaw: facing('green'), pose: POSES.wave(t, 4), face: t > LAUNCH + 0.15 ? 'sad' : 'happy' });
      for (const l of grandmaLegs) l.visible = false;
      at(T, A.mayor, S_BOAT.p(3.0, -0.6), { yaw: S_BOAT.yaw(-30), pose: POSES.cheer(t, 1), face: 'grin' });
    }
  }

  function grandmaInBoat(t) {
    const p = POSES.idle(t, 4);
    p.pitch = -90;
    p.lift = -2.4;
    p.rArm = [0, 0, 6];
    p.lArm = [0, 0, -6];
    p.neck = [0, 10, 0];
    at(G, A.grandma, [-5.7, -1.8], { y: 2.2, yaw: 90, pose: p, face: 'neutral' });
    gZzz.visible = true;
    const ph = (t * 0.7) % 1;
    gZzz.position.set(G.x - 6.4, 4.6 + ph * 1.0, G.z - 1.2);
    gZzz.scale.set(2.2, 0.55, 1);
    gZzz.material.opacity = Math.sin(ph * Math.PI);
  }

  function mostlyBoat(t) {
    boatInWall();
    if (t < DOCTOR - 0.05) {
      zzz.visible = true;
      const ph = (t * 0.7) % 1;
      const [zx, zz] = spot('green', 7.5);
      zzz.position.set(T.x + zx, 10.2 + ph * 1.2, T.z + zz);
      zzz.scale.set(3.0, 0.75, 1);
      zzz.material.opacity = Math.sin(ph * Math.PI);
      return;
    }
    // The doctor: one more gift and it all comes down.
    const late = t > COLLAPSE - 0.1;
    const talk = POSES.talk(t, 2);
    talk.lArm = [-70, 0, -10];
    at(T, A.doctor, S_DOC.p(1.4, 0), { yaw: S_DOC.yaw(-30), pose: late ? POSES.shocked(t, 2) : talk, face: late ? 'sad' : 'neutral', hold: ['clip'] });
    const wob = late ? 0.03 * Math.sin((t - COLLAPSE) * 9) : 0;
    H.green.group.rotation.z = wob;
    theBoat.rotation.z = 0.1 + wob;
  }

  // ---- the festival ----
  const ME_F = S_FEST.p(-1.1, 0);
  const ME_START = S_FEST.p(-5.5, -2.5);
  const FEST_CROWD = [[-7.0, 1.0], [-6.0, 3.6], [-4.4, 5.0], [0.8, 6.4], [2.6, 7.6], [-3.0, 8.0], [-5.6, 7.2], [7.4, 1.4], [8.6, 2.4], [5.6, -1.0]];
  function townAround(t, cheering) {
    FEST_CROWD.forEach(([u, v], k) => {
      const xz = S_FEST.p(u, v);
      const stunned = k >= 7 && !cheering; // the family getting the statue
      const pose = cheering ? POSES.cheer(t, k) : stunned && t > STATUE - 0.3 ? POSES.shocked(t, k) : k % 3 ? POSES.idle(t, k) : POSES.talk(t, k);
      at(T, crowd[k], xz, { yaw: stunned ? yawToward(xz, STATUE_AT) : yawToward(xz, MAYOR_F), pose, face: cheering ? 'grin' : faceOf(k, ['happy', 'neutral', 'suspicious']) });
    });
    for (const [who, u, v, s] of [[A.grandma, -2.8, 4.0, 4], [A.mom, -4.6, 2.6, 5], [A.sister, -3.8, 2.0, 6]]) {
      const xz = S_FEST.p(u, v);
      at(T, who, xz, { yaw: yawToward(xz, MAYOR_F), size: who === A.sister ? 0.8 : 1, pose: cheering ? POSES.cheer(t, s) : POSES.idle(t, s), face: cheering ? 'grin' : 'neutral' });
    }
  }

  function festivalDay(t) {
    festival.visible = true;
    dolly.visible = true;
    const heroic = POSES.idle(0);
    heroic.rArm = [-165, 0, -10];
    heroic.lArm = [0, 0, 20];
    statue.set({ at: [T.x + STATUE_AT[0], T.z + STATUE_AT[1]], y: 1.1, size: 2.4, yaw: S_FEST.yaw(-15), pose: heroic, face: 'smirk' });
    // Me walking up.
    const u = seg(t, WALK, SMILE - 0.25);
    const walking = u > 0 && u < 1;
    let pose = walking ? POSES.walk(t) : POSES.idle(t);
    let face = 'suspicious';
    let hold = [];
    if (t > SMILE) face = 'smirk';
    if (t > GIFT_YOU) (pose = POSES.talk(t)), (face = 'grin');
    if (t > HOLD_CARD) (pose = POSES.holdOut(t)), (hold = ['card']);
    if (t > CARD + 0.55) (pose = POSES.idle(t)), (hold = []);
    if (t > LAUGH) face = 'smirk';
    if (t > OPEN) (pose = POSES.point(t)), (face = 'grin');
    if (t > OPEN + 0.6) (pose = POSES.crossArms(t)), (face = 'smirk');
    if (t > CHEER) (pose = POSES.cheer(t)), (face = 'grin');
    at(T, A.me, [lerp(ME_START[0], ME_F[0], u), lerp(ME_START[1], ME_F[1], u)], { yaw: walking ? yawToward(ME_START, ME_F) : S_FEST.yaw(50), pose, face, hold });
    // Mayor Crumb, showing off the statue, then the card.
    const show = POSES.point(t, 1);
    show.rArm = [-120, 0, -20];
    let mp = t < SMILE ? show : POSES.idle(t, 1);
    let mf = 'grin';
    const mh = [];
    if (t > GIFT_YOU) mf = 'suspicious';
    if (t > CARD + 0.55) (mp = POSES.holdOut(t, 1)), mh.push('card');
    if (t > LAUGH) (mp = POSES.laugh(t, 1)), (mf = 'grin');
    if (t > OPEN) (mp = POSES.holdOut(t, 1)), (mf = 'suspicious');
    if (t > LIST - 0.05) {
      mp = both(t, 1, -95);
      mf = t > RETURN ? 'sad' : 'suspicious';
      mh.length = 0;
    }
    if (t > SENDER - 0.05) (mp = POSES.shocked(t, 1)), (mf = 'sad');
    if (t > CHEER) mf = 'angry';
    at(T, A.mayor, MAYOR_F, { yaw: t < SMILE ? S_FEST.yaw(40) : MAYOR_F_YAW, pose: mp, face: mf, hold: mh });
    // The list, held up in front of his face.
    if (t > LIST - 0.05 && t < SENDER - 0.05) {
      bigList.visible = true;
      bigList.position.set(T.x + LIST_AT[0], LIST_AT[1], T.z + LIST_AT[2]);
      bigList.rotation.set(-0.15, rad(MAYOR_F_YAW) + Math.PI, 0, 'YXZ');
      const tex = listTex[t > RETURN - 0.1 ? 2 : t > EVERY ? 1 : 0];
      if (bigList.material.map !== tex) (bigList.material.map = tex), (bigList.material.needsUpdate = true);
    }
    townAround(t, t > CHEER - 0.1);
  }

  // ---- everyone hands it all back ----
  function march(t) {
    festival.visible = true;
    const x0 = lead(t);
    place(theBoat, T, [x0 + ITEM_OFF[0], PATH_Z], 5.6, 0);
    theBoat.userData.bow.visible = false;
    theBoat.scale.setScalar(1);
    place(giftPiano, T, [x0 + ITEM_OFF[1], PATH_Z], 0, 90).scale.setScalar(1);
    place(giftFridge, T, [x0 + ITEM_OFF[2], PATH_Z], 0.8, 90).scale.setScalar(1);
    fire.visible = true;
    fire.position.set(T.x + x0 + ITEM_OFF[2], 8.4, T.z + PATH_Z);
    fire.scale.setScalar(1.2);
    fire.userData.at(t);
    place(bananaCase, T, [x0 + ITEM_OFF[3] + 2.6, PATH_Z], 1.4, 90);
    // Carriers: four under the boat, the rest behind what they push or carry (clear of the camera).
    const carriers = [];
    for (let k = 0; k < 4; k++) carriers.push([[x0 - 2.8 + (k >> 1) * 4.4, PATH_Z + (k % 2 ? 1.7 : -1.7)], carryUp]);
    carriers.push([[x0 + ITEM_OFF[1] - 1.6, PATH_Z + 1.0], push], [[x0 + ITEM_OFF[1] - 1.6, PATH_Z - 1.0], push]);
    carriers.push([[x0 + ITEM_OFF[2] - 2.2, PATH_Z + 1.0], carryFront], [[x0 + ITEM_OFF[2] - 2.2, PATH_Z - 1.0], carryFront]);
    carriers.push([[x0 + ITEM_OFF[3], PATH_Z], carryFront]);
    carriers.forEach(([xz, pose], k) => at(T, crowd[k], xz, { yaw: 90, pose: pose(t, k), face: faceOf(k, ['grin', 'happy', 'smirk']) }));
    at(T, A.grandma, [x0 - 7, PATH_Z - 4.2], { yaw: 90, pose: POSES.walk(t, 9, 28, 1.5), face: 'grin' });
    at(T, A.me, [x0 - 5, PATH_Z - 4.0], { yaw: 90, pose: POSES.walk(t, 8, 30, 1.6), face: 'grin' });
    // The mayor runs home ahead of them.
    const m = seg(t, MARCH, MARCH + 2.6);
    at(T, A.mayor, [lerp(MAYOR_F[0], DOOR[0], m), lerp(MAYOR_F[1], DOOR[1], m)], { yaw: m < 1 ? 100 : S_DOOR.yaw(50), pose: m < 1 ? POSES.run(t, 1) : POSES.shocked(t, 1), face: 'sad' });
  }

  // The boat, the piano and the fridge come down on the pile, one per Thunk.
  const DROPS = [[theBoat, [-1.6, 1.4], 3.4, 20, 0.12], [giftPiano, [-3.6, 0.6], 4.4, 110, 0.3], [giftFridge, [1.4, 0.4], 4.6, 70, 1.2]];
  function piled(t) {
    DROPS.forEach(([obj, uv, y, yaw, tilt], k) => {
      const tk = THUNKS[k];
      if (t < tk - 0.45) return;
      place(obj, T, S_DOOR.p(uv[0], uv[1]), lerp(18, y, ease('Quad', 'In', seg(t, tk - 0.45, tk))), yaw);
      obj.rotation.z = tilt;
      obj.scale.setScalar(k === 0 ? 0.75 : 0.85);
    });
    theBoat.userData.bow.visible = false;
    fire.visible = t > THUNKS[2] - 0.45;
    fire.position.set(giftFridge.position.x, giftFridge.position.y + 2.2, giftFridge.position.z);
    fire.scale.setScalar(1.1);
    fire.userData.at(t);
  }

  function thankYou(t) {
    const n = THUNKS.filter((k) => t > k).length;
    const grow = n === 0 ? 0.2 + 0.15 * seg(t, THANK, THUNKS[0]) : lerp([0.35, 0.6, 0.85][n - 1], [0.6, 0.85, 1.0][n - 1], ease('Back', 'Out', seg(t, THUNKS[n - 1], THUNKS[n - 1] + 0.3)));
    mayorPile.visible = true;
    mayorPile.scale.set(1, grow, 1);
    piled(t);
    if (n === 3) buriedMayor(t);
    else at(T, A.mayor, DOOR, { yaw: S_DOOR.yaw(50), pose: POSES.shocked(t, 1), face: 'sad' });
    // The line of thank-yous; the first one hands over a present.
    for (let k = 0; k < 7; k++) {
      const xz = S_DOOR.p(2.6 + k * 1.6, k ? 0.5 * (k % 2) + 0.4 : 0);
      const giving = k === 0 && t > ONE - 0.2 && t < THUNKS[0];
      at(T, crowd[k], xz, { yaw: S_DOOR.yaw(-55), pose: giving ? POSES.holdOut(t, k) : POSES.idle(t, k), face: faceOf(k, ['grin', 'happy', 'smirk']) });
    }
    at(T, A.me, S_DOOR.p(3.2, 2.8), { yaw: S_DOOR.yaw(-30), pose: POSES.crossArms(t), face: 'smirk' });
    at(T, A.grandma, S_DOOR.p(4.8, 3.0), { yaw: S_DOOR.yaw(-35), pose: POSES.cheer(t, 4), face: 'grin' });
  }

  // Under the pile: only his arm pokes out of the top, waving a white flag (his head stays
  // hidden in there).
  function buriedMayor(t) {
    const wave = POSES.idle(t, 1);
    wave.lArm = [-180, 0, 16 * Math.sin(t * 9)];
    at(T, A.mayor, DOOR, { y: 2.2, yaw: S_DOOR.yaw(50), pose: wave, face: 'sad', hold: ['flag'] });
    A.mayor.r6.joints.neck.visible = false;
  }

  function aftermath(t, withCrowd = true) {
    mayorPile.visible = true;
    mayorPile.scale.set(1, 1, 1);
    piled(t);
    buriedMayor(t);
    if (!withCrowd) return;
    for (let k = 0; k < 4; k++) at(T, crowd[k], S_DOOR.p(2.8 + k * 1.6, 0.6 * (k % 2)), { yaw: S_DOOR.yaw(-40), pose: shrug(t, k), face: faceOf(k, ['suspicious', 'neutral', 'sad']) });
    // Someone at the foot of the pile tries to dig him out (clear of the flag).
    if (t > PULL - 0.1) at(T, crowd[9], S_DOOR.p(1.9, -0.8), { yaw: S_DOOR.yaw(-75), pose: POSES.strain(t, 9), face: 'angry' });
  }

  function newMayor(t) {
    mySash.visible = true;
    if (t < KEEP - 0.05) {
      festival.visible = true;
      at(T, A.me, [0, 0], { y: 1.6, yaw: 0, pose: POSES.cheer(t), face: 'grin' });
      for (let k = 0; k < 10; k++) {
        const an = Math.PI * 0.15 + (k / 9) * Math.PI * 0.7;
        const xz = [Math.cos(an) * 9.2, -2 + Math.sin(an) * 7.6];
        at(T, crowd[k], xz, { yaw: yawToward(xz, [0, 0]), pose: POSES.cheer(t, k), face: 'grin' });
      }
      return;
    }
    aftermath(t, false);
    const look = t > INCLUDING;
    at(T, A.me, S_DOOR.p(2.4, -1.0), { yaw: look ? S_DOOR.yaw(-75) : S_DOOR.yaw(-20), pose: look ? POSES.idle(t) : POSES.holdOut(t), face: look ? 'sad' : 'neutral', hold: look ? [] : ['clip'] });
  }

  // ---- my guest room ----
  function guestRoom(t) {
    const p = POSES.sit();
    p.rArm = [-80 + 14 * Math.max(0, Math.sin(t * 5)), 0, 12];
    p.lArm = [-60, 0, -10];
    at(B, A.mayor, [0.4, -5.6], { y: 0.1, yaw: 25, pose: p, face: 'grin', hold: ['bowl'] });
    mayorSash.visible = false;
    at(B, A.me, [3.6, -2.8], { yaw: -40, pose: POSES.crossArms(t), face: t > W(19, 'I') ? 'angry' : 'suspicious' });
    mySash.visible = true;
  }

  const DAY = [30, 60, 40];
  const EAST = [-35, 60, 25];
  const DOORSIDE = [-30, 60, -35];
  return function update(t) {
    for (const a of everyone) a.hide();
    for (const l of grandmaLegs) l.visible = true;
    A.mayor.r6.joints.neck.visible = true;
    for (const o of [bag, peel, giftSofa, giftPiano, giftFridge, fire, theBoat, theTrailer, mayorPile, festival, dolly, bigList, zzz, gZzz, bananaCase, ...stink, ...steam, ...debris]) o.visible = false;
    mayorSash.visible = true;
    mySash.visible = false;
    porchPiles.forEach((p) => p.scale.set(1, t < FILLING ? 0.85 : 1, 1));
    lawnPiles.forEach((p) => p.scale.set(1, t < FILLING ? 0.01 : 1, 1));
    H.green.group.rotation.z = 0;
    H.green.group.position.z = T.z + HOUSES.green[1];
    dentCab.userData.drawer.position.z = 0;
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    const sepia = t >= UNCLE - 0.05 && t < MUSEUM - 0.05;
    renderer.domElement.style.filter = sepia ? 'sepia(0.85) contrast(1.05) brightness(0.95)' : '';
    stamp.style.display = sepia ? 'block' : 'none';
    cameraAt(t);
    if (t < T_HOME) {
      light('day', T, DAY);
      if (t < NOBODY - 0.05) opening(t);
      else if (t < UNCLE - 0.05) hoarders(t);
      else if (t < MUSEUM - 0.05) flashback(t);
      else museumShot(t);
    } else if (t < T_MAYOR) {
      light('interior', K, [12, 40, -70]);
      familyTub(t);
    } else if (t < T_GLIVING) {
      light('day', T, t < SOFA - 0.05 || t >= BOAT_GIFT - 0.05 ? EAST : DAY);
      if (t < SOFA - 0.05) mayorIntro(t);
      else if (t < DRAG - 0.05) gifts(t);
      else if (t < FILLING - 0.05) boomerang(t);
      else if (t < BOAT_GIFT - 0.05) filling(t);
      else boatGift(t);
    } else if (t < T_MOSTLY) {
      light('interior', G, [12, 40, -70]);
      grandmaInBoat(t);
    } else if (t < T_GUEST) {
      const door = (t >= THANK - 0.05 && t < NEW_MAYOR - 0.05) || t >= KEEP - 0.05;
      light('day', T, t < FESTIVAL - 0.05 ? EAST : door ? DOORSIDE : DAY);
      if (t >= FESTIVAL - 0.05 && t < MARCH - 0.05) boatInWall();
      if (t < FESTIVAL - 0.05) mostlyBoat(t);
      else if (t < MARCH - 0.05) festivalDay(t);
      else if (t < THANK - 0.05) march(t);
      else if (t < STILL - 0.05) thankYou(t);
      else if (t < NEW_MAYOR - 0.05) aftermath(t);
      else newMayor(t);
    } else {
      light('interior', B, DAY);
      guestRoom(t);
    }
    captions(t);
  };
}
