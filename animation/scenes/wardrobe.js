// Preview of imported accessories: one character per item, each framed in turn.
//   node render.mjs wardrobe --stills 0,1,2 ...   (with ?items= set by WARDROBE_ITEMS)
// Still number i (time t = i) shows item i in a 3/4 front view.
import { createR6 } from '../src/r6.js';
import { BRICK, SKIN } from '../src/roblox.js';

const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const items = (query.get('items') || '').split(',').filter(Boolean);
const faceItems = items.filter((s) => s.startsWith('face-'));

export const meta = {
  duration: 1,
  fps: 30,
  width: 600,
  height: 600,
  faces: ['happy'],
  accessories: items,
};

const SPACING = 8;

export function setup({ scene, camera, assets, faces, sun }) {
  const ground = items.length * SPACING;
  sun.target.position.set(ground / 2, 0, 0);
  sun.position.set(ground / 2 + 20, 60, 40);
  sun.shadow.camera.left = -ground;
  sun.shadow.camera.right = ground;
  sun.shadow.camera.updateProjectionMatrix();

  items.forEach((slug, i) => {
    const isFace = faceItems.includes(slug);
    const ch = createR6({
      assets,
      faces,
      face: isFace ? slug : 'happy',
      accessories: isFace ? [] : [slug],
      colors: { head: SKIN.lightOrange, torso: BRICK.mediumStoneGrey, rArm: SKIN.lightOrange, lArm: SKIN.lightOrange, rLeg: BRICK.darkStoneGrey, lLeg: BRICK.darkStoneGrey },
    });
    ch.pose({ root: { pos: [i * SPACING, 3, 0], rot: [0, isFace ? 0 : 28, 0] } });
    scene.add(ch.root);
  });
  scene.fog = null;

  return (t) => {
    const i = Math.round(t);
    const isFace = faceItems.includes(items[i]);
    camera.fov = 30;
    camera.position.set(i * SPACING + (isFace ? 0 : 1.2), 5.2, isFace ? 6.2 : 8.4);
    camera.lookAt(i * SPACING, isFace ? 4.5 : 4.4, 0);
    camera.updateProjectionMatrix();
  };
}
