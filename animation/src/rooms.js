// Detailed interiors for school stories, built like a Roblox showcase build:
//   buildClassroom  a full classroom (ceiling tiles, lights, whiteboard, desks with clutter,
//                   windows onto a schoolyard) with the hallway outside its door.
//   buildBedroom    a teenager's bedroom at night (gaming desk, LED strip, lamp, posters).
// Static parts are baked into merged meshes (bake.js); the returned handles are the parts
// that shots animate (the classroom door) or switch on (the bedroom's lights).
import * as THREE from 'three';
import { BRICK, part, cylinder, ball, robloxMaterial } from './roblox.js';
import * as P from './props.js';
import { bake } from './bake.js';
import { rng } from './world.js';
import { fixture, lightShaft } from './lighting.js';

const FONT = '"Fredoka One"';
const BOOKS = [0xc4281c, 0x0d69ac, 0xf5cd30, 0x4b974b, 0x6225d1, 0xda8541, 0x1b2a35, 0xff98dc, 0x80bbdc, 0xa4bd47, 0xf2f3f3, 0x7c5c46];

// ---- helpers --------------------------------------------------------------------------

const box = (g, a, size, pos, color, mat = 'Plastic', shadows = true) => {
  const m = part(a, size, pos, color, mat, { shadows });
  g.add(m);
  return m;
};

const put = (g, obj, x, y, z, ry = 0) => {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  g.add(obj);
  return obj;
};

/** A flat picture (poster, board writing, screen) facing +z, `w` x `h` studs. */
function decal(w, h, draw, { ppu = 64, glow = 0, alpha = false } = {}) {
  const cw = Math.min(2048, Math.round(w * ppu));
  const ch = Math.min(2048, Math.round(h * ppu));
  const tex = P.canvasTexture(cw, ch, draw);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.85,
    alphaTest: alpha ? 0.5 : 0,
    emissive: glow ? 0xffffff : 0x000000,
    emissiveMap: glow ? tex : null,
    emissiveIntensity: glow,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = true;
  return m;
}

/** Puts pictures on the inside faces of a room's walls (x = ±hx, z = ±hz). */
const mounter = (g, hx, hz) => (m, wall, u, y, out = 0.04) => {
  if (wall === 'back') m.position.set(u, y, -hz + out);
  if (wall === 'front') (m.position.set(u, y, hz - out), (m.rotation.y = Math.PI));
  if (wall === 'left') (m.position.set(-hx + out, y, u), (m.rotation.y = Math.PI / 2));
  if (wall === 'right') (m.position.set(hx - out, y, u), (m.rotation.y = -Math.PI / 2));
  g.add(m);
  return m;
};

/** A floor or ceiling plane with a repeating canvas texture (`tile` studs per repeat). */
function texturedPlane(w, d, tile, draw, { up = true, rough = 0.6 } = {}) {
  const tex = P.canvasTexture(256, 256, draw);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / tile, d / tile);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: rough }));
  m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

