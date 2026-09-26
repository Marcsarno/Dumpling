import {BoundingBox,Entity,Quat,Vec3,type Application} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
import {PLAY_SPOTS} from './Neighborhood';
import {leaseContainer} from './ContainerLease';
import {classroomSign} from './Classmates';
import {DailyPlayStore} from '../systems/DailyPlayStore';
import {playDefinition,type PlayId} from '../data/dailyPlay';
import {stepToy,touchesCircle,type PlayBody} from '../systems/PlayPhysics';
import {PlayAudio} from '../ui/PlayAudio';
import type {IsometricCamera} from './IsometricCamera';

type Part={entity:Entity;p:Vec3;q:Quat};
type Station={id:PlayId;index:number;root:Entity;lease:ReturnType<typeof leaseContainer>;parts:Map<string,Part>;ready:boolean;error:string;time:number;phase:string;clock:number;count:number;bits:number;body:PlayBody|null;fallen:number[];bubblePopped:Set<number>;lastPuddle:number;cartBox:BoundingBox|null;solids:BoundingBox[]};
type Holding={station:Station;part:Part;name:string};
const goalCopy:Record<PlayId,string>={goal:'GOOOAL! The tiny crowd goes wild!',bowling:'A very wobbly strike!',cans:'Clatter, rattle, tumble!',cart:'Special delivery… a bouncing surprise!',boat:'Captain Paperboat is off on a tiny voyage.',duck:'One duck… two ducks… a whole waddle parade!',bubbles:'Pop! Even the last bubble got a giggle.',flower:'A-a-a-CHOO! That is one happy flower.',pinwheel:'Whoosh! A little wind makes a big whirl.',jack:'Surprise! It is a very springy frog.',puddles:'Splish, splash… you made a puddle song!',leaves:'HONK! A duck was hiding in the leaves.',plane:'Three hoops! A perfect paper delivery.',flamingo:'A splendid hat. A very polite bow.',picnic:'Teddy says: thank you, chef!'};

/** Five small, independently leased playgrounds. Nothing changes the character
 * skeleton or the established chores, allowance, fishing, or collectible saves. */
