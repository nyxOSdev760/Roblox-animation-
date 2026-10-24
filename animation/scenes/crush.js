// "Crush" — a Roblox story Short. Narration and word timings: assets/voice/crush
// (tools/narrate.py, tools/align.py); script: scripts/crush.md.
//
// The camera never hard-cuts inside the classroom: it glides between framings (camera keys
// below). The one jump, bedroom -> classroom ("The next morning"), is a quick dip to black.
import * as THREE from 'three';
import words from '../../assets/voice/crush/words.json' with { type: 'json' };
import { BRICK, SKIN, part, ball, cylinder, robloxMaterial } from '../src/roblox.js';
import { buildSets, ORIGIN } from '../src/sets.js';
import { Actor, POSES, blend } from '../src/actors.js';
import { createCaptions } from '../src/captions.js';
import { createPhone } from '../src/phone.js';
import { ease } from '../src/anim.js';
import * as P from '../src/props.js';

// ---- timing ------------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function W(line, word, n = 0) {
  let c = 0;
  for (const w of words) if (w.line === line && norm(w.word) === norm(word) && c++ === n) return w.start;
  throw new Error(`word "${word}" #${n} not in line ${line}`);
}
const END = words.at(-1).end + 2.2;
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const sm = (u) => ease('Sine', 'InOut', u);

const MORNING = W(3, 'The') - 0.15; // bedroom -> classroom
const VOICE_FROM = W(11, 'I') - 0.08; // the played-back voice message
const VOICE_TO = W(11, 'school') + 0.55;

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: { shirt: 'shirt-thrifted-striped-polo', pants: 'pants-cargo-pants-tan-beige', hair: 'hair-messy-boy-blonde', skin: SKIN.pastelBrown },
  teacher: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-dark-pants', hair: 'hair-brown-fashion-model-side', skin: SKIN.lightOrange },
  principal: { shirt: 'shirt-suit-black', pants: 'pants-suit-black', hair: 'hair-business-comb-over', skin: SKIN.nougat },
  friend: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-gray-sweatpants', hair: 'hair-black-fluffy-middle-swept', skin: SKIN.brown },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-black-short-sleeve-tee', 'shirt-th-denim-jacket-floral', 'shirt-sweter-galaxy-blue-100',
  'shirt-butterfly', 'shirt-blue-stripe-shirt-neck', 'shirt-white-shirt', 'shirt-thrifted-86-warhead-jersey', 'shirt-grey-knitted-sweater-chain', 'shirt-avocado'];
const PANTS = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-pink-trendy-girls-casual', 'pants-jeans-stars', 'pants-khaki-distressed-jorts-f'];
const HAIRS = ['hair-long-brunette', 'hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-blonde-pigtails', 'hair-short-wolf-cut-ginger',
  'hair-black-hime-short-straight', 'hair-dejah-loc', 'hair-brown-side-sweep', 'hair-split-bangs-blonde', 'hair-high-top-fade'];
const TONES = Object.values(SKIN);
const KIDS = Array.from({ length: 8 }, (_, i) => ({
  shirt: SHIRTS[(i * 3) % SHIRTS.length], pants: PANTS[(i * 5) % PANTS.length], hair: HAIRS[i], skin: TONES[(i * 4 + 1) % TONES.length],
}));

const FACES = ['face-addon-blush', 'face-addon-sweat-drop', 'face-addon-anger-mark-big', 'face-addon-tears', 'face-eyes-shocked',
  'face-mouth-small-frown', 'face-crying-epic', 'face-about-to-cry', 'face-worry-manga', 'face-terrified'];

export const meta = {
  duration: Math.ceil(END * 30) / 30,
  fps: 30,
  width: 1080,
  height: 1920,
  faces: ['neutral', 'happy', 'grin', 'smirk', 'suspicious', 'sad', 'crying', 'angry'],
  accessories: [...new Set([...Object.values(CAST), ...KIDS].map((c) => c.hair).concat(FACES))],
  clothing: [...new Set([...Object.values(CAST), ...KIDS].flatMap((c) => [c.shirt, c.pants]))],
  audio: [],
};

