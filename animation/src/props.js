// Props built from Roblox-style parts. Everything returns a THREE.Group placed at the
// origin (y = 0 is the floor) unless noted; position it with group.position.set(...).
import * as THREE from 'three';
import { BRICK, part, cylinder, ball, wedge, robloxMaterial } from './roblox.js';

export const FONT = 'Fredoka One'; // Roblox's FredokaOne, loaded in main.js

const group = (...kids) => {
  const g = new THREE.Group();
  for (const k of kids) g.add(k);
  return g;
};

/** Canvas texture; draw(ctx, w, h). Returned texture has .redraw(draw) to update it. */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.redraw = (fn) => {
    ctx.clearRect(0, 0, w, h);
    fn(ctx, w, h);
    t.needsUpdate = true;
  };
  t.redraw(draw);
  return t;
}

/** Big centred text with an outline, auto-fitted to width. */
export function drawText(ctx, text, x, y, maxW, size, { color = '#fff', stroke = '#000', strokeW = 0, font = FONT } = {}) {
  let s = size;
  ctx.font = `${s}px "${font}"`;
  while (ctx.measureText(text).width > maxW && s > 8) {
    s -= 2;
    ctx.font = `${s}px "${font}"`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (strokeW) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** A flat panel whose front (+z) shows a canvas texture. Returns the mesh; .tex is the texture. */
export function panel(a, w, h, tex, { depth = 0.2, back = BRICK.darkStoneGrey, emissive = false } = {}) {
  const side = robloxMaterial(a, back, 'Plastic');
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: emissive ? 0xffffff : 0, emissiveMap: emissive ? tex : null, emissiveIntensity: emissive ? 0.9 : 0 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [side, side, side, side, front, side]);
  m.castShadow = m.receiveShadow = true;
  m.tex = tex;
  return m;
}

/** A sign with text (like a SurfaceGui). */
export function sign(a, w, h, text, { bg = '#ffffff', fg = '#1b2a35', stroke = null, size = 120, border = null, emissive = false } = {}) {
  const res = 256;
  const tex = canvasTexture(Math.round(res * (w / h)), res, (ctx, cw, ch) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = ch * 0.08;
      ctx.strokeRect(ch * 0.04, ch * 0.04, cw - ch * 0.08, ch - ch * 0.08);
    }
    const lines = String(text).split('\n');
    const lh = ch / (lines.length + 0.4);
    lines.forEach((l, i) => drawText(ctx, l, cw / 2, lh * (i + 0.7), cw * 0.9, size / lines.length ** 0.6, { color: fg, stroke: stroke ?? '#000', strokeW: stroke ? 8 : 0 }));
  });
  return panel(a, w, h, tex, { emissive });
}

// ---- furniture -------------------------------------------------------------------------

export function chair(a, color = BRICK.reddishBrown, mat = 'Wood') {
  const g = group();
  g.add(part(a, [1.8, 0.3, 1.8], [0, 1.6, 0], color, mat));
  g.add(part(a, [1.8, 2, 0.3], [0, 2.75, -0.75], color, mat));
  for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) g.add(part(a, [0.25, 1.5, 0.25], [x, 0.75, z], color, mat));
  return g;
}

export function table(a, w = 6, d = 3.5, h = 3, color = BRICK.reddishBrown, mat = 'WoodPlanks') {
  const g = group(part(a, [w, 0.35, d], [0, h, 0], color, mat));
  for (const [x, z] of [[-w / 2 + 0.4, -d / 2 + 0.4], [w / 2 - 0.4, -d / 2 + 0.4], [-w / 2 + 0.4, d / 2 - 0.4], [w / 2 - 0.4, d / 2 - 0.4]]) g.add(part(a, [0.4, h, 0.4], [x, h / 2, z], color, mat));
  return g;
}

export function stove(a) {
  const g = group(part(a, [4, 3.4, 3], [0, 1.7, 0], BRICK.white, 'Metal'));
  g.add(part(a, [3.6, 1.6, 0.1], [0, 1.4, 1.52], BRICK.darkStoneGrey, 'Glass'));
  g.add(part(a, [4, 1.2, 0.4], [0, 4.0, -1.3], BRICK.white, 'Metal'));
  for (const [x, z] of [[-1, -0.6], [1, -0.6], [-1, 0.7], [1, 0.7]]) g.add(cylinder(a, 0.5, 0.06, [x, 3.43, z], BRICK.reallyBlack, 'Metal'));
  const pot = cylinder(a, 0.7, 1, [-1, 3.95, 0.7], BRICK.mediumStoneGrey, 'Metal');
  g.add(pot);
  g.add(part(a, [0.9, 0.12, 0.12], [-2, 4.2, 0.7], BRICK.reallyBlack, 'Plastic'));
  return g;
}

