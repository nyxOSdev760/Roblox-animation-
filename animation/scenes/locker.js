// "Locker" — a Roblox story Short. Narration and word timings: assets/voice/locker
// (tools/narrate.py, tools/align.py); script: scripts/locker.md.
//
// I dodge the mile in gym class and hide in a hallway locker... which is my crush Chloe's. She
// leans on the door and tells her friend Mia she likes me. Places: the gym, and a school
// hallway lined with lockers (buildLockerHall) whose hero locker is shown from outside and as a
// cutaway from inside. R6 characters, 2D faces only.
import * as THREE from 'three';
import words from '../../assets/voice/locker/words.json' with { type: 'json' };
import { SKIN, part, cylinder, ball } from '../src/roblox.js';
import { buildGym, buildLockerHall } from '../src/rooms.js';
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
const popIn = (t, at, dur = 0.3) => (t < at ? 0 : ease('Back', 'Out', seg(t, at, at + dur)));
const rad = (deg) => (deg * Math.PI) / 180;
const yawToward = (from, to) => (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;

// Places.
const G = new THREE.Vector3(6000, 0, 0); // the gym
const H = new THREE.Vector3(6000, 0, 400); // the hallway

// Beats.
const T_GYM = W(1, 'It') - 0.08;
const COACH = W(1, 'Coach');
const MILE = W(1, 'mile');
const GROAN = W(1, 'Everyone');
const NOGROAN = W(1, 'I');
const BACK1 = W(1, 'I', 1);
const BACK2 = W(1, 'and');
const RAN = W(1, 'I', 2);
const OTHERWAY = W(1, 'other');
const T_HALL = W(2, 'I') - 0.08;
const HIDE = W(2, 'hide');
const EMPTY = W(2, 'empty');
const END_LOCKER = W(2, 'locker');
const DOOR_OPEN = W(2, 'hanging');
const JUMP = W(2, 'jumped');
const SHUT = W(2, 'pulled');
const TINY = W(3, 'It');
const SMELL = W(3, 'smelled');
const BANANA = W(3, 'banana');
const KNEES = W(3, 'knees');
const PERFECT = W(3, 'perfect');
const NOBODY = W(3, 'Nobody');
const FOOT = W(4, 'footsteps');
const WAIT = W(5, 'Wait');
const UNLOCKED = W(5, 'unlocked');
const ICE = W(6, 'blood');
const KNEWVOICE = W(6, 'knew');
const CHLOE = W(6, 'Chloe');
const CRUSH = W(6, 'girl', 0);
const SENTENCE = W(6, 'never');
const STOPB = W(7, 'I');
const NOTOPEN = W(8, 'But');
const LEANED = W(8, 'leaned');
const IN_FRONT = W(8, 'right');
const ZIPPER = W(8, 'zipper');
const MIA = W(8, 'And');
const D_MIA1 = W(9, 'So');
const D_CHLOE1 = W(10, 'Who');
const D_MIA2 = W(11, 'The');
const D_LAUGH = W(12, 'Chloe');
const D_MIA3 = W(13, 'Is');
const D_GLUE = W(14, 'Brandon');
const D_MIA4 = W(15, 'Okay');
const D_FLAT = W(16, 'Tyler');
const LOVING = W(17, 'I');
const WENTQUIET = W(18, 'Then');
const HAIRQ = W(18, "It's");
const TOUCH = W(19, 'I');
const STRAIGHT = W(19, 'It');
const HITHEAD = W(20, 'Then');
const THUNK = W(20, 'THUNK');
const D_HEAR = W(21, 'Did');
const D_BUILDING = W(22, "It's");
const HAUNTED = W(22, 'haunted');
const EYES = W(23, 'I');
const WHISTLE = W(24, 'Then');
const COACHQ = W(24, 'Has');
const D_NOCOACH = W(25, 'No');
const D_WHISPER = W(26, "He's");
const HONESTLY = W(27, 'Honestly');
const ASKOUT = W(27, 'wish');
const WAITING = W(27, 'waiting');
const SEAT = W(27, 'moved');
const BACKFLIP = W(28, 'My');
const LIKEDME = W(28, 'She');
const SITTING = W(28, 'And');
const SMILED = W(29, 'I');
const SNEEZED = W(29, 'sneezed');
const SILENCE = W(30, 'Dead');
const SWUNG = W(30, 'door');
const CH_LOOK = W(31, 'Chloe');
const MIA_LOOK = W(31, 'Mia');
const HI = W(32, 'hi');
const SCREAM = W(33, 'Mia');
const DISAPPEAR = W(34, 'I');
const SHADOW = W(34, 'shadow');
const COACH_IS = W(34, 'It');
const THERE = W(35, 'THERE');
const TENLAPS = W(35, 'Ten');
const CLOSED = W(36, 'I');
const WORST = W(36, 'This');
const STEPPED = W(37, 'But');
const RUNWITH = W(37, 'Coach');
const WHY = W(38, 'Coach');
const BECAUSE = W(39, 'Because');
const HELPER = W(39, "He's");
const WALKAWAY = W(40, 'Coach');
const TURNBACK = W(40, 'Then');
const YES = W(40, 'So');
const NODDED = W(41, 'I');
const GRINNED = W(42, 'She');
const GOOD = W(42, 'Good');
const HAND = W(42, 'And');
const SHOES = W(42, 'Now');
const CUTS = [T_GYM, T_HALL];
const FAHS = [D_GLUE + 0.62, HAUNTED + 0.7, W(28, 'banana') + 0.5, W(33, 'TIME') + 0.7, W(42, 'shoes') + 0.2];

// ---- stages ------------------------------------------------------------------------------
/**
 * A stage: a ground spot `c` seen by a camera looking along yaw `a` (degrees, 0 = +z).
 * p(u, v): a point u studs to screen-right and v studs away from the camera; yaw(cheat) faces
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

const HEROX = 14.3; // the hero locker's centre, local to the hall
const DOORZ = -3.2; // the lockers' door plane
const HEROZ = -4.7;
const S_HALL = stage([HEROX, -2.0], 180); // looking at the hero locker, u to screen-right (+x)
const S_SIDE = stage([HEROX, -2.0], 90); // from the left along the lockers (screen-right is +z)
const S_RIGHT = stage([8, 0.5], 90); // looking toward the doors at the right end
const S_LEFT = stage([-6, 0.5], 270); // looking toward the doors at the left end
const S_RUN = stage([-12, 0.5], 270);
const S_G = stage([0, 14], 0); // the gym: camera looks +z toward the double doors

const LOCK_AT = S_HALL.p(0.6, -0.4); // Chloe beside the lock, her right hand out to it
const SIDE_AT = S_HALL.p(2.7, -0.8); // right of the locker, clear of the open door
const FRONT_AT = S_HALL.p(-1.0, -0.2); // in front of the locker, facing the Coach
const OTS_AT = S_HALL.p(1.35, -0.2); // the last shot: her back to us, hand out to me
const MIA_AT = S_HALL.p(-2.5, -0.4);
const MIA_SIDE = S_HALL.p(-2.5, -0.8);
const COACH_AT = S_HALL.p(-5.4, -0.4);
const ME_IN = [HEROX, HEROZ - 0.85]; // me crouched in the locker (root)

// ---- cast --------------------------------------------------------------------------------
const CAST = {
  me: MAIN,
  chloe: { shirt: 'shirt-cutesy-pink-striped-sweater', pants: 'pants-jeans-stars', hair: 'hair-long-brunette', skin: SKIN.lightOrange },
  mia: { shirt: 'shirt-cottage-core-fairy-vintage', pants: 'pants-dark-pants', hair: 'hair-black-flowy-pigtails', skin: SKIN.nougat },
  coach: { shirt: 'shirt-tech-fleece-red-hoodie', pants: 'pants-gray-sweatpants', hair: 'hair-faded-edgar-cut', skin: SKIN.tan },
};
const SHIRTS = ['shirt-vintage-flannel-button-up', 'shirt-sweter-galaxy-blue-100', 'shirt-blue-stripe-shirt-neck', 'shirt-grey-knitted-sweater-chain',
  'shirt-thrifted-striped-polo', 'shirt-mu-red-flannel-black', 'shirt-black-flannel-soft-trendy-2', 'shirt-vintage-flannel-button-up-2'];
const PANTS_LIST = ['pants-jeans-hip-hop-retro', 'pants-ripped-black-jeans-mu', 'pants-white-cargo-jeans-dh', 'pants-dark-pants', 'pants-cargo-pants-grey-black',
  'pants-gray-sweatpants', 'pants-cargo-pants-tan-beige', 'pants-kestrel-khaki-textured-pants'];
const HAIRS = ['hair-messy-popular-boy', 'hair-curly-afro-black', 'hair-brown-side-sweep', 'hair-360-waves-fade', 'hair-lazy-bun', 'hair-black-middle-part', 'hair-short-wavy-black', 'hair-brown-messy'];
const TONES = Object.values(SKIN);
const CROWD = HAIRS.map((hair, i) => ({ shirt: SHIRTS[(i * 3) % SHIRTS.length], pants: PANTS_LIST[(i * 5) % PANTS_LIST.length], hair, skin: TONES[(i * 3 + 1) % TONES.length] }));

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
sfx('../voice/locker/narration.flac', 0, 1.0);
sfx('temporex-numbers-loop.mp3', 0, 0.22, { dur: END, fade: 1.0 });
const FAH = (at) => sfx('fahhh.mp3', at, 2.2);
for (const c of CUTS) sfx('synth/whoosh_long.wav', c - 0.2, 0.3);
sfx('synth/ambience.wav', 0, 0.16, { loop: true, dur: END, fade: 1.0 });
// Gym.
sfx('synth/whistle.wav', COACH - 0.05, 0.55);
sfx('sadd-rblx-se.mp3', GROAN + 0.05, 0.45);
sfx('sadd-rblx-se.mp3', GROAN + 0.3, 0.35, { pitch: -3 });
sfx('roblox/action_footsteps_plastic.wav', BACK1, 0.22, { dur: 2.4, fade: 0.3 });
sfx('roblox/action_footsteps_plastic.wav', RAN, 0.55, { dur: 1.6, fade: 0.2 });
sfx('synth/whoosh.wav', RAN, 0.5);
// Running into the hall and hiding.
sfx('synth/thud.wav', T_HALL + 0.2, 0.55);
sfx('roblox/action_footsteps_plastic.wav', T_HALL + 0.1, 0.55, { dur: 1.3, fade: 0.2 });
sfx('roblox/action_footsteps_plastic.wav', EMPTY + 0.9, 0.35, { dur: 1.2, fade: 0.2 });
sfx('synth/squeak.wav', DOOR_OPEN + 0.1, 0.35, { pitch: -4 });
sfx('roblox/action_footsteps_plastic.wav', DOOR_OPEN + 0.9, 0.55, { dur: 1.4, fade: 0.1 });
sfx('roblox/action_jump.wav', JUMP + 0.05, 0.7);
sfx('roblox/action_jump_land.wav', JUMP + 0.5, 0.6);
sfx('synth/clang.wav', SHUT + 0.5, 0.8);
sfx('bleh-rblx-se.mp3', SMELL + 0.35, 0.4);
// Chloe arrives.
sfx('synth/thud.wav', FOOT + 0.15, 0.3);
sfx('roblox/action_footsteps_plastic.wav', FOOT + 0.25, 0.5, { dur: 1.9, fade: 0.2 });
sfx('synth/pop.wav', UNLOCKED + 0.05, 0.4);
sfx('gaspp.mp3', ICE + 0.1, 0.35);
sfx('hi-rblx-se.mp3', CHLOE + 0.1, 0.25);
sfx('roblox/action_footsteps_plastic.wav', MIA + 0.15, 0.4, { dur: 1.3, fade: 0.2 });
sfx('synth/zip.wav', ZIPPER + 0.05, 0.5);
sfx('hahaha-rblx-se.mp3', D_LAUGH + 0.25, 0.3, { pitch: 3 });
FAH(FAHS[0]);
// Trouble in the locker.
sfx('synth/thud.wav', THUNK - 0.02, 0.9);
sfx('synth/punch.wav', THUNK, 0.5);
sfx('synth/clang.wav', THUNK + 0.03, 0.45);
FAH(FAHS[1]);
sfx('synth/whistle.wav', WHISTLE + 0.65, 0.5);
sfx('synth/thud.wav', WHISTLE + 0.05, 0.4);
sfx('synth/sneeze.wav', SNEEZED - 0.05, 0.85);
sfx('synth/clang.wav', SNEEZED + 0.48, 0.55);
FAH(FAHS[2]);
sfx('synth/squeak.wav', SWUNG + 0.2, 0.45, { pitch: -6 });
sfx('synth/squeak.wav', SWUNG + 0.65, 0.4, { pitch: -9 });
sfx('gaspp.mp3', MIA_LOOK - 0.1, 0.35);
sfx('ahh-rblx-scared.mp3', SCREAM + 0.1, 0.75);
FAH(FAHS[3]);
sfx('roblox/action_footsteps_plastic.wav', SHADOW - 1.1, 0.5, { dur: 2.0, fade: 0.2 });
sfx('angry-roblox.mp3', COACH_IS + 0.3, 0.25);
sfx('roblox/action_footsteps_plastic.wav', WALKAWAY + 0.2, 0.4, { dur: 1.8, fade: 0.3 });
sfx('hahaha-rblx-se.mp3', GRINNED + 0.9, 0.3, { pitch: 3 });
FAH(FAHS[4]);

// ---- camera keys -------------------------------------------------------------------------
// [arrival time, place, [position, look-at, fov], move seconds, interior cutaway?]; move 0 is a cut.
const K = (t, o, shot, move = 0, cut = false) => ({ t, o, pos: shot[0], look: shot[1], fov: shot[2], move, cut });
const KEYS = [
  K(0, H, S_HALL.cam(6.4, 3.6, 2.4, 44, { lookV: 2.8 }), 0, true),

  // Gym: the class lines up, Coach Reyes announces the mile, and I back away.
  K(T_GYM, G, S_G.cam(16, 7.5, 3.2, 58, { u: 4.5 })),
  K(COACH - 0.1, G, S_G.cam(7.5, 4.8, 3.7, 44, { u: -2.6, lookV: -2.5 })),
  K(GROAN - 0.1, G, S_G.cam(11.0, 4.8, 3.2, 56, { u: 4.2, lookV: -3 })),
  K(NOGROAN - 0.05, G, S_G.cam(6.5, 4.8, 3.6, 44, { u: 9.4, lookU: 9.9, lookV: -3.4 })),
  K(BACK1 - 0.05, G, S_G.cam(12.5, 5.5, 3.4, 54, { u: 7.4, lookV: -1 })),
  K(RAN - 0.1, G, S_G.cam(15, 11.5, 2.4, 58, { u: 6.6, lookV: 5.5 })), // from up high, over the class's heads

  // Hall: I burst in, check it's empty, spot the open locker and dive in.
  K(T_HALL, H, S_RUN.cam(9.0, 5.2, 3.6, 52, { lookV: 1 })),
  K(HIDE + 0.55, H, stage([-6, 0.5], 270).cam(14, 6.0, 3.8, 56)),
  K(EMPTY - 0.05, H, stage([0, 0.5], 270).cam(21, 7.0, 3.6, 58, { lookV: -12 })),
  K(END_LOCKER - 0.15, H, S_HALL.cam(8.0, 5.4, 3.8, 50, { u: -0.6 })),
  K(DOOR_OPEN + 0.9, H, S_HALL.cam(8.8, 5.4, 3.5, 62, { u: -1.6 })),
  K(JUMP + 0.45, H, S_HALL.cam(6.5, 4.4, 3.4, 44)),

  // Inside the locker.
  K(TINY - 0.15, H, S_HALL.cam(5.4, 3.7, 2.6, 42, { lookV: 2.8 }), 0, true),
  K(SMELL - 0.1, H, S_HALL.cam(3.4, 4.5, 4.0, 40, { lookV: 3.0 }), 0, true),
  K(KNEES - 0.1, H, S_HALL.cam(4.4, 3.0, 2.2, 42, { lookV: 2.8 }), 0, true),
  K(PERFECT - 0.1, H, S_HALL.cam(5.4, 3.5, 2.6, 40, { lookV: 2.8 }), 0, true),
  K(NOBODY - 0.05, H, S_HALL.cam(8.8, 6.0, 3.6, 62, { u: 0.4 })),

  // Chloe walks in.
  K(FOOT - 0.05, H, S_RIGHT.cam(11, 5.4, 3.8, 52)),
  K(WAIT - 0.05, H, S_HALL.cam(7.4, 4.9, 3.8, 46, { u: 0.55 })),
  K(ICE - 0.05, H, S_HALL.cam(5.0, 3.4, 2.5, 40, { lookV: 2.8 }), 0, true),
  K(KNEWVOICE - 0.05, H, S_HALL.cam(3.6, 3.5, 3.0, 36, { lookV: 2.8 }), 0, true),
  K(CHLOE - 0.05, H, S_HALL.cam(6.8, 4.8, 4.0, 44, { u: 0.3 })),
  K(CRUSH - 0.05, H, S_HALL.cam(5.0, 3.6, 2.6, 40, { lookV: 2.8 }), 0, true),
  K(SENTENCE - 0.1, H, S_HALL.cam(3.8, 3.4, 2.8, 36, { lookV: 2.8 }), 0, true),
  K(STOPB - 0.05, H, S_HALL.cam(5.4, 3.6, 2.6, 42, { lookV: 2.8 }), 0, true),
  K(NOTOPEN - 0.05, H, S_HALL.cam(6.6, 4.9, 3.8, 44, { u: 0.0 })),
  K(LEANED + 0.1, H, S_SIDE.cam(6.5, 4.4, 3.6, 42, { u: 0.8, lookU: 0.2 })),
  K(ZIPPER - 0.1, H, S_SIDE.cam(4.4, 3.6, 3.3, 36, { u: -0.9, lookU: -0.3 })),
  K(MIA - 0.05, H, S_HALL.cam(8.6, 4.9, 3.5, 50, { u: -1.2 })),

  // The two of them talk; I listen.
  K(D_MIA1 - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(D_CHLOE1 - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: 0.4 })),
  K(D_MIA2 - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(D_LAUGH - 0.05, H, S_HALL.cam(8.6, 4.9, 3.5, 50, { u: -1.0 })),
  K(D_MIA3 - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(D_GLUE - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: 0.4 })),
  K(D_MIA4 - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(D_FLAT - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: 0.4 })),
  K(LOVING - 0.05, H, S_HALL.cam(5.2, 3.5, 2.6, 40, { lookV: 2.8 }), 0, true),
  K(WENTQUIET - 0.05, H, S_HALL.cam(8.6, 4.9, 3.5, 50, { u: -1.0 })),
  K(HAIRQ - 0.55, H, S_HALL.cam(4.8, 4.4, 3.9, 36, { u: 0.4 })),
  K(TOUCH - 0.05, H, S_HALL.cam(5.6, 3.7, 2.8, 42, { lookV: 2.8 }), 0, true),
  K(HITHEAD + 0.5, H, S_HALL.cam(5.2, 3.9, 3.1, 42, { lookV: 2.8 }), 0, true),
  K(THUNK + 0.55, H, S_HALL.cam(8.6, 4.9, 3.5, 50, { u: -1.0 })),
  K(D_BUILDING - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(EYES - 0.05, H, S_HALL.cam(4.6, 3.5, 2.9, 38, { lookV: 2.8 }), 0, true),
  K(WHISTLE - 0.05, H, S_LEFT.cam(10, 5.6, 4.2, 54, { lookV: 6 })),
  K(D_NOCOACH - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: 0.4 })),
  K(D_WHISPER - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),

  // "I wish he'd just ask me out."
  K(HONESTLY - 0.05, H, S_HALL.cam(5.2, 4.4, 4.0, 38, { u: 0.4 })),
  K(ASKOUT - 0.05, H, S_HALL.cam(3.8, 4.5, 4.1, 34, { u: 0.3 })),
  K(WAITING - 0.05, H, S_HALL.cam(5.4, 4.3, 3.9, 40, { u: -2.5 })),
  K(SEAT - 0.05, H, S_HALL.cam(4.4, 4.5, 4.1, 36, { u: 0.4 })),
  K(BACKFLIP - 0.05, H, S_HALL.cam(5.2, 3.6, 2.7, 42, { lookV: 2.8 }), 0, true),
  K(LIKEDME - 0.05, H, S_HALL.cam(3.8, 3.5, 2.8, 36, { lookV: 2.8 }), 0, true),
  K(SITTING - 0.05, H, S_HALL.cam(6.4, 3.8, 3.2, 46, { lookV: 2.8 }), 0, true),
  K(SMILED - 0.05, H, S_HALL.cam(4.2, 3.5, 2.9, 36, { lookV: 2.8 }), 0, true),
  K(SNEEZED + 0.5, H, S_HALL.cam(8.6, 4.9, 3.5, 50, { u: -0.6 })),
  K(SILENCE - 0.05, H, S_HALL.cam(8.8, 5.6, 3.6, 62, { u: 0.0 })),

  // The door opens.
  K(CH_LOOK - 0.1, H, [[HEROX, 2.5, HEROZ + 0.6], [HEROX + 2.7, 4.8, -1.0], 54]),
  K(MIA_LOOK - 0.05, H, [[HEROX, 2.5, HEROZ + 0.6], [HEROX - 2.5, 4.8, -0.9], 54]),
  K(HI - 0.1, H, S_HALL.cam(8.8, 5.2, 3.4, 64, { u: 0.1 })),
  K(SCREAM - 0.05, H, S_HALL.cam(5.4, 4.5, 4.1, 40, { u: -2.7 })),
  K(DISAPPEAR - 0.05, H, S_HALL.cam(5.4, 3.6, 2.6, 42, { lookV: 2.8 }), 0, true),
  K(SHADOW - 0.05, H, S_HALL.cam(8.8, 5.0, 3.5, 60, { u: -0.8 })),
  K(COACH_IS + 0.05, H, S_HALL.cam(6.0, 4.9, 4.0, 42, { u: -5.2 })),
  K(CLOSED - 0.05, H, S_HALL.cam(5.4, 3.6, 2.6, 40, { lookV: 2.8 }), 0, true),
  K(STEPPED - 0.05, H, S_HALL.cam(9.2, 4.8, 3.6, 52, { u: -0.6 })),
  K(RUNWITH - 0.05, H, S_HALL.cam(5.0, 4.5, 4.0, 38, { u: -1.0 })),
  K(WHY - 0.05, H, S_HALL.cam(6.0, 4.9, 4.0, 42, { u: -5.2 })),
  K(BECAUSE - 0.05, H, S_HALL.cam(5.0, 4.5, 4.0, 38, { u: -1.0 })),
  K(WALKAWAY - 0.05, H, S_HALL.cam(8.8, 5.2, 3.6, 60, { u: -2.8 })),
  K(TURNBACK + 0.15, H, S_HALL.cam(8.8, 5.0, 3.6, 58, { u: -0.8 })),
  K(YES - 0.05, H, S_HALL.cam(5.2, 4.4, 4.0, 38, { u: -1.0 })),
  K(NODDED - 0.05, H, S_HALL.cam(5.2, 3.5, 2.7, 40, { lookV: 2.8 }), 0, true),
  K(GRINNED - 0.05, H, S_HALL.cam(5.2, 4.4, 4.0, 38, { u: -1.0 })),
  K(HAND - 0.05, H, S_HALL.cam(7.8, 4.8, 3.3, 60, { u: 0.5 })),
  K(SHOES - 0.1, H, S_HALL.cam(6.8, 4.6, 3.3, 54, { u: 0.5 })),
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

function clipboard(a) {
  const g = new THREE.Group();
  g.add(part(a, [0.8, 1.0, 0.06], [0, 0, 0], 0x8a5a3a, 'Wood', { shadows: false }));
  g.add(part(a, [0.7, 0.85, 0.07], [0, -0.04, 0], 0xffffff, 'SmoothPlastic', { shadows: false }));
  return g;
}

/** A backpack worn on the back (its straps and a zipper with a pull that swings). */
function pack(a) {
  const g = new THREE.Group();
  box(g, a, [1.5, 1.9, 0.8], [0, 0.1, -0.95], 0xff6fae, 'Fabric');
  box(g, a, [1.1, 0.8, 0.3], [0, -0.45, -1.5], 0xff8fc0, 'Fabric');
  box(g, a, [1.52, 0.1, 0.82], [0, 0.55, -0.95], 0x333333, 'Plastic', false);
  for (const s of [-1, 1]) box(g, a, [0.2, 1.8, 0.14], [s * 0.45, 0.3, -0.5], 0x333333, 'Fabric', false);
  const pull = new THREE.Group();
  pull.position.set(0.5, 0.5, -1.4);
  pull.add(part(a, [0.12, 0.45, 0.06], [0, -0.22, 0], 0xc0c4c8, 'Metal', { shadows: false }));
  g.add(pull);
  g.userData.pull = pull;
  return g;
}

function whistleSet(a) {
  const g = new THREE.Group();
  box(g, a, [0.08, 1.2, 0.04], [0, 0.55, 0.52], 0x1b2a35, 'Fabric', false);
  box(g, a, [0.4, 0.25, 0.3], [0, -0.05, 0.62], 0xc0c4c8, 'Metal', false);
  return g;
}

function sprite(draw, w = 128, h = 128) {
  const tex = P.canvasTexture(w, h, draw);
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
}
const heartSprite = () =>
  sprite((ctx, w, h) => {
    ctx.fillStyle = '#ff3d7f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.86);
    ctx.bezierCurveTo(w * 0.02, h * 0.5, w * 0.18, h * 0.08, w / 2, h * 0.3);
    ctx.bezierCurveTo(w * 0.82, h * 0.08, w * 0.98, h * 0.5, w / 2, h * 0.86);
    ctx.fill();
    ctx.stroke();
  });
function wavySprite(color, outline) {
  const s = sprite((ctx, w, h) => {
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = h - 8; y > 8; y -= 2) {
      const x = w / 2 + Math.sin(y / 14) * w * 0.26;
      if (y === h - 8) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = outline;
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.stroke();
  }, 64, 128);
  s.scale.set(0.5, 1.0, 1);
  return s;
}
function textSprite(text, color, w = 512) {
  const s = sprite((ctx, cw, ch) => P.drawText(ctx, text, cw / 2, ch * 0.55, cw - 12, ch * 0.7, { color, stroke: '#1b2a35', strokeW: 12 }), w, 160);
  return s;
}

// ---- setup -------------------------------------------------------------------------------
export function setup({ scene, camera, renderer, assets, faces, sun }) {
  buildGym(scene, assets, G);
  const hall = buildLockerHall(scene, assets, H);
  if (Math.abs(hall.heroX - HEROX) > 1e-6 || Math.abs(hall.doorZ - DOORZ) > 1e-6) throw new Error('hero locker moved');
  const hero = hall.hero;
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -42;
  sc.right = sc.top = 42;
  sc.updateProjectionMatrix();
  function light(mood, o, from) {
    lightingMood(scene, sun, mood);
    sun.target.position.set(o.x, 0, o.z);
    sun.position.set(o.x + from[0], from[1], o.z + from[2]);
  }
  const hx = H.x + HEROX;
  const heroPos = (x, z) => [H.x + x, H.z + z];

  // ---- cast ----
  const mk = (c) =>
    new Actor({ assets, faces, face: 'neutral', shirt: c.shirt, pants: c.pants, accessories: [c.hair],
      colors: { head: c.skin, torso: c.skin, rArm: c.skin, lArm: c.skin, rLeg: c.skin, lLeg: c.skin } });
  const A = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [k, mk(c)]));
  const crowd = CROWD.map(mk);
  const everyone = [...Object.values(A), ...crowd];
  for (const a of everyone) scene.add(a.root);
  A.coach.attach('clip', clipboard(assets), 'l', [0, 0.1, 0.3], [-Math.PI / 2 + 0.3, 0, 0]);
  A.coach.root.add(whistleSet(assets));
  const chloePack = pack(assets);
  A.chloe.root.add(chloePack);

  // Effects: hearts, smell wisps, comic text.
  const hearts = Array.from({ length: 7 }, () => {
    const s = heartSprite();
    s.scale.set(0.8, 0.8, 1);
    scene.add(s);
    return s;
  });
  const smell = [0, 1, 2].map(() => {
    const s = wavySprite('#ff9ac8', '#9c2a66');
    scene.add(s);
    return s;
  });
  const achoo = textSprite('ACHOO!', '#ffffff');
  achoo.scale.set(4.4, 1.4, 1);
  scene.add(achoo);
  const thunkText = textSprite('THUNK!', '#ffe14d');
  thunkText.scale.set(3.6, 1.15, 1);
  scene.add(thunkText);

  const captions = createCaptions(words, { y: 0.67 });
  const overlay = (css) => {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', inset: '0', pointerEvents: 'none', ...css });
    document.body.appendChild(d);
    return d;
  };
  const black = overlay({ background: '#000', opacity: '0' });
  const vignette = overlay({ background: 'radial-gradient(ellipse at 50% 44%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.6) 100%)', opacity: '0' });
  const shade = overlay({ background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.4) 100%)', opacity: '0' });
  // The captions were created first; lift them above the overlays.
  captions.el?.style && (captions.el.style.zIndex = '10');

  const at = (o, who, xz, opts = {}) => {
    const { hold = [], ...rest } = opts;
    who.set({ at: [o.x + xz[0], o.z + xz[1]], ...rest });
    for (const h of hold) who.hold(h);
  };
  const faceOf = (i, opts) => opts[i % opts.length];

  // Impacts shake the camera.
  const IMPACTS = [[THUNK, 0.1], [SNEEZED + 0.45, 0.12], [JUMP + 0.5, 0.05]];
  function shake(t) {
    let s = 0;
    for (const [at0, amp] of IMPACTS) if (t >= at0 && t < at0 + 0.45) s += amp * (1 - (t - at0) / 0.45);
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
    const sk = shake(t);
    camera.position.set(cur.o.x + pos[0] + Math.sin(held * 0.5) * 0.06 + sk * Math.sin(t * 71), pos[1] + 0.008 * held + sk * Math.sin(t * 53), cur.o.z + pos[2]);
    camera.lookAt(cur.o.x + look[0], look[1], cur.o.z + look[2]);
    camera.fov = fov - Math.min(3, held * 0.18);
    camera.updateProjectionMatrix();
    return cur.cut;
  }

  // ---- poses ----
  const groan = (t, s) => {
    const p = POSES.idle(t, s);
    p.neck = [-24, 8 * Math.sin(t * 2 + s), 6 * Math.sin(t * 1.4 + s)];
    p.pitch = -5;
    p.rArm = [4, 0, -6];
    p.lArm = [4, 0, 6];
    return p;
  };
  const curl = (t, s = 0, lift = -1.5) => {
    const p = POSES.sit();
    p.lift = lift;
    p.rArm = [-75, 0, 12];
    p.lArm = [-75, 0, -12];
    p.neck = [8 + 2 * Math.sin(t * 2 + s), 0, 0];
    return p;
  };
  // Talking with one hand out to the side (an arm held forward would cover the face from the front).
  const talkSide = (t, s) => {
    const p = POSES.talk(t, s);
    p.rArm = [-18 + 8 * Math.sin(t * 5 + s), 0, -34];
    return p;
  };
  const withArms = (p, r, l) => ((p.rArm = r), (p.lArm = l), p);
  const lookDir = (p, pitch, yaw) => ((p.neck = [pitch, yaw, 0]), p);

  // ---- the gym ----
  // The class, in two staggered rows (u to screen-right, v away from the camera).
  const ROW = [[0.4, -3.6], [2.8, -3.6], [5.2, -3.6], [7.6, -3.6], [1.6, -1.9], [4.0, -1.9], [6.4, -1.9]].map(([u, v], k) => ({ u, v, k }));
  function gym(t) {
    // Coach Reyes with his clipboard, class lined up in front of him.
    const announce = talkSide(t, 3);
    announce.lArm = [-70, 0, -8];
    announce.rArm = [-30 + 14 * Math.sin(t * 6), 0, 62]; // an arm out to the side, clear of his face
    at(G, A.coach, S_G.p(-2.6, -2.5), { yaw: S_G.yaw(55), pose: t > COACH + 0.1 ? announce : POSES.idle(t, 3), face: t > MILE + 0.4 ? 'smirk' : 'happy', hold: ['clip'] });
    ROW.forEach(({ u, v, k }) => {
      const groaning = t > GROAN;
      at(G, crowd[k], S_G.p(u, v), { yaw: S_G.yaw(-35 + (k % 2) * 8), pose: groaning ? groan(t, k) : POSES.idle(t, k), face: groaning ? faceOf(k, ['sad', 'angry', 'sad']) : faceOf(k, ['neutral', 'happy', 'neutral']) });
    });
    // Me: at the end of the line, easing backward, then gone.
    let v = -3.4;
    let u = 10.0;
    let pose = POSES.idle(t, 9);
    let face = 'smirk';
    let yaw = S_G.yaw(-35);
    if (t < NOGROAN) face = 'neutral';
    else if (t < BACK1) (pose = POSES.crossArms(t)), (face = 'smirk');
    else if (t < RAN) {
      const w = seg(t, BACK1, RAN - 0.1);
      v = lerp(-3.4, 1.4, w);
      pose = POSES.tiptoe(t, 9);
      pose.rArm = [-4, 0, -6];
      pose.lArm = [-4, 0, 6];
      pose.pitch = 0;
      face = t > BACK2 ? 'suspicious' : 'smirk';
      yaw = S_G.yaw(-30);
    } else {
      // Run for the doors.
      const w = seg(t, RAN, T_HALL - 0.1);
      u = lerp(10.0, 3.8, sm(w));
      v = lerp(1.4, 8.8, w);
      pose = POSES.run(t, 9);
      yaw = S_G.a + 0 + 8; // facing the doors
      face = 'grin';
    }
    at(G, A.me, S_G.p(u, v), { yaw, pose, face });
  }

  // ---- the hallway: running in, jumping into the locker ----
  const LEFT_DOOR = H.x - 22.9;
  function runIn(t) {
    // Doors at the left end burst open as I come through, then swing shut.
    const burst = T_HALL + 0.12;
    const doorAng = t < burst ? 0 : 1.9 * ease('Quad', 'Out', seg(t, burst, burst + 0.25)) * (1 - 0.8 * seg(t, burst + 0.8, burst + 1.6));
    hall.ends.left[0].rotation.y = doorAng;
    hall.ends.left[1].rotation.y = -doorAng;
    let x;
    let pose = POSES.run(t, 9);
    let yaw = 90;
    let face = 'sad';
    if (t < HIDE + 0.55) {
      x = lerp(-22, -12.5, seg(t, burst - 0.1, burst + 0.9));
      if (t > burst + 0.9) (pose = POSES.shocked(t, 9)), lookDir(pose, 0, 50 * Math.sin((t - burst) * 5)), (yaw = 90 + 25 * Math.sin((t - burst) * 3));
    } else if (t < DOOR_OPEN + 0.9) {
      x = -12.5;
      pose = POSES.idle(t, 9);
      lookDir(pose, 6, 55 * Math.sin((t - HIDE) * 4.5));
      pose.rArm = [-30, 0, -20];
      pose.lArm = [-30, 0, 20];
      yaw = 90 + 30 * Math.sin((t - HIDE) * 3);
      if (t > EMPTY - 0.05) (pose.pitch = 12), (pose.rArm = [-60, 0, 10]), (pose.lArm = [-60, 0, -10]); // hands on knees, catching breath
      face = t > EMPTY ? 'suspicious' : 'sad';
    } else x = 0;
    return { x, pose, yaw, face };
  }

  function hallRun(t) {
    const hero0 = HEROX - 2.2;
    // Back door swing for the "door hanging open" shot.
    if (t < DOOR_OPEN + 0.9) {
      const r = runIn(t);
      if (t < DOOR_OPEN - 0.1 || true) at(H, A.me, [r.x, 0.6], { yaw: r.yaw, pose: r.pose, face: r.face });
      return;
    }
    const w = seg(t, DOOR_OPEN + 0.9, JUMP - 0.1);
    if (t < JUMP) {
      const x = lerp(HEROX - 10, hero0, ease('Quad', 'In', w) * 0.4 + w * 0.6);
      at(H, A.me, [x, -1.6], { yaw: 90, pose: POSES.run(t, 9), face: 'sad' });
      return;
    }
    // The leap into the locker (turning to face out as I go), then crouching.
    const u = seg(t, JUMP, JUMP + 0.6);
    const x = lerp(hero0, ME_IN[0], ease('Sine', 'Out', u));
    const z = lerp(-1.6, ME_IN[1], ease('Sine', 'InOut', u));
    const y = 3.0 * Math.sin(Math.min(1, u) * Math.PI) * 0.8;
    const yaw = lerp(90, 0, sm(u));
    const p = POSES.run(t, 9);
    if (u < 1) {
      p.rLeg = [-40, 0, 0];
      p.lLeg = [-60, 0, 0];
      p.rArm = [-150, 0, 20];
      p.lArm = [-150, 0, -20];
      p.pitch = 0;
      at(H, A.me, [x, z], { y, yaw, pose: p, face: 'sad', size: lerp(1, 0.9, u) });
    }
  }

  // ---- inside the locker (the whole of the hiding) ----
  // [from time, pose, face]; the last entry whose time has passed applies.
  const inside = (t) => {
    const breathe = 0.03 * Math.sin(t * 3);
    let p = curl(t, 1);
    let face = 'suspicious';
    const at_ = (a) => t >= a;
    if (!at_(JUMP + 0.6)) return null;
    if (at_(SHUT + 0.7)) face = 'neutral';
    if (at_(SMELL)) (p = lookDir(curl(t), -8, -20)), (face = 'angry');
    if (at_(BANANA + 0.9)) (p = curl(t)), (face = 'neutral');
    if (at_(KNEES)) (p = curl(t, 1, -1.5)), (face = 'neutral');
    if (at_(PERFECT)) (p = withArms(curl(t), [-120 + 10 * Math.sin(t * 6), 0, 40], [-75, 0, -12])), (face = 'grin');
    if (at_(NOBODY)) (p = curl(t)), (face = 'smirk');
    if (at_(FOOT)) (p = lookDir(curl(t), -10, 0)), (face = 'suspicious');
    if (at_(UNLOCKED + 0.3)) (p = withArms(curl(t), [-120, 0, 14], [-120, 0, -14])), (face = 'neutral');
    if (at_(ICE)) (p = withArms(lookDir(curl(t), -12, 0), [-135, 0, 25], [-135, 0, -25])), (face = 'neutral');
    if (at_(CHLOE + 0.3)) (p = withArms(lookDir(curl(t), -8, 0), [-140, 0, 20], [-140, 0, -20])), (face = 'happy');
    if (at_(SENTENCE)) (p = lookDir(curl(t), 14, 0)), (face = 'sad');
    if (at_(STOPB)) (p = withArms(lookDir(curl(t), -10, 0), [-150, 0, 28], [-150, 0, -28])), (face = 'neutral');
    if (at_(NOTOPEN)) (p = lookDir(curl(t), 4, 0)), (face = 'suspicious');
    if (at_(LOVING)) (p = withArms(curl(t), [-110 + 14 * Math.sin(t * 7), 0, 30], [-75, 0, -12])), (face = 'grin');
    if (at_(WENTQUIET)) (p = curl(t)), (face = 'neutral');
    if (at_(TOUCH)) (p = withArms(lookDir(curl(t), 6, 0), [-165, 0, 18], [-75, 0, -12])), (face = 'suspicious');
    if (at_(HITHEAD)) (p = withArms(curl(t, 1, -1.5 + 0.35 * sm(seg(t, HITHEAD + 0.5, THUNK - 0.12))), [-165, 0, 18], [-75, 0, -12])), (face = 'suspicious');
    if (at_(THUNK)) {
      const hit = seg(t, THUNK, THUNK + 0.25);
      p = withArms(curl(t, 1, -1.5 + 0.35 * (1 - ease('Quad', 'Out', hit))), [-170, 0, 18], [-170, 0, -18]);
      lookDir(p, 22 * (1 - hit) + 8, 0);
      face = 'sad';
    }
    if (at_(THUNK + 1.2)) (p = curl(t)), (face = 'suspicious');
    if (at_(EYES)) (p = withArms(curl(t), [-128, 0, 34], [-128, 0, -34])), lookDir(p, 2, 0), (face = 'neutral');
    if (at_(WHISTLE + 0.6)) (p = withArms(lookDir(curl(t), 0, 0), [-128, 0, 34], [-128, 0, -34])), (face = 'neutral');
    if (at_(SEAT + 0.9)) (p = withArms(curl(t), [-110, 0, 20], [-110, 0, -20])), lookDir(p, -4, 0), (face = 'grin');
    if (at_(BACKFLIP)) {
      const bump = Math.max(0, Math.sin((t - BACKFLIP) * 9));
      p = withArms(curl(t, 1, -1.5 + 0.12 * bump), [-150, 0, 40 + 10 * bump], [-150, 0, -40 - 10 * bump]);
      face = 'happy';
    }
    if (at_(LIKEDME)) (p = withArms(curl(t, 1, -1.4 + 0.1 * Math.max(0, Math.sin(t * 8))), [-60, 0, 38], [-150, 0, -34])), (face = 'grin');
    if (at_(SITTING)) (p = lookDir(curl(t), -6, -28)), (face = 'neutral');
    if (at_(SMILED)) (p = lookDir(curl(t), 0, 0)), (face = 'grin');
    if (at_(SNEEZED - 0.15)) {
      p = lookDir(curl(t), -22 * seg(t, SNEEZED - 0.15, SNEEZED + 0.35) + 38 * seg(t, SNEEZED + 0.35, SNEEZED + 0.5), 0);
      face = t > SNEEZED + 0.35 ? 'angry' : 'suspicious';
    }
    if (at_(SNEEZED + 1.0)) (p = lookDir(curl(t), 6, 0)), (face = 'neutral');
    if (at_(SWUNG + 0.9)) (p = lookDir(curl(t), -30, 0)), (face = 'neutral');
    if (at_(HI)) (p = withArms(lookDir(curl(t), -14, 0), [-75, 0, 12], [-135, 0, -10 + 18 * Math.sin(t * 8)])), (face = 'smirk');
    if (at_(DISAPPEAR)) (p = withArms(lookDir(curl(t), 14, 0), [-128, 0, 34], [-128, 0, -34])), (face = 'sad');
    if (at_(COACH_IS + 0.4)) (p = lookDir(curl(t), 8, 0)), (face = 'sad');
    if (at_(CLOSED)) (p = withArms(lookDir(curl(t), 14, 0), [-128, 0, 34], [-128, 0, -34])), (face = 'neutral');
    if (at_(WORST)) (p = lookDir(curl(t), 18, 0)), (face = 'sad');
    if (at_(STEPPED)) (p = withArms(lookDir(curl(t), -6, 0), [-90, 0, 14], [-90, 0, -14])), (face = 'suspicious');
    if (at_(BECAUSE)) (p = withArms(lookDir(curl(t), -10, 0), [-90, 0, 14], [-90, 0, -14])), (face = 'suspicious');
    if (at_(YES)) (p = lookDir(curl(t), -14, 0)), (face = 'neutral');
    if (at_(NODDED)) {
      p = lookDir(curl(t), -6 + 16 * Math.sin((t - NODDED) * 7) * (t < NODDED + 1 ? 1 : 0), 0);
      face = 'happy';
    }
    if (at_(GRINNED)) (p = lookDir(curl(t), -10, 0)), (face = 'grin');
    p.lift += breathe;
    return { pose: p, face };
  }

  function lockerMe(t) {
    const s = inside(t);
    if (!s) return;
    at(H, A.me, ME_IN, { y: 0.15, size: 0.9, yaw: 0, pose: s.pose, face: s.face });
  }

  // ---- Chloe, Mia and Coach Reyes in the hall ----
  function chloe(t) {
    if (t < FOOT + 0.1) return;
    const rightDoor = hall.ends.right;
    // The doors open as she comes through, then swing shut behind her.
    const open = ease('Quad', 'Out', seg(t, FOOT + 0.1, FOOT + 0.4));
    const shut = seg(t, FOOT + 1.3, FOOT + 2.3);
    const ang = 1.9 * open * (1 - 0.85 * shut);
    if (t < FOOT + 3) (rightDoor[0].rotation.y = -ang), (rightDoor[1].rotation.y = ang);
    let xz = LOCK_AT;
    let yaw = 300;
    let pose = POSES.idle(t, 3);
    let face = 'neutral';
    if (t < NOTOPEN - 0.2) {
      // Walk in from the right end and stop beside the lock, her right hand out to it.
      const w = seg(t, FOOT + 0.2, WAIT + 0.5);
      xz = [lerp(21.8, LOCK_AT[0], w), lerp(0.4, LOCK_AT[1], w)];
      yaw = lerp(270, 300, w);
      pose = w < 1 ? POSES.walk(t, 3, 34, 1.7) : POSES.idle(t, 3);
      if (w >= 1 || t > UNLOCKED - 0.8) {
        pose = POSES.idle(t, 3);
        pose.rArm = [-40, 0, -62];
        face = 'suspicious';
      }
      if (t > CHLOE - 0.05) {
        face = 'happy';
        pose = POSES.idle(t, 3);
        yaw = lerp(300, 336, sm(seg(t, CHLOE, CHLOE + 0.5)));
      }
      if (t > CHLOE + 1.5) face = 'neutral';
    } else if (t < SNEEZED + 0.45) {
      // Leaning against the closed door.
      const turn = seg(t, LEANED - 0.2, LEANED + 0.6);
      const lean = S_HALL.p(lerp(0.6, 0.35, turn), lerp(-0.4, -0.1, turn));
      xz = lean;
      yaw = lerp(336, 348, sm(turn));
      pose = POSES.idle(t, 3);
      pose.neck = [2, 0, 0];
      pose.pitch = turn > 0.99 ? -3 : 0;
      pose.rArm = [-70, 0, 50];
      pose.lArm = [-60, 0, -50];
      face = t > D_LAUGH ? 'happy' : 'neutral';
      if (t < LEANED + 0.3) (pose.rArm = [-12, 0, -8]), (pose.lArm = [-12, 0, 8]), (face = 'neutral');
      if (t >= D_CHLOE1 && t < D_MIA2) (pose = talkSide(t, 3)), (face = 'neutral');
      if (t >= D_LAUGH && t < D_MIA3) (pose = POSES.laugh(t, 3)), (face = 'happy');
      if (t >= D_GLUE && t < D_MIA4) (pose = talkSide(t, 3)), (face = 'suspicious'), (yaw = 336);
      if (t >= D_FLAT && t < LOVING) (pose = talkSide(t, 3)), (face = 'suspicious');
      if (t >= WENTQUIET) (pose = POSES.idle(t, 3)), (face = 'sad'), (yaw = 336);
      if (t >= HAIRQ) (pose = POSES.idle(t, 3)), (pose.rArm = [-50, 0, 24]), (face = 'smirk');
      if (t >= D_HEAR - 0.1 && t < D_BUILDING + 0.5) {
        // She glances back at the locker.
        yaw = lerp(348, 480, sm(seg(t, D_HEAR, D_HEAR + 0.3)));
        face = 'suspicious';
        pose = POSES.idle(t, 3);
        pose.neck = [0, 0, 0];
      }
      if (t >= D_BUILDING + 0.5) yaw = lerp(480, 348, sm(seg(t, D_BUILDING + 0.5, D_BUILDING + 1.0)));
      if (t >= D_NOCOACH && t < D_WHISPER) {
        pose = POSES.idle(t, 3);
        pose.rArm = [-165, 0, -30 - 10 * Math.sin(t * 9)]; // cupped call, the arm away from the camera
        face = 'happy';
        yaw = 320;
      }
      if (t >= HONESTLY && t < BACKFLIP) (pose = POSES.idle(t, 3)), (pose.rArm = [-70, 0, 38]), (pose.lArm = [-70, 0, -38]), (face = 'sad'), (yaw = 340);
      if (t >= SEAT - 0.1 && t < BACKFLIP) face = 'smirk';
      if (t >= BACKFLIP) (pose = POSES.idle(t, 3)), (face = 'smirk');
    } else if (t < STEPPED) {
      // The sneeze: she jumps and slides to the right (so the door can open), then peers down
      // into the locker with her head turned toward it.
      const j = seg(t, SNEEZED + 0.45, SNEEZED + 0.85);
      xz = [lerp(S_HALL.p(0.35, -0.1)[0], SIDE_AT[0], sm(j)), lerp(S_HALL.p(0.35, -0.1)[1], SIDE_AT[1], sm(j))];
      yaw = lerp(348, 336, sm(j));
      pose = POSES.shocked(t, 3);
      pose.lift = 0.4 * Math.sin(j * Math.PI);
      face = 'sad';
      if (t >= SWUNG + 0.5) {
        // Peering down into the locker (turned to it while we see her from inside), then back
        // to the camera with her head still turned toward me.
        pose = POSES.idle(t, 3);
        pose.rArm = [-20, 0, -10];
        if (t < HI - 0.2) (yaw = lerp(336, 216, sm(seg(t, SWUNG + 0.5, SWUNG + 1.2)))), lookDir(pose, 26, 0), (face = 'sad');
        else {
          yaw = lerp(216, 336, sm(seg(t, HI - 0.2, HI + 0.2)));
          lookDir(pose, 24, -48);
          face = t >= SHADOW ? 'neutral' : 'suspicious';
          if (t >= SHADOW) lookDir(pose, 6, -50);
          if (t >= COACH_IS) (face = 'sad'), lookDir(pose, 6, 50);
        }
      }
    } else {
      // She steps in front of the locker to face the Coach, then turns to me.
      const w = seg(t, STEPPED, STEPPED + 0.8);
      xz = [lerp(SIDE_AT[0], FRONT_AT[0], sm(w)), lerp(SIDE_AT[1], FRONT_AT[1], sm(w))];
      pose = w < 1 ? POSES.walk(t, 3, 30, 1.6) : POSES.idle(t, 3);
      yaw = lerp(336, 322, sm(w));
      face = 'smirk';
      if (t >= RUNWITH) (pose = talkSide(t, 3)), (face = 'smirk');
      if (t >= WHY) (pose = POSES.idle(t, 3)), (face = 'neutral');
      if (t >= BECAUSE) (pose = talkSide(t, 3)), (face = 'smirk');
      if (t >= HELPER) face = 'grin';
      if (t >= TURNBACK) {
        pose = POSES.idle(t, 3);
        yaw = lerp(322, 380, sm(seg(t, TURNBACK + 0.15, TURNBACK + 0.65)));
        face = 'smirk';
        if (t >= YES) (face = 'happy'), (yaw = 352);
        if (t >= GRINNED) face = 'grin';
      }
      if (t >= HAND - 0.15) {
        // Turned to the locker, her hand held out to me.
        const q = seg(t, HAND - 0.15, HAND + 0.45);
        xz = [lerp(FRONT_AT[0], OTS_AT[0], sm(q)), lerp(FRONT_AT[1], OTS_AT[1], sm(q))];
        yaw = lerp(352, 165, sm(q));
        pose = POSES.idle(t, 3);
        pose.lArm = [-86, 0, 4];
        pose.rArm = [-6, 0, -8];
        face = 'grin';
      }
    }
    // The zipper pull swings with her.
    chloePack.userData.pull.rotation.z = 0.25 * Math.sin(t * 6) * (t > ZIPPER - 0.2 && t < ZIPPER + 1 ? 1 : 0.25);
    at(H, A.chloe, xz, { yaw, pose, face });
  }

  function mia(t) {
    if (t < MIA + 0.1) return;
    const w = seg(t, MIA + 0.1, MIA + 1.3);
    const from = S_HALL.p(-8.5, 0.4);
    let xz = [lerp(from[0], MIA_AT[0], w), lerp(from[1], MIA_AT[1], w)];
    let yaw = w < 1 ? 90 : S_HALL.yaw(40);
    let pose = w < 1 ? POSES.walk(t, 5, 34, 1.8) : POSES.idle(t, 5);
    let face = 'happy';
    if (w >= 1) {
      if (t >= D_MIA1 && t < D_CHLOE1) (pose = talkSide(t, 5)), (face = 'happy');
      if (t >= D_MIA2 && t < D_LAUGH) (pose = talkSide(t, 5)), (face = 'smirk');
      if (t >= D_LAUGH && t < D_MIA3) face = 'happy';
      if (t >= D_MIA3 && t < D_GLUE) (pose = talkSide(t, 5)), (face = 'suspicious');
      if (t >= D_GLUE && t < D_MIA4) (pose = POSES.laugh(t, 5)), (face = 'happy');
      if (t >= D_MIA4 && t < D_FLAT) (pose = talkSide(t, 5)), (face = 'suspicious');
      if (t >= D_FLAT && t < LOVING) (pose = POSES.laugh(t, 5)), (face = 'happy');
      if (t >= D_BUILDING && t < D_NOCOACH) (pose = talkSide(t, 5)), (face = 'suspicious');
      if (t >= D_WHISPER && t < HONESTLY) (pose = talkSide(t, 5)), (face = 'smirk');
      if (t >= HONESTLY && t < SEAT) (pose = POSES.idle(t, 5)), (face = 'happy');
      if (t >= SEAT) (pose = POSES.cheer(t, 5)), (face = 'happy');
      if (t >= SNEEZED + 0.45) {
        const j = seg(t, SNEEZED + 0.45, SNEEZED + 0.85);
        xz = [lerp(MIA_AT[0], MIA_SIDE[0], sm(j)), lerp(MIA_AT[1], MIA_SIDE[1], sm(j))];
        pose = POSES.shocked(t, 5);
        pose.lift = 0.4 * Math.sin(j * Math.PI);
        face = 'sad';
        yaw = S_HALL.yaw(20);
      }
      if (t >= SWUNG + 0.5) {
        pose = POSES.idle(t, 5);
        face = 'neutral';
        if (t < HI - 0.2) (yaw = lerp(S_HALL.yaw(20), 147, sm(seg(t, SWUNG + 0.5, SWUNG + 1.2)))), lookDir(pose, 26, 0);
        else {
          yaw = lerp(147, S_HALL.yaw(20), sm(seg(t, HI - 0.2, HI + 0.2)));
          lookDir(pose, 24, 48);
        }
      }
      if (t >= SCREAM) {
        pose = POSES.idle(t, 5);
        pose.rArm = [-165, 0, -34];
        pose.lArm = [-165, 0, 34];
        lookDir(pose, 8, 30);
        face = 'happy';
      }
      if (t >= DISAPPEAR + 0.4) (pose = POSES.idle(t, 5)), (pose.rArm = [-120, 0, -40]), (pose.lArm = [-120, 0, 40]), (face = 'happy');
      if (t >= STEPPED) (pose = POSES.idle(t, 5)), (pose.rArm = [-30, 0, -10]), (face = 'happy');
    }
    at(H, A.mia, xz, { yaw, pose, face });
  }

  function coach(t) {
    if (t < WHISTLE + 0.2) return;
    // From the doorway at the left end, slowly searching the hall, then arriving beside Mia.
    const leftDoors = hall.ends.left;
    const open = ease('Quad', 'Out', seg(t, WHISTLE + 0.1, WHISTLE + 0.5));
    const hold = seg(t, WHISTLE + 3.4, WHISTLE + 4.5);
    leftDoors[0].rotation.y = 1.9 * open * (1 - 0.85 * hold);
    leftDoors[1].rotation.y = -1.9 * open * (1 - 0.85 * hold);
    const walkIn = lerp(-21, HEROX - 9, seg(t, WHISTLE + 0.4, SHADOW - 2.5));
    const x = t < SHADOW - 2.5 ? walkIn : lerp(HEROX - 9, COACH_AT[0], sm(seg(t, SHADOW - 2.5, COACH_IS + 0.1)));
    let xz = [x, 0.7];
    let yaw = 90;
    let pose = POSES.walk(t, 7, 22, 1.1);
    let face = 'suspicious';
    if (t < COACHQ + 2.3) {
      // In the doorway: a hand cupped to his mouth, calling.
      xz = [-21 + 0.7 * seg(t, WHISTLE + 0.4, COACHQ + 2), 0.7];
      pose = POSES.yell(t, 7);
      pose.rArm = [-140, 0, 25];
      pose.lArm = [-30, 0, -10];
      face = t > COACHQ ? 'angry' : 'suspicious';
      yaw = 90;
    }
    if (t >= COACH_IS - 1.5) pose = POSES.walk(t, 7, 24, 1.2);
    if (t >= COACH_IS + 0.1) {
      xz = [COACH_AT[0], COACH_AT[1]];
      yaw = S_HALL.yaw(40);
      pose = POSES.idle(t, 7);
      face = 'angry';
      if (t >= THERE && t < CLOSED) {
        pose = POSES.point(t, 7);
        pose.rArm = [-95, 0, 8];
        face = 'angry';
      }
      if (t >= STEPPED) (pose = POSES.crossArms(t, 7)), (face = 'angry');
      if (t >= WHY - 0.1) (pose = POSES.idle(t, 7)), (face = 'suspicious'), (pose.rArm = [-30, 0, 20]);
      if (t >= WALKAWAY) {
        const w = seg(t, WALKAWAY + 0.4, WALKAWAY + 3.5);
        xz = [lerp(COACH_AT[0], HEROX - 15, w), lerp(COACH_AT[1], 0.6, w)];
        yaw = lerp(S_HALL.yaw(40), 270, seg(t, WALKAWAY + 0.3, WALKAWAY + 0.9));
        pose = POSES.walk(t, 7, 24, 1.3);
        pose.lArm = [-165, 0, 20];
        face = 'suspicious';
      }
    }
    at(H, A.coach, xz, { yaw, pose, face, hold: t < COACH_IS - 0.5 ? [] : ['clip'] });
  }

  // ---- the locker itself ----
  function lockerState(t, cut) {
    // Door angle: hanging open, slammed shut, rattled, then eased open.
    let ang = 1.75;
    if (t < DOOR_OPEN) ang = 1.75;
    else if (t < SHUT) ang = 1.75 + 0.07 * Math.sin((t - DOOR_OPEN) * 3.5) * Math.min(1, (t - DOOR_OPEN) * 2);
    else if (t < SHUT + 0.55) ang = 1.75 * (1 - ease('Quad', 'In', seg(t, SHUT, SHUT + 0.55)));
    else if (t < SWUNG) ang = 0;
    else ang = lerp(0, 2.9, sm(seg(t, SWUNG + 0.05, SWUNG + 1.3)));
    if (t >= SHUT + 0.55 && t < SHUT + 0.8) ang = 0.07 * Math.sin((t - SHUT - 0.55) * 30) * (1 - seg(t, SHUT + 0.55, SHUT + 0.8));
    hero.door.rotation.y = ang;
    hero.door.visible = !cut;
    hero.light.visible = cut;
    // Rattles: the locker shakes when I hit the shelf and when I sneeze.
    let rattle = 0;
    for (const [a0, amp] of [[THUNK, 0.05], [SNEEZED + 0.45, 0.07]]) if (t >= a0 && t < a0 + 0.5) rattle += amp * Math.sin((t - a0) * 70) * (1 - (t - a0) / 0.5);
    hero.group.position.x = hx + rattle;
    // The padlock dangles from the hasp and swings.
    hero.padlock.rotation.z = 0.2 * Math.sin(t * 2.2) + (t >= UNLOCKED && t < UNLOCKED + 0.6 ? 0.6 * Math.sin((t - UNLOCKED) * 14) : 0);
    // The shelf things hop when I hit my head.
    const hop = t >= THUNK && t < THUNK + 0.5 ? 0.5 * Math.abs(Math.sin((t - THUNK) * 14)) * (1 - (t - THUNK) / 0.5) : 0;
    hero.banana.position.y = 4.12 + hop;
    hero.can.position.y = 3.96 + hop * 0.7;
    hero.shoes.position.y = 3.96 + hop * 0.4;
    hero.books.position.y = 3.96 + hop * 0.3;
    // Smell wisps rise from the can while I'm sniffing it.
    smell.forEach((s, k) => {
      const live = cut && ((t > SMELL - 0.1 && t < KNEES) || (t > SITTING - 0.1 && t < SMILED));
      s.visible = live;
      if (!live) return;
      const ph = (t * 0.9 + k / 3) % 1;
      s.position.set(hx + 0.2 + (k - 1) * 0.35, 5.0 + ph * 1.2, H.z + HEROZ + 0.3);
      s.material.opacity = Math.sin(ph * Math.PI);
    });
    // Hearts float up in the locker when I think about Chloe.
    hearts.forEach((h, k) => {
      const win = (t > CRUSH && t < CRUSH + 2.6) || (t > BACKFLIP && t < BACKFLIP + 3.8) || (t > SEAT + 0.8 && t < SEAT + 3.0 && false);
      h.visible = win && cut;
      if (!h.visible) return;
      const ph = (t * 0.7 + k / hearts.length) % 1;
      h.position.set(hx + Math.sin(k * 2.7) * 0.9 + Math.sin(t * 3 + k) * 0.12, 3.6 + ph * 2.6, H.z + HEROZ + 1.2);
      h.material.opacity = Math.min(1, ph * 6) * (1 - ph);
      const s = 0.55 + 0.35 * Math.sin(k * 1.7) ** 2;
      h.scale.set(s, s, 1);
    });
    // Comic text.
    thunkText.visible = cut && t >= THUNK && t < THUNK + 0.7;
    thunkText.position.set(hx + 0.2, 4.35 + 0.35 * seg(t, THUNK, THUNK + 0.5), H.z + HEROZ + 1.2);
    thunkText.material.opacity = 1 - seg(t, THUNK + 0.4, THUNK + 0.7);
    achoo.visible = !cut && t >= SNEEZED + 0.45 && t < SNEEZED + 1.1;
    achoo.position.set(hx + 0.2, 6.2, H.z + DOORZ + 0.9);
    achoo.material.opacity = 1 - seg(t, SNEEZED + 0.8, SNEEZED + 1.1);
    achoo.scale.setScalar(2.6 + 1.0 * popIn(t, SNEEZED + 0.45, 0.25));
  }

  return function update(t) {
    for (const a of everyone) a.hide();
    for (const h of [...hearts, ...smell, achoo, thunkText]) h.visible = false;
    hall.ends.left.forEach((l) => (l.rotation.y = 0));
    hall.ends.right.forEach((l) => (l.rotation.y = 0));
    black.style.opacity = String(Math.max(0, ...CUTS.map((c) => 1 - Math.abs(t - c) / 0.2)));
    const cut = cameraAt(t);
    vignette.style.opacity = cut ? '1' : '0';
    shade.style.opacity = String(0.7 * sm(seg(t, SHADOW, SHADOW + 0.4)) * (1 - sm(seg(t, COACH_IS + 0.5, COACH_IS + 1.1))));
    const gymTime = t >= T_GYM && t < T_HALL;
    if (gymTime) {
      light('interior', G, [-70, 45, 18]);
      gym(t);
    } else {
      light('interior', H, [10, 50, 85]);
      lockerState(t, cut);
      if (t < T_GYM) {
        at(H, A.me, ME_IN, { y: 0.15, size: 0.9, yaw: 0, pose: curl(t, 1), face: 'suspicious' }); // the hook: already hiding
      } else {
        if (t < JUMP + 0.6) hallRun(t);
        else lockerMe(t);
        if (!cut) {
          chloe(t);
          mia(t);
          coach(t);
        }
      }
    }
    captions(t);
  };
}
