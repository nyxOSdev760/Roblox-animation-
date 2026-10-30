// "Matchmaker" — a Roblox story Short. Narration and word timings: assets/voice/matchmaker
// (tools/narrate.py, tools/align.py); script: scripts/matchmaker.md.
//
// In this town, if you're single at midnight, the Matchmaker 3000 picks your date and nobody can
// say no. Mayor Winters is exempt (engaged to a cardboard cutout of himself) and sends everyone
// who complains on a date with Gary and his forty pigeons, until I find the engagement expired.
// One place: the town square at night (buildFogTown), with a stage for the machine. R6, 2D faces.
import * as THREE from 'three';
import words from '../../assets/voice/matchmaker/words.json' with { type: 'json' };
import { SKIN, part, cylinder, ball } from '../src/roblox.js';
import { buildFogTown } from '../src/rooms.js';
import { Actor, POSES } from '../src/actors.js';
import { MAIN } from '../src/cast.js';
import { createCaptions } from '../src/captions.js';
import { lightingMood, fixture } from '../src/lighting.js';
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
const rad = (deg) => (deg * Math.PI) / 180;

const T = new THREE.Vector3(7000, 0, 0); // the town

// Beats.
const MACHINE = W(0, 'machine');
const NOSAY = W(0, 'And');
const BAKER = W(1, 'The');
const MARRIED = W(1, "They're");
const BREAD = W(1, 'The', 2);
const MAYOR = W(2, 'Then');
const BECAUSE = W(2, 'Because');
const CUTOUT = W(2, 'cardboard');
const ABUSE = W(3, 'And');
const COMPLAIN = W(3, 'Anyone');
const WAKES = W(3, 'wakes');
const GARY = W(3, 'Gary', 1);
const MOMQ = W(4, 'Then');
const MIDNIGHT = W(5, 'So');
const PRESS = W(5, 'The', 2);
const PRESSED = W(5, 'pressed');
const MATCH1 = W(5, 'Match');
const LINDA = W(5, 'Linda');
const PALE = W(6, 'My');
const PIGEONS = W(6, 'Forty');
const STEP = W(7, 'So');
const SPEAK = W(7, 'Mayor');
const CHARTER = W(7, 'An');
const TUESDAY = W(7, 'Yours');
const FELL = W(8, 'His');
const CLOCK = W(8, 'The');
const BEEPED = W(8, 'The', 1);
const SINGLE = W(8, 'Mayor');
const SEARCH = W(8, 'Searching');
const SILENT = W(9, 'The');
const DING = W(9, 'Ding');
const GABLE_FOUND = W(9, 'Mrs');
const GABLE = W(10, 'Mrs');
const GNOMES = W(10, 'He');
const WALKOUT = W(10, 'She');
const WAITING = W(10, "I've");
const CANT = W(11, 'The');
const CANCEL = W(12, 'My');
const CUT_SINGLE = W(12, 'But');
const LAST = W(12, 'And');
const DATE = W(13, 'So');
const FLAT = W(13, "It's");
const TALKS = W(13, 'It');
const HONEST = W(13, 'Honestly');
const CUTS = [DATE - 0.08];

