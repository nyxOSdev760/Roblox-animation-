// "Twinkletoes" — a Roblox story Short. Narration, word timings and the script live in
// assets/voice/twinkletoes (tools/narrate.py, tools/align.py); scripts/twinkletoes.md is
// the text. Every shot is cut and timed on the narrator's words.
import * as THREE from 'three';
import words from '../../assets/voice/twinkletoes/words.json' with { type: 'json' };
import { BRICK, part, ball, cylinder, robloxMaterial } from '../src/roblox.js';
import { buildSets, ORIGIN, drawGotchaLogo } from '../src/sets.js';
import { Actor, POSES, blend, sizeAt } from '../src/actors.js';
import { createCaptions } from '../src/captions.js';
import { ease } from '../src/anim.js';
import * as P from '../src/props.js';

// ---- timing ------------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Start time of the n-th occurrence of `word` in narration line `line`. */
function W(line, word, n = 0) {
  let c = 0;
  for (const w of words) if (w.line === line && norm(w.word) === norm(word) && c++ === n) return w.start;
  throw new Error(`word "${word}" #${n} not in line ${line}`);
}
const END = words.at(-1).end + 2.4;
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const sm = (u) => ease('Sine', 'InOut', u);

// Where the named townspeople stand in the square's crowd.
const SPOT = { lunch: [-2.2, 7.5], mail: [3.6, 8.5], contestant: [-7.6, 10.5], diaryGirl: [9, 11], grandma: [-5.6, 5.5] };

// Feet ⇄ size: a normal R6 is about 5.5 ft tall in this story.
const FT = (ft) => ft / 5.5;

// ---- cast ---------------------------------------------------------------------------------
const K = BRICK;
const CAST = {
  me: { shirt: 'shirt-moto', pants: 'pants-dark-green-jeans', hair: 'hair-pal', skin: K.brightYellow },
  mom: { shirt: 'shirt-pastel-starburst', pants: 'pants-beautiful-you-jeans', hair: 'hair-long-brunette', skin: K.lightOrange },
  crane: { shirt: 'shirt-suit-tv-host', pants: 'pants-suit-tv-host', hair: 'hair-black-middle-part', skin: K.nougat },
  cousin: { shirt: 'shirt-grad-gown', pants: 'pants-grad-gown', hair: 'hair-messy-boy-black', skin: K.lightOrange },
  principal: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-grandpa-white', skin: K.nougat },
  tripper: { shirt: 'shirt-roblox-jacket', pants: 'pants-jeans', hair: 'hair-black-messy', skin: K.brown },
  laugher: { shirt: 'shirt-green-jersey', pants: 'pants-jean-shorts', hair: 'hair-blonde-spiked', skin: K.brightYellow },
  waver: { shirt: 'shirt-blue-plaid', pants: 'pants-black-jeans', hair: 'hair-cool-boy-mullet', skin: K.lightOrange },
  waved: { shirt: 'shirt-teal', pants: 'pants-ripped-skater', hair: 'hair-hot-pink-bob', skin: K.nougat },
  friend: { shirt: 'shirt-denim-hoodie', pants: 'pants-black-jeans-sneakers', hair: 'hair-brown-anime', skin: K.brightYellow },
  bride: { shirt: 'shirt-wedding-dress', pants: 'pants-wedding-skirt', hair: 'hair-blonde-curly-celebrity', skin: K.lightOrange },
  groom: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-brown-charmer', skin: K.brightYellow },
  bestman: { shirt: 'shirt-grey-striped', pants: 'pants-black-slacks', hair: 'hair-cool-boy', skin: K.brown },
  singer: { shirt: 'shirt-guitar-tee', pants: 'pants-black-jeans-sneakers', hair: 'hair-flaming-mohawk', skin: K.brightYellow },
  lunch: { shirt: 'shirt-lunch-lady', pants: 'pants-lunch-lady', hair: 'hair-black-messy-buns', skin: K.brown },
  mail: { shirt: 'shirt-mail-carrier', pants: 'pants-mail-shorts', hair: 'hair-cool-boy', skin: K.lightOrange },
  doctor: { shirt: 'shirt-doctor', pants: 'pants-scrubs', hair: 'hair-grandpa-gray', skin: K.nougat },
  crew: { shirt: 'shirt-gotcha-crew', pants: 'pants-black-jeans', hair: 'hair-orange-beanie-black', skin: K.brown },
  contestant: { shirt: 'shirt-grey-striped', pants: 'pants-jeans', hair: 'hair-shaggy', skin: K.brightYellow },
  diaryGirl: { shirt: 'shirt-purple-teal', pants: 'pants-jean-shorts-white', hair: 'hair-blonde-pigtails', skin: K.lightOrange },
  grandma: { shirt: 'shirt-pastel-starburst', pants: 'pants-black-slacks', hair: 'hair-silver-locks', skin: K.lightOrange },
  grandpa: { shirt: 'shirt-blue-plaid', pants: 'pants-black-slacks', hair: 'hair-grandpa-white', skin: K.nougat },
};

// The crowd: Roblox's classic clothes in different combos.
const SHIRTS = ['shirt-roblox-simple', 'shirt-denim-hoodie', 'shirt-grey-striped', 'shirt-teal', 'shirt-pizza-heart', 'shirt-guitar-tee-2', 'shirt-pizza-fav', 'shirt-purple-teal', 'shirt-blue-plaid', 'shirt-green-jersey', 'shirt-roblox-jacket', 'shirt-moto'];
const PANTS = ['pants-jeans', 'pants-black-jeans', 'pants-jean-shorts', 'pants-black-slacks', 'pants-black-jeans-sneakers', 'pants-ripped-skater', 'pants-jean-shorts-white', 'pants-lime-boxing-shorts'];
const HAIRS = ['hair-black-messy', 'hair-long-brunette', 'hair-brown-charmer', 'hair-afro', 'hair-black-ponytail', 'hair-true-blue', 'hair-blonde-pigtails', 'hair-messy-popular-boy', 'hair-popular-girl-blonde-brown', 'hair-dreads', 'hair-crimson-shaggy', 'hair-black-high-pigtails', 'hair-cool-boy', 'hair-afro-puff', 'hair-straight-blonde', 'hair-black-wolf-cut', 'hair-orange-curly-afro', 'hair-hot-pink-bob'];
const SKINS = [K.brightYellow, K.lightOrange, K.nougat, K.brown, K.reddishBrown, K.brightYellow];
const EXTRAS = Array.from({ length: 18 }, (_, i) => ({
  shirt: SHIRTS[(i * 5) % SHIRTS.length],
  pants: PANTS[(i * 3) % PANTS.length],
  hair: HAIRS[i % HAIRS.length],
  skin: SKINS[(i * 7) % SKINS.length],
  kid: i % 6 === 5,
}));

const FACE_ACCESSORIES = [
  'face-addon-blush', 'face-addon-sweat-drop', 'face-addon-anger-mark-big', 'face-addon-tears', 'face-eyes-shocked',
  'face-mouth-small-frown', 'face-big-smile', 'face-big-grin-retro', 'face-worry-manga', 'face-terrified', 'face-about-to-cry',
  'face-crying-epic', 'face-dizzy-epic', 'face-scary-grin', 'face-squint-tongue', 'face-wink-happy', 'face-big-smile-blush',
  'face-sleepy', 'face-derp-silly',
];

export const meta = {
  duration: Math.ceil(END * 30) / 30,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'happy', 'grin', 'smirk', 'suspicious', 'sad', 'crying', 'angry'],
  accessories: [...new Set([...Object.values(CAST).map((c) => c.hair), ...EXTRAS.map((c) => c.hair), ...FACE_ACCESSORIES])],
  clothing: [...new Set([...Object.values(CAST), ...EXTRAS].flatMap((c) => [c.shirt, c.pants]))],
  audio: [],
};

// ---- sound -------------------------------------------------------------------------------
const sfx = (file, at, volume = 0.8, extra = {}) => meta.audio.push({ file, at, volume, ...extra });
sfx('../voice/twinkletoes/narration.flac', 0, 1.0);
sfx('synth/music_loop.wav', 0, 0.16, { loop: true, dur: END, fade: 2 });
const SHRINK = 'synth/bloop_down.wav';
const GROW = 'synth/bloop_up.wav';

