import { Vec3, type Application } from 'playcanvas';
import { DUMPLINGS, STORE_INVENTORY } from '../data/collection';
import { RARITIES } from '../data/collection';
import { LocalSaveRepository, ProgressStore } from '../systems/ProgressStore';
import { ActionButton } from '../ui/ActionButton';
import type { VirtualJoystick } from '../ui/VirtualJoystick';
import type { PlayerController } from '../components/PlayerController';
import type { createCharacter } from '../components/CharacterVisual';
import type { CleanupProps } from './cleanupProps';
import type { CleanupGame } from './CleanupGame';
import type { Bedroom } from './bedroom';
import type { IsometricCamera } from './IsometricCamera';
import { createStore } from './store';
import { OpeningSequence } from './OpeningSequence';
import { dumplingPortrait } from './dumplingVisual';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.querySelector<T>(id)!;
export class GameLoop {
  readonly save = new ProgressStore(new LocalSaveRepository());
  readonly store;
  readonly opening: OpeningSequence;
  mode: 'cleanup' | 'store' | 'home' = 'cleanup';
  private focus = '';
  private action: ActionButton;
  private abort = new AbortController();
  private messageUntil = 0;
  private pendingCredit: { id: string; amount: number } | null = null;
  private baseZoom = 9;
  private screen = new Vec3();
  private markerPoint = new Vec3();
  constructor(app: Application, private readonly camera: IsometricCamera,
    private readonly character: ReturnType<typeof createCharacter>, private readonly room: Bedroom,
    private readonly props: CleanupProps, private readonly cleanup: CleanupGame,
    private readonly controller: PlayerController, private readonly joystick: VirtualJoystick) {
    this.store = createStore(app); this.opening = new OpeningSequence(app);
    el('#shop-display-marker').textContent = `🎁 Blind boxes · $${STORE_INVENTORY.price}`;
    this.action = new ActionButton(el('#action-button'), this.press, () => {}); this.action.enabled = false;
    const on = (id: string, fn: () => void) => el(id).addEventListener('click', fn, { signal: this.abort.signal });
    on('#go-shopping', () => this.attempt(() => { if (!this.creditPending()) return; this.save.startTrip(); this.enterStore(); }));
    on('#collection-button', () => this.attempt(() => this.collection()));
    on('#back-cleanup', () => this.attempt(() => this.startCleanup()));
    on('#open-next', () => this.attempt(() => { this.save.goHome(); this.enterHome(); }));
    for (const mode of ['house', 'bedroom', 'practice'] as const) on(`#mission-${mode}`, () => {
      if (this.mode === 'cleanup' && this.creditPending()) this.cleanup.configure(mode);
    });
    el<HTMLDialogElement>('#collection-dialog').addEventListener('cancel', e => e.preventDefault(), { signal: this.abort.signal });
    cleanup.onFinished = (id, amount) => { this.pendingCredit = { id, amount }; this.creditPending(); };
    cleanup.beforeReplay = () => this.creditPending();
    cleanup.onReplay = () => this.camera.reset();
    this.wallet();
    const location = this.save.data.location;
    if (location === 'store') this.enterStore();
    else if (location === 'home') this.enterHome();
    else if (location === 'collection') { this.enterHome(); this.renderCollection(); }
    if (this.save.problem) this.message(this.save.problem, true);
  }
  private attempt(fn: () => void) { try { fn(); } catch (error) { this.message(error instanceof Error ? error.message : 'Please try again.', true); } }
  private message(value: string, persistent = false) {
    el('#save-message').textContent = value; el('#save-message').hidden = false;
    el('#cleanup-announcement').textContent = value;
    this.messageUntil = persistent ? Infinity : performance.now() + 2600;
  }
  private creditPending() {
    if (!this.pendingCredit) return true;
    try {
      this.save.creditRound(this.pendingCredit.id, this.pendingCredit.amount); this.pendingCredit = null;
      this.wallet(); el('#results-wallet').textContent = `Saved to your wallet · $${this.save.data.balance}`;
      return true;
    } catch (error) {
      el('#results-wallet').textContent = 'Allowance not saved yet. Replay or shopping will retry.';
      this.message((error as Error).message, true); return false;
    }
  }
  private wallet() {
    const data = this.save.data, discovered = DUMPLINGS.filter(d => data.collection[d.id] > 0).length;
    el('#wallet').textContent = `$${data.balance}`;
    el('#trip-balance').textContent = `$${data.balance}`;
    el('#collection-button').textContent = `Collection · ${discovered} / ${DUMPLINGS.length}${data.boxes.length ? ` · 🎁 ${data.boxes.length}` : ''}`;
  }
  private transition(mode: typeof this.mode) {
    if (this.mode === 'cleanup' && mode !== 'cleanup') {
      this.props.reset(); this.cleanup.carry.item = null; this.character.animator.reset();
    }
    this.mode = mode; this.cleanup.setActive(mode === 'cleanup'); this.action.enabled = mode !== 'cleanup'; this.action.reset();
    this.camera.reset();
    this.joystick.reset(); this.controller.reset(); this.opening.hide();
    this.room.root.enabled = mode !== 'store'; this.props.root.enabled = mode === 'cleanup'; this.store.root.enabled = mode === 'store';
    this.character.player.enabled = mode !== 'home'; el('#player-label').hidden = mode === 'home';
    el('#store-markers').hidden = mode !== 'store'; el('#game').dataset.scene = mode;
    el('#task-list').hidden = mode !== 'cleanup'; el('#task-count').hidden = mode !== 'cleanup';
    el('#mission-picker').hidden = mode !== 'cleanup';
    el('#mission-clock').hidden = mode !== 'cleanup'; el('.allowance-label').hidden = mode !== 'cleanup';
    el('#trip-wallet').hidden = mode === 'cleanup'; el('#home-vignette').hidden = mode !== 'home';
    el('#scene-subtitle').hidden = mode === 'cleanup'; el<HTMLDialogElement>('#collection-dialog').close();
    this.camera.entity.camera!.orthoHeight = mode === 'home' ? 3.25 : this.baseZoom;
    el('#action-button').classList.remove('holding'); this.focus = '';
    el('#save-message').hidden = true;
  }
  private enterStore() {
    this.transition('store'); this.controller.setRoom(this.store); this.character.player.setPosition(0, .09, 2.4);
    this.character.animator.reset(); this.character.visual.setLocalEulerAngles(0, 30, 0);
    el('#scene-kicker').textContent = 'LITTLE SURPRISES'; el('h1').textContent = 'A little treat.';
    el('#scene-subtitle').textContent = `Sealed dumpling boxes · $${STORE_INVENTORY.price} each · ${STORE_INVENTORY.tripLimit} per trip`;
  }
  private enterHome() {
    this.transition('home'); el('#scene-kicker').textContent = 'BACK IN YOUR COZY ROOM'; el('h1').textContent = 'Hello, little surprise.';
    el('#scene-subtitle').textContent = `${this.save.data.boxes.length} unopened ${this.save.data.boxes.length === 1 ? 'box' : 'boxes'}`;
    this.opening.show(this.save.data.reveal);
    if (!this.save.data.boxes.length && !this.save.data.reveal) {
      this.opening.root.enabled = false;
      this.opening.panel.textContent = 'Your next little friend starts with a little helping.';
    }
    this.wallet();
  }
  private collection() {
    if (this.mode === 'cleanup' && this.cleanup.mission.state === 'running' && this.cleanup.mission.timed) return;
    if (!this.creditPending()) return;
    this.save.showCollection(); this.enterHome(); this.renderCollection();
  }
  private renderCollection() {
    const grid = el('#collection-grid'); grid.replaceChildren();
    let discovered = 0, total = 0;
    for (const data of DUMPLINGS) {
      const count = this.save.data.collection[data.id] || 0; if (count) discovered++; total += count;
      const card = document.createElement('article'); card.className = `dumpling-card${count ? ' owned' : ''}`; card.dataset.id = data.id;
      card.style.setProperty('--rarity', `${RARITIES[data.rarity].color}66`);
      const image = document.createElement('img'); image.src = dumplingPortrait(data, !count); image.alt = count ? data.name : 'Undiscovered dumpling';
      const name = document.createElement('strong'); name.textContent = count ? data.name : '???';
      const tier = document.createElement('small'); tier.textContent = data.rarity;
      const copies = document.createElement('small'); copies.className = 'copies'; copies.textContent = count ? `×${count}` : 'Locked';
      card.append(image, name, tier, copies); grid.append(card);
    }
    el('#collection-summary').textContent = `${discovered} / ${DUMPLINGS.length} discovered · ${total} collected · Wallet $${this.save.data.balance}`;
    el('#open-next').hidden = !this.save.data.boxes.length;
    el('#open-next').textContent = `Open next box · ${this.save.data.boxes.length} waiting`;
    el<HTMLDialogElement>('#collection-dialog').showModal(); this.joystick.reset(); this.controller.reset();
    this.action.enabled = false;
  }
  private startCleanup() {
    if (!this.creditPending()) return;
    this.save.startCleanup(); this.transition('cleanup'); this.controller.setRoom(this.room); this.cleanup.replay();
    el('#scene-kicker').textContent = 'ONE COZY MINUTE'; el('h1').textContent = 'Home, sweet home.'; this.wallet();
  }
  private press = () => this.attempt(() => {
    if (this.mode === 'store') {
      this.storeFocus();
      if (this.focus === 'buy-box') { this.save.purchase(); this.wallet(); this.message(`One sealed surprise packed! Wallet $${this.save.data.balance}.`); }
      else if (this.focus === 'go-home') { this.save.goHome(); this.enterHome(); }
    } else if (this.mode === 'home') {
      if (this.opening.phase === 'closed' && this.save.data.boxes.length) {
        const receipt = this.save.openNext(); this.wallet(); this.opening.begin(receipt, performance.now());
        el('#scene-subtitle').textContent = `${this.save.data.boxes.length} unopened ${this.save.data.boxes.length === 1 ? 'box' : 'boxes'} waiting`;
      } else if (this.opening.phase !== 'opening') this.collection();
    }
  });
  private storeFocus() {
    const p = this.character.player.getPosition();
    this.focus = Math.hypot(p.x - this.store.displayAnchor.x, p.z - this.store.displayAnchor.z) <= 1.05 ? 'buy-box'
      : Math.hypot(p.x, p.z - this.store.exitAnchor.z) <= .85 ? 'go-home' : '';
  }
  beforeMovement(now: number) {
    if (this.mode === 'cleanup') this.cleanup.mission.tick(now);
    this.controller.enabled = (this.mode === 'store' || (this.mode === 'cleanup' && this.cleanup.mission.state !== 'finished')) && !el<HTMLDialogElement>('#collection-dialog').open;
  }
  update(now: number) {
    const running = this.mode === 'cleanup' && this.cleanup.mission.state === 'running' && this.cleanup.mission.timed;
    for (const mode of ['house', 'bedroom', 'practice']) {
      const button = el<HTMLButtonElement>(`#mission-${mode}`); button.disabled = running;
      button.setAttribute('aria-pressed', String(this.cleanup.mode === mode));
    }
    el('#game').dataset.mission = this.cleanup.mode;
    el<HTMLButtonElement>('#collection-button').disabled = running || this.mode === 'store' || this.opening.phase === 'opening';
    if (now > this.messageUntil) el('#save-message').hidden = true;
    if (this.mode === 'cleanup') {
      el('#task-list').hidden = this.cleanup.mode === 'practice';
      this.cleanup.update(now, this.controller.input.lengthSq() > 0); return;
    }
    let title = 'Action', detail = 'Come closer', icon = '✋', enabled = false;
    if (this.mode === 'store') {
      this.storeFocus(); const data = this.save.data;
      el('#cleanup-hint').textContent = `Bag ${data.trip.purchases} / ${STORE_INVENTORY.tripLimit} · Walk to the boxes, or the welcome mat to go home.`;
      if (this.focus === 'buy-box') {
        const full = data.trip.purchases >= STORE_INVENTORY.tripLimit, short = data.balance < STORE_INVENTORY.price;
        title = full ? 'Bag full' : short ? 'Save a little' : 'Buy box'; detail = full ? 'Go Home' : short ? `Need $${STORE_INVENTORY.price - data.balance} more` : `$${STORE_INVENTORY.price} · Sealed`; icon = '🎁'; enabled = !full && !short;
      } else if (this.focus === 'go-home') { title = 'Go Home'; detail = data.boxes.length ? 'Open your boxes' : 'A cozy cleanup'; icon = '⌂'; enabled = true; }
      this.store.glow.enabled = this.focus === 'buy-box';
      for (const [id, point, height] of [['#shop-display-marker', this.store.displayAnchor, 1.6], ['#shop-exit-marker', this.store.exitAnchor, .1]] as const) {
        this.markerPoint.copy(point); this.markerPoint.y = height; this.camera.entity.camera!.worldToScreen(this.markerPoint, this.screen);
        const marker = el(id); marker.style.transform = `translate(${this.screen.x - marker.offsetWidth / 2}px,${this.screen.y}px)`;
        marker.classList.toggle('nearby', this.focus === (id.includes('display') ? 'buy-box' : 'go-home'));
      }
    } else {
      this.opening.update(now);
      const opening = this.opening.phase === 'opening', canOpen = this.opening.phase === 'closed' && this.save.data.boxes.length > 0;
      title = opening ? 'A surprise…' : canOpen ? 'Open box' : 'Collection'; detail = opening ? 'Here it comes' : canOpen ? 'Tap to unwrap' : 'Meet your friends'; icon = canOpen ? '🎁' : '✦'; enabled = !opening;
      this.focus = canOpen ? 'open-box' : opening ? '' : 'collection';
    }
    const button = el<HTMLButtonElement>('#action-button'); button.disabled = !enabled || el<HTMLDialogElement>('#collection-dialog').open; button.dataset.target = enabled ? this.focus : '';
    el('#action-title').textContent = title; el('#action-detail').textContent = detail; el('#action-icon').textContent = icon;
    button.setAttribute('aria-label', `${title}: ${detail}`);
  }
  resized() { this.baseZoom = this.camera.entity.camera!.orthoHeight; if (this.mode === 'home') this.camera.entity.camera!.orthoHeight = 3.25; }
  snapshot() { return { mode: this.mode, balance: this.save.data.balance, boxes: this.save.data.boxes.length, purchases: this.save.data.trip.purchases, collection: { ...this.save.data.collection }, phase: this.opening.phase, reveal: this.save.data.reveal ? { ...this.save.data.reveal } : null, focus: this.focus }; }
  destroy() { this.abort.abort(); this.action.destroy(); this.opening.destroy(); }
}
