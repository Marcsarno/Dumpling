import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { material, primitives } from './primitives';

export interface Bedroom {
  root: Entity;
  obstacles: BoundingBox[];
  halfWidth: number;
  halfDepth: number;
}

export function createBedroom(app: Application): Bedroom {
  const root = new Entity('Bedroom', app);
  app.root.addChild(root);
  const group = app.batcher.addGroup('Static bedroom', false, 30);
  const shape = primitives(app, root, group.id);
  const m = {
    wall: material('Warm blush plaster', '#eed1d2'),
    sideWall: material('Lilac plaster', '#d4c7e4'),
    trim: material('Ivory trim', '#fff1df'),
    wood: material('Honey birch', '#d4a778'),
    floor: material('Light oak', '#e3bd91'),
    seam: material('Floor seams', '#d5ae86'),
    pink: material('Rose', '#e99db9'),
    pinkLight: material('Petal pink', '#f6c8d7'),
    purple: material('Soft lavender', '#b39ad7'),
    rug: material('Lilac rug', '#c1abd9'),
    petals: material('Rug daisies', '#decee9'),
    yellow: material('Butter yellow', '#f3d68f'),
    mint: material('Soft sage', '#96baa1'),
    green: material('Leaf green', '#709975'),
    blue: material('Powder blue', '#9cbed5'),
    dark: material('Dark details', '#76647e'),
    sky: material('Window sky', '#c4e4ea'),
  };
  const obstacles: BoundingBox[] = [];
  const block = (x: number, z: number, w: number, d: number) => obstacles.push(new BoundingBox(new Vec3(x, 0.7, z), new Vec3(w / 2, 1.4, d / 2)));

  // Open front/right edges keep the whole walking area visible.
  shape('Room foundation', 'box', [0, -0.22, 0], [6.8, 0.4, 7.4], m.purple);
  shape('Oak floor', 'box', [0, -0.025, 0], [6.6, 0.1, 7.2], m.floor);
  for (let z = -3.3; z < 3.5; z += 0.45) shape('Plank joint', 'box', [0, 0.03, z], [6.6, 0.004, 0.012], m.seam, false);
  for (let i = 0; i < 15; i++) {
    const z = -3.375 + i * 0.45;
    for (let x = -2.8 + (i % 3) * 0.75; x < 3.3; x += 2.25) shape('Staggered plank end', 'box', [x, 0.031, z], [0.012, 0.003, 0.44], m.seam, false);
  }
  shape('Back wall', 'box', [0, 1.4, -3.65], [6.8, 2.8, 0.15], m.wall);
  shape('Left wall', 'box', [-3.35, 1.4, 0], [0.15, 2.8, 7.3], m.sideWall);
  shape('Back skirting', 'box', [0, 0.16, -3.53], [6.6, 0.23, 0.09], m.trim);
  shape('Left skirting', 'box', [-3.23, 0.16, 0], [0.09, 0.23, 7.1], m.trim);
  shape('Back wall cap', 'box', [0, 2.83, -3.65], [6.87, 0.09, 0.23], m.trim);
  shape('Left wall cap', 'box', [-3.35, 2.83, 0], [0.23, 0.09, 7.4], m.trim);

  // A bright window and two simple curtain panels.
  shape('Window frame', 'box', [-3.22, 1.86, -0.8], [0.16, 1.62, 2.12], m.trim);
  shape('Window glass', 'box', [-3.12, 1.86, -0.8], [0.018, 1.42, 1.92], m.sky, false);
  shape('Window crossbar', 'box', [-3.09, 1.86, -0.8], [0.04, 0.055, 1.97], m.trim);
  shape('Window mullion', 'box', [-3.09, 1.86, -0.8], [0.04, 1.44, 0.065], m.trim);
  shape('Window sill', 'box', [-3.08, 1.06, -0.8], [0.42, 0.09, 2.3], m.trim);
  for (const z of [-2, 0.4]) {
    shape('Curtain', 'box', [-3.04, 1.83, z], [0.14, 1.87, 0.38], m.pink);
    shape('Curtain tie', 'box', [-2.94, 1.38, z], [0.045, 0.1, 0.4], m.pinkLight);
  }

  // Bed, just primitives; its full footprint blocks walking.
  block(-2.05, -1.7, 1.76, 2.95);
  shape('Bed frame', 'box', [-2.05, 0.42, -1.7], [1.65, 0.28, 2.85], m.trim);
  for (const x of [-2.77, -1.33]) for (const z of [-3.03, -0.37]) shape('Bed leg', 'box', [x, 0.24, z], [0.13, 0.45, 0.13], m.trim);
  shape('Headboard', 'box', [-2.05, 0.92, -3.03], [1.75, 1.3, 0.13], m.trim);
  shape('Headboard inset', 'box', [-2.05, 1.03, -2.94], [1.47, 0.55, 0.055], m.pinkLight);
  shape('Mattress', 'box', [-2.05, 0.64, -1.65], [1.55, 0.23, 2.65], m.trim);
  shape('Pink duvet', 'box', [-2.05, 0.79, -1.16], [1.59, 0.19, 1.7], m.pink);
  shape('Folded lavender blanket', 'box', [-2.05, 0.895, -0.73], [1.62, 0.035, 0.47], m.purple);
  const pillow = shape('Pillow', 'sphere', [-2.05, 0.88, -2.5], [1.12, 0.24, 0.58], m.pinkLight);
  pillow.setEulerAngles(0, -5, 0);
  shape('Pillow button', 'sphere', [-2.05, 1.015, -2.48], [0.19, 0.035, 0.19], m.pink, false);

  // Rug with simple daisy motifs.
  shape('Round rug', 'cylinder', [0, 0.055, 0.7], [3.65, 0.025, 3.65], m.rug, false);
  for (const [x, z] of [[-0.8, 0.2], [0.65, 0.1], [-0.65, 1.55], [0.8, 1.35]]) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const petal = shape('Daisy petal', 'sphere', [x + Math.sin(a) * 0.2, 0.078, z + Math.cos(a) * 0.2], [0.27, 0.009, 0.42], m.petals, false);
      petal.setEulerAngles(0, a * 180 / Math.PI, 0);
    }
    shape('Daisy center', 'cylinder', [x, 0.084, z], [0.19, 0.005, 0.19], m.yellow, false);
  }

  // Bookshelf assembled from reusable boards and book blocks.
  block(1.12, -3.05, 1.65, 0.73);
  shape('Shelf back', 'box', [1.12, 0.99, -3.31], [1.6, 1.9, 0.1], m.wood);
  for (const x of [0.32, 1.92]) shape('Shelf side', 'box', [x, 1.02, -3.04], [0.12, 1.97, 0.65], m.trim);
  for (const y of [0.15, 0.73, 1.31, 1.97]) shape('Shelf board', 'box', [1.12, y, -3.02], [1.76, 0.1, 0.75], m.trim);
  [m.purple, m.pink, m.blue, m.mint, m.yellow].forEach((mat, i) => shape('Book', 'box', [0.54 + i * 0.235, 1.56, -3.03], [0.17, 0.41 + (i % 2) * 0.11, 0.38], mat));
  shape('Storage basket', 'box', [1.14, 0.43, -3.02], [1.2, 0.44, 0.52], m.pink);
  shape('Basket label', 'box', [1.14, 0.44, -2.75], [0.29, 0.13, 0.018], m.pinkLight);
  for (let i = 0; i < 3; i++) shape('Stacked book', 'box', [0.81, 0.83 + i * 0.09, -2.99], [0.65 - i * 0.05, 0.075, 0.4], [m.blue, m.yellow, m.purple][i]);

  // Nightstand and a single decorative lamp (no extra realtime light).
  block(-0.53, -2.8, 0.83, 0.75);
  shape('Nightstand', 'box', [-0.53, 0.44, -2.83], [0.75, 0.78, 0.68], m.trim);
  shape('Drawer', 'box', [-0.53, 0.61, -2.475], [0.64, 0.23, 0.027], m.pinkLight);
  shape('Drawer pull', 'sphere', [-0.53, 0.61, -2.435], [0.07, 0.07, 0.07], m.wood);
  shape('Lamp base', 'cylinder', [-0.53, 0.88, -2.83], [0.32, 0.06, 0.32], m.yellow);
  shape('Lamp stem', 'cylinder', [-0.53, 1.09, -2.83], [0.05, 0.41, 0.05], m.wood);
  shape('Lamp shade', 'cone', [-0.53, 1.39, -2.83], [0.53, 0.49, 0.53], m.yellow);

  // Storage chest, desk and stool, decorative in this milestone.
  block(2.48, -1.55, 1.15, 1.36);
  shape('Toy chest', 'box', [2.48, 0.4, -1.55], [1.08, 0.7, 1.22], m.wood);
  shape('Toy chest lid', 'box', [2.48, 0.78, -1.55], [1.16, 0.1, 1.32], m.yellow);
  shape('Chest label', 'box', [2.48, 0.46, -0.927], [0.52, 0.21, 0.015], m.trim);
  block(2.33, 1.24, 1.54, 1.05);
  shape('Desk top', 'box', [2.33, 1.05, 1.24], [1.55, 0.13, 1.03], m.trim);
  for (const x of [1.72, 2.94]) for (const z of [0.87, 1.63]) shape('Desk leg', 'box', [x, 0.53, z], [0.1, 1.0, 0.1], m.wood);
  shape('Notebook', 'box', [2.32, 1.145, 1.31], [0.5, 0.05, 0.62], m.pink);
  shape('Notebook pages', 'box', [2.32, 1.178, 1.31], [0.44, 0.015, 0.56], m.trim);
  block(2.05, 2.15, 0.69, 0.69);
  shape('Stool cushion', 'cylinder', [2.05, 0.56, 2.15], [0.66, 0.17, 0.66], m.pink);
  for (const x of [1.84, 2.26]) for (const z of [1.94, 2.36]) shape('Stool leg', 'box', [x, 0.27, z], [0.07, 0.49, 0.07], m.wood);

  function plant(x: number, y: number, z: number, scale = 1) {
    shape('Plant pot', 'cylinder', [x, y + 0.18 * scale, z], [0.4 * scale, 0.36 * scale, 0.4 * scale], m.trim);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const leaf = shape('Plant leaf', 'sphere', [x + Math.sin(a) * 0.16 * scale, y + 0.51 * scale, z + Math.cos(a) * 0.16 * scale], [0.2 * scale, 0.56 * scale, 0.15 * scale], i % 2 ? m.green : m.mint);
      leaf.setEulerAngles(Math.cos(a) * 30, 0, Math.sin(a) * -30);
    }
  }
  plant(1.62, 2.03, -3.04, 0.7);
  plant(2.69, 1.12, 1.02, 0.55);
  plant(-2.66, 0.03, 2.45, 1.25);
  block(-2.66, 2.45, 0.6, 0.6);
  // Simple wall art: a daisy made from the same shapes used on the rug.
  shape('Picture frame', 'box', [-1.0, 2.03, -3.52], [0.89, 1.07, 0.08], m.wood);
  shape('Picture paper', 'box', [-1.0, 2.03, -3.47], [0.75, 0.93, 0.018], m.trim);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    shape('Picture petal', 'sphere', [-1 + Math.sin(a) * 0.16, 2.08 + Math.cos(a) * 0.16, -3.445], [0.2, 0.2, 0.016], m.pink, false);
  }
  shape('Picture center', 'sphere', [-1, 2.08, -3.425], [0.17, 0.17, 0.015], m.yellow, false);
  shape('Picture caption', 'box', [-1, 1.72, -3.435], [0.3, 0.025, 0.01], m.purple, false);
  app.batcher.generate([group.id]);
  return { root, obstacles, halfWidth: 3.3, halfDepth: 3.6 };
}
