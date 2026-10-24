// Static sets are built from hundreds of small parts. bake() merges every mesh that shares a
// material into one mesh, so a detailed room costs a handful of draw calls instead of hundreds.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Bake a group of static parts (already positioned) into merged meshes, one per material and
 * shadow setting. Meshes with several materials (signs, panels) and transparent ones (glass)
 * are kept as they are. Returns a new group in world space; `root` is emptied. The group's
 * userData.colliders lists every part's bounding box (in that same space) for physics.js.
 */
export function bake(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const keep = [];
  const colliders = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.userData.noCollide) colliders.push(new THREE.Box3().setFromObject(o));
    if (Array.isArray(o.material) || o.material.transparent || o.userData.keep) {
      keep.push(o);
      return;
    }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    g.clearGroups();
    g.applyMatrix4(o.matrixWorld);
    const key = `${o.material.uuid}|${o.castShadow}`;
    if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, geos: [] });
    buckets.get(key).geos.push(g);
  });
  const out = new THREE.Group();
  for (const { material, cast, geos } of buckets.values()) {
    const m = new THREE.Mesh(mergeGeometries(geos), material);
    m.castShadow = cast;
    m.receiveShadow = true;
    out.add(m);
    for (const g of geos) g.dispose();
  }
  for (const o of keep) out.attach(o);
  out.userData.colliders = colliders;
  return out;
}
