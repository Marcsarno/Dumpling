import { Vec3, type Entity } from 'playcanvas';
import { HOUSE_DOORS, HOUSE_ROOMS, type RoomId } from '../data/house';

/** Door labels identify continuous openings; these are never teleport buttons. */
export class HouseNavigation {
  current: RoomId = 'bedroom';
  private readonly root = document.querySelector<HTMLElement>('#house-doors')!;
  private readonly point = new Vec3();
  private readonly screen = new Vec3();
  private readonly labels = HOUSE_DOORS.map(door => {
    const label = document.createElement('span'); label.className = 'door-label'; this.root.append(label); return { door, label };
  });
  update(position: Vec3, camera: Entity, enabled: boolean, mission: 'bedroom' | 'house' | 'practice' | 'pet' | 'day') {
    this.root.hidden = true;
    document.querySelector<HTMLElement>('#room-connections')!.hidden = true;
    if (!enabled) return;
    const room = HOUSE_ROOMS.find(room => position.x >= room.minX && position.x <= room.maxX && position.z >= room.minZ && position.z <= room.maxZ);
    if (room) this.current = room.id;
    const current = HOUSE_ROOMS.find(room => room.id === this.current)!;
    document.querySelector('h1')!.textContent = current.title;
    document.querySelector('#scene-kicker')!.textContent = `${mission === 'day' ? 'EVERYDAY LIFE' : mission === 'practice' ? 'FREE EXPLORING' : mission === 'pet' ? 'PUPPY CLEANUP' : mission === 'house' ? 'HOUSE CLEANUP' : 'BEDROOM CLEANUP'}`;
    const neighbors: string[] = [];
    for (const { door, label } of this.labels) {
      const connected = door.a === this.current || door.b === this.current;
      const other = HOUSE_ROOMS.find(room => room.id === (door.a === this.current ? door.b : door.a))!;
      if (connected) neighbors.push(other.name);
      this.point.set(door.x, .6, door.z); camera.camera!.worldToScreen(this.point, this.screen);
      label.hidden = !connected || this.screen.x < 25 || this.screen.x > this.root.clientWidth - 25 || this.screen.y < this.root.clientHeight * .27 || this.screen.y > this.root.clientHeight * .72;
      label.textContent = `${other.name} ›`;
      label.style.transform = `translate(${this.screen.x}px,${this.screen.y}px) translate(-50%,-100%)`;
    }
    document.querySelector('#room-connections')!.textContent = `Walk through to ${neighbors.join(' · ')}`;
  }
  destroy() { this.root.replaceChildren(); }
}
