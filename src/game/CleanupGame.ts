import type { Application, Entity } from 'playcanvas';
import { CarrySystem } from '../components/CarrySystem';
import type { createCharacter } from '../components/CharacterVisual';
import { MissionSystem } from '../systems/MissionSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { ActionButton } from '../ui/ActionButton';
import { CleanupFeedback } from '../ui/CleanupFeedback';
import { CleanupHUD } from '../ui/CleanupHUD';
import type { CleanupProps, Interaction } from './cleanupProps';
import { saveId } from '../systems/saveId';

export class CleanupGame {
  roundId = saveId();
  onFinished: (id: string, amount: number) => void = () => {};
  beforeReplay: () => boolean = () => true;
  readonly mission = new MissionSystem();
  readonly carry: CarrySystem;
  readonly interactions: InteractionSystem;
  readonly action: ActionButton;
  private readonly feedback: CleanupFeedback;
  private readonly hud: CleanupHUD;
  private activity: { target: Interaction; start: number; duration: number } | null = null;
  private progress = 0;
  private finishedHandled = false;
  constructor(app: Application, private readonly character: ReturnType<typeof createCharacter>, private readonly props: CleanupProps,
    camera: Entity, private readonly resetMovement: () => void) {
    this.carry = new CarrySystem(app, character.visual);
    this.interactions = new InteractionSystem(props.interactions);
    const button = document.querySelector<HTMLButtonElement>('#action-button')!;
    this.hud = new CleanupHUD(button, this.replay);
    this.feedback = new CleanupFeedback(app, camera, document.querySelector('#cleanup-effects')!, props.interactions);
    this.action = new ActionButton(button, this.press, this.cancelHold);
  }
  private refreshFocus() { this.interactions.update(this.character.player.getPosition(), this.carry.item?.id ?? null, this.mission); }
  private press = () => {
    const now = performance.now();
    this.mission.tick(now); this.refreshFocus();
    const target = this.interactions.focus;
    if (!target || this.activity || this.mission.state === 'finished') return;
    this.mission.start(now);
    if (target.kind === 'pickup') {
      const item = this.props.items.find(item => item.id === target.item)!;
      if (this.carry.pickUp(item)) {
        this.character.animator.setCarrying(true);
        this.character.animator.playAction('PickUp', 0.25);
        this.hud.announce(`Picked up ${item.name}. Follow the glowing destination.`);
      }
    } else if (target.kind === 'place') {
      if (!this.carry.item || this.carry.item.id !== target.item) return;
      if (this.mission.complete(target.task!, now)) {
        this.carry.release(this.props.root, target.placement!);
        this.character.animator.setCarrying(false);
        this.character.animator.playAction('PutDown', 0.3);
        this.reward(target, now);
      }
    } else {
      this.activity = { target, start: now, duration: target.kind === 'vacuum' ? 1150 : 450 };
      this.character.animator.playAction('PickUp', target.kind === 'vacuum' ? 1.15 : 0.45);
    }
    this.refreshFocus();
  };
  private cancelActivity() {
    this.activity = null; this.progress = 0;
    this.props.dirt.setLocalScale(1, 1, 1); this.props.crayonMess.setLocalScale(1, 1, 1);
    this.character.animator.cancelAction();
  }
  private cancelHold = () => { if (this.activity?.target.kind === 'vacuum') this.cancelActivity(); };
  private reward(target: Interaction, now: number) {
    this.feedback.reward(target.marker, '+$1', now);
    this.hud.announce(`${target.name} cleaned up. Earned $1. ${this.mission.completed.size} of 5 tasks complete.`);
  }
  update(now: number, movementIntent: boolean) {
    if (movementIntent) this.mission.start(now);
    this.mission.tick(now); this.refreshFocus();
    if (this.mission.state === 'finished') {
      if (!this.finishedHandled) {
        this.finishedHandled = true; this.cancelActivity(); this.action.reset(); this.resetMovement();
        this.onFinished(this.roundId, this.mission.allowance);
        if (this.mission.reason === 'complete') this.character.animator.playAction('Celebrate', 0.65);
      }
      if (now - this.mission.finishedAt >= (this.mission.reason === 'complete' ? 600 : 0)) this.hud.showResults(this.mission);
    } else if (this.activity) {
      const { target, start, duration } = this.activity;
      const inRange = this.interactions.distance(target, this.character.player.getPosition()) <= target.range + 0.1;
      if (!inRange || document.hidden || (target.kind === 'vacuum' && !this.action.held)) this.cancelActivity();
      else {
        this.progress = Math.min(1, (now - start) / duration);
        const messy = target.kind === 'vacuum' ? this.props.dirt : this.props.crayonMess;
        const size = 1 - this.progress * 0.92;
        messy.setLocalScale(size, size, size);
        if (this.progress >= 1 && this.mission.complete(target.task!, now)) {
          messy.enabled = false;
          if (target.kind === 'crayons') this.props.tidyCrayons.enabled = true;
          else {
            const vacuum = this.props.items.find(item => item.id === 'vacuum')!;
            this.carry.release(this.props.root, vacuum.home);
            this.character.animator.setCarrying(false);
          }
          this.activity = null; this.progress = 0;
          this.character.animator.playAction('PutDown', 0.25);
          this.reward(target, now); this.refreshFocus();
        }
      }
    }
    this.feedback.update(now, this.interactions, this.carry, this.mission);
    this.hud.update(this.mission, this.carry, this.interactions.focus, this.activity?.target.kind === 'crayons', this.progress);
  }
  replay = () => {
    if (!this.beforeReplay()) return;
    this.roundId = saveId();
    this.action.reset(); this.cancelActivity(); this.carry.item = null;
    this.props.reset(); this.mission.reset(); this.feedback.reset(); this.hud.reset();
    this.character.animator.reset(); this.character.player.setPosition(0, 0.09, 0.9);
    this.character.visual.setLocalEulerAngles(0, 30, 0);
    this.finishedHandled = false; this.interactions.focus = null; this.resetMovement();
    document.querySelector<HTMLCanvasElement>('#game-canvas')!.focus({ preventScroll: true });
  };
  setActive(active: boolean) {
    this.action.enabled = active; this.action.reset();
    if (!active) { this.feedback.hide(); this.hud.dialog.close(); }
  }
  snapshot() {
    return {
      state: this.mission.state, reason: this.mission.reason, remaining: this.mission.remaining,
      completed: [...this.mission.completed], allowance: this.mission.allowance, bonus: this.mission.bonus,
      carrying: this.carry.item?.id ?? null, carriedParent: this.carry.item?.entity.parent?.name ?? null,
      carriedPosition: this.carry.item?.entity.getPosition().toArray() ?? null,
      focus: this.interactions.focus?.id ?? null, holding: this.action.held, progress: this.progress,
      dirtVisible: this.props.dirt.enabled, crayonsVisible: this.props.crayonMess.enabled, tidyCrayonsVisible: this.props.tidyCrayons.enabled,
      items: this.props.items.map(item => ({ id: item.id, position: item.entity.getPosition().toArray(), home: item.home })),
      targets: this.props.interactions.map(target => ({ id: target.id, position: target.anchor.toArray(), range: target.range })),
    };
  }
  destroy() { this.action.destroy(); this.feedback.destroy(); this.hud.destroy(); }
}
