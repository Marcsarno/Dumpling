import { Entity, type Application } from 'playcanvas';
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
    item.entity.reparent(this.socket);
    item.entity.setLocalPosition(0, 0, 0);
    item.entity.setLocalEulerAngles(0, 0, 0);
    return true;
  }
  release(parent: Entity, position: [number, number, number]) {
    if (!this.item) return null;
    const item = this.item;
    item.entity.reparent(parent);
    item.entity.setLocalPosition(...position);
    item.entity.setLocalEulerAngles(0, 0, 0);
    this.item = null;
    return item;
  }
}
