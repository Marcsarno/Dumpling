import {propPoint,propYaw} from '../editor/PropSpace';
import type { Application, Entity } from 'playcanvas';
import { CarrySystem } from '../components/CarrySystem';
import type { createCharacter } from '../components/CharacterVisual';
import { MissionSystem, TASKS } from '../systems/MissionSystem';
import { HOUSE_TASKS, EXTRA_HOUSE_TASKS } from '../data/house';
import { InteractionSystem } from '../systems/InteractionSystem';
import { ActionButton } from '../ui/ActionButton';
import { CleanupFeedback } from '../ui/CleanupFeedback';
import { CleanupHUD } from '../ui/CleanupHUD';
import type { CleanupProps, Interaction } from './cleanupProps';
import { saveId } from '../systems/saveId';
import { PET_TASKS } from './PetCleanup';
import { Vec3 } from 'playcanvas';
import {bedEntry,BED_ENTRY_SECONDS} from '../components/BedEntry';
import type { PlayerController } from '../components/PlayerController';
import type { IsometricCamera } from './IsometricCamera';

export class CleanupGame {
  roundId = saveId();
  onFinished: (id: string, amount: number) => void = () => {};
  beforeReplay: () => boolean = () => true;
  onReplay: () => void = () => {};
  mode: 'bedroom' | 'house' | 'practice' | 'pet' | 'day' = 'day';
  readonly mission = new MissionSystem();
  readonly carry: CarrySystem;
  readonly interactions: InteractionSystem;
  readonly action: ActionButton;
  private readonly feedback: CleanupFeedback;
  private readonly hud: CleanupHUD;
  private activity: { target: Interaction; start: number; duration: number } | null = null;
  private progress = 0;
  private finishedHandled = false;
  private celebrationStarted = false;
  private aligning: Interaction | null = null;
  private seatReturn:Vec3|null=null;
  private bedYaw=0;
  get movementLocked() { return this.character.animator.busy || !!this.activity; }
  get activeInteractionId(){return this.activity?.target.id??this.aligning?.id??null;}
  constructor(app: Application, private readonly character: ReturnType<typeof createCharacter>, private readonly props: CleanupProps,
    camera: Entity, private readonly resetMovement: () => void, private readonly controller: PlayerController, private readonly interactionCamera:IsometricCamera) {
    this.carry = new CarrySystem(app, character.visual);
    character.animator.bindCarrySocket(this.carry.socket);
    this.interactions = new InteractionSystem(props.interactions, target => props.pet?.allows(target) ?? true);
    const button = document.querySelector<HTMLButtonElement>('#action-button')!;
    this.hud = new CleanupHUD(button, this.replay);
    this.feedback = new CleanupFeedback(app, camera, document.querySelector('#cleanup-effects')!, props.interactions);
    this.action = new ActionButton(button, this.press, this.cancelHold);
    this.configure('day');
  }
  configure(mode: typeof this.mode) {
    if (this.mission.state === 'running' && this.mission.timed) return;
    this.mode = mode;
    this.props.daily!.setActive(mode==='day');this.mission.continuous=mode==='day';
    const tasks = mode === 'day' ? this.props.daily!.tasks : mode === 'pet' ? PET_TASKS : mode === 'bedroom' ? TASKS : mode === 'house' ? HOUSE_TASKS : [...TASKS, ...HOUSE_TASKS.filter(task => task.id !== 'book'), ...EXTRA_HOUSE_TASKS, ...PET_TASKS];
    this.mission.configure(tasks, mode !== 'practice'&&mode!=='day'); this.props.configure?.(tasks.map(task => task.id)); this.replay();
  }
  private refreshFocus() { this.interactions.update(this.character.player.getPosition(), this.carry.item?.id ?? null, this.mission); }
  private press = () => {
    const now = performance.now();
    this.mission.tick(now); this.refreshFocus();
    const target = this.interactions.focus;
    if (!target || this.activity || this.aligning || this.movementLocked || this.mission.state === 'finished') return;
    this.mission.start(now);
    {
      this.aligning = target;
      const point = target.placement ? new Vec3(...target.placement) : target.kind === 'pickup' ? this.props.items.find(item => item.id === target.item)!.entity.getPosition() : target.marker;
      this.controller.approachProp(point, () => {
        this.aligning = null; this.mission.tick(performance.now());
        if (this.mission.state !== 'finished') this.perform(target);
      }, () => { this.aligning = null; });
      return;
    }
  };
  private perform(target: Interaction) {
    const now = performance.now();
    const facing = target.placement ? new Vec3(...target.placement) : target.marker;
    if(target.kind==='daily') {
      if(['school-door','shop-door'].includes(target.id)) { this.props.daily!.perform(target,this.carry); return; }
      this.interactionCamera.beginChore(this.character.player.getPosition(),facing);
      if(target.duration===0){
        const pickup=['choose-clothes','night-clothes','take-egg','take-towel','daily-vacuum','take-breakfast'].includes(target.id);
        this.character.animator.playAction(pickup?'PickUp':'PutDown',.3,()=>{
          this.props.daily!.perform(target,this.carry);this.character.animator.setCarrying(!!this.carry.item);
          if(target.task){this.mission.completed.add(target.task);this.feedback.reward(target.marker,'+$1',performance.now());}
        },facing);
      } else {
        this.activity={target,start:now,duration:target.duration??1000};
        if(target.id==='sleep'){
          this.seatReturn=this.character.player.getPosition().clone();this.bedYaw=this.character.visual.getLocalEulerAngles().y;this.controller.reset();this.character.animator.setCarrying(false);this.character.animator.setWorkClip('SleepEnter');return;
        }
        if(target.id==='eat-breakfast'){
          this.seatReturn=this.character.player.getPosition().clone();this.controller.reset();this.character.player.setPosition(propPoint('dining',new Vec3(.55,.09,12.49)));this.character.visual.setLocalEulerAngles(0,propYaw('dining',0),0);this.character.animator.setCarrying(false);this.character.animator.setWorkClip('EatSit',propPoint('dining',new Vec3(.55,1,13.85)));return;
        }
        if(target.id.startsWith('wipe-')||target.id==='lilah-mess-1')this.character.animator.setWorkClip('Wipe',facing);
        else if(target.id.includes('vacuum')||target.id==='lilah-mess-2')this.character.animator.setWorkClip('Vacuum',facing);
        if(!target.hold){this.character.animator.setCarrying(true);this.character.animator.faceTowards(facing);}
      }
      return;
    }
    this.interactionCamera.beginChore(this.character.player.getPosition(),facing);
    if (target.kind === 'pickup') {
      const item = this.props.items.find(item => item.id === target.item)!;
      this.character.animator.playAction('PickUp', .25, () => {
        this.mission.tick(performance.now());
        if (this.mission.state !== 'finished' && this.carry.pickUp(item)) {
          this.character.animator.setCarrying(true);
          if (item.id === 'scooper') this.props.pet?.pickedUp();
          this.hud.announce(`Picked up ${item.name}. Follow the glowing destination.`);
        }
      }, facing);
    } else if (target.kind === 'pet' && target.id !== 'wash-hands') {
      this.character.animator.playAction(target.id === 'scoop-poop' ? 'PickUp' : 'PutDown', .4, () => {
        this.mission.tick(performance.now());
        if (this.mission.state === 'finished') return;
        if (target.id === 'scoop-poop') this.props.pet!.scoop();
        else {
          this.carry.release(this.props.root, this.props.pet!.tool.home);
          this.character.animator.setCarrying(false); this.props.pet!.flush(performance.now());
        }
        this.hud.announce(this.props.pet!.hint!);
      }, facing);
    } else if (target.kind === 'place') {
      if (!this.carry.item || this.carry.item.id !== target.item) return;
      this.character.animator.playAction('PutDown', .3, () => {
        const eventNow = performance.now();
        if (this.mission.complete(target.task!, eventNow)) {
          if(this.mode==='day')this.props.daily!.complete(target.task!);
          const placed = this.carry.release(this.props.root, target.placement!);
          if (placed && target.placedStyle === 'hide') placed.entity.enabled = false;
          if (placed && target.placedStyle === 'hang') placed.entity.setLocalEulerAngles(90, 0, 0);
          this.character.animator.setCarrying(false);
          this.reward(target, eventNow);
        }
      }, facing);
    } else {
      this.activity = { target, start: now, duration: target.kind === 'pet' ? 1600 : target.kind === 'vacuum' ? 1150 : 450 };
      if(target.kind==='vacuum')this.character.animator.setWorkClip('Vacuum',facing);
      if (target.kind === 'pet') { this.character.animator.setCarrying(true); this.character.animator.faceTowards(target.marker); }
    }
    this.refreshFocus();
  }
  private cancelActivity() {
    this.leaveSeat();
    this.character.animator.setWorkClip(null);this.interactionCamera.endChore();
    if (this.activity?.target.kind === 'pet' || this.activity?.target.kind==='daily') { this.character.animator.setCarrying(!!this.carry.item); this.character.animator.faceTowards(null); }
    this.activity?.target.mess?.setLocalScale(1,1,1);
    this.activity = null; this.progress = 0;
    this.props.dirt.setLocalScale(1, 1, 1); this.props.crayonMess.setLocalScale(1, 1, 1);
  }
  private cancelHold = () => {
    if(this.aligning&&(this.aligning.kind==='vacuum'||this.aligning.hold)){this.controller.reset();this.aligning=null;}
    if (this.activity?.target.kind === 'vacuum'||this.activity?.target.hold) this.cancelActivity();
  };
  private leaveSeat(){if(this.seatReturn){this.character.player.setPosition(this.seatReturn);this.seatReturn=null;this.character.animator.setWorkClip(null);if(this.character.grounding)this.character.grounding.surfaceHeight=null;}}
  private reward(target: Interaction, now: number) {
    this.feedback.reward(target.marker, this.mission.timed || this.mode==='day' ? '+$1' : '✓', now);
    this.hud.announce(`${target.name} cleaned up. ${this.mission.timed ? 'Earned $1. ' : ''}${this.mission.completed.size} of ${this.mission.tasks.length} tasks complete.`);
  }
  update(now: number, movementIntent: boolean) {
    if(!this.activity&&!this.character.animator.busy){this.character.animator.setWorkClip(null);this.interactionCamera.endChore();}
    if(this.mode==='day'){this.mission.tasks=this.props.daily!.tasks;for(const id of this.props.daily!.completed)this.mission.completed.add(id);}
    if (movementIntent) this.mission.start(now);
    this.mission.tick(now); this.refreshFocus();
    if (this.mission.state === 'finished') {
      if (!this.finishedHandled) {
        this.finishedHandled = true; this.cancelActivity(); this.action.reset(); this.resetMovement();
        this.onFinished(this.roundId, this.mission.allowance);
        if (this.mission.reason !== 'complete') this.character.animator.cancelAction();
      }
      if (this.mission.reason === 'complete' && !this.character.animator.busy && !this.celebrationStarted) {
        this.celebrationStarted = true;
        this.character.animator.playAction('Celebrate', .65);
      } else if (!this.character.animator.busy) this.hud.showResults(this.mission);
    } else if (this.activity) {
      const { target, start, duration } = this.activity;
      if(target.id==='sleep'&&this.seatReturn){const t=(now-start)/(BED_ENTRY_SECONDS*1000),pose=bedEntry(this.seatReturn,this.bedYaw,false,t);this.character.player.setPosition(pose.position);this.character.visual.setLocalEulerAngles(0,pose.yaw,0);if(this.character.grounding)this.character.grounding.surfaceHeight=pose.height;if(t>=1)this.character.animator.setWorkClip('Sleep');}
      const inRange = !!this.seatReturn||this.interactions.distance(target, this.character.player.getPosition()) <= target.range + 0.1;
      if (!inRange || document.hidden || ((target.kind === 'vacuum'||target.hold) && !this.action.held)) this.cancelActivity();
      else {
        this.progress = Math.min(1, (now - start) / duration);
        const messy = target.kind === 'daily' ? target.mess : target.kind === 'pet' ? null : target.kind === 'vacuum' ? this.props.dirt : this.props.crayonMess;
        const size = 1 - this.progress * 0.92;
        messy?.setLocalScale(size, size, size);
        if(this.progress>=1 && target.kind==='daily'){
          this.props.daily!.perform(target,this.carry);
          this.leaveSeat();
          if(target.task)this.mission.completed.add(target.task);
          this.character.animator.setCarrying(!!this.carry.item);this.character.animator.faceTowards(null);
          this.feedback.reward(target.marker,target.task?'+$1':'✓',now);this.activity=null;this.progress=0;
        } else if (this.progress >= 1 && this.mission.complete(target.task!, now)) {
          if (messy) messy.enabled = false;
          if (target.kind === 'pet') { this.props.pet!.finish();if(this.mode==='day')this.props.daily!.complete('pet-care'); this.character.animator.setCarrying(false); this.character.animator.faceTowards(null); }
          else if (target.kind === 'crayons') this.props.tidyCrayons.enabled = true;
          else {
            const vacuum = this.props.items.find(item => item.id === 'vacuum')!;
            this.character.animator.playAction('PutDown', .3, () => {
              this.carry.release(this.props.root, vacuum.home);
              this.character.animator.setCarrying(false);
            }, target.anchor);
          }
          this.activity = null; this.progress = 0;
          this.reward(target, now); this.refreshFocus();
        }
      }
    }
    this.feedback.update(now, this.interactions, this.carry, this.mission);
    if(this.activity)this.feedback.hideWorkingLabel(this.activity.target.id);
    this.props.pet?.update(now, this.activity?.target.kind === 'pet' ? this.progress : 0, this.carry.socket.getPosition());
    this.props.daily?.effect(this.activity?.target.kind==='daily'?this.activity.target:null,this.progress,this.carry.socket.getPosition());
    this.hud.update(this.mission, this.carry, this.activity?.target??this.interactions.focus, this.activity?.target.kind === 'crayons' || this.activity?.target.kind === 'pet'||(this.activity?.target.kind==='daily'&&!this.activity.target.hold), this.progress, this.character.animator.actionName, this.props.pet?.hint);
    if(this.mode==='day'){document.querySelector('#mission-clock')!.textContent=this.props.daily!.clock.label;document.querySelector('#cleanup-hint')!.textContent=this.props.daily!.hint;}
    if (this.aligning) { document.querySelector<HTMLButtonElement>('#action-button')!.disabled = true; document.querySelector('#action-title')!.textContent = 'Moving closer…'; }
  }
  replay = () => {
    if (!this.beforeReplay()) return;
    this.roundId = saveId();
    this.action.reset(); this.cancelActivity(); this.carry.item = null;
    if(this.mode==='house'){const tasks=this.props.roundMesses!.houseTasks();this.mission.configure(tasks,true);this.props.configure?.(tasks.map(t=>t.id));}
    this.props.reset(); this.props.roundMesses?.apply(this.mode); this.mission.reset(); this.feedback.reset(); this.hud.reset();
    if(this.mode==='day')for(const id of this.props.daily!.completed)this.mission.completed.add(id);
    this.character.animator.reset(); this.character.player.setPosition(0, 0.09, 0.9);
    this.character.visual.setLocalEulerAngles(0, 30, 0);
    this.finishedHandled = false; this.celebrationStarted = false; this.interactions.focus = null; this.resetMovement();
    this.onReplay();
    document.querySelector<HTMLCanvasElement>('#game-canvas')!.focus({ preventScroll: true });
  };
  setActive(active: boolean) {
    this.action.enabled = active; this.action.reset();
    if (!active) { this.feedback.hide(); this.hud.dialog.close(); }
  }
  developerCancel(){
    this.action.reset();this.cancelActivity();this.aligning=null;this.resetMovement();this.character.animator.cancelAction();
    if(this.carry.item){const item=this.carry.item;this.carry.release(this.props.root,item.home);item.entity.enabled=true;}
    this.character.animator.setCarrying(false);
  }
  developerComplete(){
    this.developerCancel();
    if(this.mode==='day'){this.props.daily!.developerComplete();for(const id of this.props.daily!.completed)this.mission.completed.add(id);return;}
    for(const task of this.mission.tasks){this.mission.completed.add(task.id);
      const target=this.props.interactions.find(t=>t.task===task.id&&t.kind==='place');
      if(target?.item){const item=this.props.items.find(i=>i.id===target.item);if(item){item.entity.reparent(this.props.root);if(target.placement)item.entity.setLocalPosition(...target.placement);if(target.placedStyle==='hide')item.entity.enabled=false;if(target.placedStyle==='hang')item.entity.setLocalEulerAngles(90,0,0);}}
    }
    this.props.dirt.enabled=false;this.props.crayonMess.enabled=false;this.props.tidyCrayons.enabled=true;
    if(this.mission.tasks.some(t=>t.id==='pet-care')){this.props.pet!.finish();this.props.pet!.poop.enabled=false;}
    this.mission.state='finished';this.mission.reason='complete';this.mission.allowance=0;this.mission.bonus=0;this.finishedHandled=true;
  }
  snapshot() {
    return {
      state: this.mission.state, reason: this.mission.reason, remaining: this.mission.remaining,
      mode: this.mode, tasks: this.mission.tasks.map(task => task.id), timed: this.mission.timed,
      pet: this.props.pet?.snapshot(),
      daily: this.props.daily?.snapshot(),
      completed: [...this.mission.completed], allowance: this.mission.allowance, bonus: this.mission.bonus,
      carrying: this.carry.item?.id ?? null, carriedParent: this.carry.item?.entity.parent?.name ?? null,
      carriedPosition: this.carry.item?.entity.getPosition().toArray() ?? null,
      focus: this.interactions.focus?.id ?? null, holding: this.action.held, progress: this.progress,
      aligning: this.aligning?.id ?? null,
      dirtVisible: this.props.dirt.enabled, crayonsVisible: this.props.crayonMess.enabled, tidyCrayonsVisible: this.props.tidyCrayons.enabled,
      items: this.props.items.map(item => ({ id: item.id, position: item.entity.getPosition().toArray(), home: item.home })),
      targets: this.props.interactions.map(target => ({ id: target.id, position: target.anchor.toArray(), range: target.range })),
    };
  }
  destroy() { this.action.destroy(); this.feedback.destroy(); this.hud.destroy(); }
}