// ---- sound effects that belong to shot actions ------------------------------------------
// (Bloops on the narrated "Bloop"s and on every visible size change.)
for (const [l, n] of [[18, 1], [22, 1], [23, 2], [24, 3], [27, 5]]) for (let k = 0; k < n; k++) sfx(SHRINK, W(l, 'Bloop', k), 0.75);
sfx(SHRINK, W(0, 'shrink'), 0.7);
sfx(SHRINK, W(1, 'inch', 0) - 0.05, 0.7);
sfx(SHRINK, W(1, 'Another') + 0.2, 0.7);
sfx(GROW, W(1, 'grow') - 0.05, 0.7);
sfx('synth/thud.wav', W(1, 'Trip') + 0.55, 0.8);
sfx('synth/thud.wav', W(3, 'trips') + 0.35, 0.8);
for (let k = 0; k < 4; k++) sfx(SHRINK, W(2, 'cracked') + 0.2 + k * 0.22, 0.6);
sfx('roblox/ouch.wav', W(2, 'cracked') + 0.05, 0.5);
sfx('hahaha-rblx-se.mp3', W(2, 'graduation'), 0.45);
sfx('hahaha-rblx-se.mp3', W(3, 'trips') + 0.5, 0.5);
sfx(SHRINK, W(3, 'diaries') + 0.3, 0.6);
sfx(SHRINK, W(3, 'baby') + 0.4, 0.6);
sfx('hahaha-rblx-se.mp3', W(7, 'target') - 0.2, 0.45);
sfx(SHRINK, W(7, 'target'), 0.6);
sfx('synth/whoosh.wav', W(7, 'drags'), 0.5);
for (let k = 0; k < 3; k++) sfx('synth/pluck_C4.wav', W(7, 'Every', 1) + k * 0.4, 0.35);
sfx('sadd-rblx-se.mp3', W(7, 'two') + 0.2, 0.5);
sfx('work-at-a-pizza-place-scream.mp3', W(7, 'cat') + 0.2, 0.35, { dur: 0.9, fade: 0.2 });
sfx('hmm-rblx-se.mp3', W(8, 'doctor') + 0.2, 0.45);
sfx('yeaa-rblx-se.mp3', W(10, 'Gotcha') - 0.2, 0.4);
sfx('hahaha-rblx-se.mp3', W(11, 'laughed'), 0.6);
sfx('hahaha-rblx-se.mp3', W(11, 'laughed') + 0.35, 0.45);
sfx(SHRINK, W(13, 'sink') + 0.1, 0.5);
sfx('synth/whoosh.wav', W(14, 'stepped'), 0.5);
sfx('gaspp.mp3', W(15, 'Twinkletoes') + 0.55, 0.9);
sfx('huh-rblx-se.mp3', W(18, 'felt') + 0.1, 0.5);
sfx(GROW, W(18, 'taller'), 0.7);
sfx(SHRINK, W(20, 'Twinkletoes') + 0.4, 0.7);
sfx(GROW, W(20, 'Twinkletoes') + 0.4, 0.5);
sfx('yeaa-rblx-se.mp3', W(21, 'got'), 0.5);
sfx('hahaha-rblx-se.mp3', W(24, 'Toes', 0), 0.4);
sfx('hahaha-rblx-se.mp3', W(24, 'Toes', 1), 0.4);
for (let k = 0; k < 3; k++) sfx(GROW, W(24, 'Bloop', k) + 0.06, 0.5);
for (let k = 0; k < 6; k++) sfx(GROW, W(25, 'growing') + 0.15 + k * 0.17, 0.45);
sfx(GROW, W(25, 'Grandmas') + 0.2, 0.6);
for (let k = 0; k < 5; k++) sfx('synth/pop.wav', W(25, 'popped') + k * 0.13, 0.7);
for (const w of ['Eight', 'Six', 'Four']) sfx(SHRINK, W(25, w), 0.8);
for (let k = 0; k < 5; k++) sfx(GROW, W(27, 'Bloop', k) + 0.05, 0.6);
sfx('woahh-rblx-se.mp3', W(28, 'tiniest'), 0.45);
sfx('synth/squeak.wav', W(28, 'seen') + 0.2, 0.6);
sfx('synth/squeak.wav', W(28, 'anybody') + 0.3, 0.6);
for (let k = 0; k < 4; k++) sfx('synth/squeak.wav', W(29, 'scurried') + k * 0.6, 0.55);
sfx('roblox/action_falling.wav', W(29, 'drain'), 0.35, { dur: 1.2, fade: 0.4 });
sfx('yeaa-rblx-se.mp3', W(30, 'again'), 0.5);
sfx('synth/thud.wav', W(30, 'bus') + 0.2, 0.9);
sfx('roblox/ouch.wav', W(30, 'bus') + 0.25, 0.6);


