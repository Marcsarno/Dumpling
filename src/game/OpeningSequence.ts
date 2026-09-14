import { Entity, type Application } from 'playcanvas';
import { DUMPLINGS, RARITIES } from '../data/collection';
import type { RevealReceipt } from '../systems/ProgressStore';
import { createBlindBox, createDumpling } from './dumplingVisual';

/** Presentation only: the receipt is committed before this animation starts. */
export class OpeningSequence {
  readonly root: Entity;
  private readonly box: ReturnType<typeof createBlindBox>;
  private model: Entity | null = null;
  private start = 0;
  phase: 'closed' | 'opening' | 'revealed' = 'closed';
  private receipt: RevealReceipt | null = null;
  private audio: AudioContext | null = null;
  private sounded = false;
  readonly panel = document.querySelector<HTMLElement>('#reveal-copy')!;
  constructor(private readonly app: Application) {
    this.root = new Entity('Home surprise presentation', app); app.root.addChild(this.root);
    this.root.setPosition(0, .45, 0); this.root.setEulerAngles(0, 38, 0);
    this.box = createBlindBox(app, this.root); this.root.enabled = false;
  }
  show(receipt: RevealReceipt | null) {
    this.root.enabled = true; this.panel.hidden = false; this.model?.destroy(); this.model = null;
    this.box.root.enabled = true; this.box.root.setLocalEulerAngles(0, 0, 0);
    this.box.root.setLocalScale(1, 1, 1); this.box.lid.setLocalPosition(0, .78, 0); this.box.lid.setLocalEulerAngles(0, 0, 0);
    this.phase = 'closed'; this.receipt = null; this.panel.replaceChildren(); this.panel.classList.remove('has-reveal');
    this.panel.textContent = 'One little box. A new little friend?';
    if (receipt) { this.prepare(receipt); this.phase = 'revealed'; this.reveal(false); }
  }
  begin(receipt: RevealReceipt, now: number) {
    this.prepare(receipt); this.start = now; this.phase = 'opening'; this.sounded = false;
    this.panel.textContent = 'A little surprise is waking up…'; this.cue(480);
  }
  private prepare(receipt: RevealReceipt) {
    this.receipt = receipt;
    const data = DUMPLINGS.find(d => d.id === receipt.dumplingId)!;
    this.model?.destroy(); this.model = createDumpling(this.app, this.root, data); this.model.enabled = false;
  }
  private cue(frequency: number) {
    // Temporary sound hook. An asset-backed sound bank can replace this without touching gameplay.
    try {
      this.audio ??= new AudioContext(); void this.audio.resume();
      const tone = this.audio.createOscillator(), gain = this.audio.createGain(), now = this.audio.currentTime;
      tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, now); tone.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + .18);
      gain.gain.setValueAtTime(.045, now); gain.gain.exponentialRampToValueAtTime(.001, now + .28);
      tone.connect(gain); gain.connect(this.audio.destination); tone.start(); tone.stop(now + .3);
    } catch { /* Silent play remains fully supported. */ }
  }
  private reveal(animate: boolean) {
    const data = DUMPLINGS.find(d => d.id === this.receipt!.dumplingId)!, rarity = RARITIES[data.rarity];
    this.box.root.enabled = false; this.model!.enabled = true;
    this.panel.replaceChildren(); this.panel.style.setProperty('--rarity', rarity.color); this.panel.classList.add('has-reveal');
    this.panel.style.setProperty('--aura-size', data.rarity === 'Legendary' ? '290px' : data.rarity === 'Common' ? '140px' : '220px');
    const badge = document.createElement('small'); badge.textContent = `${data.rarity} · ${this.receipt!.isNew ? 'NEW FRIEND' : `ANOTHER FRIEND · ×${this.receipt!.count}`}`;
    const title = document.createElement('h2'); title.textContent = data.name;
    const hint = document.createElement('p'); hint.textContent = 'Saved to your collection ♡'; this.panel.append(badge, title, hint);
    if (animate) {
      for (let i = 0; i < rarity.sparkles; i++) {
        const star = document.createElement('span'); star.className = 'reveal-spark'; star.textContent = '✦';
        star.style.setProperty('--x', `${Math.cos(i * 2.4) * (70 + i * 3)}px`);
        star.style.setProperty('--y', `${-60 + Math.sin(i * 2.4) * 100}px`); this.panel.append(star);
      }
      this.cue(620 * rarity.pitch);
    }
  }
  update(now: number) {
    if (!this.root.enabled) return;
    if (this.phase === 'opening') {
      const t = (now - this.start) / 1000;
      this.box.root.setLocalEulerAngles(0, Math.sin(t * 33) * Math.max(0, 1 - t / 1.1) * 12, Math.sin(t * 39) * Math.max(0, 1 - t / 1.1) * 6);
      if (t > .8) { const lift = Math.min(1, (t - .8) / .55); this.box.lid.setLocalPosition(0, .78 + lift * .8, -lift * .3); this.box.lid.setLocalEulerAngles(-lift * 30, 0, 0); }
      if (t > 1.6 && !this.sounded) { this.sounded = true; this.reveal(true); }
      if (this.model?.enabled) this.model.setLocalScale(Math.min(1, .1 + (t - 1.6) * 2), Math.min(1, .1 + (t - 1.6) * 2), Math.min(1, .1 + (t - 1.6) * 2));
      if (t > 2.6) this.phase = 'revealed';
    }
    if (this.model?.enabled) this.model.setLocalPosition(0, .3 + Math.sin(now / 650) * .045, 0);
  }
  hide() { this.root.enabled = false; this.panel.hidden = true; }
  destroy() { this.root.destroy(); void this.audio?.close(); }
}