export function counter(a, w = 8) {
  const g = group(part(a, [w, 3.2, 3], [0, 1.6, 0], BRICK.white, 'WoodPlanks'));
  g.add(part(a, [w + 0.2, 0.3, 3.2], [0, 3.35, 0], BRICK.darkStoneGrey, 'Slate'));
  return g;
}

export function fridge(a) {
  const g = group(part(a, [3.4, 7.5, 3], [0, 3.75, 0], BRICK.institutionalWhite, 'Metal'));
  g.add(part(a, [3.42, 0.1, 3.02], [0, 5.2, 0], BRICK.mediumStoneGrey, 'Metal'));
  g.add(part(a, [0.2, 1.8, 0.2], [1.3, 6.2, 1.55], BRICK.mediumStoneGrey, 'Metal'));
  g.add(part(a, [0.2, 2.4, 0.2], [1.3, 3.6, 1.55], BRICK.mediumStoneGrey, 'Metal'));
  return g;
}

export function door(a, color = BRICK.reddishBrown) {
  const g = group(part(a, [4, 7, 0.4], [0, 3.5, 0], color, 'WoodPlanks'));
  g.add(part(a, [0.4, 0.4, 0.3], [1.4, 3.5, 0.3], BRICK.brightYellow, 'Metal'));
  return g;
}

/** A bed `len` studs long, headboard at -z. */
export function bed(a, len = 7, color = BRICK.brightBlue) {
  const g = group(part(a, [4.4, 1.4, len], [0, 0.7, 0], BRICK.reddishBrown, 'Wood'));
  g.add(part(a, [4, 0.8, len - 0.2], [0, 1.8, 0], BRICK.white, 'Fabric'));
  g.add(part(a, [4.1, 0.5, len * 0.6], [0, 2.3, len * 0.2], color, 'Fabric'));
  g.add(part(a, [3, 0.6, 1.4], [0, 2.4, -len / 2 + 1], BRICK.institutionalWhite, 'Fabric'));
  g.add(part(a, [4.4, 3.6, 0.5], [0, 1.8, -len / 2 - 0.25], BRICK.reddishBrown, 'Wood'));
  return g;
}

export function lockers(a, n = 8, color = BRICK.brightBlue) {
  const g = group();
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 2.2;
    g.add(part(a, [2.1, 7.5, 2], [x, 3.75, 0], color, 'Metal'));
    for (let k = 0; k < 3; k++) g.add(part(a, [1.2, 0.12, 0.05], [x, 6.2 - k * 0.35, 1.02], BRICK.black, 'Plastic', { shadows: false }));
    g.add(part(a, [0.15, 0.6, 0.1], [x + 0.75, 3.8, 1.04], BRICK.mediumStoneGrey, 'Metal', { shadows: false }));
  }
  return g;
}

// ---- stage and show gear --------------------------------------------------------------

/** A stage platform (top at height h) with steps on the +x side at the front. */
export function stage(a, w = 30, d = 14, h = 3, color = BRICK.reddishBrown) {
  const g = group(part(a, [w, h, d], [0, h / 2, 0], color, 'WoodPlanks'));
  g.add(part(a, [w + 0.4, 0.4, 0.4], [0, h - 0.2, d / 2 + 0.1], BRICK.black, 'Plastic'));
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    const sh = (h * (i + 1)) / (steps + 1);
    g.add(part(a, [4, sh, 1.5], [w / 2 - 3, sh / 2, d / 2 + 0.75 + (steps - 1 - i) * 1.5], color, 'WoodPlanks'));
  }
  return g;
}

export function micStand(a) {
  const g = group(cylinder(a, 0.7, 0.15, [0, 0.08, 0], BRICK.black, 'Metal'));
  g.add(cylinder(a, 0.08, 4.6, [0, 2.3, 0], BRICK.black, 'Metal'));
  g.add(microphone(a, [0, 4.75, 0.2]));
  return g;
}