// ---- sound -------------------------------------------------------------------------------
const sfx = (file, at, volume = 0.8, extra = {}) => meta.audio.push({ file, at, volume, ...extra });
const NARR = '../voice/crush/narration.flac';
// Narration, with the played-back voice message sounding like a phone speaker.
sfx(NARR, 0, 1.0, { dur: VOICE_FROM });
sfx(NARR, VOICE_FROM, 1.05, { from: VOICE_FROM, dur: VOICE_TO - VOICE_FROM, filter: 'highpass=f=450,lowpass=f=3400,acrusher=bits=10:mix=0.25,volume=1.3' });
sfx(NARR, VOICE_TO, 1.0, { from: VOICE_TO });
sfx('synth/music_loop.wav', 0, 0.12, { loop: true, dur: END, fade: 2 });
sfx('synth/pop.wav', 1.3, 0.8); // text sent
sfx('synth/pluck_E4.wav', W(1, 'See') - 0.05, 0.7); // reply arrives
sfx('gaspp.mp3', W(2, 'panicking') - 0.1, 0.7);
sfx('synth/pop.wav', W(2, 'deleting'), 0.5);
sfx('synth/thud.wav', W(2, 'Too') - 0.05, 0.5);
sfx('synth/whoosh_long.wav', MORNING - 0.2, 0.45);
sfx('hmm-rblx-se.mp3', W(3, 'looked') + 0.1, 0.45);
sfx('hahaha-rblx-se.mp3', W(5, 'laughing') - 0.25, 0.7);
sfx('hahaha-rblx-se.mp3', W(5, 'laughing'), 0.55, { pitch: 3 });
sfx('hahaha-rblx-se.mp3', W(5, 'laughing') + 0.2, 0.5, { pitch: -2 });
sfx('hahaha-rblx-se.mp3', W(9, 'exploded') - 0.2, 0.8);
sfx('hahaha-rblx-se.mp3', W(9, 'exploded'), 0.6, { pitch: 4 });
sfx('hahaha-rblx-se.mp3', W(9, 'exploded') + 0.25, 0.6, { pitch: -3 });
sfx('yeaa-rblx-se.mp3', W(9, 'exploded') + 0.1, 0.4);
sfx('woahh-rblx-se.mp3', VOICE_TO - 0.15, 0.65);
sfx('woahh-rblx-se.mp3', VOICE_TO - 0.05, 0.5, { pitch: 3 });
sfx('roblox/action_footsteps_plastic.wav', W(12, 'ran'), 0.6, { dur: 1.2, fade: 0.3 });
sfx('huh-rblx-se.mp3', W(12, 'Wait') + 0.35, 0.4);
sfx('gaspp.mp3', W(14, 'boyfriend') + 0.45, 0.8);
sfx('gaspp.mp3', W(14, 'boyfriend') + 0.55, 0.5, { pitch: 3 });
sfx('synth/thud.wav', W(16, 'walked') - 0.1, 0.6); // door
sfx('roblox/action_footsteps_plastic.wav', W(16, 'walked'), 0.5, { dur: 1.4, fade: 0.3 });
sfx('angry-roblox.mp3', W(18, 'So') - 0.3, 0.45);
sfx('synth/thud.wav', W(20, 'Detention'), 0.8);
sfx('sadd-rblx-se.mp3', W(20, 'Forever') + 0.5, 0.7);

// ---- the classroom -----------------------------------------------------------------------
const C = new THREE.Vector3(3000, 0, 0);
const DOOR = [17.4, 8.5]; // door in the right wall (x = 18), near the back
const DESKS = [];
for (const z of [-3, 2, 7]) for (const x of [-10, -4, 1.5, 7]) DESKS.push([x, z]);
const MY_DESK = [-4, 2];
const FRIEND_DESK = [1.5, 2];
// The two desks in front of the kid and the friend stay empty: close-ups are shot from there.
const taken = [MY_DESK, FRIEND_DESK, [MY_DESK[0], -3], [FRIEND_DESK[0], -3]];
const KID_DESKS = DESKS.filter((d) => !taken.some((e) => e[0] === d[0] && e[1] === d[1]));
const SEAT_DZ = 1.05; // a seated student's root is this far behind the desk
const TEACHER = [0, -11.2];
const STOP = [13.6, 8.5]; // where the kid stops on his way out
const PRINCIPAL = [15.9, 6.6];

