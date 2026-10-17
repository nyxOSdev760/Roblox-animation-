// Blocky R6-style Roblox character: head, torso, two arms, two legs, each on its own joint.
//
// Units are studs. The character's origin is its hip joint (2 studs above the feet when
// standing) and it faces +z. Its right side is -x.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COLORS = {
  brightYellow: 0xf5cd30,
  brightBlue: 0x0d69ac,
  brightGreen: 0xa4bd47,
  black: 0x1b1d22,
  darkGrey: 0x3a3d45,
  brightRed: 0xc4281c,
  white: 0xf2f3f3,
};

const HEAD_R = 0.62;
const HEAD_H = 0.6; // half height

function plastic(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0 });
}

// Roblox's classic head: a cylinder with rounded top and bottom edges.
function headGeometry() {
  const k = 0.17; // edge rounding
  const pts = [new THREE.Vector2(0, -HEAD_H)];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(HEAD_R - k + k * Math.cos(a), -HEAD_H + k + k * Math.sin(a)));
  }
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(HEAD_R - k + k * Math.cos(a), HEAD_H - k + k * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0, HEAD_H));
  return new THREE.LatheGeometry(pts, 64);
}

// The face decal wraps around the front of the head like it does in Roblox.
function faceGeometry() {
  const h = 0.98;
  const arc = h / HEAD_R; // square decal: arc length == height
  return new THREE.CylinderGeometry(HEAD_R + 0.004, HEAD_R + 0.004, h, 32, 1, true, -arc / 2, arc);
}

function part(geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function joint(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function baseballCap(color) {
  const cap = new THREE.Group();
  const mat = plastic(color);
  const dome = part(new THREE.SphereGeometry(HEAD_R + 0.06, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.scale.y = 0.62;
  dome.position.y = 2 * HEAD_H - 0.28;
  const brim = part(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32, 1, false, -Math.PI / 2, Math.PI), mat);
  brim.position.set(0, 2 * HEAD_H - 0.26, HEAD_R - 0.05);
  brim.scale.z = 1.25;
  cap.add(dome, brim);
  return cap;
}

/**
 * @param {object} o
 * @param {{head:number, torso:number, leftArm:number, rightArm:number, leftLeg:number, rightLeg:number}} o.colors
 * @param {Record<string, THREE.Texture>} o.faces  face textures by name
 * @param {string} o.face  starting face
 * @param {number} [o.cap]  colour of a baseball cap, if any
 */
export function createR6({ colors, faces, face, cap }) {
  const root = new THREE.Group(); // position (at hip height) + facing
  const body = new THREE.Group(); // tumbles around the hips
  root.add(body);

  const torso = part(new RoundedBoxGeometry(2, 2, 1, 3, 0.06), plastic(colors.torso));
  torso.position.y = 1;
  body.add(torso);

  const neck = joint(body, 0, 2, 0);
  const head = part(headGeometry(), plastic(colors.head));
  head.position.y = HEAD_H;
  neck.add(head);

  const faceMat = new THREE.MeshStandardMaterial({
    map: faces[face],
    transparent: true,
    roughness: 0.5,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const faceMesh = new THREE.Mesh(faceGeometry(), faceMat);
  faceMesh.position.y = HEAD_H;
  neck.add(faceMesh);

  if (cap !== undefined) neck.add(baseballCap(cap));

  const limb = () => new RoundedBoxGeometry(1, 2, 1, 3, 0.06);
  const rightShoulder = joint(body, -1.5, 1.5, 0);
  const leftShoulder = joint(body, 1.5, 1.5, 0);
  const rightHip = joint(body, -0.5, 0, 0);
  const leftHip = joint(body, 0.5, 0, 0);
  for (const [j, c, y] of [
    [rightShoulder, colors.rightArm, -0.5],
    [leftShoulder, colors.leftArm, -0.5],
    [rightHip, colors.rightLeg, -1],
    [leftHip, colors.leftLeg, -1],
  ]) {
    const m = part(limb(), plastic(c));
    m.position.y = y;
    j.add(m);
  }

  return {
    root,
    body,
    neck,
    rightShoulder,
    leftShoulder,
    rightHip,
    leftHip,
    setFace(name) {
      faceMat.map = faces[name];
    },
    /** Zero every joint so each frame can pose from scratch. */
    resetPose() {
      for (const j of [body, neck, rightShoulder, leftShoulder, rightHip, leftHip]) j.rotation.set(0, 0, 0);
      body.position.set(0, 0, 0);
    },
  };
}