const tileDraw = (c1, c2, seed = 3) => (ctx, w, h) => {
  const r = rng(seed);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    ctx.fillStyle = (i + j) % 2 ? c1 : c2;
    ctx.fillRect(i * 128, j * 128, 128, 128);
  }
  for (let k = 0; k < 1400; k++) {
    ctx.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.04 + r() * 0.07})` : `rgba(255,255,255,${0.05 + r() * 0.08})`;
    ctx.fillRect(r() * w, r() * h, 2 + r() * 2, 2 + r() * 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 3;
  for (const p of [0, 128, 256]) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, h);
    ctx.moveTo(0, p);
    ctx.lineTo(w, p);
    ctx.stroke();
  }
};

const ceilingDraw = (ctx, w, h) => {
  const r = rng(11);
  ctx.fillStyle = '#f1efe9';
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 2200; k++) {
    ctx.fillStyle = `rgba(90,90,90,${0.08 + r() * 0.12})`;
    ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
  ctx.fillStyle = '#c9c7c2';
  for (const p of [0, 128]) {
    ctx.fillRect(p, 0, 6, h);
    ctx.fillRect(0, p, w, 6);
  }
};

/** A row of books standing on a shelf, from `from` to `to` along x (or z). */
function bookRow(g, a, r, { from, to, y, at, depth = 1, alongZ = false, maxH = 1.3 }) {
  let p = from;
  while (true) {
    const w = 0.2 + r() * 0.24;
    if (p + w > to) break;
    const h = maxH * (0.68 + r() * 0.32);
    const d = depth * (0.8 + r() * 0.2);
    const c = BOOKS[Math.floor(r() * BOOKS.length)];
    if (alongZ) box(g, a, [d, h, w], [at, y + h / 2, p + w / 2], c);
    else box(g, a, [w, h, d], [p + w / 2, y + h / 2, at], c);
    p += w + 0.03;
    if (r() < 0.07) p += 0.5;
  }
}

function tree(g, a, x, z, s = 1, r = Math.random) {
  g.add(cylinder(a, 0.6 * s, 7 * s, [x, 3.5 * s - 0.2, z], BRICK.reddishBrown, 'Wood'));
  const greens = [BRICK.brightGreen, BRICK.darkGreen, 0x3f8f3f];
  g.add(ball(a, 3.2 * s, [x, 8 * s, z], greens[0], 'Grass'));
  g.add(ball(a, 2.4 * s, [x + 1.8 * s, 6.8 * s, z + 0.8 * s], greens[1 + Math.floor(r() * 2)], 'Grass'));
  g.add(ball(a, 2.2 * s, [x - 1.7 * s, 7 * s, z - 0.6 * s], greens[1], 'Grass'));
}

function plant(g, a, x, y, z, s = 1) {
  g.add(cylinder(a, 0.38 * s, 0.6 * s, [x, y + 0.3 * s, z], 0xb5562f, 'Plastic'));
  g.add(cylinder(a, 0.42 * s, 0.12 * s, [x, y + 0.6 * s, z], 0x9c4626, 'Plastic'));
  g.add(ball(a, 0.5 * s, [x, y + 1.05 * s, z], 0x3f8f3f, 'Grass'));
  g.add(ball(a, 0.35 * s, [x + 0.3 * s, y + 1.35 * s, z + 0.1 * s], BRICK.brightGreen, 'Grass'));
  g.add(ball(a, 0.32 * s, [x - 0.25 * s, y + 1.4 * s, z - 0.15 * s], BRICK.darkGreen, 'Grass'));
}

function backpack(g, a, x, y, z, color, ry = 0) {
  const b = new THREE.Group();
  box(b, a, [1.3, 1.6, 0.75], [0, 0.8, 0], color, 'Fabric');
  box(b, a, [1.0, 0.7, 0.3], [0, 0.55, 0.5], color, 'Fabric');
  box(b, a, [1.32, 0.1, 0.77], [0, 1.25, 0], BRICK.reallyBlack, 'Plastic', false); // zip
  box(b, a, [0.18, 1.3, 0.12], [-0.4, 0.85, -0.42], BRICK.reallyBlack, 'Fabric');
  box(b, a, [0.18, 1.3, 0.12], [0.4, 0.85, -0.42], BRICK.reallyBlack, 'Fabric');
  put(g, b, x, y, z, ry);
  return b;
}

// ---- pictures -------------------------------------------------------------------------

function text(ctx, s, x, y, size, color, { align = 'left', font = FONT, stroke = null, sw = 0 } = {}) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = sw;
    ctx.strokeStyle = stroke;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

const drawBoard = (ctx, w, h) => {
  const r = rng(5);
  ctx.fillStyle = '#fbfcfc';
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 26; k++) {
    ctx.fillStyle = 'rgba(110,130,150,0.05)';
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, 40 + r() * 90, 12 + r() * 30, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'Fractions!', 50, 70, 64, '#1f5fbf');
  ctx.strokeStyle = '#1f5fbf';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(50, 110);
  ctx.lineTo(370, 104);
  ctx.stroke();
  text(ctx, '1/2 + 1/4 = 3/4', 60, 175, 50, '#222');
  text(ctx, '2/3 of 9 = 6', 60, 245, 50, '#222');
  text(ctx, 'HW: pg. 42  #1-15', 60, 330, 46, '#c4281c');
  // Pizza, a quarter shaded.
  const cx = 760, cy = 220, rr = 120;
  ctx.fillStyle = 'rgba(240,160,60,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, rr, -Math.PI / 2, 0);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, rr, 0, Math.PI * 2);
  ctx.moveTo(cx - rr, cy);
  ctx.lineTo(cx + rr, cy);
  ctx.moveTo(cx, cy - rr);
  ctx.lineTo(cx, cy + rr);
  ctx.stroke();
  text(ctx, '1/4', cx + 40, cy - 50, 36, '#222');
  text(ctx, 'Tue, Oct 24', w - 40, 50, 34, '#444', { align: 'right' });
  ctx.strokeStyle = '#c4281c';
  ctx.lineWidth = 5;
  ctx.strokeRect(w - 300, h - 110, 260, 70);
  text(ctx, 'QUIZ FRIDAY!', w - 170, h - 75, 36, '#c4281c', { align: 'center' });
};

const drawBulletin = (ctx, w, h) => {
  const r = rng(8);
  ctx.fillStyle = '#c49a6c';
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 1600; k++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(90,55,25,0.25)' : 'rgba(240,210,170,0.25)';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.fillStyle = '#ffd21f';
  ctx.fillRect(20, 14, w - 40, 54);
  text(ctx, 'STAR STUDENTS', w / 2, 42, 36, '#1b2a35', { align: 'center' });
  const papers = ['#ffffff', '#ffe08a', '#a8e6ff', '#ffc2e0', '#c8f7c5', '#ffffff'];
  papers.forEach((c, i) => {
    const x = 30 + (i % 3) * 118 + r() * 10;
    const y = 90 + Math.floor(i / 3) * 112 + r() * 8;
    ctx.save();
    ctx.translate(x + 45, y + 45);
    ctx.rotate((r() - 0.5) * 0.25);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-42, -40, 90, 96);
    ctx.fillStyle = c;
    ctx.fillRect(-45, -45, 90, 96);
    ctx.fillStyle = 'rgba(60,60,80,0.55)';
    for (let l = 0; l < 5; l++) ctx.fillRect(-35, -25 + l * 15, 50 + r() * 20, 4);
    if (i % 2 === 0) text(ctx, 'A+', 20, 30, 26, '#c4281c', { align: 'center' });
    ctx.fillStyle = ['#e53935', '#1e88e5', '#43a047'][i % 3];
    ctx.beginPath();
    ctx.arc(0, -38, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
};

const drawCalendar = (ctx, w, h) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ef7d22';
  ctx.fillRect(0, 0, w, 52);
  text(ctx, 'OCTOBER', w / 2, 28, 34, '#ffffff', { align: 'center' });
  const cw = w / 7, top = 66, rh = (h - top - 8) / 5;
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 2;
  for (let d = 1; d <= 31; d++) {
    const k = d + 3; // Oct 1 is a Thursday
    const col = k % 7, row = Math.floor(k / 7);
    const x = col * cw, y = top + row * rh;
    if (row > 4) continue;
    ctx.strokeRect(x, y, cw, rh);
    text(ctx, String(d), x + 6, y + 12, 15, '#444');
    if (d < 24) {
      ctx.strokeStyle = 'rgba(196,40,28,0.7)';
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 8);
      ctx.lineTo(x + cw - 6, y + rh - 6);
      ctx.stroke();
      ctx.strokeStyle = '#d9d9d9';
    }
    if (d === 24) {
      ctx.strokeStyle = '#c4281c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + rh / 2, rh / 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#d9d9d9';
      ctx.lineWidth = 2;
    }
    if (d === 31) {
      ctx.fillStyle = '#ef7d22';
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + rh / 2 + 4, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const drawRules = (ctx, w, h) => {
  ctx.fillStyle = '#d6f5d0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2f8f46';
  ctx.fillRect(0, 0, w, 44);
  text(ctx, 'CLASS RULES', w / 2, 23, 26, '#ffffff', { align: 'center' });
  ['1. Be kind', '2. Raise your hand', '3. Be on time', '4. Do your best'].forEach((s, i) => text(ctx, s, 12, 72 + i * 34, 18, '#1b2a35'));
  text(ctx, '5. NO PHONES!', 12, 72 + 4 * 34, 20, '#c4281c');
};

const drawKind = (ctx, w, h) => {
  ctx.fillStyle = '#ffc2e0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ff4d8d';
  const cx = w / 2, cy = h * 0.42, s = w * 0.28;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s);
  ctx.bezierCurveTo(cx - s * 2, cy - s * 0.2, cx - s * 0.6, cy - s * 1.6, cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.6, cx + s * 2, cy - s * 0.2, cx, cy + s);
  ctx.fill();
  text(ctx, 'BE KIND', w / 2, h * 0.85, 40, '#ffffff', { align: 'center', stroke: '#c2185b', sw: 8 });
};

const drawMath = (ctx, w, h) => {
  ctx.fillStyle = '#1b2a55';
  ctx.fillRect(0, 0, w, h);
  const r = rng(2);
  for (let k = 0; k < 40; k++) text(ctx, ['+', '÷', '×', '=', '%', '√'][k % 6], r() * w, r() * h, 16 + r() * 14, 'rgba(255,255,255,0.18)');
  text(ctx, 'π', w / 2, h * 0.4, 130, '#ffd21f', { align: 'center' });
  text(ctx, 'MATH IS', w / 2, h * 0.74, 30, '#ffffff', { align: 'center' });
  text(ctx, 'EVERYWHERE', w / 2, h * 0.86, 30, '#ffffff', { align: 'center' });
};

const drawMap = (ctx, w, h) => {
  ctx.fillStyle = '#5aa9e6';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += w / 12) (ctx.beginPath(), ctx.moveTo(x, 0), ctx.lineTo(x, h), ctx.stroke());
  for (let y = 0; y < h; y += h / 8) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(w, y), ctx.stroke());
  const land = [
    // [x, y, rx, ry] as fractions: the Americas, Europe/Africa, Asia, Australia, Antarctica.
    [0.2, 0.3, 0.09, 0.12], [0.24, 0.42, 0.05, 0.08], [0.28, 0.62, 0.05, 0.14], [0.49, 0.3, 0.05, 0.07],
    [0.52, 0.55, 0.07, 0.15], [0.68, 0.32, 0.14, 0.12], [0.74, 0.5, 0.05, 0.06], [0.83, 0.7, 0.06, 0.05], [0.5, 0.96, 0.4, 0.04],
  ];
  const cols = ['#7cc576', '#a5d46a', '#e8c872', '#7cc576', '#c9e07a', '#8fd18a', '#a5d46a', '#e8c872', '#f4f4f4'];
  land.forEach(([x, y, rx, ry], i) => {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.ellipse(x * w, y * h, rx * w, ry * h, (i - 4) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w / 2 - 130, 10, 260, 44);
  text(ctx, 'WORLD MAP', w / 2, 33, 32, '#1b2a35', { align: 'center' });
  ctx.strokeStyle = '#7c5c46';
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, w, h);
};

const drawClock = (ctx, w, h) => {
  const c = w / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c, c, c - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.translate(c + Math.sin(a) * c * 0.82, c - Math.cos(a) * c * 0.82);
    ctx.rotate(a);
    ctx.fillRect(-3, -10, 6, 20);
    ctx.restore();
  }
  for (const [n, a] of [['12', 0], ['3', 0.25], ['6', 0.5], ['9', 0.75]])
    text(ctx, n, c + Math.sin(a * Math.PI * 2) * c * 0.62, c - Math.cos(a * Math.PI * 2) * c * 0.62, 30, '#222', { align: 'center' });
  const hand = (frac, len, wid, col) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(frac * Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fillRect(-wid / 2, -len, wid, len + 10);
    ctx.restore();
  };
  hand((8 + 5 / 60) / 12, c * 0.45, 9, '#222'); // 8:05
  hand(5 / 60, c * 0.7, 6, '#222');
  hand(38 / 60, c * 0.75, 2, '#c4281c');
};

const drawBunting = (ctx, w, h) => {
  const cols = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#fb8c00'];
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, 6 + Math.sin((x / w) * Math.PI * 6) * 4);
  ctx.stroke();
  const n = 30;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (w / n);
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.moveTo(x - 22, 8);
    ctx.lineTo(x + 22, 8);
    ctx.lineTo(x, h - 4);
    ctx.fill();
  }
};

const drawRug = (ctx, w, h) => {
  const cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, (w / 2) * (1 - i / cols.length), 0, Math.PI * 2);
    ctx.fill();
  });
};

const signDraw = (lines, bg, fg, { stroke = null, border = null } = {}) => (ctx, w, h) => {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = h * 0.07;
    ctx.strokeRect(0, 0, w, h);
  }
  const lh = h / (lines.length + 0.3);
  lines.forEach((l, i) => P.drawText(ctx, l, w / 2, lh * (i + 0.65), w * 0.88, lh * 0.8, { color: fg, stroke: stroke ?? '#000', strokeW: stroke ? lh * 0.1 : 0 }));
};

// ---- the classroom --------------------------------------------------------------------

const WALL = 0xece4cf;
const WAINSCOT = 0x6f93ad;
const TRIM = 0xf4f1ea;
const FRAME = 0x9a9ea5;
const DESK_TOP = 0xd2ad74;

/**
 * A classroom at `o`: interior x -17.5..17.5, z -14.5..14.5, 13 studs high. The board is on
 * the back wall (-z), windows on the left (-x), the door on the right (+x) at z 6.5..10.5
 * opening into a hallway. `desks` are [x, z] desk rows (students face -z and sit `seatDz`
 * behind their desk). Returns { door } — a pivot to rotate (0 shut, ~1.6 wide open).
 */
export function buildClassroom(scene, a, o, { desks = [], seatDz = 1.05, seed = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const mount = mounter(g, 17.5, 14.5);

  // Floor, ceiling, walls. The roof and walls block the sun: daylight comes in through the
  // windows (aim the sun from -x to get patches and shafts), the rest from the ceiling lights.
  box(g, a, [36, 1, 30], [0, -0.5, 0], 0x9b9b95, 'Concrete', false);
  put(g, texturedPlane(36, 30, 8, tileDraw('#e9e3d3', '#d3d6d2')), 0, 0.01, 0);
  put(g, texturedPlane(36, 30, 8, ceilingDraw, { up: false, rough: 0.9 }), 0, 13, 0);
  box(g, a, [37, 0.6, 31], [0, 13.31, 0], TRIM, 'Plastic');
  const wall = (size, pos) => box(g, a, size, pos, WALL, 'Plastic');
  wall([36, 13, 1], [0, 6.5, -15]);
  wall([36, 13, 1], [0, 6.5, 15]);
  // Left wall: three window openings (z -11..-5, -3..3, 5..11; y 3.8..10).
  wall([1, 3.8, 30], [-18, 1.9, 0]);
  wall([1, 3, 30], [-18, 11.5, 0]);
  for (const [z, len] of [[-13, 4], [-4, 2], [4, 2], [13, 4]]) wall([1, 6.2, len], [-18, 6.9, z]);
  // Right wall: doorway at z 6.5..10.5, 7.6 high.
  wall([1, 13, 21.5], [18, 6.5, -4.25]);
  wall([1, 13, 4.5], [18, 6.5, 12.75]);
  wall([1, 5.4, 4], [18, 10.3, 8.5]);
  // Two-tone walls: blue wainscot, a white chair rail and dark baseboards.
  const lower = (size, pos) => {
    box(g, a, size, pos, WAINSCOT, 'Plastic', false);
    const [sx, , sz] = size;
    box(g, a, [sx + (sx > 1 ? 0 : 0.08), 0.25, sz + (sz > 1 ? 0 : 0.08)], [pos[0], 3.3, pos[2]], TRIM, 'Plastic', false);
    box(g, a, [sx + (sx > 1 ? 0 : 0.1), 0.5, sz + (sz > 1 ? 0 : 0.1)], [pos[0], 0.25, pos[2]], 0x55595f, 'Plastic', false);
  };
  lower([35, 3.2, 0.1], [0, 1.6, -14.45]);
  lower([35, 3.2, 0.1], [0, 1.6, 14.45]);
  lower([0.1, 3.2, 29], [-17.45, 1.6, 0]);
  lower([0.1, 3.2, 21.3], [17.45, 1.6, -4.35]);
  lower([0.1, 3.2, 4.3], [17.45, 1.6, 12.85]);

  // Ceiling lights, projector, vent, smoke detector, speaker.
  for (const x of [-9, 0, 9])
    for (const z of [-8, 0, 8]) {
      box(g, a, [2.8, 0.18, 5.4], [x, 12.9, z], TRIM, 'Metal', false);
      box(g, a, [2.4, 0.06, 5.0], [x, 12.8, z], 0xfdfcf2, 'Neon', false);
      for (const s of [-0.6, 0.6]) box(g, a, [0.05, 0.08, 5.0], [x + s, 12.77, z], 0xd8d8d8, 'Metal', false);
    }
  box(g, a, [0.18, 0.9, 0.18], [0, 12.5, -2], FRAME, 'Metal');
  box(g, a, [1.8, 0.65, 1.5], [0, 11.8, -2], 0xe6e6e6, 'Plastic');
  const lens = cylinder(a, 0.28, 0.25, [0, 11.8, -2.85], 0x222222, 'Plastic');
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  box(g, a, [2.2, 0.06, 2.2], [13, 12.96, 4], 0xdcdcdc, 'Metal', false);
  for (let k = -3; k <= 3; k++) box(g, a, [1.9, 0.07, 0.08], [13, 12.93, 4 + k * 0.27], 0x8a8a8a, 'Metal', false);
  g.add(cylinder(a, 0.32, 0.12, [5, 12.94, 3], 0xf8f8f8, 'Plastic'));
  box(g, a, [1.4, 0.08, 1.4], [-13, 12.95, -12], 0xe0ddd5, 'Fabric', false);

  // ---- back wall: whiteboard, banner, bunting, clock, bulletin board, calendar, rules
  box(g, a, [18, 6.5, 0.12], [0, 6.5, -14.43], 0xfafafa, 'Plastic', false);
  mount(decal(18, 6.5, drawBoard, { ppu: 64 }), 'back', 0, 6.5, 0.1);
  for (const y of [3.18, 9.82]) box(g, a, [18.5, 0.28, 0.35], [0, y, -14.35], 0xc0c4c8, 'Metal');
  for (const x of [-9.1, 9.1]) box(g, a, [0.28, 6.9, 0.35], [x, 6.5, -14.35], 0xc0c4c8, 'Metal');
  box(g, a, [16, 0.14, 0.7], [0, 3.1, -14.05], 0xc0c4c8, 'Metal');
  [[0x1f5fbf, -5], [0xc4281c, -4.4], [0x111111, -3.8], [0x2f8f46, -3.2]].forEach(([c, x]) => {
    const marker = cylinder(a, 0.09, 0.75, [x, 3.27, -13.95], c, 'Plastic');
    marker.rotation.z = Math.PI / 2;
    g.add(marker);
  });
  box(g, a, [1.1, 0.3, 0.45], [4, 3.32, -14.0], 0x222222, 'Fabric');
  box(g, a, [1.1, 0.14, 0.45], [4, 3.53, -14.0], 0x8a5a3a, 'Wood');
  mount(decal(11, 1.4, signDraw(["MS. PARKER'S CLASS"], '#ffd21f', '#1b2a35', { border: '#1b2a35' })), 'back', 0, 11.05, 0.06);
  mount(decal(34, 1, drawBunting, { ppu: 40, alpha: true }), 'back', 0, 12.35, 0.08);
  const rim = cylinder(a, 1.12, 0.22, [13.6, 11.0, -14.38], 0x1b2a35, 'Plastic');
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  mount(decal(2.1, 2.1, drawClock, { ppu: 128, alpha: true }), 'back', 13.6, 11.0, 0.24);
  box(g, a, [6.4, 5.4, 0.25], [-13.2, 6.6, -14.4], 0x8a5a3a, 'Wood');
  mount(decal(6, 5, drawBulletin), 'back', -13.2, 6.6, 0.16);
  mount(decal(4, 4.5, drawCalendar), 'back', 12.0, 6.6, 0.05);
  mount(decal(2.6, 3.6, drawRules), 'back', 15.6, 6.6, 0.05);
  // Low bookshelf under the bulletin board.
  box(g, a, [6.4, 0.25, 1.6], [-13.2, 3.0, -13.6], 0xd8b98a, 'WoodPlanks');
  box(g, a, [6.4, 0.25, 1.6], [-13.2, 1.5, -13.6], 0xd8b98a, 'WoodPlanks');
  box(g, a, [6.4, 0.25, 1.6], [-13.2, 0.12, -13.6], 0xd8b98a, 'WoodPlanks');
  for (const x of [-16.3, -10.1]) box(g, a, [0.25, 3.1, 1.6], [x, 1.55, -13.6], 0xd8b98a, 'WoodPlanks');
  bookRow(g, a, r, { from: -16.1, to: -10.3, y: 0.25, at: -13.6, depth: 1.2, maxH: 1.15 });
  bookRow(g, a, r, { from: -16.1, to: -10.3, y: 1.63, at: -13.6, depth: 1.2, maxH: 1.2 });
  plant(g, a, -11, 3.12, -13.6, 0.9);
  box(g, a, [1.2, 0.9, 0.9], [-14.8, 3.57, -13.6], 0x1e88e5, 'Plastic'); // pencil bin

  // ---- teacher's desk, chair, filing cabinet with a globe, trash can
  const td = new THREE.Group();
  box(td, a, [7, 0.35, 3.2], [0, 3.2, 0], 0x7a5134, 'Wood');
  box(td, a, [2.4, 3.0, 2.9], [2.2, 1.5, 0], 0x6b4a33, 'Wood');
  for (const y of [0.6, 1.5, 2.4]) {
    box(td, a, [2.2, 0.75, 0.06], [2.2, y, 1.47], 0x80583a, 'Wood', false);
    box(td, a, [0.6, 0.12, 0.12], [2.2, y + 0.1, 1.53], 0xc0c4c8, 'Metal', false);
  }
  box(td, a, [0.3, 3.0, 2.9], [-3.35, 1.5, 0], 0x6b4a33, 'Wood');
  box(td, a, [6.4, 1.8, 0.12], [-0.2, 2.1, 1.4], 0x6b4a33, 'Wood');
  // On the desk: monitor (facing the teacher, -z), keyboard, mouse, mug, papers, apple, books, nameplate, plant.
  box(td, a, [2.6, 1.6, 0.18], [-1.2, 4.55, 0.6], 0x1b1b1b, 'Plastic');
  box(td, a, [2.4, 1.4, 0.02], [-1.2, 4.55, 0.5], 0x86b8e8, 'Neon', false);
  box(td, a, [0.25, 0.6, 0.25], [-1.2, 3.65, 0.65], 0x1b1b1b, 'Plastic');
  box(td, a, [1.0, 0.08, 0.6], [-1.2, 3.41, 0.65], 0x1b1b1b, 'Plastic');
  box(td, a, [2.0, 0.1, 0.7], [-1.2, 3.42, -0.55], 0x2a2a2a, 'Plastic');
  box(td, a, [0.3, 0.1, 0.45], [0.25, 3.42, -0.55], 0x2a2a2a, 'Plastic');
  td.add(cylinder(a, 0.28, 0.6, [1.6, 3.67, -0.6], 0xff6f91, 'Plastic'));
  [[0xf5cd30, 0.1], [0x1f5fbf, -0.08], [0xc4281c, 0.04]].forEach(([c, dx], i) => {
    const p = cylinder(a, 0.05, 0.9, [1.6 + dx, 4.05, -0.6 + (i - 1) * 0.08], c, 'Plastic');
    p.rotation.z = dx;
    td.add(p);
  });
  for (let k = 0; k < 6; k++) box(td, a, [1.5, 0.04, 2.0], [2.4 + (r() - 0.5) * 0.12, 3.4 + k * 0.045, 0.1 + (r() - 0.5) * 0.12], 0xfafafa, 'Plastic', false);
  td.add(ball(a, 0.36, [-2.8, 3.73, 0.6], BRICK.brightRed, 'Plastic'));
  box(td, a, [0.08, 0.25, 0.08], [-2.8, 4.12, 0.6], 0x5a3a1a, 'Wood');
  box(td, a, [1.4, 0.35, 1.0], [-2.6, 3.55, -0.6], 0x0d69ac, 'Plastic');
  box(td, a, [1.3, 0.3, 0.95], [-2.6, 3.88, -0.6], 0xf5cd30, 'Plastic');
  const plate = decal(2.2, 0.5, signDraw(['Ms. Parker'], '#1b2a35', '#ffd21f'));
  put(td, plate, 0.4, 3.65, 1.41);
  box(td, a, [2.3, 0.6, 0.3], [0.4, 3.63, 1.25], 0x1b2a35, 'Plastic');
  plant(td, a, 3.1, 3.38, 1.0, 0.7);
  put(g, td, 9.5, 0, -10);
  // Rolling chair behind the desk.
  const tc = new THREE.Group();
  box(tc, a, [2, 0.4, 2], [0, 2.0, 0], 0x1b1b1b, 'Fabric');
  box(tc, a, [2, 2.6, 0.35], [0, 3.5, -0.95], 0x1b1b1b, 'Fabric');
  tc.add(cylinder(a, 0.12, 1.6, [0, 1.0, 0], 0x666666, 'Metal'));
  for (let k = 0; k < 5; k++) {
    const leg = part(a, [0.2, 0.15, 1.2], [Math.sin((k / 5) * Math.PI * 2) * 0.6, 0.25, Math.cos((k / 5) * Math.PI * 2) * 0.6], 0x333333, 'Metal');
    leg.rotation.y = (k / 5) * Math.PI * 2;
    tc.add(leg);
  }
  put(g, tc, 9.5, 0, -12.7, 0.3);
  put(g, P.filingCabinet(a), 15.8, 0, -13.2);
  g.add(cylinder(a, 0.4, 0.2, [15.8, 5.1, -13.2], 0x7a5134, 'Wood'));
  box(g, a, [0.1, 1.0, 0.1], [15.8, 5.6, -13.2], 0xe2b33c, 'Metal');
  const globe = ball(a, 0.9, [15.8, 6.6, -13.2], 0x3d8fd6, 'Plastic');
  g.add(globe);
  g.add(ball(a, 0.5, [16.2, 6.85, -12.65], 0x6fbf5a, 'Grass'));
  g.add(ball(a, 0.42, [15.3, 6.3, -12.5], 0x6fbf5a, 'Grass'));
  g.add(cylinder(a, 0.6, 1.6, [13.6, 0.8, -8.6], 0x5d6066, 'Plastic'));
  g.add(ball(a, 0.3, [13.5, 1.55, -8.5], 0xffffff, 'Plastic'));

  // ---- left wall: windows with blinds and plants, cabinets with books and a fish tank
  for (const zc of [-8, 0, 8]) {
    for (const y of [3.95, 9.85]) box(g, a, [1.2, 0.3, 6.3], [-18, y, zc], TRIM, 'Plastic', false);
    for (const dz of [-3.0, 3.0]) box(g, a, [1.2, 6.2, 0.3], [-18, 6.9, zc + dz], TRIM, 'Plastic', false);
    box(g, a, [0.3, 6.0, 0.2], [-18, 6.9, zc], TRIM, 'Plastic', false);
    box(g, a, [0.3, 0.2, 6.0], [-18, 7.9, zc], TRIM, 'Plastic', false);
    const glass = part(a, [0.08, 6, 6], [-18, 6.9, zc], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.18 } });
    g.add(glass);
    box(g, a, [1.0, 0.2, 6.6], [-17.2, 3.9, zc], TRIM, 'Plastic');
    // Blinds pulled half down.
    box(g, a, [0.35, 0.35, 6.2], [-17.25, 9.85, zc], 0xf2f0e8, 'Plastic', false);
    for (let k = 0; k < 6; k++) box(g, a, [0.22, 0.05, 5.9], [-17.3, 9.55 - k * 0.3, zc], 0xf2f0e8, 'Plastic');
    box(g, a, [0.3, 0.1, 5.95], [-17.3, 7.7, zc], 0xe0ddd0, 'Plastic', false);
    box(g, a, [0.04, 2.0, 0.04], [-17.2, 8.6, zc + 2.7], 0xdddddd, 'Plastic', false);
    plant(g, a, -17.2, 4.0, zc + 1.8, 0.8);
  }
  box(g, a, [1.7, 3.0, 26], [-16.6, 1.5, 0], 0xd8b98a, 'WoodPlanks');
  box(g, a, [1.9, 0.2, 26.2], [-16.55, 3.1, 0], 0x6b4a33, 'Wood');
  for (let z = -11.5; z <= 11.5; z += 3.3) {
    box(g, a, [0.06, 2.4, 3.0], [-15.73, 1.5, z], 0xc9a978, 'WoodPlanks', false);
    box(g, a, [0.12, 0.6, 0.12], [-15.66, 1.9, z + 1.1], 0xc0c4c8, 'Metal', false);
  }
  bookRow(g, a, r, { from: 2.5, to: 6.5, y: 3.2, at: -16.6, depth: 1.1, alongZ: true, maxH: 1.0 });
  bookRow(g, a, r, { from: -3.2, to: -1.0, y: 3.2, at: -16.6, depth: 1.1, alongZ: true, maxH: 1.0 });
  // Fish tank.
  const tank = new THREE.Group();
  box(tank, a, [1.4, 0.15, 3.2], [0, 0.07, 0], 0x1b1b1b, 'Plastic');
  box(tank, a, [1.3, 0.3, 3.1], [0, 0.28, 0], 0xd9c7a0, 'Sand');
  tank.add(part(a, [1.2, 1.3, 3.0], [0, 0.95, 0], 0x3fa9f5, 'Glass', { shadows: false, mat: { opacity: 0.35 } }));
  tank.add(part(a, [1.4, 1.6, 3.2], [0, 0.85, 0], 0xe8f6ff, 'Glass', { shadows: false, mat: { opacity: 0.12 } }));
  box(tank, a, [1.45, 0.12, 3.25], [0, 1.7, 0], 0x1b1b1b, 'Plastic');
  for (const [y, z, c] of [[0.9, -0.6, 0xff8c1a], [1.2, 0.5, 0xffd21f], [0.7, 1.0, 0xff5a5a]]) {
    box(tank, a, [0.2, 0.25, 0.4], [0, y, z], c, 'Plastic', false);
    box(tank, a, [0.1, 0.25, 0.15], [0, y, z + 0.25], c, 'Plastic', false);
  }
  for (const z of [-1.1, 0.9]) {
    box(tank, a, [0.1, 0.8, 0.1], [0, 0.8, z], 0x2f8f46, 'Grass', false);
    box(tank, a, [0.1, 0.55, 0.1], [0, 0.7, z + 0.2], 0x4b974b, 'Grass', false);
  }
  put(g, tank, -16.6, 3.2, -8.5);

  // ---- right wall: door frame, exit sign, coat hooks with backpacks, posters, extinguisher
  for (const z of [6.35, 10.65]) box(g, a, [1.25, 7.6, 0.3], [18, 3.8, z], FRAME, 'Metal', false);
  box(g, a, [1.25, 0.3, 4.6], [18, 7.75, 8.5], FRAME, 'Metal', false);
  const exit = decal(2, 0.8, signDraw(['EXIT'], '#ffffff', '#d50000', { border: '#d50000' }), { glow: 0.7 });
  box(g, a, [0.3, 0.9, 2.1], [17.35, 8.7, 8.5], 0xf2f2f2, 'Plastic');
  put(g, exit, 17.19, 8.7, 8.5, -Math.PI / 2);
  box(g, a, [0.35, 0.4, 15], [17.3, 6.2, -6], 0x8a5a3a, 'Wood');
  const packColors = [0xc4281c, 0x1b2a35, 0x6225d1, 0x2f8f46, 0xff98dc, 0x0d69ac, 0xda8541];
  for (let k = 0; k < 7; k++) {
    const z = -12.5 + k * 2.1;
    box(g, a, [0.5, 0.12, 0.12], [17.05, 6.0, z], 0xc0c4c8, 'Metal', false);
    if (k !== 3) backpack(g, a, 16.6, 4.3, z, packColors[k], -Math.PI / 2);
  }
  mount(decal(3, 4, drawKind), 'right', -10.5, 9.8);
  mount(decal(3, 4, drawMath), 'right', -4.5, 9.8);
  mount(decal(1.4, 0.5, signDraw(['FIRE'], '#d50000', '#ffffff')), 'right', 4.4, 5.1);
  g.add(cylinder(a, 0.3, 1.4, [17.1, 3.2, 4.4], 0xd50000, 'Plastic'));
  g.add(cylinder(a, 0.12, 0.3, [17.1, 4.05, 4.4], 0x1b1b1b, 'Plastic'));
  box(g, a, [0.12, 0.8, 0.1], [17.0, 3.4, 4.75], 0x1b1b1b, 'Plastic', false);
  box(g, a, [0.12, 0.6, 0.4], [17.45, 4.5, 5.7], 0xf8f8f8, 'Plastic', false); // light switch
  box(g, a, [0.4, 0.9, 0.6], [17.3, 4.6, 11.6], 0xf8f8f8, 'Plastic'); // hand sanitizer
  box(g, a, [0.2, 0.3, 0.15], [17.15, 4.1, 11.6], 0x80bbdc, 'Plastic', false);

  // ---- front wall: cubbies, tall bookshelf, world map, reading corner, bins
  const cub = new THREE.Group();
  box(cub, a, [9.2, 4.6, 1.6], [0, 2.3, 0], 0xf4f1ea, 'WoodPlanks');
  const binCols = [0xe53935, 0xfdd835, 0x43a047, 0x1e88e5, 0x8e24aa];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 5; col++) {
      const x = -3.6 + col * 1.8, y = 0.8 + row * 1.4;
      box(cub, a, [1.6, 1.15, 0.2], [x, y, -0.75], 0x3b3b3b, 'Plastic', false);
      box(cub, a, [1.55, 0.9, 1.3], [x, y - 0.05, -0.25], binCols[(row * 2 + col) % 5], 'Plastic');
    }
  box(cub, a, [1.2, 0.5, 1.0], [-3, 4.85, 0], 0xff8c1a, 'Plastic');
  cub.add(ball(a, 0.6, [2.8, 5.2, 0], 0xe0702a, 'Plastic'));
  put(g, cub, -10.6, 0, 13.6);
  const shelf = new THREE.Group();
  box(shelf, a, [5.4, 7.4, 0.2], [0, 3.7, 0.7], 0x8a5a3a, 'Wood');
  for (const x of [-2.6, 2.6]) box(shelf, a, [0.25, 7.4, 1.6], [x, 3.7, 0], 0x8a5a3a, 'Wood');
  for (const y of [0.15, 1.95, 3.75, 5.55, 7.3]) box(shelf, a, [5.4, 0.22, 1.6], [0, y, 0], 0x8a5a3a, 'Wood');
  put(g, shelf, -0.5, 0, 13.65);
  for (const y of [0.26, 2.06, 3.86, 5.66]) bookRow(g, a, r, { from: -3.0, to: 1.95, y, at: 13.55, depth: 1.25, maxH: 1.5 });
  mount(decal(8, 5, drawMap), 'front', 9, 7.4);
  box(g, a, [0.3, 0.3, 0.3], [5.2, 9.8, 14.35], 0xc4281c, 'Plastic', false);
  put(g, decal(6, 6, drawRug, { alpha: true }), -12.5, 0.03, 9.3).rotation.x = -Math.PI / 2;
  for (const [x, z, c] of [[-14.3, 10.6, 0xc4281c], [-11.2, 11.1, 0x0d69ac], [-13.2, 8.2, 0xf5cd30]]) {
    const bag = ball(a, 1.3, [x, 0.75, z], c, 'Fabric');
    bag.scale.set(1, 0.6, 1);
    g.add(bag);
  }
  g.add(cylinder(a, 0.75, 2.2, [15.6, 1.1, 13.4], 0x5d6066, 'Plastic'));
  g.add(cylinder(a, 0.75, 2.2, [13.9, 1.1, 13.4], 0x1e88e5, 'Plastic'));
  mount(decal(1.2, 0.4, signDraw(['RECYCLE'], '#1e88e5', '#ffffff')), 'front', 13.9, 2.8);

  // ---- student desks and chairs, with clutter and backpacks
  for (const [i, [x, z]] of desks.entries()) {
    const d = new THREE.Group();
    box(d, a, [3.4, 0.22, 2.2], [0, 2.86, 0], DESK_TOP, 'WoodPlanks');
    box(d, a, [3.44, 0.06, 2.24], [0, 2.73, 0], 0x6b5a4a, 'Plastic', false);
    box(d, a, [3.0, 0.5, 1.9], [0, 2.43, -0.05], 0x5d6066, 'Metal');
    for (const sx of [-1.45, 1.45]) {
      for (const sz of [-0.85, 0.85]) d.add(cylinder(a, 0.08, 2.2, [sx, 1.1, sz], 0x8d8f94, 'Metal'));
      box(d, a, [0.12, 0.12, 1.7], [sx, 0.45, 0], 0x8d8f94, 'Metal', false);
    }
    // Clutter: a notebook with a pencil, a textbook, sometimes a water bottle.
    const nb = BOOKS[i % BOOKS.length];
    box(d, a, [1.2, 0.05, 1.5], [-0.6 + r() * 0.3, 3.0, 0.1], nb, 'Plastic', false);
    box(d, a, [1.1, 0.04, 1.4], [-0.6 + r() * 0.3, 3.04, 0.1], 0xfafafa, 'Plastic', false);
    const pencil = part(a, [0.08, 0.08, 1.0], [0.3, 3.08, 0.3], 0xf5cd30, 'Plastic', { shadows: false });
    pencil.rotation.y = 0.6 + r();
    d.add(pencil);
    if (r() < 0.6) box(d, a, [1.0, 0.3, 1.3], [1.0, 3.12, -0.3], BOOKS[(i * 5 + 3) % BOOKS.length], 'Plastic');
    if (r() < 0.4) d.add(cylinder(a, 0.18, 0.75, [1.25, 3.35, 0.6], [0x80bbdc, 0xff98dc, 0x43a047][i % 3], 'Plastic'));
    put(g, d, x, 0, z - 0.4);
    const c = new THREE.Group();
    box(c, a, [1.8, 0.22, 1.7], [0, 1.64, 0], 0x2f6fb5, 'Plastic');
    const back = part(a, [1.8, 1.5, 0.18], [0, 2.75, 0.82], 0x2f6fb5, 'Plastic');
    back.rotation.x = -0.08;
    c.add(back);
    for (const sx of [-0.75, 0.75]) {
      for (const sz of [-0.7, 0.7]) c.add(cylinder(a, 0.07, 1.55, [sx, 0.77, sz], 0x8d8f94, 'Metal'));
      box(c, a, [0.1, 1.1, 0.1], [sx * 0.9, 2.1, 0.8], 0x8d8f94, 'Metal', false);
    }
    put(g, c, x, 0, z + seatDz + 0.15);
    if (r() < 0.75) {
      const bp = backpack(g, a, x + 2.05, 0, z + seatDz + 0.2, packColors[(i * 3) % packColors.length], (r() - 0.5) * 0.8);
      bp.rotation.x = -0.15;
    }
  }

  // ---- the hallway outside the door (x 18.5..32)
  put(g, texturedPlane(14, 46, 8, tileDraw('#e6e0d0', '#9fb3c4', 9)), 25.25, 0.01, 7.5);
  box(g, a, [14, 1, 46], [25.25, -0.5, 7.5], 0x9b9b95, 'Concrete', false);
  put(g, texturedPlane(14, 46, 8, ceilingDraw, { up: false, rough: 0.9 }), 25.25, 13, 7.5);
  box(g, a, [15, 0.6, 47], [25.25, 13.31, 7.5], TRIM, 'Plastic');
  box(g, a, [1, 13, 46], [32.5, 6.5, 7.5], 0xe9e2cc, 'Plastic');
  box(g, a, [1, 13, 15.5], [18, 6.5, 22.75], 0xe9e2cc, 'Plastic'); // left wall past the classroom
  box(g, a, [15, 13, 1], [25.25, 6.5, -15.5], 0xe9e2cc, 'Plastic');
  box(g, a, [15, 13, 1], [25.25, 6.5, 30.5], 0xe9e2cc, 'Plastic');
  box(g, a, [0.1, 3.2, 46], [32.0, 1.6, 7.5], 0x7d2f3a, 'Plastic', false);
  box(g, a, [0.1, 3.2, 21.3], [18.55, 1.6, -4.35], 0x7d2f3a, 'Plastic', false);
  box(g, a, [0.1, 3.2, 19.3], [18.55, 1.6, 20.35], 0x7d2f3a, 'Plastic', false);
  for (const z of [-8, 2, 15, 25]) {
    box(g, a, [2.4, 0.06, 5.0], [25.25, 12.8, z], 0xfdfcf2, 'Neon', false);
    box(g, a, [2.8, 0.18, 5.4], [25.25, 12.9, z], TRIM, 'Metal', false);
  }
  put(g, P.lockers(a, 8, 0x1f5fa8), 31.0, 0, -2.5, -Math.PI / 2);
  put(g, P.lockers(a, 7, 0x7d2f3a), 31.0, 0, 19.0, -Math.PI / 2);
  // Trophy case opposite the door.
  const tcase = new THREE.Group();
  box(tcase, a, [1.6, 2.2, 5.4], [0, 1.1, 0], 0x6b4a33, 'Wood');
  box(tcase, a, [1.6, 0.3, 5.4], [0, 6.6, 0], 0x6b4a33, 'Wood');
  for (const z of [-2.6, 2.6]) box(tcase, a, [1.6, 6.75, 0.2], [0, 3.375, z], 0x6b4a33, 'Wood');
  box(tcase, a, [0.15, 4.4, 5.0], [0.75, 4.4, 0], 0x8a1f2b, 'Fabric');
  box(tcase, a, [1.4, 0.12, 5.0], [0, 4.4, 0], 0xe8f6ff, 'Glass', false);
  for (const [y, z, s] of [[2.2, -1.6, 1], [2.2, 0, 1.4], [2.2, 1.6, 0.9], [4.46, -1.2, 0.8], [4.46, 1.0, 1.1]]) {
    tcase.add(cylinder(a, 0.3 * s, 0.25, [0, y + 0.12, z], 0x3b2a1a, 'Wood'));
    tcase.add(cylinder(a, 0.08 * s, 0.6 * s, [0, y + 0.25 + 0.3 * s, z], 0xe2b33c, 'Metal'));
    tcase.add(ball(a, 0.32 * s, [0, y + 0.55 + 0.6 * s, z], 0xe2b33c, 'Metal'));
  }
  tcase.add(part(a, [0.06, 4.4, 5.0], [-0.78, 4.4, 0], 0xe8f6ff, 'Glass', { shadows: false, mat: { opacity: 0.15 } }));
  put(g, tcase, 31.1, 0, 8.5);
  const eagles = decal(10, 1.6, signDraw(['GO EAGLES!'], '#7d2f3a', '#ffd21f', { border: '#ffd21f' }));
  put(g, eagles, 31.95, 10.3, -2.5, -Math.PI / 2);
  const dance = decal(3, 4, signDraw(['SCHOOL', 'DANCE', 'FRI 7PM'], '#6225d1', '#ffffff', { stroke: '#1b2a35' }));
  put(g, dance, 31.95, 9.6, 14.0, -Math.PI / 2);
  const plate204 = decal(1.6, 0.9, signDraw(['204', 'Ms. Parker'], '#1b2a35', '#ffffff'));
  put(g, plate204, 18.56, 6.3, 11.6, Math.PI / 2);
  // Water fountain next to the trophy case.
  box(g, a, [1.4, 1.0, 1.6], [31.3, 3.0, 12.6], 0xc0c4c8, 'Metal');
  box(g, a, [0.4, 2.4, 0.6], [31.6, 1.2, 12.6], 0xc0c4c8, 'Metal');

  // ---- outside the windows: schoolyard, playground, trees, the school's other wing
  box(g, a, [264, 1, 320], [-150, -0.55, 0], BRICK.brightGreen, 'Grass', false);
  box(g, a, [3.5, 0.2, 200], [-21.5, -0.02, 0], 0xb8b5ad, 'Concrete', false);
  for (let z = -60; z <= 60; z += 5) box(g, a, [0.25, 4, 0.25], [-27, 2, z], 0x8d8f94, 'Metal');
  for (const y of [1.2, 3.8]) box(g, a, [0.12, 0.12, 120], [-27, y, 0], 0x8d8f94, 'Metal');
  // Slide.
  const pg = new THREE.Group();
  for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(pg, a, [0.4, 8, 0.4], [x, 4, z], 0x1e88e5, 'Plastic');
  box(pg, a, [4.4, 0.4, 4.4], [0, 5, 0], 0xf5cd30, 'Plastic');
  for (const s of [-1, 1]) {
    const roof = part(a, [4.8, 0.3, 2.8], [0, 8.6, s * 1.1], 0xc4281c, 'Plastic');
    roof.rotation.x = s * 0.55;
    pg.add(roof);
  }
  const slide = part(a, [1.8, 0.2, 8.3], [0, 2.75, 5.5], 0xc4281c, 'Plastic');
  slide.rotation.x = 0.57;
  pg.add(slide);
  for (const s of [-1, 1]) {
    const rail = part(a, [0.2, 0.4, 8.3], [s * 0.95, 3.0, 5.5], 0xc4281c, 'Plastic');
    rail.rotation.x = 0.57;
    pg.add(rail);
  }
  for (let k = 0; k < 6; k++) box(pg, a, [1.6, 0.15, 0.15], [0, 0.8 + k * 0.8, -2.6], 0xf5cd30, 'Plastic');
  for (const s of [-0.85, 0.85]) box(pg, a, [0.15, 5.2, 0.15], [s, 2.6, -2.6], 0x1e88e5, 'Plastic');
  put(g, pg, -40, 0, 2, 0.4);
  // Swings.
  const sw = new THREE.Group();
  for (const z of [-4, 4]) for (const s of [-1, 1]) {
    const leg = part(a, [0.35, 8.4, 0.35], [s * 1.2, 4, z], 0xc4281c, 'Metal');
    leg.rotation.x = 0;
    leg.rotation.z = s * 0.15;
    sw.add(leg);
  }
  box(sw, a, [0.4, 0.4, 8.6], [0, 8.1, 0], 0xc4281c, 'Metal');
  for (const z of [-1.8, 1.8]) {
    for (const s of [-0.6, 0.6]) box(sw, a, [0.06, 6, 0.06], [0, 5.1, z + s], 0x8d8f94, 'Metal', false);
    box(sw, a, [0.8, 0.15, 1.5], [0, 2.1, z], 0x1b2a35, 'Plastic');
  }
  put(g, sw, -38, 0, -16, 0.2);
  // Basketball hoop.
  g.add(cylinder(a, 0.25, 10, [-56, 5, 16], 0x8d8f94, 'Metal'));
  box(g, a, [0.2, 3.2, 4.6], [-55.6, 9.4, 16], 0xffffff, 'Plastic');
  box(g, a, [0.22, 1.2, 1.6], [-55.48, 9.0, 16], 0xc4281c, 'Plastic', false);
  box(g, a, [1.4, 0.12, 1.4], [-54.8, 8.4, 16], 0xff7a1a, 'Metal');
  box(g, a, [26, 0.12, 20], [-56, 0.0, 16], 0x6b6e73, 'Concrete', false);
  for (let k = 0; k < 26; k++) {
    const x = -32 - r() * 70, z = (r() - 0.5) * 150;
    if (x > -64 && Math.abs(z - 2) < 26) continue; // keep the playground clear
    tree(g, a, x, z, 0.9 + r() * 0.6, r);
  }
  // The school's other wing across the yard.
  box(g, a, [22, 20, 140], [-96, 10, 0], 0xa34b3a, 'Brick');
  box(g, a, [23, 1.2, 141], [-96, 20.3, 0], 0xe9e2cc, 'Concrete');
  for (let z = -64; z <= 64; z += 8) for (const y of [5, 13]) {
    box(g, a, [0.3, 4.4, 5], [-84.9, y, z], 0xe9e2cc, 'Concrete', false);
    box(g, a, [0.35, 3.8, 4.4], [-84.85, y, z], 0x7fb4d9, 'Glass', false);
  }

  g.position.copy(o);
  scene.add(bake(g));

  // Ceiling panels light the room and the hallway; sun shafts come in under the blinds.
  for (const x of [-6, 6]) for (const z of [-5.5, 5.5]) fixture([o.x + x, 11.6, o.z + z], { color: 0xfff1de, intensity: 28, distance: 34 });
  for (const z of [-3, 20]) fixture([o.x + 25.25, 11.6, o.z + z], { color: 0xfff1de, intensity: 24, distance: 28 });
  for (const zc of [-8, 0, 8]) scene.add(lightShaft([o.x - 17.9, 5.85, o.z + zc], [0, 0, 2.9], [0, 1.85, 0], [1, -0.62, 0.28], { length: 17 }));

  // The door (not baked: it swings). Pivot on its hinge at z = 6.55; rotation.y > 0 opens it
  // into the hallway.
  const door = new THREE.Group();
  box(door, a, [0.28, 7.4, 3.9], [0, 3.7, 1.97], 0x8a5a3a, 'WoodPlanks');
  box(door, a, [0.32, 2.4, 0.8], [0, 5.1, 2.9], 0x9fd0ef, 'Glass');
  for (const s of [-1, 1]) {
    box(door, a, [0.25, 0.15, 0.7], [s * 0.3, 3.6, 3.35], 0xc0c4c8, 'Metal');
    box(door, a, [0.15, 0.4, 0.15], [s * 0.18, 3.6, 3.6], 0xc0c4c8, 'Metal');
  }
  box(door, a, [0.3, 0.8, 3.9], [0, 0.4, 1.97], 0xc0c4c8, 'Metal');
  door.position.set(o.x + 18, 0, o.z + 6.55);
  scene.add(door);
  return { door };
}

// ---- a teenager's bedroom, at night ---------------------------------------------------

const drawNight = (ctx, w, h) => {
  const r = rng(4);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070b24');
  sky.addColorStop(1, '#25306a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 90; k++) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`;
    const s = r() < 0.1 ? 3 : 1.6;
    ctx.fillRect(r() * w, r() * h * 0.7, s, s);
  }
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.25, h * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d1430';
  ctx.beginPath();
  ctx.arc(w * 0.75, h * 0.22, h * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Rooftops across the street, a few windows still lit.
  ctx.fillStyle = '#0a0e1e';
  for (const [x, bw, bh] of [[0, 0.28, 0.3], [0.26, 0.22, 0.38], [0.5, 0.3, 0.27], [0.78, 0.25, 0.34]]) {
    ctx.fillRect(x * w, h * (1 - bh), bw * w, bh * h);
    ctx.beginPath();
    ctx.moveTo(x * w - 6, h * (1 - bh));
    ctx.lineTo((x + bw / 2) * w, h * (1 - bh - 0.1));
    ctx.lineTo((x + bw) * w + 6, h * (1 - bh));
    ctx.fill();
  }
  ctx.fillStyle = '#ffd36b';
  for (const [x, y] of [[0.08, 0.8], [0.34, 0.72], [0.4, 0.84], [0.6, 0.82], [0.86, 0.76]]) ctx.fillRect(x * w, y * h, w * 0.04, h * 0.05);
};

