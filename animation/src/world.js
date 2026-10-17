// Shared scene setup: renderer, sky, lighting, and a Roblox-style park to stand in.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createRenderer(width, height) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function loadTextures(urls) {
  const loader = new THREE.TextureLoader();
  return Promise.all(
    Object.entries(urls).map(async ([name, url]) => {
      const tex = await loader.loadAsync(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return [name, tex];
    }),
  ).then(Object.fromEntries);
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Deterministic random numbers, so every render of a scene looks the same.
export function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function solid(geometry, color, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function tree(x, z, s, rand) {
  const g = new THREE.Group();
  const trunk = solid(new RoundedBoxGeometry(0.9, 4, 0.9, 2, 0.08), 0x6b4a2b);
  trunk.position.y = 2;
  g.add(trunk);
  const greens = [0x3f8a3a, 0x4b974b, 0x37803a];
  for (let i = 0; i < 4; i++) {
    const r = 1.6 + rand() * 0.9;
    const leaf = solid(new THREE.IcosahedronGeometry(r, 1), greens[i % 3]);
    leaf.material.flatShading = true;
    leaf.position.set((rand() - 0.5) * 2, 4.6 + rand() * 1.6, (rand() - 0.5) * 2);
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  return g;
}

function house(x, z, rotY, wallColor, roofColor) {
  const g = new THREE.Group();
  const walls = solid(new THREE.BoxGeometry(12, 7, 9), wallColor);
  walls.position.y = 3.5;
  g.add(walls);
  const roofShape = new THREE.Shape([new THREE.Vector2(-6.8, 0), new THREE.Vector2(6.8, 0), new THREE.Vector2(0, 4.2)]);
  const roof = solid(new THREE.ExtrudeGeometry(roofShape, { depth: 10, bevelEnabled: false }), roofColor);
  roof.position.set(0, 7, -5);
  g.add(roof);
  const door = solid(new THREE.BoxGeometry(2.2, 4, 0.3), 0x5a3a22);
  door.position.set(0, 2, 4.55);
  g.add(door);
  for (const wx of [-3.8, 3.8]) {
    const win = solid(new THREE.BoxGeometry(2.4, 2.2, 0.3), 0x9fd3ff);
    win.material.roughness = 0.15;
    win.position.set(wx, 4, 4.55);
    g.add(win);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

export function createWorld() {
  const scene = new THREE.Scene();

  scene.background = canvasTexture(4, 512, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#4f9be8');
    grad.addColorStop(0.55, '#9ccbf2');
    grad.addColorStop(1, '#d9ecfa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 512);
  });
  scene.fog = new THREE.Fog(0xcfe6f7, 60, 170);

  const hemi = new THREE.HemisphereLight(0xdcefff, 0x5d7f45, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
  sun.position.set(14, 26, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.target.position.set(4, 0, 0);
  scene.add(sun, sun.target);

  // Grass baseplate with a faint stud-grid feel.
  const rand = rng(7);
  const grass = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#4f9a45';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const v = Math.floor(rand() * 26) - 13;
      ctx.fillStyle = `rgb(${79 + v},${154 + v},${69 + v})`;
      ctx.fillRect(Math.floor(rand() * 128) * 4, Math.floor(rand() * 128) * 4, 4, 4);
    }
  });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(60, 60);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // A stone path the action happens on.
  const path = solid(new THREE.BoxGeometry(60, 0.1, 5), 0xa3a2a5, { cast: false });
  path.position.set(4, 0.05, 0.5);
  scene.add(path);

  scene.add(house(-6, -16, 0.15, 0xe8dcc4, 0xb33a2b));
  scene.add(house(14, -18, -0.2, 0xcfe0f0, 0x3b5f8a));
  for (const [x, z, s] of [
    [-16, -8, 1.1], [-11, -26, 1.3], [4, -12, 1.0], [24, -9, 1.2], [30, -24, 1.4],
    [-24, -20, 1.2], [8, -28, 1.3], [-20, 10, 1.1], [26, 12, 1.0], [-2, 22, 1.2], [16, 20, 1.1],
  ]) {
    scene.add(tree(x, z, s, rand));
  }

  return { scene, sun };
}

// ---- animation helpers -------------------------------------------------------------------

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
/** 0..1 progress of t through [a, b]. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const smooth = (u) => u * u * (3 - 2 * u);
export const easeOut = (u) => 1 - (1 - u) ** 3;
export const easeIn = (u) => u ** 3;
export const easeInOut = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
