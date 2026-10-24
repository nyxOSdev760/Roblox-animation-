// Roblox look: BrickColors, part materials from Roblox Studio's own textures, the classic
// skybox, and lighting tuned to look like Roblox's "Future" lighting on a sunny afternoon.
//
// Units are studs. Parts are sharp-edged boxes/cylinders/balls like Roblox parts, and their
// material textures tile in world space (studs), not per part.
import * as THREE from 'three';

const TEX = '/animation/assets/rbx/textures';

// Roblox BrickColor RGB values.
// Realistic skin tones (Roblox avatar editor colours), light to dark.
export const SKIN = {
  porcelain: 0xffd8c0,
  pastelBrown: 0xffcc99,
  lightOrange: 0xeab892,
  nougat: 0xcc8e69,
  tan: 0xb57b4f,
  darkOrange: 0xa05f35,
  brown: 0x7c5c46,
  reddishBrown: 0x694028,
  deep: 0x4a2e1e,
};

export const BRICK = {
  brightYellow: 0xf5cd30,
  brightBlue: 0x0d69ac,
  brYellowishGreen: 0xa4bd47,
  brightGreen: 0x4b974b,
  earthGreen: 0x27462d,
  darkGreen: 0x287f47,
  mediumStoneGrey: 0xa3a2a5,
  darkStoneGrey: 0x635f62,
  black: 0x1b2a35,
  reallyBlack: 0x111111,
  institutionalWhite: 0xf8f8f8,
  white: 0xf2f3f3,
  reddishBrown: 0x694028,
  brown: 0x7c5c46,
  brightRed: 0xc4281c,
  nougat: 0xcc8e69,
  lightOrange: 0xeab892,
  pastelBlue: 0x80bbdc,
  sandBlue: 0x74869d,
  brightOrange: 0xda8541,
  cgaBrown: 0xaa5500,
  pine: 0x2c651d,
  camo: 0x3a7d15,
  lightStoneGrey: 0xe5e4df,
  brickYellow: 0xd7c59a,
  darkOrange: 0xa05f35,
  pink: 0xff98dc,
  hotPink: 0xff66cc,
  royalPurple: 0x6225d1,
  deepBlue: 0x2154b9,
  navyBlue: 0x002060,
  oliveGreen: 0x828a5d,
  lilac: 0xa75edb,
};

// How many studs one texture repeat covers, per material.
const TILE = { grass: 8, concrete: 8, wood: 6, woodplanks: 8, brick: 8, slate: 8, cobblestone: 8, sand: 10, metal: 6, fabric: 4 };
const ROUGH = { plastic: 0.55, smoothplastic: 0.45, grass: 0.95, concrete: 0.9, wood: 0.8, woodplanks: 0.8, brick: 0.9, slate: 0.85, cobblestone: 0.9, sand: 0.95, metal: 0.35, fabric: 0.95, glass: 0.05, neon: 1 };

