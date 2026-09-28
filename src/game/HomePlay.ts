import {BoundingBox,Entity,Vec3,type Application} from 'playcanvas';
import {HOME_TOYS,type Point,type ToyDefinition} from '../data/homePlay';
import {HomePlayStore,type ToyState} from '../systems/HomePlayStore';
import {saveKey} from '../systems/SaveNamespace';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
import {HousePath} from '../components/HousePath';
import type {CleanupGame} from './CleanupGame';
import type {DailyLife} from './DailyLife';
import type {Bedroom} from './bedroom';
import type {CleanupItem} from './cleanupProps';
import {HomeToyArt} from './HomeToyArt';
import {primitives} from './primitives';
import './homePlay.css';
import {PlayAudio} from '../ui/PlayAudio';
import type {IsometricCamera} from './IsometricCamera';
import {HOUSE_DOORS} from '../data/house';

type Command={title:string;run:()=>void};
type Motion={vx:number;vy:number;vz:number;time:number};
export type PlayFocus={title:string;detail:string;icon:string;enabled:boolean};
/** Free objects share the chore carry socket. Optional play never touches mission rewards. */
export class HomePlay{
 readonly store:HomePlayStore;readonly root:Entity;readonly art:HomeToyArt;
 readonly items=new Map<string,CleanupItem>();
 private versions=new Map<string,string>();private motion=new Map<string,Motion>();private spin=new Map<string,number>();
 private controls=document.createElement('div');private next=document.createElement('button');private other=document.createElement('button');
 private cue:Entity;private preview:Entity;private planner:HousePath;private selected='';private commandIndex=0;private commands:Command[]=[];private active=false;private allowed=false;
 private pushing=false;private nextPersist=0;private clock=0;private effectClock=0;private abort=new AbortController();
 private effects:{entity:Entity;life:number;vx:number;vz:number;vy:number}[]=[];private leaves:Entity[]=[];private puddle:Entity;
 private lastPlayer=new Vec3();private nearby:string[]=[];private dirty=false;private lastDay=0;
 private fetchAfter=0;private goalCooldown=0;private jumpEffect=false;
 private audio=new PlayAudio();private manualTarget=false;private lastSelectPosition=new Vec3();
 private wagonObstacle=new BoundingBox(new Vec3(2.6,0,7.75),new Vec3(.30,1,.39));private wagonPlanner:HousePath;private resting:Vec3|null=null;
 private sceneMode='';private jumpParent:HTMLElement|null=null;
 private shared:{id:string;person:Entity;socket:Entity;time:number;burst:boolean}|null=null;
 extraFocus:PlayFocus|null=null;extraCommands:Command[]=[];
 onInvite:(id:string,position:Vec3)=>void=()=>{};onFetch:(id:string,position:Vec3)=>boolean=()=>false;
 constructor(private app:Application,private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private house:Bedroom,private cleanup:CleanupGame,private daily:DailyLife,private say:(s:string)=>void,private camera:IsometricCamera){
  this.store=new HomePlayStore(localStorage,saveKey('home-play.v1'),daily.clock.state.day);this.lastDay=daily.clock.state.day;
  this.root=new Entity('Home free play',app);app.root.addChild(this.root);this.art=new HomeToyArt(app);this.planner=new HousePath(house,.12);
  this.wagonPlanner=new HousePath(house,.38);
  for(const def of HOME_TOYS){const t=this.state(def.id);if(t.owner!=='world'||t.position.every((v,i)=>v===def.home[i]))continue;if(!this.planner.free(t.position[0],t.position[2]))t.position=[...def.home];else t.position[1]=.08;}
  for(const def of HOME_TOYS){const entity=new Entity(def.name,app);this.root.addChild(entity);this.items.set(def.id,{id:'home-'+def.id,name:def.name,icon:'✿',entity,home:[...def.home],carryGrip:[0,.12,0],carryPace:'walk'});}
  const shape=primitives(app,this.root);this.cue=shape('Selected toy','cylinder',[0,0,0],[.40,.009,.40],this.art.mat('#f3dfae'),false);this.preview=shape('Placement preview','cylinder',[0,0,0],[.30,.008,.30],this.art.mat('#b6dbc6'),false);
  this.puddle=shape('Watering puddle','sphere',[-5,.065,5.6],[.65,.015,.52],this.art.mat('#a5cbd1'),false);
  // Actual garden tree at (-8.5,2), clear of the doorway and route north.
  for(let i=0;i<18;i++){const leaf=shape('Garden leaf','sphere',[-8.1+Math.sin(i*2.4)*.6,.075,2+Math.cos(i*1.7)*.7],[.13,.018,.07],this.art.mat(i%2?'#c6a46d':'#b88767'),false);leaf.setLocalEulerAngles(0,i*29,0);this.leaves.push(leaf);}
  this.controls.id='home-play-controls';this.controls.hidden=true;this.next.type=this.other.type='button';this.next.id='home-next-action';this.other.id='home-next-object';this.next.textContent='More · Q';this.other.textContent='Select · R';this.controls.append(this.next,this.other);
  document.querySelector('#action-button')!.parentElement!.prepend(this.controls);
  this.next.onclick=()=>{this.commandIndex=(this.commandIndex+1)%Math.max(1,this.allCommands.length);};this.other.onclick=()=>{const stand=this.extraCommands.find(c=>c.title==='Stand up');if(stand){this.safe(stand.run);return;}const options=[...this.nearby,''],n=options.indexOf(this.selected);this.selected=options[(n+1)%options.length];this.manualTarget=true;this.lastSelectPosition.copy(this.character.player.getPosition());this.commandIndex=0;};
  window.addEventListener('keydown',e=>{if(e.repeat||document.querySelector('dialog[open]')||!this.allowed)return;if(e.code==='KeyQ'){e.preventDefault();this.next.click();}if(e.code==='KeyR'){e.preventDefault();this.other.click();}},{signal:this.abort.signal});
  this.sync();
  Object.assign(this.wagonObstacle,{homePlayDynamic:true});this.house.obstacles.push(this.wagonObstacle);
 }
 get carrying(){return this.cleanup.carry.item?.id.startsWith('home-')??false;}
 get movementLocked(){return this.pushing&&!!this.character.animator.busy;}
 get sitting(){return !!this.resting;}
 applyObstacles(){this.wagonObstacle.center.copy(this.active?this.pos('wagon'):new Vec3(9999,0,9999));this.controller.dynamicObstacles=this.controller.dynamicObstacles.filter(b=>b!==this.wagonObstacle);if(this.active)this.controller.dynamicObstacles.push(this.wagonObstacle);}
 get allCommands(){return this.extraCommands.length?this.extraCommands:this.commands;}
 get focus():PlayFocus|null{if(!this.allowed)return null;const command=this.allCommands[this.commandIndex%Math.max(1,this.allCommands.length)];return command?{title:command.title,detail:this.extraFocus?.detail??this.items.get(this.held()??this.selected)?.name??'Home play',icon:'✿',enabled:!this.character.animator.busy||['Stand up','Stop bite'].includes(command.title)}:null;}
 private safe(run:()=>void){try{run();this.sync();}catch(e){this.say('Your play could not be saved. Please try again.');console.error('Home play transaction',e);}}
 press(){if(!this.focus?.enabled)return false;this.audio.unlock();const c=this.allCommands[this.commandIndex%this.allCommands.length];this.safe(c.run);this.audio.tone(330,.09,'sine',1.2);return true;}
 private pos(id:string){return this.items.get(id)!.entity.getPosition().clone();}
 private state(id:string){return this.store.data.toys[id];}
 private held(){const id=this.store.held;return id&&this.items.has(id)?id:null;}
 reactToVisit(id:string,person:Entity,socket:Entity){if(!this.items.has(id)||person.getPosition().distance(this.pos(id))>1.8)return false;let shared=false;this.safe(()=>{if(id==='jack'&&this.state(id).value<1)this.animate(id,1);else if(['bubbles','cup','book'].includes(this.state(id).kind)&&!this.shared){this.store.transact(s=>{s.toys[id].owner='lilah';});if(this.cleanup.carry.item===this.items.get(id))this.detachCarry();this.shared={id,person,socket,time:3,burst:false};shared=true;}else this.burst(this.pos(id),'#e9c989',4);});return shared;}
 private returnShared(){if(!this.shared)return;const {id,person}=this.shared,p=person.getPosition();for(const [dx,dz]of [[.55,0],[-.55,0],[0,.55],[0,-.55]])if(this.planner.free(p.x+dx,p.z+dz)){this.store.place(id,[p.x+dx,.08,p.z+dz]);this.shared=null;this.sync();return;}this.store.place(id,HOME_TOYS.find(d=>d.id===id)!.home);this.shared=null;this.sync();}
 finishFetch(id:string){this.motion.delete(id);const p=this.pos(id);this.safe(()=>{this.store.place(id,[p.x,.08,p.z]);});}
 private facing(){const v=this.character.visual.forward.clone().mulScalar(-1);v.y=0;return v.normalize();}
 private destination():Point|null{
  const p=this.character.player.getPosition(),f=this.facing();
  for(const d of [.57,.42,.75]){const q=p.clone().add(f.clone().mulScalar(d));if(this.planner.free(q.x,q.z))return[q.x,.08,q.z];}
  for(const angle of [-45,45,-90,90,180]){const a=angle*Math.PI/180,q=p.clone().add(new Vec3(f.x*Math.cos(a)-f.z*Math.sin(a),0,f.x*Math.sin(a)+f.z*Math.cos(a)).mulScalar(.6));if(this.planner.free(q.x,q.z))return[q.x,.08,q.z];}
  return this.planner.free(p.x,p.z)?[p.x,.08,p.z]:null;
 }
 private pickup(id:string){if(this.cleanup.carry.item)return;this.character.animator.playAction('PickUp',.8,()=>this.safe(()=>{if(this.store.take(id)){this.motion.delete(id);this.sync();this.character.animator.setCarrying(true);}}),this.pos(id));}
 private put(id:string,owner='world'){
  const target=owner==='world'?this.destination():this.pos(owner).toArray() as Point;if(!target){this.say('Step into a little clear floor space to put this down.');return;}
  if(id==='wagon'&&HOUSE_DOORS.some(d=>Math.hypot(target[0]-d.x,target[2]-d.z)<.8)){this.say('A little farther from the doorway will leave room to walk.');return;}
  if(owner!=='world')target[1]+=owner.startsWith('cup')||owner.startsWith('block')?.20:owner==='teddy'?.22:owner==='flamingo'?.95:owner==='wagon'?.24:owner==='board'?0:.16;
  if(owner==='world'&&['cup','block','ramp'].includes(this.state(id).kind)){
   const near=[...this.items.keys()].find(k=>k!==id&&['cup','block'].includes(this.state(k).kind)&&this.state(k).owner==='world'&&Math.hypot(this.pos(k).x-target[0],this.pos(k).z-target[2])<.23&&this.pos(k).y<.7);
   if(near){const p=this.pos(near);target[0]=p.x;target[1]=p.y+(this.state(near).kind==='cup'?.17:.22);target[2]=p.z;owner=near;}
  }
  if(this.store.place(id,target,owner)){if(owner==='basin'){this.motion.delete(id);if(id==='duck')this.animate(id,0);}this.detachCarry();this.sync();this.character.animator.playAction('PutDown',.8);}
 }
 private detachCarry(){if(this.carrying)this.cleanup.carry.release(this.root,[0,.08,0]);this.character.animator.setCarrying(!!this.cleanup.carry.item);}
 private throw(id:string,strong=false){if(!this.destination())return;const kind=this.state(id).kind;
  this.character.animator.playAction(kind==='ball'?'PlayRoll':'PlayThrow',.8,()=>this.safe(()=>{if(this.held()!==id||!this.active)return;const p=this.destination();if(!p)return;const f=this.facing();p[1]=['ball','car'].includes(kind)?.08:Math.max(.3,this.cleanup.carry.socket.getPosition().y);
   if(this.store.place(id,p)){this.detachCarry();this.sync();const speed=kind==='plane'?(strong?3.8:2.1):kind==='ball'?2.8:2;
    this.motion.set(id,{vx:f.x*speed,vy:kind==='plane'?.8:kind==='ball'?0:1.5,vz:f.z*speed,time:0});if(kind==='fetch')this.fetchAfter=1.8;}
  }));
 }
 private animate(id:string,value:number){this.store.transact(s=>{s.toys[id].value=value;});}
 private gather(){const members=HOME_TOYS.filter(d=>['cup','ball','beanbag','teddy','block','fetch','cake','plate','pitcher'].includes(d.kind));this.store.transact(s=>{for(const d of members){if(s.toys[d.id].owner==='held')continue;Object.assign(s.toys[d.id],{owner:'world',position:[...d.home],tilt:0});this.motion.delete(d.id);}});}
 private buildCommands(){
  this.commands=[];const add=(title:string,run:()=>void)=>this.commands.push({title,run}),id=this.selected,t=id?this.state(id):null,h=this.held(),ht=h?this.state(h):null;
  if(this.resting){if(h&&ht?.kind==='book')add('Turn page',()=>this.animate(h,(ht.value+1)%4));add('Stand up',()=>{this.character.animator.setIdleClip('Idle');this.character.animator.playAction('MealStand',.65);this.resting=null;});return;}
  if(this.pushing){add('Let go',()=>{this.pushing=false;this.savePositions();this.character.animator.setWorkClip(null);});return;}
  if(h&&ht){
   const k=ht.kind;
   if(id&&id!==h&&t&&this.pos(id).distance(this.character.player.getPosition())<1.5){
    if(id==='basket')add('Put in basket',()=>{const def=HOME_TOYS.find(d=>d.id===h)!;this.store.place(h,def.home);this.detachCarry();});
    if((id==='wagon'&&['teddy','cup','block','duck','cake'].includes(k))||(k==='hat'&&['teddy','flamingo'].includes(id))||(k==='teddy'&&['cushion','bed','sofa'].includes(t.kind))||(id==='board'&&k==='paper'))add(id==='wagon'?'Load wagon':k==='hat'?'Put hat on':id==='board'?'Display picture':'Seat Teddy',()=>this.put(h,id));
    if(t.kind==='surface'&&['paper','plane','cup','block','book'].includes(k))add('Place on desk',()=>this.put(h,id));
    if(id==='teddy'&&k==='beanbag')add('Set in Teddy’s lap',()=>this.put(h,id));
    if(id==='basin'&&['boat','duck'].includes(k)&&this.store.data.water)add('Float toy',()=>this.put(h,'basin'));
    if(['pitcher','cup','cake'].includes(k)&&id==='teddy')add(k==='cake'?'Offer pretend bite':'Offer tea',()=>{this.animate('teddy',k==='cake'?2:1);this.burst(this.pos('teddy'),'#e9c989',3);});
   if(k==='pitcher'&&t.kind==='cup')add('Pour tea',()=>{this.animate(id,1);this.spin.set(h,1);this.burst(this.pos(id),'#bbd7d5',4);});
    if(k==='can'&&id==='flower')add('Water flower',()=>{if(!ht.value){this.say('The watering can is empty. Fill it at the sink.');return;}this.store.transact(s=>{s.toys[h].value--;s.toys.flower.value=Math.min(3,s.toys.flower.value+1);s.puddle=Math.min(1,s.puddle+.3);});this.burst(this.pos(id),'#aad5e0',8);});
    if(k==='pinwheel'&&id==='flower')add('Plant pinwheel',()=>this.put(h,id));
   }
   if(k==='can'&&this.character.player.getPosition().distance(new Vec3(-1.7,.09,11.45))<1.15)add('Refill can',()=>{this.animate(h,3);this.burst(this.pos(h),'#acd6de',5);});
   if(k==='paper'){add('Draw a mark',()=>this.store.transact(s=>{const a=s.toys[h].marks;if(a.length<16)a.push((s.toys[h].value+a.length)%4);}));add('Choose color',()=>this.animate(h,(ht.value+1)%4));add('Fold plane',()=>this.store.transact(s=>{s.toys[h].kind='plane';}));}
   if(k==='plane'){add('Gentle toss',()=>this.throw(h));add('Strong throw',()=>this.throw(h,true));add('Unfold paper',()=>this.store.transact(s=>{s.toys[h].kind='paper';}));}
   if(['beanbag','ball','fetch'].includes(k))add(k==='ball'?'Roll ball':'Toss',()=>this.throw(h));
   if(k==='book')add('Turn page',()=>this.animate(h,(ht.value+1)%4));
   if(k==='book'&&id&&t?.kind==='cushion')add('Read beside cushion',()=>{this.resting=this.character.player.getPosition().clone();this.character.animator.setIdleClip('MealIdle');this.character.animator.playAction('MealSit',.65);});
   if(k==='pitcher')add('Pour here',()=>{this.spin.set(h,1);const p=this.destination();if(p)this.burst(new Vec3(...p),'#bbd7d5',4);});
   if(k==='pinwheel')add('Blow',()=>this.spin.set(h,9));
   if(k==='bubbles')add('Blow bubbles',()=>this.blow());
   if(this.daily.lilahAvailable&&this.daily.lilahTarget.anchor.distance(this.character.player.getPosition())<4&&['bubbles','book','cup','teddy','duck','jack'].includes(k))add('Invite Lilah',()=>this.onInvite(h,this.pos(h)));
   if(k==='rake'&&this.character.player.getPosition().x<-6)add('Gather leaves',()=>{const p=this.character.player.getPosition(),f=this.facing();for(let i=0;i<this.leaves.length;i++)this.leaves[i].setPosition(p.x+f.x*.65+Math.sin(i*2)*.2,.08,p.z+f.z*.65+Math.cos(i*2)*.2);this.store.transact(s=>{s.leafPile=1;});});
   add('Place here',()=>this.put(h));add('Turn',()=>{this.store.transact(s=>{s.toys[h].yaw+=45;});this.items.get(h)!.entity.setLocalEulerAngles(0,this.state(h).yaw,0);});
   return;
  }
  if(!id||!t||this.cleanup.carry.item)return;
  const fixed=HOME_TOYS.find(d=>d.id===id)!.fixed;
  if(t.kind==='ball')add('Kick softly',()=>{const p=this.pos(id),a=this.character.player.getPosition(),f=p.sub(a);f.y=0;f.normalize();this.motion.set(id,{vx:f.x*3,vy:0,vz:f.z*3,time:0});});
  if(t.kind==='duck')add('Wind duck',()=>{this.animate(id,Math.min(8,t.value+2.7));const yaw=t.yaw*Math.PI/180;this.motion.set(id,{vx:Math.sin(yaw)*.28,vy:0,vz:Math.cos(yaw)*.28,time:0});});
  if(t.kind==='jack')add(t.value>=1?'Close lid':'Turn handle',()=>{this.animate(id,t.value>=1?0:Math.min(1,t.value+.18+Math.random()*.13));});
  if(t.kind==='wagon')add('Pull wagon',()=>{this.pushing=true;});
   if(t.kind==='car')add('Push car',()=>{const f=this.facing();this.motion.set(id,{vx:f.x*1.6,vy:0,vz:f.z*1.6,time:0});});
  if(t.kind==='ramp')add('Run car down ramp',()=>{const car=this.pos('car'),ramp=this.pos(id);if(car.distance(ramp)<1.1&&this.state('car').owner==='world'){const a=t.yaw*Math.PI/180;this.items.get('car')!.entity.setPosition(ramp.x,ramp.y+.24,ramp.z);this.motion.set('car',{vx:Math.sin(a)*Math.sqrt(4*(ramp.y+.24)),vy:0,vz:Math.cos(a)*Math.sqrt(4*(ramp.y+.24)),time:0});}else this.say('Place the little car beside the ramp.');});
  if(t.kind==='basin')add(this.store.data.water?'Empty basin':'Fill basin',()=>{this.store.transact(s=>{s.water=s.water?0:1;if(!s.water)for(const [key,toy]of Object.entries(s.toys))if(toy.owner==='basin'){toy.owner='world';toy.position=[5.65,.99,12.5+(key==='duck'?-.25:0)];this.motion.delete(key);}});this.burst(this.pos(id),'#aed6dd',8);});
  if(t.kind==='boat'&&t.owner==='basin')add('Blow boat',()=>{const p=this.pos(id),a=this.character.player.getPosition(),f=p.sub(a);f.y=0;f.normalize();this.motion.set(id,{vx:f.x*.3,vy:0,vz:f.z*.3,time:0});});
  if(t.kind==='pinwheel')add('Blow',()=>this.spin.set(id,9));
  if(t.kind==='cushion')add('Stand cushion',()=>this.animate(id,t.value?0:1));
  if(t.kind==='blanket')add('Drape den',()=>{const a=this.pos('cushion0'),b=this.pos('cushion1');if(a.distance(b)>.55&&a.distance(b)<1.4&&this.state('cushion0').value&&this.state('cushion1').value){this.store.place(id,[(a.x+b.x)/2,.69,(a.z+b.z)/2]);}else this.say('Stand the two play cushions nearby for the blanket.');});
  if(id==='basket')add('Gather basket toys',()=>this.gather());
  if(this.daily.lilahAvailable&&this.daily.lilahTarget.anchor.distance(this.character.player.getPosition())<4&&['teddy','duck','jack'].includes(t.kind))add('Invite Lilah',()=>this.onInvite(id,this.pos(id)));
  if(!fixed)add(t.tilt?'Right and pick up':'Pick up',()=>this.pickup(id));
  if(!fixed)add('Turn',()=>this.store.transact(s=>{s.toys[id].yaw+=45;}));
 }
 private sync(){
  for(const def of HOME_TOYS){const t=this.state(def.id),item=this.items.get(def.id)!,signature=t.kind+':'+t.marks.join(',')+':'+(t.kind==='book'?t.value:0);
   if(this.versions.get(def.id)!==signature){for(const child of [...item.entity.children])child.destroy();item.entity.addChild(this.art.make(t.kind,def.color));this.versions.set(def.id,signature);
   if(t.kind==='paper'||t.kind==='plane')for(const [i,c]of t.marks.entries())primitives(this.app,item.entity)('Crayon mark','sphere',[(i%4-1.5)*.06,.055,((i/4|0)-1.5)*.07],[.045,.003,.065],this.art.mat(['#d49aaf','#9bbbad','#e2be75','#b2a4d1'][c%4]),false);
   if(t.kind==='book'){const page=primitives(this.app,item.entity);for(let i=0;i<3;i++)page('Picture story','sphere',[(i-1)*.08,.065,Math.sin(i+t.value)*.12],[.07,.003,.07],this.art.mat(['#c69abb','#9bbbad','#e1bd79','#a8b5d3'][(i+t.value)%4]),false);}
   }
   if(t.owner==='held'){if(!this.cleanup.carry.item){this.cleanup.carry.pickUp(item);this.character.animator.setCarrying(true);}continue;}
   if(item.entity.parent!==this.root)item.entity.reparent(this.root);item.entity.setPosition(...t.position);item.entity.setEulerAngles(0,t.yaw,t.tilt||0);
  }
 }
 private burst(p:Vec3,color:string,count:number){for(let i=0;i<count&&this.effects.length<36;i++){const e=primitives(this.app,this.root)('Play splash','sphere',[p.x,p.y+.2,p.z],[.04,.04,.04],this.art.mat(color),false);this.effects.push({entity:e,life:.5+Math.random()*.35,vx:(Math.random()-.5)*.7,vz:(Math.random()-.5)*.7,vy:.6});}}
 private blow(origin?:Vec3){const p=origin??this.character.player.getPosition(),f=this.facing();for(let i=0;i<5&&this.effects.length<30;i++){const size=.055+Math.random()*.08,e=primitives(this.app,this.root)('Soap bubble','sphere',[p.x+f.x*.4,(origin?p.y+.15:1.0)+i*.05,p.z+f.z*.4],[size,size,size],this.art.mat(i%2?'#d9e9df':'#dbcce5'),false);this.effects.push({entity:e,life:2+Math.random()*3,vx:f.x*.2+.06,vz:f.z*.2,vy:.10});}}
 private savePositions(){if(!this.dirty)return;this.store.transact(s=>{for(const [id,item]of this.items){if(s.toys[id].owner!=='held')s.toys[id].position=item.entity.getPosition().toArray() as Point;}});this.dirty=false;}
 suspend(){this.pushing=false;this.returnShared();if(this.resting){this.resting=null;this.character.animator.setIdleClip('Idle');}this.savePositions();this.extraCommands=[];this.extraFocus=null;this.character.animator.setWorkClip(null);for(const e of this.effects)e.entity.destroy();this.effects=[];}
 update(dt:number,mode:string,available:boolean){
  this.sceneMode=mode;
  this.active=(mode==='cleanup'||mode==='outdoors')&&this.cleanup.mode==='day';this.allowed=this.active&&available&&!this.controller.riding;
  if(this.lastDay!==this.daily.clock.state.day){this.detachCarry();this.store.day(this.daily.clock.state.day);this.lastDay=this.daily.clock.state.day;this.sync();}
  this.root.enabled=this.active;this.controls.hidden=!this.allowed&&!this.extraCommands.length;
  if(!this.active){this.allowed=available&&mode==='recess';this.controls.hidden=!this.extraCommands.length;return;}
  const p=this.character.player.getPosition();this.clock+=dt;
  // Settle inactive regions; no per-room simulation after departure.
  if(this.allowed){this.step(Math.min(.04,dt),p);this.nextPersist-=dt;if(this.nextPersist<=0){this.safe(()=>this.savePositions());this.nextPersist=2;}}
  const held=this.held();this.nearby=HOME_TOYS.filter(d=>d.id!==held&&!['held','sunny','lilah'].includes(this.state(d.id).owner)&&Math.hypot(this.pos(d.id).x-p.x,this.pos(d.id).z-p.z)<1.25).sort((a,b)=>this.pos(a.id).distance(p)-this.pos(b.id).distance(p)).map(d=>d.id);
  if(this.manualTarget&&p.distance(this.lastSelectPosition)>.45)this.manualTarget=false;
  if(!this.nearby.includes(this.selected)&&!(this.manualTarget&&!this.selected)){const selected=this.nearby[0]??'';if(selected!==this.selected){this.selected=selected;this.commandIndex=0;}}
  this.buildCommands();this.controls.hidden=!this.allowed||(!this.allCommands.length&&!this.nearby.length);this.next.hidden=this.allCommands.length<2;const seated=this.extraCommands.some(c=>c.title==='Stand up');this.other.hidden=!seated&&(this.nearby.length<1||!!this.extraCommands.length);this.other.textContent=seated?'Stand up · R':'Select · R';
  this.cue.enabled=this.allowed&&!!this.selected;if(this.selected){const q=this.pos(this.selected);this.cue.setPosition(q.x,q.y+.006,q.z);}
  const destination=held?this.destination():null;this.preview.enabled=!!destination&&this.allowed;if(destination)this.preview.setPosition(...destination);
  this.puddle.setLocalScale(.65+this.store.data.puddle,.012,.52+this.store.data.puddle*.6);
  this.lastPlayer.copy(p);
 }
 private step(dt:number,p:Vec3){
  if(!dt)return;
  if(this.shared){const job=this.shared;job.time-=dt;this.items.get(job.id)!.entity.setPosition(job.socket.getPosition());if(job.time<1.8&&!job.burst){job.burst=true;if(job.id==='bubbles')this.blow(job.socket.getPosition());else this.burst(job.socket.getPosition(),'#e9c989',3);}if(job.time<=0||!job.person.enabled||!this.daily.lilahAvailable)this.safe(()=>this.returnShared());}
  this.wagonPlanner=new HousePath({...this.house,obstacles:this.house.obstacles.filter(b=>b!==this.wagonObstacle)},.38);
  this.goalCooldown=Math.max(0,this.goalCooldown-dt);
  if(this.fetchAfter>0){this.fetchAfter-=dt;if(this.fetchAfter<=0){this.motion.delete('fetch');const at=this.pos('fetch');if(this.onFetch('fetch',at))this.safe(()=>{this.store.transact(s=>{s.toys.fetch.owner='sunny';s.toys.fetch.position=at.toArray() as Point;});});}}
  const ball=this.pos('ball');if(this.state('ball').owner==='world'&&Math.hypot(ball.x-p.x,ball.z-p.z)<.35&&this.controller.velocity.length()>.1){const f=ball.clone().sub(p);f.y=0;f.normalize();this.motion.set('ball',{vx:f.x*.9,vy:0,vz:f.z*.9,time:0});}
  if(this.pushing){const e=this.items.get('wagon')!.entity,old=e.getPosition().clone(),f=this.facing(),target=p.clone().sub(f.mulScalar(.8)),q=new Vec3().lerp(old,target,Math.min(1,dt*1.8/Math.max(.001,old.distance(target))));if(this.wagonPlanner.line(old,q)){e.setPosition(q.x,.08,q.z);e.setEulerAngles(0,this.character.visual.getEulerAngles().y,0);this.dirty=true;for(const wheel of e.find(n=>n.name==='Wheel'))(wheel as Entity).rotateLocal(0,0,this.controller.velocity.length()*dt*240);}if(old.distance(p)>2){this.pushing=false;this.say('The wagon stopped here. You can pull it back out.');}this.character.animator.setWorkClip(this.controller.velocity.length()>.1?'CarryWalk':'CarryIdle');}
  for(const [id,m]of this.motion){const e=this.items.get(id)!.entity,t=this.state(id),q=e.getPosition().clone();if(q.distance(p)>12||t.owner==='held'){this.motion.delete(id);continue;}m.time+=dt;
   const floating=t.owner==='basin';if(floating){const basin=this.pos('basin');if(Math.abs(q.x+m.vx*dt-basin.x)>.28)m.vx*=-.8;if(Math.abs(q.z+m.vz*dt-basin.z)>.20)m.vz*=-.8;q.x+=m.vx*dt;q.z+=m.vz*dt;}
   else {const nx=q.x+m.vx*dt,nz=q.z+m.vz*dt;if(this.planner.free(nx,q.z))q.x=nx;else m.vx*=-.6;if(this.planner.free(q.x,nz))q.z=nz;else m.vz*=-.6;
    if(q.y>.081||m.vy>0){m.vy-=dt*(t.kind==='plane'?1.25:5);q.y=Math.max(.08,q.y+m.vy*dt);if(q.y===.08)m.vy=0;}
   }
   const friction=floating?.7:t.kind==='duck'?0:q.y>.1?(t.kind==='plane'?.13:.2):Math.abs(q.x)<2&&q.z>5&&q.z<7.5?2.8:1.3;
   m.vx*=Math.exp(-friction*dt);m.vz*=Math.exp(-friction*dt);e.setPosition(q);this.dirty=true;
   if(t.kind==='duck'){e.findByName('Key')?.setLocalEulerAngles(0,0,this.clock*360);e.setEulerAngles(0,t.yaw,Math.sin(this.clock*12)*5);if(m.time>t.value||floating)this.motion.delete(id);}
   if(t.kind==='ball'){
    const a=this.pos('marker0'),b=this.pos('marker1'),vx=b.x-a.x,vz=b.z-a.z,len=vx*vx+vz*vz,u=((q.x-a.x)*vx+(q.z-a.z)*vz)/len;
    if(len>.3&&u>0&&u<1&&Math.abs((q.x-a.x)*vz-(q.z-a.z)*vx)/Math.sqrt(len)<.16&&this.goalCooldown<=0){this.burst(a,'#e9cc8a',3);this.burst(b,'#e9cc8a',3);this.goalCooldown=2;}
    for(const leaf of this.leaves){const l=leaf.getPosition();if(Math.hypot(l.x-q.x,l.z-q.z)<.3){leaf.setPosition(l.x+m.vx*.12,.08,l.z+m.vz*.12);leaf.rotateLocal(0,30,0);}}
   }
   for(const [other,item]of this.items){if(other===id||this.state(other).owner==='held')continue;const a=item.entity.getPosition();if(Math.hypot(q.x-a.x,q.z-a.z)>.23||Math.abs(q.y-a.y)>.32)continue;const k=this.state(other).kind;
    if(['cup','block'].includes(k)){const dx=a.x-q.x,dy=a.y-q.y,dz=a.z-q.z,d=Math.max(.01,Math.hypot(dx,dy,dz)),impact=Math.max(0,(m.vx*dx+m.vy*dy+m.vz*dz)/d),tilt=Math.max(this.state(other).tilt||0,impact>1?78:24);item.entity.setEulerAngles(0,this.state(other).yaw,tilt);this.state(other).tilt=tilt;this.motion.set(other,{vx:m.vx*.45,vy:.2,vz:m.vz*.45,time:0});this.state(other).owner='world';}
    if(k==='flamingo')this.spin.set(other,1);
    if(k==='cushion'){m.vx*=.8;m.vz*=.8;}
   }
   if(m.time>10||Math.hypot(m.vx,m.vz)<.035&&q.y<=.081)this.motion.delete(id);
  }
  for(const [id,item]of this.items){const t=this.state(id),e=item.entity;
   if(this.items.has(t.owner)){const parent=this.pos(t.owner),offset=Object.keys(this.store.data.toys).filter(k=>this.state(k).owner===t.owner).indexOf(id);
    if(t.owner==='basin'&&this.motion.has(id))continue;
    const height=t.owner==='wagon'?.25:t.owner==='flamingo'?.95:t.owner==='teddy'?(t.kind==='hat'?.54:.22):t.owner.startsWith('block')?.22:t.owner.startsWith('cup')?.17:t.owner.startsWith('cushion')?.32:t.owner==='sofa'||t.owner==='board'||t.owner==='desk-surface'?0:t.owner==='toy-bed'?.08:.16;
    e.setPosition(parent.x+(t.owner==='wagon'?(offset%2-.5)*.22:0),parent.y+height,parent.z+(t.owner==='wagon'?(Math.floor(offset/2)-.5)*.24:t.owner==='board'?.04:0));if(t.owner==='board')e.setEulerAngles(90,0,0);
   }
   if(t.kind==='cushion')e.setEulerAngles(t.value?75:0,t.yaw,0);
   if(t.kind==='teddy'&&t.value)e.setEulerAngles(Math.sin(this.clock*4)*(t.value===2?9:4),t.yaw,0);
   if(t.kind==='jack'){const jack=e.findByName('Surprise');if(jack){jack.enabled=t.value>=1;jack.setLocalPosition(0,.5+Math.sin(this.clock*8)*.03,0);}e.findByName('Lid')?.setLocalEulerAngles(t.value>=1?-110:0,0,0);e.findByName('Crank')?.setLocalEulerAngles(t.value*1080,0,0);}
   if(t.kind==='basin'){const water=e.findByName('Water');if(water)water.enabled=!!this.store.data.water;}
   if(t.kind==='flower')e.findByName('Stem')?.setLocalEulerAngles(0,0,t.value?0:16);
   if(t.kind==='cup'){const top=e.findByName('Inside') as Entity;if(top)top.setLocalPosition(0,t.value?.175:.171,0);}
   if(t.kind==='pitcher'&&(this.spin.get(id)||0)>0){const v=this.spin.get(id)!;e.setLocalEulerAngles(0,0,Math.sin(v*Math.PI)*-45);this.spin.set(id,Math.max(0,v-dt));}
   if(t.kind==='pinwheel'){let speed=this.spin.get(id)||0;if(t.owner==='held')speed=Math.max(speed,this.controller.velocity.length()*3);speed*=Math.exp(-dt*.8);this.spin.set(id,speed);(e.findByName('Rotor') as Entity)?.rotateLocal(0,0,speed*dt*100);}
   if(t.kind==='flamingo'&&(this.spin.get(id)||0)>0){const a=this.spin.get(id)!;e.setEulerAngles(0,0,Math.sin(this.clock*12)*a*8);this.spin.set(id,Math.max(0,a-dt));}
  }
  this.effectClock-=dt;
  const jumping=['PlayJump','JourneyJump'].includes(this.character.animator.actionName??'');
  if(jumping&&!this.jumpEffect){if(Math.hypot(p.x+5,p.z-5.6)<.7)this.burst(new Vec3(p.x,.09,p.z),'#b5d8df',14);for(const leaf of this.leaves){const q=leaf.getPosition();if(Math.hypot(q.x-p.x,q.z-p.z)<1)leaf.setPosition(q.x+(q.x-p.x)*.9,.08,q.z+(q.z-p.z)*.9);}}this.jumpEffect=jumping;
  if(this.effectClock<=0&&this.controller.velocity.length()>.15){
   if(Math.hypot(p.x+5,p.z-5.6)<.5+this.store.data.puddle*.4){this.burst(new Vec3(p.x,.08,p.z),'#bedde2',this.controller.velocity.length()>1?7:3);this.effectClock=.25;this.spin.set('wet-feet',3);this.audio.tone(this.controller.velocity.length()>1?170:260,.10,'sine',.5);}
   else if((this.spin.get('wet-feet')||0)>0&&this.effects.length<30){const e=primitives(this.app,this.root)('Fading wet footprint','sphere',[p.x,.077,p.z],[.09,.006,.18],this.art.mat('#b0c3bc'),false);e.setEulerAngles(0,this.character.visual.getEulerAngles().y,0);this.effects.push({entity:e,life:2.5,vx:0,vz:0,vy:0});this.effectClock=.35;this.spin.set('wet-feet',this.spin.get('wet-feet')!-.35);}
   for(const leaf of this.leaves){const q=leaf.getPosition();if(Math.hypot(q.x-p.x,q.z-p.z)<.5){leaf.setPosition(q.x+(q.x-p.x)*.4,.08,q.z+(q.z-p.z)*.4);leaf.rotateLocal(0,35,0);}}
  }
  for(let i=this.effects.length-1;i>=0;i--){const fx=this.effects[i],q=fx.entity.getPosition();fx.life-=dt;const bubble=fx.entity.name==='Soap bubble';if(fx.life<=0||bubble&&(Math.hypot(q.x-p.x,q.z-p.z)<.2||!this.planner.free(q.x,q.z))){fx.entity.destroy();this.effects.splice(i,1);}else {fx.entity.setPosition(q.x+fx.vx*dt,q.y+fx.vy*dt,q.z+fx.vz*dt);if(fx.entity.name==='Fading wet footprint'){const s=Math.min(1,fx.life);fx.entity.setLocalScale(.09*s,.006,.18*s);}}}
 }
 paintHUD(){const seated=this.extraCommands.some(c=>c.title==='Stand up');this.controls.hidden=!this.allowed||(!this.allCommands.length&&!this.nearby.length);this.next.hidden=this.allCommands.length<2;this.other.hidden=!seated&&(this.nearby.length<1||!!this.extraCommands.length);this.other.textContent=seated?'Stand up · R':'Select · R';const jump=document.querySelector<HTMLElement>('#journey-jump');if(jump){this.jumpParent??=jump.parentElement;if(this.sceneMode==='outdoors'&&!this.controls.hidden){if(jump.parentElement!==this.controls)this.controls.append(jump);this.next.textContent='More';this.other.textContent='Select';jump.textContent='Jump';}else if(jump.parentElement===this.controls)this.jumpParent!.append(jump);}const f=this.focus;if(!f)return false;const player=this.character.player.getPosition();this.camera.beginChore(player,this.selected?this.pos(this.selected):player);const b=document.querySelector<HTMLButtonElement>('#action-button')!;b.dataset.target='home-play';b.disabled=!f.enabled;document.querySelector('#action-title')!.textContent=f.title;document.querySelector('#action-detail')!.textContent=f.detail;document.querySelector('#action-icon')!.textContent=f.icon;b.setAttribute('aria-label',f.title+': '+f.detail);return true;}
 snapshot(){return{active:this.active,selected:this.selected,focus:this.focus,commands:this.allCommands.map(c=>c.title),held:this.store.held,pushing:this.pushing,moving:this.motion.size,effects:this.effects.length,state:this.store.data,objects:[...this.items].map(([id,item])=>({id,position:item.entity.getPosition().toArray()}))};}
 destroy(){this.suspend();const index=this.house.obstacles.indexOf(this.wagonObstacle);if(index>=0)this.house.obstacles.splice(index,1);this.abort.abort();this.controls.remove();this.root.destroy();this.art.destroy();this.audio.destroy();}
}