/** Handheld mic, pointing up; pos is its centre. */
export function microphone(a, pos = [0, 0, 0]) {
  const g = group(cylinder(a, 0.12, 0.9, [0, 0, 0], BRICK.black, 'Metal'), ball(a, 0.22, [0, 0.55, 0], BRICK.darkStoneGrey, 'Metal'));
  g.position.set(...pos);
  return g;
}

export function podium(a, text = '') {
  const g = group(part(a, [3.2, 4.2, 2.2], [0, 2.1, 0], BRICK.reddishBrown, 'Wood'));
  g.add(wedge(a, [3.4, 0.6, 2.4], [0, 4.5, 0.1], BRICK.reddishBrown, 'Wood', Math.PI));
  if (text) {
    const s = sign(a, 2.6, 1.2, text, { bg: '#1f3b73', fg: '#ffd21f', size: 110 });
    s.position.set(0, 2.6, 1.15);
    g.add(s);
  }
  const m = micStand(a);
  m.scale.setScalar(0.35);
  m.position.set(0, 4.5, 0.6);
  g.add(m);
  return g;
}

export function tvCamera(a) {
  const g = group();
  for (let i = 0; i < 3; i++) {
    const leg = cylinder(a, 0.1, 4.6, [0, 2.1, 0], BRICK.black, 'Metal');
    leg.rotation.z = 0.35;
    const holder = group(leg);
    holder.rotation.y = (i / 3) * Math.PI * 2;
    g.add(holder);
  }
  g.add(part(a, [1.6, 1.4, 2.8], [0, 4.6, 0], BRICK.darkStoneGrey, 'Metal'));
  g.add(cylinder(a, 0.5, 1.4, [0, 4.6, 1.8], BRICK.black, 'Metal'));
  g.children.at(-1).rotation.x = Math.PI / 2;
  g.add(part(a, [0.3, 0.3, 0.3], [0.5, 5.45, 0.9], BRICK.brightRed, 'Neon'));
  return g;
}

/** Stage light on a stand, aimed down along -y then tilted toward +z. */
export function stageLight(a) {
  const g = group(cylinder(a, 0.12, 9, [0, 4.5, 0], BRICK.black, 'Metal'));
  const can = cylinder(a, 0.6, 1.4, [0, 0, 0], BRICK.black, 'Metal');
  const lens = cylinder(a, 0.5, 0.05, [0, -0.72, 0], BRICK.institutionalWhite, 'Neon');
  const head = group(can, lens);
  head.position.set(0, 9.2, 0.5);
  head.rotation.x = -0.9;
  g.add(head);
  return g;
}

/** A soft visible light beam (cone) from `from` toward `to`. */
export function lightBeam(from, to, radius = 2.5, color = 0xfff3c4, opacity = 0.18) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  const g = new THREE.ConeGeometry(radius, len, 32, 1, true);
  g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  m.position.copy(from);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  return m;
}

export function karaokeMachine(a) {
  const g = group(part(a, [4, 3, 2.4], [0, 1.5, 0], BRICK.black, 'Plastic'));
  for (const x of [-1.1, 1.1]) g.add(cylinder(a, 0.7, 0.1, [x, 1.5, 1.22], BRICK.darkStoneGrey, 'Fabric'));
  g.children.slice(-2).forEach((c) => (c.rotation.x = Math.PI / 2));
  const s = sign(a, 3.4, 2, 'SING!\n♪ ♫ ♪', { bg: '#3a1d6e', fg: '#ff6ec7' });
  s.position.set(0, 4.2, 0);
  g.add(s);
  return g;
}

export function cautionTape(a, length) {
  const tex = canvasTexture(1024, 64, (ctx, w, h) => {
    ctx.fillStyle = '#ffd21f';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 256) drawText(ctx, 'DO NOT CROSS', x + 128, h / 2, 240, 40, { color: '#111' });
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(length / 16, 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.6), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 }));
  return m;
}

// ---- story props -----------------------------------------------------------------------

export function lunchbox(a) {
  const g = group(part(a, [1.4, 1, 0.6], [0, 0, 0], BRICK.brightRed, 'Plastic'));
  g.add(part(a, [0.7, 0.12, 0.12], [0, 0.6, 0], BRICK.black, 'Plastic'));
  const s = sign(a, 1, 0.5, 'MOM', { bg: '#f5cd30', fg: '#c4281c', size: 150 });
  s.position.set(0, 0, 0.31);
  s.scale.z = 0.2;
  g.add(s);
  return g;
}

