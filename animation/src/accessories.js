// Roblox catalog accessories (hair, UGC faces, hats) imported by tools/roblox_assets.py.
//
// Each one lives in assets/rbx/accessories/<slug>/ as model.json (+ texture.png), already
// positioned on a classic R6 head: origin at the head centre, facing +z. Scenes list the
// slugs they use in meta.accessories so they are loaded before setup() runs, then pass
// accessory('<slug>') to createR6({ accessories: [...] }).
import * as THREE from 'three';

const BASE = '/animation/assets/rbx/accessories';
const loaded = new Map(); // slug -> { geometry, material }

export async function loadAccessories(slugs) {
  const loader = new THREE.TextureLoader();
  await Promise.all(
    slugs.map(async (slug) => {
      if (loaded.has(slug)) return;
      const m = await (await fetch(`${BASE}/${slug}/model.json`)).json();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
      g.setIndex(m.indices);
      const params = { roughness: 0.6, metalness: 0, envMapIntensity: 0.5 };
      if (m.texture) {
        const tex = await loader.loadAsync(`${BASE}/${slug}/texture.png`);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        Object.assign(params, { map: tex, color: new THREE.Color(...m.tint), alphaTest: 0.5 });
      } else {
        params.color = new THREE.Color(...m.color);
      }
      if (m.kind === 'face') {
        // Face accessories are thin decal-like shells just in front of the head.
        Object.assign(params, { transparent: true, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      }
      loaded.set(slug, { geometry: g, material: new THREE.MeshStandardMaterial(params), kind: m.kind, name: m.name });
    }),
  );
}

/** Returns an accessory attacher for createR6 (adds the mesh to the character's neck). */
export function accessory(slug) {
  return (neck) => {
    const a = loaded.get(slug);
    if (!a) throw new Error(`accessory ${slug} not loaded (add it to meta.accessories)`);
    const mesh = new THREE.Mesh(a.geometry, a.material);
    mesh.position.y = 0.5; // head centre sits 0.5 above the neck joint
    mesh.castShadow = a.kind !== 'face';
    mesh.receiveShadow = true;
    if (a.kind === 'face') mesh.renderOrder = 1;
    neck.add(mesh);
    return mesh;
  };
}