// ---- stages ------------------------------------------------------------------------------
/**
 * A stage: a ground spot `c` seen by a camera looking along yaw `a` (degrees, 0 = +z).
 * p(u, v): u studs to screen-right, v studs away from the camera; yaw(cheat) faces the camera
 * turned `cheat` degrees toward screen-right; cam() is a [position, look, fov] key.
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

// The square: a stage at its north side (top 1.6, front edge z -0.5) with the Matchmaker 3000;
// the town stands in front of it. The clock tower is behind (its face at y 14.5, z -11.5).
const TOP = 1.6;
const MACHINE_AT = [0, -5.2];
const BUTTON_AT = [2.6, -3.0];
const MAYOR_AT = [3.8, -2.5];
const PODIUM_AT = [-3.6, -2.2];
const CUTOUT_AT = [6.2, -3.4];
const MIC_AT = [-2.2, 4.5]; // the town-hall microphone, out in the square
const MOM_AT = [-3.4, 6.2];
const GARY_AT = [-6.0, 8.6];
const ME_AT = [0.8, 5.4];
const ME_FRONT = [0.3, 4.0];
const GABLE_STAGE = [1.3, -2.0];
const GABLE_START = [9.5, 7.5]; // at the east edge of the crowd
const GABLE_END = [2.6, 5.2];
const BAKERY_SPOT = [25.2, -12];
const TABLE_AT = [-9, 10.5];

const S_SQ = stage([0, -3], 180); // from the crowd, looking at the stage (u = +x)
const S_CR = stage([0, 5], 0); // from the stage, looking at the crowd (u = -x)
const S_BK = stage(BAKERY_SPOT, 90); // looking at the bakery front (u = +z)
const S_GN = stage([-22.5, -13], 270); // looking at Mrs. Gable's porch (u = -z)
const S_DT = stage(TABLE_AT, 180); // the date

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  mayor: { shirt: 'shirt-grey-suit-black-vest', pants: 'pants-grey-suit-black-vest', hair: 'hair-side-parted-slicked-back', skin: SKIN.pastelBrown },
  mom: { shirt: 'shirt-vintage-flannel-button-up-2', pants: 'pants-dark-pants', hair: 'hair-elegant-braided-bun', skin: MAIN.skin },
  gary: { shirt: 'shirt-mossy-oak-oversized-forest', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-black-grandpa-balding-old', skin: SKIN.nougat },
  gable: { shirt: 'shirt-wedding-dress', pants: 'pants-wedding-skirt', hair: 'hair-wavy-white-voluminous', skin: SKIN.porcelain },
  baker: { shirt: 'shirt-white-chef-jacket', pants: 'pants-dark-pants', hair: 'hair-brown-messy', skin: SKIN.tan },
  inspector: { shirt: 'shirt-blue-stripe-shirt-neck', pants: 'pants-kestrel-khaki-textured-pants', hair: 'hair-black-short-parted', skin: SKIN.brown },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-sweter-galaxy-blue-100', 'shirt-grey-knitted-sweater-chain', 'shirt-thrifted-striped-polo',
  'shirt-mu-red-flannel-black', 'shirt-black-flannel-soft-trendy-2', 'shirt-cottage-core-fairy-vintage', 'shirt-cutesy-pink-striped-sweater', 'shirt-tech-fleece-red-hoodie'];
const PANTS_LIST = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-gray-sweatpants', 'pants-jeans-stars', 'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-brown-side-sweep', 'hair-dejah-loc', 'hair-afro-puff', 'hair-lazy-bun',
  'hair-long-black', 'hair-black-middle-part', 'hair-short-wavy-black', 'hair-360-waves-fade', 'hair-brown-wavy-ponytail', 'hair-grandpa-white', 'hair-black-short-layered-bob'];
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
sfx('../voice/matchmaker/narration.flac', 0, 1.0);
sfx('temporex-numbers-loop.mp3', 0, 0.22, { dur: END, fade: 1.0 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
sfx('synth/ambience.wav', 0, 0.18, { loop: true, dur: END, fade: 1.0 });
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.3);
sfx('synth/beep.wav', MACHINE - 0.1, 0.4);
sfx('synth/ding.wav', NOSAY - 0.2, 0.45);
sfx('huh-rblx-se.mp3', NOSAY + 0.5, 0.4);
sfx('sadd-rblx-se.mp3', BREAD + 0.6, 0.35);
FAH(W(1, 'worse') + 0.45);
sfx('mwahahaha.mp3', ABUSE + 0.15, 0.3);
sfx('synth/coo.wav', GARY + 0.2, 0.6);
sfx('synth/coo.wav', GARY + 0.9, 0.5, { pitch: 3 });
sfx('synth/punch.wav', PRESSED + 0.05, 0.4);
sfx('synth/beep.wav', MATCH1 - 0.15, 0.45);
sfx('synth/ding.wav', LINDA + 0.4, 0.5);
sfx('gaspp.mp3', PALE + 0.25, 0.4);
sfx('synth/coo.wav', PIGEONS + 0.1, 0.7);
sfx('synth/coo.wav', PIGEONS + 0.5, 0.6, { pitch: -3 });
sfx('synth/coo.wav', PIGEONS + 0.9, 0.55, { pitch: 4 });
sfx('roblox/action_footsteps_plastic.wav', STEP + 0.1, 0.4, { dur: 1.0, fade: 0.2 });
sfx('synth/slide_up.wav', CHARTER - 0.1, 0.4);
sfx('synth/bell.wav', CLOCK + 0.2, 0.8);
sfx('synth/bell.wav', CLOCK + 1.0, 0.55);
sfx('synth/beep.wav', BEEPED + 0.25, 0.5);
sfx('synth/beep.wav', SEARCH + 0.2, 0.35, { loop: true, dur: 1.6, fade: 0.2 });
sfx('synth/ding.wav', DING - 0.02, 0.8);
sfx('gaspp.mp3', GABLE_FOUND + 0.4, 0.4);
sfx('roblox/action_footsteps_plastic.wav', WALKOUT, 0.35, { dur: 1.2, fade: 0.2 });
FAH(W(10, '1962') + 0.85);
sfx('synth/pop.wav', CANCEL + 0.3, 0.5);
sfx('synth/ding.wav', LAST + 0.6, 0.5);
FAH(W(13, 'had') + 0.25);

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, [position, look-at, fov], move seconds]; move 0 is a cut.
const K = (t, shot, move = 0) => ({ t, pos: shot[0], look: shot[1], fov: shot[2], move });
const SCREEN_SHOT = S_SQ.cam(6.4, 5.4, 4.9, 40, { lookV: 2.2 });
const KEYS = [
  K(0, [[0, 10, 21], [0, 5, -6], 56]),
  K(MACHINE - 0.1, SCREEN_SHOT),
  K(NOSAY - 0.05, S_SQ.cam(9.0, 4.8, 3.4, 50, { lookV: -5.4 })),
  // The baker and the health inspector.
  K(BAKER - 0.05, S_BK.cam(9.0, 5.0, 3.8, 52)),
  K(BREAD - 0.1, S_BK.cam(5.0, 4.2, 3.3, 40, { u: -1.0, lookU: -1.1 })),
  // Mayor Winters and his cutout.
  K(MAYOR - 0.05, S_SQ.cam(7.0, 6.2, 5.4, 42, { u: 3.8, lookV: 0.5 })),
  K(CUTOUT - 0.15, S_SQ.cam(9.4, 6.3, 5.0, 50, { u: 5.0, lookV: 0.3 })),
  // Town hall: a complaint, then Gary.
  K(ABUSE - 0.05, S_SQ.cam(7.2, 6.4, 5.3, 44, { u: -3.6, lookV: 0.6 })),
  K(COMPLAIN - 0.05, S_CR.cam(6.0, 5.4, 4.0, 44, { u: 1.4, lookU: 2.2, lookV: -0.5 })),
  K(WAKES - 0.05, S_CR.cam(8.8, 5.2, 3.6, 52, { u: 7.1, lookV: 3.6 })),
  K(GARY - 0.05, S_CR.cam(6.0, 5.0, 3.9, 44, { u: 6.0, lookV: 3.6 })),
  K(MOMQ - 0.05, S_CR.cam(6.0, 5.4, 4.0, 44, { u: 1.4, lookU: 2.2, lookV: -0.5 })),
  // Midnight: the button, the screen, my mom and the pigeons.
  K(MIDNIGHT - 0.05, [[0, 11, 24], [0, 4.5, -4], 56]),
  K(PRESS - 0.05, S_SQ.cam(7.0, 6.0, 4.6, 44, { u: 3.2, lookV: 0.4 })),
  K(MATCH1 - 0.1, SCREEN_SHOT),
  K(PALE - 0.05, S_CR.cam(6.0, 5.4, 4.0, 42, { u: 3.4, lookV: 1.2 })),
  K(PIGEONS - 0.05, S_CR.cam(6.0, 5.0, 3.9, 44, { u: 6.0, lookV: 3.6 })),
  // I step forward with the charter.
  K(STEP - 0.05, S_CR.cam(6.8, 5.6, 3.8, 54, { u: -0.4, lookV: 0.4 })),
  K(SPEAK - 0.05, S_CR.cam(5.6, 4.8, 4.3, 42, { u: -0.3, lookV: -1.0 })),
  K(CHARTER - 0.05, S_CR.cam(4.4, 5.2, 4.4, 40, { u: -0.3, lookV: -1.0 })),
  K(TUESDAY - 0.05, S_CR.cam(5.6, 4.8, 4.3, 42, { u: -0.3, lookV: -1.0 })),
  // The clock strikes twelve; the machine looks for the mayor's match.
  K(FELL - 0.05, S_SQ.cam(6.6, 6.2, 5.6, 40, { u: 3.8, lookV: 0.5 })),
  K(CLOCK - 0.05, [[0, 13.4, -3.5], [0, 14.6, -11.5], 40]),
  K(BEEPED - 0.05, SCREEN_SHOT),
  K(SILENT - 0.05, [[0, 9, 19], [0, 4.4, 2], 56]),
  K(DING - 0.1, SCREEN_SHOT),
  // Mrs. Gable.
  K(GABLE - 0.05, [[6.5, 5.6, -0.6], [9.5, 4.3, 7.5], 30]),
  K(GNOMES - 0.05, S_GN.cam(8.0, 4.4, 2.2, 52)),
  K(WALKOUT - 0.05, [[6.8, 5.0, 0.4], [7.6, 4.2, 6.6], 46]),
  K(WAITING - 0.1, S_CR.cam(5.6, 5.4, 4.1, 40, { u: -2.6, lookV: 0.2 })),
  K(CANT - 0.05, S_SQ.cam(8.6, 6.4, 5.4, 50, { u: 2.6, lookV: 0.6 })),
  // The aftermath: my mom's match is off, and mine is on.
  K(CANCEL - 0.05, SCREEN_SHOT),
  K(CUT_SINGLE - 0.05, S_SQ.cam(6.4, 6.2, 5.2, 40, { u: 6.2, lookV: -0.4 })),
  K(LAST - 0.05, S_CR.cam(5.6, 4.8, 4.3, 40, { u: -0.3, lookV: -1.0 })),
  K(LAST + 0.85, SCREEN_SHOT),
  // The date.
  K(DATE - 0.08, S_DT.cam(11, 4.4, 3.4, 56)),
  K(HONEST - 0.1, S_DT.cam(8.0, 4.2, 3.6, 50, { u: -0.8, lookU: -1.2 }), 0.9),
];
KEYS.forEach((k, i) => {
  if (i && k.t < KEYS[i - 1].t) throw new Error(`camera key ${i} (${k.t}) is out of order`);
});

// ---- props -------------------------------------------------------------------------------
const box = (g, a, size, pos, color, mat = 'Plastic', shadows = true) => {
  const m = part(a, size, pos, color, mat, { shadows });
  g.add(m);
  return m;
};

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.55, y - s * 0.05, x - s * 0.3, y - s * 0.5, x, y - s * 0.2);
  ctx.bezierCurveTo(x + s * 0.3, y - s * 0.5, x + s * 0.55, y - s * 0.05, x, y + s * 0.35);
}

/** The Matchmaker 3000: a magenta cabinet with a screen (redrawn per beat) and a neon heart. */
function matchmaker(a) {
  const g = new THREE.Group();
  box(g, a, [4.4, 6.0, 2.6], [0, 3.0, 0], 0xb0175a, 'SmoothPlastic');
  box(g, a, [4.7, 0.4, 2.9], [0, 6.2, 0], 0x7a0f3e, 'SmoothPlastic');
  box(g, a, [4.7, 0.5, 2.9], [0, 0.25, 0], 0x7a0f3e, 'SmoothPlastic');
  box(g, a, [3.7, 2.7, 0.2], [0, 4.2, 1.3], 0x111111, 'SmoothPlastic');
  for (const s of [-1, 1]) {
    g.add(cylinder(a, 0.35, 6.4, [s * 2.55, 3.2, 0.8], 0xd8d8e0, 'Metal'));
    for (let k = 0; k < 6; k++) g.add(ball(a, 0.16, [s * 2.55, 0.9 + k * 1.05, 1.17], [0xffd21f, 0xff4fa3, 0x7fe0ff][k % 3], 'Neon'));
  }
  const heart = new THREE.Shape();
  heart.moveTo(0, -0.9);
  heart.bezierCurveTo(-1.6, 0.2, -0.9, 1.4, 0, 0.6);
  heart.bezierCurveTo(0.9, 1.4, 1.6, 0.2, 0, -0.9);
  const hm = new THREE.Mesh(new THREE.ExtrudeGeometry(heart, { depth: 0.4, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xff2d6f, emissive: 0xff2d6f, emissiveIntensity: 2.6 }));
  hm.position.set(0, 7.4, -0.2);
  g.add(hm);
  const sign = P.sign(a, 3.9, 0.75, 'MATCHMAKER 3000', { bg: '#ffd21f', fg: '#b0175a', size: 120 });
  sign.position.set(0, 5.95, 1.32);
  sign.scale.z = 0.2;
  g.add(sign);
  box(g, a, [1.6, 0.3, 0.3], [0, 2.0, 1.35], 0x111111, 'SmoothPlastic', false); // card slot
  const tex = P.canvasTexture(512, 360, () => {});
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 4.2, 1.42);
  g.add(screen);
  return { group: g, tex };
}