// ---- the shots ---------------------------------------------------------------------------
// Each shot: [start time, function(lt, t, d)] — lt is time since the shot started, d its
// length. A shot lasts until the next one starts.
export function setup({ scene, camera, assets, faces, sun }) {
  const h = buildSets(scene, assets);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -45;
  sc.right = sc.top = 45;
  sc.updateProjectionMatrix();

  const mk = (c, extra = {}) =>
    new Actor({
      assets,
      faces,
      face: 'neutral',
      shirt: c.shirt,
      pants: c.pants,
      accessories: [c.hair, ...(extra.accessories ?? [])],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin },
    });
  const A = {};
  for (const [k, c] of Object.entries(CAST)) A[k] = mk(c);
  const X = EXTRAS.map((c) => mk(c));
  const everyone = [...Object.values(A), ...X];
  for (const a of everyone) scene.add(a.root);

  // Mailman's baby bonnet (from being dressed up as a baby on live TV).
  const bonnet = new THREE.Group();
  const pink = robloxMaterial(assets, K.pink, 'Fabric');
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.7), pink);
  cap.position.y = 0.55;
  cap.rotation.x = -0.35;
  bonnet.add(cap);
  const bow = ball(assets, 0.18, [0, -0.15, 0.55], K.institutionalWhite, 'Fabric');
  bonnet.add(bow);
  bonnet.position.y = 0.5;
  A.mail.r6.joints.neck.add(bonnet);

  // Hand props.
  A.crane.attach('mic', P.microphone(assets), 'r', [0, -0.2, 0.3], [-Math.PI / 2, 0, 0]);
  A.me.attach('mic', P.microphone(assets), 'r', [0, -0.2, 0.3], [-Math.PI / 2, 0, 0]);
  A.mom.attach('mic', P.microphone(assets), 'r', [0, -0.2, 0.3], [-Math.PI / 2, 0, 0]);
  A.bestman.attach('mic', P.microphone(assets), 'r', [0, -0.2, 0.3], [-Math.PI / 2, 0, 0]);
  const lunch = P.lunchbox(assets);
  const note = P.kidNote(assets);
  note.position.set(0, 1.2, 0.2);
  lunch.add(note);
  A.crane.attach('lunchbox', lunch, 'r', [0, -0.6, 0], [Math.PI / 2, 0, 0]);
  A.crane.attach('diary', P.diary(assets), 'r', [0, -0.8, 0.2], [Math.PI / 2, 0, 0]);
  A.me.attach('paycheck', P.paycheck(assets, 'TWINKLETOES CRANE', 2.6, 1.15), 'r', [0, -0.9, 0.2], [Math.PI / 2, 0, 0]);
  A.principal.attach('tweezers', P.tweezers(assets), 'r', [0, 0.2, 0], [Math.PI, 0, 0]);
  const clip = part(assets, [1.4, 1.8, 0.1], [0, 0, 0], K.reddishBrown, 'Wood');
  clip.add(part(assets, [1.2, 1.5, 0.05], [0, -0.05, 0.07], K.institutionalWhite, 'Plastic'));
  A.doctor.attach('clipboard', clip, 'r', [0, -0.3, 0.3], [-1.1, 0, 0]);
  A.mom.attach('spoon', part(assets, [0.15, 1.6, 0.15], [0, 0, 0], K.mediumStoneGrey, 'Metal'), 'r', [0, -0.6, 0], [0, 0, 0]);
  A.mom.attach('stamp', cylinder(assets, 0.35, 0.7, [0, 0, 0], K.brightRed, 'Plastic'), 'r', [0, -0.3, 0], [0, 0, 0]);

  // A cat and a visible spotlight beam.
  const theCat = P.cat(assets);
  scene.add(theCat);
  const spot = P.lightBeam(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 2.2, 0xfff2b0, 0.22);
  scene.add(spot);
  const aimSpot = (from, to, r = 2.2) => {
    const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
    const len = dir.length();
    spot.position.set(...from);
    spot.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    spot.scale.set(r / 2.2, len / 1, r / 2.2);
    spot.visible = true;
  };
  spot.geometry.dispose();
  spot.geometry = new THREE.ConeGeometry(2.2, 1, 32, 1, true).translate(0, -0.5, 0);

  // ---- helpers ---------------------------------------------------------------------------
  const o = (set, x = 0, z = 0) => [ORIGIN[set].x + x, ORIGIN[set].z + z];
  const put = (who, set, x, z, opts = {}) => (typeof who === 'string' ? A[who] : who).set({ at: o(set, x, z), ...opts });
  const cam = (set, pos, look, fov = 55) => {
    const O = ORIGIN[set];
    camera.position.set(O.x + pos[0], pos[1], O.z + pos[2]);
    camera.lookAt(O.x + look[0], look[1], O.z + look[2]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };
  const camMove = (set, u, p0, p1, l0, l1, f0 = 55, f1 = f0) => cam(set, lerp3(p0, p1, sm(u)), lerp3(l0, l1, sm(u)), lerp(f0, f1, sm(u)));
  const sunOn = (set, x = 0, z = 0) => {
    const O = ORIGIN[set];
    sun.target.position.set(O.x + x, 0, O.z + z);
    sun.position.set(O.x + x + 30, 60, O.z + z + 40);
  };
  let shake = 0;
  const screen = (tex, draw) => tex.redraw(draw);
  let lastScreen = '';
  const showScreen = (key, tex, draw) => {
    if (lastScreen === key + tex.uuid) return;
    lastScreen = key + tex.uuid;
    screen(tex, draw);
  };

  // Crowd placement on the square: rows facing the stage (-z), leaving gaps where the
  // named characters stand.
  const crowdSpots = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) crowdSpots.push([-16 + c * 4.6 + (r % 2) * 2.3, 6 + r * 4]);
  const reserved = [...Object.values(SPOT), [3.5, 4], [5.5, 4.4], [2.5, 1], [5, 1]];
  const freeSpots = crowdSpots.filter(([x, z]) => reserved.every(([rx, rz]) => Math.hypot(x - rx, z - rz) > 2.8));
  const crowdAt = (i) => freeSpots[(i * 7 + 2) % freeSpots.length];
  const crowd = (t, { pose = 'idle', face = 'neutral', yaw = 180, grow = null, set = 'square', skip = [] } = {}) => {
    X.forEach((a, i) => {
      if (skip.includes(i)) return;
      const [x, z] = crowdAt(i);
      const base = EXTRAS[i].kid ? 0.72 : 1;
      const size = grow ? grow(i, base) : base;
      const pz = typeof pose === 'function' ? pose(i) : pose;
      const f = typeof face === 'function' ? face(i) : face;
      put(a, set, x, z, { yaw: yaw + ((i * 37) % 21) - 10, size, pose: POSES[pz](t, i), face: f });
    });
  };
  // Studio audience on the bleachers (sitting).
  const audience = (t, { face = 'neutral', pose = 'sit', n = 14 } = {}) => {
    X.slice(0, n).forEach((a, i) => {
      const [x, y, z] = h.studioSeats[(i * 5 + 2) % h.studioSeats.length];
      const p = POSES[pose](t, i);
      if (pose === 'sit') p.lift = y - 2;
      else p.lift = 0;
      a.set({ at: [x, z], y: pose === 'sit' ? 0 : y, yaw: 180, size: EXTRAS[i].kid ? 0.72 : 1, pose: p, face: typeof face === 'function' ? face(i) : face });
    });
  };

  // Sizes over the story.
  const MOM_SMALL = FT(2);
  const CRANE_BIG = FT(9);
  const craneSize = (t) =>
    sizeAt(t, CRANE_BIG, [
      [W(18, 'Bloop'), CRANE_BIG - FT(1 / 12) * 3],
      [W(20, 'Twinkletoes') + 0.4, CRANE_BIG - FT(0.6)],
      [W(22, 'Bloop'), FT(8.2)],
      [W(23, 'Bloop', 0), FT(8)],
      [W(23, 'Bloop', 1), FT(7.8)],
      [W(24, 'Bloop', 0), FT(7.6)],
      [W(24, 'Bloop', 1), FT(7.4)],
      [W(24, 'Bloop', 2), FT(7.2)],
      [W(25, 'Eight'), FT(6.4)],
      [W(25, 'Six'), FT(5)],
      [W(25, 'Four'), FT(4)],
      [W(27, 'Bloop', 0), FT(3.2)],
      [W(27, 'Bloop', 1), FT(2.4)],
      [W(27, 'Bloop', 2), FT(1.7)],
      [W(27, 'Bloop', 3), FT(1.1)],
      [W(27, 'Bloop', 4), FT(0.6)],
    ]);
  const momSize = (t) =>
    sizeAt(t, MOM_SMALL, [
      [W(13, 'sink'), MOM_SMALL * 0.88],
      [W(27, 'Bloop', 0), FT(2.8)],
      [W(27, 'Bloop', 1), FT(3.6)],
      [W(27, 'Bloop', 2), FT(4.3)],
      [W(27, 'Bloop', 3), FT(4.9)],
      [W(27, 'Bloop', 4), FT(5.5)],
    ], 0.3);
  const meSize = (t) =>
    sizeAt(t, 1, [
      [W(18, 'taller'), FT(5.7)],
      [W(20, 'Twinkletoes') + 0.4, FT(5.9)],
      [W(24, 'Bloop', 0), FT(6.2)],
      [W(24, 'Bloop', 1), FT(6.5)],
      [W(24, 'Bloop', 2), FT(6.8)],
      [W(25, 'growing'), FT(7)],
    ]);

  // ---- shot list ---------------------------------------------------------------------------
  const shots = [];
  const shot = (start, set, fn) => shots.push({ start, set, fn });

  // 0 — the rule, shown on a guy on the sidewalk.
  shot(0, 'town', (lt, t) => {
    sunOn('town', 0, 0);
    const size = sizeAt(t, 1, [[W(0, 'shrink'), 0.86]]);
    const shy = seg(t, W(0, 'embarrassed'), W(0, 'embarrassed') + 0.3);
    put('contestant', 'town', 0, 0.5, { yaw: 10, size, pose: blend(POSES.idle(lt), POSES.shy(lt), shy), face: shy > 0.5 ? ['sad', 'face-addon-blush'] : 'neutral' });
    put('friend', 'town', 3.5, -0.5, { yaw: -40, pose: POSES.pointLaugh(lt), face: 'grin' });
    camMove('town', seg(lt, 0, 3.6), [1.2, 4.2, 9.5], [1.0, 3.6, 7.8], [1.2, 3.2, 0], [1.2, 2.9, 0], 55, 50);
  });

  // 1 — "Trip in the hallway? An inch."
  shot(W(1, 'Trip') - 0.15, 'hall', (lt, t) => {
    sunOn('hall');
    const tripAt = W(1, 'Trip') + 0.35;
    const x = lerp(-9, -2.5, seg(t, tripAt - 1.5, tripAt));
    const fall = seg(t, tripAt, tripAt + 0.3);
    const p = t < tripAt ? POSES.walk(lt) : blend(POSES.walk(lt), POSES.lieDown(), ease('Quad', 'In', fall));
    const size = sizeAt(t, 1, [[W(1, 'inch', 0) - 0.05, 0.9]]);
    put('tripper', 'hall', x + fall * 2.4, -1, { yaw: 90, size, pose: p, face: fall > 0.5 ? ['sad', 'face-addon-blush'] : 'neutral' });
    put('laugher', 'hall', 2.6, 2, { yaw: -110, pose: fall > 0.2 ? POSES.pointLaugh(lt) : POSES.idle(lt), face: fall > 0.2 ? 'happy' : 'neutral' });
    cam('hall', [0.5, 4.2, 12], [0, 2.4, -1], 58);
  });

  // 2 — "Wave back at someone who wasn't waving at you? Another inch."
  shot(W(1, 'Wave') - 0.1, 'town', (lt, t) => {
    sunOn('town', -20, 0);
    const realize = W(1, 'Another') - 0.1;
    const size = sizeAt(t, 1, [[W(1, 'Another') + 0.2, 0.9]]);
    put('waver', 'town', -21, 0, { yaw: 70, pose: POSES.wave(lt), face: 'happy' });
    put('friend', 'town', -13.5, 0, { yaw: -70, pose: POSES.wave(lt, 2), face: 'happy' });
    put('waved', 'town', -17.5, 2.2, { yaw: t < realize ? -50 : 10, size, pose: t < realize ? POSES.wave(lt, 1) : POSES.shy(lt), face: t < realize ? 'happy' : ['sad', 'face-addon-blush'] });
    cam('town', [-15.5, 5, 15], [-17.2, 3.2, 0], 56);
  });

  // 3 — "And whoever embarrassed you, they get that inch. They grow."
  shot(W(1, 'And') - 0.1, 'hall', (lt, t) => {
    sunOn('hall');
    const size = sizeAt(t, 1, [[W(1, 'grow') - 0.05, 1.15]]);
    put('tripper', 'hall', -0.2, -1, { yaw: 90, size: 0.9, pose: POSES.lieDown(), face: ['sad', 'face-addon-blush'] });
    put('laugher', 'hall', 3.2, 1.2, { yaw: -60, size, pose: t < W(1, 'grow') ? POSES.laugh(lt) : POSES.crossArms(lt), face: t < W(1, 'grow') ? 'happy' : 'smirk' });
    camMove('hall', seg(lt, 0, 3.2), [7, 4.2, 12], [6.2, 4.8, 10.5], [1.6, 3, 0], [1.8, 3.4, 0], 56, 54);
  });

  // 4 — "So everyone here is very, very careful."
  shot(W(2, 'So') - 0.05, 'town', (lt, t) => {
    sunOn('town', 20, 0);
    ['grandma', 'bestman', 'diaryGirl'].forEach((k, i) => {
      put(k, 'town', 14 + i * 4 + lt * 1.1, 0.5 + (i % 2) * 2, { yaw: 90, pose: POSES.tiptoe(lt, i), face: ['neutral', 'face-addon-sweat-drop'] });
    });
    cam('town', [23, 4.6, 16], [21, 3, 0], 58);
  });

  // 5 — "Nobody tells jokes at weddings."
  shot(W(2, 'Nobody') - 0.05, 'wedding', (lt, t) => {
    sunOn('wedding', 0, -4);
    put('bride', 'wedding', -1.4, -8.5, { yaw: 0, pose: POSES.idle(lt), face: 'suspicious' });
    put('groom', 'wedding', 1.4, -8.5, { yaw: 0, pose: POSES.idle(lt, 1), face: 'suspicious' });
    const bm = POSES.micTalk(lt);
    put('bestman', 'wedding', 5, -6.5, { yaw: -30, pose: bm, face: ['grin', 'face-addon-sweat-drop'] });
    A.bestman.hold('mic');
    X.slice(0, 8).forEach((a, i) => {
      const [x, z] = h.weddingChairs[i];
      const p = i % 3 === 0 ? POSES.shush(lt, i) : POSES.sit();
      if (i % 3 === 0) Object.assign(p, { rLeg: [-90, 0, 0], lLeg: [-90, 0, 0] });
      p.lift = 1.75 - 2;
      a.set({ at: [x, z], yaw: 180 - 20 * Math.sign(x - ORIGIN.wedding.x), size: EXTRAS[i].kid ? 0.72 : 1, pose: p, face: 'angry' });
    });
    cam('wedding', [12, 7, -9], [0.5, 2.8, 0], 60);
  });

  // 6 — "Karaoke is basically illegal."
  shot(W(2, 'Karaoke') - 0.05, 'karaoke', (lt, t) => {
    sunOn('karaoke', 0, -4);
    const back = seg(t, W(2, 'illegal') - 0.2, W(2, 'illegal') + 0.2);
    const walkIn = seg(lt, 0, W(2, 'illegal') - 0.2 - (W(2, 'Karaoke') - 0.05));
    put('singer', 'karaoke', lerp(3, 2, walkIn) + back * 0.6, lerp(3, -2.8, walkIn) + back * 3.5, { yaw: back > 0 ? 20 : 185, pose: back > 0 ? POSES.shocked(lt) : POSES.tiptoe(lt), face: back > 0 ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'happy' });
    cam('karaoke', [7, 5.5, 12], [0.5, 4.2, -4], 60);
  });

  // 7 — "And my cousin's voice cracked once during his graduation speech."
  shot(W(2, 'And') - 0.05, 'grad', (lt, t) => {
    sunOn('grad', 0, -8);
    const crack = W(2, 'cracked') + 0.2;
    const size = sizeAt(t, 1, [0, 1, 2, 3].map((k) => [crack + k * 0.22, 1 - (k + 1) * 0.21]), 0.2);
    put('cousin', 'grad', 0, -10.5, { y: 3, yaw: 0, size, pose: t < crack ? POSES.talk(lt) : POSES.shy(lt), face: t < crack ? 'happy' : ['sad', 'face-addon-blush'] });
    X.slice(2, 11).forEach((a, i) => {
      const p = t > crack + 0.3 ? POSES.laugh(lt, i) : POSES.sit();
      if (t > crack + 0.3) {
        p.rLeg = [-90, 0, 0];
        p.lLeg = [-90, 0, 0];
      }
      p.lift = 1.75 - 2;
      a.set({ at: o('grad', (i - 4) * 3, 4), yaw: 180, size: EXTRAS[i + 2].kid ? 0.72 : 1, pose: p, face: t > crack + 0.3 ? 'happy' : 'neutral' });
    });
    cam('grad', [9, 7, -13], [-1, 3.4, 3], 62);
  });

  // 8 — "They had to hand him his diploma with tweezers."
  shot(W(2, 'They') - 0.05, 'grad', (lt, t) => {
    sunOn('grad', 0, -8);
    put('cousin', 'grad', -1.5, -10.2, { y: 3, yaw: 60, size: 0.16, pose: POSES.cheer(lt), face: 'happy' });
    const pp = POSES.idle(lt);
    pp.rArm = [-50, 0, 0];
    pp.neck = [20, 0, 0];
    put('principal', 'grad', 2.8, -10.2, { y: 3, yaw: -90, pose: pp, face: 'suspicious' });
    A.principal.hold('tweezers');
    cam('grad', [0, 5.8, -1.4], [0, 4.4, -10.2], 58);
  });

  // 9 — "Then there's Mr. Crane."
  shot(W(3, 'Then') - 0.05, 'town', (lt, t) => {
    sunOn('town', -78, -26);
    put('crane', 'town', -78, -26, { yaw: 10, size: CRANE_BIG, pose: POSES.crossArms(lt), face: 'grin' });
    camMove('town', seg(lt, 0, 1.4), [-75, 1.5, -15], [-76, 2.2, -18], [-78, 8, -26], [-78, 8.5, -26], 60, 56);
  });

  // 10 — "He runs the only TV station in town,"
  shot(W(3, 'He') - 0.05, 'town', (lt) => {
    sunOn('town', -78, -30);
    camMove('town', seg(lt, 0, 2.2), [-66, 5, 6], [-68, 7, 2], [-78, 13, -38], [-78, 15, -38], 62, 60);
  });

  // 11 — "and every Friday he hosts Gotcha!, a live show where he pranks people in front of everyone."
  shot(W(3, 'and') - 0.05, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    showScreen('logo', h.studioScreen, (c, w, hh) => drawGotchaLogo(c, w, hh, 'EVERY FRIDAY!'));
    put('crane', 'studio', 0, -10, { y: 2.5, yaw: 0, size: CRANE_BIG, pose: POSES.micTalk(lt), face: 'grin' });
    A.crane.hold('mic');
    audience(lt, { face: (i) => (i % 2 ? 'sad' : ['neutral', 'face-addon-sweat-drop']) });
    camMove('studio', seg(lt, 0, 5), [0, 9, 28], [0, 8, 22], [0, 8, -10], [0, 8.5, -10], 60, 58);
  });

  // 12 — "He trips them."
  shot(W(3, 'He', 2) - 0.1, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    const tripAt = W(3, 'trips') + 0.3;
    const fall = seg(t, tripAt, tripAt + 0.3);
    const cx = lerp(-3, 0.6, seg(t, tripAt - 0.6, tripAt));
    put('contestant', 'studio', cx + fall * 2.6, -8, { y: 2.5, yaw: 90, pose: t < tripAt ? POSES.walk(lt) : blend(POSES.walk(lt), POSES.lieDown(), ease('Quad', 'In', fall)), face: fall > 0.5 ? ['sad', 'face-addon-blush'] : 'happy' });
    const cp = t < tripAt + 0.2 ? POSES.idle(lt) : POSES.pointLaugh(lt);
    if (t < tripAt + 0.3) cp.rLeg = [-35, 0, 0];
    put('crane', 'studio', 2.2, -11.5, { y: 2.5, yaw: -40, size: CRANE_BIG, pose: cp, face: 'grin' });
    cam('studio', [1, 6, 9], [0.5, 4.5, -9], 58);
  });

  // 13 — "He reads their diaries out loud."
  shot(W(3, 'He', 3) - 0.1, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    const s = sizeAt(t, 1, [[W(3, 'diaries') + 0.3, 0.85]]);
    put('crane', 'studio', -2, -10, { y: 2.5, yaw: 25, size: CRANE_BIG, pose: POSES.holdOut(lt), face: 'grin' });
    A.crane.hold('diary');
    put('diaryGirl', 'studio', 3.5, -8, { y: 2.5, yaw: -60, size: s, pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    cam('studio', [3, 7, 9], [0, 6, -9], 56);
  });

  // 14 — "He puts their baby pictures on a forty-foot screen."
  shot(W(3, 'He', 4) - 0.1, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    showScreen('baby', h.studioScreen, drawBabyPicture);
    const s = sizeAt(t, 1, [[W(3, 'baby') + 0.4, 0.82]]);
    put('crane', 'studio', -9, -9, { y: 2.5, yaw: 40, size: CRANE_BIG, pose: POSES.pointLaugh(lt), face: 'grin' });
    put('crew', 'studio', 7, -8, { y: 2.5, yaw: -20, size: s, pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    camMove('studio', seg(lt, 0, 2), [0, 7, 24], [0, 8, 20], [0, 9, -12], [0, 10, -12], 66, 64);
  });

  // 15 — "He's nine feet tall."
  shot(W(4, "He's") - 0.05, 'town', (lt, t) => {
    sunOn('town', -45, 0);
    put('crane', 'town', -46, 1.2, { yaw: 20, size: CRANE_BIG, pose: POSES.crossArms(lt), face: 'smirk' });
    put('mail', 'town', -49.5, 1.6, { yaw: 30, pose: POSES.idle(lt), face: 'neutral' });
    put('grandpa', 'town', -42.5, 1.6, { yaw: -20, pose: POSES.idle(lt, 2), face: 'suspicious' });
    A.mail.root.visible = true;
    cam('town', [-46, 5.5, 15], [-46, 4.6, 0], 52);
  });

  // 16 — "He has to duck under stoplights."
  shot(W(4, 'He') - 0.1, 'town', (lt, t) => {
    sunOn('town', -40, 0);
    const x = lerp(-50, -32, seg(lt, 0, 2.3));
    const near = 1 - Math.min(1, Math.abs(x + 40) / 3.5);
    put('crane', 'town', x, 2.2, { yaw: 90, size: CRANE_BIG, pose: blend(POSES.walk(lt), POSES.duck(lt), sm(near)), face: near > 0.3 ? 'angry' : 'smirk' });
    cam('town', [-38, 5, 16], [-40, 5.5, 0], 56);
  });

  // 17 — "And nobody has ever embarrassed Mr. Crane. Not once."
  shot(W(4, 'And') - 0.05, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    showScreen('logo', h.studioScreen, (c, w, hh) => drawGotchaLogo(c, w, hh));
    put('crane', 'studio', 0, -10, { y: 2.5, yaw: 0, size: CRANE_BIG, pose: POSES.crossArms(lt), face: t > W(4, 'Not') ? 'smirk' : 'grin' });
    camMove('studio', seg(lt, 0, 3), [0, 9.5, 2], [0, 10, -1.5], [0, 10, -10], [0, 10.2, -10], 48, 44);
  });

  // 18 — "He makes everyone call him Mr. Crane."
  shot(W(5, 'He') - 0.05, 'office', (lt, t) => {
    sunOn('office', 6, -6);
    put('crane', 'office', 8.6, -9, { yaw: 10, size: CRANE_BIG, pose: POSES.crossArms(lt), face: 'grin' });
    put('crew', 'office', 5, -4.2, { yaw: 160, pose: POSES.nod(lt), face: ['neutral', 'face-addon-sweat-drop'] });
    put('contestant', 'office', 12.6, -3.6, { yaw: 200, pose: POSES.nod(lt, 1), face: ['neutral', 'face-addon-sweat-drop'] });
    camMove('office', seg(lt, 0, 1.8), [10.5, 9, 3], [10.5, 8.2, 8], [10.5, 8, -11], [10.5, 6.2, -8], 44, 60);
  });

  // 19 — "Nobody in town knows his first name."
  shot(W(5, 'Nobody') - 0.05, 'town', (lt, t) => {
    sunOn('town', 10, 0);
    ['grandma', 'tripper', 'waver'].forEach((k, i) => put(k, 'town', 6 + i * 4, 0.5 + (i % 2), { yaw: -10 + i * 10, pose: POSES.shocked(lt, i), face: 'suspicious' }));
    cam('town', [10, 4, 11], [10, 3, 0], 58);
  });

  // 20 — "Except my mom."
  shot(W(5, 'Except') - 0.05, 'office', (lt, t) => {
    sunOn('office', 0, -4);
    put('mom', 'office', 0.2, -3.6, { y: 3.17, yaw: 10, size: MOM_SMALL, pose: POSES.idle(lt), face: 'happy' });
    camMove('office', seg(lt, 0, 1.6), [1.5, 6, 6], [0.8, 4.8, 2.5], [0.2, 3.8, -3.6], [0.2, 3.8, -3.6], 50, 44);
  });

  // 21 — "My mom does the paychecks at the station."
  shot(W(6, 'My') - 0.05, 'office', (lt, t) => {
    sunOn('office', 0, -4);
    put('mom', 'office', 0.6, -3.4, { y: 3.17, yaw: 20, size: MOM_SMALL, pose: POSES.stamp(lt), face: 'neutral' });
    A.mom.hold('stamp');
    cam('office', [3.5, 6.5, 5], [1, 3.6, -3.8], 48);
  });

  // 22 — "She's the only person who's ever seen his real name,"
  shot(W(6, "She's") - 0.05, 'office', (lt, t) => {
    sunOn('office', 0, -4);
    put('mom', 'office', 0.6, -3.2, { y: 3.17, yaw: 0, size: MOM_SMALL, pose: POSES.shush(lt), face: 'suspicious' });
    camMove('office', seg(lt, 0, 2.2), [2.5, 6.5, -2], [2.3, 5.6, -2.6], [2, 3.7, -4], [2, 3.7, -4], 38, 34);
  });

  // 23 — "and she made me swear never to say it."
  shot(W(6, 'and') - 0.05, 'home', (lt, t) => {
    sunOn('home', 8, -1);
    put('mom', 'home', 8.4, -1.2, { y: 3.17, yaw: 65, size: MOM_SMALL, pose: POSES.shush(lt), face: 'suspicious' });
    put('me', 'home', 12.2, -1.0, { yaw: -65, pose: POSES.nod(lt), face: 'neutral' });
    cam('home', [10.2, 5, 7], [10.2, 3.9, -1], 52);
  });

  // 24 — "Because my mom is also his favorite target."
  shot(W(7, 'Because') - 0.05, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    showScreen('logo', h.studioScreen, (c, w, hh) => drawGotchaLogo(c, w, hh));
    const s = sizeAt(t, FT(2.6), [[W(7, 'target'), FT(2.3)]]);
    put('mom', 'studio', 3, -7.5, { y: 2.5, yaw: -20, size: s, pose: POSES.shy(lt), face: ['sad', 'face-addon-blush'] });
    put('crane', 'studio', -3, -10, { y: 2.5, yaw: 40, size: CRANE_BIG, pose: POSES.pointLaugh(lt), face: 'grin' });
    aimSpot([ORIGIN.studio.x + 8, 18, ORIGIN.studio.z - 2], [ORIGIN.studio.x + 3, 2.5, ORIGIN.studio.z - 7.5], 1.5);
    cam('studio', [1, 7, 10], [0, 5, -8.5], 56);
  });

  // 25 — "Every week he drags her on camera."
  shot(W(7, 'Every') - 0.05, 'studio', (lt, t) => {
    sunOn('studio', 0, -6);
    const x = lerp(-10, 6, seg(lt, 0, 1.5));
    const cp = POSES.walk(lt);
    cp.rArm = [-55, 0, -8];
    put('crane', 'studio', x, -10, { y: 2.5, yaw: 90, size: CRANE_BIG, pose: cp, face: 'grin' });
    const hand = A.crane.handPos('r');
    const ms = FT(2.3);
    put('mom', 'studio', hand.x - ORIGIN.studio.x, hand.z - ORIGIN.studio.z, { y: hand.y - 4.1 * ms, yaw: 0, size: ms, pose: POSES.dangle(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    cam('studio', [0, 7, 12], [0, 4.5, -9], 62);
  });

  // 26 — "Every week she comes home a little smaller."
  shot(W(7, 'Every', 1) - 0.05, 'home', (lt, t, d) => {
    sunOn('home', 14, 2);
    const k = Math.min(2, Math.floor((lt / d) * 3));
    const u = (lt / d) * 3 - k;
    const s = [FT(2.25), FT(2.12), FT(2.0)][k];
    put('mom', 'home', lerp(18, 12, Math.min(1, u * 1.4)), 4, { yaw: -90, size: s, pose: POSES.walk(lt), face: 'sad' });
    cam('home', [10, 3.2, 10], [15, 1.6, 3.5], 52);
  });

  // 27 — "She's two feet tall now."
  shot(W(7, "She's") - 0.05, 'doctor', (lt, t) => {
    sunOn('doctor', 4, -6);
    put('mom', 'doctor', 4.6, -9.4, { yaw: 0, size: MOM_SMALL, pose: POSES.idle(lt), face: 'sad' });
    cam('doctor', [4.8, 3.2, -2.5], [5.2, 2.6, -10], 48);
  });

  // 28 — "She stands on a chair to reach the stove."
  shot(W(7, 'She') - 0.05, 'home', (lt, t) => {
    sunOn('home', -6, -8);
    put('mom', 'home', -6, -8.4, { y: 1.75, yaw: 180, size: MOM_SMALL, pose: POSES.stir(lt), face: 'neutral' });
    A.mom.hold('spoon');
    cam('home', [1.5, 5.6, -1.5], [-6, 3, -9], 50);
  });

  // 29 — "Last week our cat tried to carry her off by the collar."
  shot(W(7, 'Last') - 0.05, 'home', (lt, t) => {
    sunOn('home', 4, -2);
    const x = lerp(-6, 12, seg(lt, 0.2, 2.6));
    theCat.visible = true;
    theCat.position.set(ORIGIN.home.x + x, 0, ORIGIN.home.z + 4.5);
    theCat.rotation.y = Math.PI / 2;
    theCat.scale.setScalar(1.5);
    const bob = Math.abs(Math.sin(lt * 9)) * 0.12;
    put('mom', 'home', x + 3.3, 4.5, { y: 2.1 + bob - 4.1 * MOM_SMALL, yaw: 20, size: MOM_SMALL, pose: POSES.dangle(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    cam('home', [x + 1, 3.6, 13], [x + 2, 1.8, 4.5], 52);
  });

  // 30 — "Then the doctor said one more inch, and she might get too small to find."
  shot(W(8, 'Then') - 0.05, 'doctor', (lt, t) => {
    sunOn('doctor', -2, -5);
    put('mom', 'doctor', -2.5, -6, { y: 3.6, yaw: 20, size: MOM_SMALL, pose: POSES.idle(lt), face: 'sad' });
    put('doctor', 'doctor', 1.8, -3.6, { yaw: -50, pose: POSES.holdOut(lt), face: 'suspicious' });
    A.doctor.hold('clipboard');
    put('me', 'doctor', -5.2, -2.4, { yaw: 30, pose: POSES.shy(lt), face: ['sad', 'face-worry-manga'] });
    cam('doctor', [-1.6, 6.5, 13], [-1.6, 3.5, -4], 56);
  });

  // 31 — "'Just don't let him get to you, Mom,' I begged her. 'Please.' She promised."
  shot(W(9, 'Just') - 0.05, 'home', (lt, t) => {
    sunOn('home', 8, -1);
    const promised = t > W(9, 'She') - 0.1;
    put('mom', 'home', 8, 0.2, { y: 3.17, yaw: 30, size: MOM_SMALL, pose: promised ? POSES.nod(lt) : POSES.idle(lt), face: promised ? 'smirk' : 'sad' });
    put('me', 'home', 8.4, 3.6, { yaw: 210, pose: POSES.plead(lt), face: ['sad', 'face-about-to-cry'] });
    cam('home', [16, 5, 6], [8.2, 3.8, 1.8], 56);
  });

  // 32 — "Until the season finale. Gotcha! Live, in the town square."
  shot(W(10, 'Until') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    showScreen('live', h.squareScreen, (c, w, hh) => drawGotchaLogo(c, w, hh, 'LIVE · SEASON FINALE'));
    crowd(lt, { pose: (i) => (i % 3 ? 'idle' : 'cheer'), face: (i) => (i % 3 ? 'neutral' : 'happy') });
    put('crane', 'square', 0, -11, { y: 3.2, yaw: 0, size: CRANE_BIG, pose: POSES.micTalk(lt), face: 'grin' });
    A.crane.hold('mic');
    camMove('square', seg(lt, 0, 4.5), [0, 30, 50], [0, 14, 30], [0, 6, -6], [0, 8, -8], 55, 60);
  });

  // 33 — "Every family in town was there."
  shot(W(10, 'Every') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 6);
    crowd(lt, { yaw: 180, pose: (i) => (i % 2 ? 'wave' : 'idle'), face: 'happy' });
    put('mom', 'square', 3.5, 4, { yaw: 180, size: MOM_SMALL, pose: POSES.idle(lt), face: 'neutral' });
    put('me', 'square', 5.5, 4.4, { yaw: 180, pose: POSES.idle(lt), face: 'neutral' });
    camMove('square', seg(lt, 0, 1.4), [-6, 8, -4], [6, 8, -4], [0, 2.5, 11], [2, 2.5, 11], 62);
  });

  // 34 — "And Mr. Crane pointed his giant finger right at my mom."
  shot(W(11, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    crowd(lt, { face: 'neutral' });
    put('crane', 'square', 0, -9.5, { y: 3.2, yaw: 15, size: CRANE_BIG, pose: POSES.point(lt), face: 'grin' });
    A.crane.hold('mic');
    put('mom', 'square', 3.5, 4, { yaw: 180, size: MOM_SMALL, pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    put('me', 'square', 5.5, 4.4, { yaw: 180, pose: POSES.idle(lt), face: 'suspicious' });
    aimSpot([ORIGIN.square.x - 6, 20, ORIGIN.square.z - 4], [ORIGIN.square.x + 3.5, 0, ORIGIN.square.z + 4], 1.6);
    cam('square', [-9, 15, -13], [3, 1.5, 4], 50);
  });

  // 35 — "'Look, folks! It's the incredible shrinking accountant!'"
  shot(W(11, 'Look') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    showScreen('shrinking', h.squareScreen, (c, w, hh) => drawShowCaption(c, w, hh, 'THE INCREDIBLE', 'SHRINKING ACCOUNTANT!'));
    put('crane', 'square', 0, -10, { y: 3.2, yaw: 0, size: CRANE_BIG, pose: POSES.pointLaugh(lt), face: 'grin' });
    camMove('square', seg(lt, 0, 3.4), [0, 9, 10], [0, 10, 7], [0, 10, -12], [0, 11, -12], 62, 60);
  });

  // 36 — "Everybody laughed, because they were scared not to."
  shot(W(11, 'Everybody') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 8);
    crowd(lt, { pose: 'laugh', face: ['grin', 'face-addon-sweat-drop'] });
    put('mom', 'square', 3.5, 4, { yaw: 180, size: MOM_SMALL, pose: POSES.shy(lt), face: ['sad', 'face-addon-blush'] });
    put('me', 'square', 5.5, 4.4, { yaw: 180, pose: POSES.idle(lt), face: 'sad' });
    cam('square', [2, 5, -4], [2, 3.2, 10], 64);
  });

  // 37 — "Then he held up her lunchbox, with the little note I'd drawn her inside."
  shot(W(12, 'Then') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    showScreen('note', h.squareScreen, drawNoteOnScreen);
    put('crane', 'square', 0, -10, { y: 3.2, yaw: 0, size: CRANE_BIG, pose: POSES.holdUp(lt), face: 'grin' });
    A.crane.hold('lunchbox');
    camMove('square', seg(lt, 0, 4), [3, 8, 10], [1.5, 10, 5], [0, 10, -10], [0, 13, -12], 60, 60);
  });

  // 38 — "'Aww. Did your baby make you this?'"
  shot(W(12, 'Aww') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    put('crane', 'square', 0, -10, { y: 3.2, yaw: 0, size: CRANE_BIG, pose: POSES.holdUp(lt), face: 'smirk' });
    A.crane.hold('lunchbox');
    cam('square', [0.3, 11, -3.5], [0, 10.8, -10], 48);
  });

  // 39 — "My mom's face turned bright red. I watched her start to sink."
  shot(W(13, 'My') - 0.05, 'square', (lt, t) => {
    sunOn('square', 3, 4);
    const s = momSize(t);
    put('mom', 'square', 3.5, 4, { yaw: 180 - 160, size: s, pose: POSES.shy(lt), face: ['sad', 'face-addon-blush', 'face-addon-tears'] });
    camMove('square', seg(lt, 0, 3.6), [3.4, 1.5, 7.2], [3.4, 1.2, 6.4], [3.5, 1.3, 4], [3.5, 1.1, 4], 46, 42);
  });

  // 40 — "'Mom, don't.' I stepped right in front of her."
  shot(W(14, 'Mom') - 0.05, 'square', (lt, t) => {
    sunOn('square', 3, 4);
    const step = seg(t, W(14, 'stepped') - 0.2, W(14, 'stepped') + 0.5);
    put('mom', 'square', 3.5, 4, { yaw: 180, size: momSize(t), pose: POSES.shy(lt), face: ['sad', 'face-addon-blush'] });
    put('me', 'square', lerp(6, 3.6, sm(step)), lerp(4.4, 1.8, sm(step)), { yaw: 180, pose: step < 1 ? POSES.walk(lt) : POSES.shocked(lt), face: 'angry' });
    cam('square', [5.4, 5.5, -6.5], [4.3, 3, 3], 60);
  });

  // 41 — "I looked all the way up at Mr. Crane."
  shot(W(14, 'I', 1) - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -4);
    put('crane', 'square', 0.5, -7.5, { y: 3.2, yaw: 5, size: CRANE_BIG, pose: POSES.crossArms(lt), face: 'grin' });
    camMove('square', seg(lt, 0, 2), [3.4, 4.6, 1.6], [3.3, 4.4, 1.7], [2.8, 6, -2], [1, 13, -7.5], 60, 66);
  });

  // 42 — "And I grabbed the microphone."
  shot(W(14, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    const grab = seg(t, W(14, 'grabbed'), W(14, 'grabbed') + 0.3);
    put('crane', 'square', 0.5, -7.5, { y: 3.2, yaw: 5, size: CRANE_BIG, pose: grab > 0 ? POSES.shocked(lt) : POSES.micTalk(lt), face: grab > 0 ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'grin' });
    if (grab === 0) A.crane.hold('mic');
    const mp = blend(POSES.idle(lt), POSES.micTalk(lt), grab);
    if (grab === 0) mp.rArm = [-75, 0, -30];
    put('me', 'square', 1.6, -2.6, { yaw: 180, pose: mp, face: 'angry' });
    if (grab > 0) A.me.hold('mic');
    h.squareStand.children.at(-1).visible = grab === 0;
    cam('square', [8, 6, -7.5], [1.6, 5, -3.2], 60);
  });

  // 43 — "'Hey, everybody. Did you know Mr. Crane's first name is Twinkletoes?'"
  shot(W(15, 'Hey') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 2);
    const reveal = W(15, 'Twinkletoes');
    showScreen(t > reveal ? 'tt' : 'live', h.squareScreen, t > reveal ? (c, w, hh) => drawShowCaption(c, w, hh, 'TWINKLETOES?!', '') : (c, w, hh) => drawGotchaLogo(c, w, hh, 'LIVE · SEASON FINALE'));
    put('me', 'square', 1.6, -2.6, { yaw: 10, pose: POSES.micTalk(lt), face: 'smirk' });
    A.me.hold('mic');
    put('crane', 'square', 0.5, -7.5, { y: 3.2, yaw: 5, size: CRANE_BIG, pose: t > reveal ? POSES.shocked(lt) : POSES.crossArms(lt), face: t > reveal ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'grin' });
    camMove('square', seg(lt, 0, 3.6), [3.8, 4.0, 4.8], [3.6, 4.1, 3.8], [1.2, 5.6, -4], [1.2, 5.8, -4], 66, 62);
  });

  // 44 — "The whole square went quiet."
  shot(W(16, 'The') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 4);
    crowd(lt, { pose: 'shocked', face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    put('me', 'square', 1.6, -2.6, { yaw: 10, pose: POSES.micTalk(lt), face: 'smirk' });
    A.me.hold('mic');
    put('mom', 'square', 3.5, 4, { yaw: 180, size: momSize(t), pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    camMove('square', seg(lt, 0, 2), [0, 10, -8], [0, 10.5, -9.5], [0, 2, 9], [0, 2, 9], 62);
  });

  // 45 — "Mr. Crane's ears turned pink. 'Who told you that?'"
  shot(W(16, 'Mr') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    const mad = t > W(16, 'Who') - 0.1;
    put('crane', 'square', 0.5, -7.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: mad ? POSES.yell(lt) : POSES.shocked(lt), face: mad ? ['angry', 'face-addon-anger-mark-big', 'face-addon-blush'] : ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-blush'] });
    cam('square', [0.4, 10.8, 0], [0.5, 10.4, -7.5], 42);
  });

  // 46 — "'It's on every paycheck. Twinkletoes Crane.'"
  shot(W(17, "It's") - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    showScreen('check', h.squareScreen, drawPaycheckOnScreen);
    put('me', 'square', 1.6, -2.6, { yaw: 180, pose: POSES.holdUp(lt), face: 'smirk' });
    A.me.hold('paycheck');
    camMove('square', seg(lt, 0, 2.4), [3, 6.5, 7], [2.6, 7.2, 5], [0.5, 10, -18], [0.5, 11, -18], 60, 58);
  });

  // 47 — "Bloop. He shrank an inch."
  shot(W(18, 'Bloop') - 0.12, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    put('crane', 'square', 0.5, -7.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-blush'] });
    cam('square', [0.4, 8, 6], [0.5, 9, -7.5], 52);
  });

  // 48 — "And I felt it. My sneakers got tight."
  shot(W(18, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    put('me', 'square', 1.6, -2.6, { yaw: 180, size: meSize(t), pose: POSES.idle(lt), face: 'suspicious' });
    A.me.hold('mic');
    cam('square', [4.4, 1.3, -1.4], [1.6, 0.5, -2.6], 50);
  });

  // 49 — "I got taller. It worked."
  shot(W(18, 'I', 1) - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    const worked = t > W(18, 'It') - 0.1;
    put('me', 'square', 1.6, -2.6, { yaw: 180, size: meSize(t), pose: worked ? POSES.cheer(lt) : POSES.shocked(lt), face: worked ? 'happy' : ['face-eyes-shocked', 'face-mouth-small-frown'] });
    if (!worked) A.me.hold('mic');
    cam('square', [1.8, 5.8, -9], [1.6, 4.2, -2.6], 52);
  });

  // 50 — "And that's when I realized it."
  shot(W(19, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    put('me', 'square', 1.6, -2.6, { yaw: 180, size: meSize(t), pose: POSES.idle(lt), face: t > W(19, 'realized') ? 'smirk' : ['face-eyes-shocked', 'face-mouth-small-frown'] });
    A.me.hold('mic');
    camMove('square', seg(lt, 0, 1.4), [1.6, 5.4, -8.6], [1.6, 5.2, -7.4], [1.6, 4.6, -2.6], [1.6, 4.7, -2.6], 46, 40);
  });

  // 51 — "Mr. Crane had embarrassed every single person in this square, which meant every
  //       single person here could embarrass him right back."
  shot(W(19, 'Mr') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 6);
    const back = t > W(19, 'could');
    const faces = (k) => (back ? 'smirk' : k % 2 ? 'sad' : ['neutral', 'face-addon-sweat-drop']);
    crowd(lt, { face: (i) => faces(i), pose: 'idle', skip: [0, 1] });
    put('lunch', 'square', ...SPOT.lunch, { yaw: 180, pose: POSES.idle(lt), face: faces(0) });
    put('mail', 'square', ...SPOT.mail, { yaw: 180, pose: POSES.idle(lt, 1), face: faces(1) });
    put('contestant', 'square', ...SPOT.contestant, { yaw: 180, pose: POSES.idle(lt, 2), face: faces(2) });
    put('diaryGirl', 'square', ...SPOT.diaryGirl, { yaw: 180, pose: POSES.idle(lt, 3), face: faces(3) });
    camMove('square', seg(lt, 0, 7.8), [-10, 6, -2], [11, 6, -2], [-6, 3.2, 9], [7, 3.2, 9], 54);
  });

  // 52 — "I turned to the crowd. 'Twinkletoes!'"
  shot(W(20, 'I') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 0);
    const turn = seg(t, W(20, 'turned'), W(20, 'turned') + 0.6);
    const yell = t > W(20, 'Twinkletoes');
    put('me', 'square', 1.6, -2.6, { yaw: lerp(180, 0, sm(turn)), size: meSize(t), pose: yell ? POSES.micYell(lt) : POSES.idle(lt), face: yell ? 'angry' : 'smirk' });
    A.me.hold('mic');
    put('crane', 'square', 0.5, -8, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-blush'] });
    crowd(lt, { face: 'neutral' });
    cam('square', [4, 5.5, 9], [1.6, 4.6, -3], 58);
  });

  // 53 — "And they got it."
  shot(W(21, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 8);
    crowd(lt, { face: (i) => (i % 2 ? 'smirk' : 'grin'), pose: 'crossArms' });
    cam('square', [0, 4.6, -1.5], [0, 3.5, 10], 60);
  });

  // 54 — "'Twinkletoes!' yelled the lunch lady he pushed into a vat of pudding. Bloop."
  shot(W(22, 'Twinkletoes') - 0.1, 'square', (lt, t) => {
    sunOn('square', 0, 6);
    put('lunch', 'square', ...SPOT.lunch, { yaw: 170, pose: POSES.yell(lt), face: ['angry', 'face-addon-anger-mark-big'] });
    crowd(lt, { skip: [0, 1, 2, 3, 4, 5, 6, 7], face: 'smirk' });
    cam('square', [-4.8, 5, 0.5], [-2.2, 4.4, 7.5], 50);
    if (t > W(22, 'Bloop') - 0.2) {
      put('crane', 'square', 0.5, -8, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-blush'] });
      cam('square', [0.4, 7.5, 6], [0.5, 8.5, -8], 54);
    }
  });

  // 55 — "'Nice name, Twinkletoes!' yelled the mailman he dressed up as a baby on live TV. Bloop, bloop."
  shot(W(23, 'Nice') - 0.1, 'square', (lt, t) => {
    sunOn('square', 0, 6);
    put('mail', 'square', ...SPOT.mail, { yaw: 190, pose: POSES.yell(lt), face: ['angry', 'face-addon-blush'] });
    crowd(lt, { skip: [0, 1, 2, 3, 4, 5, 6, 7], face: 'smirk' });
    cam('square', [1, 5, 1.5], [3.6, 4.4, 8.5], 50);
    if (t > W(23, 'Bloop') - 0.2) {
      put('crane', 'square', 0.5, -8, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.cry(lt), face: ['sad', 'face-addon-blush'] });
      cam('square', [0.4, 7, 6], [0.5, 8, -8], 54);
    }
  });

  // 56 — "'Twinkle! Toes! Twinkle! Toes!' I was the loudest one there. Bloop, bloop, bloop."
  shot(W(24, 'Twinkle') - 0.1, 'square', (lt, t) => {
    sunOn('square', 0, 2);
    crowd(lt, { pose: 'chant', face: 'angry' });
    put('lunch', 'square', ...SPOT.lunch, { yaw: 180, pose: POSES.chant(lt, 4), face: 'angry' });
    put('mail', 'square', ...SPOT.mail, { yaw: 180, pose: POSES.chant(lt, 5), face: 'angry' });
    put('me', 'square', 1.4, 1, { yaw: 180, size: meSize(t), pose: POSES.micYell(lt), face: 'angry' });
    A.me.hold('mic');
    put('crane', 'square', 0.5, -8, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.cry(lt), face: ['sad', 'face-addon-blush'] });
    const late = t > W(24, 'Bloop') - 0.15;
    if (late) cam('square', [0.5, 6.5, 4], [0.5, 6.5, -8], 54);
    else camMove('square', seg(lt, 0, 3.4), [6, 9, 22], [4, 8, 17], [1, 4, 0], [1, 4, -2], 62, 60);
  });

  // 57 — "All around me, people were growing. Grandmas got their inches back. Little kids
  //       popped up like popcorn."
  shot(W(25, 'All') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, 6);
    const g0 = W(25, 'growing') + 0.15;
    const grow = (i, b) => sizeAt(t, b * 0.82, [[g0 + (i % 6) * 0.17, b]]);
    const kidsAt = W(25, 'popped');
    crowd(lt, {
      grow: (i, b) => (EXTRAS[i].kid ? sizeAt(t, 0.45, [[kidsAt + (i % 5) * 0.13, 0.8]], 0.2) : grow(i, b)),
      pose: (i) => (EXTRAS[i].kid && t > kidsAt ? 'cheer' : 'chant'),
      face: 'happy',
      skip: [3],
    });
    const gs = sizeAt(t, 0.72, [[W(25, 'Grandmas') + 0.2, 1.0]]);
    put('grandma', 'square', ...SPOT.grandma, { yaw: 180, size: gs, pose: t > W(25, 'Grandmas') ? POSES.cheer(lt) : POSES.idle(lt), face: 'happy' });
    put('me', 'square', 1.4, 2, { yaw: 160, size: meSize(t), pose: POSES.cheer(lt), face: 'happy' });
    camMove('square', seg(lt, 0, 6), [-4, 9.5, -6], [5, 9.5, -5], [0, 2, 12], [1, 2, 12], 62);
  });

  // 58 — "And Mr. Crane was shrinking. Eight feet. Six. Four."
  shot(W(25, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    showScreen('logo-sad', h.squareScreen, (c, w, hh) => drawGotchaLogo(c, w, hh, '...'));
    put('crane', 'square', 0.5, -8, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    camMove('square', seg(lt, 0, 3.4), [0.5, 7.5, 8], [0.5, 5.2, 4], [0.5, 7, -8], [0.5, 4.6, -8], 52, 50);
  });

  // 59 — "Then my mom climbed onto the stage, took the microphone, and said it herself.
  //       'Goodnight, Twinkletoes.'"
  shot(W(26, 'Then') - 0.05, 'square', (lt, t) => {
    sunOn('square', 4, -4);
    const climbEnd = W(26, 'stage') + 0.4;
    const u = seg(t, W(26, 'mom'), climbEnd);
    const path = [[14, 2.5, 0], [14, -3.5, 3.2], [9, -6.5, 3.2], [4.5, -7.2, 3.2]];
    const leg = Math.min(2, Math.floor(u * 3));
    const lu = u * 3 - leg;
    const a = path[leg];
    const b = path[leg + 1];
    const s = momSize(t);
    const took = t > W(26, 'took');
    put('mom', 'square', lerp(a[0], b[0], lu), lerp(a[1], b[1], lu), { y: lerp(a[2], b[2], lu), yaw: u < 0.34 ? 180 : u < 1 ? -90 : 160, size: s, pose: u < 1 ? (leg === 0 ? POSES.climb(lt) : POSES.walk(lt)) : took ? POSES.micTalk(lt) : POSES.idle(lt), face: t > W(26, 'Goodnight') ? 'smirk' : 'neutral' });
    if (took) A.mom.hold('mic');
    put('crane', 'square', 0.5, -8.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    cam('square', [10, 9, 13], [5, 4, -5], 56);
  });

  // 60 — "Bloop. And again. Bloop, bloop, bloop, bloop."
  shot(W(27, 'Bloop') - 0.12, 'square', (lt, t) => {
    sunOn('square', 3, -7);
    put('mom', 'square', 4.5, -7.6, { y: 3.2, yaw: -65, size: momSize(t), pose: POSES.micTalk(lt), face: 'smirk' });
    A.mom.hold('mic');
    put('crane', 'square', 0.5, -7.8, { y: 3.2, yaw: 65, size: craneSize(t), pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    cam('square', [2.6, 6, 4], [2.6, 4.8, -8], 56);
  });

  // 61 — "She grew until she was looking down at him."
  shot(W(28, 'She') - 0.05, 'square', (lt, t) => {
    sunOn('square', 3, -7);
    const look = POSES.idle(lt);
    look.neck = [28, 0, 0];
    put('mom', 'square', 4, -7.6, { y: 3.2, yaw: 260, size: momSize(t), pose: look, face: 'smirk' });
    put('crane', 'square', 1.6, -8.1, { y: 3.2, yaw: 80, size: craneSize(t), pose: POSES.shocked(lt), face: ['face-eyes-shocked', 'face-mouth-small-frown'] });
    cam('square', [-1.6, 3.6, -10.4], [4, 6.8, -7.6], 60);
  });

  // 62 — "And standing where Mr. Crane used to be was the tiniest man I've ever seen."
  shot(W(28, 'And') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -8);
    put('crane', 'square', 0.5, -8.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.cry(lt), face: ['crying', 'face-addon-blush'] });
    put('mom', 'square', 2.1, -8.9, { y: 3.2, yaw: -100, size: momSize(t), pose: POSES.idle(lt), face: 'smirk' });
    put('me', 'square', -1.2, -8.9, { y: 3.2, yaw: 100, size: meSize(t), pose: POSES.idle(lt, 1), face: 'happy' });
    camMove('square', seg(lt, 0, 3.5), [0.5, 4.8, -2.6], [0.5, 4.4, -3.6], [0.5, 4.0, -8.5], [0.5, 3.9, -8.5], 58, 56);
  });

  // 63 — "Too small for the cameras to find."
  shot(W(28, 'Too') - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    put('crew', 'square', -19, 7.5, { yaw: 140 + 30 * Math.sin(lt * 1.6), pose: POSES.idle(lt), face: 'suspicious' });
    put('crane', 'square', 0.5, -8.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.yell(lt), face: 'angry' });
    cam('square', [-18, 6.5, 9], [-2, 3.5, -8], 44);
  });

  // 64 — "Too small to embarrass anybody, ever again."
  shot(W(28, 'Too', 1) - 0.05, 'square', (lt, t) => {
    sunOn('square', 0, -6);
    put('crane', 'square', 0.5, -8.5, { y: 3.2, yaw: 5, size: craneSize(t), pose: POSES.yell(lt), face: ['angry', 'face-addon-anger-mark-big'] });
    put('mom', 'square', 3, -7.2, { y: 3.2, yaw: 200, size: momSize(t), pose: POSES.crossArms(lt), face: 'smirk' });
    put('me', 'square', -2.5, -6.5, { y: 3.2, yaw: 160, size: meSize(t), pose: POSES.laugh(lt), face: 'happy' });
    cam('square', [0.5, 10, -3.5], [0.5, 3.4, -8.3], 52);
  });

  // 65 — "He scurried off the stage and down a storm drain, squeaking the whole way."
  shot(W(29, 'He') - 0.05, 'square', (lt, t, d) => {
    sunOn('square', -16, 0);
    const u1 = seg(lt, 0.1, 1.3);
    const hop = seg(lt, 1.3, 1.55);
    const u2 = seg(lt, 1.55, d - 0.6);
    const drop = seg(lt, d - 0.6, d - 0.25);
    let x = lerp(-4, -17.2, u1);
    let z = -6.5;
    let y = 3.2;
    if (hop > 0) {
      x = lerp(-17.2, -18.6, hop);
      y = 3.2 * (1 - hop * hop);
    }
    if (u2 > 0) {
      x = lerp(-18.6, -30, u2);
      z = lerp(-6.5, 2, u2);
      y = 0;
    }
    put('crane', 'square', x, z, { y: y - drop * 2, yaw: u2 > 0 ? -125 : -90, size: craneSize(t), pose: POSES.scurry(lt), face: ['crying', 'face-addon-blush'] });
    cam('square', [-38, 3.6, -5], [x, lerp(3.4, 0.4, Math.max(hop, u2 > 0 ? 1 : 0)), z], 40);
  });

  // 66 — "My mom was five foot six again."
  shot(W(30, 'My') - 0.05, 'square', (lt, t) => {
    sunOn('square', 2, 2);
    crowd(lt, { pose: 'cheer', face: 'happy' });
    put('mom', 'square', 2.5, 2, { yaw: 180 + 15, size: FT(5.5), pose: POSES.cheer(lt), face: 'happy' });
    cam('square', [5, 4.6, -5.5], [2.5, 4, 2], 56);
  });

  // 67 — "She tried to pick me up and spin me around, but she couldn't."
  shot(W(30, 'She') - 0.05, 'square', (lt, t) => {
    sunOn('square', 2, 2);
    put('me', 'square', 2.5, 0.6, { yaw: 0, size: meSize(t), pose: POSES.idle(lt), face: 'happy' });
    put('mom', 'square', 2.5, 2.1, { yaw: 180, size: FT(5.5), pose: POSES.strain(lt), face: ['angry', 'face-addon-sweat-drop'] });
    cam('square', [11.5, 5.6, 1.4], [2.5, 4.6, 1.4], 56);
  });

  // 68 — "Probably because I'm seven feet tall now. I'm ten."
  shot(W(30, 'Probably') - 0.05, 'square', (lt, t) => {
    sunOn('square', 2, 4);
    crowd(lt, { pose: 'idle', face: 'happy' });
    put('me', 'square', 2.5, 0.6, { yaw: 180, size: meSize(t), pose: t > W(30, "I'm", 1) ? POSES.wave(lt) : POSES.idle(lt), face: 'happy' });
    put('mom', 'square', 5.2, 0.8, { yaw: 160, size: FT(5.5), pose: POSES.idle(lt), face: 'happy' });
    cam('square', [3.5, 4.5, -9], [3.5, 4.4, 1], 60);
  });

  // 69 — "My bed's too short, none of my clothes fit,"
  shot(W(30, 'My', 1) - 0.05, 'bedroom', (lt, t) => {
    sunOn('bedroom', 0, -6);
    const p = POSES.lieDown();
    p.pitch = -90;
    p.rArm = [-10, 0, -8];
    p.lArm = [-10, 0, 8];
    p.lift = -2.5;
    const s = meSize(t);
    put('me', 'bedroom', 0, -8 + 1.5 * s, { y: 2.2, yaw: 0, size: s, pose: p, face: 'face-sleepy' });
    cam('bedroom', [10, 6.5, -1.5], [0, 2.4, -6], 54);
  });

  // 70 — "and I can't fit on the school bus."
  shot(W(30, 'and', 1) - 0.05, 'town', (lt, t) => {
    sunOn('town', 46, -4);
    const bonk = W(30, 'bus') + 0.2;
    const k = seg(t, bonk, bonk + 0.15);
    const back = seg(t, bonk + 0.15, bonk + 0.6);
    const p = t < bonk ? POSES.walk(lt) : POSES.shocked(lt);
    p.pitch = -25 * Math.sin(Math.PI * Math.min(1, back * 1.4));
    put('me', 'town', h.bus.x, lerp(1.2, -2.6, seg(t, bonk - 1.2, bonk)) + back * 0.8, { yaw: 180, size: meSize(t), pose: p, face: t < bonk ? 'happy' : ['sad', 'face-dizzy-epic'] });
    shake = k > 0 && back < 1 ? 0.15 * (1 - back) : 0;
    cam('town', [h.bus.x + 8, 5.2, 3], [h.bus.x, 4.8, -2.5], 58);
  });

  // 71 — "Worth it."
  shot(W(31, 'Worth') - 0.15, 'square', (lt, t) => {
    sunOn('square', 2, 2);
    crowd(lt, { pose: 'cheer', face: 'happy', skip: [4, 10] });
    put('me', 'square', 2.5, 0.6, { yaw: 180, size: meSize(t), pose: POSES.cheer(lt), face: 'face-big-grin-retro' });
    put('mom', 'square', 5, 0.9, { yaw: 160, size: FT(5.5), pose: POSES.cheer(lt, 1), face: 'happy' });
    camMove('square', seg(lt, 0, 3), [3.5, 5, -8], [3.5, 6, -12], [3.5, 4.4, 1], [3.5, 4.6, 1], 56, 60);
  });

  shots.sort((a, b) => a.start - b.start);
  for (let i = 0; i < shots.length; i++) shots[i].end = shots[i + 1]?.start ?? END;

  const captions = createCaptions(words);
  // For render.mjs --stills shots: the middle of every shot.
  window.sceneShots = shots.map((x) => (x.start + x.end) / 2);

  return function update(t) {
    for (const a of everyone) a.hide();
    theCat.visible = false;
    spot.visible = false;
    shake = 0;
    const s = shots.findLast((x) => x.start <= t) ?? shots[0];
    bonnet.visible = s.set === 'square';
    h.squareStand.children.at(-1).visible = t < W(14, 'grabbed');
    s.fn(t - s.start, t, s.end - s.start);
    if (shake) {
      camera.position.x += shake * Math.sin(t * 97);
      camera.position.y += shake * Math.sin(t * 131 + 1);
    }
    captions(t);
  };
}

