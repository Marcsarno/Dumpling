import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { material, primitives } from './primitives';
import { createBlindBox, createDumpling } from './dumplingVisual';
import { DUMPLINGS } from '../data/collection';
import { HouseArt } from './HouseArt';
import type { Bedroom } from './bedroom';

export function createStore(app: Application) {
  const root = new Entity('Little Surprises store', app); app.root.addChild(root);
  const art = new HouseArt(app, root);
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
  furniture('Checkout counter', 1.65, -1.05, 1.5, 1, .9);
  art.add('market', 'cash-register', [1.55, 1.01, -1.05], .37, 180);
  art.add('furniture', 'plantSmall1', [2.15, 1.01, -1.05], .3);
  for (const x of [-2.15, 0]) {
    obstacles.push(new BoundingBox(new Vec3(x, 0, -3.03), new Vec3(.83, 1, .33)));
    art.add('furniture', 'bookcaseOpen', [x, .02, -3.03], 2.2);
    for (const [i,y] of [.23,.8,1.37].entries()) {
      const box = createBlindBox(app, root); box.root.setLocalScale(.43,.43,.43); box.root.setLocalPosition(x-.25,y,-2.94);
      const squishy = createDumpling(app, root, DUMPLINGS[i + (x === 0 ? 3 : 0)]); squishy.setLocalScale(.38,.38,.38); squishy.setLocalPosition(x+.27,y,-2.94);
    }
  }
  furniture('Blind box display', -.75, -.7, 1.45, .72, 1.1);
  const display = createBlindBox(app, root); display.root.setLocalPosition(-.75, .73, -.7);
  const glow = shape('Display welcome glow', 'cylinder', [-.75, .023, -.7], [2.1, .025, 1.8], material('Store focus', '#ffe4a6'), false);
  art.add('market','shelf-boxes',[-2.83,.02,.6],1.0,90);
  obstacles.push(new BoundingBox(new Vec3(-2.83,0,.6),new Vec3(.33,1,.65)));
  art.add('market','shopping-basket',[2.65,.03,2.5],.35);
  art.add('market','shopping-cart',[2.5,.02,.7],.9,180);
  obstacles.push(new BoundingBox(new Vec3(2.5,0,.7),new Vec3(.38,1,.55)));
  art.add('furniture','bear',[2.1,1.02,-.76],.24);
  art.add('furniture','pottedPlant',[-2.75,.02,2.5],.95);
  // Tall window, soft awning and colored gift-shop trim retain the existing walkable footprint.
  shape('Shop window frame','box',[-3.22,1.7,.6],[.13,1.65,2.6],cream);
  shape('Shop window glass','box',[-3.14,1.7,.6],[.02,1.45,2.4],material('Window aqua','#acd5d4'));
  for(let i=0;i<7;i++)shape('Striped shop awning','box',[-2.95,2.64,-.6+i*.4],[.7,.12,.4],i%2?pink:lilac);
  for(const x of [-2.2,-1.1,0,1.1,2.2]) shape('Gift shop bunting','cone',[x,2.75,-3.45],[.4,-.38,.025],x%2?lilac:cream,false);
  const room: Bedroom = { root, obstacles, halfWidth: 3.3, halfDepth: 3.6, ready: art.finish(), artStats: () => art.snapshot() };
  root.enabled = false;
  return { ...room, display, glow, displayAnchor: new Vec3(-.75, 0, .1), exitAnchor: new Vec3(0, 0, 2.8) };
}
