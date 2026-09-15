import { Entity, Keyboard, Vec2, Vec3, KEY_A, KEY_D, KEY_S, KEY_W, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT } from 'playcanvas';
import type { Bedroom } from '../game/bedroom';
import { RUN_SPEED } from './MovementPace';

export class PlayerController {
  enabled = true;
  readonly input = new Vec2();
  readonly velocity = new Vec3();
  readonly radius = 0.24;
  speed = RUN_SPEED;
  private readonly right: Vec3;
  private readonly forward: Vec3;
  private readonly candidate = new Vec3();
  private bounds: Bedroom['obstacles'] = [];
  private readonly keyboard: Keyboard;
  private readonly abort = new AbortController();
  private approach: { point: Vec3; arrived: () => void; cancelled: () => void } | null = null;
  get approaching() { return this.approach !== null; }
  /** Find a reachable standing point beside the actual prop, respecting inflated furniture. */
  approachProp(point: Vec3, arrived: () => void, cancelled: () => void) {
    const start = this.entity.getPosition().clone(), candidates: Vec3[] = [];
    const free = (p: Vec3) => { this.candidate.copy(p); return !this.blocked(); };
    const clear = (p: Vec3) => {
      const count = Math.ceil(start.distance(p) / .06);
      for (let i = 1; i <= count; i++) if (!free(new Vec3().lerp(start, p, i / count))) return false;
      return true;
    };
    for (let radius = .32; radius <= 1.8; radius += .06) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
      const p = new Vec3(point.x + Math.sin(angle) * radius, start.y, point.z + Math.cos(angle) * radius);
      if (p.distance(start) < 2.2 && free(p) && clear(p)) candidates.push(p);
    }
    candidates.sort((a,b) => Math.hypot(a.x-point.x,a.z-point.z)*3+a.distance(start) - Math.hypot(b.x-point.x,b.z-point.z)*3-b.distance(start));
    if (!candidates.length) { cancelled(); return; }
    this.approach = { point: candidates[0], arrived, cancelled };
  }
  constructor(readonly entity: Entity, camera: Entity, private room: Bedroom, private readonly joystick: Vec2) {
    this.right = camera.right.clone();
    this.right.y = 0;
    this.right.normalize();
    this.forward = camera.forward.clone();
    this.forward.y = 0;
    this.forward.normalize();
    // Inflate furniture once by player radius, using PlayCanvas's existing AABB math.
    this.setRoom(room);
    this.keyboard = new Keyboard(window, { preventDefault: false });
    window.addEventListener('keydown', event => {
      if (event.key === ' ' && (event.target as HTMLElement)?.closest('button,dialog')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    }, { signal: this.abort.signal });
    window.addEventListener('blur', this.reset, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', this.reset, { signal: this.abort.signal });
  }
  setRoom(room: Bedroom) {
    this.room = room;
    this.bounds = room.obstacles.map(box => {
      const expanded = box.clone();
      expanded.halfExtents.x += this.radius;
      expanded.halfExtents.z += this.radius;
      return expanded;
    });
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
    if (this.approach) {
      const pending = this.approach;
      if (this.input.lengthSq() > .04 || document.hidden) { this.approach = null; pending.cancelled(); }
      else {
        const delta = pending.point.clone().sub(this.entity.getPosition()); delta.y = 0;
        if (delta.length() < .045) { this.approach = null; pending.arrived(); this.velocity.set(0,0,0); this.keyboard.update(); return; }
        const magnitude = Math.min(1, delta.length() / Math.max(this.speed * dt, .001)); delta.normalize();
        this.input.set(delta.dot(this.right)*magnitude, delta.dot(this.forward)*magnitude);
      }
    }
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
  private blocked() {
    if (this.room.walkable) {
      // Test the player's corners against the union, so adjoining floors have no invisible seam.
      for (const x of [this.candidate.x - this.radius, this.candidate.x + this.radius]) {
        for (const z of [this.candidate.z - this.radius, this.candidate.z + this.radius]) {
          if (!this.room.walkable.some(floor => x >= floor.minX && x <= floor.maxX && z >= floor.minZ && z <= floor.maxZ)) return true;
        }
      }
    }
    return this.bounds.some(box => box.containsPoint(this.candidate));
  }
  reset = () => {
    const pending = this.approach; this.approach = null; pending?.cancelled();
    this.keyboard.detach();
    this.keyboard.attach(window);
    this.input.set(0, 0);
    this.velocity.set(0, 0, 0);
  };
  destroy() { this.abort.abort(); this.keyboard.detach(); }
}