function buildClassroom(scene, a) {
  const at = (o, x, y, z, r = 0) => {
    o.position.set(C.x + x, y, C.z + z);
    o.rotation.y = r;
    scene.add(o);
    return o;
  };
  at(part(a, [36, 1, 30], [0, 0, 0], BRICK.lightStoneGrey, 'WoodPlanks', { shadows: false }), 0, -0.5, 0);
  at(part(a, [36, 13, 1], [0, 0, 0], BRICK.brickYellow, 'Plastic'), 0, 6.5, -15);
  at(part(a, [1, 13, 30], [0, 0, 0], BRICK.brickYellow, 'Plastic'), -18, 6.5, 0);
  // Right wall with a doorway at DOOR.
  at(part(a, [1, 13, 19.5], [0, 0, 0], BRICK.brickYellow, 'Plastic'), 18, 6.5, -5.25);
  at(part(a, [1, 13, 4.5], [0, 0, 0], BRICK.brickYellow, 'Plastic'), 18, 6.5, 12.75);
  at(part(a, [1, 5.5, 3.5], [0, 0, 0], BRICK.brickYellow, 'Plastic'), 18, 10.25, 8.25);
  at(part(a, [0.4, 7.4, 4], [0, 0, 0], BRICK.white, 'Plastic'), 17.6, 3.7, 8.5 - 0); // frame (behind the opening)
  const door = at(P.door(a, BRICK.reddishBrown), 18.6, 0, 6.6, Math.PI / 2);
  door.rotation.y = -0.2;
  // Whiteboard and the lesson.
  const board = P.canvasTexture(1024, 400, (ctx, w, h) => {
    ctx.fillStyle = '#fbfbfb';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f6fd1';
    ctx.font = '64px "Fredoka One"';
    ctx.fillText('Fractions!', 50, 100);
    ctx.fillStyle = '#333';
    ctx.font = '52px "Fredoka One"';
    ctx.fillText('1/2 + 1/4 = 3/4', 70, 200);
    ctx.fillText('HW: page 42', 70, 300);
    ctx.strokeStyle = '#c4281c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(820, 200, 90, 0, Math.PI * 2);
    ctx.stroke();
  });
  at(P.panel(a, 18, 7, board, { back: BRICK.mediumStoneGrey, depth: 0.3 }), 0, 6.5, -14.4);
  at(P.sign(a, 10, 1.4, "MS. PARKER'S CLASS", { bg: '#ffd21f', fg: '#1b2a35', size: 140 }), 0, 11.2, -14.4);
  // Windows on the left wall.
  for (const z of [-7, 1, 9]) {
    const w = new THREE.Group();
    w.add(part(a, [0.3, 5, 6], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'));
    w.add(part(a, [0.34, 4.4, 5.4], [0, 0, 0], BRICK.pastelBlue, 'Glass', { shadows: false }));
    at(w, -17.4, 6.5, z);
  }
  // Teacher's desk with an apple, a clock, posters.
  at(P.table(a, 6, 3, 3.2, BRICK.reddishBrown, 'Wood'), 9, 0, -10);
  at(ball(a, 0.35, [0, 0, 0], BRICK.brightRed, 'Plastic'), 8, 3.7, -10);
  at(cylinder(a, 1, 0.2, [0, 0, 0], BRICK.institutionalWhite, 'Plastic'), 13, 10, -14.4).rotation.x = Math.PI / 2;
  at(P.sign(a, 4, 5, 'READ!\n📚', { bg: '#80bbdc', fg: '#ffffff', size: 120, stroke: '#1b2a35' }), -12, 7, -14.4);
  // Student desks and chairs (students face the board, -z).
  for (const [x, z] of DESKS) {
    at(P.table(a, 3.4, 2.2, 2.8, BRICK.brickYellow, 'WoodPlanks'), x, 0, z - 0.4);
    at(P.chair(a, BRICK.brightBlue, 'Plastic'), x, 0, z + SEAT_DZ + 0.15, Math.PI);
  }
}

function teddyBear(a) {
  const g = new THREE.Group();
  const fur = 0xa0662f;
  const add = (o) => (g.add(o), o);
  add(ball(a, 1.35, [0, 1.3, 0], fur, 'Fabric')).scale.set(1, 1.15, 0.85);
  add(ball(a, 1.0, [0, 3.0, 0], fur, 'Fabric'));
  for (const s of [-1, 1]) {
    add(ball(a, 0.4, [s * 0.75, 3.75, 0], fur, 'Fabric'));
    add(ball(a, 0.5, [s * 1.25, 1.7, 0.2], fur, 'Fabric'));
    add(ball(a, 0.55, [s * 0.7, 0.2, 0.35], fur, 'Fabric'));
    add(ball(a, 0.12, [s * 0.32, 3.15, 0.92], BRICK.reallyBlack, 'Plastic'));
  }
  add(ball(a, 0.45, [0, 2.8, 0.75], 0xd9a066, 'Fabric'));
  add(ball(a, 0.14, [0, 2.95, 1.15], BRICK.reallyBlack, 'Plastic'));
  const heart = P.sign(a, 1.3, 1.1, '❤', { bg: '#ff4d6d', fg: '#ffffff', size: 150 });
  heart.position.set(0, 1.4, 1.1);
  heart.scale.z = 0.3;
  g.add(heart);
  return g;
}

function phoneProp(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.5, 0.95, 0.08], [0, 0, 0], BRICK.reallyBlack, 'Plastic'));
  g.add(part(a, [0.44, 0.86, 0.02], [0, 0, 0.045], BRICK.pastelBlue, 'Neon', { shadows: false }));
  return g;
}

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, position, look-at, fov, move seconds]. The camera holds a framing (with a
// slow drift) and glides to the next over `move` seconds, arriving at its time.
function classroomKeys() {
  return [
    [MORNING, [-15, 9, 17], [2, 3.5, 2], 58, 0],
    [W(3, 'She') + 0.2, [-12, 8, 13], [0, 4.5, -8], 54, 1.0],
    [W(3, 'directly') + 0.15, [-3.6, 4.9, 0.4], [0, 4.6, -11.2], 38, 0.7],
    [W(5, 'The') + 0.35, [0, 7.5, -10], [-1, 2.6, 4], 62, 0.6],
    [W(5, 'wanted') + 0.25, [-4.6, 4.6, -1.6], [-4, 3.1, 3], 44, 0.6],
    [W(6, 'said') + 0.1, [2.8, 5.4, -4.6], [0, 4.6, -11.2], 48, 0.6],
    [W(7, 'slowly') + 0.2, [-7, 5.4, -0.6], [-4, 4.4, 3.2], 50, 0.6],
    [W(7, 'smiled') + 0.15, [-1.8, 5, -4.4], [0, 4.6, -11.2], 44, 0.6],
    [W(8, 'froze') + 0.05, [-4.4, 4.8, -2.4], [-4, 4.6, 3], 40, 0.5],
    [W(8, 'best') + 0.1, [3.6, 5.6, -3], [1.2, 5.0, 3], 46, 0.6],
    [W(9, 'entire') + 0.2, [0, 9, -10.5], [0, 2.6, 4.5], 66, 0.6],
    [W(9, 'screamed') + 0.05, [-4.4, 4.8, -2.4], [-4, 4.6, 3], 42, 0.5],
    [W(10, 'teacher') + 0.15, [2.4, 5.2, -5], [0, 4.6, -11.2], 46, 0.7],
    [VOICE_TO + 0.05, [0, 8, -9.5], [0, 3, 4], 62, 0.5],
    [W(12, 'Wait'), [4, 8, -4], [STOP[0], 4, STOP[1]], 50, 1.8],
    [W(13, 'She') + 0.1, [0.3, 5.1, -5.8], [0, 4.6, -11.2], 42, 0.6],
    [W(14, 'slowly') + 0.15, [9.6, 4.8, 3.6], [STOP[0], 4.3, STOP[1]], 46, 0.6],
    [W(14, 'looked') + 0.1, [0, 6.4, -3.4], [0, 4.6, -11.2], 50, 0.6],
    [W(14, 'boyfriend') + 0.05, [0, 5.4, -6.4], [0, 4.6, -11.2], 40, 0.9],
    [W(15, 'Everyone') + 0.1, [0, 8, -9.5], [0, 3, 4], 62, 0.5],
    [W(15, 'pointed') + 0.2, [7, 5.2, 1], [17.8, 4.2, 8.5], 50, 0.7],
    [W(16, 'Holding') + 0.1, [7.2, 5.6, 1.4], [15, 4.8, 7.4], 56, 0.9],
    [W(17, 'looked') + 0.1, [7, 7, 0.5], [PRINCIPAL[0] - 0.5, 4.8, PRINCIPAL[1]], 48, 0.6],
    [W(17, 'Still') + 0.05, [11, 4.5, 5.8], [STOP[0], 4.3, STOP[1]], 40, 0.6],
    [W(18, 'So') + 0.05, [10.5, 4.4, 2.5], [PRINCIPAL[0], 4.0, PRINCIPAL[1]], 42, 0.6],
    [W(19, 'I') + 0.1, [11.2, 4.5, 6.1], [STOP[0], 4.3, STOP[1]], 40, 0.5],
    [W(20, 'He') + 0.1, [10.4, 5.2, 3.6], [14.7, 4.4, 7.5], 46, 0.7],
    [W(20, 'Detention') + 0.4, [9.6, 5.2, 2.6], [STOP[0], 4.0, STOP[1]], 44, 1.2],
  ];
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, assets, faces, sun }) {
  buildSets(scene, assets);
  buildClassroom(scene, assets);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -30;
  sc.right = sc.top = 30;
  sc.updateProjectionMatrix();
  const sunOn = (o, x = 0, z = 0) => {
    sun.target.position.set(o.x + x, 0, o.z + z);
    sun.position.set(o.x + x + 30, 60, o.z + z + 40);
  };

  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const kids = KIDS.map(mk);
  const everyone = [...Object.values(A), ...kids];
  for (const a of everyone) scene.add(a.root);
  A.me.attach('phone', phoneProp(assets), 'r', [0, -0.15, 0.35], [-0.6, 0, 0]);
  A.teacher.attach('phone', phoneProp(assets), 'r', [0, -0.15, 0.35], [-1.4, Math.PI, 0]);
  const bear = teddyBear(assets);
  bear.scale.setScalar(0.85);
  scene.add(bear);

  const phone = createPhone({ contact: 'Ms. Parker 📚', initials: 'MP' });
  const captions = createCaptions(words, { yAt: (t) => (phoneShown(t) ? 0.13 : 0.6) });
  const black = document.createElement('div');
  Object.assign(black.style, { position: 'fixed', inset: '0', background: '#000', pointerEvents: 'none', opacity: '0' });
  document.body.appendChild(black);

  const put = (who, x, z, o = {}) => who.set({ at: [C.x + x, C.z + z], ...o });
  const keys = classroomKeys();

  function classroomCamera(t) {
    let i = 0;
    while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    const cur = keys[i];
    const next = keys[i + 1];
    let pos = cur[1];
    let look = cur[2];
    let fov = cur[3];
    if (next && t > next[0] - next[4]) {
      const u = sm(seg(t, next[0] - next[4], next[0]));
      pos = pos.map((v, k) => lerp(v, next[1][k], u));
      look = look.map((v, k) => lerp(v, next[2][k], u));
      fov = lerp(fov, next[3], u);
    }
    // Gentle drift so held framings never feel frozen.
    const held = t - cur[0];
    const drift = 0.06 * held;
    camera.position.set(C.x + pos[0] + Math.sin(held * 0.5) * 0.08, pos[1] + drift * 0.15, C.z + pos[2]);
    camera.lookAt(C.x + look[0], look[1], C.z + look[2]);
    camera.fov = fov - Math.min(3, drift * 3);
    camera.updateProjectionMatrix();
  }

  const seated = (t, s) => {
    const p = POSES.sit();
    p.lift = 1.75 - 2;
    const b = POSES.idle(t, s);
    p.neck = b.neck;
    p.rArm = [-55, 0, 6];
    p.lArm = [-55, 0, -6];
    return p;
  };
  const seatedLaugh = (t, s) => {
    const p = POSES.laugh(t, s);
    p.rLeg = [-90, 0, 0];
    p.lLeg = [-90, 0, 0];
    p.lift = 1.75 - 2 + p.lift;
    p.pitch = -6 - 4 * Math.abs(Math.sin(t * 13 + s));
    return p;
  };
  const seatedShocked = (t, s) => {
    const p = POSES.shocked(t, s);
    p.rLeg = [-90, 0, 0];
    p.lLeg = [-90, 0, 0];
    p.lift = 1.75 - 2;
    return p;
  };

  function classmates(t) {
    const laughing = (t > W(5, 'laughing') - 0.3 && t < W(6, 'Then')) || (t > W(9, 'exploded') - 0.3 && t < W(10, 'My'));
    const shocked = (t > VOICE_TO - 0.2 && t < W(12, 'I')) || (t > W(14, 'boyfriend') + 0.4 && t < W(16, 'And') + 0.6);
    const lookDoor = t > W(15, 'pointed') && t < END;
    kids.forEach((k, i) => {
      const [x, z] = KID_DESKS[i];
      const pose = laughing ? seatedLaugh(t, i) : shocked ? seatedShocked(t, i) : seated(t, i);
      if (lookDoor) pose.neck = [pose.neck[0], -55 + (x - 7) * 2, 0];
      const face = laughing ? (i % 3 === 0 ? ['grin', 'face-addon-sweat-drop'] : i % 2 ? 'happy' : 'grin')
        : shocked ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'neutral';
      put(k, x, z + SEAT_DZ, { yaw: 180, pose, face });
    });
  }

  function teacher(t) {
    let pose = POSES.idle(t);
    let face = 'neutral';
    let yaw = 0;
    let at = TEACHER;
    const turn = seg(t, W(3, 'Then'), W(3, 'directly'));
    if (t < W(3, 'Then')) {
      yaw = 180;
      pose = POSES.idle(t);
      pose.rArm = [-150 + 8 * Math.sin(t * 6), 0, 10]; // writing on the board
      at = [-2.5, -12.4];
    } else if (t < W(4, 'Someone')) {
      yaw = lerp(180, -18, sm(turn));
      at = [lerp(-2.5, TEACHER[0], sm(turn)), lerp(-12.4, TEACHER[1], sm(turn))];
      face = 'suspicious';
    } else if (t < W(6, 'Then')) {
      yaw = -18;
      pose = POSES.talk(t);
      face = 'smirk';
    } else if (t < W(7, 'I')) {
      yaw = -18;
      pose = POSES.point(t);
      pose.rArm = [-95, -20, 0];
      face = 'smirk';
    } else if (t < W(10, 'My')) {
      yaw = -18;
      pose = t < W(8, 'I') ? POSES.talk(t) : POSES.crossArms(t);
      face = t > W(9, 'exploded') ? 'happy' : 'smirk';
    } else if (t < VOICE_TO + 0.4) {
      yaw = -10;
      pose = POSES.holdUp(t);
      pose.rArm = [-150, 0, -6];
      A.teacher.hold('phone');
      face = 'smirk';
    } else if (t < W(13, 'She')) {
      // "Wait" — a hand up toward the kid at the door.
      yaw = 35;
      pose = t > W(12, 'But') ? POSES.point(t) : POSES.idle(t);
      if (t > W(12, 'But')) pose.rArm = [-100, 0, 30];
      face = 'suspicious';
    } else if (t < W(14, 'She')) {
      yaw = 35;
      pose = POSES.talk(t);
      face = 'happy';
    } else if (t < W(15, 'Then')) {
      yaw = 0;
      pose = POSES.talk(t);
      face = t > W(14, 'boyfriend') ? 'happy' : 'smirk';
    } else {
      yaw = 25;
      pose = t > W(15, 'pointed') && t < W(17, 'He') ? POSES.point(t) : POSES.idle(t);
      if (t > W(15, 'pointed')) pose.rArm = [-95, 0, 0];
      face = t > W(18, 'So') ? 'grin' : 'happy';
    }
    if (t >= W(15, 'pointed')) yaw = 60;
    put(A.teacher, at[0], at[1], { yaw, pose, face });
  }

  function me(t) {
    // Walk in, sit, get called up, stand, run for the door, turn back, get caught.
    const sitAt = MORNING + 2.0;
    const desk = [MY_DESK[0], MY_DESK[1] + SEAT_DZ];
    if (t < sitAt) {
      const u = seg(t, MORNING + 0.1, sitAt - 0.15);
      const path = [[DOOR[0] - 0.5, DOOR[1]], [6, 11], [desk[0] + 0.8, desk[1] + 1.6], desk];
      const k = Math.min(2, Math.floor(u * 3));
      const lu = u * 3 - k;
      const a = path[k];
      const b = path[k + 1];
      const yaw = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
      put(A.me, lerp(a[0], b[0], lu), lerp(a[1], b[1], lu), { yaw: u < 1 ? yaw : 180, pose: POSES.walk(t), face: 'neutral' });
      return;
    }
    const standAt = W(7, 'stood') - 0.1;
    const runAt = W(12, 'ran') - 0.05;
    if (t < standAt) {
      const blush = t > W(5, 'class') ? ['sad', 'face-addon-blush'] : t > W(3, 'directly') ? ['face-eyes-shocked', 'face-mouth-small-frown'] : 'neutral';
      const p = seated(t, 9);
      if (t > W(5, 'wanted')) {
        p.neck = [20, 0, 0];
        p.rArm = [-80, 0, 30];
        p.lArm = [-80, 0, -30];
      }
      put(A.me, desk[0], desk[1], { yaw: 180, pose: p, face: blush });
      return;
    }
    if (t < runAt) {
      const u = sm(seg(t, standAt, standAt + 0.7));
      const p = blend(seated(t, 9), POSES.idle(t), u);
      let face = ['sad', 'face-addon-blush'];
      if (t > W(8, 'froze')) {
        p.rArm = [-25, 0, -40];
        p.lArm = [-25, 0, 40];
        face = ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-blush'];
      }
      if (t > W(9, 'screamed')) {
        Object.assign(p, POSES.yell(t));
        face = ['angry', 'face-addon-anger-mark-big', 'face-addon-blush'];
      }
      if (t > W(10, 'My')) {
        Object.assign(p, POSES.idle(t));
        face = ['sad', 'face-addon-sweat-drop'];
      }
      if (t > VOICE_FROM + 0.4) {
        Object.assign(p, POSES.shy(t));
        face = ['face-about-to-cry', 'face-addon-blush'];
      }
      put(A.me, desk[0], lerp(desk[1], desk[1] + 0.6, u), { yaw: 180, pose: p, face });
      return;
    }
    const arrive = W(12, 'Wait') - 0.1;
    if (t < arrive) {
      const u = seg(t, runAt, arrive);
      const x = lerp(desk[0], STOP[0], sm(u));
      const z = lerp(desk[1] + 0.6, STOP[1], sm(u));
      put(A.me, x, z, { yaw: 70, pose: POSES.run(t), face: ['face-terrified', 'face-addon-sweat-drop'] });
      return;
    }
    const turnU = sm(seg(t, W(14, 'slowly'), W(14, 'around') + 0.3));
    const back = 214; // facing the teacher
    let pose = POSES.idle(t);
    let face = ['face-eyes-shocked', 'face-mouth-small-frown', 'face-addon-sweat-drop'];
    if (t > W(14, 'boyfriend')) face = ['face-eyes-shocked', 'face-mouth-small-frown'];
    if (t > W(16, 'And')) {
      face = ['sad', 'face-addon-blush', 'face-addon-sweat-drop'];
      pose = POSES.shy(t);
    }
    if (t > W(18, 'So')) face = ['face-terrified', 'face-addon-blush', 'face-addon-sweat-drop'];
    if (t > W(20, 'Detention')) {
      face = ['face-crying-epic'];
      pose = POSES.cry(t);
    }
    const yaw = lerp(80, back, turnU);
    put(A.me, STOP[0], STOP[1], { yaw, pose, face });
  }

  function friend(t) {
    const desk = [FRIEND_DESK[0], FRIEND_DESK[1] + SEAT_DZ];
    const up = seg(t, W(8, 'shouted') - 0.1, W(8, 'HE'));
    const laugh = t > W(9, 'exploded') - 0.3 && t < W(10, 'My');
    const shout = POSES.yell(t);
  shout.pitch = 0;
  shout.rArm = [-165, 0, 12]; // arm straight up, face clear
  let p = up > 0 && t < W(10, 'My') ? blend(seated(t, 3), shout, sm(up)) : seated(t, 3);
    if (laugh) p = POSES.pointLaugh(t);
    if (t > W(10, 'My')) {
      p = up > 0 && t < W(12, 'I') ? POSES.idle(t) : seated(t, 3);
      if (t > VOICE_TO) p = seatedShocked(t, 3);
      if (t > W(15, 'pointed')) p.neck = [0, -50, 0];
    }
    const standing = up > 0 && t < W(12, 'I');
    let face = 'neutral';
    if (t > W(5, 'laughing') - 0.3 && t < W(6, 'Then')) face = 'happy';
    if (up > 0) face = 'grin';
    if (laugh) face = 'happy';
    if (t > VOICE_TO) face = ['face-eyes-shocked', 'face-mouth-small-frown'];
    if (!standing && t > W(5, 'laughing') - 0.3 && t < W(6, 'Then')) p = seatedLaugh(t, 3);
    put(A.friend, desk[0], desk[1] + (standing ? 0.6 : 0), { yaw: standing ? 200 : 180, pose: p, face });
  }

  function principal(t) {
    const enter = W(16, 'walked') - 0.15;
    if (t < enter) return;
    const u = seg(t, enter, enter + 1.4);
    const x = lerp(21.5, PRINCIPAL[0], sm(u));
    const z = lerp(8.5, PRINCIPAL[1], sm(u));
    let pose = POSES.walk(t, 0, u < 1 ? 30 : 0);
    if (u >= 1) pose = POSES.idle(t);
    pose.rArm = [-75, 0, -18];
    pose.lArm = [-75, 0, 18];
    let yaw = u < 1 ? -70 : lerp(-90, -150, sm(seg(t, W(17, 'He'), W(17, 'her'))));
    if (t > W(17, 'Then')) yaw = lerp(-150, -45, sm(seg(t, W(17, 'Then'), W(17, 'me'))));
    let face = 'happy';
    if (t > W(17, 'Then')) face = 'suspicious';
    if (t > W(18, 'So') - 0.2) face = ['angry', 'face-addon-anger-mark-big'];
    const bearOn = t < W(18, 'So') - 0.3;
    if (!bearOn) {
      pose = POSES.yell(t);
      pose.rArm = [-100, 0, 0];
    }
    if (t > W(20, 'leaned')) {
      pose = POSES.idle(t);
      pose.pitch = 28 * sm(seg(t, W(20, 'leaned'), W(20, 'down') + 0.2));
      pose.neck = [10, 0, 0];
      face = t > W(20, 'Detention') ? ['smirk', 'face-addon-anger-mark-big'] : 'smirk';
    }
    put(A.principal, x, z, { yaw, pose, face });
    if (bearOn) {
      const hp = A.principal.handPos('r');
      const lp = A.principal.handPos('l');
      bear.visible = true;
      bear.position.set((hp.x + lp.x) / 2, (hp.y + lp.y) / 2 - 1.6, (hp.z + lp.z) / 2);
      bear.rotation.y = ((yaw - 0) * Math.PI) / 180;
    } else {
      bear.visible = true;
      bear.position.set(C.x + PRINCIPAL[0] + 1.6, 0, C.z + PRINCIPAL[1] - 1.2); // dropped on the floor
      bear.rotation.set(0.15, -0.6, 0);
    }
  }

  // ---- bedroom (texting) --------------------------------------------------------------
  const B = ORIGIN.bedroom;
  function bedroom(t) {
    sunOn(B, 0, -4);
    const panic = W(2, 'I') - 0.1;
    if (t < panic) {
      const p = POSES.sit();
      p.lift = 0.25;
      p.rArm = [-70, 0, 18];
      p.lArm = [-70, 0, -18];
      p.neck = [22, 0, 0];
      const face = t > W(1, 'See') ? ['face-eyes-shocked', 'face-mouth-small-frown'] : t > W(0, 'somehow') ? 'suspicious' : 'happy';
      A.me.set({ at: [B.x, B.z - 7.4], yaw: 0, pose: p, face });
      A.me.hold('phone');
      const u = sm(seg(t, 0, panic));
      camera.position.set(B.x + lerp(4.2, 3.2, u), lerp(6.2, 5.6, u), B.z + lerp(0.2, -1.8, u));
      camera.lookAt(B.x, 3.1, B.z - 7.2);
      camera.fov = 52;
    } else {
      // Pacing by the bed, phone in hand.
      const x = 3 + 2.4 * Math.sin((t - panic) * 1.6);
      const dir = Math.cos((t - panic) * 1.6) > 0 ? 90 : -90;
      const p = POSES.walk(t, 0, 30, 1.6);
      p.rArm = [-70, 0, 18];
      A.me.set({ at: [B.x + x, B.z - 3], yaw: dir, pose: p, face: ['face-terrified', 'face-addon-sweat-drop'] });
      A.me.hold('phone');
      camera.position.set(B.x + 3, 6, B.z + 9);
      camera.lookAt(B.x + 3, 3.4, B.z - 3);
      camera.fov = 54;
    }
    camera.updateProjectionMatrix();
  }

  // ---- phone screens ------------------------------------------------------------------
  const TEXT = 'ngl i think i have a crush on u 😳';
  function phoneShown(t) {
    return (t > 0.5 && t < W(2, 'I') - 0.1) || (t > W(2, 'tried') - 0.25 && t < MORNING - 0.25) || (t > W(10, 'played') - 0.2 && t < VOICE_TO + 0.05);
  }
  function phoneState(t) {
    if (!phoneShown(t)) return { show: false };
    if (t < MORNING) {
      const msgs = [{ from: 'out', text: TEXT }];
      if (t < 1.3) return { show: true, messages: [], typing: false };
      const read = t > W(0, 'somehow');
      const reply = t > W(1, 'See') - 0.05;
      if (reply) msgs.push({ from: 'in', text: 'See me after class.' });
      const status = reply ? '' : read ? '<b>Read</b> 9:41 PM' : 'Delivered';
      const typing = read && !reply;
      if (t < W(2, 'tried') - 0.25) return { show: true, messages: msgs, status, typing };
      // Trying to unsend.
      const menu = t < W(2, 'Too') ? { at: 0, hot: t > W(2, 'deleting') + 0.2 ? 'Undo Send' : '' } : null;
      const toast = t > W(2, 'Too') ? "Can't unsend: she already read it 💀" : '';
      return { show: true, messages: [msgs[0], msgs[1]], menu, toast };
    }
    // The voice message she plays for the class.
    const playing = t > VOICE_FROM - 0.05;
    return { show: true, messages: [{ from: 'out', text: TEXT }, { from: 'in', text: 'See me after class.' }],
      voice: { progress: seg(t, VOICE_FROM, VOICE_TO - 0.4), playing, seconds: 3 } };
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    bear.visible = false;
    black.style.opacity = String(Math.max(0, 1 - Math.abs(t - MORNING) / 0.22));
    if (t < MORNING) {
      bedroom(t);
    } else {
      sunOn(C, 2, 0);
      classmates(t);
      teacher(t);
      me(t);
      friend(t);
      principal(t);
      classroomCamera(t);
    }
    phone.update(t, phoneState(t));
    captions(t);
  };
}
