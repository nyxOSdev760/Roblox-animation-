// Post-processing for the realistic ("Future" lighting + realism shaders) look:
//
//   render (HDR, 4x MSAA) -> GTAO ambient occlusion -> bloom -> grade (tone map + sRGB)
//
// - Ambient occlusion darkens creases, corners and contact points (feet on floors, a desk's
//   legs, the gap under a chair). Hair cards, glass and face decals are left out of it, so
//   they don't leave dark halos.
// - Bloom picks up only very bright pixels: Neon parts, lit screens, lamps.
// - The grade is a filmic ACES curve applied to each pixel's brightest channel, which keeps
//   hue and saturation, so BrickColors stay true (plain ACES turns Bright yellow lime and
//   skin orange); only blown-out highlights roll off toward white, like film.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * GTAO at half resolution (soft anyway, and a quarter of the cost) that ignores sprites and
 * transparent and alpha-tested meshes (hair cards, glass, face decals).
 */
class SolidGTAOPass extends GTAOPass {
  setSize(width, height) {
    super.setSize(Math.ceil(width / 2), Math.ceil(height / 2));
  }

  overrideVisibility() {
    super.overrideVisibility();
    this.scene.traverse((o) => {
      if (o.isSprite) o.visible = false; // billboards (name tags, numbers) don't occlude
      if (!o.isMesh || !o.visible) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m.transparent || m.alphaTest > 0) o.visible = false;
    });
  }
}

const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null },
    exposure: { value: 1.0 },
    saturation: { value: 1.04 },
    vignette: { value: 0.18 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float exposure;
    uniform float saturation;
    uniform float vignette;
    varying vec2 vUv;

    // Narkowicz's fit of the ACES filmic curve.
    vec3 aces(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }

    void main() {
      vec3 col = max(texture2D(tDiffuse, vUv).rgb * exposure, 0.0);
      float peak = max(max(col.r, col.g), col.b);
      // Filmic curve on the peak channel: hue and saturation unchanged.
      vec3 keep = col * (aces(vec3(peak)).r / max(peak, 1e-5));
      // Past the shoulder, blend toward per-channel ACES so hot lights go white.
      vec3 hot = aces(col);
      col = mix(keep, hot, smoothstep(1.0, 3.0, peak));
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(luma), col, saturation), 0.0);
      vec2 d = vUv - 0.5;
      col *= 1.0 - vignette * smoothstep(0.25, 0.75, dot(d, d) * 2.0);
      gl_FragColor = vec4(toSRGB(clamp(col, 0.0, 1.0)), 1.0);
    }`,
};

/**
 * @returns {{ composer, ao, bloom, grade, render() }}  render() draws the frame to the canvas.
 */
export function createPost(renderer, scene, camera, width, height) {
  renderer.toneMapping = THREE.NoToneMapping; // the grade pass tone maps
  const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));

  const ao = new SolidGTAOPass(scene, camera, Math.ceil(width / 2), Math.ceil(height / 2));
  // Studs: occlusion reaches about a stud and a half (a hand on a desk, a body against a wall).
  ao.updateGtaoMaterial({ radius: 1.4, distanceExponent: 1.4, thickness: 1.5, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);

  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.55, 2.6);
  composer.addPass(bloom);

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  return { composer, ao, bloom, grade, render: () => composer.render() };
}