/** The kid's drawing: stick-figure kid and mom with a heart. Front faces +z. */
export function kidNote(a, w = 1.4, h = 1.1) {
  const tex = canvasTexture(320, 250, (ctx, cw, ch) => {
    ctx.fillStyle = '#fffdf2';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#9cc3e6';
    ctx.lineWidth = 2;
    for (let y = 40; y < ch; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const fig = (x, y, s, c) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
      ctx.moveTo(x, y + 14 * s);
      ctx.lineTo(x, y + 60 * s);
      ctx.moveTo(x - 22 * s, y + 32 * s);
      ctx.lineTo(x + 22 * s, y + 32 * s);
      ctx.moveTo(x, y + 60 * s);
      ctx.lineTo(x - 16 * s, y + 90 * s);
      ctx.moveTo(x, y + 60 * s);
      ctx.lineTo(x + 16 * s, y + 90 * s);
      ctx.stroke();
    };
    fig(90, 90, 1.1, '#1f6fd1');
    fig(230, 110, 0.85, '#2e8b3a');
    ctx.fillStyle = '#e8384f';
    ctx.font = `64px "${FONT}"`;
    ctx.textAlign = 'center';
    ctx.fillText('♥', 160, 90);
    drawText(ctx, 'I LOVE U MOM', cw / 2, 222, cw * 0.9, 34, { color: '#e8384f' });
  });
  return panel(a, w, h, tex, { depth: 0.04, back: BRICK.institutionalWhite });
}

export function paycheck(a, name = 'TWINKLETOES CRANE', w = 3.2, h = 1.4, { censor = false } = {}) {
  const tex = canvasTexture(640, 280, (ctx, cw, ch) => {
    ctx.fillStyle = '#e8f3e4';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#7fae7a';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, cw - 16, ch - 16);
    drawText(ctx, 'CRANE TV  ·  PAYCHECK', cw / 2, 46, cw * 0.8, 32, { color: '#3d6b39' });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#555';
    ctx.font = `26px "${FONT}"`;
    ctx.fillText('PAY TO:', 34, 120);
    drawText(ctx, name, cw / 2 + 50, 120, cw * 0.62, 44, { color: '#1b2a35' });
    if (censor) {
      ctx.fillStyle = '#111';
      ctx.fillRect(cw / 2 - 150, 92, 250, 56);
      drawText(ctx, 'SECRET', cw / 2 - 25, 120, 230, 30, { color: '#ff4d4d' });
    }
    ctx.fillStyle = '#555';
    ctx.fillText('$ 9,999,999.00', 34, 200);
    ctx.strokeStyle = '#1b2a35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(380, 220);
    ctx.bezierCurveTo(420, 180, 470, 250, 600, 200);
    ctx.stroke();
  });
  return panel(a, w, h, tex, { depth: 0.03, back: BRICK.institutionalWhite });
}

export function diary(a) {
  const g = group(part(a, [1.2, 1.5, 0.3], [0, 0, 0], BRICK.pink ?? 0xff8fc7, 'Plastic'));
  const s = sign(a, 1, 0.5, 'DIARY', { bg: '#ff8fc7', fg: '#ffffff', size: 120 });
  s.position.set(0, 0.25, 0.16);
  s.scale.z = 0.2;
  g.add(s);
  g.add(part(a, [0.4, 0.3, 0.1], [0.62, -0.1, 0], BRICK.brightYellow, 'Metal'));
  return g;
}

/** Giant tweezers pointing along +y, pinching a little diploma at the tips. */
export function tweezers(a) {
  const g = group();
  for (const s of [-1, 1]) {
    const arm = part(a, [0.25, 4, 0.12], [s * 0.35, 2, 0], BRICK.mediumStoneGrey, 'Metal');
    arm.rotation.z = s * 0.1;
    g.add(arm);
  }
  g.add(part(a, [0.7, 0.4, 0.14], [0, 0.1, 0], BRICK.mediumStoneGrey, 'Metal'));
  const diploma = cylinder(a, 0.08, 0.6, [0, 4.1, 0], BRICK.institutionalWhite, 'Plastic');
  diploma.rotation.z = Math.PI / 2;
  g.add(diploma);
  g.add(part(a, [0.05, 0.18, 0.18], [0, 4.1, 0], BRICK.brightRed, 'Plastic'));
  return g;
}

