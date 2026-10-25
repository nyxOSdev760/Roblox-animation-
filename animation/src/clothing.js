// Classic Roblox clothing (Shirt / Pants templates, 585x559) on R6 and R15 body parts.
//
// Templates live in assets/rbx/clothing/<slug>.png (tools/roblox_assets.py clothing ... or
// tools/make_clothes.py). Scenes list the slugs they use in meta.clothing so they're
// loaded before setup(). Like Roblox, each body part shows its colour with the pants
// template on top (torso, legs) and the shirt template on top of that (torso, arms).
import * as THREE from 'three';

const BASE = '/animation/assets/rbx/clothing';
const TW = 585;
const TH = 559;
const images = new Map();

export async function loadClothing(slugs) {
  await Promise.all(
    slugs.map(
      (slug) =>
        images.has(slug) ||
        new Promise((ok, fail) => {
          const img = new Image();
          img.onload = () => ok(images.set(slug, img));
          img.onerror = () => fail(new Error(`clothing ${slug} not found`));
          img.src = `${BASE}/${slug}.png`;
        }),
    ),
  );
}

// Template regions (x, y, w, h). "right"/"left" are the part's own right/left sides.
const TORSO = { up: [231, 8, 128, 64], front: [231, 74, 128, 128], right: [165, 74, 64, 128], left: [361, 74, 64, 128], back: [427, 74, 128, 128], down: [231, 204, 128, 64] };
const RIGHT = { left: [19, 355, 64, 128], back: [85, 355, 64, 128], right: [151, 355, 64, 128], front: [217, 355, 64, 128], up: [217, 289, 64, 64], down: [217, 485, 64, 64] };
const LEFT = { front: [308, 355, 64, 128], left: [374, 355, 64, 128], back: [440, 355, 64, 128], right: [506, 355, 64, 128], up: [308, 289, 64, 64], down: [308, 485, 64, 64] };
const REGIONS = { torso: TORSO, rArm: RIGHT, rLeg: RIGHT, lArm: LEFT, lLeg: LEFT };
// BoxGeometry face order is +x, -x, +y, -y, +z, -z. Characters face +z, so +x is the
// part's left side.
const FACE_ORDER = ['left', 'right', 'up', 'down', 'front', 'back'];

/** A body-part box whose UVs point at that part's regions of the clothing template. */
export function clothedBox(part, sx, sy, sz) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv;
  const regions = REGIONS[part];
  for (let f = 0; f < 6; f++) {
    const [x, y, w, h] = regions[FACE_ORDER[f]];
    for (let i = 0; i < 4; i++) {
      const j = f * 4 + i;
      const u = uv.getX(j);
      const v = uv.getY(j);
      // Half-pixel inset so neighbouring regions don't bleed in.
      const px = x + 0.5 + u * (w - 1);
      const py = y + 0.5 + (1 - v) * (h - 1);
      uv.setXY(j, px / TW, 1 - py / TH);
    }
  }
  return g;
}

const textureCache = new Map();

/** Composite texture for one body part: its colour, then pants, then shirt. */
export function clothedTexture(color, { pants, shirt }) {
  const key = `${color}|${pants}|${shirt}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const c = document.createElement('canvas');
  c.width = TW;
  c.height = TH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
  ctx.fillRect(0, 0, TW, TH);
  for (const slug of [pants, shirt]) {
    if (!slug) continue;
    const img = images.get(slug);
    if (!img) throw new Error(`clothing ${slug} not loaded (add it to meta.clothing)`);
    ctx.drawImage(img, 0, 0, TW, TH);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  textureCache.set(key, t);
  return t;
}

const atlasCache = new Map();
const ATLAS_SCALE = 2; // atlas pixels per composite-mesh pixel

/**
 * R15 clothing, composited the way Roblox does it: the part's colour, then the pants and
 * shirt templates drawn into the limb's atlas through Roblox's R15 composite mesh (each
 * triangle maps a template region to an atlas region, see tools/rbx_r15.py). The R15 body
 * meshes' UVs point into that atlas. `composite` is r15.json's torso/rightArm/leftArm entry.
 */
export function clothedAtlas(composite, key, color, { pants, shirt }) {
  const cacheKey = `${key}|${color}|${pants}|${shirt}`;
  if (atlasCache.has(cacheKey)) return atlasCache.get(cacheKey);
  // The template layers, pants under shirt, on a transparent template-sized canvas.
  const layer = document.createElement('canvas');
  layer.width = TW;
  layer.height = TH;
  for (const slug of [pants, shirt]) {
    if (!slug) continue;
    const img = images.get(slug);
    if (!img) throw new Error(`clothing ${slug} not loaded (add it to meta.clothing)`);
    layer.getContext('2d').drawImage(img, 0, 0, TW, TH);
  }
  const [W, H] = composite.size;
  const c = document.createElement('canvas');
  c.width = W * ATLAS_SCALE;
  c.height = H * ATLAS_SCALE;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
  ctx.fillRect(0, 0, c.width, c.height);
  const P = composite.positions;
  const UV = composite.uvs;
  const I = composite.indices;
  const dst = (i) => [P[2 * i] * ATLAS_SCALE, (H - P[2 * i + 1]) * ATLAS_SCALE]; // atlas y is up
  const src = (i) => [UV[2 * i] * TW, UV[2 * i + 1] * TH];
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, d] = [I[t], I[t + 1], I[t + 2]];
    const [p0, p1, p2] = [dst(a), dst(b), dst(d)];
    const [s0, s1, s2] = [src(a), src(b), src(d)];
    // Affine map template -> atlas: solve for [m11 m12 m21 m22 dx dy].
    const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
    if (Math.abs(den) < 1e-9) continue;
    const ax = ((p1[0] - p0[0]) * (s2[1] - s0[1]) - (p2[0] - p0[0]) * (s1[1] - s0[1])) / den;
    const bx = ((p2[0] - p0[0]) * (s1[0] - s0[0]) - (p1[0] - p0[0]) * (s2[0] - s0[0])) / den;
    const ay = ((p1[1] - p0[1]) * (s2[1] - s0[1]) - (p2[1] - p0[1]) * (s1[1] - s0[1])) / den;
    const by = ((p2[1] - p0[1]) * (s1[0] - s0[0]) - (p1[1] - p0[1]) * (s2[0] - s0[0])) / den;
    const cx = p0[0] - ax * s0[0] - bx * s0[1];
    const cy = p0[1] - ay * s0[0] - by * s0[1];
    // Clip to the triangle grown by a pixel so neighbours overlap instead of leaving seams.
    const mx = (p0[0] + p1[0] + p2[0]) / 3;
    const my = (p0[1] + p1[1] + p2[1]) / 3;
    const grow = (p) => {
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const l = Math.hypot(dx, dy) || 1;
      return [p[0] + (dx / l) * 1.2, p[1] + (dy / l) * 1.2];
    };
    ctx.save();
    ctx.beginPath();
    for (const [k, p] of [p0, p1, p2].map(grow).entries()) (k ? ctx.lineTo : ctx.moveTo).call(ctx, p[0], p[1]);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(ax, ay, bx, by, cx, cy);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  atlasCache.set(cacheKey, t);
  return t;
}
