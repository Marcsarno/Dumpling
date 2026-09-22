import { Entity, Mesh, MeshInstance, TorusGeometry, Vec3, type Application } from 'playcanvas';
import { material } from '../game/primitives';
import type { Interaction } from '../game/cleanupProps';
import type { InteractionSystem } from '../systems/InteractionSystem';
import type { CarrySystem } from '../components/CarrySystem';
import type { MissionSystem } from '../systems/MissionSystem';
import { guidanceCandidates } from '../systems/InteractionGuidance';

/** Engine torus meshes provide inexpensive highlights; CSS handles brief screen-space rewards. */
export class CleanupFeedback {
  private readonly markers: { target: Interaction; ring: Entity; label: HTMLDivElement }[] = [];
  private readonly mesh;
  private readonly glow;
  private readonly screen = new Vec3();
  private readonly popups: { element: HTMLDivElement; point: Vec3; until: number }[] = [];
  constructor(app: Application, private readonly camera: Entity, private readonly layer: HTMLElement, targets: Interaction[]) {
    this.mesh = Mesh.fromGeometry(app.graphicsDevice, new TorusGeometry({ tubeRadius: 0.055, ringRadius: 0.43, segments: 32, sides: 8 }));
    this.glow = material('Interaction glow', '#ffe6a2');
    this.glow.useLighting = false; this.glow.emissive.set(1, 0.81, 0.42); this.glow.update();
    for (const target of targets) {
      const ring = new Entity(`${target.name} highlight`, app);
      ring.addComponent('render', { meshInstances: [new MeshInstance(this.mesh, this.glow)], castShadows: false, receiveShadows: false });
      ring.setPosition(target.anchor.x, 0.105, target.anchor.z); app.root.addChild(ring);
      const label = document.createElement('div'); label.className = 'cleanup-marker';
      label.textContent = target.icon; label.dataset.target=target.id; label.setAttribute('aria-hidden', 'true'); layer.append(label);
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
    const carried=carry.item?.id??null;
    const availableTargets=this.markers.map(m=>m.target).filter(t=>interactions.available(t,carried,mission));
    const candidates=guidanceCandidates(availableTargets,carried);
    const position=carry.socket.getPosition();
    const primary=candidates.sort((a,b)=>interactions.distance(a,position)-interactions.distance(b,position))[0];
    for (const { target, ring, label } of this.markers) {
      const available = availableTargets.includes(target);
      const destination = target===primary;
      const nearby = interactions.focus === target && available && !(target.id==='put-tool-away'&&primary&&primary!==target);
      ring.enabled = nearby || destination || (available && !carried && target.id!=='play-lilah');
      ring.setPosition(target.anchor.x,.105,target.anchor.z);
      const scale = (destination ? 1.3 : nearby ? 1.1 : .85) + Math.sin(now / 300) * (destination?.10:.035);
      ring.setLocalScale(scale, 1, scale);
      label.hidden = !nearby && !destination;
      if(target.id==='play-lilah')label.hidden=true;
      label.classList.toggle('nearby', nearby); label.classList.toggle('destination', destination);
      label.dataset.guided=String(destination);
      const text = target.icon;
      if (label.textContent !== text) label.textContent = text;
      this.camera.camera!.worldToScreen(target.marker, this.screen);
      const x=Math.max(30,Math.min(this.layer.clientWidth-30,this.screen.x));
      const y=Math.max(this.layer.clientHeight*.29,Math.min(this.layer.clientHeight*.7,this.screen.y));
      const offscreen=x!==this.screen.x||y!==this.screen.y;
      if(offscreen&&!destination)label.hidden=true;
      label.classList.toggle('offscreen',offscreen&&destination);
      label.style.setProperty('--guide-angle',`${Math.atan2(this.screen.y-y,this.screen.x-x)}rad`);
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
  hideWorkingLabel(_id:string){for(const marker of this.markers){marker.label.hidden=true;marker.ring.enabled=false;}}
  destroy() {
    this.reset(); for (const marker of this.markers) { marker.ring.destroy(); marker.label.remove(); }
    this.mesh.destroy(); this.glow.destroy();
  }
}