/** Blocky orange cat facing +z; ~1.6 studs tall at the head. */
export function cat(a) {
  const fur = BRICK.brightOrange;
  const g = group(part(a, [1.2, 1, 2.4], [0, 1.1, 0], fur, 'Fabric'));
  g.add(part(a, [1.1, 1, 1], [0, 1.6, 1.5], fur, 'Fabric'));
  for (const x of [-0.35, 0.35]) g.add(wedge(a, [0.35, 0.45, 0.35], [x, 2.3, 1.4], fur, 'Fabric', Math.PI));
  for (const [x, z] of [[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]]) g.add(part(a, [0.35, 0.7, 0.35], [x, 0.35, z], fur, 'Fabric'));
  const tail = part(a, [0.25, 0.25, 1.6], [0, 1.8, -1.6], fur, 'Fabric');
  tail.rotation.x = -0.7;
  g.add(tail);
  for (const x of [-0.25, 0.25]) g.add(part(a, [0.16, 0.24, 0.05], [x, 1.75, 2.01], BRICK.reallyBlack, 'Plastic', { shadows: false }));
  g.add(part(a, [0.16, 0.12, 0.05], [0, 1.5, 2.01], BRICK.pink ?? 0xff8fc7, 'Plastic', { shadows: false }));
  return g;
}

export function trafficLight(a, armLen = 6, height = 8) {
  const g = group(cylinder(a, 0.25, height, [0, height / 2, 0], BRICK.darkStoneGrey, 'Metal'));
  g.add(part(a, [0.3, 0.3, armLen], [0, height - 0.2, -armLen / 2], BRICK.darkStoneGrey, 'Metal'));
  const box = group(part(a, [1, 2.8, 0.9], [0, 0, 0], BRICK.black, 'Metal'));
  const lamps = [[0.9, BRICK.brightRed], [0, BRICK.brightYellow], [-0.9, BRICK.brightGreen]];
  for (const [y, c] of lamps) box.add(cylinder(a, 0.3, 0.1, [0, y, 0.48], c, y > 0.5 ? 'Neon' : 'Plastic'));
  box.children.slice(1).forEach((c) => (c.rotation.x = Math.PI / 2));
  box.position.set(0, height - 1.8, -armLen + 0.6);
  g.add(box);
  return g;
}

export function stormDrain(a) {
  const g = group(part(a, [3, 0.1, 1.6], [0, 0.01, 0], BRICK.reallyBlack, 'Metal', { shadows: false }));
  for (let i = 0; i < 6; i++) g.add(part(a, [0.12, 0.12, 1.5], [-1.2 + i * 0.48, 0.07, 0], BRICK.darkStoneGrey, 'Metal', { shadows: false }));
  return g;
}

/** Yellow school bus facing +x, door on the +z side near the front. */
export function schoolBus(a) {
  const y = BRICK.brightYellow;
  const g = group(part(a, [22, 7, 7], [0, 4.5, 0], y, 'Metal'));
  g.add(part(a, [4, 4.5, 6.8], [12.8, 3.4, 0], y, 'Metal'));
  g.add(part(a, [22.2, 0.5, 7.2], [0, 2.6, 0], BRICK.black, 'Plastic'));
  for (let i = 0; i < 7; i++) {
    for (const z of [3.52, -3.52]) g.add(part(a, [2.2, 2, 0.1], [-8.5 + i * 2.7, 6, z], BRICK.pastelBlue, 'Glass', { shadows: false }));
  }
  g.add(part(a, [0.1, 2.3, 6], [10.95, 6, 0], BRICK.pastelBlue, 'Glass', { shadows: false }));
  g.add(part(a, [2, 5, 0.12], [9.2, 3.8, 3.52], BRICK.black, 'Plastic'));
  g.add(part(a, [1.8, 2.3, 0.14], [9.2, 5.2, 3.53], BRICK.pastelBlue, 'Glass', { shadows: false }));
  for (const [x, z] of [[-6, 3.5], [-6, -3.5], [10, 3.5], [10, -3.5]]) {
    const w = cylinder(a, 1.4, 0.9, [x, 1.4, z], BRICK.reallyBlack, 'Plastic');
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  const s = sign(a, 10, 1.3, 'SCHOOL BUS', { bg: '#f5cd30', fg: '#111111', size: 160 });
  s.position.set(-2, 7.4, 3.56);
  s.scale.z = 0.2;
  g.add(s);
  return g;
}

export function weddingArch(a) {
  const g = group();
  for (const x of [-3.5, 3.5]) g.add(part(a, [0.6, 9, 0.6], [x, 4.5, 0], BRICK.institutionalWhite, 'WoodPlanks'));
  g.add(part(a, [8.6, 0.6, 0.8], [0, 9.2, 0], BRICK.institutionalWhite, 'WoodPlanks'));
  const pinks = [0xff9fcf, 0xffffff, 0xff6fae, 0xffd1e8];
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = -3.6 + t * 7.2;
    const y = i % 2 ? 9.6 : 9.0;
    g.add(ball(a, 0.42, [x, y, 0.3], pinks[i % 4], 'Fabric'));
  }
  for (const x of [-3.5, 3.5]) for (let k = 0; k < 6; k++) g.add(ball(a, 0.38, [x + (k % 2 ? 0.3 : -0.3), 1.5 + k * 1.3, 0.35], pinks[k % 4], 'Fabric'));
  return g;
}

