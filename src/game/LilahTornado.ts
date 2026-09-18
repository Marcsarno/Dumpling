import {Entity,Vec3,type Application} from 'playcanvas';
import {HousePath} from '../components/HousePath';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
import type {Bedroom} from './bedroom';
import type {CleanupProps} from './cleanupProps';
import type {CleanupGame} from './CleanupGame';
import type {GameLoop} from './GameLoop';
import type {IsometricCamera} from './IsometricCamera';
import type {Lilah} from './Lilah';
import {material,primitives} from './primitives';
import {ActionButton} from '../ui/ActionButton';
import {PopAudio} from '../ui/PopAudio';
import {saveId} from '../systems/saveId';
import {TORNADO_SECONDS,TornadoScore,chooseInterruption,type Interruption} from '../systems/TornadoRules';
import '../ui/tornado.css';

const TYPES=[{name:'Blocks',icon:'🧱'},{name:'Crayons',icon:'🖍️'},{name:'Laundry',icon:'👕'},{name:'Juice spill',icon:'🧃'},{name:'Toys',icon:'🧸'}];
type Mess={id:number;root:Entity;point:Vec3;type:number;special:Interruption;label:HTMLDivElement;born:number};
const get=(id:string)=>document.querySelector<HTMLElement>(id)!;

