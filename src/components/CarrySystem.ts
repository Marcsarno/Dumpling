import { BoundingBox, Entity, Mat4, Vec3, type Application, type RenderComponent } from 'playcanvas';
import type { CleanupItem } from '../game/cleanupProps';

/** Socket is a sibling of the character mesh: replacing the rig cannot break carrying. */
export class CarrySystem {
  readonly socket: Entity;
  item: CleanupItem | null = null;
  constructor(app: Application, visual: Entity) {
    this.socket = new Entity('Carry socket', app);
    this.socket.setLocalPosition(0, 0.43, 0.43);
    visual.addChild(this.socket);
  }
  pickUp(item: CleanupItem): boolean {
    if (this.item) return false;
    this.item = item;
    const bounds = new BoundingBox();
    let first = true;
    for (const render of item.entity.findComponents('render')) for (const mesh of (render as RenderComponent).meshInstances) {
      if (first) { bounds.copy(mesh.aabb); first = false; } else bounds.add(mesh.aabb);
    }
    const center = item.carryGrip ? new Vec3(...item.carryGrip) : first ? new Vec3() : new Mat4().copy(item.entity.getWorldTransform()).invert().transformPoint(bounds.center);
    item.entity.reparent(this.socket);
    const scale=item.carriedScale ?? 1;
    item.entity.setLocalScale(scale,scale,scale);
    item.entity.setLocalPosition(center.mulScalar(-scale));
    item.entity.setLocalEulerAngles(0, 0, 0);
    return true;
  }
  release(parent: Entity, position: [number, number, number]) {
    if (!this.item) return null;
    const item = this.item;
    item.entity.reparent(parent);
    item.entity.setLocalScale(1,1,1);
    item.entity.setLocalPosition(...position);
    item.entity.setLocalEulerAngles(0, 0, 0);
    this.item = null;
    return item;
  }
}
