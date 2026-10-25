// Roblox R15 character built from Roblox's own rig: the blocky R15 body meshes and the joint
// positions of Roblox Studio's default R15 character (characterR15.rbxm, converted by
// tools/rbx_r15.py), with the classic head on top.
//
// Same conventions as r6.js: units are studs, the character faces +z (its right side is -x),
// and the root is where R6's torso centre was, 3 studs above the ground when standing, so
// poses, hand props and cameras made for R6 still line up.
//
// Joints (Euler angles in DEGREES, [x, y, z]):
//   neck, waist                   x > 0 tips the head / upper body forward
//   rArm, lArm                    shoulders: x > 0 swings the arm back, z raises it sideways
//                                 (rArm z < 0 and lArm z > 0 raise them outward)
//   rElbow, lElbow                x < 0 bends the forearm forward / up; then y swings it across
//                                 the body (rElbow y > 0 and lElbow y < 0 bring the hand inward)
//   rWrist, lWrist
//   rLeg, lLeg                    hips: x > 0 swings the leg back, x < 0 lifts it forward
//   rKnee, lKnee                  x > 0 bends the shin back
//   rAnkle, lAnkle
import * as THREE from 'three';
import { robloxMaterial } from './roblox.js';
import { addHead } from './r6.js';
import { clothedAtlas } from './clothing.js';

const D = Math.PI / 180;
let RIG = null;

// Roblox Motor6D name -> our joint name.
const JOINTS = {
  Waist: 'waist',
  Neck: 'neck',
  RightShoulder: 'rArm',
  LeftShoulder: 'lArm',
  RightElbow: 'rElbow',
  LeftElbow: 'lElbow',
  RightWrist: 'rWrist',
  LeftWrist: 'lWrist',
  RightHip: 'rLeg',
  LeftHip: 'lLeg',
  RightKnee: 'rKnee',
  LeftKnee: 'lKnee',
  RightAnkle: 'rAnkle',
  LeftAnkle: 'lAnkle',
};
export const JOINT_NAMES = Object.values(JOINTS);

// Body part -> its colour slot, which clothing layers it wears and its composite atlas.
const PARTS = {
  UpperTorso: ['torso', 'both', 'torso'],
  LowerTorso: ['torso', 'both', 'torso'],
  RightUpperArm: ['rArm', 'shirt', 'rightArm'],
  RightLowerArm: ['rArm', 'shirt', 'rightArm'],
  RightHand: ['rArm', 'shirt', 'rightArm'],
  LeftUpperArm: ['lArm', 'shirt', 'leftArm'],
  LeftLowerArm: ['lArm', 'shirt', 'leftArm'],
  LeftHand: ['lArm', 'shirt', 'leftArm'],
  RightUpperLeg: ['rLeg', 'pants', 'rightArm'],
  RightLowerLeg: ['rLeg', 'pants', 'rightArm'],
  RightFoot: ['rLeg', 'pants', 'rightArm'],
  LeftUpperLeg: ['lLeg', 'pants', 'leftArm'],
  LeftLowerLeg: ['lLeg', 'pants', 'leftArm'],
  LeftFoot: ['lLeg', 'pants', 'leftArm'],
};

// Roblox space faces -z; ours faces +z: turn 180 degrees about y.
const flip = ([x, y, z]) => [-x, y, -z];

/** Load the R15 rig data (meshes, joints, clothing composites) once, before building characters. */
export async function loadR15(url = '/animation/assets/rbx/meshes/r15.json') {
  if (RIG) return RIG;
  const data = await (await fetch(url)).json();
  const geometries = {};
  for (const [name, m] of Object.entries(data.parts)) {
    const n = m.positions.length / 3;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      pos.set(flip(m.positions.slice(3 * i, 3 * i + 3)), 3 * i);
      nor.set(flip(m.normals.slice(3 * i, 3 * i + 3)), 3 * i);
      // Mesh v points down the atlas; canvas textures are flipped (v up).
      uv[2 * i] = m.uvs[2 * i];
      uv[2 * i + 1] = 1 - m.uvs[2 * i + 1];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(m.indices);
    geometries[name] = g;
  }
  // Rest pose: every part's centre relative to LowerTorso, to find the ground and the root.
  const centre = { LowerTorso: [0, 0, 0] };
  const joints = Object.entries(data.joints).filter(([name]) => name in JOINTS);
  for (let pass = 0; pass < joints.length; pass++)
    for (const [, j] of joints) if (centre[j.part0] && !centre[j.part1]) centre[j.part1] = centre[j.part0].map((v, i) => v + j.c0[i] - j.c1[i]);
  const ground = Math.min(...['LeftFoot', 'RightFoot'].map((f) => centre[f][1] - data.parts[f].size[1] / 2));
  RIG = { geometries, joints, composites: data.composites, sizes: Object.fromEntries(Object.entries(data.parts).map(([k, v]) => [k, v.size])), lowerTorsoY: -ground - 3 };
  return RIG;
}