/** Transient house event. Chore completion, saved furniture and daily progress are never rewritten. */
export class LilahTornado {
  private phase:'idle'|'intro'|'playing'|'result'='idle';
  private elapsed=0;private score=new TornadoScore();private round='';private paid=false;
  private special:Interruption='none';private specialStarted=false;private created=0;private nextDrop=0;
  private messes:Mess[]=[];private cleaning:{mess:Mess;elapsed:number;aligning:boolean}|null=null;
  private readonly planner:HousePath;private readonly sight:HousePath;private readonly audio=new PopAudio();
  private readonly launch=document.createElement('button');private readonly hud=document.createElement('section');
  private readonly dialog=document.createElement('dialog');private readonly overlay=document.createElement('div');
  private readonly action:ActionButton;private readonly abort=new AbortController();
  private readonly colors=['#edabbe','#a5c9e1','#ecc76c','#b3c895'].map((c,i)=>material('Tornado toy '+i,c));
  private readonly juice=material('Tornado juice','#eeb360');private readonly cloth:Entity;
  private spots:Vec3[]=[];private lastSpot=-1;private notice='Follow Lilah’s little trail!';private noticeUntil=0;
  private recentSpots:number[]=[];
  private dog:{home:Vec3;angles:Vec3;route:Vec3[];point:Vec3;wait:number}|null=null;
  private popups:{element:HTMLElement;point:Vec3;until:number}[]=[];
  get active(){return this.phase!=='idle';}
  get playing(){return this.phase==='playing';}
  get canMove(){return this.playing&&(!this.cleaning||this.cleaning.aligning)&&!this.character.animator.busy;}
  constructor(private app:Application,house:Bedroom,private props:CleanupProps,private cleanup:CleanupGame,private loop:GameLoop,
    private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private camera:IsometricCamera,private lilah:Lilah){
    this.planner=new HousePath(house,.28);this.sight=new HousePath(house,.04);
    this.launch.id='tornado-launch';this.launch.textContent='🌪️ Lilah Tornado';get('#mission-picker').append(this.launch);
    this.hud.id='tornado-hud';this.hud.hidden=true;this.hud.innerHTML=`<header><div><small>TEAM ARIANNA + LILAH</small><h2>Lilah Tornado</h2></div><strong data-time>0:55</strong><button data-sound aria-label="Mute event sounds">♫</button></header><div class="tornado-meter-row"><span>🧺 Mess meter</span><span data-count>0 / 3</span></div><meter min="0" max="3" value="0" aria-label="Unfinished messes"></meter><div class="tornado-score"><b data-score>0 points</b><b data-streak>Let’s team up!</b></div><p data-notice role="status"></p>`;
    this.overlay.id='tornado-effects';this.dialog.id='tornado-dialog';this.dialog.setAttribute('aria-label','Lilah Tornado');
    get('#game').append(this.hud,this.overlay,this.dialog);
    this.cloth=primitives(app,props.root)('Tornado cleaning cloth','box',[0,0,0],[.22,.014,.17],material('Tornado cloth','#f9efe1'),false);this.cloth.enabled=false;
    this.action=new ActionButton(get('#action-button') as HTMLButtonElement,()=>this.clean(),()=>{});this.action.enabled=false;
    const signal=this.abort.signal;
    this.launch.addEventListener('click',()=>this.open(),{signal});
    this.hud.querySelector('[data-sound]')!.addEventListener('click',e=>{(e.currentTarget as HTMLElement).textContent=this.audio.mute()?'♪̸':'♫';},{signal});
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();if(this.phase==='intro')this.close();},{signal});
    this.dialog.addEventListener('click',e=>{
      const action=(e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset.action;
      if(action==='begin')this.begin();if(action==='back')this.close();if(action==='retry')this.finish();
      if(action==='again'&&this.paid){this.close();this.open();}
    },{signal});
    document.addEventListener('visibilitychange',()=>this.audio.pause(document.hidden),{signal});
  }
  available(){return this.loop.mode==='cleanup'&&this.cleanup.mode==='day'&&this.props.daily!.clock.state.phase!=='school'&&this.props.daily!.clock.state.phase!=='night'&&!this.cleanup.carry.item&&!this.cleanup.movementLocked&&this.lilah.ready&&!this.character.placeholder.enabled&&!document.querySelector('dialog[open]');}
  open(forced?:Interruption){
    if(this.active||!this.available())return;
    this.phase='intro';this.special=forced??chooseInterruption();this.cleanup.setActive(false);this.controller.reset();this.camera.endChore();
    get('#game').dataset.tornado='true';this.launch.hidden=true;
    this.dialog.innerHTML=`<div class="tornado-emblem">🌪️</div><small>A LITTLE CHAOS. A LOT OF TEAMWORK.</small><h2>Lilah Tornado</h2><p>Lilah has big ideas! Follow her thought bubbles and help tidy her trail.</p><div class="tornado-instructions"><span>👣 Move close</span><span>✨ Tap Action to tidy</span><span>⏱️ 55 seconds</span></div><p>Clean again within 8 seconds for a streak. Everyone earns a star and allowance!</p><button data-action="begin">Ready, Lilah! →</button><button data-action="back" class="secondary">Maybe later</button>`;this.dialog.showModal();
  }
  private begin(){
    this.dialog.close();this.phase='playing';this.elapsed=0;this.nextDrop=.6;this.created=0;this.lastSpot=-1;this.recentSpots=[];this.specialStarted=false;this.score=new TornadoScore();this.round=saveId();this.paid=false;
    this.hud.hidden=false;this.action.enabled=true;this.notice='Follow Lilah’s thought bubbles. Tap Action near a mess!';this.noticeUntil=6;
    this.spots=[[1.1,2.1],[1.1,4.1],[1.2,6.1],[.7,8.1],[.5,10.3],[2.2,11.3],[3.8,10.7],[1.2,7.3],[3.7,6.4],[3.8,2]].map(([x,z])=>new Vec3(x,0,z)).filter(p=>this.planner.free(p.x,p.z)&&this.planner.route(new Vec3(this.character.player.getPosition().x,0,this.character.player.getPosition().z),p).length>0);
    this.lilah.beginTornado();void this.audio.unlock();this.audio.pause(false);
    (get('#game-canvas') as HTMLCanvasElement).focus({preventScroll:true});
  }
  /** Called before movement so daily time and other action listeners cannot compete. */
  beforeMovement(now:number){
    if(!this.active)return;
    this.props.daily!.pause(now);this.cleanup.action.enabled=false;this.controller.enabled=this.canMove&&!document.hidden;
  }
  update(dt:number){
    this.launch.hidden=this.active||this.loop.mode!=='cleanup'||this.cleanup.mode!=='day';
    if(!this.active){this.launch.disabled=!this.available();this.launch.title=this.cleanup.carry.item?'Put your item away first.':'A 55-second family cleanup game';return;}
    this.action.enabled=this.playing&&!this.loop.developerPaused&&!document.hidden;
    if(!this.playing)return;
    if(document.hidden)return;
    this.elapsed+=dt;
    if(this.elapsed>=TORNADO_SECONDS){this.finish();return;}
    if(!this.lilah.working&&this.elapsed>=this.nextDrop&&this.messes.length<3){
      const position=this.lilah.root.getPosition();
      const candidates=this.spots.map((p,i)=>({p,i,d:Math.hypot(p.x-position.x,p.z-position.z)})).filter(v=>v.i!==this.lastSpot&&v.d>.8&&v.d<6&&!this.messes.some(m=>m.point.distance(v.p)<1));
      candidates.sort((a,b)=>Number(this.recentSpots.includes(a.i))-Number(this.recentSpots.includes(b.i))||a.d-b.d);
      const spot=candidates[0];
      if(spot){
        const basket=this.special==='basket'&&!this.specialStarted&&this.elapsed>14,type=this.created%TYPES.length;
        if(this.lilah.visitForMess(spot.p,basket?'🧺':TYPES[type].icon,()=>{
          if(!this.playing)return;
          this.spawn(spot.p,type,basket?'basket':'none');this.nextDrop=this.elapsed+1.1;
        })){this.lastSpot=spot.i;this.recentSpots.push(spot.i);this.recentSpots=this.recentSpots.slice(-3);if(basket)this.specialStarted=true;}
      }
      this.nextDrop=this.elapsed+1;
    }
    if(this.special==='dog'&&!this.specialStarted&&this.elapsed>17&&this.messes.length<2&&!this.dog){this.startDog();}
    this.updateDog(dt);
    if(this.cleaning&&!this.cleaning.aligning){
      const job=this.cleaning;job.elapsed+=dt;const progress=Math.min(1,job.elapsed/1.45);
      job.mess.label.hidden=true;
      job.mess.root.children.forEach((child,i)=>{child.enabled=i>=Math.floor(progress*job.mess.root.children.length);});
      if(job.mess.type===3){this.cloth.enabled=true;this.cloth.setPosition(this.cleanup.carry.socket.getPosition());}
      if(progress>=1){this.complete(job.mess);this.cleaning=null;this.cloth.enabled=false;this.character.animator.setWorkClip(null);this.camera.endChore();}
    }
    this.paint();
  }
  private spawn(point:Vec3,type:number,special:Interruption){
    if(this.messes.length>=3)return;
    const root=new Entity('Tornado '+(special==='none'?TYPES[type].name:special),this.app);this.props.root.addChild(root);root.setPosition(point.x,.06,point.z);
    const shape=primitives(this.app,root),n=special==='basket'?12:type===3?5:6;
    if(special==='dog'){const poop=this.props.pet!.poop.clone();root.addChild(poop);poop.setLocalPosition(0,0,0);poop.enabled=true;}
    else for(let i=0;i<n;i++){
      const x=Math.sin(i*2.4)*.26,z=Math.cos(i*2.4)*.22;
      const part=shape('Mess piece',type===3?'sphere':type===1?'cylinder':'box',[x,type===3?.02:.07,z],type===3?[.35,.025,.27]:type===1?[.04,.23,.04]:type===2?[.19,.04,.16]:[.13,.13,.13],type===3?this.juice:this.colors[i%4],false);
      if(type===1)part.setLocalEulerAngles(90,0,i*38);
    }
    if(special==='basket'){const basket=shape('Empty toy basket','box',[.35,.14,0],[.24,.26,.33],this.colors[3],false);basket.setLocalEulerAngles(0,0,65);}
    const label=document.createElement('div');label.className='tornado-marker';label.textContent=special==='dog'?'💩 +10':special==='basket'?'🧺 +10':TYPES[type].icon;this.overlay.append(label);
    this.messes.push({id:++this.created,root,point:point.clone(),type,special,label,born:this.elapsed});
    this.audio.power(special==='none'?'bomb':'mega');
    this.notice=special==='dog'?'Arianna: “That is NOT a toy, buddy!” 💩':special==='basket'?'Lilah: “The basket sneezed!” 🧺':'Lilah: “Ta-da! I made a little something!”';this.noticeUntil=this.elapsed+3;
  }
  private focus(){const p=this.character.player.getPosition();return this.messes.filter(m=>Math.hypot(p.x-m.point.x,p.z-m.point.z)<1.15&&this.sight.line(new Vec3(p.x,0,p.z),m.point)).sort((a,b)=>a.point.distance(p)-b.point.distance(p))[0];}
  private clean(){
    if(!this.playing||this.cleaning||this.character.animator.busy)return;const mess=this.focus();if(!mess)return;
    this.cleaning={mess,elapsed:0,aligning:true};this.controller.enabled=true;
    this.controller.approachProp(mess.point,()=>{
      if(!this.playing||!this.cleaning)return;this.cleaning.aligning=false;
      this.camera.beginChore(this.character.player.getPosition(),mess.point);
      if(mess.type===3)this.character.animator.setWorkClip('Wipe',mess.point);
      else this.character.animator.playAction('PickUp',.8,undefined,mess.point);
      this.audio.select(1);
    },()=>{this.cleaning=null;});
  }
  private complete(mess:Mess){
    const points=this.score.clean(this.elapsed,mess.special);mess.root.destroy();mess.label.remove();this.messes=this.messes.filter(m=>m!==mess);
    this.audio.pop(this.score.streak*3);this.notice=this.score.streak>1?`CLEAN STREAK ×${this.score.streak} · +${points}`:`Lovely helping! +${points}`;this.noticeUntil=this.elapsed+2.5;
    const element=document.createElement('div');element.className='tornado-sparkles';element.textContent=`✦ +${points} ✦`;this.overlay.append(element);this.popups.push({element,point:mess.point.clone(),until:this.elapsed+1});
  }
  private startDog(){
    const pet=this.props.pet!;if(!pet.loaded)return;
    const p=pet.dog.getPosition(),point=this.spots.filter(v=>!this.messes.some(m=>m.point.distance(v)<1)).sort((a,b)=>a.distance(p)-b.distance(p))[0];
    if(!point)return;
    const path=this.planner.route(new Vec3(p.x,0,p.z),point);if(!path.length){this.specialStarted=true;return;}
    this.specialStarted=true;this.dog={home:p.clone(),angles:pet.dog.getEulerAngles().clone(),route:path,point:point.clone(),wait:0};this.notice='🐾 A very innocent walk…';this.noticeUntil=this.elapsed+4;
  }
  private updateDog(dt:number){
    const dog=this.dog;if(!dog||dog.wait<0&&!dog.route.length)return;const root=this.props.pet!.dog;
    if(dog.route.length){const p=root.getPosition(),next=dog.route[0],delta=new Vec3(next.x-p.x,0,next.z-p.z),distance=delta.length();if(distance<.04){dog.route.shift();return;}delta.normalize();root.setPosition(p.x+delta.x*Math.min(distance,dt*.9),.04+Math.abs(Math.sin(this.elapsed*12))*.025,p.z+delta.z*Math.min(distance,dt*.9));root.setEulerAngles(0,Math.atan2(delta.x,delta.z)*180/Math.PI,0);}
    else {dog.wait+=dt;if(dog.wait>1.2&&this.messes.length<3){root.setPosition(dog.point.x,.04,dog.point.z);this.spawn(dog.point,0,'dog');dog.wait=-1;dog.route=this.planner.route(dog.point,new Vec3(dog.home.x,0,dog.home.z));}}
  }
  private paint(){
    const nearest=this.focus(),button=get('#action-button') as HTMLButtonElement;
    button.disabled=!!this.cleaning||!nearest;button.dataset.target=nearest?'tornado-'+nearest.id:'';
    get('#action-title').textContent=this.cleaning?'Tidying…':nearest?'Clean up':'Follow Lilah';get('#action-detail').textContent=this.cleaning?'You’ve got this!':nearest?(nearest.special==='none'?TYPES[nearest.type].name:'Bonus cleanup'):'Find her little trail';get('#action-icon').textContent=nearest?TYPES[nearest.type].icon:'🌪️';
    const progress=this.cleaning&&!this.cleaning.aligning?this.cleaning.elapsed/1.45:0;button.style.setProperty('--hold-progress',`${progress*360}deg`);button.classList.toggle('holding',progress>0);
    const set=(selector:string,value:string)=>{const node=this.hud.querySelector(selector)!;if(node.textContent!==value)node.textContent=value;};
    set('[data-time]',`0:${String(Math.ceil(TORNADO_SECONDS-this.elapsed)).padStart(2,'0')}`);set('[data-count]',`${this.messes.length} / 3`);this.hud.querySelector('meter')!.value=this.messes.length;
    set('[data-score]',`${this.score.score} points`);set('[data-streak]',this.score.streak>1&&this.elapsed-this.score.lastClean<=8?`CLEAN STREAK ×${this.score.streak}`:'Little hands. Big help.');
    set('[data-notice]',this.elapsed<this.noticeUntil?this.notice:this.messes.length===3?'Lilah takes a breather. Pick any mess!':'👣 Follow Lilah · ✨ Tap Action to tidy');
    const bounds=get('#game').getBoundingClientRect();
    for(const m of this.messes){const p=this.camera.entity.camera!.worldToScreen(new Vec3(m.point.x,.4,m.point.z)),x=Math.max(24,Math.min(bounds.width-24,p.x)),y=Math.max(this.hud.offsetTop+this.hud.offsetHeight+40,Math.min(bounds.height-180,p.y));m.label.classList.toggle('near',m===nearest);m.label.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;m.label.classList.toggle('edge',x!==p.x||y!==p.y);m.label.style.setProperty('--angle',`${Math.atan2(p.y-y,p.x-x)}rad`);}
    this.popups=this.popups.filter(p=>{if(this.elapsed>p.until){p.element.remove();return false;}const v=this.camera.entity.camera!.worldToScreen(p.point);p.element.style.left=v.x+'px';p.element.style.top=v.y+'px';return true;});
  }
  private clearScene(){
    this.cleaning=null;this.controller.reset();this.character.animator.cancelAction();this.character.animator.setWorkClip(null);this.camera.endChore();this.cloth.enabled=false;
    this.lilah.endTornado();for(const m of this.messes){m.root.destroy();m.label.remove();}this.messes=[];
    if(this.dog){this.props.pet!.dog.setPosition(this.dog.home);this.props.pet!.dog.setEulerAngles(this.dog.angles);this.dog=null;}
    for(const p of this.popups)p.element.remove();this.popups=[];
  }
  private finish(){
    if(this.phase!=='playing'&&this.phase!=='result')return;
    if(this.phase==='playing'){this.phase='result';this.elapsed=TORNADO_SECONDS;this.action.enabled=false;this.clearScene();this.audio.celebrate();}
    let error='';try{if(!this.paid){this.loop.save.creditRound(this.round,this.score.reward);this.paid=true;}}catch{error='Your reward is ready, but saving failed. Retry before leaving.';}
    this.dialog.innerHTML=`<div class="tornado-stars">${'★'.repeat(this.score.stars)}${'☆'.repeat(3-this.score.stars)}</div><small>LILAH TORNADO · ALL DONE!</small><h2>${this.score.stars===3?'House hero!':this.score.stars===2?'Super helper!':'A little help, a big smile!'}</h2><p>Lilah: “We make a good team, Ari!”</p><div class="tornado-totals"><span><b>${this.score.score}</b>points</span><span><b>${this.score.cleaned}</b>tidied</span><span><b>×${this.score.bestStreak}</b>best streak</span></div><p class="tornado-earned">${this.paid?`+$${this.score.reward} saved · wallet $${this.loop.save.data.balance}`:error}</p>${this.paid?'<button data-action="again">Play together again ↻</button><button data-action="back" class="secondary">Back to the house</button>':'<button data-action="retry">Retry saving reward</button>'}`;
    if(!this.dialog.open)this.dialog.showModal();
  }
  close(){if(this.phase==='result'&&!this.paid)return;this.clearScene();this.phase='idle';this.hud.hidden=true;this.dialog.close();this.action.enabled=false;this.audio.stop();delete get('#game').dataset.tornado;this.cleanup.setActive(this.loop.mode==='cleanup');this.props.daily!.pause(performance.now());get('#wallet').textContent='$'+this.loop.save.data.balance;get('#action-button').classList.remove('holding');}
  pause(paused:boolean){this.audio.pause(paused);this.action.enabled=!paused&&this.playing;if(!paused&&this.cleaning&&!this.cleaning.aligning){this.camera.beginChore(this.character.player.getPosition(),this.cleaning.mess.point);if(this.cleaning.mess.type===3)this.character.animator.setWorkClip('Wipe',this.cleaning.mess.point);}}
  snapshot(){return {phase:this.phase,elapsed:this.elapsed,score:this.score.score,cleaned:this.score.cleaned,streak:this.score.streak,bestStreak:this.score.bestStreak,stars:this.score.stars,reward:this.score.reward,paid:this.paid,special:this.special,specialStarted:this.specialStarted,created:this.created,cleaning:this.cleaning?.mess.id,aligning:this.cleaning?.aligning,spots:this.spots.map(p=>p.toArray()),messes:this.messes.map(m=>({id:m.id,point:m.point.toArray(),type:m.type,special:m.special})),audio:this.audio.snapshot()};}
  destroy(){this.clearScene();this.abort.abort();this.action.destroy();this.audio.destroy();this.launch.remove();this.hud.remove();this.overlay.remove();this.dialog.remove();this.cloth.destroy();for(const m of this.colors)m.destroy();this.juice.destroy();}
}