/** Draw the machine's screen for a state: 'idle', 'search', or a match [left, right, status]. */
function drawScreen(tex, state, t) {
  tex.redraw((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2a0b3a');
    bg.addColorStop(1, '#5a0f4a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff4fa3';
    for (let k = 0; k < 7; k++) {
      heartPath(ctx, 40 + k * 72, 26 + (k % 2) * 8, 34);
      ctx.fill();
    }
    if (state.kind === 'idle') {
      P.drawText(ctx, 'PICKING', w / 2, h * 0.45, w * 0.9, 74, { color: '#ffd21f' });
      P.drawText(ctx, 'DATES' + '.'.repeat(1 + (Math.floor(t * 3) % 3)), w / 2, h * 0.7, w * 0.9, 74, { color: '#ffd21f' });
    } else if (state.kind === 'search') {
      P.drawText(ctx, state.top, w / 2, h * 0.38, w * 0.9, 58, { color: '#7fe0ff' });
      P.drawText(ctx, 'SEARCHING' + '.'.repeat(1 + (Math.floor(t * 4) % 3)), w / 2, h * 0.66, w * 0.9, 62, { color: '#ffd21f' });
    } else {
      P.drawText(ctx, state.status ?? 'MATCH FOUND!', w / 2, h * 0.3, w * 0.9, 56, { color: state.bad ? '#ff5a5a' : '#7fe0ff' });
      P.drawText(ctx, state.left, w / 2, h * 0.52, w * 0.9, 58, { color: '#ffffff' });
      ctx.fillStyle = '#ff2d6f';
      heartPath(ctx, w / 2, h * 0.66, 50);
      ctx.fill();
      P.drawText(ctx, state.right, w / 2, h * 0.84, w * 0.9, 58, { color: '#ffffff' });
    }
  });
}

function pigeon(a) {
  const g = new THREE.Group();
  const body = ball(a, 0.32, [0, 0.36, 0], 0x8d8f94, 'Plastic');
  body.scale.set(0.95, 0.85, 1.35);
  g.add(body);
  g.add(ball(a, 0.21, [0, 0.62, 0.3], 0x5f7a78, 'Plastic'));
  g.add(ball(a, 0.17, [0, 0.82, 0.38], 0x9a9ca2, 'Plastic'));
  g.add(part(a, [0.08, 0.06, 0.16], [0, 0.8, 0.56], 0xe0a030, 'Plastic', { shadows: false }));
  for (const s of [-1, 1]) g.add(part(a, [0.04, 0.05, 0.04], [s * 0.09, 0.86, 0.5], 0x111111, 'Plastic', { shadows: false }));
  const tail = part(a, [0.3, 0.06, 0.4], [0, 0.4, -0.5], 0x6d6f74, 'Plastic', { shadows: false });
  tail.rotation.x = -0.3;
  g.add(tail);
  return g;
}

function gnome(a, ticket) {
  const g = new THREE.Group();
  g.add(cylinder(a, 0.32, 0.6, [0, 0.3, 0], 0x1f5fa8, 'Plastic'));
  g.add(ball(a, 0.24, [0, 0.78, 0], 0xf2c9a0, 'Plastic'));
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.9 }));
  beard.rotation.x = Math.PI;
  beard.position.set(0, 0.55, 0.17);
  g.add(beard);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 14), new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.7 }));
  hat.position.set(0, 1.25, 0);
  hat.castShadow = true;
  g.add(hat);
  if (ticket) {
    const tk = P.sign(a, 0.55, 0.36, 'FINE', { bg: '#ffd21f', fg: '#b71c1c', size: 120 });
    tk.position.set(0.12, 0.35, 0.34);
    tk.rotation.z = -0.2;
    tk.scale.z = 0.2;
    g.add(tk);
  }
  return g;
}