const drawSpace = (ctx, w, h) => {
  const r = rng(6);
  ctx.fillStyle = '#1a0f3a';
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) {
    ctx.fillStyle = `rgba(255,255,255,${r()})`;
    ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
  for (const [x, y, rad, c] of [[0.35, 0.35, 0.2, '#ff8a3d'], [0.72, 0.62, 0.12, '#4fc3f7'], [0.25, 0.75, 0.07, '#ba68c8']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x * w, y * h, rad * w, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffd180';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0.35 * w, 0.35 * h, 0.32 * w, 0.07 * w, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, 'SPACE', w / 2, h * 0.9, 44, '#ffffff', { align: 'center' });
};

const drawHoops = (ctx, w, h) => {
  ctx.fillStyle = '#ff8a1f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e0640a';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, w * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, w * 0.32, 0, Math.PI * 2);
  ctx.moveTo(w * 0.18, h * 0.42);
  ctx.lineTo(w * 0.82, h * 0.42);
  ctx.moveTo(w / 2, h * 0.42 - w * 0.32);
  ctx.lineTo(w / 2, h * 0.42 + w * 0.32);
  ctx.stroke();
  text(ctx, 'BALL IS LIFE', w / 2, h * 0.86, 30, '#ffffff', { align: 'center', stroke: '#1b1b1b', sw: 6 });
};

const drawGame = (ctx, w, h) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#5ab4ff');
  sky.addColorStop(1, '#bfe6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const blocks = [[0.05, 0.75, 0.2, '#43a047'], [0.32, 0.62, 0.12, '#e53935'], [0.5, 0.52, 0.1, '#fdd835'], [0.66, 0.42, 0.1, '#8e24aa'], [0.82, 0.32, 0.14, '#1e88e5']];
  for (const [x, y, bw, c] of blocks) {
    ctx.fillStyle = c;
    ctx.fillRect(x * w, y * h, bw * w, h * 0.08);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x * w, (y + 0.08) * h, bw * w, h * 0.03);
  }
  ctx.fillStyle = '#f5cd30';
  ctx.fillRect(0.12 * w, 0.6 * h, 0.04 * w, 0.06 * h);
  ctx.fillStyle = '#0d69ac';
  ctx.fillRect(0.115 * w, 0.66 * h, 0.05 * w, 0.06 * h);
  ctx.fillStyle = '#4b974b';
  ctx.fillRect(0.12 * w, 0.72 * h, 0.04 * w, 0.03 * h);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(10, 10, 150, 34);
  text(ctx, 'STAGE 47', 20, 28, 22, '#ffffff');
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(w - 130, 10, 120, 34);
  text(ctx, '1,250', w - 20, 28, 22, '#ffd21f', { align: 'right' });
};

const drawAlarm = (ctx, w, h) => {
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, w, h);
  text(ctx, '9:41', w / 2, h / 2 + 2, h * 0.7, '#ff3b30', { align: 'center' });
};

/**
 * A bedroom at `o`: interior x -12..12, z -10..10, 11 studs high. The bed's headboard is on
 * the back wall (-z) at x = 0 (mattress top 2.2, length z -9.9..-2.5); a gaming desk on the
 * right wall. Returns { lights }: lamp, monitor and LED glow to switch on for night shots.
 */
