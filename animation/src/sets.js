// All the story's sets, built once, each at its own spot in the world. Indoor sets are
// roofless rooms (the sun lights them, like most Roblox interiors in story videos).
// buildSets() returns each set's origin plus handles to things shots animate.
import * as THREE from 'three';
import { BRICK, part, cylinder, ball, wedge } from './roblox.js';
import { buildTown } from './town.js';
import * as P from './props.js';

export const ORIGIN = {
  town: new THREE.Vector3(0, 0, 0),
  hall: new THREE.Vector3(400, 0, 0),
  wedding: new THREE.Vector3(-400, 0, 0),
  karaoke: new THREE.Vector3(800, 0, 0),
  grad: new THREE.Vector3(-800, 0, 0),
  studio: new THREE.Vector3(1200, 0, 0),
  office: new THREE.Vector3(1600, 0, 0),
  home: new THREE.Vector3(2000, 0, 0),
  bedroom: new THREE.Vector3(2000, 0, 120),
  doctor: new THREE.Vector3(2400, 0, 0),
  square: new THREE.Vector3(-1200, 0, 0),
};

const at = (obj, o, x, y, z, rotY = 0) => {
  obj.position.set(o.x + x, o.y + y, o.z + z);
  obj.rotation.y = rotY;
  return obj;
};

/** Floor (top at y = 0) and walls on the back (-z), left and right of a room. */
function room(scene, a, o, { w, d, h = 12, floor, floorMat, wall, wallMat, open = [] }) {
  scene.add(at(part(a, [w, 1, d], [0, 0, 0], floor, floorMat, { shadows: false }), o, 0, -0.5, 0));
  if (!open.includes('back')) scene.add(at(part(a, [w, h, 1], [0, 0, 0], wall, wallMat), o, 0, h / 2, -d / 2));
  if (!open.includes('left')) scene.add(at(part(a, [1, h, d], [0, 0, 0], wall, wallMat), o, -w / 2, h / 2, 0));
  if (!open.includes('right')) scene.add(at(part(a, [1, h, d], [0, 0, 0], wall, wallMat), o, w / 2, h / 2, 0));
  // Baseboard trim.
  scene.add(at(part(a, [w, 0.6, 0.2], [0, 0, 0], BRICK.white, 'Plastic', { shadows: false }), o, 0, 0.3, -d / 2 + 0.6));
}

function checkerFloor(scene, a, o, w, d, c1, c2, tile = 4) {
  for (let x = -w / 2 + tile / 2; x < w / 2; x += tile) {
    for (let z = -d / 2 + tile / 2; z < d / 2; z += tile) {
      const odd = (Math.round((x + w) / tile) + Math.round((z + d) / tile)) % 2;
      scene.add(at(part(a, [tile, 1, tile], [0, 0, 0], odd ? c1 : c2, 'Plastic', { shadows: false }), o, x, -0.5, z));
    }
  }
}

function crowdBleachers(scene, a, o, x, z, w) {
  for (let r = 0; r < 3; r++) scene.add(at(part(a, [w, 1.2 + r * 1.2, 2.2], [0, 0, 0], BRICK.darkStoneGrey, 'Metal'), o, x, (1.2 + r * 1.2) / 2, z + r * 2.2));
}