function charterPaper(a) {
  const tex = P.canvasTexture(360, 470, (ctx, w, h) => {
    ctx.fillStyle = '#f6efd8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    P.drawText(ctx, 'TOWN CHARTER', w / 2, 62, w * 0.86, 44, { color: '#5a3b22' });
    P.drawText(ctx, '§12', w / 2, 128, w * 0.5, 48, { color: '#b71c1c' });
    ['ENGAGEMENTS', 'EXPIRE AFTER', '15 YEARS'].forEach((l, i) => P.drawText(ctx, l, w / 2, 210 + i * 66, w * 0.86, 46, { color: '#1b2a35' }));
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(w * 0.75, h - 70, 34, 0, Math.PI * 2);
    ctx.fill();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.95), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
  return m;
}

function sash(a, text) {
  const g = new THREE.Group();
  for (const z of [0.52, -0.52]) {
    const m = part(a, [0.4, 2.7, 0.05], [0, 0, z], 0xc4281c, 'Fabric', { shadows: false });
    m.rotation.z = -0.78;
    g.add(m);
  }
  const s = P.sign(a, 1.0, 0.3, text, { bg: '#c4281c', fg: '#f2b632', size: 130 });
  s.position.set(-0.05, 0.05, 0.56);
  s.rotation.z = -0.78;
  s.scale.z = 0.2;
  g.add(s);
  return g;
}

function loaf(a) {
  const g = new THREE.Group();
  const l = ball(a, 0.5, [0, 0, 0], 0x3a2416, 'Plastic');
  l.scale.set(1.6, 0.35, 0.8);
  g.add(l);
  return g;
}

function textSprite(text, color, w = 512) {
  const tex = P.canvasTexture(w, 160, (ctx, cw, ch) => P.drawText(ctx, text, cw / 2, ch * 0.55, cw - 12, ch * 0.7, { color, stroke: '#1b2a35', strokeW: 12 }));
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  const town = buildFogTown(scene, assets, T, { plaques: false });
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45;
  sc.right = sc.top = 45;
  sc.updateProjectionMatrix();
  lightingMood(scene, sun, 'night');
  sun.target.position.set(T.x, 0, T.z);
  sun.position.set(T.x - 30, 60, T.z + 30);

  const put = (obj, xz, y = 0, yawDeg = 0) => {
    obj.position.set(T.x + xz[0], y, T.z + xz[1]);
    obj.rotation.set(0, rad(yawDeg), 0);
    scene.add(obj);
    return obj;
  };

  // The stage, the machine, the button, the podium and the mic.
  put(P.stage(assets, 14, 7, TOP, 0x6b4a33), [0, -4]);
  const machine = matchmaker(assets);
  put(machine.group, MACHINE_AT, TOP);
  const pedestal = new THREE.Group();
  pedestal.add(cylinder(assets, 0.45, 2.6, [0, 1.3, 0], 0xd8d8e0, 'Metal'));
  pedestal.add(cylinder(assets, 0.7, 0.3, [0, 2.75, 0], 0x333333, 'Metal'));
  const dome = ball(assets, 0.55, [0, 2.9, 0], 0xff1f3d, 'Neon');
  dome.scale.y = 0.55;
  pedestal.add(dome);
  put(pedestal, BUTTON_AT, TOP);
  put(P.podium(assets, 'TOWN HALL'), PODIUM_AT, TOP).scale.setScalar(0.72);
  const mic = P.micStand(assets);
  put(mic, MIC_AT, 0, 180);
  for (const x of [-6.6, 6.6]) put(P.stageLight(assets), [x, -7.0], TOP, x < 0 ? 150 : -150);
  const bunting = new THREE.Group();
  for (let k = 0; k < 18; k++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 3), new THREE.MeshStandardMaterial({ color: [0xff4fa3, 0xffd21f, 0xffffff][k % 3], roughness: 0.8 }));
    f.rotation.x = Math.PI;
    f.position.set(-6.8 + k * 0.8, 9.2 - Math.sin((k / 17) * Math.PI) * 0.8, -0.8);
    bunting.add(f);
  }
  put(bunting, [0, 0]);
  const banner = P.sign(assets, 9, 1.4, 'MIDNIGHT MATCHING', { bg: '#2a0b3a', fg: '#ff4fa3', size: 120, border: '#ffd21f' });
  put(banner, [0, -7.4], 10.4);
  // Pigeons around Gary, on his shoulders and his head.
  const r = rng(12);
  const flock = Array.from({ length: 16 }, (_, k) => {
    const pg = pigeon(assets);
    const an = (k / 16) * Math.PI * 2 + r() * 0.4;
    const rr = 1.4 + r() * 1.4;
    pg.userData.home = [GARY_AT[0] + Math.cos(an) * rr, GARY_AT[1] + Math.sin(an) * rr * 0.8];
    pg.userData.yaw = r() * 360;
    pg.userData.ph = r() * 6;
    scene.add(pg);
    return pg;
  });
  // Mrs. Gable's porch full of fined gnomes.
  const gnomes = [];
  for (let k = 0; k < 7; k++) gnomes.push(put(gnome(assets, k % 2 === 0), [-24.9 + (k % 2) * 0.9, -15.6 + k * 0.85], 0.6 + (k % 2 ? 0 : 0), 90 + (r() - 0.5) * 40));
  // The bakery's sad bread.
  const bread = loaf(assets);
  scene.add(bread);
  // The date: a table for two with a candle, a rose and a "RESERVED" card.
  const date = new THREE.Group();
  date.add(P.table(assets, 3.2, 2.4, 3, 0xf4f4f0, 'Fabric'));
  date.add(cylinder(assets, 0.12, 0.6, [0, 3.48, 0], 0xfff4dc, 'SmoothPlastic'));
  date.add(ball(assets, 0.11, [0, 3.86, 0], 0xffb44a, 'Neon'));
  date.add(cylinder(assets, 0.14, 0.7, [0.7, 3.52, -0.4], 0x9fd0ef, 'Glass'));
  date.add(ball(assets, 0.15, [0.7, 4.0, -0.4], 0xd81b60, 'Fabric'));
  for (const s of [-1, 1]) date.add(cylinder(assets, 0.14, 0.5, [s * 0.9, 3.43, 0.5], 0xd8eef8, 'Glass'));
  const reserved = P.sign(assets, 1.0, 0.45, 'RESERVED', { bg: '#ffffff', fg: '#b0175a', size: 110 });
  reserved.position.set(-0.6, 3.45, 0.6);
  reserved.scale.z = 0.2;
  date.add(reserved);
  for (const s of [-1, 1]) {
    const c = P.chair(assets, 0x6b4a33, 'Wood');
    c.position.set(s * 2.2, 0, 0);
    c.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    date.add(c);
  }
  put(date, TABLE_AT);
  const candle = fixture([T.x + TABLE_AT[0], 4.4, T.z + TABLE_AT[1]], { color: 0xffb070, intensity: 16, distance: 10 });
  void candle;
  // Night lights for the stage, the machine, the crowd and the bakery.
  fixture([T.x, 9.5, T.z + 3.5], { color: 0xfff0dc, intensity: 70, distance: 28 });
  fixture([T.x, 5.5, T.z - 3.0], { color: 0xff6fb0, intensity: 26, distance: 12 });
  fixture([T.x - 2, 8, T.z + 9], { color: 0xffe6c8, intensity: 45, distance: 22 });
  fixture([T.x + 23.5, 7, T.z - 12], { color: 0xffe0b0, intensity: 35, distance: 16 });
  fixture([T.x - 21, 7, T.z - 13], { color: 0xffe0b0, intensity: 30, distance: 16 });

  // ---- cast ----
  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const cutout = mk(CAST.mayor); // the cardboard mayor: the same look, squashed flat
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), cutout, ...crowd];
  for (const a of everyone) scene.add(a.root);
  A.mayor.root.add(sash(assets, 'MAYOR'));
  cutout.root.add(sash(assets, 'MAYOR'));
  const stand = new THREE.Group();
  box(stand, assets, [1.4, 0.2, 1.4], [0, 0.1, -0.4], 0x8a6a3a, 'Wood');
  const brace = box(stand, assets, [0.3, 3.4, 0.12], [0, 1.6, -0.6], 0xb5835a, 'Wood');
  brace.rotation.x = -0.25;
  scene.add(stand);
  A.inspector.attach('clip', (() => {
    const g = new THREE.Group();
    g.add(part(assets, [0.8, 1.0, 0.06], [0, 0, 0], 0x8a5a3a, 'Wood', { shadows: false }));
    g.add(part(assets, [0.7, 0.85, 0.07], [0, -0.04, 0], 0xffffff, 'SmoothPlastic', { shadows: false }));
    return g;
  })(), 'l', [0, 0.1, 0.3], [-Math.PI / 2 + 0.3, 0, 0]);
  A.gable.attach('gnome', gnome(assets, false), 'r', [0, -0.3, 0.3], [Math.PI, 0, 0]);
  const paper = charterPaper(assets);
  paper.position.set(0, 0.9, 1.35);
  A.me.root.add(paper);
  const garyBirds = [pigeon(assets), pigeon(assets), pigeon(assets)];
  garyBirds[0].position.set(-0.75, 1.0, 0);
  garyBirds[1].position.set(0.75, 1.0, 0);
  garyBirds.forEach((b, k) => k < 2 && A.gary.root.add(b));
  garyBirds[2].position.set(0, 1.1, 0);
  A.gary.r6.joints.neck.add(garyBirds[2]);
  const zzz = textSprite('♥', '#ff4fa3', 256);
  void zzz;

  const captions = createCaptions(words, { y: 0.67 });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  const at = (who, xz, opts = {}) => {
    const { hold = [], ...rest } = opts;
    who.set({ at: [T.x + xz[0], T.z + xz[1]], ...rest });
    for (const h of hold) who.hold(h);
  };
  const faceOf = (i, opts) => opts[i % opts.length];
  const lookDir = (p, pitch, yaw) => ((p.neck = [pitch, yaw, 0]), p);
  const toward = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;

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
    camera.position.set(T.x + pos[0] + Math.sin(held * 0.5) * 0.06, pos[1] + 0.008 * held, T.z + pos[2]);
    camera.lookAt(T.x + look[0], look[1], T.z + look[2]);
    camera.fov = fov - Math.min(3, held * 0.18);
    camera.updateProjectionMatrix();
  }

  // ---- the machine's screen ----
  let lastKey = '';
  function screenAt(t) {
    let state = { kind: 'idle' };
    if (t >= NOSAY - 0.2 && t < BAKER) state = { kind: 'match', left: 'DAVE', right: 'KAREN', status: 'NO REFUNDS!' };
    if (t >= MATCH1 - 0.15 && t < SINGLE - 0.3) state = { kind: 'match', left: 'LINDA', right: 'GARY' };
    if (t >= SINGLE - 0.3) state = { kind: 'search', top: 'MAYOR WINTERS: SINGLE' };
    if (t >= DING - 0.05) state = { kind: 'match', left: 'MAYOR WINTERS', right: 'MRS. GABLE' };
    if (t >= CANCEL - 0.05) state = { kind: 'match', left: 'LINDA + GARY', right: 'CANCELLED', status: 'UPDATE:', bad: true };
    if (t >= LAST + 0.8) state = { kind: 'match', left: 'YOU', right: 'CARDBOARD MAYOR' };
    const key = JSON.stringify(state) + (state.kind === 'idle' || state.kind === 'search' ? Math.floor(t * 4) : '');
    if (key !== lastKey) (drawScreen(machine.tex, state, t), (lastKey = key));
    // The button dips when it's pressed.
    dome.position.y = 2.9 - (t > PRESSED && t < PRESSED + 0.35 ? 0.15 : 0);
  }

  // ---- the people ----
  const crowdSpots = [[-9.4, 3.4], [-4.6, 2.8], [-2.6, 2.2], [4.6, 2.4], [-8.6, 6.4], [-1.0, 7.4], [3.6, 7.6], [8.4, 10.6], [-4.6, 11.0], [-1.2, 9.8], [3.2, 9.8], [7.0, 9.6], [-7.6, 11.4], [1.6, 12.4]];
  function townCrowd(t, mood) {
    crowdSpots.forEach((xz, k) => {
      const yaw = toward(xz, [0, -3]) + (k % 2 ? 12 : -12);
      let pose = k % 3 ? POSES.idle(t, k) : POSES.crossArms(t, k);
      let face = faceOf(k, ['neutral', 'suspicious', 'sad']);
      if (mood === 'shock') (pose = POSES.shocked(t, k)), (face = faceOf(k, ['sad', 'neutral']));
      if (mood === 'cheer') (pose = POSES.cheer(t, k)), (face = faceOf(k, ['grin', 'happy']));
      at(crowd[k], xz, { yaw, pose, face });
    });
  }

  function mayor(t) {
    let xz = MAYOR_AT;
    let yaw = S_SQ.yaw(-20);
    let pose = POSES.idle(t, 1);
    let face = 'smirk';
    if (t >= MAYOR && t < ABUSE) {
      pose = POSES.crossArms(t, 1);
      face = 'smirk';
      if (t >= CUTOUT - 0.1) (pose = POSES.idle(t, 1)), (pose.rArm = [-30, 0, -40]), (yaw = S_SQ.yaw(30)), (face = 'grin');
    } else if (t >= ABUSE && t < MIDNIGHT) {
      // At the town-hall podium.
      xz = [PODIUM_AT[0], PODIUM_AT[1] - 1.3];
      yaw = S_SQ.yaw(10);
      pose = POSES.talk(t, 1);
      pose.rArm = [-25, 0, -30];
      face = t >= COMPLAIN ? 'suspicious' : 'grin';
      if (t >= MOMQ) (face = 'angry'), (pose = POSES.crossArms(t, 1));
    } else if (t >= MIDNIGHT) {
      const reach = t >= PRESS && t < PRESSED + 0.6;
      pose = POSES.idle(t, 1);
      if (reach) pose.rArm = [-55, 0, 18];
      face = 'grin';
      if (t >= STEP) face = 'smirk';
      if (t >= TUESDAY) face = 'suspicious';
      if (t >= FELL) (face = 'sad'), (pose = POSES.shocked(t, 1));
      if (t >= CLOCK) face = 'sad';
      if (t >= GABLE_FOUND) (face = 'sad'), (pose = POSES.shocked(t, 1));
      if (t >= CANT) (pose = POSES.idle(t, 1)), (face = 'sad'), (yaw = S_SQ.yaw(-10));
    }
    at(A.mayor, xz, { y: TOP, yaw, pose, face });
  }

  function cardboard(t) {
    const p = POSES.idle(0, 0);
    p.rArm = [-30, 0, -40];
    let xz = CUTOUT_AT;
    let yaw = S_SQ.yaw(-15);
    if (t >= DATE - 0.08) (xz = [TABLE_AT[0] + 2.0, TABLE_AT[1]]), (yaw = S_DT.yaw(-55));
    const onStage = t < DATE - 0.08;
    at(cutout, xz, { y: onStage ? TOP : 0, yaw, pose: p, face: 'grin' });
    cutout.root.scale.z = 0.07;
    stand.visible = true;
    stand.position.set(T.x + xz[0], onStage ? TOP : 0, T.z + xz[1]);
    stand.rotation.y = rad(yaw);
  }

  function bakery(t) {
    const bp = POSES.holdOut(t, 2);
    bp.rArm = [-70, 0, 6];
    at(A.baker, S_BK.p(-1.1, 0), { yaw: S_BK.yaw(35), pose: t >= BREAD ? bp : POSES.idle(t, 2), face: t >= BREAD ? 'sad' : 'happy' });
    at(A.inspector, S_BK.p(1.1, 0), { yaw: S_BK.yaw(-35), pose: POSES.idle(t, 4), face: t >= BREAD ? 'suspicious' : 'happy', hold: ['clip'] });
    bread.visible = t >= BREAD - 0.1;
    if (bread.visible) {
      const h = A.baker.handPos('r');
      bread.position.set(h.x, h.y + 0.1, h.z);
    }
  }

  function garyAndBirds(t, show = true) {
    const flap = t >= PIGEONS - 0.1 && t < PIGEONS + 1.5;
    flock.forEach((pg, k) => {
      pg.visible = show;
      if (!show) return;
      const [hx, hz] = pg.userData.home;
      const ph = pg.userData.ph;
      const hop = Math.max(0, Math.sin(t * 5 + ph)) * 0.18 + (flap ? Math.abs(Math.sin(t * 14 + k)) * 0.6 : 0);
      pg.position.set(T.x + hx, hop, T.z + hz);
      pg.rotation.y = rad(pg.userData.yaw + 20 * Math.sin(t * 1.3 + ph));
    });
    if (!show) return;
    const p = POSES.idle(t, 6);
    p.rArm = [-40, 0, -30];
    p.lArm = [-40, 0, 30];
    let face = 'happy';
    if (t >= PIGEONS - 0.1 && t < STEP) (p.rArm = [-160, 0, -20]), (p.lArm = [-60, 0, 20]), (face = 'grin');
    if (t >= CANCEL && t < DATE) (face = 'sad'), (p.rArm = [-10, 0, -8]), (p.lArm = [-10, 0, 8]);
    at(A.gary, GARY_AT, { yaw: toward(GARY_AT, [0, -3]) - 35, pose: p, face });
  }

  function mom(t) {
    let xz = MOM_AT;
    let pose = POSES.idle(t, 5);
    let face = 'neutral';
    let yaw = toward(MOM_AT, [0, -3]);
    if (t >= MOMQ && t < MIDNIGHT) {
      xz = MIC_AT;
      pose = POSES.talk(t, 5);
      pose.lArm = [-150, 0, -10];
      face = 'suspicious';
      yaw = 180 + 15;
    }
    if (t >= MATCH1) face = 'neutral';
    if (t >= PALE) (pose = POSES.shocked(t, 5)), (face = 'sad');
    if (t >= STEP) (pose = POSES.idle(t, 5)), (face = 'sad');
    if (t >= CANCEL) (pose = POSES.cheer(t, 5)), (face = 'happy');
    at(A.mom, xz, { yaw, pose, face });
  }

  function me(t) {
    if (t >= DATE - 0.08) {
      // The date: seated across from the cardboard mayor.
      const p = POSES.sit();
      p.rArm = [-55, 0, 12];
      p.lArm = [-55, 0, -12];
      p.neck = [-8, 0, 0];
      let face = 'smirk';
      if (t >= FLAT) face = 'neutral';
      if (t >= HONEST) (face = 'grin'), (p.rArm = [-70 + 10 * Math.sin(t * 4), 0, 30]);
      at(A.me, [TABLE_AT[0] - 2.2, TABLE_AT[1]], { y: -0.25, yaw: S_DT.yaw(28), pose: p, face });
      return;
    }
    let xz = ME_AT;
    let pose = POSES.idle(t);
    let face = 'neutral';
    let yaw = toward(ME_AT, [0, -3]);
    paper.visible = false;
    if (t >= PALE) face = 'sad';
    if (t >= STEP) {
      const w = seg(t, STEP + 0.1, STEP + 1.1);
      xz = [lerp(ME_AT[0], ME_FRONT[0], w), lerp(ME_AT[1], ME_FRONT[1], w)];
      yaw = 180 + 10;
      pose = w < 1 ? POSES.walk(t, 0, 30, 1.6) : POSES.idle(t);
      face = 'smirk';
      if (t >= SPEAK) (pose = POSES.talk(t)), (pose.rArm = [-30, 0, -24]);
      if (t >= CHARTER - 0.2 && t < FELL) {
        pose = POSES.idle(t);
        pose.rArm = [-80, 0, 12];
        pose.lArm = [-80, 0, -12];
        paper.visible = true;
        face = 'smirk';
      }
      if (t >= TUESDAY) face = 'grin';
      if (t >= FELL) (pose = POSES.crossArms(t)), (face = 'smirk');
      if (t >= LAST - 0.1) (pose = POSES.shocked(t)), (face = 'sad');
    }
    at(A.me, xz, { yaw, pose, face });
  }

  function gable(t) {
    if (t < GABLE - 0.1) return;
    let xz;
    let yaw;
    let pose = POSES.idle(t, 8);
    let face = 'happy';
    let hold = ['gnome'];
    if (t < GNOMES - 0.05) {
      xz = GABLE_START;
      yaw = toward(xz, [0, -3]) - 20;
      pose.rArm = [-60, 0, 10];
      face = 'grin';
    } else if (t < CANT - 0.05) {
      // Out of the crowd toward the stage, gnome bouquet first.
      const w = seg(t, WALKOUT, WAITING);
      xz = [lerp(GABLE_START[0], GABLE_END[0], w), lerp(GABLE_START[1], GABLE_END[1], w)];
      yaw = w < 1 ? toward(GABLE_START, GABLE_END) : 180 + 25;
      pose = w < 1 ? POSES.walk(t, 8, 26, 1.3) : POSES.idle(t, 8);
      pose.rArm = [-60, 0, 10];
      face = t >= WAITING ? 'grin' : 'happy';
      if (t < WALKOUT) return;
    } else {
      xz = GABLE_STAGE;
      yaw = S_SQ.yaw(45);
      pose.rArm = [-60, 0, 10];
      pose.lArm = [-70, 0, 40];
      face = 'grin';
    }
    const y = t >= CANT - 0.05 ? TOP : 0;
    at(A.gable, xz, { y, yaw, pose, face, hold });
  }

  function gnomesAt(t) {
    gnomes.forEach((g, k) => (g.rotation.z = t >= GNOMES && t < WALKOUT ? 0.06 * Math.sin(t * 6 + k) : 0));
  }

  function hook(t) {
    // A pair the machine just matched: neither of them looks thrilled.
    if (t < NOSAY - 0.3) return;
    const pair = stage([0, 2.4], 180);
    at(crowd[0], pair.p(-1.1, 0), { yaw: pair.yaw(45), pose: POSES.shocked(t, 0), face: 'sad' });
    const no = POSES.idle(t, 1);
    no.rArm = [-100, 0, -10];
    at(crowd[1], pair.p(1.1, 0), { yaw: pair.yaw(-45), pose: no, face: 'angry' });
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    stand.visible = false;
    bread.visible = false;
    mic.visible = t >= ABUSE && t < MIDNIGHT;
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    cameraAt(t);
    screenAt(t);
    gnomesAt(t);
    if (t < DATE - 0.08) {
      cardboard(t);
      if (t >= MAYOR) mayor(t);
      if (t >= BAKER && t < MAYOR) bakery(t);
      if (t < BAKER) {
        mayor(t);
        hook(t);
        if (t < NOSAY - 0.3) townCrowd(t, 'calm');
      }
      if (t >= ABUSE) {
        const mood = t >= CANCEL ? 'cheer' : t >= SILENT && t < GABLE ? 'shock' : t >= PALE && t < STEP ? 'shock' : 'calm';
        if (t >= MIDNIGHT || (t >= COMPLAIN && t < WAKES)) townCrowd(t, t >= GABLE ? 'gable' : mood);
        if (t >= COMPLAIN && t < MIDNIGHT) {
          // The complainer: at the mic, then matched with Gary.
          const yelling = t < WAKES;
          const p = yelling ? POSES.yell(t, 3) : POSES.shocked(t, 3);
          if (yelling) p.rArm = [-150, 0, -30];
          at(crowd[3], yelling ? MIC_AT : [GARY_AT[0] - 2.2, GARY_AT[1]], { yaw: yelling ? 180 + 15 : toward([GARY_AT[0] - 2.2, GARY_AT[1]], [0, -3]) + 30, pose: p, face: yelling ? 'angry' : 'sad' });
        }
        if (t >= WAKES) garyAndBirds(t);
        else garyAndBirds(t, false);
        mom(t);
        me(t);
        gable(t);
      } else garyAndBirds(t, false);
    } else {
      // The date.
      garyAndBirds(t, false);
      cardboard(t);
      me(t);
    }
    captions(t);
  };
}