export function buildBedroom(scene, a, o, { seed = 2 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const mount = mounter(g, 12, 10);
  const WALLC = 0x3d4a6b;

  box(g, a, [24, 1, 20], [0, -0.5, 0], 0x8a5a3a, 'WoodPlanks', false);
  box(g, a, [26, 0.5, 22], [0, 11.25, 0], 0xe9e6f2, 'Plastic', false);
  for (const [size, pos] of [[[26, 11, 1], [0, 5.5, -10.5]], [[26, 11, 1], [0, 5.5, 10.5]], [[1, 11, 22], [-12.5, 5.5, 0]], [[1, 11, 22], [12.5, 5.5, 0]]])
    box(g, a, size, pos, WALLC, 'Plastic', false);
  for (const [size, pos] of [[[24, 0.5, 0.15], [0, 0.25, -9.93]], [[0.15, 0.5, 20], [-11.93, 0.25, 0]], [[0.15, 0.5, 20], [11.93, 0.25, 0]], [[24, 0.5, 0.15], [0, 0.25, 9.93]]])
    box(g, a, size, pos, 0xf2f2f2, 'Plastic', false);
  // LED strip around the top of the walls.
  for (const [size, pos] of [[[24, 0.14, 0.14], [0, 10.7, -9.9]], [[0.14, 0.14, 20], [-11.9, 10.7, 0]], [[0.14, 0.14, 20], [11.9, 10.7, 0]], [[24, 0.14, 0.14], [0, 10.7, 9.9]]])
    box(g, a, size, pos, 0x9b5cff, 'Neon', false);
  g.add(cylinder(a, 1.2, 0.2, [0, 10.9, 0], 0xf4f4f4, 'Plastic'));
  // Round rug.
  g.add(cylinder(a, 3.8, 0.06, [2.5, 0.03, 1], 0x4f4a6e, 'Fabric'));
  g.add(cylinder(a, 2.7, 0.07, [2.5, 0.04, 1], 0x6a6390, 'Fabric'));

  // Bed.
  box(g, a, [4.8, 1.2, 7.4], [0, 0.6, -6.2], 0x4a3426, 'Wood');
  box(g, a, [4.5, 0.9, 7.1], [0, 1.65, -6.2], 0xf4f4f4, 'Fabric');
  box(g, a, [4.65, 0.2, 4.6], [0, 2.15, -4.35], 0x2b3a67, 'Fabric');
  for (const s of [-1, 1]) box(g, a, [0.1, 1.0, 4.6], [s * 2.33, 1.7, -4.35], 0x2b3a67, 'Fabric');
  box(g, a, [4.66, 0.22, 0.8], [0, 2.12, -6.9], 0x34477c, 'Fabric');
  box(g, a, [4.8, 4.2, 0.4], [0, 2.1, -9.95], 0x4a3426, 'Wood');
  box(g, a, [4.2, 2.0, 0.2], [0, 3.4, -9.7], 0x7d7f8c, 'Fabric');
  for (const [x, c] of [[-1.05, 0xfafafa], [1.05, 0xd8dbe6]]) {
    const pil = part(a, [1.8, 0.5, 1.1], [x, 2.4, -9.0], c, 'Fabric');
    pil.rotation.x = -0.25;
    g.add(pil);
  }
  // Plushie at the foot of the bed.
  const plush = 0xa0662f;
  g.add(ball(a, 0.42, [1.5, 2.6, -3.2], plush, 'Fabric'));
  g.add(ball(a, 0.32, [1.5, 3.15, -3.2], plush, 'Fabric'));
  for (const s of [-1, 1]) g.add(ball(a, 0.13, [1.5 + s * 0.24, 3.42, -3.2], plush, 'Fabric'));
  // String lights above the bed.
  for (let k = 0; k < 13; k++) {
    const x = -5 + (k / 12) * 10;
    g.add(ball(a, 0.14, [x, 7.6 - Math.sin((k / 12) * Math.PI) * 0.8, -9.85], [0xffd36b, 0xff8ad8, 0x8ad8ff][k % 3], 'Neon'));
  }
  // Nightstand with lamp and alarm clock.
  box(g, a, [2, 2.4, 1.8], [-3.8, 1.2, -8.8], 0x6b4a33, 'Wood');
  box(g, a, [1.7, 0.8, 0.06], [-3.8, 1.6, -7.88], 0x80583a, 'Wood', false);
  g.add(ball(a, 0.1, [-3.8, 1.6, -7.82], 0xe2b33c, 'Metal'));
  g.add(cylinder(a, 0.35, 0.15, [-4.2, 2.47, -9.1], 0x2a2a2a, 'Metal'));
  g.add(cylinder(a, 0.07, 1.1, [-4.2, 3.0, -9.1], 0x2a2a2a, 'Metal'));
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 0.9, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffe2b8, emissive: 0xffb066, emissiveIntensity: 1.1, side: THREE.DoubleSide }),
  );
  shade.position.set(-4.2, 3.8, -9.1);
  g.add(shade);
  box(g, a, [0.9, 0.5, 0.4], [-3.4, 2.65, -8.4], 0x111111, 'Plastic');
  const alarm = decal(0.8, 0.4, drawAlarm, { ppu: 160, glow: 1.2 });
  put(g, alarm, -3.4, 2.65, -8.19);
  g.add(cylinder(a, 0.18, 0.45, [-3.0, 2.63, -9.3], 0xcfe8ff, 'Glass'));

  // Window with a night view, curtains and a rod.
  box(g, a, [5.6, 4.6, 0.25], [6.5, 6, -9.95], 0xf2f2f2, 'Plastic', false);
  mount(decal(5, 4, drawNight, { glow: 0.9 }), 'back', 6.5, 6, 0.2);
  box(g, a, [0.18, 4, 0.12], [6.5, 6, -9.75], 0xf2f2f2, 'Plastic', false);
  box(g, a, [5, 0.18, 0.12], [6.5, 6, -9.75], 0xf2f2f2, 'Plastic', false);
  box(g, a, [5.8, 0.25, 0.4], [6.5, 3.75, -9.75], 0xf2f2f2, 'Plastic');
  for (const x of [3.3, 9.7]) box(g, a, [1.6, 6.4, 0.3], [x, 5.4, -9.6], 0x5b3f8f, 'Fabric');
  const rod = cylinder(a, 0.08, 8, [6.5, 8.7, -9.55], 0x2a2a2a, 'Metal');
  rod.rotation.z = Math.PI / 2;
  g.add(rod);

  // Posters.
  mount(decal(3, 4, drawSpace), 'back', -7.5, 6.6);
  mount(decal(3, 4, drawHoops), 'left', 5.5, 7.4);

  // Gaming desk on the right wall.
  box(g, a, [2.8, 0.25, 6.2], [10.4, 3.0, -5.5], 0x1b1b1b, 'Plastic');
  for (const z of [-8.4, -2.6]) box(g, a, [2.6, 2.9, 0.25], [10.4, 1.45, z], 0x1b1b1b, 'Plastic');
  box(g, a, [0.06, 0.06, 6.2], [9.0, 3.0, -5.5], 0xff2d55, 'Neon', false);
  box(g, a, [0.2, 2.2, 3.8], [11.3, 4.75, -5.5], 0x111111, 'Plastic');
  const screen = decal(3.6, 2.0, drawGame, { ppu: 100, glow: 1.0 });
  put(g, screen, 11.19, 4.75, -5.5, -Math.PI / 2);
  box(g, a, [0.4, 0.9, 0.4], [11.4, 3.5, -5.5], 0x111111, 'Plastic');
  box(g, a, [1.0, 0.1, 2.3], [10.0, 3.18, -5.5], 0x222222, 'Plastic');
  box(g, a, [1.02, 0.04, 2.32], [10.0, 3.12, -5.5], 0x00e5ff, 'Neon', false);
  box(g, a, [1.6, 0.03, 1.4], [10.0, 3.14, -3.6], 0x1b1b1b, 'Fabric');
  box(g, a, [0.35, 0.12, 0.25], [10.0, 3.2, -3.6], 0xeeeeee, 'Plastic');
  // PC tower with a glowing side, headphones on a stand.
  box(g, a, [1.0, 3.0, 2.2], [10.8, 1.5, -1.1], 0x111111, 'Plastic');
  box(g, a, [0.05, 2.6, 1.9], [10.28, 1.5, -1.1], 0xb04dff, 'Neon', false);
  for (const y of [0.9, 2.1]) {
    const fan = cylinder(a, 0.35, 0.06, [10.25, y, -1.1], 0x00e5ff, 'Neon');
    fan.rotation.z = Math.PI / 2;
    g.add(fan);
  }
  box(g, a, [0.1, 1.1, 0.1], [10.9, 3.65, -7.8], 0x333333, 'Metal');
  box(g, a, [0.5, 0.3, 0.9], [10.9, 4.25, -7.8], 0x222222, 'Plastic');
  // Gaming chair.
  const gc = new THREE.Group();
  box(gc, a, [2, 0.45, 2.1], [0, 1.9, 0], 0x1b1b1b, 'Fabric');
  box(gc, a, [0.4, 3.6, 2.0], [-0.95, 3.9, 0], 0x1b1b1b, 'Fabric');
  box(gc, a, [0.42, 3.0, 0.5], [-0.96, 3.9, 0], 0xff2d55, 'Fabric');
  for (const s of [-1, 1]) box(gc, a, [1.4, 0.2, 0.3], [0, 2.8, s * 1.0], 0x1b1b1b, 'Plastic');
  gc.add(cylinder(a, 0.12, 1.5, [0, 0.95, 0], 0x666666, 'Metal'));
  for (let k = 0; k < 5; k++) {
    const leg = part(a, [0.2, 0.15, 1.3], [Math.sin((k / 5) * Math.PI * 2) * 0.65, 0.25, Math.cos((k / 5) * Math.PI * 2) * 0.65], 0x333333, 'Metal');
    leg.rotation.y = (k / 5) * Math.PI * 2;
    gc.add(leg);
  }
  put(g, gc, 8.2, 0, -5.5, -0.3);
  // Wall shelf above the desk with books and a trophy.
  box(g, a, [1.0, 0.2, 5], [11.45, 7.6, -5.5], 0xf2f2f2, 'Plastic');
  bookRow(g, a, r, { from: -7.8, to: -5.6, y: 7.7, at: 11.4, depth: 0.8, alongZ: true, maxH: 1.1 });
  g.add(cylinder(a, 0.25, 0.25, [11.4, 7.83, -4.4], 0x3b2a1a, 'Wood'));
  g.add(ball(a, 0.3, [11.4, 8.4, -4.4], 0xe2b33c, 'Metal'));

  // Dresser, closet, laundry, shoes, basketball, backpack, door.
  box(g, a, [1.8, 3.4, 4.5], [-11.0, 1.7, 3.2], 0xe8e4dc, 'WoodPlanks');
  for (const y of [0.7, 1.7, 2.7]) {
    box(g, a, [0.06, 0.85, 4.2], [-10.08, y, 3.2], 0xd8d2c6, 'WoodPlanks', false);
    for (const z of [2.2, 4.2]) g.add(ball(a, 0.1, [-10.0, y, z], 0x2a2a2a, 'Metal'));
  }
  box(g, a, [0.3, 1.0, 0.8], [-11.2, 3.9, 2.0], 0x2a2a2a, 'Plastic');
  box(g, a, [0.05, 0.85, 0.65], [-11.04, 3.9, 2.0], 0x9fd0ef, 'Plastic', false);
  g.add(cylinder(a, 0.3, 0.35, [-11.0, 3.57, 4.3], 0xff98dc, 'Plastic'));
  for (const z of [-7.2, -4.6]) {
    box(g, a, [0.25, 7.6, 2.6], [-11.85, 3.8, z], 0xf2f2f2, 'WoodPlanks');
    box(g, a, [0.1, 0.9, 0.1], [-11.68, 3.8, z + (z < -6 ? 1.0 : -1.0)], 0x9a9ea5, 'Metal', false);
  }
  g.add(cylinder(a, 0.9, 1.6, [-9.2, 0.8, -8.6], 0x8d8f94, 'Plastic'));
  for (const [dx, dz, c] of [[0, 0, 0xc4281c], [0.3, -0.3, 0x1e88e5], [-0.3, 0.2, 0xf2f2f2]]) g.add(ball(a, 0.5, [-9.2 + dx, 1.7, -8.6 + dz], c, 'Fabric'));
  for (const dx of [0, 0.85]) {
    box(g, a, [0.7, 0.45, 1.5], [3.2 + dx, 0.22, -1.6], 0xf4f4f4, 'Plastic');
    box(g, a, [0.72, 0.12, 1.52], [3.2 + dx, 0.06, -1.6], 0xff2d55, 'Plastic', false);
  }
  g.add(ball(a, 0.55, [-6.5, 0.55, 4.2], 0xe0702a, 'Plastic'));
  backpack(g, a, 8.4, 0, 0.8, 0x1b2a35, -0.8);
  box(g, a, [0.25, 7.4, 3.6], [11.9, 3.7, 6.5], 0xf2f2f2, 'WoodPlanks');
  g.add(ball(a, 0.15, [11.7, 3.6, 5.2], 0xe2b33c, 'Metal'));

  g.position.copy(o);
  scene.add(bake(g));

  // Night lights (off by default; set .visible for the bedroom's shots). See lighting.js.
  const lamp = fixture([o.x - 4.2, 3.9, o.z - 9.0], { color: 0xffb066, intensity: 45, distance: 26, visible: false });
  const monitor = fixture([o.x + 9.6, 4.8, o.z - 5.5], { color: 0x5aa8ff, intensity: 18, distance: 18, visible: false });
  const led = fixture([o.x, 9.5, o.z - 1], { color: 0xa585ff, intensity: 12, distance: 30, visible: false });
  return { lights: [lamp, monitor, led] };
}

// ---- the front of a school, with the street ---------------------------------------------

const drawSchoolSign = (ctx, w, h) => {
  ctx.fillStyle = '#1b3a6b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ffd21f';
  ctx.lineWidth = h * 0.08;
  ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  P.drawText(ctx, 'MAPLE MIDDLE SCHOOL', w / 2, h * 0.52, w * 0.9, h * 0.55, { color: '#ffffff' });
};

const drawWelcome = (ctx, w, h) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
  const txt = 'HAVE A GREAT DAY!';
  ctx.font = `${h * 0.62}px ${FONT}`;
  ctx.textBaseline = 'middle';
  let x = (w - ctx.measureText(txt).width) / 2;
  [...txt].forEach((c, i) => {
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillText(c, x, h * 0.54);
    x += ctx.measureText(c).width;
  });
};

const drawMarquee = (ctx, w, h) => {
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(w * 0.04, h * 0.1, w * 0.92, h * 0.8);
  const lines = ['WELCOME BACK', 'STUDENTS!', 'PICTURE DAY FRI'];
  lines.forEach((l, i) => P.drawText(ctx, l, w / 2, h * (0.28 + i * 0.25), w * 0.82, h * 0.2, { color: '#1b1b1b' }));
};

/**
 * The front of a school at `o`. The street runs along x: road z 8..22 (cars drive at
 * z ≈ 11.8 heading -x, nearest the school), curb at z = 8, sidewalk z 0..8, lawn z -12..0,
 * the building's front wall at z = -14 (x -50..50) with the entrance at x = 0.
 */
export function buildSchoolFront(scene, a, o, { seed = 4 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const BR = 0xa34b3a;
  const STONE = 0xe9e2cc;

  // Ground: lawn, sidewalk, curb, road with markings, the far sidewalk and yards.
  box(g, a, [400, 1, 300], [0, -0.6, -60], BRICK.brightGreen, 'Grass', false);
  box(g, a, [400, 0.3, 8], [0, 0.15, 4], 0xc9c6bd, 'Concrete', false);
  for (let x = -198; x < 200; x += 6) box(g, a, [0.08, 0.31, 8], [x, 0.16, 4], 0x9c9a92, 'Concrete', false);
  box(g, a, [400, 0.45, 0.6], [0, 0.22, 8.2], 0xb3b0a6, 'Concrete', false);
  box(g, a, [400, 0.1, 14], [0, 0.05, 15.2], 0x3a3d42, 'Concrete', false);
  for (let x = -196; x < 200; x += 8) box(g, a, [4, 0.12, 0.3], [x, 0.06, 15.2], 0xf5cd30, 'Plastic', false);
  box(g, a, [400, 0.12, 0.25], [0, 0.06, 8.9], 0xf2f2f2, 'Plastic', false);
  box(g, a, [400, 0.12, 0.25], [0, 0.06, 21.6], 0xf2f2f2, 'Plastic', false);
  for (let k = 0; k < 8; k++) box(g, a, [1.2, 0.13, 12.4], [34 + k * 2.2, 0.07, 15.2], 0xf2f2f2, 'Plastic', false); // crosswalk
  box(g, a, [400, 0.45, 0.6], [0, 0.22, 22.2], 0xb3b0a6, 'Concrete', false);
  box(g, a, [400, 0.3, 6], [0, 0.15, 25.4], 0xc9c6bd, 'Concrete', false);
  box(g, a, [4, 0.1, 6], [0, 0.32, -8], 0xc9c6bd, 'Concrete', false);

  // The building: two floors of brick with stone trim, the entrance block in the middle.
  box(g, a, [100, 22, 30], [0, 11, -29], BR, 'Brick');
  box(g, a, [101, 1.2, 31], [0, 22.6, -29], STONE, 'Concrete');
  box(g, a, [100.4, 0.8, 0.6], [0, 11, -13.9], STONE, 'Concrete', false);
  box(g, a, [100.4, 1.2, 0.6], [0, 0.6, -13.9], STONE, 'Concrete', false);
  for (let x = -46; x <= 46; x += 6.5) {
    if (Math.abs(x) < 12) continue;
    for (const y of [5.6, 16.2]) {
      box(g, a, [4.6, 5.2, 0.4], [x, y, -13.9], STONE, 'Concrete', false);
      box(g, a, [4.0, 4.6, 0.45], [x, y, -13.88], 0x6fa8d6, 'Glass', false);
      box(g, a, [0.18, 4.6, 0.5], [x, y, -13.86], STONE, 'Concrete', false);
      box(g, a, [4.0, 0.18, 0.5], [x, y + 0.6, -13.86], STONE, 'Concrete', false);
      box(g, a, [5.0, 0.35, 0.9], [x, y - 2.75, -13.6], STONE, 'Concrete', false);
    }
  }
  // Entrance block, columns, glass doors, steps, sign, clock.
  box(g, a, [24, 26, 6], [0, 13, -14], 0xb85a45, 'Brick');
  box(g, a, [25, 1.4, 7], [0, 26.7, -14], STONE, 'Concrete');
  box(g, a, [26, 0.8, 8], [0, 20.4, -8.5], STONE, 'Concrete');
  for (const x of [-10, -5.5, 5.5, 10]) {
    g.add(cylinder(a, 0.75, 19.4, [x, 10.4, -5.5], STONE, 'Concrete'));
    box(g, a, [2, 0.6, 2], [x, 0.9, -5.5], STONE, 'Concrete');
    box(g, a, [2, 0.6, 2], [x, 19.8, -5.5], STONE, 'Concrete');
  }
  box(g, a, [8.4, 8.6, 0.4], [0, 4.9, -10.85], 0x2a2f36, 'Metal');
  for (const x of [-2, 2]) {
    box(g, a, [3.6, 7.6, 0.2], [x, 4.4, -10.6], 0x9fd0ef, 'Glass', false);
    box(g, a, [0.2, 2.4, 0.3], [x > 0 ? 0.5 : -0.5, 4.2, -10.4], 0xc0c4c8, 'Metal', false);
  }
  box(g, a, [0.3, 7.8, 0.35], [0, 4.4, -10.55], 0x2a2f36, 'Metal', false);
  for (let k = 0; k < 3; k++) box(g, a, [14, 0.4, 2.2], [0, 0.2 + k * 0.4, -8.4 - k * 0.7], STONE, 'Concrete');
  for (const x of [-7.2, 7.2]) box(g, a, [0.2, 3.2, 0.2], [x, 2.6, -8.2], 0xc0c4c8, 'Metal');
  const sign = decal(18, 2.6, drawSchoolSign);
  put(g, sign, 0, 15.2, -10.9);
  const clockRim = cylinder(a, 1.8, 0.4, [0, 22.5, -10.85], STONE, 'Concrete');
  clockRim.rotation.x = Math.PI / 2;
  g.add(clockRim);
  put(g, decal(3.2, 3.2, drawClock, { ppu: 80, alpha: true }), 0, 22.5, -10.6);
  put(g, decal(14, 1.5, drawWelcome), -32, 11.0, -13.55);
  // Flagpole with a school flag, the marquee sign, bike rack, benches, trash, hedges, trees.
  g.add(cylinder(a, 0.18, 24, [18, 12, -3], 0xc0c4c8, 'Metal'));
  g.add(ball(a, 0.35, [18, 24.2, -3], 0xe2b33c, 'Metal'));
  g.add(cylinder(a, 1.4, 0.6, [18, 0.3, -3], STONE, 'Concrete'));
  const flag = decal(5, 3, (ctx, w, h) => {
    ctx.fillStyle = '#1b3a6b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd21f';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? h * 0.14 : h * 0.34;
      const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(w / 2 + Math.cos(ang) * rr, h / 2 + Math.sin(ang) * rr);
    }
    ctx.fill();
  });
  flag.material.side = THREE.DoubleSide;
  put(g, flag, 20.6, 22, -3);
  const mq = new THREE.Group();
  box(mq, a, [9, 1.4, 1.4], [0, 0.7, 0], 0xb85a45, 'Brick');
  for (const x of [-4, 4]) box(mq, a, [1, 6, 1.2], [x, 3, 0], 0xb85a45, 'Brick');
  box(mq, a, [7.4, 4.2, 0.8], [0, 4, 0], 0x111111, 'Plastic');
  put(mq, decal(7, 3.8, drawMarquee, { ppu: 48, glow: 0.25 }), 0, 4, 0.42);
  box(mq, a, [9.4, 0.6, 1.6], [0, 6.3, 0], STONE, 'Concrete');
  put(g, mq, -20, 0, -4, 0.15);
  for (let k = 0; k < 6; k++) {
    const x = 10 + k * 1.2;
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 20, Math.PI), robloxMaterial(a, 0x8d8f94, 'Metal'));
    hoop.position.set(x, 0.3, 2);
    hoop.rotation.y = Math.PI / 2;
    hoop.castShadow = true;
    g.add(hoop);
  }
  const bike = (x, z, c) => {
    for (const dz of [-0.9, 0.9]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 8, 20), robloxMaterial(a, 0x1b1b1b, 'Plastic'));
      wheel.position.set(x, 0.9, z + dz);
      wheel.rotation.y = Math.PI / 2;
      g.add(wheel);
    }
    box(g, a, [0.12, 0.12, 1.9], [x, 1.25, z], c, 'Metal');
    box(g, a, [0.12, 0.9, 0.12], [x, 1.35, z - 0.3], c, 'Metal');
    box(g, a, [0.3, 0.12, 0.6], [x, 1.85, z - 0.3], 0x1b1b1b, 'Plastic');
    box(g, a, [0.9, 0.1, 0.1], [x, 1.9, z + 0.8], 0x1b1b1b, 'Metal');
  };
  bike(11.2, 2, 0xc4281c);
  bike(13.6, 2, 0x1e88e5);
  bike(16.0, 2, 0x43a047);
  for (const x of [-12, 26]) {
    box(g, a, [5, 0.3, 1.4], [x, 1.6, -1.2], 0x8a5a3a, 'Wood');
    box(g, a, [5, 1.2, 0.25], [x, 2.4, -1.85], 0x8a5a3a, 'Wood');
    for (const dx of [-2.1, 2.1]) box(g, a, [0.25, 1.6, 1.4], [x + dx, 0.8, -1.2], 0x2a2a2a, 'Metal');
  }
  g.add(cylinder(a, 0.7, 2.4, [-7, 1.2, 1.2], 0x2f6b3a, 'Metal'));
  g.add(cylinder(a, 0.7, 2.4, [-31, 1.2, 1.2], 0x2f6b3a, 'Metal'));
  for (let x = -48; x <= 48; x += 3.2) {
    if (Math.abs(x) < 14) continue;
    const h = ball(a, 1.6, [x, 1.0, -12.4], 0x2f7a35, 'Grass');
    h.scale.set(1, 0.75, 0.8);
    g.add(h);
  }
  for (const x of [-42, -30, 30, 42]) tree(g, a, x, -6, 1.1, r);
  for (const x of [-60, -52, 56, 64]) tree(g, a, x, -2, 1.2, r);
  // Street lamps and a school-zone sign.
  for (const x of [-36, 36]) {
    g.add(cylinder(a, 0.22, 13, [x, 6.5, 7.2], 0x3b3f45, 'Metal'));
    box(g, a, [0.3, 0.3, 2.6], [x, 12.9, 8.4], 0x3b3f45, 'Metal');
    box(g, a, [1, 0.5, 1.4], [x, 12.6, 9.6], 0x3b3f45, 'Metal');
    box(g, a, [0.8, 0.1, 1.1], [x, 12.33, 9.6], 0xfff3c4, 'Neon', false);
  }
  g.add(cylinder(a, 0.1, 7, [28, 3.5, 7.0], 0x8d8f94, 'Metal'));
  const zone = decal(2.4, 2.8, signDraw(['SCHOOL', 'ZONE', '20 MPH'], '#f5e400', '#111111', { border: '#111111' }));
  zone.material.side = THREE.DoubleSide;
  put(g, zone, 28, 6.0, 7.12, Math.PI / 4);
  // Across the street: houses, fences and trees (seen behind the truck).
  const houses = [[-70, 0xd9c7a0, 0x7c2f2f], [-40, 0x9fc4d8, 0x3b3f45], [-10, 0xf2efe6, 0x2f5f8a], [20, 0xe7b8a5, 0x5a3a2a], [50, 0xc9d8a8, 0x7c2f2f], [80, 0xf2d58a, 0x3b3f45]];
  for (const [x, wall, roof] of houses) {
    box(g, a, [18, 11, 12], [x, 5.5, 44], wall, 'Plastic');
    for (const s of [-1, 1]) {
      const rf = part(a, [19, 0.6, 7.6], [x, 13.2, 44 + s * 3.1], roof, 'Slate');
      rf.rotation.x = s * 0.62;
      g.add(rf);
    }
    box(g, a, [3, 6.5, 0.3], [x, 3.25, 37.9], 0x8a5a3a, 'WoodPlanks');
    for (const dx of [-5.5, 5.5]) {
      box(g, a, [3.4, 3, 0.3], [x + dx, 6, 37.9], 0x9fd0ef, 'Glass', false);
      box(g, a, [3.8, 0.3, 0.6], [x + dx, 4.35, 37.8], 0xf2f2f2, 'Plastic', false);
    }
    for (let k = -4; k <= 4; k++) if (Math.abs(k) > 0) box(g, a, [0.3, 2.4, 0.3], [x + k * 2, 1.2, 30], 0xf2f2f2, 'WoodPlanks');
    box(g, a, [17, 0.3, 0.2], [x, 1.9, 30], 0xf2f2f2, 'WoodPlanks');
    tree(g, a, x + 12, 34, 1.0, r);
  }
  // A school bus parked down the street.
  put(g, P.schoolBus(a), -42, 0, 12.0, Math.PI);

  g.position.copy(o);
  scene.add(bake(g));
  return {};
}