export async function loadRobloxAssets(renderer) {
  const loader = new THREE.TextureLoader();
  const load = async (url, srgb) => {
    const t = await loader.loadAsync(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const textures = {};
  await Promise.all(
    Object.keys(TILE).map(async (m) => {
      textures[m] = { map: await load(`${TEX}/${m}.png`, true), normal: await load(`${TEX}/${m}_n.png`, false) };
    }),
  );
  textures.plastic = { normal: await load(`${TEX}/plastic_n.png`, false) };

  // Classic Roblox skybox. three.js cube order: px, nx, py, ny, pz, nz.
  const sky = await new THREE.CubeTextureLoader()
    .setPath(`${TEX}/sky/`)
    .loadAsync(['rt.png', 'lf.png', 'up.png', 'dn.png', 'ft.png', 'bk.png']);
  sky.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(sky).texture;
  return { textures, sky, env };
}

const materialCache = new Map();

/** A Roblox part material: name is a Roblox Material (Plastic, SmoothPlastic, Grass, Brick, ...). */
export function robloxMaterial(assets, color, name = 'plastic', opts = {}) {
  const key = `${name}|${color}|${JSON.stringify(opts)}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const m = name.toLowerCase();
  const params = { color, roughness: ROUGH[m] ?? 0.6, metalness: m === 'metal' ? 0.4 : 0, envMapIntensity: 0.5 };
  const tex = assets.textures[m];
  if (tex?.map) params.map = tex.map;
  if (tex?.normal) {
    params.normalMap = tex.normal;
    params.normalScale = new THREE.Vector2(m === 'plastic' ? 0.15 : 0.8, m === 'plastic' ? 0.15 : 0.8);
  }
  if (m === 'glass') Object.assign(params, { transparent: true, opacity: 0.45, envMapIntensity: 1.2 });
  if (m === 'neon') Object.assign(params, { emissive: color, emissiveIntensity: 1.2 });
  const mat = new THREE.MeshStandardMaterial({ ...params, ...opts });
  materialCache.set(key, mat);
  return mat;
}

const tileOf = (name) => TILE[name.toLowerCase()] ?? 4;

/** Scale a BoxGeometry's UVs so textures tile every `tile` studs on every face. */
function worldUVBox(sx, sy, sz, tile) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv;
  // Face order: +x, -x, +y, -y, +z, -z; 4 vertices each.
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const j = f * 4 + i;
      uv.setXY(j, (uv.getX(j) * dims[f][0]) / tile, (uv.getY(j) * dims[f][1]) / tile);
    }
  }
  return g;
}

function finish(mesh, pos, shadows = true) {
  mesh.position.set(...pos);
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  return mesh;
}

/** A block part. size/pos in studs: [x, y, z]. */
export function part(assets, size, pos, color, material = 'Plastic', opts = {}) {
  const m = new THREE.Mesh(worldUVBox(...size, tileOf(material)), robloxMaterial(assets, color, material, opts.mat));
  if (opts.rotY) m.rotation.y = opts.rotY;
  return finish(m, pos, opts.shadows !== false);
}

/** A cylinder part standing upright (Roblox cylinders lie along X; we stand them up). */
export function cylinder(assets, radius, height, pos, color, material = 'Plastic') {
  const g = new THREE.CylinderGeometry(radius, radius, height, 32);
  const t = tileOf(material);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * radius) / t, (uv.getY(i) * height) / t);
  return finish(new THREE.Mesh(g, robloxMaterial(assets, color, material)), pos);
}

/** A ball part. */
export function ball(assets, radius, pos, color, material = 'Plastic') {
  const g = new THREE.SphereGeometry(radius, 32, 20);
  const t = tileOf(material);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * radius) / t, (uv.getY(i) * Math.PI * radius) / t);
  return finish(new THREE.Mesh(g, robloxMaterial(assets, color, material)), pos);
}

/** A wedge part (ramp), sloping up toward -z like Roblox's WedgePart, then rotated by rotY. */
export function wedge(assets, size, pos, color, material = 'Plastic', rotY = 0) {
  const [sx, sy, sz] = size;
  const shape = new THREE.Shape([new THREE.Vector2(-sz / 2, -sy / 2), new THREE.Vector2(sz / 2, -sy / 2), new THREE.Vector2(-sz / 2, sy / 2)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: sx, bevelEnabled: false });
  g.translate(0, 0, -sx / 2);
  g.rotateY(Math.PI / 2);
  const t = tileOf(material);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t);
  const m = finish(new THREE.Mesh(g, robloxMaterial(assets, color, material)), pos);
  m.rotation.y = rotY;
  return m;
}

/**
 * Roblox-like daytime lighting: ClockTime ~14 sun, sky ambient, crisp-but-soft shadows.
 * Returns the sun so a scene can move its shadow camera to follow the action.
 */
export function robloxLighting(scene, renderer, assets) {
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps BrickColors true (ACES pushes Bright yellow toward lime)
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.background = assets.sky;
  scene.environment = assets.env;
  scene.environmentIntensity = 0.12; // Roblox ambient is neutral grey, not sky blue
  scene.fog = new THREE.Fog(0xbfdcf2, 120, 600);

  scene.add(new THREE.HemisphereLight(0xf4f2ee, 0xa8a196, 1.35));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.3);
  sun.position.set(30, 60, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const s = sun.shadow.camera;
  s.left = -30;
  s.right = 30;
  s.top = 30;
  s.bottom = -30;
  s.near = 1;
  s.far = 200;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  return sun;
}
