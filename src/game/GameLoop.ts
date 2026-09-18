import { Vec3, type Application } from 'playcanvas';
import { DUMPLINGS } from '../data/collection';
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
import { HUNT_RULES, SERIES, STORES, boxPrice, seriesById, storeById, createHuntDay } from '../data/hunt';
import { HuntUI } from '../ui/HuntUI';
import { TradingUI } from '../ui/TradingUI';
import { createRecess } from './recess';
import { TRADERS } from '../data/trading';
import { SquishyPopUI } from '../ui/SquishyPopUI';
import { starLevel } from '../data/squishyPop';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.querySelector<T>(id)!;
import type {LilahTornado} from './LilahTornado';
export class GameLoop {
  tornado?:LilahTornado;
  readonly save = new ProgressStore(new LocalSaveRepository());
  readonly stores;
  private activeStoreId = 'corner';
  get store(){return this.stores.find(s=>s.definition.id===this.activeStoreId)!;}
  readonly huntUI: HuntUI;
  readonly tradingUI: TradingUI;
  readonly popUI: SquishyPopUI;
  readonly recess;
  private recessFromSchool = false;
  private travelUntil=0;
  private inspecting: {site:number;until:number}|null=null;
  private findCopy='';
  private lastHuntRefresh=0;
  readonly opening: OpeningSequence;
  mode: 'cleanup' | 'store' | 'home' | 'recess' = 'cleanup';
  private focus = '';
  private action: ActionButton;
  private abort = new AbortController();
  private messageUntil = 0;
  private pendingCredit: { id: string; amount: number } | null = null;
  private baseZoom = 9;
  private screen = new Vec3();
  private markerPoint = new Vec3();
  developerPaused=false;
  private developerClockFrozen=false;
  constructor(app: Application, private readonly camera: IsometricCamera,
    private readonly character: ReturnType<typeof createCharacter>, private readonly room: Bedroom,
    private readonly props: CleanupProps, private readonly cleanup: CleanupGame,
    private readonly controller: PlayerController, private readonly joystick: VirtualJoystick) {
    this.stores = STORES.map(definition=>createStore(app,definition)); this.opening = new OpeningSequence(app);
    this.huntUI=new HuntUI(id=>this.attempt(()=>this.visit(id)));
    this.popUI=new SquishyPopUI(()=>this.save.data.collection,(id,score)=>this.save.completePopRound(id,score),open=>{
      this.joystick.reset();this.controller.reset();this.controller.enabled=!open;this.props.daily!.pause(performance.now());
      app.autoRender=!open;app.renderNextFrame=!open;
      if(open){this.action.enabled=false;this.huntUI.panel.hidden=true;}else{this.action.enabled=true;this.findCopy='';this.wallet();}
    },()=>!this.save.data.pop?.tutorialSeen,()=>({bestScore:this.save.data.pop?.bestScore??0,tickets:this.save.data.pop?.tickets??0}));
    this.recess=createRecess(app);
    this.tradingUI=new TradingUI(this.save,()=>{this.wallet();this.recess.sync(this.save.data.trading!);},()=>this.attempt(()=>this.leaveRecess()));
    const daily=this.props.daily!;
    daily.onReward=id=>{this.pendingCredit={id,amount:1};this.creditPending();};
    daily.onStore=()=>this.attempt(()=>this.chooseStore());
    daily.onPhaseChange=()=>{
      if(this.cleanup.mode!=='day')return;
      if(daily.clock.state.phase==='school'){this.attempt(()=>this.enterRecess(true));return;}
      const away=this.mode!=='cleanup';
      if(away&&daily.clock.state.phase!=='night')return;
      this.huntUI.dialog.close();
      if(this.mode==='store'&&daily.clock.state.phase==='night'){
        this.save.goHome();this.cleanup.configure('day');this.enterHome();this.message('The shops are closing. Home with your finds!');return;
      }
      const position=this.character.player.getPosition().clone();
      if(this.mode!=='cleanup'&&daily.clock.state.phase==='night')this.startCleanup();
      this.cleanup.configure('day');
      if(daily.clock.state.phase==='afternoon'||away)this.character.player.setPosition(-2.1,.09,8.2);
      else if(daily.clock.state.phase!=='morning')this.character.player.setPosition(position);
    };
    el('#game').dataset.scene = 'cleanup';
    this.action = new ActionButton(el('#action-button'), this.press, () => {}); this.action.enabled = false;
    const on = (id: string, fn: () => void) => el(id).addEventListener('click', fn, { signal: this.abort.signal });
    on('#go-shopping', () => this.attempt(() => this.chooseStore()));
    on('#collection-button', () => this.attempt(() => this.collection()));
    const popShortcut=document.createElement('button');popShortcut.id='squishy-pop-shortcut';popShortcut.type='button';popShortcut.textContent='✿ Squishy Pop';
    popShortcut.title='Jump straight into Squishy Pop';el('footer').insertBefore(popShortcut,el('#collection-button'));
    popShortcut.addEventListener('click',()=>this.attempt(()=>{
      if(this.tornado?.active||this.character.animator.busy||this.cleanup.movementLocked||this.opening.phase==='opening'||this.travelUntil||this.inspecting||
        (this.mode==='cleanup'&&this.cleanup.mission.timed&&this.cleanup.mission.state==='running')){
        this.message('Finish this action or round, then jump into Squishy Pop!');return;
      }
      if(this.creditPending())this.popUI.open();
    }),{signal:this.abort.signal});
    on('#back-cleanup', () => this.attempt(() => this.startCleanup()));
    on('#open-next', () => this.attempt(() => { this.save.goHome(); this.enterHome(); }));
    const tradeButton=document.createElement('button');tradeButton.id='visit-recess';tradeButton.className='loop-button pink-button';tradeButton.textContent='Visit recess trading table';
    el('#collection-dialog').insertBefore(tradeButton,el('#collection-grid'));
    tradeButton.addEventListener('click',()=>this.attempt(()=>this.enterRecess(false)),{signal:this.abort.signal});
    for (const mode of ['day','house', 'bedroom', 'pet', 'practice'] as const) on(`#mission-${mode}`, () => {
      if (this.mode === 'cleanup' && this.creditPending()) this.cleanup.configure(mode);
    });
    el<HTMLDialogElement>('#collection-dialog').addEventListener('cancel', e => e.preventDefault(), { signal: this.abort.signal });
    cleanup.onFinished = (id, amount) => { this.pendingCredit = { id, amount }; this.creditPending(); };
    cleanup.beforeReplay = () => this.creditPending();
    cleanup.onReplay = () => this.camera.reset();
    this.wallet();
    this.attempt(()=>this.save.ensureHuntDay(daily.clock.state.day));
    if(this.save.data.hunt?.day===daily.clock.state.day&&daily.clock.canShop){daily.clock.state.minutes=Math.max(daily.clock.state.minutes,this.save.data.hunt.clockFloor);daily.save();}
    const location = this.save.data.location;
    if (location === 'store'&&daily.clock.canShop&&this.save.data.hunt?.activeStore) {this.activeStoreId=this.save.data.hunt.activeStore;this.enterStore();}
    else if(location==='store')this.attempt(()=>{this.save.goHome();this.enterHome();});
    else if (location === 'home') this.enterHome();
    else if (location === 'collection') { this.enterHome(); this.renderCollection(); }
    if (this.save.problem) this.message(this.save.problem, true);
  }
  private chooseStore(){
    const daily=this.props.daily!;
    if(!daily.clock.canShop){this.message('Shopping is an after-school adventure. Finish your morning and come back this afternoon.');return;}
    if(!daily.clock.ready){this.message('Finish your afternoon helping first. Every chore earns spending money!');return;}
    if(!this.creditPending())return;
    this.save.ensureHuntDay(daily.clock.state.day);
    el<HTMLDialogElement>('#results').close();this.joystick.reset();this.controller.reset();
    this.huntUI.routes(this.save.data.hunt!,daily.clock.state.minutes,this.save.data.balance);
  }
  private visit(id:string){
    const daily=this.props.daily!;
    if(!daily.clock.canShop||!daily.clock.ready)throw Error('Shopping starts after your afternoon helping.');
    const minutes=this.save.visitStore(id,daily.clock.state.day,daily.clock.state.minutes);
    daily.clock.state.minutes=minutes;daily.save();this.activeStoreId=id;
    this.huntUI.showTravel(storeById(id).name);this.travelUntil=performance.now()+1100;
    this.joystick.reset();this.controller.reset();
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
    this.room.root.enabled = mode !== 'store' && mode !== 'recess'; this.props.root.enabled = mode === 'cleanup';
    this.recess.root.enabled=mode==='recess';this.tradingUI.leave.hidden=mode!=='recess';this.tradingUI.close();
    for(const store of this.stores)store.root.enabled=mode==='store'&&store.definition.id===this.activeStoreId;
    this.huntUI.panel.hidden=true;this.huntUI.dialog.close();this.findCopy='';this.inspecting=null;
    el('#move-tip').hidden=false;
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
    if(this.cleanup.mode!=='day')this.cleanup.configure('day');
    this.transition('store'); this.controller.setRoom(this.store); this.character.player.setPosition(0, .09, this.store.exitAnchor.z-.4);
    this.store.sync(this.save.data.hunt!.stores[this.activeStoreId]);
    this.character.animator.reset(); this.character.visual.setLocalEulerAngles(0, 30, 0);
    el('#scene-kicker').textContent = this.store.definition.name; el('h1').textContent = 'A little treasure hunt.';
    el('#scene-subtitle').textContent = 'Peek at shelves, baskets & little displays.';
  }
  private enterRecess(fromSchool: boolean) {
    this.save.ensureTradingDay(this.props.daily!.clock.state.day);
    this.recessFromSchool=fromSchool;this.transition('recess');this.controller.setRoom(this.recess);
    this.character.player.setPosition(0,.09,3.3);this.character.animator.reset();this.recess.sync(this.save.data.trading!);
    el('#scene-kicker').textContent='THE RECESS TABLE';el('h1').textContent='Got any doubles?';
    el('#scene-subtitle').textContent='Bring extras. Find a new favorite.';
    this.tradingUI.leave.textContent=fromSchool?'Finish school →':'Back to collection →';
  }
  private leaveRecess() {
    this.tradingUI.close();
    if(this.recessFromSchool){
      this.props.daily!.clock.advance(3);this.props.daily!.save();this.startCleanup();this.character.player.setPosition(-2.1,.09,8.2);
    }else{this.save.showCollection();this.enterHome();this.renderCollection();}
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
    for (const series of SERIES) {
      const heading=document.createElement('strong');heading.className='series-heading';heading.textContent=`${series.name} · ${series.items.filter(id=>this.save.data.collection[id]>0).length}/${series.items.length}`;grid.append(heading);
    for (const data of DUMPLINGS.filter(d=>(series.items as readonly string[]).includes(d.id))) {
      const count = this.save.data.collection[data.id] || 0; if (count) discovered++; total += count;
      const card = document.createElement('article'); card.className = `dumpling-card${count ? ' owned' : ''}`; card.dataset.id = data.id;
      card.style.setProperty('--rarity', `${RARITIES[data.rarity].color}66`);
      const image = document.createElement('img'); image.src = dumplingPortrait(data, !count); image.alt = count ? data.name : 'Undiscovered dumpling';
      const name = document.createElement('strong'); name.textContent = count ? data.name : '???';
      const tier = document.createElement('small'); tier.textContent = data.rarity;
      const copies = document.createElement('small'); copies.className = 'copies'; copies.textContent = count ? `×${count} · Pop ${'★'.repeat(starLevel(count))}` : 'Locked';
      card.append(image, name, tier, copies); grid.append(card);
      if(count)for(const [kind,icon,label] of [['favorite','♥','Favorite'],['locked','🔒','Lock']] as const){
        const button=document.createElement('button');button.className='collection-protection';button.textContent=icon;
        button.setAttribute('aria-label',`${label} ${data.name}`);button.setAttribute('aria-pressed',String(!!this.save.data.protections?.[data.id]?.[kind]));
        let pressed=false;button.onpointerdown=()=>{pressed=true;};
        button.onclick=e=>{if(e.detail>0&&!pressed)return;pressed=false;this.attempt(()=>{this.save.protect(data.id,kind,!this.save.data.protections?.[data.id]?.[kind]);button.setAttribute('aria-pressed',String(this.save.data.protections?.[data.id]?.[kind]));});};card.append(button);
      }
    }
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
    if(this.travelUntil||this.inspecting)return;
    if(this.mode==='recess'){
      const seat=this.recess.seats.find(s=>s.id===this.focus&&this.character.player.getPosition().distance(s.anchor)<1.05);
      if(seat){this.joystick.reset();this.controller.reset();this.tradingUI.open(seat.id,this.props.daily!.clock.state.day);}
      return;
    }
    if (this.mode === 'store') {
      this.storeFocus();
      if (this.focus.startsWith('hunt-site-')) {
        const site=Number(this.focus.slice(10)),slot=this.save.data.hunt!.stores[this.activeStoreId].slots.find(s=>s.site===site)!;
        if(!slot.discovered){this.inspecting={site,until:performance.now()+HUNT_RULES.inspectMilliseconds};this.joystick.reset();this.controller.reset();}
        else {this.save.purchaseStock(site);this.store.sync(this.save.data.hunt!.stores[this.activeStoreId]);this.wallet();this.message('A sealed surprise, tucked into your bag!');}
      }
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
    const stock=this.save.data.hunt!.stores[this.activeStoreId];
    const nearby=this.store.sites.filter(site=>stock.slots.some(s=>s.site===site.id&&s.remaining>0)&&Math.hypot(p.x-site.anchor.x,p.z-site.anchor.z)<=.95)
      .sort((a,b)=>p.distance(a.anchor)-p.distance(b.anchor))[0];
    this.focus=nearby?`hunt-site-${nearby.id}`:Math.hypot(p.x,p.z-this.store.exitAnchor.z)<=.9?'go-home':'';
  }
  beforeMovement(now: number) {
    if(this.tornado?.active){this.tornado.beforeMovement(now);return;}
    if(this.popUI.isOpen){this.props.daily!.pause(now);this.controller.enabled=false;return;}
    if(this.developerClockFrozen)this.props.daily!.pause(now);
    if(this.mode!=='recess')this.props.daily!.update(now,this.cleanup.carry.item?.id??null,this.cleanup.movementLocked||this.controller.approaching||this.opening.phase==='opening');
    else this.props.daily!.pause(now);
    const school=this.cleanup.mode==='day'&&this.props.daily!.clock.state.phase==='school';
    el('#school-transition').hidden=!school||this.mode==='recess';
    if (this.mode === 'cleanup') this.cleanup.mission.tick(now);
    this.controller.enabled = (!school||this.mode==='recess')&&!this.tradingUI.dialog.open&&!this.travelUntil&&!this.inspecting&&!this.huntUI.dialog.open&&(this.mode === 'recess'||this.mode === 'store' || (this.mode === 'cleanup' && this.cleanup.mission.state !== 'finished' && !this.cleanup.movementLocked)) && !el<HTMLDialogElement>('#collection-dialog').open;
  }
  update(now: number) {
    if(this.tornado?.active)return;
    this.popUI.launch.hidden=this.mode!=='store'||this.popUI.isOpen||!!this.travelUntil||!!this.inspecting||this.huntUI.dialog.open;
    if(this.popUI.isOpen)return;
    const daily=this.cleanup.mode==='day',clock=this.props.daily!.clock;
    if(now-this.lastHuntRefresh>1000){
      this.lastHuntRefresh=now;
      this.attempt(()=>this.save.ensureHuntDay(clock.state.day));
      if(this.huntUI.dialog.open&&this.save.data.hunt)this.huntUI.refresh(this.save.data.hunt,clock.state.minutes,this.save.data.balance);
    }
    this.huntUI.clock(clock.state.minutes,daily&&clock.canShop&&!this.huntUI.dialog.open&&this.mode!=='home'&&this.mode!=='recess');
    if(this.travelUntil){if(now<this.travelUntil)return;this.travelUntil=0;this.huntUI.travel.hidden=true;this.enterStore();}
    el('#day-label').hidden=!daily;
    if(daily){
      el('#day-label').textContent=`Day ${clock.state.day} · ${clock.state.phase==='afternoon'?'After school':clock.state.phase}`;
      el('#mission-clock').hidden=false;
      el('#mission-clock').textContent=clock.label;
    }
    if(this.mode==='recess')el('#day-label').textContent=`Day ${clock.state.day} · Recess`;
    const running = this.mode === 'cleanup' && this.cleanup.mission.state === 'running' && this.cleanup.mission.timed;
    for (const mode of ['day','house', 'bedroom', 'pet', 'practice']) {
      const button = el<HTMLButtonElement>(`#mission-${mode}`); button.disabled = running;
      button.setAttribute('aria-pressed', String(this.cleanup.mode === mode));
    }
    el('#game').dataset.mission = this.cleanup.mode;
    el<HTMLButtonElement>('#collection-button').disabled = running || this.mode === 'store' || this.mode === 'recess' || this.opening.phase === 'opening';
    if (now > this.messageUntil) el('#save-message').hidden = true;
    if (this.mode === 'cleanup') {
      el('#task-list').hidden = this.cleanup.mode === 'practice';
      this.cleanup.update(now, this.controller.input.lengthSq() > 0);
      if(this.cleanup.mode==='day'){el('#allowance').textContent=`$${this.save.data.balance}`;el('#day-label').textContent=`Day ${this.props.daily!.clock.state.day} · ${this.props.daily!.clock.state.phase==='afternoon'?'After school':this.props.daily!.clock.state.phase}`;}
      el('#day-label').hidden=this.cleanup.mode!=='day';return;
    }
    let title = 'Action', detail = 'Come closer', icon = '✋', enabled = false;
    if(this.mode==='recess'){
      const p=this.character.player.getPosition();const seat=this.recess.seats.filter(s=>p.distance(s.anchor)<1.05).sort((a,b)=>p.distance(a.anchor)-p.distance(b.anchor))[0];
      this.focus=seat?.id??'';this.recess.seats.forEach(s=>s.glow.enabled=s===seat);
      const trader=TRADERS.find(t=>t.id===seat?.id);
      el('#cleanup-hint').textContent='Walk up to a classmate. Bring extras, and see what they love.';
      if(trader){title='Trade with '+trader.name;detail=trader.title;icon=trader.icon;enabled=!this.tradingUI.dialog.open;}
    }else if (this.mode === 'store') {
      this.storeFocus(); const data = this.save.data;
      const stock=data.hunt!.stores[this.activeStoreId];
      if(this.inspecting&&now>=this.inspecting.until){const site=this.inspecting.site;this.inspecting=null;this.attempt(()=>this.save.discover(site));this.findCopy='';}
      const allGone=stock.slots.every(s=>!s.remaining);
      el('#cleanup-hint').textContent = `Bag ${data.trip.purchases} / ${HUNT_RULES.bagLimit} · ${allGone?'All the boxes are gone today.': 'Look around for little ribboned boxes.'} Return at the welcome mat.`;
      let copy='';const slot=this.save.data.hunt!.stores[this.activeStoreId].slots.find(s=>`hunt-site-${s.site}`===this.focus);
      if(slot){
        icon='🎁';
        if(this.inspecting){title='Taking a peek…';detail='What series is it?';}
        else if(!slot.discovered){title='Take a look';detail=this.store.sites[slot.site].name;enabled=true;}
        else {
          const series=seriesById(slot.series),price=boxPrice(this.store.definition,slot.series)-this.save.popDiscount(),full=data.trip.purchases>=HUNT_RULES.bagLimit,short=data.balance<price;
          const owned=series.items.filter(id=>data.collection[id]>0).length;
          title=full?'Bag full':short?'Save a little':'Buy box';detail=full?'Bring your finds home':short?`Need $${price-data.balance} more`:`$${price} · Sealed surprise`;enabled=!full&&!short;
          copy=`${series.name}|$${price}${this.save.popDiscount()?' · $1 ticket coupon included':''} · Owned ${owned}/${series.items.length}|${slot.remaining===1?'Last box at this display.':'A couple of boxes here.'} The friend inside is a surprise.`;
        }
      }else if(this.focus==='go-home'){title='Go Home';detail=data.boxes.length?'Open your boxes':'Back to the cottage';icon='⌂';enabled=true;}
      if(copy!==this.findCopy){this.findCopy=copy;if(copy){const [a,b,c]=copy.split('|');this.huntUI.find(a,b,c);}else this.huntUI.panel.hidden=true;}
      el('#move-tip').hidden=!!copy;
      const site=this.store.sites.find(s=>`hunt-site-${s.id}`===this.focus);
      this.store.glows.forEach((g,i)=>g.enabled=site?.id===i);
      const marker=el('#shop-display-marker');marker.hidden=!site;
      if(site){marker.textContent='✦';this.camera.entity.camera!.worldToScreen(site.marker,this.screen);marker.style.transform=`translate(${this.screen.x-marker.offsetWidth/2}px,${this.screen.y-marker.offsetHeight}px)`;}
      this.markerPoint.copy(this.store.exitAnchor);this.markerPoint.y=.1;this.camera.entity.camera!.worldToScreen(this.markerPoint,this.screen);
      const exit=el('#shop-exit-marker');exit.style.transform=`translate(${this.screen.x-exit.offsetWidth/2}px,${this.screen.y}px)`;exit.classList.toggle('nearby',this.focus==='go-home');
    } else {
      this.opening.update(now);
      const opening = this.opening.phase === 'opening', canOpen = this.opening.phase === 'closed' && this.save.data.boxes.length > 0;
      title = opening ? 'A surprise…' : canOpen ? 'Open box' : 'Collection'; detail = opening ? 'Here it comes' : canOpen ? 'Tap to unwrap' : 'Meet your friends'; icon = canOpen ? '🎁' : '✦'; enabled = !opening;
      this.focus = canOpen ? 'open-box' : opening ? '' : 'collection';
    }
    const button = el<HTMLButtonElement>('#action-button'); button.disabled = !enabled || this.tradingUI.dialog.open || el<HTMLDialogElement>('#collection-dialog').open; button.dataset.target = enabled ? this.focus : '';
    el('#action-title').textContent = title; el('#action-detail').textContent = detail; el('#action-icon').textContent = icon;
    button.setAttribute('aria-label', `${title}: ${detail}`);
  }
  developerHold(paused:boolean){
    if(!import.meta.env.DEV)return;
    this.tornado?.pause(paused);this.developerPaused=paused;this.joystick.reset();this.controller.reset();this.props.daily!.pause(performance.now());
    if(paused)this.cleanup.developerCancel();
    this.action.enabled=!paused&&this.mode!=='cleanup'&&!this.popUI.isOpen;
    this.cleanup.action.enabled=!paused&&this.mode==='cleanup'&&!this.tornado?.active;
    this.popUI.developerPause(paused);
  }
  developerTick(now:number,elapsed:number){
    if(!import.meta.env.DEV)return;
    this.props.daily!.pause(now);this.cleanup.mission.pauseFor(elapsed*1000);
    if(this.travelUntil)this.travelUntil+=elapsed*1000;if(this.inspecting)this.inspecting.until+=elapsed*1000;
  }
  developerSummary(){return{scene:this.mode,store:this.mode==='store'?this.store.definition.name:null,day:this.props.daily!.clock.state.day,time:this.props.daily!.clock.label,phase:this.props.daily!.clock.state.phase,clockFrozen:this.developerClockFrozen,balance:this.save.data.balance,tickets:this.save.data.pop?.tickets??0,discovered:DUMPLINGS.filter(d=>this.save.data.collection[d.id]>0).length,boxes:this.save.data.boxes.length,cleanup:this.cleanup.mode,completed:this.cleanup.mission.completed.size,tasks:this.cleanup.mission.tasks.length,pop:this.popUI.snapshot(),popDev:this.popUI.developerStatus()};}
  developerCommand(command:string,value=''){
    if(!import.meta.env.DEV)throw Error('Developer controls require the local development build.');
    const daily=this.props.daily!;
    const home=()=>{
      this.tornado?.close();
      this.popUI.developerControl('close');this.travelUntil=0;this.inspecting=null;this.huntUI.travel.hidden=true;
      this.cleanup.developerCancel();this.cleanup.mission.reset();this.cleanup.configure('day');this.startCleanup();
      this.character.player.setPosition(-2.1,.09,8.2);this.camera.reset();
    };
    const phase=(p:'morning'|'afternoon'|'night',next=false)=>{
      home();daily.developerPhase(p,next);this.save.ensureHuntDay(daily.clock.state.day);
      this.save.developerEdit(data=>{if(data.hunt)data.hunt.clockFloor=daily.clock.state.minutes;});
      this.cleanup.configure('day');this.character.player.setPosition(-2.1,.09,8.2);
    };
    if(command.startsWith('pop:')){this.popUI.developerControl(command.slice(4),Number(value)||undefined);return;}
    switch(command){
      case 'tornado':home();this.tornado?.open(['dog','basket','none'].includes(value)?value as 'dog'|'basket'|'none':undefined);break;
      case 'play-pop':case 'store':{
        const id=command==='play-pop'?'toys':value;if(!STORES.some(s=>s.id===id))throw Error('Choose a store.');
        phase('afternoon');daily.developerComplete();this.cleanup.developerComplete();
        this.save.developerEdit(data=>{data.location='store';data.trip={active:true,purchases:0};data.hunt!.activeStore=id;data.hunt!.stores[id].visited=true;});
        this.activeStoreId=id;this.enterStore();if(command==='play-pop')this.popUI.open();break;
      }
      case 'home':home();break;
      case 'collection':home();this.collection();break;
      case 'recess':home();this.enterRecess(false);break;
      case 'complete-current':if(this.mode!=='cleanup')throw Error('Return home to finish the current cleaning activity.');this.cleanup.developerComplete();break;
      case 'skip-chores':phase('afternoon');this.cleanup.developerComplete();break;
      case 'phase':if(!['morning','afternoon','night'].includes(value))throw Error('Choose a time of day.');phase(value as 'morning'|'afternoon'|'night');break;
      case 'next-day':phase('morning',true);break;
      case 'freeze-clock':this.developerClockFrozen=!this.developerClockFrozen;break;
      case 'restart-chores':home();daily.clock.state.done=[];if(daily.clock.state.phase==='morning')daily.clock.state.breakfast='eggs';daily.refresh();daily.save();this.cleanup.replay();break;
      case 'unstick':this.popUI.developerControl('close');this.cleanup.developerCancel();if(this.mode==='store'){this.character.player.setPosition(0,.09,this.store.exitAnchor.z-.4);}else if(this.mode==='recess')this.character.player.setPosition(0,.09,3.3);else home();this.character.animator.reset();this.camera.reset();break;
      case 'cash':this.save.developerEdit(data=>{data.balance=Math.min(999999,data.balance+20);});break;
      case 'tickets':this.save.developerEdit(data=>{const p=data.pop??={tickets:0,bestScore:0,rounds:[],tutorialSeen:false,couponDay:0};p.tickets=Math.min(999999,p.tickets+40);});break;
      case 'unlock':case 'duplicates':this.save.developerEdit(data=>{for(const d of DUMPLINGS)data.collection[d.id]=Math.max(data.collection[d.id]??0,command==='duplicates'?5:1);});break;
      case 'give-item':case 'give-box':if(!DUMPLINGS.some(d=>d.id===value))throw Error('Choose a squishy.');this.save.developerEdit(data=>{if(command==='give-item')data.collection[value]=Math.min(999999,(data.collection[value]??0)+1);else data.boxes.push({id:crypto.randomUUID(),dumplingId:value});});break;
      case 'restock':this.save.developerEdit(data=>{const fresh=createHuntDay(daily.clock.state.day);if(data.hunt){fresh.activeStore=data.hunt.activeStore;fresh.clockFloor=data.hunt.clockFloor;}data.hunt=fresh;data.trip.purchases=0;});for(const store of this.stores)store.sync(this.save.data.hunt!.stores[store.definition.id]);break;
      default:throw Error('Unknown developer control.');
    }
    this.wallet();if(el<HTMLDialogElement>('#collection-dialog').open)this.renderCollection();this.findCopy='';this.props.daily!.pause(performance.now());
  }
  resized() { this.baseZoom = this.camera.exploreHeight; if (this.mode === 'home') this.camera.entity.camera!.orthoHeight = 3.25; }
  snapshot() { return { mode: this.mode, balance: this.save.data.balance, boxes: this.save.data.boxes.length, purchases: this.save.data.trip.purchases, collection: { ...this.save.data.collection }, phase: this.opening.phase, reveal: this.save.data.reveal ? { ...this.save.data.reveal } : null, focus: this.focus,
    pop:this.popUI.snapshot(),popSave:this.save.data.pop,trading:this.save.data.trading, recess:this.mode==='recess'?{seats:this.recess.seats.map(s=>({id:s.id,position:s.anchor.toArray()})),art:this.recess.artStats?.()}:null,
    hunt:this.save.data.hunt,store:this.mode==='store'?{id:this.activeStoreId,sites:this.store.sites.map(s=>({id:s.id,position:s.anchor.toArray()})),exit:this.store.exitAnchor.toArray(),walkable:this.store.walkable,obstacles:this.store.obstacles.map(b=>({center:b.center.toArray(),halfExtents:b.halfExtents.toArray()})),art:this.store.artStats?.()}:null }; }
  destroy() { this.popUI.destroy();this.abort.abort();document.querySelector('#squishy-pop-shortcut')?.remove(); this.action.destroy(); this.opening.destroy(); this.huntUI.destroy(); this.tradingUI.destroy(); }
}