export function vat(a, color = 0x6b3b1f) {
  const g = group(cylinder(a, 2.2, 3.4, [0, 1.7, 0], BRICK.mediumStoneGrey, 'Metal'));
  g.add(cylinder(a, 2.05, 0.1, [0, 3.35, 0], color, 'Plastic'));
  return g;
}

export function filingCabinet(a) {
  const g = group(part(a, [2.4, 5, 2.6], [0, 2.5, 0], BRICK.mediumStoneGrey, 'Metal'));
  for (let k = 0; k < 3; k++) g.add(part(a, [1, 0.2, 0.1], [0, 1.2 + k * 1.5, 1.32], BRICK.darkStoneGrey, 'Metal', { shadows: false }));
  return g;
}

export function computer(a) {
  const g = group(part(a, [2.4, 1.6, 0.25], [0, 1.2, 0], BRICK.black, 'Plastic'));
  g.add(part(a, [2.2, 1.4, 0.05], [0, 1.2, 0.14], BRICK.pastelBlue, 'Neon'));
  g.add(part(a, [0.3, 0.6, 0.3], [0, 0.3, 0], BRICK.black, 'Plastic'));
  g.add(part(a, [1.2, 0.08, 0.6], [0, 0.04, 0], BRICK.black, 'Plastic'));
  return g;
}

/** Height chart on a wall: front +z, 0..8 feet marks (1 stud ≈ 1 foot here). */
export function heightChart(a) {
  const tex = canvasTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = '#fff7e0';
    ctx.fillRect(0, 0, w, h);
    for (let f = 0; f <= 8; f++) {
      const y = h - (f / 8) * h;
      ctx.fillStyle = '#c4281c';
      ctx.fillRect(0, y - 3, w * 0.5, 6);
      drawText(ctx, `${f} ft`, w * 0.75, Math.min(h - 14, Math.max(14, y)), w * 0.45, 26, { color: '#333' });
    }
  });
  return panel(a, 1.6, 8, tex, { depth: 0.05, back: BRICK.institutionalWhite });
}

/** A blocky dog facing +z (shoulder height ~1.4). userData.tail wags on its y axis. */
export function dog(a) {
  const g = new THREE.Group();
  const fur = 0xc58a4a;
  g.add(part(a, [1.0, 0.9, 2.0], [0, 1.1, 0], fur, 'Fabric'));
  g.add(part(a, [0.9, 0.9, 0.9], [0, 1.75, 1.2], fur, 'Fabric'));
  g.add(part(a, [0.5, 0.4, 0.5], [0, 1.6, 1.8], 0xe0b07a, 'Fabric'));
  g.add(part(a, [0.2, 0.2, 0.12], [0, 1.75, 2.06], 0x1b1b1b, 'Plastic'));
  for (const x of [-0.5, 0.5]) g.add(part(a, [0.25, 0.6, 0.4], [x, 2.0, 1.1], 0x7a4f2a, 'Fabric'));
  for (const x of [-0.22, 0.22]) g.add(part(a, [0.14, 0.14, 0.05], [x, 1.95, 1.66], 0x1b1b1b, 'Plastic'));
  for (const [x, z] of [[-0.35, 0.7], [0.35, 0.7], [-0.35, -0.7], [0.35, -0.7]]) g.add(part(a, [0.3, 0.7, 0.3], [x, 0.35, z], fur, 'Fabric'));
  const tail = part(a, [0.18, 0.18, 0.8], [0, 1.5, -1.2], fur, 'Fabric');
  tail.rotation.x = 0.6;
  g.add(tail);
  g.userData.tail = tail;
  return g;
}
