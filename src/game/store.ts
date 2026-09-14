import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { material, primitives } from './primitives';
import { createBlindBox } from './dumplingVisual';
import type { Bedroom } from './bedroom';

export function createStore(app: Application) {
  const root = new Entity('Little Surprises store', app); app.root.addChild(root);
  const shape = primitives(app, root), obstacles: BoundingBox[] = [];
  const cream = material('Store ivory', '#fff0de'), wood = material('Store birch', '#dab38b');
  const lilac = material('Store lavender', '#cbb8e0'), pink = material('Store pink', '#edbed2');
  shape('Shop floor', 'box', [0, -.1, 0], [6.6, .2, 7.2], wood);
  shape('Shop back wall', 'box', [0, 1.5, -3.65], [6.8, 3.2, .15], pink);
  shape('Shop side wall', 'box', [-3.35, 1.5, 0], [.15, 3.2, 7.2], lilac);
  shape('Welcome mat', 'box', [0, .012, 2.8], [1.8, .025, 1], lilac, false);
  function furniture(name: string, x: number, z: number, w: number, h: number, d: number) {
    shape(name, 'box', [x, h / 2, z], [w, h, d], cream);
    obstacles.push(new BoundingBox(new Vec3(x, 0, z), new Vec3(w / 2, 1, d / 2)));
  }
  furniture('Checkout counter', 2.15, -1.8, 1.7, 1, 1.1);
  shape('Till', 'box', [2.15, 1.17, -1.8], [.48, .3, .38], lilac);
  for (const x of [-2.15, 0]) {
    furniture('Display shelf', x, -3.03, 1.65, .35, .65);
    shape('Shelf back', 'box', [x, 1.2, -3.28], [1.65, 2.3, .12], cream);
    for (const y of [.65, 1.45, 2.25]) {
      shape('Shelf ledge', 'box', [x, y, -3.02], [1.75, .09, .7], wood);
      for (const offset of [-.45, .15]) {
        const box = createBlindBox(app, root); box.root.setLocalScale(.55, .55, .55); box.root.setLocalPosition(x + offset, y + .05, -3.02);
      }
    }
  }
  furniture('Blind box display', -.75, -.7, 1.45, .72, 1.1);
  const display = createBlindBox(app, root); display.root.setLocalPosition(-.75, .73, -.7);
  const glow = shape('Display welcome glow', 'cylinder', [-.75, .023, -.7], [2.1, .025, 1.8], material('Store focus', '#ffe4a6'), false);
  const room: Bedroom = { root, obstacles, halfWidth: 3.3, halfDepth: 3.6 };
  root.enabled = false;
  return { ...room, display, glow, displayAnchor: new Vec3(-.75, 0, .1), exitAnchor: new Vec3(0, 0, 2.8) };
}