/**
 * Same options as createR6 (r6.js) except shirtFront.
 * @returns {{ root, joints, parts, setFace, pose, headPoint }}
 */
export function createR15({ assets, colors, faces = {}, face, shirt, pants, accessories = [] }) {
  if (!RIG) throw new Error('R15 rig not loaded (await loadR15() first)');
  const clothed = Boolean(shirt || pants);
  const root = new THREE.Group();
  root.rotation.order = 'YXZ';

  // Part frames: each part's centre. Joints are pivots between them, at Roblox's Motor6D C0/C1.
  const frames = { LowerTorso: new THREE.Group() };
  frames.LowerTorso.position.y = RIG.lowerTorsoY;
  root.add(frames.LowerTorso);
  const joints = {};
  for (let pass = 0; pass < RIG.joints.length; pass++)
    for (const [name, j] of RIG.joints) {
      if (!frames[j.part0] || frames[j.part1] || joints[JOINTS[name]]) continue;
      const pivot = new THREE.Group();
      pivot.position.set(...flip(j.c0));
      // Elbows bend (x) first, then swing the forearm in or out around the upper arm (y).
      if (name.endsWith('Elbow')) pivot.rotation.order = 'YXZ';
      frames[j.part0].add(pivot);
      joints[JOINTS[name]] = pivot;
      if (j.part1 === 'Head') continue; // the classic head goes on the neck below
      const f = new THREE.Group();
      f.position.set(...flip(j.c1).map((v) => -v));
      pivot.add(f);
      frames[j.part1] = f;
    }

  const parts = {};
  for (const [name, [slot, wears, atlas]] of Object.entries(PARTS)) {
    const color = colors[slot];
    let mat;
    if (clothed) {
      const layers = { pants: wears === 'shirt' ? null : pants, shirt: wears === 'pants' ? null : shirt };
      mat = new THREE.MeshStandardMaterial({ map: clothedAtlas(RIG.composites[atlas], atlas, color, layers), roughness: 0.55, envMapIntensity: 0.5 });
    } else {
      mat = robloxMaterial(assets, color, 'SmoothPlastic');
    }
    const mesh = new THREE.Mesh(RIG.geometries[name], mat);
    mesh.castShadow = mesh.receiveShadow = true;
    frames[name].add(mesh);
    parts[name] = frames[name];
  }

  const neck = joints.neck;
  const setFace = addHead(neck, { assets, colors, faces, face, accessories });

  return {
    root,
    joints,
    parts,
    setFace,
    /** Apply a pose (degrees): { root: { pos, rot }, <joint>: [x, y, z] }. Missing joints are reset to 0. */
    pose(p) {
      root.position.set(...p.root.pos);
      root.rotation.set(p.root.rot[0] * D, p.root.rot[1] * D, p.root.rot[2] * D);
      for (const [name, j] of Object.entries(joints)) {
        const a = p[name] ?? [0, 0, 0];
        j.rotation.set(a[0] * D, a[1] * D, a[2] * D);
      }
    },
    /** World position of a point given in head space (e.g. an eye). */
    headPoint(x, y, z, target = new THREE.Vector3()) {
      neck.updateWorldMatrix(true, false);
      return target.set(x, y, z).applyMatrix4(neck.matrixWorld);
    },
  };
}

/** Part sizes in studs (Roblox's InitialSize), e.g. for collision shapes. */
export const partSize = (name) => RIG.sizes[name];
