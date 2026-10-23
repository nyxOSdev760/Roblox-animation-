// Roblox R6 character built from the real rig: Roblox's classic head mesh and plain
// block limbs, with joints placed where R6's Motor6Ds put them.
//
// Units are studs. The character faces +z (Roblox characters face -z; everything here is
// rotated 180 degrees about y), so its right side is -x. The root is the torso centre
// (the HumanoidRootPart), 3 studs above the ground when standing.
//
// Poses are plain objects of Euler angles in DEGREES:
//   { root: { pos: [x, y, z], rot: [pitch, yaw, roll] }, neck, rArm, lArm, rLeg, lLeg }
// Joint angles are [x, y, z]. x > 0 swings a limb backwards (and tips the head/torso
// forward); z raises an arm sideways (rArm z < 0 and lArm z > 0 raise them outward).
import * as THREE from 'three';
import { robloxMaterial } from './roblox.js';
import { accessory } from './accessories.js';
import { clothedBox, clothedTexture } from './clothing.js';

const D = Math.PI / 180;

// head.mesh is already in studs: it spans ±0.6, which is where R6's FaceFrontAttachment
// (z = -0.6) and HairAttachment (y = 0.6) sit, so accessories fit it unscaled.
const HEAD_SCALE = 1;

let headGeometry = null;

/** Build the classic head geometry from head.mesh (converted to JSON by tools/rbx_mesh.py). */
export async function loadHeadMesh(url = '/animation/assets/rbx/meshes/head.json') {
  const m = await (await fetch(url)).json();
  const n = m.positions.length / 3;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    // Roblox front is -z: rotate 180 degrees about y to face +z.
    pos[3 * i] = -m.positions[3 * i] * HEAD_SCALE;
    pos[3 * i + 1] = m.positions[3 * i + 1] * HEAD_SCALE;
    pos[3 * i + 2] = -m.positions[3 * i + 2] * HEAD_SCALE;
    nor[3 * i] = -m.normals[3 * i];
    nor[3 * i + 1] = m.normals[3 * i + 1];
    nor[3 * i + 2] = -m.normals[3 * i + 2];
    // The mesh's UVs are the face decal projection (v points down in Roblox).
    uv[2 * i] = m.uvs[2 * i];
    uv[2 * i + 1] = 1 - m.uvs[2 * i + 1];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(m.indices);
  headGeometry = g;
  return g;
}

