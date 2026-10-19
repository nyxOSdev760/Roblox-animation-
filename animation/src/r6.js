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

const D = Math.PI / 180;

// Head part is 2x1x1 with a SpecialMesh (MeshType Head) at scale 1.25; head.mesh spans
// ±0.6, so the classic head ends up ~1.25 studs each way.
const HEAD_SCALE = 1.25 / 1.2;

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
 * @param {object} o.faces       face textures by name
 * @param {string} o.face        starting face
 * @param {THREE.Texture} [o.shirtFront]  texture drawn on the torso front
 * @param {(neck: THREE.Group, assets: object) => void} [o.accessories]  adds hats etc. to the head
 */
export function createR6({ assets, colors, faces, face, shirtFront, accessories }) {
  const plastic = (c) => robloxMaterial(assets, c, 'Plastic');

  const root = new THREE.Group();
  root.rotation.order = 'YXZ';

  let torsoMat = plastic(colors.torso);
  if (shirtFront) {
    const front = robloxMaterial(assets, 0xffffff, 'Plastic', { map: shirtFront });
    torsoMat = [torsoMat, torsoMat, torsoMat, torsoMat, front, torsoMat];
  }
  root.add(block(torsoMat, 2, 2, 1));

  const neck = pivot(root, 0, 1, 0);
  const head = new THREE.Mesh(headGeometry, plastic(colors.head));
  head.position.y = 0.5;
  head.castShadow = head.receiveShadow = true;
  neck.add(head);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faces[face],
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
  accessories?.(neck, assets);

  const rArm = pivot(root, -1, 0.5, 0);
  const lArm = pivot(root, 1, 0.5, 0);
  const rLeg = pivot(root, -1, -1, 0);
  const lLeg = pivot(root, 1, -1, 0);
  for (const [j, c, x, y] of [
    [rArm, colors.rArm, -0.5, -0.5],
    [lArm, colors.lArm, 0.5, -0.5],
    [rLeg, colors.rLeg, 0.5, -1],
    [lLeg, colors.lLeg, -0.5, -1],
  ]) {
    const m = block(plastic(c), 1, 2, 1);
    m.position.set(x, y, 0);
    j.add(m);
  }

  const joints = { neck, rArm, lArm, rLeg, lLeg };
  return {
    root,
    joints,
    setFace(name) {
      faceMat.map = faces[name];
    },
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
