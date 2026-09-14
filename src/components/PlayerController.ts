import { Entity, Keyboard, Vec2, Vec3, KEY_A, KEY_D, KEY_S, KEY_W, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT } from 'playcanvas';
import type { Bedroom } from '../game/bedroom';

export class PlayerController {
  enabled = true;
  readonly input = new Vec2();
  readonly velocity = new Vec3();
  readonly radius = 0.24;
  readonly speed = 2.25;
  private readonly right: Vec3;
  private readonly forward: Vec3;
  private readonly candidate = new Vec3();
  private readonly bounds: Bedroom['obstacles'];
  private readonly keyboard: Keyboard;
  private readonly abort = new AbortController();
  constructor(readonly entity: Entity, camera: Entity, private readonly room: Bedroom, private readonly joystick: Vec2) {
    this.right = camera.right.clone();
    this.right.y = 0;
    this.right.normalize();
    this.forward = camera.forward.clone();
    this.forward.y = 0;
    this.forward.normalize();
    // Inflate furniture once by player radius, using PlayCanvas's existing AABB math.
    this.bounds = room.obstacles.map(box => {
      const expanded = box.clone();
      expanded.halfExtents.x += this.radius;
      expanded.halfExtents.z += this.radius;
      return expanded;
    });
    this.keyboard = new Keyboard(window, { preventDefault: false });
    window.addEventListener('keydown', event => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    }, { signal: this.abort.signal });
    window.addEventListener('blur', this.reset, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', this.reset, { signal: this.abort.signal });
  }
  private axis(positive: number[], negative: number[]) {
    return Number(positive.some(key => this.keyboard.isPressed(key))) - Number(negative.some(key => this.keyboard.isPressed(key)));
  }
  update(dt: number) {
    if (!this.enabled) { this.input.set(0, 0); this.velocity.set(0, 0, 0); this.keyboard.update(); return; }
    this.input.copy(this.joystick);
    this.input.x += this.axis([KEY_D, KEY_RIGHT], [KEY_A, KEY_LEFT]);
    this.input.y += this.axis([KEY_W, KEY_UP], [KEY_S, KEY_DOWN]);
    if (this.input.lengthSq() > 1) this.input.normalize();
    if (document.hidden) this.input.set(0, 0);
    const dx = (this.right.x * this.input.x + this.forward.x * this.input.y) * this.speed * dt;
    const dz = (this.right.z * this.input.x + this.forward.z * this.input.y) * this.speed * dt;
    const start = this.entity.getPosition();
    const oldX = start.x, oldZ = start.z;
    this.candidate.copy(start);
    // Small axis-separated steps slide around obstacles without a rigid-body runtime.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.08));
    for (let i = 0; i < steps; i++) {
      const x = this.candidate.x;
      this.candidate.x = Math.max(-this.room.halfWidth + this.radius, Math.min(this.room.halfWidth - this.radius, x + dx / steps));
      if (this.blocked()) this.candidate.x = x;
      const z = this.candidate.z;
      this.candidate.z = Math.max(-this.room.halfDepth + this.radius, Math.min(this.room.halfDepth - this.radius, z + dz / steps));
      if (this.blocked()) this.candidate.z = z;
    }
    this.entity.setPosition(this.candidate);
    this.velocity.set((this.candidate.x - oldX) / Math.max(dt, 0.001), 0, (this.candidate.z - oldZ) / Math.max(dt, 0.001));
    this.keyboard.update();
  }
  private blocked() { return this.bounds.some(box => box.containsPoint(this.candidate)); }
  reset = () => {
    this.keyboard.detach();
    this.keyboard.attach(window);
    this.input.set(0, 0);
    this.velocity.set(0, 0, 0);
  };
  destroy() { this.abort.abort(); this.keyboard.detach(); }
}