function block(material, sx, sy, sz) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function pivot(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** A canvas texture for clothing on one face of a body part. draw(ctx, w, h). */
export function clothingTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * @param {object} o
 * @param {object} o.assets      from loadRobloxAssets
 * @param {object} o.colors      { head, torso, rArm, lArm, rLeg, lLeg } BrickColor hex values
 * @param {object} [o.faces]     face decal textures by name
 * @param {string} o.face        starting face: a decal name from `faces`, or the slug of a
 *                               loaded UGC face accessory (see accessories.js)
 * @param {THREE.Texture} [o.shirtFront]  texture drawn on the torso front
 * @param {string} [o.shirt]     classic Shirt template slug (see clothing.js)
 * @param {string} [o.pants]     classic Pants template slug
 * @param {Array<string | ((neck: THREE.Group, assets: object) => void)>} [o.accessories]
 *        accessory slugs (hair, hats) or functions that add things to the head
 */
export function createR6({ assets, colors, faces = {}, face, shirtFront, shirt, pants, accessories = [] }) {
  const plastic = (c) => robloxMaterial(assets, c, 'Plastic');
  const clothed = Boolean(shirt || pants);
  // A body part: plain plastic, or the colour with classic clothing composited on top.
  const bodyPart = (part, color, sx, sy, sz) => {
    if (!clothed) return block(plastic(color), sx, sy, sz);
    const layers = { pants: part === 'rArm' || part === 'lArm' ? null : pants, shirt: part === 'rLeg' || part === 'lLeg' ? null : shirt };
    const mat = new THREE.MeshStandardMaterial({ map: clothedTexture(color, layers), roughness: 0.55, envMapIntensity: 0.5 });
    const mesh = new THREE.Mesh(clothedBox(part, sx, sy, sz), mat);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  };

  const root = new THREE.Group();
  root.rotation.order = 'YXZ';

  if (shirtFront && !clothed) {
    const torsoMat = plastic(colors.torso);
    const front = robloxMaterial(assets, 0xffffff, 'Plastic', { map: shirtFront });
    root.add(block([torsoMat, torsoMat, torsoMat, torsoMat, front, torsoMat], 2, 2, 1));
  } else {
    root.add(bodyPart('torso', colors.torso, 2, 2, 1));
  }

  const neck = pivot(root, 0, 1, 0);
  const head = new THREE.Mesh(headGeometry, plastic(colors.head));
  head.position.y = 0.5;
  head.castShadow = head.receiveShadow = true;
  neck.add(head);
  const faceMat = new THREE.MeshStandardMaterial({
    map: null,
    transparent: true,
    roughness: 0.5,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -4,
  });
  const faceMesh = new THREE.Mesh(headGeometry, faceMat);
  faceMesh.position.y = 0.5;
  neck.add(faceMesh);
  for (const a of [accessories].flat()) (typeof a === 'string' ? accessory(a) : a)(neck, assets);

  // Face: a decal texture on the head and/or UGC face accessory meshes. Pass one name or a
  // list to layer pieces, e.g. ['crying', 'face-addon-anger-vein'] or
  // ['face-eyes-shocked', 'face-mouth-small-frown']. Accessory pieces are attached the first
  // time they're used and then just shown/hidden.
  const faceAccessories = {};
  function setFace(name) {
    const names = [name].flat();
    const decal = names.find((n) => n in faces);
    faceMesh.visible = decal !== undefined;
    if (decal !== undefined) faceMat.map = faces[decal];
    for (const n of names) if (!(n in faces)) faceAccessories[n] ??= accessory(n)(neck, assets);
    for (const [slug, mesh] of Object.entries(faceAccessories)) mesh.visible = names.includes(slug);
  }
  setFace(face);

  const rArm = pivot(root, -1, 0.5, 0);
  const lArm = pivot(root, 1, 0.5, 0);
  const rLeg = pivot(root, -1, -1, 0);
  const lLeg = pivot(root, 1, -1, 0);
  for (const [j, part, c, x, y] of [
    [rArm, 'rArm', colors.rArm, -0.5, -0.5],
    [lArm, 'lArm', colors.lArm, 0.5, -0.5],
    [rLeg, 'rLeg', colors.rLeg, 0.5, -1],
    [lLeg, 'lLeg', colors.lLeg, -0.5, -1],
  ]) {
    const m = bodyPart(part, c, 1, 2, 1);
    m.position.set(x, y, 0);
    j.add(m);
  }

  const joints = { neck, rArm, lArm, rLeg, lLeg };
  return {
    root,
    joints,
    setFace,
    /** Apply a pose (degrees). Missing joints are reset to 0. */
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

/** Classic baseball cap accessory. */
export function cap(color, brimColor = color) {
  return (neck, assets) => {
    const top = 0.5 + 0.625;
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      robloxMaterial(assets, color, 'Plastic'),
    );
    crown.scale.y = 0.55;
    crown.position.y = top - 0.24;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.18, 32, 1, true), robloxMaterial(assets, color, 'Plastic', { side: THREE.DoubleSide }));
    band.position.y = top - 0.31;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.62), robloxMaterial(assets, brimColor, 'Plastic'));
    brim.position.set(0, top - 0.36, 0.78);
    brim.rotation.x = 0.12;
    for (const m of [crown, band, brim]) {
      m.castShadow = true;
      neck.add(m);
    }
  };
}
