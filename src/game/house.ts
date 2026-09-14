import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { HOUSE_DOORS, HOUSE_ROOMS } from '../data/house';
import { createBedroom, type Bedroom } from './bedroom';
import { primitives } from './primitives';

/** One resident world. Room metadata never loads/unloads scenes during walking. */
export function createHouse(app: Application): Bedroom {
  const bedroom = createBedroom(app), m = bedroom.materials!;
  const root = new Entity('Connected house', app); app.root.addChild(root); bedroom.root.reparent(root);
  const obstacles = bedroom.obstacles;
  // Compact house-wide material batches trade fine culling for fewer mobile draw submissions.
  const group = app.batcher.addGroup('House shared static furniture', false, 30);
  const shape = primitives(app, root, group.id);
  function block(x: number, z: number, w: number, d: number) {
    obstacles.push(new BoundingBox(new Vec3(x, .7, z), new Vec3(w / 2, 1.4, d / 2)));
  }
  const box = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, color = m.trim) => shape(name, 'box', [x, y, z], [w, h, d], color);
  const round = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, color = m.pink) => shape(name, 'sphere', [x, y, z], [w, h, d], color);
  function cabinet(name: string, x: number, z: number, w: number, d: number, color = m.trim, h = .85) {
    block(x, z, w, d); box(name, x, h / 2, z, w, h, d, color);
    box(`${name} top`, x, h + .055, z, w + .07, .11, d + .07, m.wood);
  }
  function plant(x: number, y: number, z: number, size = .7) {
    shape('House plant pot', 'cylinder', [x, y + .16 * size, z], [.38 * size, .32 * size, .38 * size], m.trim);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const leaf = round('House plant leaf', x + Math.sin(a) * .12 * size, y + .44 * size, z + Math.cos(a) * .12 * size, .2 * size, .5 * size, .15 * size, i % 2 ? m.green : m.mint);
      leaf.setLocalEulerAngles(Math.cos(a) * 30, 0, Math.sin(a) * -30);
    }
  }
  function basket(name: string, x: number, z: number, w = .65, d = .55) {
    block(x, z, w, d); box(name, x, .24, z, w, .45, d, m.wood);
    box('Basket lining', x, .48, z, w + .05, .08, d + .05, m.trim);
    box('Basket opening', x, .526, z, w - .14, .015, d - .14, m.pinkLight);
  }
  for (const room of HOUSE_ROOMS.filter(r => r.id !== 'bedroom')) {
    const w = room.maxX - room.minX, d = room.maxZ - room.minZ, x = (room.minX + room.maxX) / 2, z = (room.minZ + room.maxZ) / 2;
    box(`${room.name} foundation`, x, -.22, z, w, .4, d, m.purple);
    box(`${room.name} floor`, x, -.025, z, w, .1, d, room.id === 'bathroom' ? m.sky : room.id === 'laundry' ? m.pinkLight : m.floor);
    for (let seam = room.minZ + .35; seam < room.maxZ; seam += room.id === 'bathroom' ? .65 : .45) {
      shape('House floor joint', 'box', [x, .031, seam], [w, .004, .012], room.id === 'bathroom' ? m.trim : m.seam, false);
    }
  }
  // Cutaway boundaries stay low, with real collision gaps for every doorway.
  // Only the northern exterior and original bedroom backdrop keep full-height walls.
  function wall(axis: 'x' | 'z', fixed: number, from: number, to: number, height = .3) {
    const cuts = HOUSE_DOORS.filter(door => door.axis === axis && Math.abs((axis === 'x' ? door.z : door.x) - fixed) < .01)
      .map(door => ({ start: (axis === 'x' ? door.x : door.z) - door.width / 2, end: (axis === 'x' ? door.x : door.z) + door.width / 2 }))
      .filter(gap => gap.end > from && gap.start < to).sort((a, b) => a.start - b.start);
    let cursor = from;
    function segment(a: number, b: number) {
      if (b - a < .01) return;
      const x = axis === 'x' ? (a + b) / 2 : fixed, z = axis === 'z' ? (a + b) / 2 : fixed;
      const w = axis === 'x' ? b - a : .12, d = axis === 'z' ? b - a : .12;
      box('Cutaway wall', x, height / 2, z, w, height, d, m.sideWall);
      box('Cutaway wall cap', x, height + .04, z, w + .05, .08, d + .05, m.trim); block(x, z, w, d);
    }
    for (const gap of cuts) { segment(cursor, Math.max(cursor, gap.start)); cursor = Math.max(cursor, gap.end); }
    segment(cursor, to);
  }
  wall('z', 3.3, -3.6, 3.6); wall('x', 3.6, -3.3, 5.3);
  wall('z', 5.3, -4.3, 4.7); wall('x', -.9, 5.3, 16.3);
  wall('z', 9.3, -4.3, -.9); wall('z', 11.3, -.9, 4.7);
  wall('x', 4.7, 5.3, 16.3); wall('z', 16.3, -.9, 4.7);
  wall('z', 13.8, -4.3, -.9); wall('x', -4.3, 3.3, 13.8, 2.8);
  wall('z', 3.3, -4.3, -3.6);
  // Bedroom's original left/back walls already exist; these add their collision boundaries.
  block(-3.35, 0, .15, 7.3); block(0, -3.65, 6.8, .15);
  for (const door of HOUSE_DOORS) {
    box('Ivory doorway threshold', door.x, .04, door.z, door.axis === 'x' ? door.width : .2, .03, door.axis === 'z' ? door.width : .2, m.trim);
    for (const sign of [-1, 1]) {
      const x = door.x + (door.axis === 'x' ? sign * door.width / 2 : 0), z = door.z + (door.axis === 'z' ? sign * door.width / 2 : 0);
      box('Low doorway jamb', x, .28, z, .17, .56, .17, m.trim);
    }
  }
  // Hall: slim storage at its unused ends, leaving a 2-unit-wide circulation spine.
  cabinet('Hall shoe bench', 4.3, 2.8, 1.3, .45, m.trim, .42);
  box('Bench cushion', 4.3, .54, 2.8, 1.24, .16, .43, m.pink);
  cabinet('Hall mail table', 4.3, -3.65, 1.2, .5, m.trim, .7);
  box('Mail tray', 4.25, .82, -3.62, .5, .09, .31, m.purple); plant(4.7, .81, -3.67, .45);
  box('Hall runner', 4.3, .06, -.2, .9, .025, 3.6, m.rug);

  // Living room, the central gathering space.
  block(7.2, -.15, 2.6, 1.05);
  box('Sofa base', 7.2, .35, -.15, 2.6, .45, 1.05, m.purple);
  box('Sofa back', 7.2, .8, -.55, 2.6, .9, .23, m.purple);
  for (const x of [6, 8.4]) box('Sofa arm', x, .64, -.1, .22, .65, 1, m.purple);
  for (const x of [6.65, 7.7]) box('Sofa seat', x, .63, 0, 1, .22, .76, m.pinkLight);
  round('Sofa cushion', 6.5, .89, -.3, .55, .5, .19, m.pink);
  shape('Living rug', 'cylinder', [8.15, .06, 2.1], [3.6, .026, 3.2], m.rug, false);
  cabinet('Coffee table', 8.2, 1.9, 1.3, .85, m.wood, .42);
  box('Coffee table book', 8.4, .56, 1.88, .43, .05, .3, m.blue);
  cabinet('TV console', 9.1, -.4, 1, .5, m.trim, .6);
  box('TV frame', 9.1, 1.28, -.52, 1.05, 1.1, .12, m.dark);
  box('TV pastel screen', 9.1, 1.29, -.445, .9, .92, .02, m.sky);
  cabinet('Living shelf', 6, 3.9, .8, .48, m.trim, 1.15);
  for (let i = 0; i < 4; i++) box('Living shelf book', 5.76 + i * .15, 1.43, 3.9, .11, .37, .3, [m.pink, m.purple, m.blue, m.yellow][i]);
  basket('Toy basket', 9.8, 3.9, .8, .7); plant(6, 1.26, 3.9, .45);
  plant(10.6, .03, 4.1, .85); block(10.6, 4.1, .4, .4);

  // Kitchen: appliances along the right/back edges, with a clear path through the middle.
  cabinet('Refrigerator', 15.65, -.15, .9, 1, m.trim, 1.9);
  box('Fridge divider', 15.65, 1.27, .36, .83, .035, .025, m.purple);
  box('Fridge handle', 15.34, .83, .4, .045, .47, .07, m.wood);
  cabinet('Sink counter', 14.1, -.4, 1.7, .8, m.trim);
  box('Sink rim', 14.1, .98, -.37, .95, .06, .6, m.trim);
  box('Sink basin', 14.1, 1.017, -.37, .72, .015, .42, m.blue);
  box('Faucet stem', 14.1, 1.15, -.67, .065, .3, .065, m.dark);
  box('Faucet spout', 14.1, 1.3, -.56, .065, .065, .26, m.dark);
  cabinet('Stove', 15.7, 1.5, .9, .85, m.trim);
  box('Stove top', 15.7, .97, 1.5, .86, .055, .8, m.dark);
  for (const x of [15.48, 15.92]) for (const z of [1.28, 1.72]) shape('Stove ring', 'cylinder', [x, 1.01, z], [.24, .02, .24], m.purple, false);
  box('Oven door', 15.7, .47, 1.934, .68, .48, .03, m.dark);
  cabinet('Kitchen cabinet', 15.65, 3.25, .9, 1.45, m.pinkLight);
  box('Cabinet drawer', 15.65, .67, 3.99, .77, .25, .02, m.trim);
  cabinet('Small kitchen island', 13.9, 2.15, 1.05, 1.25, m.mint, .8);
  plant(13.9, .91, 2.3, .45);
  basket('Kitchen trash bin', 12.15, 4.04, .6, .6);
  box('Trash bin lid', 12.15, .55, 4.04, .65, .08, .65, m.mint);

  // Laundry: two front-loading appliances and a folding counter.
  for (const [x, name] of [[10.25, 'Washer'], [11.55, 'Dryer']] as const) {
    cabinet(name, x, -3.55, 1.05, 1.1, m.trim, 1.05);
    round(`${name} outer door`, x, .55, -2.97, .73, .73, .075, m.purple);
    round(`${name} glass`, x, .55, -2.915, .52, .52, .04, m.sky);
    box(`${name} control panel`, x, .93, -2.98, .88, .16, .025, m.pinkLight);
    round(`${name} dial`, x + .29, .93, -2.94, .1, .1, .04, m.dark);
  }
  cabinet('Laundry folding counter', 13, -3.62, 1.2, .9, m.trim, .85);
  basket('Clean laundry basket', 13.05, -1.5, .7, .55);
  box('Laundry wall shelf', 11.55, 2, -4.05, 2.7, .12, .42, m.wood);
  for (let i = 0; i < 3; i++) box('Folded shelf linen', 11.3, 2.13 + i * .09, -4.05, .7, .075, .32, [m.pink, m.blue, m.purple][i]);
  plant(12.45, 2.08, -4.03, .5);

  // Bathroom: a simple readable family bathroom, with open circulation between both doors.
  cabinet('Bathroom vanity', 6.3, -3.75, 1.25, .7, m.trim, .82);
  round('Vanity sink rim', 6.3, .96, -3.72, .8, .1, .5, m.trim);
  round('Vanity sink bowl', 6.3, 1.012, -3.7, .58, .015, .33, m.sky);
  box('Vanity faucet', 6.3, 1.08, -3.99, .06, .22, .06, m.dark);
  box('Mirror frame', 6.3, 1.87, -4.19, 1.1, 1.08, .08, m.wood);
  box('Mirror', 6.3, 1.87, -4.14, .94, .92, .025, m.sky);
  block(8.2, -3.57, 1.65, 1.1);
  box('Bathtub base', 8.2, .3, -3.57, 1.65, .58, 1.1, m.trim);
  box('Bathtub opening', 8.2, .604, -3.57, 1.32, .018, .77, m.sky);
  box('Bath tap', 8.91, .74, -3.57, .08, .27, .08, m.wood);
  block(8.65, -1.47, .63, .75);
  round('Toilet pedestal', 8.65, .24, -1.44, .41, .48, .48, m.trim);
  round('Toilet bowl', 8.65, .49, -1.38, .63, .2, .75, m.trim);
  round('Toilet seat', 8.65, .605, -1.33, .49, .035, .51, m.pinkLight);
  box('Toilet cistern', 8.65, .67, -1.77, .55, .6, .23, m.trim);
  box('Bath mat', 7.38, .058, -2.08, 1.12, .024, .7, m.rug);
  // Freestanding low towel rail avoids another tall foreground wall.
  block(6.2, -1.16, 1.05, .18);
  for (const x of [5.75, 6.65]) box('Towel rack leg', x, .5, -1.16, .06, 1, .06, m.wood);
  box('Towel rack bar', 6.2, 1, -1.16, 1, .06, .07, m.wood);
  basket('Bathroom basket', 7.3, -1.26, .55, .48);
  app.batcher.generate([group.id]);
  return { root, obstacles, materials: m, halfWidth: 16.4, halfDepth: 4.8, walkable: [...HOUSE_ROOMS] };
}