// ---- screen pictures ---------------------------------------------------------------------
function drawShowCaption(ctx, w, h, top, bottom) {
  drawGotchaLogo(ctx, w, h);
  ctx.fillStyle = 'rgba(20,6,40,0.78)';
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  P.drawText(ctx, top, w / 2, h * (bottom ? 0.7 : 0.78), w * 0.9, 120, { color: '#ffffff', stroke: '#c4281c', strokeW: 10 });
  if (bottom) P.drawText(ctx, bottom, w / 2, h * 0.87, w * 0.9, 90, { color: '#ffd21f', stroke: '#000', strokeW: 8 });
}

function drawBabyPicture(ctx, w, h) {
  ctx.fillStyle = '#ffe9f3';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w * 0.27, h * 0.06, w * 0.46, h * 0.74);
  ctx.fillStyle = '#9fd3ff';
  ctx.fillRect(w * 0.29, h * 0.09, w * 0.42, h * 0.62);
  // A baby noob: big yellow head, bonnet, pacifier.
  const cx = w / 2;
  const cy = h * 0.42;
  ctx.fillStyle = '#f5cd30';
  ctx.beginPath();
  ctx.roundRect(cx - 120, cy - 110, 240, 220, 70);
  ctx.fill();
  ctx.fillStyle = '#ff98dc';
  ctx.beginPath();
  ctx.arc(cx, cy - 40, 140, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#111';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * 48, cy + 10, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#5ab0ff';
  ctx.beginPath();
  ctx.arc(cx, cy + 70, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy + 70, 12, 0, Math.PI * 2);
  ctx.fill();
  P.drawText(ctx, 'BABY PICS!', w / 2, h * 0.9, w * 0.7, 90, { color: '#c4281c', stroke: '#fff', strokeW: 8 });
}

