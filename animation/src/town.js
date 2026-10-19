// A small Roblox-style street built from parts: sidewalk, road, houses, trees, lamps.
// The action happens on the sidewalk along the x axis (top surface at y = 0); the camera
// looks toward -z, so the road and houses are the backdrop.
import * as THREE from 'three';
import { BRICK, part, cylinder, ball, wedge } from './roblox.js';

function tree(a, x, z, s = 1) {
  const g = new THREE.Group();
  g.add(cylinder(a, 0.6 * s, 7 * s, [0, 3.5 * s - 0.2, 0], BRICK.reddishBrown, 'Wood'));
  g.add(ball(a, 3.2 * s, [0, 8 * s, 0], BRICK.brightGreen, 'Grass'));
  g.add(ball(a, 2.4 * s, [1.8 * s, 6.8 * s, 0.8 * s], BRICK.darkGreen, 'Grass'));
  g.add(ball(a, 2.2 * s, [-1.7 * s, 7 * s, -0.6 * s], BRICK.darkGreen, 'Grass'));
  g.position.set(x, 0, z);
  return g;
}

function lamp(a, x, z) {
  const g = new THREE.Group();
  g.add(cylinder(a, 0.25, 12, [0, 6, 0], BRICK.darkStoneGrey, 'Metal'));
  g.add(part(a, [0.3, 0.3, 2.6], [0, 11.8, 1.1], BRICK.darkStoneGrey, 'Metal'));
  g.add(part(a, [1, 0.5, 1.2], [0, 11.5, 2.2], BRICK.darkStoneGrey, 'Metal'));
  g.add(part(a, [0.8, 0.15, 1], [0, 11.2, 2.2], BRICK.institutionalWhite, 'Neon'));
  g.position.set(x, 0, z);
  return g;
}

function windowPart(a, x, y, z, w = 4, h = 4) {
  const g = new THREE.Group();
  g.add(part(a, [w + 0.6, h + 0.6, 0.3], [0, 0, -0.05], BRICK.institutionalWhite, 'Plastic'));
  g.add(part(a, [w, h, 0.32], [0, 0, 0], BRICK.pastelBlue, 'Glass', { shadows: false }));
  g.add(part(a, [0.25, h, 0.36], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'));
  g.add(part(a, [w, 0.25, 0.36], [0, 0, 0], BRICK.institutionalWhite, 'Plastic'));
  g.position.set(x, y, z);
  return g;
}

/** A two-storey house facing +z. */
function house(a, x, z, { wall, wallMat, roof, roofMat, door = BRICK.reddishBrown, width = 20, depth = 14, height = 14 }) {
  const g = new THREE.Group();
  const w = width;
  const d = depth;
  const h = height;
  g.add(part(a, [w, h, d], [0, h / 2, 0], wall, wallMat));
  // Gable roof from two wedges, with an overhang.
  const rh = 6;
  g.add(wedge(a, [w + 2, rh, d / 2 + 1], [0, h + rh / 2, -(d / 4 + 0.5)], roof, roofMat, Math.PI));
  g.add(wedge(a, [w + 2, rh, d / 2 + 1], [0, h + rh / 2, d / 4 + 0.5], roof, roofMat, 0));
  // Front door, steps, windows.
  g.add(part(a, [4, 7, 0.4], [0, 3.5, d / 2 + 0.1], door, 'WoodPlanks'));
  g.add(part(a, [0.4, 0.4, 0.3], [1.2, 3.5, d / 2 + 0.4], BRICK.brightYellow, 'Metal'));
  g.add(part(a, [6, 0.6, 2], [0, 0.3, d / 2 + 1], BRICK.mediumStoneGrey, 'Concrete'));
  for (const wx of [-6, 6]) g.add(windowPart(a, wx, 4.5, d / 2 + 0.1));
  for (const wx of [-6, 0, 6]) g.add(windowPart(a, wx, 10.5, d / 2 + 0.1, 3.5, 3.5));
  g.position.set(x, 0, z);
  return g;
}

function fence(a, x0, x1, z) {
  const g = new THREE.Group();
  for (let x = x0; x <= x1; x += 2) g.add(part(a, [0.4, 3, 0.4], [x, 1.5, z], BRICK.institutionalWhite, 'WoodPlanks'));
  g.add(part(a, [x1 - x0 + 0.4, 0.4, 0.25], [(x0 + x1) / 2, 2.3, z], BRICK.institutionalWhite, 'WoodPlanks'));
  g.add(part(a, [x1 - x0 + 0.4, 0.4, 0.25], [(x0 + x1) / 2, 1.0, z], BRICK.institutionalWhite, 'WoodPlanks'));
  return g;
}

export function buildTown(scene, a) {
  const add = (o) => scene.add(o);

  // Ground and street. Sidewalk top is y = 0.
  add(part(a, [600, 1, 600], [0, -0.75, 0], BRICK.brightGreen, 'Grass', { shadows: false }));
  add(part(a, [300, 1, 7], [0, -0.5, 0], BRICK.mediumStoneGrey, 'Concrete', { shadows: false }));
  add(part(a, [300, 0.6, 0.6], [0, -0.2, 3.5], BRICK.lightStoneGrey, 'Concrete', { shadows: false }));
  add(part(a, [300, 1, 16], [0, -0.7, -11.5], BRICK.darkStoneGrey, 'Slate', { shadows: false }));
  for (let x = -150; x < 150; x += 10) add(part(a, [5, 0.05, 0.5], [x, -0.18, -11.5], BRICK.brightYellow, 'Plastic', { shadows: false }));
  add(part(a, [300, 0.05, 0.35], [0, -0.18, -4.3], BRICK.institutionalWhite, 'Plastic', { shadows: false }));
  add(part(a, [300, 0.05, 0.35], [0, -0.18, -18.7], BRICK.institutionalWhite, 'Plastic', { shadows: false }));
  add(part(a, [300, 1, 6], [0, -0.5, -22.5], BRICK.mediumStoneGrey, 'Concrete', { shadows: false }));

  // Houses across the road.
  add(house(a, -26, -42, { wall: BRICK.brightRed, wallMat: 'Brick', roof: BRICK.darkStoneGrey, roofMat: 'Slate' }));
  add(house(a, 2, -44, { wall: BRICK.brickYellow, wallMat: 'WoodPlanks', roof: BRICK.reddishBrown, roofMat: 'WoodPlanks', door: BRICK.brightBlue }));
  add(house(a, 30, -42, { wall: BRICK.white, wallMat: 'Brick', roof: BRICK.brightBlue, roofMat: 'Slate', door: BRICK.brightRed }));
  add(fence(a, -36, -16, -30));
  add(fence(a, 20, 40, -30));

  for (const [x, z, s] of [[-12, -32, 1], [14, -33, 1.1], [44, -34, 1], [-40, -32, 1.05], [-8, 14, 1], [18, 16, 1.1], [-30, 12, 1]]) add(tree(a, x, z, s));
  for (const x of [-18, 24, 50]) add(lamp(a, x, -2.6));
}