// ---- an ice cream truck ---------------------------------------------------------------

const drawTruckSide = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  P.drawText(ctx, 'ICE CREAM', w / 2, h * 0.55, w * 0.95, h * 0.9, { color: '#ff4d8d', stroke: '#ffffff', strokeW: h * 0.16 });
};

const drawMenu = (ctx, w, h) => {
  ctx.fillStyle = '#fff8e7';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ff4d8d';
  ctx.fillRect(0, 0, w, h * 0.16);
  text(ctx, 'MENU', w / 2, h * 0.09, h * 0.11, '#ffffff', { align: 'center' });
  const items = [['Cone', '$2', '#f7c6d9'], ['Popsicle', '$1', '#ff8a65'], ['Sundae', '$4', '#8d6e63'], ['Rocket Pop', '$3', '#4fc3f7'], ['Sandwich', '$3', '#5d4037']];
  items.forEach(([n, p, c], i) => {
    const y = h * (0.26 + i * 0.155);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(w * 0.14, y, h * 0.05, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, n, w * 0.24, y, h * 0.075, '#3b2a1a');
    text(ctx, p, w * 0.92, y, h * 0.08, '#c4281c', { align: 'right' });
  });
};

const drawCones = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const scoops = ['#f7c6d9', '#fff3c4', '#8d6e63', '#a5d6a7'];
  scoops.forEach((c, i) => {
    const x = w * (0.12 + i * 0.25);
    ctx.fillStyle = '#e0a458';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.07, h * 0.45);
    ctx.lineTo(x + w * 0.07, h * 0.45);
    ctx.lineTo(x, h * 0.95);
    ctx.fill();
    ctx.strokeStyle = '#b07a3a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, h * 0.38, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(x + w * 0.02, h * 0.14, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
  });
};

/**
 * An ice cream truck facing +x (16 long, 7 wide), its serving window on the right (+z)
 * side at x -4..2, sill at y 4.4, floor inside at y 1.9 — a vendor stands inside at about
 * (-1, 1.9, 2). Returns { root, panes, wheels }: slide the panes' position.x by up to -3.6
 * to open the window, spin the wheels about z.
 */
export function iceCreamTruck(a) {
  const root = new THREE.Group();
  const g = new THREE.Group();
  const W = 0xfafafa;
  const PINK = 0xff6fa8;
  const BLUE = 0x7cc8f2;
  const side = (z, sign) => {
    // A side wall of the box body; the +z side has the window opening.
    if (sign > 0) {
      box(g, a, [12.4, 2.9, 0.2], [-1.8, 2.95, z], W, 'Metal');
      box(g, a, [12.4, 2.3, 0.2], [-1.8, 8.35, z], W, 'Metal');
      box(g, a, [4, 2.8, 0.2], [-6, 5.8, z], W, 'Metal');
      box(g, a, [2.4, 2.8, 0.2], [3.2, 5.8, z], W, 'Metal');
    } else {
      box(g, a, [12.4, 8, 0.2], [-1.8, 5.5, z], W, 'Metal');
    }
    box(g, a, [12.42, 0.8, 0.24], [-1.8, 3.0, z], PINK, 'Plastic', false);
    box(g, a, [12.42, 0.3, 0.24], [-1.8, 3.6, z], BLUE, 'Plastic', false);
    box(g, a, [12.42, 0.5, 0.24], [-1.8, 9.25, z], PINK, 'Plastic', false);
    const lettering = decal(9.5, 1.5, drawTruckSide, { alpha: true });
    put(g, lettering, -2.2, 8.3, z + sign * 0.13, sign > 0 ? 0 : Math.PI);
    const cones = decal(sign > 0 ? 3.6 : 8, 2.4, drawCones, { alpha: true });
    put(g, cones, sign > 0 ? -6 : -1.8, 5.9, z + sign * 0.13, sign > 0 ? 0 : Math.PI);
  };
  side(3.5, 1);
  side(-3.5, -1);
  box(g, a, [12.4, 0.3, 7.2], [-1.8, 9.65, 0], W, 'Metal');
  box(g, a, [0.2, 8, 7], [-8, 5.5, 0], W, 'Metal');
  box(g, a, [12, 0.4, 6.8], [-1.8, 1.7, 0], 0x6b6e73, 'Metal');
  // Back: doors, bumper, tail lights.
  box(g, a, [0.1, 6.4, 0.12], [-8.12, 5.0, 0], 0xc0c4c8, 'Metal', false);
  for (const z of [-2.6, 2.6]) box(g, a, [0.15, 0.8, 0.6], [-8.1, 2.6, z], 0xd50000, 'Neon', false);
  box(g, a, [0.6, 0.6, 7.2], [-8.3, 1.3, 0], 0xc0c4c8, 'Metal');
  // Chassis, wheels.
  box(g, a, [15.6, 0.7, 6.2], [0, 1.15, 0], 0x2a2a2a, 'Metal');
  const wheels = [];
  for (const [x, z] of [[-5, 3.15], [-5, -3.15], [5, 3.15], [5, -3.15]]) {
    const wg = new THREE.Group();
    const tire = cylinder(a, 1.15, 0.8, [0, 0, 0], 0x1b1b1b, 'Plastic');
    tire.rotation.x = Math.PI / 2;
    wg.add(tire);
    const hub = cylinder(a, 0.55, 0.84, [0, 0, 0], 0xc0c4c8, 'Metal');
    hub.rotation.x = Math.PI / 2;
    wg.add(hub);
    box(wg, a, [0.25, 0.9, 0.86], [0, 0, 0], 0x8d8f94, 'Metal', false);
    wg.position.set(x, 1.15, z);
    root.add(wg);
    wheels.push(wg);
    box(g, a, [2.8, 0.4, 0.5], [x, 2.35, z > 0 ? 3.3 : -3.3], 0x2a2a2a, 'Plastic', false); // fender
  }
  // Cab.
  box(g, a, [3.6, 3.1, 6.8], [6.2, 2.9, 0], W, 'Metal');
  box(g, a, [2.9, 2.8, 6.8], [5.85, 5.85, 0], W, 'Metal');
  box(g, a, [0.12, 2.2, 6.2], [7.32, 5.9, 0], 0x9fd0ef, 'Glass', false);
  for (const z of [-3.42, 3.42]) {
    box(g, a, [2.0, 1.9, 0.08], [5.9, 6.0, z], 0x9fd0ef, 'Glass', false);
    box(g, a, [0.15, 0.15, 0.9], [7.4, 5.6, z * 1.08], 0x1b1b1b, 'Plastic', false);
    box(g, a, [0.12, 0.8, 0.5], [7.45, 5.6, z * 1.2], 0x1b1b1b, 'Plastic', false);
    box(g, a, [0.12, 0.2, 0.7], [6.0, 3.9, z * 1.02], 0x8d8f94, 'Metal', false);
  }
  box(g, a, [3.0, 0.4, 7.0], [5.85, 7.4, 0], PINK, 'Plastic');
  box(g, a, [0.4, 1.2, 6.4], [8.1, 2.0, 0], 0xc0c4c8, 'Metal');
  box(g, a, [0.15, 1.4, 3.4], [8.05, 3.6, 0], 0x5d6066, 'Metal', false);
  for (const z of [-2.5, 2.5]) {
    box(g, a, [0.2, 0.7, 1.0], [8.05, 3.5, z], 0xfff3c4, 'Neon', false);
    box(g, a, [0.2, 0.25, 0.6], [8.05, 2.75, z], 0xffa000, 'Neon', false);
  }
  // Inside: freezers, a menu board, lights.
  box(g, a, [9, 2.8, 2.2], [-2.5, 3.3, -2.2], 0xdfe6ea, 'Metal');
  for (let x = -6; x <= 1; x += 1.8) box(g, a, [1.6, 0.06, 2.0], [x, 4.73, -2.2], 0x9fd0ef, 'Glass', false);
  box(g, a, [12, 7.6, 0.1], [-1.8, 5.5, -3.35], 0x9fb3c4, 'Plastic', false);
  box(g, a, [10, 0.1, 0.4], [-2, 9.4, 0], 0xfdfcf2, 'Neon', false);
  box(g, a, [0.1, 7.6, 6.8], [-7.85, 5.5, 0], 0x9fb3c4, 'Plastic', false);
  box(g, a, [0.1, 7.6, 6.8], [4.3, 5.5, 0], 0x9fb3c4, 'Plastic', false);
  // Window counter, awning and the menu.
  box(g, a, [6.6, 0.25, 1.2], [-1, 4.35, 3.85], 0xc0c4c8, 'Metal');
  box(g, a, [6.4, 0.25, 0.8], [-1, 4.35, 3.0], 0xc0c4c8, 'Metal');
  for (let k = 0; k < 7; k++) {
    const st = part(a, [1.0, 0.15, 2.0], [-4.0 + k * 1.0, 7.7, 4.3], k % 2 ? 0xffffff : PINK, 'Fabric');
    st.rotation.x = 0.32;
    g.add(st);
  }
  const menu = decal(2.3, 2.6, drawMenu);
  put(g, menu, 3.1, 5.8, 3.62);
  // On the roof: a giant cone and a loudspeaker.
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.08, 2.8, 16), robloxMaterial(a, 0xe0a458, 'WoodPlanks'));
  cone.position.set(-3.5, 11.2, 0);
  cone.castShadow = true;
  g.add(cone);
  g.add(ball(a, 1.2, [-3.5, 12.9, 0], 0xf7c6d9, 'Plastic'));
  g.add(ball(a, 0.85, [-3.5, 14.0, 0], 0x8d6e63, 'Plastic'));
  g.add(ball(a, 0.3, [-3.4, 14.9, 0], 0xe53935, 'Plastic'));
  box(g, a, [0.4, 1.2, 0.4], [-3.5, 10.2, 0], 0x8d8f94, 'Metal');
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 1.4, 16), robloxMaterial(a, 0xc0c4c8, 'Metal'));
  horn.rotation.z = -Math.PI / 2;
  horn.position.set(2.5, 10.5, 0);
  g.add(horn);
  box(g, a, [0.6, 0.6, 0.6], [1.6, 10.1, 0], 0x8d8f94, 'Metal');

  // The window panes (not baked: they slide).
  const panes = [];
  for (const [x, z] of [[-2.5, 3.3], [0.5, 3.2]]) {
    const pane = new THREE.Group();
    pane.add(part(a, [3.0, 2.8, 0.08], [0, 5.8, 0], 0xb8d4e6, 'Glass', { shadows: false, mat: { opacity: 0.72 } }));
    box(pane, a, [3.0, 0.12, 0.12], [0, 7.15, 0], 0xc0c4c8, 'Metal', false);
    box(pane, a, [3.0, 0.12, 0.12], [0, 4.45, 0], 0xc0c4c8, 'Metal', false);
    box(pane, a, [0.12, 2.8, 0.12], [-1.45, 5.8, 0], 0xc0c4c8, 'Metal', false);
    box(pane, a, [0.12, 2.8, 0.12], [1.45, 5.8, 0], 0xc0c4c8, 'Metal', false);
    pane.position.set(x, 0, z);
    pane.userData.home = x;
    root.add(pane);
    panes.push(pane);
  }
  // Bake the static body in the truck's own frame, so the whole truck can drive.
  const baked = bake(g);
  root.add(baked);
  return { root, panes, wheels };
}

// ---- the school gym, set up for an assembly -------------------------------------------

const courtDraw = (ctx, w, h) => {
  // Maple boards; the court lines are added as parts.
  const r = rng(17);
  ctx.fillStyle = '#d9a86a';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    ctx.fillStyle = `rgba(${120 + r() * 40},${70 + r() * 30},20,${0.1 + r() * 0.12})`;
    ctx.fillRect(0, y, w, 15);
    ctx.fillStyle = 'rgba(70,40,10,0.25)';
    ctx.fillRect(0, y + 15, w, 1);
    for (let k = 0; k < 3; k++) ctx.fillRect(r() * w, y, 1.5, 15);
  }
  for (let k = 0; k < 600; k++) {
    ctx.fillStyle = `rgba(255,240,210,${r() * 0.12})`;
    ctx.fillRect(r() * w, r() * h, 6 + r() * 20, 1);
  }
};

/**
 * A school gym at `o` set up for an assembly: interior x -30..30, z -22..22, 22 high. The
 * stage is at the back (-z): x -15..15, z -22..-12, top at y 3, with steps at x ±9 on its
 * front. Bleachers line both side walls (rows at x ±21..±28, facing the middle); the middle
 * floor is open for folding chairs. High windows on the left wall (-x) let the sun in.
 * Returns { stageTop: 3, stageFront: -12 }.
 */