function drawNoteOnScreen(ctx, w, h) {
  drawGotchaLogo(ctx, w, h);
  ctx.fillStyle = '#fffdf2';
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.04);
  ctx.fillRect(-300, -210, 600, 420);
  ctx.strokeStyle = '#9cc3e6';
  ctx.lineWidth = 3;
  for (let y = -150; y < 210; y += 50) {
    ctx.beginPath();
    ctx.moveTo(-300, y);
    ctx.lineTo(300, y);
    ctx.stroke();
  }
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  const fig = (x, y, s, c) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
    ctx.moveTo(x, y + 26 * s);
    ctx.lineTo(x, y + 110 * s);
    ctx.moveTo(x - 40 * s, y + 60 * s);
    ctx.lineTo(x + 40 * s, y + 60 * s);
    ctx.moveTo(x, y + 110 * s);
    ctx.lineTo(x - 30 * s, y + 165 * s);
    ctx.moveTo(x, y + 110 * s);
    ctx.lineTo(x + 30 * s, y + 165 * s);
    ctx.stroke();
  };
  fig(-150, -120, 1.1, '#1f6fd1');
  fig(130, -90, 0.9, '#2e8b3a');
  P.drawText(ctx, '♥', 0, -100, 200, 140, { color: '#e8384f' });
  P.drawText(ctx, 'I LOVE U MOM', 0, 150, 560, 80, { color: '#e8384f' });
  ctx.restore();
}

function drawPaycheckOnScreen(ctx, w, h) {
  drawGotchaLogo(ctx, w, h);
  ctx.fillStyle = '#e8f3e4';
  ctx.fillRect(w * 0.08, h * 0.22, w * 0.84, h * 0.56);
  ctx.strokeStyle = '#7fae7a';
  ctx.lineWidth = 12;
  ctx.strokeRect(w * 0.08 + 8, h * 0.22 + 8, w * 0.84 - 16, h * 0.56 - 16);
  P.drawText(ctx, 'PAY TO:', w * 0.22, h * 0.4, w * 0.2, 50, { color: '#555' });
  P.drawText(ctx, 'TWINKLETOES CRANE', w * 0.56, h * 0.5, w * 0.6, 90, { color: '#1b2a35' });
}