export class DailyPlay {
 readonly save=new DailyPlayStore();
 private stations=new Map<number,Station>();
 private holding:Holding|null=null;
 private pushing:Station|null=null;
 private active=false;
 private available=false;
 private pending=false;
 private actionStation:Station|null=null;
 private framed=false;
 private audio=new PlayAudio();
 private journal=document.createElement('dialog');
 private button=document.createElement('button');
 private drop=document.createElement('button');
 private selected:Station|null=null;
 private abort=new AbortController();
 private staticBoxes:BoundingBox[]=[];
 constructor(private app:Application,private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private camera:IsometricCamera,private say:(copy:string)=>void){
  this.button.id='daily-play-open';this.button.className='journey-button';this.button.textContent='Today’s play';this.button.hidden=true;this.button.onclick=()=>{this.audio.unlock();this.renderJournal();this.controller.reset();this.journal.showModal();this.journal.scrollTop=0;this.journal.querySelector('h2')!.focus({preventScroll:true});};
  this.drop.id='daily-play-drop';this.drop.className='journey-button';this.drop.textContent='Put back';this.drop.hidden=true;this.drop.onclick=()=>this.putBack();
  this.journal.id='daily-play-journal';this.journal.setAttribute('aria-label','Today’s play');this.journal.className='daily-play-journal';
  document.querySelector('#game')!.append(this.button,this.drop,this.journal);
  this.journal.addEventListener('close',()=>this.controller.reset(),{signal:this.abort.signal});
  app.on('prerender',this.attachHeld,this);
 }
 get busy(){return this.pending||this.journal.open||!!this.character.animator.busy;}
 get occupied(){return this.pending||!!this.holding||!!this.pushing||this.journal.open;}
 get carrying(){return !!this.holding;}
 get movementLocked(){return this.journal.open||this.holding?.station.phase==='watering'||this.character.animator.busy&&!['JourneyJump','PlayJump'].includes(this.character.animator.actionName??'');}
 private renderJournal(){
  this.journal.replaceChildren();const back=document.createElement('button');back.className='daily-play-close';back.textContent='×';back.setAttribute('aria-label','Close today’s play');back.onclick=()=>this.journal.close();
  const h=document.createElement('h2');h.textContent='Five little adventures';h.tabIndex=-1;const intro=document.createElement('p');intro.textContent='Today on Maple Lane. Follow the street left from the school path. Play in any order, and play again whenever you like.';this.journal.append(back,h,intro);
  for(const [i,id] of this.save.data.ids.entries()){const def=playDefinition(id),card=document.createElement('div');card.className='daily-play-card';const title=document.createElement('strong');title.textContent=`${this.save.progress(id).done?'✓':def.icon} ${def.name}`;const hint=document.createElement('p');hint.textContent=def.hint;const distance=document.createElement('small');distance.textContent=`Little garden ${i+1} · ${Math.round(Math.abs(this.character.player.getPosition().x-PLAY_SPOTS[i].x))} steps along the lane`;card.append(title,hint,distance);this.journal.append(card);}
  const close=document.createElement('button');close.textContent='Let’s play';close.onclick=()=>this.journal.close();this.journal.append(close);
 }
 update(dt:number,outside:boolean,available:boolean,day:number){
  if(this.save.ensure(day)){this.leave();for(const s of this.stations.values())this.remove(s);this.stations.clear();}
  this.active=outside&&!this.controller.riding;this.available=available&&!this.journal.open;
  if(!this.character.animator.busy)this.actionStation=null;
  this.button.hidden=!this.active||!available;this.button.textContent=`✿ Today’s play · ${this.save.data.ids.filter(id=>this.save.progress(id).done).length}/5`;
  if(!this.active){this.leave();for(const s of this.stations.values())this.remove(s);this.stations.clear();this.selected=null;return;}
  const p=this.character.player.getPosition();
  for(const [i,id] of this.save.data.ids.entries()){
   const spot=PLAY_SPOTS[i],d=Math.hypot(spot.x-p.x,spot.z-p.z);
   if(d<20&&!this.stations.has(i))this.stations.set(i,this.create(id,i));
   if(d>26&&this.stations.has(i)){const s=this.stations.get(i)!;if(this.holding?.station===s||this.pushing===s)this.putBack();this.remove(s);this.stations.delete(i);}
  }
  this.staticBoxes=[];
  for(const s of this.stations.values())if(s.ready){
   this.staticBoxes.push(...s.solids);if(s.cartBox)this.staticBoxes.push(s.cartBox);
   if(this.available&&dt>0)this.tick(s,Math.min(dt,.04));
  }
  this.controller.dynamicObstacles=this.staticBoxes;this.controller.moveContact=this.contact;
  this.selected=this.holding?.station??this.pushing??[...this.stations.values()].filter(s=>s.ready&&this.distance(s,p)<3.3).sort((a,b)=>this.distance(a,p)-this.distance(b,p))[0]??null;
  this.drop.hidden=!available||(!this.holding&&!this.pushing);
  this.drop.textContent=this.pushing?'Let go':'Put back';
  if(this.selected&&this.available){this.camera.beginChore(p,this.world(this.selected));this.framed=true;}
  else if(this.framed){this.camera.endChore();this.framed=false;}
  if(this.pushing)this.character.animator.setWorkClip(this.controller.velocity.length()>.02?'CarryWalk':'CarryIdle',this.part(this.pushing,'Cart').entity.getPosition());
 }
 private distance(s:Station,p:Vec3){return Math.hypot(p.x-PLAY_SPOTS[s.index].x,p.z-PLAY_SPOTS[s.index].z);}
 private world(s:Station,x=0,y=.075,z=0){const p=PLAY_SPOTS[s.index];return new Vec3(p.x+x,y,p.z+z);}
 private localPlayer(s:Station){const p=this.character.player.getPosition(),spot=PLAY_SPOTS[s.index];return{x:p.x-spot.x,z:p.z-spot.z};}
 private part(s:Station,name:string){const p=s.parts.get(name);if(!p)throw Error('Missing toy part '+s.id+'/'+name);return p;}
 private create(id:PlayId,index:number):Station{
  const root=new Entity('Daily play '+id,this.app);this.app.root.addChild(root);root.setPosition(PLAY_SPOTS[index].x,.075,PLAY_SPOTS[index].z);
  const lease=leaseContainer(this.app,assetUrl('assets/outdoors/play-'+id+'.glb'),'Daily toy '+id);
  const s:Station={id,index,root,lease,parts:new Map(),ready:false,error:'',time:0,phase:'ready',clock:0,count:0,bits:0,body:null,fallen:[],bubblePopped:new Set(),lastPuddle:-1,cartBox:null,solids:[]};
  void lease.ready.then(resource=>{
   if(!root.enabled)return;const model=resource.instantiateRenderEntity({castShadows:true});root.addChild(model);
   const visit=(e:Entity)=>{s.parts.set(e.name,{entity:e,p:e.getLocalPosition().clone(),q:e.getLocalRotation().clone()});for(const child of e.children)visit(child as Entity);};visit(model);
   classroomSign(this.app,root,'Play garden label',`${index+1} · ${playDefinition(id).name}`, [0,.48,2.12],2.15,.32);
   this.resetStation(s);s.ready=true;
  }).catch(error=>{s.error=String(error);console.error('Daily play prop load',error);});return s;
 }
 private solid(s:Station,x:number,z:number,hx:number,hz:number){const b=new BoundingBox(this.world(s,x,.5,z),new Vec3(hx,1,hz));s.solids.push(b);return b;}
 private resetStation(s:Station){
  for(const p of s.parts.values()){p.entity.setLocalPosition(p.p);p.entity.setLocalRotation(p.q);p.entity.enabled=true;}
  s.time=0;s.clock=0;s.phase='ready';s.count=0;s.bits=0;s.body=null;s.fallen=[];s.bubblePopped.clear();s.lastPuddle=-1;s.solids=[];s.cartBox=null;
  if(s.id==='goal'||s.id==='bowling'){const p=this.part(s,'Ball').p;s.body={x:p.x,y:p.y,z:p.z,vx:0,vy:0,vz:0,radius:s.id==='goal'?.19:.17};}
  if(s.id==='duck')for(let i=0;i<3;i++)this.part(s,'Duckling'+i).entity.enabled=false;
  if(s.id==='bubbles')for(let i=0;i<10;i++)this.part(s,'Bubble'+i).entity.enabled=false;
  if(s.id==='jack'){this.part(s,'Frog').entity.enabled=false;this.solid(s,0,0,.34,.29);}
  if(s.id==='leaves')this.part(s,'HiddenDuck').entity.enabled=false;
  if(s.id==='flower'){this.part(s,'Flower').entity.setLocalEulerAngles(0,0,48);for(let i=0;i<8;i++)this.part(s,'Droplet'+i).entity.enabled=false;this.solid(s,0,-.45,.30,.30);this.solid(s,1.3,.65,.33,.28);}
  if(s.id==='cans'){this.solid(s,0,-.8,.68,.33);this.solid(s,-1,.85,.33,.28);}
  if(s.id==='boat'){this.solid(s,0,-.35,.78,1.22);this.solid(s,1.45,.8,.33,.28);}
  if(s.id==='plane')this.solid(s,1.3,.85,.33,.28);
  if(s.id==='flamingo'){this.solid(s,-1,.75,.33,.28);this.solid(s,.45,-.6,.32,.32);}
  if(s.id==='bubbles')this.solid(s,0,.65,.33,.28);
  if(s.id==='cart'){s.cartBox=new BoundingBox(this.world(s,0,.5,.6),new Vec3(.40,1,.40));this.part(s,'Surprise').entity.enabled=false;}
  // Multi-step progress survives reloading, but carried props always begin safely on their stand.
  if(['duck','pinwheel','jack','picnic'].includes(s.id)&&!this.save.progress(s.id).done)s.count=this.save.progress(s.id).step;
  if(s.id==='picnic')for(let i=0;i<s.count;i++)this.part(s,'Treat'+i).entity.setLocalPosition(...this.plate(i));
  if(s.id==='puddles'&&!this.save.progress(s.id).done)s.bits=this.save.progress(s.id).step;
 }
 private plate(i:number):[number,number,number]{return[[-.55,.14,-.1],[.55,.14,-.1],[0,.14,.55]][i] as [number,number,number];}
 private target(s:Station):{point:Vec3;verb:string;clip:string;hint:string}{
  const def=playDefinition(s.id),p=(n:string)=>this.part(s,n).entity.getPosition().clone();
  if(this.pushing===s)return{point:p('Cart'),verb:'Let go',clip:'',hint:'Push toward the yellow outline.'};
  if(s.phase==='finished')return{point:this.world(s,0,.09,1.45),verb:'Play again',clip:'',hint:def.name};
  if(this.holding?.station===s){
   const mapping:Partial<Record<PlayId,[Vec3,string,string,string]>>={cans:[this.world(s,0,.7,-.8),'Toss','PlayThrow','Aim the beanbag at the cans.'],boat:[this.world(s,1.05,.3,-.5),'Launch','PlayInteract','Float the boat in the little trough.'],flower:[this.world(s,.55,.9,-.3),'Water','PlayUse','A drink for the droopy flower.'],plane:[this.world(s,0,.8,1.05),'Throw','PlayThrow','Send it through the three hoops.'],flamingo:[this.world(s,.45,1.48,-.6),'Dress up','PlayInteract','A hat for a very fancy bird.'],picnic:[this.world(s,...this.plate(Math.min(2,s.count))),'Serve','PlayInteract','Teddy is waiting at the picnic blanket.']};
   const v=mapping[s.id]!;return{point:v[0],verb:v[1],clip:v[2],hint:v[3]};
  }
  const names:Partial<Record<PlayId,string>>={goal:'Ball',bowling:'Ball',cans:'Beanbag',cart:'Cart',boat:'Boat',duck:'Key',bubbles:'Bottle',flower:'Can',pinwheel:'Wheel',jack:'Crank',plane:'Plane',flamingo:'Hat',picnic:'Treat'+Math.min(2,s.count)};
  const name=names[s.id],point=name?p(name):this.world(s,0,.09,0);if(s.id==='cart'){point.z+=.55;point.y=.85;}return{point,verb:def.verb,clip:['cans','boat','flower','plane','flamingo','picnic'].includes(s.id)?'PlayInteract':def.clip,hint:def.hint};
 }
 get focus(){
  const s=this.selected;if(!s||!this.active||!this.available)return null;const t=this.target(s);
  const inProgress=!['ready','finished','bubbles'].includes(s.phase)&&this.pushing!==s;
  return{title:inProgress?'Watch…':t.verb,detail:inProgress?playDefinition(s.id).name:t.hint,icon:playDefinition(s.id).icon,enabled:!inProgress&&!this.busy,id:s.id};
 }
 press(){
  const s=this.selected;if(!s||!this.focus?.enabled)return;this.audio.unlock();
  if(this.pushing===s){this.putBack();return;}
  if(s.phase==='finished'){this.resetStation(s);this.say('Ready for another go!');return;}
  if(s.id==='bubbles'&&s.phase==='bubbles'){const p=this.localPlayer(s),near=[...s.parts.entries()].find(([name,part])=>name.startsWith('Bubble')&&part.entity.enabled&&Math.hypot(part.entity.getLocalPosition().x-p.x,part.entity.getLocalPosition().z-p.z)<1.2);if(near)this.popBubble(s,Number(near[0].slice(6)));else this.say('Walk into a floating bubble. Pop!');return;}
  const t=this.target(s),player=this.character.player.getPosition();
  const act=()=>{this.pending=false;if(!this.active||!s.root.enabled)return;this.controller.reset();this.actionStation=s;this.character.animator.playAction(t.clip||'PlayInteract',1.3,()=>{if(this.active&&s.root.enabled)this.commit(s);},t.point);};
  const distance=Math.hypot(player.x-t.point.x,player.z-t.point.z);
  // Delivering a beanbag needs throwing distance; other props require contact.
  const reach=this.holding?.station===s&&s.id==='cans'?2.4:s.id==='leaves'||s.id==='puddles'?.65:.85;
  if(distance>reach){this.pending=true;this.controller.approachProp(t.point,act,()=>{this.pending=false;this.say('Come a little closer to '+playDefinition(s.id).name.toLowerCase()+'.');});}
  else act();
 }
 private commit(s:Station){
  const held=this.holding?.station===s?this.holding:null;
  if(held){this.holding=null;this.character.animator.setCarrying(false);s.clock=0;
   if(s.id==='cans'){const pos=held.part.entity.getLocalPosition();s.body={x:pos.x,y:pos.y,z:pos.z,vx:-pos.x*2.4,vy:3.3,vz:(-.8-pos.z)*2.4,radius:.11};s.phase='toss';}
   if(s.id==='boat'){held.part.entity.setLocalPosition(0,.37,.55);s.phase='sailing';}
   if(s.id==='flower'){this.holding=held;this.character.animator.setCarrying(true);s.phase='watering';}
   if(s.id==='plane'){held.part.entity.setLocalPosition(0,.85,1.05);s.phase='flying';}
   if(s.id==='flamingo'){held.part.entity.setLocalPosition(.48,1.48,-.53);s.phase='bowing';}
   if(s.id==='picnic'){held.part.entity.setLocalPosition(...this.plate(s.count));s.count++;this.progress(s,s.count);this.audio.pop();if(s.count===3){s.phase='picnic';} }
   return;
  }
  const pick:Partial<Record<PlayId,string>>={cans:'Beanbag',boat:'Boat',flower:'Can',plane:'Plane',flamingo:'Hat',picnic:'Treat'+s.count};
  if(pick[s.id]){this.holding={station:s,part:this.part(s,pick[s.id]!),name:pick[s.id]!};this.character.animator.setCarrying(true);this.character.animator.setCarryPace('walk');this.say(this.target(s).hint);return;}
  if(s.id==='goal'||s.id==='bowling'){
   const b=s.body!,p=this.localPlayer(s),targetZ=s.id==='goal'?-1.60:-1.30,speed=s.id==='goal'?3.8:4.2,d=Math.hypot(b.x,b.z-targetZ),from=Math.max(.01,Math.hypot(b.x-p.x,b.z-p.z)),ux=(b.x-p.x)/from,uz=(b.z-p.z)/from,gx=-b.x/d,gz=(targetZ-b.z)/d,assist=ux*gx+uz*gz>.5?.8:0;
   b.vx=(ux*(1-assist)+gx*assist)*speed;b.vz=(uz*(1-assist)+gz*assist)*speed;b.vy=s.id==='goal'?.65:0;s.phase='rolling';s.clock=0;this.audio.tone(180,.13,'triangle',.5);
  }else if(s.id==='cart'){this.pushing=s;this.character.animator.setWorkClip('CarryIdle',this.part(s,'Cart').entity.getPosition());this.say('Hands on the handle. Push the trolley into the yellow outline.');}
  else if(['duck','jack','pinwheel'].includes(s.id)){s.count++;this.progress(s,s.count);this.audio.tone(320+s.count*80,.13,'triangle',1.2);s.clock=0;if(s.count>=3)s.phase=s.id==='duck'?'parade':s.id==='jack'?'surprise':'spinning';else this.say(['One little turn…','One more…'][s.count-1]);}
  else if(s.id==='bubbles'){s.phase='bubbles';s.clock=0;for(let i=0;i<10;i++)this.part(s,'Bubble'+i).entity.enabled=true;this.say('Walk into the bubbles to pop them!');}
  else if(s.id==='leaves'){s.phase='burst';s.clock=0;this.part(s,'HiddenDuck').entity.enabled=true;this.audio.honk();}
  else if(s.id==='puddles'){const p=this.localPlayer(s);let best=0,d=Infinity;for(let i=0;i<4;i++){const q=this.part(s,'Puddle'+i).p,n=Math.hypot(p.x-q.x,p.z-q.z);if(n<d){d=n;best=i;}}this.splash(s,best);}
 }
 private progress(s:Station,n:number){this.save.update(s.id,n);if(this.save.problem)this.say(this.save.problem);}
 private complete(s:Station){if(s.phase==='finished')return;s.phase='finished';this.save.update(s.id,s.count,true);this.audio.win();this.say(this.save.problem||goalCopy[s.id]);}
 private attachHeld(){
  if(!this.holding)return;const model=this.character.player.findComponents('anim')[0]?.entity;if(!model)return;
  const l=model.findByName('LeftHand'),r=model.findByName('RightHand');if(!l||!r)return;
  const position=new Vec3().add2(l.getPosition(),r.getPosition()).mulScalar(.5),forward=this.character.visual.getWorldTransform().transformVector(new Vec3(0,0,.055));position.add(forward);
  this.holding.part.entity.setPosition(position);this.holding.part.entity.setRotation(this.character.visual.getRotation());
  if(this.holding.station.phase==='watering')this.holding.part.entity.rotateLocal(0,0,-30);
 }
 private putBack(){
  if(!this.holding&&!this.pushing){this.drop.hidden=true;return;}
  if(this.holding){const {part,station}=this.holding;part.entity.setLocalPosition(part.p);part.entity.setLocalRotation(part.q);if(station.phase==='watering')this.resetStation(station);this.holding=null;}
  if(this.pushing){this.pushing=null;this.character.animator.setWorkClip(null);}
  this.character.animator.setCarrying(false);this.drop.hidden=true;
 }
 private contact=(x:number,z:number,dx:number,dz:number)=>{
  const s=this.pushing;if(!s?.cartBox||!this.available)return;const box=s.cartBox;
  if(Math.abs(x+dx-box.center.x)>box.halfExtents.x+.26||Math.abs(z+dz-box.center.z)>box.halfExtents.z+.26)return;
  // The handle is at the front. No telekinetic sideways movement or walking through it.
  if(z<box.center.z+.18||dz>0)return;
  const cart=this.part(s,'Cart').entity,p=cart.getLocalPosition().clone();
  p.x=Math.max(-1.7,Math.min(1.7,p.x+dx*.72));if(dz<0&&Math.abs(p.x)<.65)p.x*=.96;
  p.z=Math.max(-1.6,Math.min(1.6,p.z+dz*.72));cart.setLocalPosition(p);box.center.copy(cart.getPosition());
 };
 private splash(s:Station,i:number){
  this.audio.tone([262,330,392,523][i],.4,'sine',1);s.bits|=1<<i;s.lastPuddle=i;s.clock=0;this.progress(s,s.bits);
  if(s.bits===15)this.complete(s);
 }
 private popBubble(s:Station,i:number){if(s.bubblePopped.has(i))return;s.bubblePopped.add(i);this.part(s,'Bubble'+i).entity.enabled=false;this.audio.pop();if(s.bubblePopped.size>=6)this.complete(s);}
 private tick(s:Station,dt:number){
  s.time+=dt;s.clock+=dt;const t=s.clock,p=this.localPlayer(s),part=(n:string)=>this.part(s,n).entity;
  if(s.body){
   const b=s.body,oldX=b.x,oldZ=b.z;stepToy(b,dt,0);const e=part(s.id==='cans'?'Beanbag':'Ball');e.setLocalPosition(b.x,b.y,b.z);e.rotateLocal((b.z-oldZ)*180/Math.PI/b.radius,0,-(b.x-oldX)*180/Math.PI/b.radius);
   if(s.id==='goal'&&s.phase==='rolling'&&Math.abs(b.x)<.7&&b.z<-1.3){b.vx=0;b.vz=0;this.complete(s);}
   if(s.id==='bowling'&&s.phase==='rolling')for(let i=0;i<6;i++){const pin=this.part(s,'Pin'+i);if(!s.fallen.includes(i)&&touchesCircle(b,pin.p,.40)){s.fallen.push(i);this.audio.tone(170+i*35,.18,'triangle',.45);b.vx*=.8;b.vz*=.9;}}
   if(s.id==='cans'&&s.phase==='toss')for(let i=0;i<6;i++){const can=this.part(s,'Can'+i);if(!s.fallen.includes(i)&&Math.hypot(b.x-can.p.x,b.y-can.p.y,b.z-can.p.z)<.38){for(let j=0;j<6;j++)if(!s.fallen.includes(j))s.fallen.push(j);s.clock=0;b.vz*=-.35;b.vy=1;this.audio.tone(580,.4,'triangle',.2);}}
   if(s.id==='bowling'&&s.fallen.length){for(let i=0;i<6;i++)if(!s.fallen.includes(i)&&s.fallen.some(j=>this.part(s,'Pin'+i).p.distance(this.part(s,'Pin'+j).p)<.55)){s.fallen.push(i);this.audio.tone(240,.12,'triangle',.6);}}
   if(['bowling','cans'].includes(s.id)){for(const i of s.fallen){const e=part((s.id==='bowling'?'Pin':'Can')+i),q=e.getLocalEulerAngles();e.setLocalEulerAngles(Math.max(-86,q.x-dt*190),0,(i%2?1:-1)*12);if(s.id==='cans'){const start=this.part(s,'Can'+i).p;const f=Math.min(1,s.clock*.8);e.setLocalPosition(start.x+(i%2?1:-1)*.6*f,Math.max(.14,start.y*(1-f)+.14*f+Math.sin(f*Math.PI)*.35),start.z+(.75+i*.045)*f);}}if(s.fallen.length===6&&t>1.8)this.complete(s);}
   if(['rolling','toss'].includes(s.phase)&&t>5){s.phase='ready';this.say('Another go? The ball is ready.');if(s.id==='cans')this.resetStation(s);}
   // A soft nudge is available outside the scripted kick, with honest momentum.
   if(s.phase==='ready'&&!this.holding&&touchesCircle(p,b,.40)&&this.controller.velocity.length()>.05){b.vx=this.controller.velocity.x*.7;b.vz=this.controller.velocity.z*.7;}
  }
  if(s.id==='cart'){
   if(this.pushing===s&&this.distance(s,this.character.player.getPosition())>3.8)this.putBack();
   const c=part('Cart').getLocalPosition();if(s.phase==='ready'&&Math.abs(c.x)<.32&&Math.abs(c.z+1.1)<.28){this.putBack();part('Surprise').enabled=true;s.phase='delivery';s.clock=0;this.audio.honk();}
   if(s.phase==='delivery'){part('Surprise').setLocalPosition(c.x,.85+Math.abs(Math.sin(t*5))*.5,c.z);if(t>2)this.complete(s);}
  }
  if(s.id==='boat'&&s.phase==='sailing'){const a=Math.min(t/5,1)*Math.PI*2;part('Boat').setLocalPosition(Math.sin(a)*.43,.37+Math.sin(t*4)*.014,.55-Math.sin(a/2)*1.7);part('Boat').setLocalEulerAngles(0,a*180/Math.PI,Math.sin(t*3)*5);if(t>5)this.complete(s);}
  if(s.id==='duck'){
   part('Key').setLocalEulerAngles(s.count*120+(s.phase==='parade'?t*240:0),0,0);
   if(s.phase==='parade'){for(let i=-1;i<3;i++){const e=part(i===-1?'Duck':'Duckling'+i);e.enabled=true;const a=t*1.35-i*.48;e.setLocalPosition(Math.sin(a)*.95,Math.abs(Math.sin(t*12-i))*.045,Math.cos(a)*.70);e.setLocalEulerAngles(0,a*180/Math.PI+90,Math.sin(t*9-i)*7);}if(t>5){this.audio.honk();this.complete(s);}}
  }
  if(s.id==='bubbles'&&(s.phase==='bubbles'||s.phase==='finished'))for(let i=0;i<10;i++){
   const e=part('Bubble'+i);if(s.bubblePopped.has(i)){e.enabled=false;continue;}
   const a=t*.35+i*2.4;e.setLocalPosition(Math.sin(a)*(1+i%3*.25),.68+Math.sin(t*.7+i)*.19,Math.cos(a)*1.3);e.setLocalEulerAngles(0,-25,0);
   if(touchesCircle(p,e.getLocalPosition(),.48))this.popBubble(s,i);
  }
  if(s.id==='flower'&&s.phase==='watering'){
   const can=part('Can').getLocalPosition();for(let i=0;i<8;i++){const d=part('Droplet'+i),u=(t*1.8+i/8)%1;d.enabled=t<2.4;d.setLocalPosition((can.x-.16)*(1-u),(can.y+.12)*(1-u)+.60*u,can.z*(1-u)-.45*u);}
   part('Flower').setLocalEulerAngles(0,0,Math.max(0,48-t*30)+(t>1.8?Math.sin(t*26)*Math.max(0,12-(t-1.8)*15):0));
   if(t>2.6){const can=this.part(s,'Can');can.entity.setLocalPosition(can.p);can.entity.setLocalRotation(can.q);this.holding=null;this.character.animator.setCarrying(false);this.audio.honk();this.complete(s);}
  }
  if(s.id==='pinwheel'){const speed=s.phase==='spinning'?Math.max(0,1050-t*180):s.phase==='finished'?Math.max(0,210-(t-4)*160):s.count*70;part('Wheel').rotateLocal(0,0,dt*speed);for(let i=0;i<8;i++){const r=this.part(s,'Ribbon'+i),f=s.phase==='spinning'?Math.min(1,t):0;r.entity.setLocalPosition(r.p.x+Math.sin(t*8+i)*.08,r.p.y+Math.sin(t*5+i)*.06*f,r.p.z-f*.4);r.entity.setLocalEulerAngles(Math.sin(t*6+i)*40*f,0,0);}if(s.phase==='spinning'&&t>4)this.complete(s);}
  if(s.id==='jack'){
   part('Crank').setLocalEulerAngles(0,0,s.count*150);
   if(s.phase==='surprise'){part('Lid').setLocalEulerAngles(-Math.min(115,t*400),0,0);part('Frog').enabled=true;part('Frog').setLocalPosition(0,.45+Math.abs(Math.sin(t*8))*Math.exp(-t*.7)*.7,0);if(t<.04)this.audio.honk();if(t>2.5)this.complete(s);}
  }
  if(s.id==='puddles'){
   let over=-1;for(let i=0;i<4;i++){const q=this.part(s,'Puddle'+i);if(touchesCircle(p,q.p,.45))over=i;const pulse=i===s.lastPuddle?1+Math.sin(Math.min(t,1)*Math.PI)*.18:1;q.entity.setLocalScale(pulse,1,pulse);}
   if(over!==-1&&over!==s.lastPuddle)this.splash(s,over);else if(over===-1&&t>.6)s.lastPuddle=-1;
  }
  if(s.id==='leaves'&&s.phase==='burst'){
   for(let i=0;i<32;i++){const leaf=this.part(s,'Leaf'+i),a=i*2.4,f=Math.min(t,1.5);leaf.entity.setLocalPosition(leaf.p.x+Math.sin(a)*f*.6,Math.max(.04,leaf.p.y+f*2.4-f*f*1.9),leaf.p.z+Math.cos(a)*f*.6);leaf.entity.setLocalEulerAngles(f*160*(i%2?1:-1),f*75,0);}if(t>2)this.complete(s);
  }
  if(s.id==='plane'&&s.phase==='flying'){
   if(t<2){part('Plane').setLocalPosition(0,.85+Math.sin(t*7)*.025,1.05-t*1.5);part('Plane').setLocalEulerAngles(0,180,Math.sin(t*5)*4);}
   else{const u=Math.min(1,(t-2)/2),a=u*Math.PI;part('Plane').setLocalPosition(Math.sin(a)*1.2,.85+Math.sin(a)*.5,-1.95+u*2.8);part('Plane').setLocalEulerAngles(-Math.sin(a)*20,180-u*180,Math.sin(a)*25);}
   if(t>4){const plane=this.part(s,'Plane');plane.entity.setLocalPosition(plane.p);plane.entity.setLocalRotation(plane.q);this.complete(s);}
  }
  if(s.id==='flamingo'&&s.phase==='bowing'){
   const a=Math.sin(Math.min(1,t/2)*Math.PI)*18;part('Bird').setLocalEulerAngles(a,0,0);const q=part('Bird').getLocalRotation(),v=q.transformVector(new Vec3(.03,1.48,.07));part('Hat').setLocalPosition(.45+v.x,v.y,-.60+v.z);part('Hat').setLocalEulerAngles(a,0,Math.sin(t*15)*3);if(t>2.5)this.complete(s);
  }
  if(s.id==='picnic'&&s.phase==='picnic'){part('Teddy').setLocalEulerAngles(Math.sin(t*8)*8,Math.sin(t*5)*5,0);if(t>2){part('Teddy').setLocalEulerAngles(0,0,0);this.complete(s);}}
 }
 leave(){if(this.framed){this.camera.endChore();this.framed=false;}if(this.actionStation){this.character.animator.cancelAction();this.actionStation=null;}this.pending=false;this.putBack();this.controller.dynamicObstacles=[];this.controller.moveContact=null;this.journal.close();this.drop.hidden=true;}
 private remove(s:Station){s.root.enabled=false;s.root.destroy();s.lease.release();}
 destroy(){this.leave();for(const s of this.stations.values())this.remove(s);this.stations.clear();this.app.off('prerender',this.attachHeld,this);this.audio.destroy();this.abort.abort();this.button.remove();this.drop.remove();this.journal.remove();}
 snapshot(){return{day:this.save.data.day,ids:this.save.data.ids,progress:this.save.data.progress,holding:this.holding?.name??null,pushing:this.pushing?.id??null,focus:this.focus,stations:[...this.stations.values()].map(s=>({id:s.id,index:s.index,position:s.root.getPosition().toArray(),ready:s.ready,error:s.error,phase:s.phase,count:s.count,body:s.body,fallen:s.fallen,cart:s.cartBox?.center.toArray(),target:s.ready?this.target(s).point.toArray():null,parts:s.ready?[...s.parts].filter(([name])=>/^(Ball|Cart|Treat\d|Puddle\d|Bubble\d)$/.test(name)).map(([name,p])=>({name,position:p.entity.getPosition().toArray(),enabled:p.entity.enabled})):[]}))};}
}

