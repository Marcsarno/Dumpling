import { Entity, math, type AnimTrack, type Asset, type Vec3 } from 'playcanvas';

/** Only visual presentation lives here. The movement root never depends on a model or rig. */
export class CharacterAnimator {
  private model: Entity | null = null;
  private readonly states = new Set<string>();
  private state = '';
  private time = 0;
  constructor(private readonly visual: Entity, private readonly placeholder: Entity) {}
  attach(model: Entity, animations: Asset[]) {
    this.model = model;
    for (const asset of animations) {
      const track = asset.resource as AnimTrack;
      const name = track.name || asset.name;
      if (!['Idle', 'Walk'].includes(name)) continue;
      if (!model.anim) model.addComponent('anim', { activate: true });
      model.anim!.assignAnimation(name, track);
      this.states.add(name);
    }
    this.state = '';
  }
  update(dt: number, velocity: Vec3) {
    const speed = velocity.length();
    const moving = speed > 0.03;
    if (moving) {
      const target = Math.atan2(velocity.x, velocity.z) * math.RAD_TO_DEG;
      const current = this.visual.getLocalEulerAngles().y;
      this.visual.setLocalEulerAngles(0, math.lerpAngle(current, target, 1 - Math.exp(-16 * dt)), 0);
    }
    if (this.model) {
      const desired = moving && this.states.has('Walk') ? 'Walk' : 'Idle';
      if (desired !== this.state && this.states.has(desired)) {
        this.model.anim!.baseLayer!.transition(desired, 0.18);
        this.state = desired;
      }
    } else {
      this.time += dt * (moving ? speed * 5 : 2);
      this.placeholder.setLocalPosition(0, moving ? Math.abs(Math.sin(this.time)) * 0.035 : 0, 0);
    }
  }
}