function windowOnWall(scene, a, o, x, y, z, w = 5, h = 4) {
  scene.add(at(part(a, [w + 0.6, h + 0.6, 0.3], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'), o, x, y, z));
  scene.add(at(part(a, [w, h, 0.34], [0, 0, 0], BRICK.pastelBlue, 'Glass', { shadows: false }), o, x, y, z));
  scene.add(at(part(a, [0.2, h, 0.4], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'), o, x, y, z));
}

export function buildSets(scene, a) {
  const h = {}; // handles

  // A big ground under everything.
  scene.add(part(a, [6000, 1, 1200], [0, -0.85, 0], BRICK.brightGreen, 'Grass', { shadows: false }));

  // ---- town street (origin) --------------------------------------------------------
  buildTown(scene, a);
  const T = ORIGIN.town;
  // Crane TV station down the street.
  const tv = new THREE.Group();
  tv.add(part(a, [26, 16, 16], [0, 8, 0], BRICK.lightStoneGrey, 'Concrete'));
  tv.add(part(a, [10, 7, 0.5], [0, 3.5, 8.1], BRICK.pastelBlue, 'Glass', { shadows: false }));
  tv.add(part(a, [1, 14, 1], [8, 23, 0], BRICK.brightRed, 'Metal'));
  tv.add(ball(a, 1.1, [8, 30.5, 0], BRICK.brightRed, 'Neon'));
  const tvSign = P.sign(a, 20, 4, 'CRANE TV', { bg: '#5b2a86', fg: '#ffd21f', size: 170, border: '#ffd21f', emissive: true });
  tvSign.position.set(0, 12.5, 8.2);
  tv.add(tvSign);
  scene.add(at(tv, T, -78, 0, -40));
  // A traffic light whose arm hangs over the sidewalk (arm points +z after the turn).
  scene.add(at(P.trafficLight(a, 6, 8.2), T, -40, 0, -3.2, Math.PI));
  // School bus parked on the road.
  scene.add(at(P.schoolBus(a), T, 36, 0, -8.5));
  h.bus = { x: 36 + 9.2, z: -8.5 + 3.6 };

  // ---- school hallway --------------------------------------------------------------
  const HA = ORIGIN.hall;
  checkerFloor(scene, a, HA, 48, 16, BRICK.institutionalWhite, BRICK.mediumStoneGrey);
  scene.add(at(part(a, [48, 13, 1], [0, 0, 0], BRICK.brickYellow, 'Brick'), HA, 0, 6.5, -8));
  scene.add(at(P.lockers(a, 16, BRICK.brightBlue), HA, 0, 0, -6.6));
  const tigers = P.sign(a, 12, 2.2, 'GO TIGERS!', { bg: '#da8541', fg: '#ffffff', stroke: '#000', size: 150 });
  scene.add(at(tigers, HA, -8, 10, -7.4));
  scene.add(at(part(a, [1, 13, 16], [0, 0, 0], BRICK.brickYellow, 'Brick'), HA, -24, 6.5, 0));

  // ---- wedding garden --------------------------------------------------------------
  const W = ORIGIN.wedding;
  scene.add(at(P.weddingArch(a), W, 0, 0, -10));
  scene.add(at(part(a, [3, 0.1, 22], [0, 0, 0], BRICK.brightRed, 'Fabric', { shadows: false }), W, 0, 0.05, 0));
  h.weddingChairs = [];
  for (let r = 0; r < 3; r++) {
    for (const side of [-1, 1]) {
      for (let c = 0; c < 3; c++) {
        const x = side * (3.5 + c * 2.6);
        const z = 0 + r * 4;
        scene.add(at(P.chair(a, BRICK.institutionalWhite, 'Plastic'), W, x, 0, z, Math.PI));
        h.weddingChairs.push([W.x + x, W.z + z]);
      }
    }
  }
  for (const [x, z, s] of [[-14, -16, 1.1], [14, -18, 1.2], [-22, -6, 1], [22, -4, 1]]) {
    const tr = new THREE.Group();
    tr.add(cylinder(a, 0.6 * s, 7 * s, [0, 3.5 * s, 0], BRICK.reddishBrown, 'Wood'));
    tr.add(ball(a, 3.2 * s, [0, 8 * s, 0], BRICK.brightGreen, 'Grass'));
    scene.add(at(tr, W, x, 0, z));
  }

  // ---- karaoke bar -----------------------------------------------------------------
  const K = ORIGIN.karaoke;
  room(scene, a, K, { w: 36, d: 24, floor: BRICK.reddishBrown, floorMat: 'WoodPlanks', wall: BRICK.royalPurple, wallMat: 'Plastic' });
  scene.add(at(part(a, [16, 1.5, 8], [0, 0, 0], BRICK.black, 'Plastic'), K, 0, 0.75, -8));
  scene.add(at(P.karaokeMachine(a), K, -4.5, 1.5, -8.5));
  scene.add(at(P.micStand(a), K, 1.5, 1.5, -7));
  const noKaraoke = P.canvasTexture(512, 256, (ctx, w, hh) => {
    ctx.fillStyle = '#16112b';
    ctx.fillRect(0, 0, w, hh);
    P.drawText(ctx, 'KARAOKE', w / 2, hh / 2, w * 0.85, 120, { color: '#ff6ec7', stroke: '#ff0099', strokeW: 6 });
    ctx.strokeStyle = '#ff2b2b';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(w / 2, hh / 2, hh * 0.45, 0, Math.PI * 2);
    ctx.moveTo(w / 2 - hh * 0.32, hh / 2 - hh * 0.32);
    ctx.lineTo(w / 2 + hh * 0.32, hh / 2 + hh * 0.32);
    ctx.stroke();
  });
  scene.add(at(P.panel(a, 10, 5, noKaraoke, { emissive: true }), K, 0, 8, -11.4));
  for (const [y, r] of [[3.2, 0.12], [2.2, -0.1]]) {
    const tape = P.cautionTape(a, 17);
    tape.rotation.z = r;
    scene.add(at(tape, K, 0, y, -3.95));
  }

  // ---- graduation stage ------------------------------------------------------------
  const G = ORIGIN.grad;
  room(scene, a, G, { w: 50, d: 40, floor: BRICK.darkStoneGrey, floorMat: 'Concrete', wall: BRICK.navyBlue, wallMat: 'Fabric' });
  scene.add(at(P.stage(a, 30, 12, 3, BRICK.reddishBrown), G, 0, 0, -12));
  scene.add(at(P.podium(a, 'CLASS OF 26'), G, 0, 3, -13));
  scene.add(at(P.sign(a, 22, 3.6, 'CONGRATS GRADS!', { bg: '#1f3b73', fg: '#ffd21f', size: 150, border: '#ffd21f' }), G, 0, 14, -19.3));
  for (let r = 0; r < 3; r++) for (let c = -4; c <= 4; c++) scene.add(at(P.chair(a, BRICK.black, 'Plastic'), G, c * 3, 0, 4 + r * 4, Math.PI));

  // ---- Gotcha! studio --------------------------------------------------------------
  const S = ORIGIN.studio;
  room(scene, a, S, { w: 60, d: 50, h: 20, floor: BRICK.black, floorMat: 'Plastic', wall: BRICK.reallyBlack, wallMat: 'Plastic' });
  scene.add(at(P.stage(a, 36, 14, 2.5, BRICK.royalPurple), S, 0, 0, -12));
  h.studioScreen = P.canvasTexture(1024, 576, drawGotchaLogo);
  scene.add(at(P.panel(a, 30, 16.9, h.studioScreen, { emissive: true, depth: 0.6 }), S, 0, 11, -23));
  for (const x of [-16, 16]) scene.add(at(P.stageLight(a), S, x, 2.5, -16, x < 0 ? 0.4 : -0.4));
  crowdBleachers(scene, a, S, 0, 8, 40);
  scene.add(at(P.tvCamera(a), S, -12, 0, 2, Math.PI));
  h.studioSeats = [];
  for (let r = 0; r < 3; r++) for (let c = -6; c <= 6; c++) h.studioSeats.push([S.x + c * 3, 1.2 + r * 1.2, S.z + 8 + r * 2.2]);

  // ---- payroll office --------------------------------------------------------------
  const O = ORIGIN.office;
  room(scene, a, O, { w: 34, d: 24, floor: BRICK.sandBlue, floorMat: 'Fabric', wall: BRICK.lightStoneGrey, wallMat: 'Plastic' });
  scene.add(at(P.table(a, 8, 4, 3), O, 0, 0, -4));
  scene.add(at(P.computer(a), O, -2, 3.2, -5));
  // A stack of paychecks on the desk.
  scene.add(at(part(a, [1.8, 0.5, 1], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'), O, 2, 3.42, -4));
  const check = P.paycheck(a, 'TWINKLETOES CRANE', 1.8, 0.8, { censor: true });
  check.rotation.x = -Math.PI / 2;
  check.position.set(O.x + 2, 3.7, O.z - 4);
  scene.add(check);
  for (const x of [-12, -9]) scene.add(at(P.filingCabinet(a), O, x, 0, -10.5));
  scene.add(at(P.sign(a, 8, 1.8, 'PAYROLL', { bg: '#ffffff', fg: '#1f3b73', size: 140, border: '#1f3b73' }), O, 6, 8, -11.4));
  // Mr. Crane's office door with a gold nameplate.
  scene.add(at(P.door(a, BRICK.reddishBrown), O, 12, 0, -11.6));
  scene.add(at(P.sign(a, 3.6, 1, 'MR. CRANE', { bg: '#d4af37', fg: '#3a2a00', size: 130 }), O, 12, 7.8, -11.3));
  scene.add(at(P.chair(a, BRICK.black, 'Plastic'), O, 0, 0, -0.5, Math.PI));

  // ---- home: kitchen ---------------------------------------------------------------
  const H = ORIGIN.home;
  room(scene, a, H, { w: 40, d: 26, floor: BRICK.brown, floorMat: 'WoodPlanks', wall: BRICK.brickYellow, wallMat: 'Plastic' });
  scene.add(at(P.stove(a), H, -6, 0, -10.9));
  scene.add(at(P.counter(a, 8), H, -14, 0, -10.9));
  scene.add(at(P.fridge(a), H, 2, 0, -10.9));
  scene.add(at(P.table(a, 6, 4, 3), H, 8, 0, -1));
  scene.add(at(P.chair(a), H, -6, 0, -7.6, Math.PI));
  h.kitchenChair = [H.x - 6, H.z - 7.6];
  windowOnWall(scene, a, H, 10, 7, -12.4);
  // Front door on the right wall.
  scene.add(at(P.door(a, BRICK.brightRed), H, 19.4, 0, 4, -Math.PI / 2));
  scene.add(at(part(a, [6, 0.1, 4], [0, 0, 0], BRICK.brightRed, 'Fabric', { shadows: false }), H, 16, 0.05, 4));
  // Family photo frames.
  for (const [x, c] of [[-14, BRICK.pastelBlue], [-10, BRICK.pink]]) scene.add(at(part(a, [2.4, 2, 0.2], [0, 0, 0], c, 'Plastic'), H, x, 7.5, -12.4));

  // ---- bedroom -----------------------------------------------------------------------
  const B = ORIGIN.bedroom;
  room(scene, a, B, { w: 28, d: 22, floor: BRICK.reddishBrown, floorMat: 'WoodPlanks', wall: BRICK.pastelBlue, wallMat: 'Plastic' });
  scene.add(at(P.bed(a, 5, BRICK.brightRed), B, 0, 0, -6.5));
  windowOnWall(scene, a, B, -8, 7, -10.4);
  scene.add(at(P.sign(a, 4, 5, 'ROBLOX', { bg: '#1b2a35', fg: '#ffffff', size: 130 }), B, 8, 7, -10.4));
  scene.add(at(part(a, [4, 4, 2.5], [0, 0, 0], BRICK.white, 'WoodPlanks'), B, 9, 2, -9));

  // ---- doctor's office ---------------------------------------------------------------
  const D = ORIGIN.doctor;
  room(scene, a, D, { w: 30, d: 22, floor: BRICK.institutionalWhite, floorMat: 'Plastic', wall: BRICK.pastelBlue, wallMat: 'Plastic' });
  scene.add(at(part(a, [8, 3, 3.5], [0, 0, 0], BRICK.mediumStoneGrey, 'Metal'), D, -2, 1.5, -6));
  scene.add(at(part(a, [8, 0.6, 3.5], [0, 0, 0], BRICK.institutionalWhite, 'Fabric'), D, -2, 3.3, -6));
  scene.add(at(P.heightChart(a), D, 6, 4, -10.4));
  scene.add(at(P.filingCabinet(a), D, 11, 0, -9));
  scene.add(at(P.sign(a, 6, 1.6, 'Dr. OFFICE', { bg: '#ffffff', fg: '#c4281c', size: 130, border: '#c4281c' }), D, -2, 9, -10.4));

  // ---- town square (finale) ----------------------------------------------------------
  const Q = ORIGIN.square;
  scene.add(at(part(a, [140, 1, 110], [0, 0, 0], BRICK.mediumStoneGrey, 'Cobblestone', { shadows: false }), Q, 0, -0.5, 10));
  scene.add(at(P.stage(a, 34, 14, 3.2, BRICK.reddishBrown), Q, 0, 0, -12));
  h.squareScreen = P.canvasTexture(1024, 576, drawGotchaLogo);
  const screen = P.panel(a, 26, 14.6, h.squareScreen, { emissive: true, depth: 0.6 });
  scene.add(at(screen, Q, 0, 13, -18.8));
  for (const x of [-14, 14]) scene.add(at(part(a, [0.8, 22, 0.8], [0, 0, 0], BRICK.darkStoneGrey, 'Metal'), Q, x, 11, -18.8));
  scene.add(at(part(a, [29, 0.8, 0.8], [0, 0, 0], BRICK.darkStoneGrey, 'Metal'), Q, 0, 21.6, -18.8));
  scene.add(at(P.sign(a, 22, 2.6, 'SEASON FINALE', { bg: '#c4281c', fg: '#ffffff', size: 160 }), Q, 0, 1.6, -4.95));
  // Mic stand at the front of the stage (the kid grabs its mic).
  h.squareStand = at(P.micStand(a), Q, 2.4, 0, -4.2);
  scene.add(h.squareStand);
  for (const x of [-15, 15]) scene.add(at(P.stageLight(a), Q, x, 3.2, -16, x < 0 ? 0.35 : -0.35));
  for (const x of [-22, 22]) scene.add(at(P.tvCamera(a), Q, x, 0, 6, x < 0 ? Math.PI * 0.85 : -Math.PI * 0.85));
  scene.add(at(P.stormDrain(a), Q, -30, 0.02, 2));
  h.drain = [Q.x - 30, Q.z + 2];
  // Buildings and trees around the square.
  const shop = (x, z, rot, wall, wallMat, label) => {
    const g = new THREE.Group();
    g.add(part(a, [18, 13, 12], [0, 6.5, 0], wall, wallMat));
    g.add(part(a, [18.6, 1.2, 12.6], [0, 13.6, 0], BRICK.darkStoneGrey, 'Slate'));
    g.add(part(a, [6, 6, 0.4], [0, 3, 6.1], BRICK.pastelBlue, 'Glass', { shadows: false }));
    const s = P.sign(a, 12, 2, label, { bg: '#ffffff', fg: '#1b2a35', size: 140 });
    s.position.set(0, 9.5, 6.25);
    g.add(s);
    scene.add(at(g, Q, x, 0, z, rot));
  };
  shop(-44, -20, 0.5, BRICK.brightRed, 'Brick', 'PIZZA');
  shop(44, -20, -0.5, BRICK.brightBlue, 'Plastic', 'TOYS');
  shop(-56, 18, Math.PI / 2, BRICK.brickYellow, 'Brick', 'BAKERY');
  shop(56, 18, -Math.PI / 2, BRICK.lightStoneGrey, 'Concrete', 'BANK');
  for (const [x, z] of [[-32, -24], [32, -24], [-40, 40], [40, 40]]) {
    const tr = new THREE.Group();
    tr.add(cylinder(a, 0.6, 7, [0, 3.5, 0], BRICK.reddishBrown, 'Wood'));
    tr.add(ball(a, 3.2, [0, 8, 0], BRICK.brightGreen, 'Grass'));
    scene.add(at(tr, Q, x, 0, z));
  }
  return h;
}

/** Gotcha! logo for the show's screens. */
export function drawGotchaLogo(ctx, w, h, sub = '') {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5b2a86');
  g.addColorStop(1, '#1d0b33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,210,31,0.10)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.arc(w / 2, h / 2, w, (i / 18) * Math.PI * 2, ((i + 1) / 18) * Math.PI * 2);
    ctx.fill();
  }
  P.drawText(ctx, 'GOTCHA!', w / 2, h * 0.45, w * 0.85, 230, { color: '#ffd21f', stroke: '#c4281c', strokeW: 18 });
  if (sub) P.drawText(ctx, sub, w / 2, h * 0.8, w * 0.8, 80, { color: '#ffffff', stroke: '#000', strokeW: 8 });
}