export function buildGym(scene, a, o, { seed = 9 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const mount = mounter(g, 30, 22);
  const BLOCK = 0xe8e2d2;
  const BLUE = 0x1f4f9a;
  const GOLD = 0xf2b632;

  // Floor and court lines.
  box(g, a, [61, 1, 45], [0, -0.5, 0], 0x9b9b95, 'Concrete', false);
  put(g, texturedPlane(60, 44, 10, courtDraw, { rough: 0.35 }), 0, 0.01, 0);
  const line = (size, pos, c = 0xffffff) => box(g, a, size, [pos[0], 0.03, pos[1]], c, 'SmoothPlastic', false);
  line([0.25, 0.04, 36], [0, 0]);
  line([50, 0.04, 0.25], [0, 18]);
  line([50, 0.04, 0.25], [0, -18 + 6]);
  for (const x of [-25, 25]) line([0.25, 0.04, 30], [x, 3]);
  g.add(cylinder(a, 5, 0.04, [0, 0.025, 3], BLUE, 'SmoothPlastic'));
  g.add(cylinder(a, 4.75, 0.05, [0, 0.03, 3], 0xd9a86a, 'Wood'));
  g.add(cylinder(a, 1.6, 0.06, [0, 0.035, 3], GOLD, 'SmoothPlastic'));

  // Walls: painted block with a blue band, roof with steel trusses.
  const wall = (size, pos, c = BLOCK) => box(g, a, size, pos, c, 'Brick');
  wall([62, 22, 1], [0, 11, -22.5]);
  wall([62, 22, 1], [0, 11, 22.5]);
  wall([1, 22, 45], [30.5, 11, 0]);
  // Left wall with a row of high windows (y 14..19).
  wall([1, 14, 45], [-30.5, 7, 0]);
  wall([1, 3, 45], [-30.5, 20.5, 0]);
  for (const z of [-21, -10.5, 0, 10.5, 21]) wall([1, 5, 3], [-30.5, 16.5, z]);
  for (const zc of [-15.75, -5.25, 5.25, 15.75]) {
    g.add(part(a, [0.1, 5, 7.5], [-30.5, 16.5, zc], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.2 } }));
    box(g, a, [0.4, 0.3, 7.5], [-30.3, 16.5, zc], 0x8d8f94, 'Metal');
    box(g, a, [0.4, 5, 0.3], [-30.3, 16.5, zc], 0x8d8f94, 'Metal');
  }
  for (const [size, pos] of [[[60, 2.4, 0.2], [0, 1.2, 21.95]], [[0.2, 2.4, 44], [29.95, 1.2, 0]], [[0.2, 2.4, 44], [-29.95, 1.2, 0]]]) box(g, a, size, pos, BLUE, 'SmoothPlastic', false);
  box(g, a, [62, 0.6, 45], [0, 22.3, 0], 0x8d8f94, 'Metal');
  put(g, texturedPlane(60, 44, 12, ceilingDraw, { up: false, rough: 0.9 }), 0, 22, 0);
  for (const z of [-15, -5, 5, 15]) {
    box(g, a, [60, 0.6, 0.6], [0, 20.6, z], 0x5d6066, 'Metal', false);
    box(g, a, [60, 0.3, 0.3], [0, 18.8, z], 0x5d6066, 'Metal', false);
    for (let x = -27; x <= 27; x += 6) {
      const strut = box(g, a, [0.25, 2.4, 0.25], [x, 19.7, z], 0x5d6066, 'Metal', false);
      strut.rotation.z = 0.6;
    }
  }
  // High-bay lights.
  for (const x of [-18, -6, 6, 18])
    for (const z of [-8, 8]) {
      g.add(cylinder(a, 1.1, 0.9, [x, 18.2, z], 0x5d6066, 'Metal'));
      g.add(cylinder(a, 0.9, 0.08, [x, 17.72, z], 0xfff6e0, 'Neon'));
      box(g, a, [0.1, 2.0, 0.1], [x, 19.4, z], 0x3a3a3a, 'Metal', false);
    }

  // Stage with curtains, a valance and a banner.
  const ST = 0x6b4a33;
  box(g, a, [30, 3, 10], [0, 1.5, -17], ST, 'WoodPlanks');
  box(g, a, [30.2, 0.3, 0.3], [0, 2.95, -12], 0x2a2a2a, 'Plastic');
  box(g, a, [30, 2.7, 0.2], [0, 1.35, -11.95], 0x4f3626, 'WoodPlanks');
  for (const x of [-9, 9])
    for (let k = 0; k < 3; k++) {
      const sh = 0.75 * (k + 1);
      box(g, a, [3, sh, 1.2], [x, sh / 2, -11.4 + (2 - k) * 1.2], ST, 'WoodPlanks');
    }
  const RED = 0x8f1d24;
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) box(g, a, [0.9, 16, 0.7], [s * (12 + k * 0.85), 11, -12.6 - (k % 2) * 0.25], k % 2 ? RED : 0x7a161d, 'Fabric');
    box(g, a, [1.6, 22, 1.6], [s * 15.8, 11, -12.4], BLOCK, 'Brick');
  }
  for (let k = 0; k < 28; k++) box(g, a, [1.0, 2.2, 0.6], [-13.5 + k, 18.1, -12.3 - (k % 2) * 0.2], k % 2 ? RED : 0x7a161d, 'Fabric');
  box(g, a, [30, 0.4, 0.8], [0, 19.4, -12.4], GOLD, 'Fabric');
  box(g, a, [28, 15, 0.4], [0, 10.5, -21.8], 0x3b0f14, 'Fabric');
  mount(decal(16, 3, (ctx, w, h) => {
    ctx.fillStyle = '#1f4f9a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f2b632';
    ctx.lineWidth = h * 0.08;
    ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
    P.drawText(ctx, 'MAPLE MIDDLE SCHOOL ASSEMBLY', w / 2, h * 0.58, w * 0.9, h * 0.42, { color: '#ffffff', font: FONT });
  }), 'back', 0, 15.6, 0.7);
  // Stage footlights.
  for (let x = -13; x <= 13; x += 2.6) box(g, a, [0.5, 0.3, 0.4], [x, 3.15, -12.5], 0xfff3c4, 'Neon', false);

  // Bleachers along both side walls, facing the middle.
  for (const s of [-1, 1])
    for (let row = 0; row < 4; row++) {
      const x = s * (21.5 + row * 2.2);
      const h = 1.1 + row * 1.1;
      box(g, a, [2.2, h, 30], [x, h / 2, 2], 0x8d8f94, 'Metal');
      box(g, a, [1.9, 0.25, 30], [x, h + 0.12, 2], 0xc49a6c, 'WoodPlanks');
      box(g, a, [0.2, 0.9, 30], [x + s * 1.0, h - 0.4, 2], 0x5d6066, 'Metal', false);
    }
  // Pennants and banners.
  const pennants = [['GO EAGLES', '#1f4f9a', '#f2b632'], ['STATE CHAMPS', '#8f1d24', '#ffffff'], ['READ MORE!', '#2f7d3a', '#ffffff'], ['BE KIND', '#f2b632', '#1f4f9a']];
  pennants.forEach(([text, bg, fg], i) =>
    mount(decal(7, 2.6, (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(0, h);
      ctx.fill();
      P.drawText(ctx, text, w * 0.38, h * 0.56, w * 0.62, h * 0.28, { color: fg, font: FONT });
    }, { alpha: true }), 'right', -14 + i * 9, 14.5));
  // Scoreboard on the front wall.
  const board = new THREE.Group();
  box(board, a, [12, 5, 0.6], [0, 0, 0], 0x1b1b1b, 'Plastic');
  board.add(decal(11.4, 4.4, (ctx, w, h) => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    P.drawText(ctx, 'HOME  42', w * 0.25, h * 0.45, w * 0.4, h * 0.28, { color: '#ff5a3c', font: FONT });
    P.drawText(ctx, 'GUEST  38', w * 0.75, h * 0.45, w * 0.4, h * 0.28, { color: '#ff5a3c', font: FONT });
    P.drawText(ctx, 'EAGLES', w / 2, h * 0.82, w * 0.5, h * 0.18, { color: '#f2b632', font: FONT });
  }, { glow: 0.8 }));
  board.children.at(-1).position.z = 0.32;
  board.rotation.y = Math.PI;
  board.position.set(0, 15, 21.6);
  g.add(board);
  // Retracted hoops near the ceiling, double doors, a trophy shelf, clutter.
  for (const s of [-1, 1]) {
    box(g, a, [0.3, 3.6, 6], [s * 26, 16.5, 3], 0xf4f4f4, 'Plastic');
    box(g, a, [0.35, 1.4, 2], [s * 26, 15.6, 3], 0xc4281c, 'Plastic', false);
    box(g, a, [3, 0.2, 0.2], [s * 27.5, 18.5, 3], 0x5d6066, 'Metal', false);
  }
  for (const x of [-4, 4]) {
    box(g, a, [7.6, 9, 0.4], [x * 1.0, 4.5, 22.1], 0x1f4f9a, 'Metal');
    box(g, a, [0.3, 0.4, 2.2], [x * 0.25, 4.2, 21.8], 0xc0c4c8, 'Metal', false);
    box(g, a, [2, 1.6, 0.1], [x, 6.6, 21.85], 0xd8eef8, 'Glass', false);
  }
  box(g, a, [9, 0.4, 2.4], [-14, 6.5, 21.2], 0x6b4a33, 'Wood');
  for (let k = 0; k < 5; k++) {
    g.add(cylinder(a, 0.35, 1.2 + r() * 0.8, [-17.5 + k * 1.8, 7.3, 21.2], GOLD, 'Metal'));
    g.add(ball(a, 0.45, [-17.5 + k * 1.8, 8.3 + r() * 0.5, 21.2], GOLD, 'Metal'));
  }
  for (let k = 0; k < 6; k++) g.add(ball(a, 0.6, [24 + (k % 3) * 1.3, 0.6, 18 + Math.floor(k / 3) * 1.3], [0xe0702a, 0xe0702a, 0xffffff][k % 3], 'Plastic'));
  box(g, a, [3.5, 1.6, 1.8], [25.3, 0.8, 15.5], 0x5d6066, 'Metal');

  g.position.copy(o);
  scene.add(bake(g));

  for (const x of [-12, 12]) for (const z of [-8, 8]) fixture([o.x + x, 16, o.z + z], { color: 0xfff1de, intensity: 90, distance: 46, decay: 1.6 });
  fixture([o.x, 9, o.z - 7], { color: 0xffe0b0, intensity: 40, distance: 22 }); // stage wash
  for (const zc of [-15.75, -5.25, 5.25, 15.75]) scene.add(lightShaft([o.x - 30.3, 16.5, o.z + zc], [0, 0, 3.6], [0, 2.4, 0], [1, -0.85, 0.15], { length: 24, opacity: 0.18 }));
  return { stageTop: 3, stageFront: -12 };
}

// ---- a family kitchen ------------------------------------------------------------------

/**
 * A kitchen at `o`: interior x -11..11, z -9..9, 11 high. Counters, sink, stove and fridge
 * along the back wall (-z) with a window over the sink; the dining table is at (0, 2.5),
 * top at y 3, with chairs at x ±3.4 (facing in) and z 5.2 (facing -z). Returns { table, tableTop }.
 */
export function buildKitchen(scene, a, o, { seed = 12 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const mount = mounter(g, 11, 9);
  const WALLK = 0xf3e7cf;

  box(g, a, [22, 1, 18], [0, -0.5, 0], 0x9b9b95, 'Concrete', false);
  put(g, texturedPlane(22, 18, 4, tileDraw('#f4f1ea', '#c84b3a', 21)), 0, 0.01, 0);
  box(g, a, [24, 0.5, 20], [0, 11.25, 0], 0xf4f4f0, 'Plastic');
  put(g, texturedPlane(22, 18, 8, ceilingDraw, { up: false, rough: 0.9 }), 0, 11, 0);
  const wall = (size, pos) => box(g, a, size, pos, WALLK, 'Plastic');
  // Back wall with a window over the sink (x 0..5, y 5..8.6).
  wall([11, 11, 1], [-5.5, 5.5, -9.5]);
  wall([6, 11, 1], [8, 5.5, -9.5]);
  wall([5, 5, 1], [2.5, 2.5, -9.5]);
  wall([5, 2.4, 1], [2.5, 9.8, -9.5]);
  g.add(part(a, [5, 3.6, 0.1], [2.5, 6.8, -9.5], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.18 } }));
  box(g, a, [5.4, 0.3, 0.8], [2.5, 4.95, -9.2], 0xffffff, 'Plastic');
  box(g, a, [0.25, 3.6, 0.4], [2.5, 6.8, -9.4], 0xffffff, 'Plastic', false);
  for (const x of [0.6, 4.4]) box(g, a, [1.2, 3.9, 0.15], [x, 7.0, -8.85], 0xd6524a, 'Fabric');
  wall([22, 11, 1], [0, 5.5, 9.5]);
  wall([1, 11, 18], [-11.5, 5.5, 0]);
  // Right wall with a doorway (z 2..6).
  wall([1, 11, 11], [11.5, 5.5, -3.5]);
  wall([1, 11, 3], [11.5, 5.5, 7.5]);
  wall([1, 3.4, 4], [11.5, 9.3, 4]);
  // Wallpaper band and baseboards.
  for (const [size, pos] of [[[22, 0.4, 0.12], [0, 0.2, -8.95]], [[22, 0.4, 0.12], [0, 0.2, 8.95]], [[0.12, 0.4, 18], [-10.95, 0.2, 0]]])
    box(g, a, size, pos, 0xffffff, 'Plastic', false);

  // Back counter run: cabinets, countertop, sink, stove, fridge, upper cabinets.
  box(g, a, [17, 3.2, 2.6], [-1.5, 1.6, -7.7], 0x6f8fb0, 'WoodPlanks');
  box(g, a, [17.2, 0.3, 2.8], [-1.5, 3.35, -7.7], 0xe8e4dc, 'Slate');
  for (let x = -9.5; x <= 6.5; x += 2) {
    box(g, a, [1.8, 2.7, 0.08], [x, 1.6, -6.38], 0x5f7fa0, 'WoodPlanks', false);
    box(g, a, [0.5, 0.12, 0.1], [x, 2.6, -6.3], 0xc0c4c8, 'Metal', false);
  }
  box(g, a, [3.2, 0.25, 1.8], [2.5, 3.4, -7.8], 0xc0c4c8, 'Metal', false);
  g.add(cylinder(a, 0.08, 1.2, [2.5, 4.0, -8.6], 0xc0c4c8, 'Metal'));
  box(g, a, [0.15, 0.15, 0.9], [2.5, 4.55, -8.2], 0xc0c4c8, 'Metal', false);
  put(g, P.stove(a), -4.5, 0, -7.6);
  put(g, P.fridge(a), 8.6, 0, -7.6);
  for (const x of [-9.4, -6.6, -2.2, 6.4]) {
    box(g, a, [2.6, 3, 1.6], [x, 8.3, -8.4], 0x6f8fb0, 'WoodPlanks');
    box(g, a, [0.12, 0.6, 0.1], [x + 0.9, 7.4, -7.55], 0xc0c4c8, 'Metal', false);
  }
  // Clutter: toaster, fruit bowl, cutting board, kettle, mugs.
  box(g, a, [1.2, 0.9, 0.8], [-8.6, 3.95, -8.0], 0xd8d8d8, 'Metal');
  g.add(cylinder(a, 0.7, 0.35, [-1.0, 3.67, -7.6], 0xffffff, 'Plastic'));
  for (const [dx, c] of [[-0.3, 0xc4281c], [0.25, 0xf5cd30], [0, 0x4b974b]]) g.add(ball(a, 0.3, [-1.0 + dx, 4.0, -7.6 + dx * 0.5], c, 'Plastic'));
  box(g, a, [1.6, 0.12, 1.0], [5.6, 3.56, -7.5], 0xb5835a, 'Wood');
  for (let k = 0; k < 3; k++) g.add(cylinder(a, 0.22, 0.45, [-6.8 + k * 0.6, 3.72, -8.4], [0xc4281c, 0x0d69ac, 0xf2f3f3][k], 'Plastic'));

  // Dining table, chairs, a rug and a pendant lamp.
  g.add(cylinder(a, 5.2, 0.06, [0, 0.03, 2.5], 0x7a8f5a, 'Fabric'));
  put(g, P.table(a, 6.4, 4.2, 3, 0x8a5a3a, 'WoodPlanks'), 0, 0, 2.5);
  for (const [x, z, ry] of [[-3.4, 2.5, Math.PI / 2], [3.4, 2.5, -Math.PI / 2], [0, 5.2, Math.PI], [0, -0.2, 0]]) {
    const c = P.chair(a, 0x6b4a33, 'Wood');
    c.scale.setScalar(0.9);
    put(g, c, x, 0, z, ry);
  }
  g.add(cylinder(a, 0.05, 3.2, [0, 9.4, 2.5], 0x2a2a2a, 'Metal'));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.0, 24, 1, true), robloxMaterial(a, 0x2f4f3a, 'Metal', { side: THREE.DoubleSide }));
  shade.position.set(0, 7.4, 2.5);
  g.add(shade);
  g.add(ball(a, 0.35, [0, 7.0, 2.5], 0xfff1c9, 'Neon'));
  // Pictures and a calendar.
  mount(decal(3, 2.2, (ctx, w, h) => {
    ctx.fillStyle = '#f4e3c3';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7fb4d9';
    ctx.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.84);
    ctx.fillStyle = '#4b974b';
    ctx.fillRect(w * 0.06, h * 0.6, w * 0.88, h * 0.32);
    ctx.fillStyle = '#ffd21f';
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.3, h * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }), 'left', -2, 6.5);
  mount(decal(2, 2.6, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c84b3a';
    ctx.fillRect(0, 0, w, h * 0.22);
    P.drawText(ctx, 'MAY', w / 2, h * 0.14, w * 0.8, h * 0.14, { color: '#fff', font: FONT });
    ctx.strokeStyle = '#999';
    for (let i = 1; i < 7; i++) ctx.strokeRect((i - 1) * w / 6 + 2, h * 0.3, w / 6 - 4, h * 0.6);
  }), 'left', 3, 6.2);
  plant(g, a, -9.8, 0, 7.6, 1.6);
  box(g, a, [1.4, 1.2, 1.4], [9.6, 0.6, 7.4], 0x6b4a33, 'Plastic');
  g.add(ball(a, 0.5, [9.6, 1.45, 7.4], 0xc4281c, 'Plastic'));

  g.position.copy(o);
  scene.add(bake(g));
  fixture([o.x, 6.6, o.z + 2.5], { color: 0xffd9a0, intensity: 30, distance: 22 });
  fixture([o.x - 3, 9.5, o.z - 5], { color: 0xfff1de, intensity: 16, distance: 18 });
  scene.add(lightShaft([o.x + 2.5, 6.8, o.z - 9.4], [2.4, 0, 0], [0, 1.8, 0], [0.2, -0.7, 1], { length: 11 }));
  return { table: [0, 2.5], tableTop: 3.18 };
}

// ---- an outdoor wedding ------------------------------------------------------------------

/**
 * A backyard wedding at `o`: lawn, an arch at (0, -6) facing +z, rows of white chairs with an
 * aisle along x = 0, and the cake table at (7, -3) (top at y 3). Returns { cakeTable }.
 */
