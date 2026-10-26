// Interior lighting: lamps, ceiling panels and light shafts through windows.
//
// Sets register light fixtures anywhere (fixture()); a small pool of real point lights is
// handed each frame to the fixtures nearest the camera (updateLights(), called by main.js).
// The shader cost stays the same however many lamps the sets have, and switching a fixture
// on or off never recompiles shaders.
import * as THREE from 'three';

const POOL_SIZE = 6;
const FIXTURES = [];
let pool = [];

/** Add the pool of point lights to the scene (robloxLighting does this). */
export function addLightPool(scene) {
  pool = Array.from({ length: POOL_SIZE }, () => {
    const l = new THREE.PointLight(0xffffff, 0, 20, 2);
    scene.add(l);
    return l;
  });
}

/**
 * A light fixture at a world position. Returns a handle: set .visible to switch it, change
 * .intensity / .color to dim or tint it.
 */
export function fixture(pos, { color = 0xfff3dd, intensity = 30, distance = 24, decay = 2, visible = true } = {}) {
  const f = { position: new THREE.Vector3(...pos), color: new THREE.Color(color), intensity, distance, decay, visible };
  FIXTURES.push(f);
  return f;
}

const tmp = new THREE.Vector3();

/** Give the pool lights to the fixtures nearest the camera (switched-on ones only). */
export function updateLights(camera) {
  if (!pool.length) return;
  camera.getWorldPosition(tmp);
  const near = FIXTURES.filter((f) => f.visible && f.intensity > 0 && f.position.distanceTo(tmp) < f.distance + 40)
    .sort((a, b) => a.position.distanceToSquared(tmp) - b.position.distanceToSquared(tmp))
    .slice(0, POOL_SIZE);
  pool.forEach((l, i) => {
    const f = near[i];
    l.intensity = f ? f.intensity : 0;
    if (!f) return;
    l.position.copy(f.position);
    l.color.copy(f.color);
    l.distance = f.distance;
    l.decay = f.decay;
  });
}

const shaftMaterial = (color, opacity) =>
  new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vLocal;
      void main() {
        float along = clamp(vLocal.z, 0.0, 1.0);
        float edge = smoothstep(0.5, 0.2, abs(vLocal.x)) * smoothstep(0.5, 0.2, abs(vLocal.y));
        float fade = pow(1.0 - along, 1.6) * smoothstep(0.0, 0.08, along);
        gl_FragColor = vec4(color * opacity * edge * fade, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

/**
 * A shaft of sunlight through a window: a soft additive beam (the window's rectangle swept
 * along `dir`) fading out over `length` studs.
 *   at: window centre, across / up: the window's half-axes as vectors (studs), dir: unit
 *   direction the light travels (into the room, downward).
 */
export function lightShaft(at, across, up, dir, { length = 14, color = 0xffe6bf, opacity = 0.22 } = {}) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0, 0.5);
  const m = new THREE.Mesh(g, shaftMaterial(color, opacity));
  const X = new THREE.Vector3(...across).multiplyScalar(2);
  const Y = new THREE.Vector3(...up).multiplyScalar(2);
  const Z = new THREE.Vector3(...dir).normalize().multiplyScalar(length);
  m.matrixAutoUpdate = false;
  m.matrix.makeBasis(X, Y, Z).setPosition(...at);
  m.castShadow = m.receiveShadow = false;
  m.renderOrder = 2;
  m.userData.noCollide = true;
  m.userData.keep = true;
  return m;
}

// Presets per place: [sun intensity, sun colour, sky fill, fill sky colour, fill ground colour,
// sky reflection]. Indoors the sky fill drops so window light and lamps carry the room.
const MOODS = {
  day: [2.6, 0xffe9cc, 1.3, 0xe2ebf7, 0xb8a48a, 0.16],
  interior: [3.4, 0xffe4c0, 0.62, 0xdfe6f0, 0xb39f86, 0.1],
  sunset: [1.9, 0xffa766, 1.0, 0xffc9a8, 0x8a6a5a, 0.12],
  night: [0.3, 0x9db4ff, 0.6, 0xa4acd2, 0x3a3550, 0.05],
};

/** Set the sun, sky fill and reflections for a place: 'day', 'interior', 'sunset' or 'night'. */
export function lightingMood(scene, sun, mood) {
  const [si, sc, hi, hs, hg, env] = MOODS[mood];
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  sun.intensity = si;
  sun.color.set(sc);
  hemi.intensity = hi;
  hemi.color.set(hs);
  hemi.groundColor.set(hg);
  scene.environmentIntensity = env;
}
