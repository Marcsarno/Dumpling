import { Entity, Mesh, MeshInstance, TorusGeometry, Vec3, type Application } from 'playcanvas';
import { material } from '../game/primitives';
import type { Interaction } from '../game/cleanupProps';
import type { InteractionSystem } from '../systems/InteractionSystem';
import type { CarrySystem } from '../components/CarrySystem';
import type { MissionSystem } from '../systems/MissionSystem';

/** Engine torus meshes provide inexpensive highlights; CSS handles brief screen-space rewards. */
export class CleanupFeedback {
  private readonly markers: { target: Interaction; ring: Entity; label: HTMLDivElement }[] = [];
  private readonly mesh;
  private readonly glow;
  private readonly screen = new Vec3();
  private readonly popups: { element: HTMLDivElement; point: Vec3; until: number }[] = [];
  constructor(app: Application, private readonly camera: Entity, private readonly layer: HTMLElement, targets: Interaction[]) {
    this.mesh = Mesh.fromGeometry(app.graphicsDevice, new TorusGeometry({ tubeRadius: 0.02, ringRadius: 0.43, segments: 28, sides: 5 }));
    this.glow = material('Interaction glow', '#ffe6a2');
    this.glow.useLighting = false; this.glow.emissive.set(1, 0.81, 0.42); this.glow.update();
    for (const target of targets) {
      const ring = new Entity(`${target.name} highlight`, app);
      ring.addComponent('render', { meshInstances: [new MeshInstance(this.mesh, this.glow)], castShadows: false, receiveShadows: false });
      ring.setPosition(target.anchor.x, 0.105, target.anchor.z); app.root.addChild(ring);
      const label = document.createElement('div'); label.className = 'cleanup-marker';
      label.textContent = target.icon; label.setAttribute('aria-hidden', 'true'); layer.append(label);
      this.markers.push({ target, ring, label });
    }
  }
  reward(point: Vec3, text: string, now: number) {
    const element = document.createElement('div'); element.className = 'coin-popup';
    const amount = document.createElement('strong'); amount.textContent = text; element.append(amount);
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('span'); sparkle.textContent = '✦';
      sparkle.style.setProperty('--spark-x', `${Math.sin(i * Math.PI / 3) * 42}px`);
      sparkle.style.setProperty('--spark-y', `${Math.cos(i * Math.PI / 3) * 35}px`); element.append(sparkle);
    }
    this.layer.append(element); this.popups.push({ element, point: point.clone(), until: now + 950 });
  }
  update(now: number, interactions: InteractionSystem, carry: CarrySystem, mission: MissionSystem) {
    const nameTag = document.querySelector<HTMLElement>('#player-label')!.getBoundingClientRect();
    for (const { target, ring, label } of this.markers) {
      const available = interactions.available(target, carry.item?.id ?? null, mission);
      const destination = available && ((!!carry.item && (target.kind === 'place' || target.kind === 'vacuum' || target.kind === 'pet')) || target.id === 'wash-hands');
      const nearby = interactions.focus === target && available;
      ring.enabled = nearby || destination;
      const scale = (destination ? 1.2 : 0.85) + Math.sin(now / 220) * 0.05;
      ring.setLocalScale(scale, 1, scale);
      label.hidden = !available;
      label.classList.toggle('nearby', nearby); label.classList.toggle('destination', destination);
      const tool = target.kind === 'pickup' && target.item === 'vacuum';
      label.classList.toggle('tool', tool);
      const text = destination || tool ? `${target.icon} ${target.name}` : target.icon;
      if (label.textContent !== text) label.textContent = text;
      this.camera.camera!.worldToScreen(target.marker, this.screen);
      // Distant house rooms must not pile their badges against the edge of the phone.
      if (this.screen.x < -15 || this.screen.x > this.layer.clientWidth + 15 || this.screen.y < this.layer.clientHeight * .25 || this.screen.y > this.layer.clientHeight * .76) label.hidden = true;
      let x = this.screen.x, y = this.screen.y;
      if (available) {
        const half = label.offsetWidth / 2, height = label.offsetHeight;
        // Keep new task badges readable beside Arianna's existing name tag on small phones.
        if (x + half > nameTag.left - 3 && x - half < nameTag.right + 3 && y > nameTag.top - 3 && y - height < nameTag.bottom + 3) {
          x = x < nameTag.left + nameTag.width / 2 ? nameTag.left - half - 4 : nameTag.right + half + 4;
        }
        const unclampedX = x;
        x = Math.max(half + 4, Math.min(this.layer.clientWidth - half - 4, x));
        if (x !== unclampedX && y > nameTag.top - 3 && y - height < nameTag.bottom + 3) y = nameTag.top - 5;
      }
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const popup = this.popups[i];
      if (now >= popup.until) { popup.element.remove(); this.popups.splice(i, 1); continue; }
      this.camera.camera!.worldToScreen(popup.point, this.screen);
      popup.element.style.left = `${this.screen.x}px`; popup.element.style.top = `${this.screen.y}px`;
    }
  }
  reset() { for (const popup of this.popups) popup.element.remove(); this.popups.length = 0; }
  hide() { this.reset(); for (const marker of this.markers) { marker.ring.enabled = false; marker.label.hidden = true; } }
  destroy() {
    this.reset(); for (const marker of this.markers) { marker.ring.destroy(); marker.label.remove(); }
    this.mesh.destroy(); this.glow.destroy();
  }
}
