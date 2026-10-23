// Classic Roblox clothing (Shirt / Pants templates, 585x559) on R6 body parts.
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