export function buildWedding(scene, a, o, { seed = 14 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  box(g, a, [140, 1, 140], [0, -0.5, 0], BRICK.brightGreen, 'Grass', false);
  put(g, P.weddingArch(a), 0, 0, -6);
  box(g, a, [3, 0.06, 26], [0, 0.03, 6], 0xf4f4f4, 'Fabric', false);
  for (let k = 0; k < 13; k++) for (const s of [-1, 1]) g.add(ball(a, 0.18, [s * 1.6, 0.18, -4 + k * 2], [0xff9fcf, 0xffffff][k % 2], 'Fabric'));
  for (let row = 0; row < 4; row++)
    for (const s of [-1, 1])
      for (let k = 0; k < 4; k++) {
        const c = P.chair(a, BRICK.institutionalWhite, 'Plastic');
        c.scale.setScalar(0.75);
        put(g, c, s * (3.2 + k * 1.6), 0, 4 + row * 2.6, Math.PI);
      }
  put(g, P.table(a, 4, 2.6, 3, BRICK.institutionalWhite, 'Fabric'), 7.5, 0, -3);
  box(g, a, [4.2, 2.2, 2.8], [7.5, 1.9, -3], BRICK.institutionalWhite, 'Fabric', false);
  // String lights on poles.
  for (const [x, z] of [[-12, -10], [12, -10], [-12, 16], [12, 16]]) g.add(cylinder(a, 0.2, 10, [x, 5, z], 0x6b4a33, 'Wood'));
  for (let k = 0; k <= 24; k++) {
    const u = k / 24;
    g.add(ball(a, 0.16, [-12 + 24 * u, 9.6 - Math.sin(u * Math.PI) * 1.4, -10], [0xffd36b, 0xffffff][k % 2], 'Neon'));
    g.add(ball(a, 0.16, [-12 + 24 * u, 9.6 - Math.sin(u * Math.PI) * 1.4, 16], [0xffd36b, 0xffffff][k % 2], 'Neon'));
  }
  for (let k = 0; k < 9; k++) tree(g, a, -40 + k * 10 + r() * 3, -28 - r() * 8, 1 + r() * 0.4, r);
  // A white picket fence and flower bushes behind the arch.
  for (let x = -20; x <= 20; x += 1.2) box(g, a, [0.25, 2.4, 0.2], [x, 1.2, -14], 0xffffff, 'WoodPlanks');
  for (const y of [0.8, 1.8]) box(g, a, [41, 0.25, 0.15], [0, y, -14.15], 0xffffff, 'WoodPlanks', false);
  for (let k = 0; k < 10; k++) {
    const x = -9 + k * 2;
    g.add(ball(a, 0.9, [x, 0.7, -12.4], BRICK.darkGreen, 'Grass'));
    g.add(ball(a, 0.28, [x + 0.3, 1.3, -11.9], [0xff6fae, 0xffffff, 0xffd1e8][k % 3], 'Fabric'));
  }
  g.position.copy(o);
  scene.add(bake(g));
  return { cakeTable: [7.5, -3] };
}

// ---- a small town square at night --------------------------------------------------------

/** A house facing +z (front door at z = d/2), with a porch that can vanish on its own. */
function house(a, { w = 10, d = 9, h = 7, wall = 0xd8c4a0, roof = 0x5a3b2b, trim = 0xf2f2f2, door = 0x6b4a33, r = Math.random }) {
  const body = new THREE.Group();
  box(body, a, [w, 0.6, d], [0, 0.3, 0], 0x8d8f94, 'Concrete');
  box(body, a, [w, h, d], [0, h / 2 + 0.6, 0], wall, 'WoodPlanks');
  // Roof: two slopes and gables.
  const pitch = 0.5;
  const half = d / 2 + 0.8;
  const slope = Math.hypot(half, half * pitch);
  for (const s of [-1, 1]) {
    const p = box(body, a, [w + 1.2, 0.5, slope], [0, h + 0.6 + (half * pitch) / 2, (s * half) / 2], roof, 'Slate');
    p.rotation.x = s * Math.atan(pitch);
  }
  for (const s of [-1, 1]) {
    const shape = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, (d / 2) * pitch)]);
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }), robloxMaterial(a, wall, 'WoodPlanks'));
    gable.rotation.y = Math.PI / 2;
    gable.position.set(s * (w / 2) - 0.15, h + 0.6, 0);
    gable.castShadow = gable.receiveShadow = true;
    body.add(gable);
  }
  box(body, a, [1.0, 2.6, 1.0], [w * 0.28, h + 2.2, -d * 0.15], 0x7a3b2b, 'Brick');
  // Front: door in a frame, glowing windows with shutters, trim.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.9, 0.6, d / 2 + 0.05);
  box(doorPivot, a, [1.8, 3.6, 0.2], [0.9, 1.8, 0], door, 'WoodPlanks');
  box(doorPivot, a, [0.25, 0.25, 0.2], [1.5, 1.8, 0.15], BRICK.brightYellow, 'Metal', false);
  box(body, a, [2.4, 4.0, 0.15], [0, 2.6, d / 2 + 0.01], trim, 'Plastic', false);
  box(body, a, [1.8, 3.6, 0.1], [0, 2.4, d / 2 + 0.02], 0x2a1c12, 'Plastic', false);
  for (const x of [-w * 0.3, w * 0.3]) {
    box(body, a, [2.2, 2.0, 0.12], [x, 3.6, d / 2 + 0.02], 0xffc46b, 'Neon', false);
    box(body, a, [2.5, 0.25, 0.3], [x, 4.7, d / 2 + 0.1], trim, 'Plastic', false);
    box(body, a, [0.15, 2.0, 0.2], [x, 3.6, d / 2 + 0.1], trim, 'Plastic', false);
    for (const s of [-1, 1]) box(body, a, [0.5, 2.2, 0.15], [x + s * 1.4, 3.6, d / 2 + 0.1], door, 'WoodPlanks', false);
  }
  box(body, a, [2.0, 1.0, 0.12], [0, h - 0.4, d / 2 + 0.02], 0xffc46b, 'Neon', false);
  // Porch: deck, steps, posts, rail, roof and a lamp.
  const porch = new THREE.Group();
  const pd = 3.2;
  box(porch, a, [w - 1, 0.6, pd], [0, 0.3, d / 2 + pd / 2], 0x8a5a3a, 'WoodPlanks');
  box(porch, a, [3, 0.3, 1.0], [0, 0.15, d / 2 + pd + 0.5], 0x8a5a3a, 'WoodPlanks');
  for (const x of [-(w - 1.6) / 2, (w - 1.6) / 2, -1.8, 1.8]) box(porch, a, [0.35, 3.8, 0.35], [x, 2.5, d / 2 + pd - 0.3], trim, 'WoodPlanks');
  for (const s of [-1, 1]) box(porch, a, [(w - 1) / 2 - 2.0, 0.2, 0.2], [s * ((w - 1) / 4 + 1.0), 1.7, d / 2 + pd - 0.3], trim, 'WoodPlanks');
  box(porch, a, [w - 0.6, 0.35, pd + 0.4], [0, 4.5, d / 2 + pd / 2], roof, 'Slate');
  porch.add(ball(a, 0.25, [1.5, 3.9, d / 2 + 0.3], 0xffd9a0, 'Neon'));
  if (r() < 0.6) {
    const c = P.chair(a, 0xf2f2f2, 'WoodPlanks');
    c.scale.setScalar(0.6);
    put(porch, c, -(w - 3) / 2, 0.6, d / 2 + 1.4, 0.3);
  }
  plant(porch, a, (w - 3) / 2, 0.6, d / 2 + 0.9, 0.8);
  return { body, porch, doorPivot, porchLight: [1.5, 3.9, d / 2 + 0.6], doorstep: [0, d / 2 + pd + 1.6] };
}

const cobbleDraw = (ctx, w, h) => {
  const r = rng(31);
  ctx.fillStyle = '#7d7a76';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32)
    for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) {
      const g = 110 + r() * 40;
      ctx.fillStyle = `rgb(${g},${g - 4},${g - 10})`;
      ctx.fillRect(x + 2, y + 2, 28, 28);
    }
};

/**
 * A small town around a square, at night, for the fog story. The square is x,z -16..16
 * (cobblestones) with the Caller's crate at (0, 0) and a clock tower at (0, -14); a road
 * rings it (|x| or |z| 16..24); houses face the square from all sides but the front (+z,
 * where cameras stand); a picket fence rings the town at radius ~50.
 * Returns handles: houses (by name: { group, porch, doorPivot, doorstep, at, porchLight }),
 * lamps (by name: { group, fixture, at }), bakery { group, sign, blank }, hole (mailbox spot),
 * crate { at, top }. `plaques: false` leaves the lampposts unnamed.
 */
export function buildFogTown(scene, a, o, { seed = 41, plaques = true } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  box(g, a, [180, 1, 180], [0, -0.5, 0], BRICK.brightGreen, 'Grass', false);
  put(g, texturedPlane(32, 32, 6, cobbleDraw, { rough: 0.85 }), 0, 0.02, 0);
  // Road ring and sidewalks.
  for (const [size, pos] of [[[48, 0.1, 8], [0, 0.03, -20]], [[48, 0.1, 8], [0, 0.03, 20]], [[8, 0.1, 32], [-20, 0.03, 0]], [[8, 0.1, 32], [20, 0.03, 0]]])
    box(g, a, size, pos, 0x3a3a3c, 'Concrete', false);
  for (const [size, pos] of [[[34, 0.3, 1], [0, 0.15, -16.5]], [[34, 0.3, 1], [0, 0.15, 16.5]], [[1, 0.3, 34], [-16.5, 0.15, 0]], [[1, 0.3, 34], [16.5, 0.15, 0]]])
    box(g, a, size, pos, 0xb9b6ae, 'Concrete', false);
  for (let k = -20; k <= 20; k += 6) {
    box(g, a, [3, 0.05, 0.3], [k, 0.1, -20], 0xf5cd30, 'SmoothPlastic', false);
    box(g, a, [0.3, 0.05, 3], [-20, 0.1, k], 0xf5cd30, 'SmoothPlastic', false);
    box(g, a, [0.3, 0.05, 3], [20, 0.1, k], 0xf5cd30, 'SmoothPlastic', false);
  }
  // Crate (the Caller's stand), benches, planters, the clock tower.
  box(g, a, [2.2, 1.6, 2.2], [0, 0.8, 0], 0xa8753e, 'WoodPlanks');
  for (const y of [0.3, 1.3]) for (const s of [-1, 1]) box(g, a, [2.3, 0.2, 0.2], [0, y, s * 1.05], 0x7a5130, 'WoodPlanks', false);
  for (const [x, z, ry] of [[-8, 6, 0], [8, 6, 0], [-11, -3, Math.PI / 2], [11, -3, -Math.PI / 2]]) {
    const b = new THREE.Group();
    box(b, a, [4, 0.3, 1.2], [0, 1.2, 0], 0x6b4a33, 'WoodPlanks');
    box(b, a, [4, 1.0, 0.2], [0, 1.9, -0.55], 0x6b4a33, 'WoodPlanks');
    for (const s of [-1, 1]) box(b, a, [0.2, 1.2, 1.0], [s * 1.8, 0.6, 0], 0x2a2a2a, 'Metal');
    put(g, b, x, 0, z, ry);
  }
  for (const [x, z] of [[-13, 13], [13, 13], [-13, -13], [13, -13]]) {
    box(g, a, [2.4, 1.2, 2.4], [x, 0.6, z], 0x8d8f94, 'Concrete');
    g.add(ball(a, 1.1, [x, 1.8, z], BRICK.darkGreen, 'Grass'));
    for (let k = 0; k < 4; k++) g.add(ball(a, 0.25, [x + Math.cos(k * 1.6) * 0.9, 2.2, z + Math.sin(k * 1.6) * 0.9], [0xff6fae, 0xfff3c4, 0xc4281c][k % 3], 'Fabric'));
  }
  const tower = new THREE.Group();
  box(tower, a, [5, 18, 5], [0, 9, 0], 0xb59a7a, 'Brick');
  box(tower, a, [6, 0.6, 6], [0, 18.3, 0], 0x6b4a33, 'WoodPlanks');
  const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5, 4), robloxMaterial(a, 0x3b4a5a, 'Slate'));
  cap.position.y = 21.1;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  tower.add(cap);
  const face = decal(3.6, 3.6, (ctx, w, h) => {
    ctx.fillStyle = '#f8f1dc';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.47, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = w * 0.03;
    ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const an = (k / 12) * Math.PI * 2;
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(w / 2 + Math.sin(an) * w * 0.38 - 3, h / 2 - Math.cos(an) * h * 0.38 - 3, 6, 6);
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.035;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2, h * 0.2);
    ctx.stroke();
    ctx.lineWidth = w * 0.05;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2, h * 0.28);
    ctx.stroke();
  }, { glow: 0.6, alpha: true });
  face.position.set(0, 14.5, 2.52);
  tower.add(face);
  for (let y = 3; y < 12; y += 4) box(tower, a, [1.2, 2.0, 0.1], [0, y, 2.52], 0xffc46b, 'Neon', false);
  put(g, tower, 0, 0, -14);
  // Mailbox stub and the hole where it used to be.
  box(g, a, [0.4, 0.5, 0.4], [9.5, 0.25, 15.4], 0x5d6066, 'Metal');
  g.add(cylinder(a, 1.0, 0.06, [11.2, 0.05, 15.2], 0x050505, 'SmoothPlastic'));
  g.add(cylinder(a, 1.12, 0.05, [11.2, 0.04, 15.2], 0x3a2a1a, 'Concrete'));
  // Trees outside the houses and the picket fence at the edge of town.
  for (let k = 0; k < 22; k++) {
    const an = (k / 22) * Math.PI * 2 + r() * 0.2;
    const rad = 44 + r() * 4;
    tree(g, a, Math.cos(an) * rad, Math.sin(an) * rad, 0.9 + r() * 0.3, r);
  }
  for (let k = 0; k < 120; k++) {
    const an = (k / 120) * Math.PI * 2;
    const rad = 52;
    const post = box(g, a, [0.3, 2.4, 0.25], [Math.cos(an) * rad, 1.2, Math.sin(an) * rad], 0xf2f2f2, 'WoodPlanks');
    post.rotation.y = -an;
  }
  for (const y of [0.8, 1.8]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(52, 0.1, 4, 160), robloxMaterial(a, 0xf2f2f2, 'WoodPlanks'));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }
  g.position.copy(o);
  scene.add(bake(g));

  // Houses (each its own baked group, so the fog can take them one at a time).
  const W = (name, x, z, ry, opts) => {
    const hs = house(a, { r, ...opts });
    const bakedBody = bake(hs.body);
    const bakedPorch = bake(hs.porch);
    const root = new THREE.Group();
    root.add(bakedBody, bakedPorch, hs.doorPivot);
    root.position.set(o.x + x, 0, o.z + z);
    root.rotation.y = ry;
    scene.add(root);
    const local = (p) => new THREE.Vector3(...p).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, 0, z));
    const pl = local(hs.porchLight);
    const ds = local([hs.doorstep[0], 0, hs.doorstep[1]]);
    const light = fixture([o.x + pl.x, pl.y, o.z + pl.z], { color: 0xffc98a, intensity: 14, distance: 14 });
    return { group: root, body: bakedBody, porch: bakedPorch, doorPivot: hs.doorPivot, light, at: [x, z], doorstep: [ds.x, ds.z], ry };
  };
  const houses = {
    pell: W('pell', -32, 0, Math.PI / 2, { wall: 0xc9a27a, roof: 0x4a3426 }),
    doris: W('doris', -32, -13, Math.PI / 2, { wall: 0xb8d0e0, roof: 0x3b4a5a, door: 0x8f1d24 }),
    ray: W('ray', -20, -33, 0, { wall: 0xd9d9c9, roof: 0x5a3b2b }),
    twins: W('twins', 7, -33, 0, { wall: 0xf0c8c8, roof: 0x6b3b3b, door: 0x1f4f9a }),
    harlow: W('harlow', 32, 2, -Math.PI / 2, { wall: 0xe8dcb0, roof: 0x4a5a3a }),
    corner: W('corner', -32, 14, Math.PI / 2, { wall: 0xc8e0c8, roof: 0x3b4a3a, w: 9 }),
    blue: W('blue', 20, -33, 0, { wall: 0x9fb8d9, roof: 0x2f3f5a, w: 9 }),
    green: W('green', 32, 15, -Math.PI / 2, { wall: 0xa9c9a0, roof: 0x5a3b2b, w: 9 }),
  };
  // The bakery: a storefront with a sign that can go blank.
  const bk = new THREE.Group();
  box(bk, a, [12, 8, 9], [0, 4, 0], 0xe8c9a0, 'Brick');
  box(bk, a, [12.6, 0.6, 9.6], [0, 8.3, 0], 0x6b4a33, 'WoodPlanks');
  box(bk, a, [12.4, 0.8, 1.6], [0, 5.2, 5.2], 0xc4281c, 'Fabric');
  for (let k = 0; k < 6; k++) box(bk, a, [1.0, 0.82, 1.62], [-5 + k * 2, 5.2, 5.21], 0xf2f2f2, 'Fabric', false);
  box(bk, a, [8, 3.4, 0.12], [-1, 2.6, 4.52], 0xffc46b, 'Neon', false);
  box(bk, a, [2, 3.8, 0.2], [4.4, 1.9, 4.55], 0x6b4a33, 'WoodPlanks');
  for (let k = 0; k < 4; k++) bk.add(ball(a, 0.35, [-4 + k * 2, 1.2, 4.7], [0xd9a86a, 0xc58a4a, 0xf5cd30, 0xe0b07a][k], 'Plastic'));
  const bakery = bake(bk);
  const bakeryRoot = new THREE.Group();
  bakeryRoot.add(bakery);
  const signTex = (text) => P.canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f2b632';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    if (text) P.drawText(ctx, text, w / 2, h * 0.62, w * 0.86, h * 0.56, { color: '#f2b632', font: FONT });
  });
  const full = signTex('SWEET ROSE BAKERY');
  const blank = signTex('');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshStandardMaterial({ map: full, emissive: 0xffffff, emissiveMap: full, emissiveIntensity: 0.6, roughness: 0.8 }));
  sign.position.set(0, 7.0, 4.62);
  bakeryRoot.add(sign);
  bakeryRoot.position.set(o.x + 32, 0, o.z - 12);
  bakeryRoot.rotation.y = -Math.PI / 2;
  scene.add(bakeryRoot);
  // Named lampposts.
  const lamp = (name, x, z) => {
    const lg = new THREE.Group();
    box(lg, a, [0.4, 9, 0.4], [0, 4.5, 0], 0x2a2a2a, 'Metal');
    box(lg, a, [1.0, 0.6, 1.0], [0, 0.3, 0], 0x2a2a2a, 'Metal');
    box(lg, a, [1.2, 0.3, 1.2], [0, 9.2, 0], 0x2a2a2a, 'Metal');
    const bulb = ball(a, 0.5, [0, 8.7, 0], 0xffe0a0, 'Neon');
    lg.add(bulb);
    if (plaques) {
      const plaque = P.sign(a, 1.8, 0.5, name, { bg: '#1b2a35', fg: '#f2b632', size: 120, border: '#f2b632' });
      plaque.position.set(0, 3.2, 0.3);
      lg.add(plaque);
      const back = P.sign(a, 1.8, 0.5, name, { bg: '#1b2a35', fg: '#f2b632', size: 120, border: '#f2b632' });
      back.position.set(0, 3.2, -0.3);
      back.rotation.y = Math.PI;
      lg.add(back);
    }
    lg.position.set(o.x + x, 0, o.z + z);
    scene.add(lg);
    return { group: lg, bulb, fixture: fixture([o.x + x, 8.2, o.z + z], { color: 0xffd08a, intensity: 32, distance: 22 }), at: [x, z] };
  };
  const lamps = { gus: lamp('GUS', -15, 15), gus2: lamp('GUS TWO', 15, 15), linda: lamp('LINDA', -15, -15), lamp4: lamp('BOB', 15, -15) };
  fixture([o.x, 13, o.z - 11], { color: 0xffd9a0, intensity: 20, distance: 18 }); // clock tower glow
  return { houses, lamps, bakery: { group: bakeryRoot, sign, blank, full }, hole: [11.2, 15.2], crate: { at: [0, 0], top: 1.6 } };
}

// ---- a school hallway lined with lockers ------------------------------------------------

/**
 * A school hallway at `o`: interior x -23..23, z -6.2..7.2, 12 high. Fourteen lockers (2.6 wide,
 * 3 deep, 7 tall) line the back wall (-z) with their doors facing +z; the front wall has
 * classroom doors, bulletin boards and a run of high windows that let sun in. Double doors at
 * both ends swing into the hall. One locker (index 12) is a hollow `hero` with a swinging door,
 * a shelf and clutter on it. Returns { heroX, heroZ, doorZ, hero: { door, shelf, banana,
 * can, shoes, books, padlock, light }, ends: { left: [l, r], right: [l, r] } } where door and
 * leaf pivots rotate about y (hero door, hinged on its right edge: 0 shut, about +1.75 hanging open into the hall; a
 * left-end leaf swings to +x with a positive angle for the first leaf and negative for the
 * second, mirrored at the right end).
 */
