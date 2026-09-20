import { Entity, Vec3, type Application } from 'playcanvas';
import type { CleanupItem, CleanupProps, Interaction } from './cleanupProps';
import { importProp } from './ImportedProp';
import { material, primitives } from './primitives';
import { DogAnimator } from './DogAnimator';

export const PET_TASKS = [{ id: 'pet-care', name: 'Scoop · flush · wash', icon: '🐾', room: 'Living room & bathroom' }];

/** One chore with ordered steps. Only handwashing completes the mission task. */
export class PetCleanup {
  stage: 'tool' | 'scoop' | 'flush' | 'wash' | 'done' = 'tool';
  active = false;
  loaded = false;
  readonly errors: string[] = [];
  readonly tool: CleanupItem;
  readonly poop: Entity;
  readonly dog: Entity;
  dogAnimator?:DogAnimator;
  private readonly bubbles: Entity;
  private readonly water: Entity;
  private flushStart = 0;
  constructor(app: Application, private readonly props: CleanupProps) {
    const tool = new Entity('Pooper scooper', app); props.root.addChild(tool);
    this.tool = { id: 'scooper', name: 'Scooper', icon: '🥄', entity: tool, home: [3.8, .04, 3.0], carryPace: 'walk' };
    tool.setLocalPosition(...this.tool.home); props.items.push(this.tool);
    this.poop = new Entity('Dog poop', app); props.root.addChild(this.poop);
    this.poop.setLocalPosition(3.7, .04, 5.3);
    const dog = this.dog = new Entity('Sunny pup', app); props.root.addChild(dog); dog.setLocalPosition(4.8, .04, 5.85);
    const paper = new Entity('Bathroom toilet paper', app); props.root.addChild(paper); paper.setLocalPosition(6.21, .7, -.8);
    const soap = new Entity('Hand soap', app); props.root.addChild(soap); soap.setLocalPosition(3.83, .96, -3.03);
    void Promise.all([
      importProp(app, tool, 'shovel', .75, false, [180, 0, 0]), importProp(app, this.poop, 'poop', .18),
      importProp(app, dog, 'sunny-pup', .48, true).then(model=>{this.dogAnimator=new DogAnimator(dog,model);}), importProp(app, paper, 'paper', .24), importProp(app, soap, 'soap', .21),
    ]).then(() => { this.loaded = true; dog.setLocalEulerAngles(0, 30, 0); }).catch(error => { this.errors.push(String(error)); console.error('Pet assets failed to load', error); });
    const shape = primitives(app, props.root), mint = material('Clean water', '#9bdae7');
    this.water = shape('Toilet flushing water', 'cylinder', [5.78, .48, -.36], [.33, .015, .28], mint, false);
    this.bubbles = new Entity('Handwashing bubbles', app); props.root.addChild(this.bubbles); this.bubbles.setLocalPosition(4.1, .98, -2.98);
    const bubble = primitives(app, this.bubbles);
    for (let i = 0; i < 8; i++) bubble('Soap bubble', 'sphere', [Math.sin(i * 2) * .17, (i % 3) * .065, Math.cos(i * 2) * .12], [.08, .08, .08], mint, false);
    props.interactions.push(
      { id: 'pickup-scooper', name: 'Scooper', icon: '🥄', kind: 'pickup', item: 'scooper', task: 'pet-care', anchor: new Vec3(...this.tool.home), marker: new Vec3(3.8, 1, 3), range: .85, available: carried => this.loaded && this.stage === 'tool' && !carried },
      { id: 'scoop-poop', name: 'Dog poop', icon: '💩', kind: 'pet', actionLabel: 'Scoop', task: 'pet-care', item: 'scooper', anchor: new Vec3(3.7, 0, 5.3), marker: new Vec3(3.7, .55, 5.3), range: .9, available: carried => this.stage === 'scoop' && carried === 'scooper' },
      { id: 'flush-poop', name: 'Toilet', icon: '🚽', kind: 'pet', actionLabel: 'Flush', task: 'pet-care', item: 'scooper', anchor: new Vec3(5.15, 0, -.38), marker: new Vec3(5.87, 1, -.38), range: .85, available: carried => this.stage === 'flush' && carried === 'scooper' },
      { id: 'wash-hands', name: 'Wash your hands', icon: '🫧', kind: 'pet', actionLabel: 'Wash hands', task: 'pet-care', anchor: new Vec3(4.12, 0, -2.35), marker: new Vec3(4.1, 1.45, -3.08), range: .9, available: carried => this.stage === 'wash' && !carried },
    );
    this.reset(false);
  }
  allows(target: Interaction) { return !this.active || this.stage !== 'wash' || target.task === 'pet-care'; }
  pickedUp() { if (this.stage === 'tool') this.stage = 'scoop'; }
  scoop() {
    if (this.stage !== 'scoop') return;
    this.poop.reparent(this.tool.entity); this.poop.setLocalPosition(0, .08, .045); this.stage = 'flush';
  }
  flush(now: number) {
    if (this.stage !== 'flush') return;
    this.poop.reparent(this.props.root); this.poop.setLocalPosition(5.78, .5, -.36);
    this.flushStart = now; this.stage = 'wash'; this.tool.entity.enabled = false;
  }
  update(now: number, washProgress = 0, hands?: Vec3) {
    this.bubbles.enabled = this.active && washProgress > 0;
    if (this.bubbles.enabled) { if (hands) this.bubbles.setPosition(hands); this.bubbles.setLocalEulerAngles(0, now / 8, 0); this.bubbles.setLocalScale(1 + washProgress * .4, 1, 1); }
    this.water.enabled = this.active && this.flushStart > 0 && now - this.flushStart < 900;
    if (this.water.enabled) {
      const t = Math.min(1, (now - this.flushStart) / 900), size = Math.max(.01, 1 - t);
      this.poop.setLocalPosition(5.78 + Math.cos(t * 14) * .09 * size, .5 - t * .17, -.36 + Math.sin(t * 14) * .09 * size);
      this.poop.setLocalScale(size, size, size); this.water.setLocalEulerAngles(0, t * 400, 0);
    } else if (this.stage === 'wash' || this.stage === 'done') this.poop.enabled = false;
  }
  finish() { this.stage = 'done'; this.bubbles.enabled = false; }
  reset(active: boolean) {
    this.active = active; this.stage = 'tool'; this.flushStart = 0;
    this.tool.entity.reparent(this.props.root); this.tool.entity.setLocalPosition(...this.tool.home); this.tool.entity.setLocalEulerAngles(0, 0, 0); this.tool.entity.enabled = active;
    this.poop.reparent(this.props.root); this.poop.setLocalPosition(3.7, .04, 5.3); this.poop.setLocalScale(1, 1, 1); this.poop.enabled = active;
    this.water.enabled = false; this.bubbles.enabled = false;
  }
  get hint() {
    if (!this.active || this.stage === 'done') return null;
    return { tool: '🐾 Pick up the scooper by the landing, then find the poop.', scoop: '🥄 Carry the scooper to the dog poop, then tap Scoop.', flush: '🚽 Take the loaded scooper to the bathroom toilet and tap Flush.', wash: '🫧 Almost done! Go to the bathroom sink and wash your hands.' }[this.stage];
  }
  snapshot() { return { stage: this.stage, loaded: this.loaded, errors: this.errors, poopVisible: this.poop.enabled, poopParent: this.poop.parent?.name, washing: this.bubbles.enabled, flushing: this.water.enabled }; }
}
