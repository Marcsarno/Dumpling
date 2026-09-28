import type { Vec3, Entity } from 'playcanvas';
import { HOUSE_ROOMS, type RoomId } from '../data/house';

/** Track continuous room movement; the adventure HUD replaces the old door labels. */
export class HouseNavigation {
  current: RoomId = 'bedroom';
  private readonly root = document.querySelector<HTMLElement>('#house-doors')!;
  private readonly title = document.querySelector('h1')!;
  private readonly kicker = document.querySelector('#scene-kicker')!;
  constructor() {
    this.root.hidden = true;
    document.querySelector<HTMLElement>('#room-connections')!.hidden = true;
  }
  update(position: Vec3, _camera: Entity, enabled: boolean, mission: 'bedroom' | 'house' | 'practice' | 'pet' | 'day') {
    if (!enabled) return;
    const room = HOUSE_ROOMS.find(room => position.x >= room.minX && position.x <= room.maxX && position.z >= room.minZ && position.z <= room.maxZ);
    if (room) this.current = room.id;
    const current = HOUSE_ROOMS.find(room => room.id === this.current)!;
    if (this.title.textContent !== current.title) this.title.textContent = current.title;
    const kicker = mission === 'day' ? 'EVERYDAY LIFE' : mission === 'practice' ? 'FREE EXPLORING' : mission === 'pet' ? 'PUPPY CLEANUP' : mission === 'house' ? 'HOUSE CLEANUP' : 'BEDROOM CLEANUP';
    if (this.kicker.textContent !== kicker) this.kicker.textContent = kicker;
  }
  destroy() { this.root.replaceChildren(); }
}