export function buildLockerHall(scene, a, o, { seed = 33 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const HX = 23;
  const Z0 = -6.2; // back wall (inner face)
  const Z1 = 7.2; // front wall (inner face)
  const H = 12;
  const WALLC = 0xe9e2cc;
  const LW = 2.6; // locker width
  const LD = 3.0;
  const LH = 7;
  const doorZ = Z0 + LD; // the locker door plane
  const lockerX = (i) => (i - 6.5) * LW;
  const HERO = 12;

  // Floor, ceiling and walls.
  box(g, a, [48, 1, 14.4], [0, -0.5, 0.5], 0x9b9b95, 'Concrete', false);
  put(g, texturedPlane(46, 13.4, 8, tileDraw('#e9e3d3', '#9fb3c4', 5), { rough: 0.3 }), 0, 0.01, 0.5);
  put(g, texturedPlane(46, 13.4, 8, ceilingDraw, { up: false, rough: 0.9 }), 0, H, 0.5);
  box(g, a, [49, 0.6, 15.6], [0, H + 0.3, 0.5], TRIM, 'Plastic');
  box(g, a, [48, H, 1], [0, H / 2, Z0 - 0.5], WALLC, 'Plastic');
  // End walls with a double doorway (z -2.5..3.5, 8.2 high).
  for (const s of [-1, 1]) {
    box(g, a, [1, H, 3.7], [s * (HX + 0.5), H / 2, -4.35], WALLC, 'Plastic');
    box(g, a, [1, H, 3.7], [s * (HX + 0.5), H / 2, 5.35], WALLC, 'Plastic');
    box(g, a, [1, H - 8.2, 6], [s * (HX + 0.5), 8.2 + (H - 8.2) / 2, 0.5], WALLC, 'Plastic');
    // What lies beyond the leaves: daylight at the right end, the gym's warm light at the left.
    const beyond = P.canvasTexture(8, 64, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, s > 0 ? '#eef6ff' : '#ffe3a8');
      gr.addColorStop(1, s > 0 ? '#bcd8f2' : '#d9a45a');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 8.4), new THREE.MeshBasicMaterial({ map: beyond }));
    glow.position.set(s * (HX + 0.3), 4.2, 0.5);
    glow.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(glow);
  }
  // Front wall: classroom doors below, a strip of windows above (so the sun comes in).
  box(g, a, [48, 8.6, 1], [0, 4.3, Z1 + 0.5], WALLC, 'Plastic');
  box(g, a, [48, 0.8, 1], [0, H - 0.4, Z1 + 0.5], WALLC, 'Plastic');
  for (let k = 0; k < 6; k++) {
    const x = -22.5 + k * 9;
    box(g, a, [2.0, 2.6, 1], [x, 9.9, Z1 + 0.5], WALLC, 'Plastic');
    if (k < 5) {
      g.add(part(a, [7, 2.6, 0.12], [x + 4.5, 9.9, Z1 + 0.2], 0xd8eef8, 'Glass', { shadows: false, mat: { opacity: 0.18 } }));
      box(g, a, [7.2, 0.18, 0.3], [x + 4.5, 8.7, Z1 - 0.1], FRAME, 'Metal', false);
      box(g, a, [0.14, 2.6, 0.3], [x + 4.5, 9.9, Z1 - 0.1], FRAME, 'Metal', false);
    }
  }
  // Dado rail (red) and baseboard along the front wall, above-locker trim on the back wall.
  box(g, a, [46, 3.2, 0.1], [0, 1.6, Z1 - 0.05], 0x7d2f3a, 'Plastic', false);
  box(g, a, [46, 0.35, 0.15], [0, 3.3, Z1 - 0.08], TRIM, 'Plastic', false);
  box(g, a, [46, 0.4, 0.16], [0, 0.2, Z1 - 0.1], TRIM, 'Plastic', false);
  box(g, a, [46, 0.5, 1.0], [0, LH + 0.25, Z0 + 0.5], FRAME, 'Metal', false); // lockers' top cap line
  // Ceiling lights.
  const panels = [];
  for (const x of [-18, -12, -6, 0, 6, 12, 18]) {
    box(g, a, [3.2, 0.1, 1.3], [x, H - 0.05, 0.5], 0xfdfcf2, 'Neon', false);
    box(g, a, [3.6, 0.2, 1.7], [x, H - 0.1, 0.5], TRIM, 'Metal', false);
    panels.push(x);
  }

  // Lockers along the back wall.
  const doorColors = [0x1f5fa8, 0x2a6dba, 0x1a5499];
  for (let i = 0; i < 14; i++) {
    const x = lockerX(i);
    if (i === HERO) continue;
    const c = doorColors[(i * 5 + 1) % 3];
    box(g, a, [LW, LH, LD - 0.12], [x, LH / 2, Z0 + (LD - 0.12) / 2], 0x15467f, 'Metal');
    box(g, a, [LW - 0.12, LH - 0.16, 0.12], [x, LH / 2, doorZ - 0.06], c, 'Metal');
    for (let k = 0; k < 4; k++) box(g, a, [1.4, 0.1, 0.06], [x, 6.2 - k * 0.28, doorZ + 0.02], BRICK.reallyBlack, 'Plastic', false);
    for (let k = 0; k < 3; k++) box(g, a, [1.4, 0.1, 0.06], [x, 0.9 + k * 0.28, doorZ + 0.02], BRICK.reallyBlack, 'Plastic', false);
    box(g, a, [0.16, 0.7, 0.14], [x + 0.85, 3.6, doorZ + 0.06], BRICK.mediumStoneGrey, 'Metal', false);
    box(g, a, [0.5, 0.2, 0.1], [x + 0.65, 4.2, doorZ + 0.04], BRICK.mediumStoneGrey, 'Metal', false);
    if (r() < 0.5) {
      const st = decal(0.9, 0.6, (ctx, w, h) => {
        ctx.fillStyle = ['#ffd21f', '#ff98dc', '#7fe0a0', '#ffffff'][i % 4];
        ctx.fillRect(0, 0, w, h);
        P.drawText(ctx, ['HI', 'ART', 'BAND', 'EAGLES', 'CHESS'][i % 5], w / 2, h * 0.55, w * 0.9, h * 0.5, { color: '#1b2a35' });
      });
      put(g, st, x - 0.5 + r() * 0.4, 2.4 + r() * 1.6, doorZ + 0.07);
    }
  }
  // The hero locker's neighbours are boxed in by a frame so there are no gaps.
  for (const s of [-1, 1]) box(g, a, [0.14, LH, LD], [lockerX(HERO) + s * (LW / 2 + 0.07), LH / 2, Z0 + LD / 2], 0x15467f, 'Metal').userData.noCollide = true;

  // Back wall above the lockers: banners, a clock, pennants.
  const eagles = decal(9, 2.4, signDraw(['GO EAGLES!'], '#7d2f3a', '#ffd21f', { border: '#ffd21f' }));
  put(g, eagles, -9, 9.8, Z0 + 0.04);
  const dance = decal(3.4, 4.2, signDraw(['SCHOOL', 'DANCE', 'FRI 7PM'], '#6225d1', '#ffffff', { stroke: '#1b2a35' }));
  put(g, dance, 6, 9.7, Z0 + 0.04);
  const mile = decal(4.6, 3.2, signDraw(['THE MILE', 'RUN SIGN-UP', 'TODAY!'], '#1f5fa8', '#ffd21f', { stroke: '#1b2a35' }));
  put(g, mile, 15, 9.7, Z0 + 0.04);
  put(g, decal(2.6, 2.6, drawClock, { ppu: 100, alpha: true }), -1.5, 10.2, Z0 + 0.06);
  put(g, decal(5, 3.2, drawBulletin), -18.8, 9.6, Z0 + 0.04);
  // The two ends of the locker wall: a bench and a plant.
  for (const s of [-1, 1]) {
    const bx = s * 20.9;
    box(g, a, [2.2, 0.3, 4], [bx, 1.6, -3.9], 0x6b4a33, 'WoodPlanks');
    for (const z of [-5.5, -2.3]) box(g, a, [1.9, 1.6, 0.3], [bx, 0.8, z], 0x2a2a2a, 'Metal');
    plant(g, a, bx + s * 0.8, 1.9, -3.9, 1.4);
  }

  // The front wall: classroom doors, bulletin boards, a trophy case, posters, a fountain.
  const DOORS = [-17, -8, 1.5, 11, 20];
  DOORS.forEach((x, k) => {
    box(g, a, [4.6, 8.4, 0.2], [x, 4.2, Z1 - 0.1], TRIM, 'Plastic', false);
    box(g, a, [3.8, 7.8, 0.3], [x, 3.9, Z1 - 0.2], 0x8a5a3a, 'WoodPlanks');
    box(g, a, [1.2, 3.0, 0.1], [x, 5.4, Z1 - 0.38], 0x9fd0ef, 'Glass', false);
    box(g, a, [0.2, 0.5, 0.3], [x + 1.4, 3.6, Z1 - 0.45], BRICK.mediumStoneGrey, 'Metal', false);
    put(g, decal(1.5, 0.8, signDraw([`${201 + k}`], '#1b2a35', '#ffffff')), x, 7.0, Z1 - 0.42, Math.PI);
  });
  put(g, decal(6, 5, drawBulletin), -12.5, 5.6, Z1 - 0.06, Math.PI);
  put(g, decal(5.4, 4.2, drawBulletin), 6.2, 5.6, Z1 - 0.06, Math.PI);
  put(g, decal(4, 5, drawRules), -1.8, 5.8, Z1 - 0.06, Math.PI);
  put(g, decal(3.2, 4.4, signDraw(['LOST', 'CAT', 'REWARD'], '#fffbea', '#c4281c', { border: '#1b2a35' })), 15.4, 5.4, Z1 - 0.06, Math.PI);
  put(g, decal(4.4, 3.2, signDraw(['PICTURE', 'DAY', 'FRIDAY!'], '#ffd21f', '#1b2a35', { border: '#7d2f3a' })), -21.3, 5.8, Z1 - 0.06, Math.PI);
  box(g, a, [1.4, 1.0, 1.6], [4.2, 3.0, Z1 - 1.0], 0xc0c4c8, 'Metal'); // water fountain
  box(g, a, [0.5, 2.6, 0.6], [4.2, 1.3, Z1 - 1.0], 0xc0c4c8, 'Metal');
  box(g, a, [0.9, 0.5, 0.15], [4.2, 3.4, Z1 - 0.3], 0xc0c4c8, 'Metal', false);
  // Odds and ends on the floor.
  const can = new THREE.Group();
  box(can, a, [0.9, 1.6, 0.9], [0, 0.8, 0], 0x3d5a6c, 'Metal');
  box(can, a, [1.0, 0.2, 1.0], [0, 1.65, 0], 0x2b3f4c, 'Metal', false);
  put(g, can, -20.2, 0, 5.6);
  const wet = new THREE.Group();
  box(wet, a, [1.5, 2.2, 0.12], [0, 1.1, 0.3], 0xf5cd30, 'Plastic');
  box(wet, a, [1.5, 2.2, 0.12], [0, 1.1, -0.3], 0xf5cd30, 'Plastic');
  box(wet, a, [1.0, 0.7, 0.08], [0, 1.4, 0.37], 0x1b2a35, 'Plastic', false);
  put(g, wet, -9.4, 0, 4.2, 0.3);
  backpack(g, a, -6.0, 0, 4.9, 0xc4281c, 0.7);
  backpack(g, a, 8.5, 0, 5.2, 0x4b974b, -0.4);

  g.position.copy(o);
  scene.add(bake(g));

  // The hero locker (hollow, with a swinging door), placed in world space.
  const hx = o.x + lockerX(HERO);
  const zc = o.z + Z0 + LD / 2;
  const hero = new THREE.Group();
  hero.position.set(hx, 0, zc);
  scene.add(hero);
  const IN = 0xb9c6d4;
  const hb = (size, pos, c = IN, m = 'Metal', sh = true) => box(hero, a, size, pos, c, m, sh);
  hb([LW, LH, 0.12], [0, LH / 2, -LD / 2 + 0.06], IN);
  hb([0.12, LH, LD], [-LW / 2 + 0.06, LH / 2, 0]);
  hb([0.12, LH, LD], [LW / 2 - 0.06, LH / 2, 0]);
  hb([LW, 0.12, LD], [0, LH - 0.06, 0], 0x15467f);
  hb([LW, 0.15, LD], [0, 0.08, 0], 0x8d9aa8);
  const shelf = hb([LW - 0.24, 0.12, LD - 0.16], [0, 3.9, 0.04], 0xa9b6c4);
  // Clutter: a mirror and photo strips on the back wall, a hook with a hoodie, the old banana,
  // a can of vanilla body spray, a stack of books and the gym shoes.
  put(hero, decal(0.9, 1.2, (ctx, w, h) => {
    ctx.fillStyle = '#cfe9f5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(w * 0.1, h * 0.08, w * 0.12, h * 0.7);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }), -0.45, 5.1, -LD / 2 + 0.14);
  put(hero, decal(0.7, 1.6, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = ['#ffb3c6', '#a8d8ff', '#ffe08a', '#c8f7c5'][k];
      ctx.fillRect(w * 0.1, h * (0.04 + k * 0.24), w * 0.8, h * 0.2);
    }
  }), 0.55, 5.2, -LD / 2 + 0.14);
  hb([0.12, 0.12, 0.5], [0.0, 6.4, -LD / 2 + 0.34], 0x8d9aa8);
  const hoodie = hb([1.4, 1.4, 0.35], [0.0, 5.6, -LD / 2 + 0.52], 0xff98dc, 'Fabric');
  hoodie.rotation.z = 0.02;
  const banana = new THREE.Group();
  for (const [x, y, rz, c] of [[-0.35, 0, 0.55, 0xc9a43a], [0, 0.12, 0.1, 0xc9a43a], [0.35, 0, -0.55, 0xc9a43a]]) {
    const seg = part(a, [0.5, 0.2, 0.22], [x, y, 0], c, 'Plastic', { shadows: false });
    seg.rotation.z = rz;
    banana.add(seg);
  }
  for (const [x, y] of [[-0.2, 0.18], [0.1, 0.24], [0.28, 0.1], [-0.4, 0.05]]) banana.add(part(a, [0.1, 0.06, 0.24], [x, y, 0], 0x5a3b22, 'Plastic', { shadows: false }));
  banana.add(part(a, [0.12, 0.24, 0.12], [-0.68, -0.16, 0], 0x4a3a22, 'Plastic', { shadows: false }));
  banana.position.set(-0.55, 4.12, 0.2);
  hero.add(banana);
  const spray = new THREE.Group();
  spray.add(cylinder(a, 0.26, 1.0, [0, 0.5, 0], 0xff9ac8, 'SmoothPlastic'));
  spray.add(cylinder(a, 0.2, 0.2, [0, 1.1, 0], 0xf4f4f4, 'SmoothPlastic'));
  spray.add(cylinder(a, 0.08, 0.14, [0, 1.27, 0], 0x888888, 'Metal'));
  spray.add(decal(0.4, 0.5, signDraw(['VANILLA'], '#ffffff', '#c2185b')));
  spray.children.at(-1).position.set(0, 0.55, 0.265);
  spray.position.set(0.2, 3.96, -0.3);
  hero.add(spray);
  const shoes = new THREE.Group();
  for (const s of [-1, 1]) {
    box(shoes, a, [0.62, 0.32, 1.3], [s * 0.38, 0.2, 0], 0xf6f6f6, 'SmoothPlastic');
    box(shoes, a, [0.64, 0.12, 1.34], [s * 0.38, 0.06, 0], 0xc4281c, 'Plastic', false);
    box(shoes, a, [0.5, 0.3, 0.5], [s * 0.38, 0.45, -0.38], 0xffffff, 'SmoothPlastic');
  }
  shoes.position.set(0.7, 3.96, 0.45);
  hero.add(shoes);
  const books = new THREE.Group();
  [[1.1, 0.26, 0.8, 0x4b974b], [1.0, 0.22, 0.75, 0xc4281c], [1.05, 0.28, 0.8, 0x1f4f9a]].forEach(([w, h, d, c], k) =>
    box(books, a, [w, h, d], [0, 0.13 + (k ? [0, 0.26, 0.48][k] : 0), 0], c, 'Fabric'));
  books.position.set(-0.55, 3.96, -0.7);
  hero.add(books);
  // The door: hinged on the right edge, swings out into the hall (positive y rotation).
  const door = new THREE.Group();
  door.position.set(LW / 2, 0, LD / 2);
  hero.add(door);
  const DX = -LW / 2; // the door's centre, relative to its hinge
  box(door, a, [LW - 0.04, LH - 0.12, 0.12], [DX, LH / 2, 0], 0x2a6dba, 'Metal');
  for (let k = 0; k < 4; k++) box(door, a, [1.4, 0.1, 0.06], [DX, 6.2 - k * 0.28, 0.08], BRICK.reallyBlack, 'Plastic', false);
  for (let k = 0; k < 3; k++) box(door, a, [1.4, 0.1, 0.06], [DX, 0.9 + k * 0.28, 0.08], BRICK.reallyBlack, 'Plastic', false);
  box(door, a, [0.16, 0.7, 0.14], [-(LW - 0.4), 3.6, 0.12], BRICK.mediumStoneGrey, 'Metal', false);
  box(door, a, [0.3, 0.5, 0.1], [-(LW - 0.4), 4.3, 0.1], BRICK.mediumStoneGrey, 'Metal', false);
  const padlock = new THREE.Group();
  padlock.position.set(-(LW - 0.4), 4.2, 0.14);
  padlock.add(part(a, [0.34, 0.3, 0.14], [0, -0.2, 0], 0xc9a227, 'Metal', { shadows: false }));
  padlock.add(part(a, [0.06, 0.3, 0.06], [0.1, 0.02, 0], 0xc0c4c8, 'Metal', { shadows: false }));
  door.add(padlock);
  const name = decal(1.7, 0.7, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff7eb6';
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
    P.drawText(ctx, 'CHLOE', w * 0.4, h * 0.52, w * 0.62, h * 0.5, { color: '#c2185b' });
    ctx.fillStyle = '#e53935';
    const hx0 = w * 0.84;
    const hy = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(hx0, hy + h * 0.2);
    ctx.bezierCurveTo(hx0 - w * 0.2, hy - h * 0.05, hx0 - w * 0.06, hy - h * 0.35, hx0, hy - h * 0.12);
    ctx.bezierCurveTo(hx0 + w * 0.06, hy - h * 0.35, hx0 + w * 0.2, hy - h * 0.05, hx0, hy + h * 0.2);
    ctx.fill();
  });
  name.position.set(DX, 6.55, 0.1);
  door.add(name);
  // A mirror on the inside of the door.
  const inner = decal(0.8, 1.1, (ctx, w, h) => {
    ctx.fillStyle = '#cfe9f5';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  });
  inner.position.set(DX, 5.0, -0.075);
  inner.rotation.y = Math.PI;
  door.add(inner);
  const heroLight = fixture([hx, 5.6, zc + 3.4], { color: 0xfff1de, intensity: 12, distance: 9, visible: false });

  // Double doors at both ends (not baked: they swing).
  const ends = {};
  for (const [side, s] of [['left', 1], ['right', -1]]) {
    ends[side] = [0, 1].map((k) => {
      const hinge = new THREE.Group();
      hinge.position.set(o.x - s * (HX - 0.1), 0, o.z + (k ? 3.5 : -2.5));
      const dir = k ? -1 : 1; // the leaf extends toward the middle of the doorway
      box(hinge, a, [0.28, 8.1, 2.95], [0, 4.05, dir * 1.5], 0x8a5a3a, 'WoodPlanks');
      box(hinge, a, [0.32, 3.2, 1.0], [0, 5.6, dir * 1.5], 0x9fd0ef, 'Glass', false);
      box(hinge, a, [0.34, 0.7, 2.95], [0, 0.4, dir * 1.5], 0xc0c4c8, 'Metal', false);
      box(hinge, a, [0.3, 0.2, 2.2], [s * 0.2, 3.6, dir * 1.4], 0xc0c4c8, 'Metal', false);
      scene.add(hinge);
      return hinge;
    });
  }
  put(scene, decal(3.4, 1.0, signDraw(['GYM  →'], '#1f5fa8', '#ffffff', { border: '#ffffff' })), o.x - HX + 0.04, 10.0, o.z + 0.5, Math.PI / 2);
  put(scene, decal(3.4, 1.0, signDraw(['EXIT'], '#b71c1c', '#ffffff', { border: '#ffffff' }), { glow: 0.6 }), o.x + HX - 0.04, 10.0, o.z + 0.5, -Math.PI / 2);

  // Lights and sunbeams through the window strip.
  for (const x of panels) fixture([o.x + x, 11.4, o.z + 0.5], { color: 0xfff1de, intensity: 18, distance: 20 });
  for (let k = 0; k < 5; k++) scene.add(lightShaft([o.x - 22.5 + k * 9 + 4.5, 9.9, o.z + Z1 - 0.1], [3.4, 0, 0], [0, 1.3, 0], [0.12, -0.55, -1], { length: 13, opacity: 0.16 }));

  return {
    heroX: lockerX(HERO),
    heroZ: Z0 + LD / 2,
    doorZ,
    lockerX,
    hero: { group: hero, door, shelf, banana, can: spray, shoes, books, padlock, light: heroLight },
    ends,
  };
}
