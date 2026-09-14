import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import type { Bedroom } from './bedroom';
import { material, primitives, type Triple } from './primitives';
import type { TaskId } from '../systems/MissionSystem';

export type ItemId = 'teddy' | 'shirt' | 'book' | 'vacuum';
export interface CleanupItem { id: ItemId; name: string; icon: string; entity: Entity; home: Triple }
export interface Interaction {
  id: string;
  name: string;
  icon: string;
  kind: 'pickup' | 'place' | 'crayons' | 'vacuum';
  anchor: Vec3;
  marker: Vec3;
  range: number;
  item?: ItemId;
  task?: TaskId;
  placement?: Triple;
}

export function createCleanupProps(app: Application, room: Bedroom) {
  const root = new Entity('Cleanup props', app);
  app.root.addChild(root);
  const m = {
    bear: material('Teddy caramel', '#ba865e'), muzzle: material('Teddy cream', '#f5d4a3'),
    pink: material('Cleanup rose', '#e486ad'), blue: material('Cleanup book blue', '#739fcf'),
    purple: material('Vacuum lavender', '#9c7ac3'), cream: material('Cleanup ivory', '#fff0dc'),
    dark: material('Cleanup detail', '#65506e'), yellow: material('Crayon yellow', '#f1cd75'),
    mint: material('Crayon mint', '#89b99f'), dirt: material('Dust mauve', '#a9949d'),
  };
  function item(id: ItemId, name: string, icon: string, home: Triple): CleanupItem {
    const entity = new Entity(name, app); root.addChild(entity); entity.setLocalPosition(...home);
    return { id, name, icon, entity, home };
  }
  const items: CleanupItem[] = [
    item('teddy', 'Teddy', '🧸', [-0.7, 0.11, 1.55]),
    item('shirt', 'Shirt', '👕', [-1.7, 0.12, 0.55]),
    item('book', 'Book', '📘', [0.25, 0.12, -0.8]),
    item('vacuum', 'Vacuum', '✦', [0.1, 0.1, 2.65]),
  ];
  const teddy = primitives(app, items[0].entity);
  teddy('Teddy body', 'sphere', [0, 0.16, 0], [0.3, 0.34, 0.25], m.bear);
  teddy('Teddy head', 'sphere', [0, 0.4, 0], [0.33, 0.3, 0.28], m.bear);
  for (const x of [-0.13, 0.13]) {
    teddy('Teddy ear', 'sphere', [x, 0.52, 0], [0.13, 0.13, 0.09], m.bear);
    teddy('Teddy foot', 'sphere', [x, 0.045, 0.07], [0.15, 0.12, 0.18], m.bear);
    teddy('Teddy paw', 'sphere', [x * 1.4, 0.2, 0], [0.12, 0.2, 0.13], m.bear);
    teddy('Teddy eye', 'sphere', [x * 0.5, 0.43, 0.135], [0.035, 0.04, 0.02], m.dark, false);
  }
  teddy('Teddy muzzle', 'sphere', [0, 0.36, 0.13], [0.15, 0.1, 0.075], m.muzzle);
  const shirt = primitives(app, items[1].entity);
  shirt('Shirt body', 'box', [0, 0.035, 0], [0.4, 0.055, 0.46], m.pink);
  for (const x of [-0.26, 0.26]) {
    const sleeve = shirt('Sleeve', 'box', [x, 0.035, -0.14], [0.22, 0.06, 0.18], m.pink);
    sleeve.setLocalEulerAngles(0, x < 0 ? -25 : 25, 0);
  }
  shirt('Shirt flower', 'sphere', [0, 0.065, -0.04], [0.13, 0.012, 0.13], m.cream, false);
  const book = primitives(app, items[2].entity);
  book('Book pages', 'box', [0, 0.055, 0], [0.36, 0.09, 0.46], m.cream);
  for (const y of [0.005, 0.11]) book('Book cover', 'box', [0, y, 0], [0.4, 0.02, 0.5], m.blue);
  book('Book spine', 'box', [-0.19, 0.055, 0], [0.025, 0.12, 0.5], m.blue);
  book('Cover star', 'sphere', [0, 0.125, 0], [0.12, 0.012, 0.12], m.yellow, false);
  const vacuum = primitives(app, items[3].entity);
  vacuum('Vacuum head', 'box', [0, 0.06, 0.12], [0.45, 0.13, 0.3], m.purple);
  vacuum('Vacuum tank', 'capsule', [0, 0.36, 0], [0.24, 0.49, 0.21], m.purple);
  vacuum('Vacuum handle', 'cylinder', [0, 0.72, 0], [0.055, 0.44, 0.055], m.dark);
  vacuum('Vacuum grip', 'box', [0, 0.92, 0], [0.23, 0.06, 0.07], m.dark);

  // Add only the required hamper; the approved room and all existing furniture stay intact.
  const fixed = primitives(app, root);
  const hamperPosition: Triple = [-2.55, 0, 1.0];
  fixed('Laundry hamper', 'cylinder', [-2.55, 0.33, 1.0], [0.67, 0.64, 0.67], m.cream);
  fixed('Hamper opening', 'cylinder', [-2.55, 0.655, 1.0], [0.53, 0.013, 0.53], m.purple, false);
  for (const y of [0.14, 0.28, 0.42, 0.56]) fixed('Hamper weave', 'cylinder', [-2.55, y, 1.0], [0.69, 0.025, 0.69], m.muzzle);
  room.obstacles.push(new BoundingBox(new Vec3(...hamperPosition), new Vec3(0.35, 1, 0.35)));

  const crayonMess = new Entity('Scattered crayons', app); root.addChild(crayonMess);
  crayonMess.setLocalPosition(2.23, 1.2, 0.97);
  const crayons = primitives(app, crayonMess);
  [m.pink, m.blue, m.yellow, m.mint].forEach((mat, i) => {
    const pen = crayons('Scattered crayon', 'cylinder', [-0.33 + i * 0.2, 0.015, i % 2 * 0.17], [0.065, 0.31, 0.065], mat);
    pen.setLocalEulerAngles(90, i * 43, 0);
  });
  const tidyCrayons = new Entity('Tidy crayon cup', app); root.addChild(tidyCrayons);
  tidyCrayons.setLocalPosition(1.86, 1.14, 1.05);
  const tidy = primitives(app, tidyCrayons);
  tidy('Pencil cup', 'cylinder', [0, 0.1, 0], [0.2, 0.2, 0.2], m.purple);
  [m.pink, m.blue, m.yellow, m.mint].forEach((mat, i) => tidy('Tidy crayon', 'cylinder', [(i % 2 - 0.5) * 0.07, 0.22, (Math.floor(i / 2) - 0.5) * 0.07], [0.045, 0.25, 0.045], mat));
  tidyCrayons.enabled = false;

  const dirt = new Entity('Dirt pile', app); root.addChild(dirt); dirt.setLocalPosition(-1.4, 0.085, 2.65);
  const dust = primitives(app, dirt);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    dust('Dust clump', 'sphere', [Math.sin(a) * 0.24, 0.012, Math.cos(a) * 0.24], [0.25 + i % 2 * 0.12, 0.05, 0.23], m.dirt, false);
  }

  const interactions: Interaction[] = items.map(item => ({
    id: `pickup-${item.id}`, name: item.name, icon: item.icon, kind: 'pickup', item: item.id,
    anchor: new Vec3(...item.home), marker: new Vec3(item.home[0], item.home[1] + (item.id === 'vacuum' ? 0.82 : 0.62), item.home[2]), range: 0.85,
  }));
  interactions.push(
    { id: 'toy-chest', name: 'Toy chest', icon: '🧸', kind: 'place', item: 'teddy', task: 'teddy', anchor: new Vec3(2.48, 0, -0.79), marker: new Vec3(2.48, 1.45, -1.55), range: 1.1, placement: [2.48, 0.85, -1.55] },
    { id: 'hamper', name: 'Laundry hamper', icon: '👕', kind: 'place', item: 'shirt', task: 'shirt', anchor: new Vec3(-2.55, 0, 1.0), marker: new Vec3(-2.55, 1.04, 1.0), range: 1.05, placement: [-2.55, 0.69, 1.0] },
    { id: 'bookshelf', name: 'Bookshelf', icon: '📘', kind: 'place', item: 'book', task: 'book', anchor: new Vec3(1.12, 0, -2.55), marker: new Vec3(1.12, 2.35, -3.05), range: 1.05, placement: [1.51, 0.79, -2.99] },
    { id: 'crayons', name: 'Crayons', icon: '🖍', kind: 'crayons', task: 'crayons', anchor: new Vec3(1.6, 0, 1.05), marker: new Vec3(2.15, 1.68, 1.04), range: 0.88 },
    { id: 'dirt', name: 'Dirt pile', icon: '✦', kind: 'vacuum', item: 'vacuum', task: 'dirt', anchor: new Vec3(-1.4, 0, 2.65), marker: new Vec3(-1.4, 0.55, 2.65), range: 1.0 },
  );
  const reset = () => {
    for (const item of items) {
      item.entity.reparent(root); item.entity.setLocalPosition(...item.home);
      item.entity.setLocalEulerAngles(0, 0, 0); item.entity.setLocalScale(1, 1, 1); item.entity.enabled = true;
    }
    crayonMess.enabled = true; crayonMess.setLocalScale(1, 1, 1);
    dirt.enabled = true; dirt.setLocalScale(1, 1, 1); tidyCrayons.enabled = false;
  };
  return { root, items, interactions, crayonMess, tidyCrayons, dirt, reset };
}
export type CleanupProps = ReturnType<typeof createCleanupProps>;
