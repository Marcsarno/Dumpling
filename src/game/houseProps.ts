import { Entity, Vec3, type Application } from 'playcanvas';
import type { Bedroom } from './bedroom';
import { createCleanupProps, type CleanupItem, type CleanupProps } from './cleanupProps';
import { primitives, type Triple } from './primitives';

/** Data-driven Carryable/DropZone pairs use the bedroom's existing interaction and carry systems. */
export function createHouseProps(app: Application, house: Bedroom): CleanupProps {
  const props = createCleanupProps(app, house), m = house.materials!, extras: CleanupItem[] = [];
  let active: readonly string[] = [];
  function pair(id: string, name: string, icon: string, home: Triple, destination: string, anchor: Triple, placement: Triple, visual: 'toy' | 'cloth' | 'plate' | 'trash' | 'bottle' | 'mail' | 'shoes', range = .95) {
    const entity = new Entity(name, app); props.root.addChild(entity); entity.setLocalPosition(...home);
    const item: CleanupItem = { id, name, icon, entity, home }; extras.push(item); props.items.push(item);
    const shape = primitives(app, entity);
    if (visual === 'toy') {
      shape('Toy body', 'sphere', [0, .19, 0], [.34, .36, .28], m.yellow);
      shape('Toy head', 'sphere', [0, .44, 0], [.33, .29, .27], m.yellow);
      for (const x of [-.13, .13]) shape('Toy ear', 'sphere', [x, .56, 0], [.13, .13, .1], m.yellow);
      for (const x of [-.065, .065]) shape('Toy eye', 'sphere', [x, .46, .13], [.035, .04, .02], m.dark, false);
      shape('Toy nose', 'sphere', [0, .4, .14], [.05, .035, .025], m.dark, false);
    } else if (visual === 'cloth') {
      shape('Folded fabric', 'box', [0, .07, 0], [.44, .12, .33], id.includes('towel') ? m.blue : m.pink);
      shape('Fabric stripe', 'box', [0, .134, 0], [.32, .015, .07], m.trim, false);
    } else if (visual === 'plate') {
      shape('Dish rim', 'cylinder', [0, .035, 0], [.45, .05, .45], m.trim);
      shape('Dish center', 'cylinder', [0, .063, 0], [.3, .008, .3], m.sky, false);
    } else if (visual === 'bottle') {
      shape('Toiletry bottle', 'cylinder', [0, .17, 0], [.19, .31, .19], m.mint);
      shape('Bottle cap', 'cylinder', [0, .35, 0], [.12, .06, .12], m.trim);
    } else if (visual === 'mail') {
      shape('Envelope', 'box', [0, .04, 0], [.35, .045, .24], m.trim);
      shape('Envelope stamp', 'box', [.1, .067, .06], [.065, .012, .065], m.pink, false);
    } else if (visual === 'shoes') {
      for (const x of [-.11, .11]) shape('Little shoe', 'capsule', [x, .09, 0], [.16, .15, .32], m.purple);
    } else {
      for (let i = 0; i < 3; i++) shape('Crumpled paper', 'box', [(i - 1) * .09, .07 + i * .025, 0], [.16, .13, .16], i % 2 ? m.pinkLight : m.trim);
    }
    props.interactions.push(
      { id: `pickup-${id}`, name, icon, kind: 'pickup', item: id, task: id, anchor: new Vec3(...home), marker: new Vec3(home[0], home[1] + .6, home[2]), range: .85 },
      { id: `place-${id}`, name: destination, icon, kind: 'place', item: id, task: id, anchor: new Vec3(...anchor), marker: new Vec3(placement[0], placement[1] + .65, placement[2]), range, placement, placedStyle: id === 'bath-towel' ? 'hang' : ['kitchen-trash', 'laundry-clothes'].includes(id) ? 'hide' : undefined },
    );
  }
  pair('hall-shoes', 'Shoes', '👟', [4.28, .09, 1.65], 'Shoe bench', [4.3, 0, 2.3], [4.3, .66, 2.8], 'shoes');
  pair('hall-mail', 'Mail', '✉', [4.3, .09, -1.3], 'Mail tray', [4.3, 0, -3], [4.25, .91, -3.62], 'mail');
  pair('living-toy', 'Living-room toy', '🧸', [6.3, .09, 1.5], 'Toy basket', [9.8, 0, 3.35], [9.8, .56, 3.9], 'toy');
  pair('living-cushion', 'Cushion', '♡', [9.15, .09, 2.7], 'Sofa', [7.55, 0, .75], [7.7, .83, -.15], 'cloth', 1.05);
  pair('kitchen-dish', 'Dish', '🍽', [12.15, .09, 1.45], 'Kitchen sink', [14.1, 0, .4], [14.1, 1.04, -.37], 'plate', 1.05);
  pair('kitchen-trash', 'Trash', '♻', [14.7, .09, 3.85], 'Trash bin', [12.15, 0, 3.45], [12.15, .62, 4.04], 'trash');
  pair('laundry-clothes', 'Dirty laundry', '👕', [11.45, .09, -1.85], 'Washer', [10.25, 0, -2.55], [10.25, .53, -2.9], 'cloth');
  pair('laundry-clean', 'Clean laundry', '▤', [13.05, .56, -1.5], 'Folding counter', [13, 0, -2.83], [13, .99, -3.62], 'cloth');
  pair('bath-towel', 'Bath towel', '▤', [7.6, .09, -2.6], 'Towel rack', [6.2, 0, -1.85], [6.2, .92, -1.16], 'cloth');
  pair('bath-bottle', 'Toiletries', '♧', [7.75, .09, -1.35], 'Vanity', [6.3, 0, -3.08], [6.67, .98, -3.75], 'bottle');
  const resetBedroom = props.reset;
  function visibility() {
    for (const item of props.items) item.entity.enabled = active.includes(item.id === 'vacuum' ? 'dirt' : item.id);
    props.dirt.enabled = active.includes('dirt'); props.crayonMess.enabled = active.includes('crayons'); props.tidyCrayons.enabled = !active.includes('crayons');
  }
  props.reset = () => {
    resetBedroom();
    for (const item of extras) { item.entity.reparent(props.root); item.entity.setLocalPosition(...item.home); item.entity.setLocalEulerAngles(0, 0, 0); }
    visibility();
  };
  props.configure = tasks => { active = tasks; props.reset(); };
  return props;
}
