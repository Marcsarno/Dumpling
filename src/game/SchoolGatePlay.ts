import {Entity,Vec3,BoundingBox,Texture,Mesh,MeshInstance,CULLFACE_NONE,type Application,type Asset,type AnimTrack,type StandardMaterial,type ContainerResource} from 'playcanvas';
import {material,primitives} from './primitives';
import {leaseContainer} from './ContainerLease';
import {assetUrl} from '../editor/AssetUrls';
import {HousePath} from '../components/HousePath';
import type {Bedroom} from './bedroom';
import type {PlayerController} from '../components/PlayerController';
import type {createCharacter} from '../components/CharacterVisual';
import type {IsometricCamera} from './IsometricCamera';
import {PlayAudio} from '../ui/PlayAudio';
import {BALL_RADIUS,ballFits,stepSchoolBall,playerKick,kickSchoolBall,type BallBody,type BallRect} from '../systems/SchoolBallPhysics';

const HOME=new Vec3(19.15,.075,-28.2),LEAVES=new Vec3(15.55,.075,-28.65);
type Leaf={entity:Entity;home:Vec3;v:Vec3;spin:number};
type Stage={root:Entity;ball:Entity;shadow:Entity;person:Entity;model:Entity|null;lease:ReturnType<typeof leaseContainer>;materials:StandardMaterial[];textures:Texture[];meshes:Mesh[];leaves:Leaf[];ready:boolean;clip:string;age:number;popTimer:number;route:Vec3[];routeClock:number;planner:HousePath};

/** A shared ball belongs to Poppy at the real school gate. No mission, score,
 * numbered station, camera takeover, or reward write is involved. */
export class SchoolGatePlay{
 private stage:Stage|null=null;
 private body:BallBody={x:19.05,z:-27.6,vx:0,vz:0};
 private active=false;private available=false;private held=false;private pending=false;
 private time=0;private cooldown=0;private lastPlayerContact=-100;private lastSay=-100;
 private npcState='waiting';private npcTimer=0;private npcTarget=new Vec3();private npcKickTo=new Vec3();private kicked=false;private npcPractice=false;
 private invited=false;private leafSound=0;private jumpSeen=false;private nodTime=0;
 private audio=new PlayAudio();private abort=new AbortController();
 private pickup=document.createElement('button');private speech=document.createElement('div');private screen=new Vec3();
 private ballFloors:BallRect[]=[];private ballSolids:BallRect[]=[];
 private stats={playerKicks:0,passes:0,returns:0,nudges:0,wallBounces:0,leafBursts:0,pickups:0,putdowns:0,practiceKicks:0,loads:0,releases:0};
 private error='';private lastContact:{kind:string;distance:number;foot?:number[]}|null=null;
 constructor(private app:Application,private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private room:Bedroom,private camera:IsometricCamera){
  this.pickup.id='school-ball-pickup';this.pickup.className='journey-button';this.pickup.textContent='Pick up ball';this.pickup.hidden=true;
  this.pickup.style.cssText='right:18px;bottom:276px;left:auto;min-height:44px;';
  this.pickup.onclick=()=>this.take();
  this.speech.id='poppy-play-speech';this.speech.hidden=true;this.speech.style.cssText='position:absolute;z-index:12;pointer-events:none;background:#fff9ec;color:#66536a;border:2px solid #e9bad0;border-radius:16px;padding:7px 12px;font:600 15px/1.2 Trebuchet MS,sans-serif;max-width:175px;text-align:center;box-shadow:0 3px 0 #c9b0b333;';
  document.querySelector('#game')!.append(this.pickup,this.speech);
  window.addEventListener('pointerdown',()=>this.audio.unlock(),{once:true,signal:this.abort.signal});
  window.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!this.pickup.hidden&&!document.querySelector('dialog[open]'))this.take();},{signal:this.abort.signal});
  app.on('prerender',this.attachHeld,this);
 }
 get carrying(){return this.held;}
 get busy(){return this.pending;}
 get movementLocked(){return this.pending&&!this.controller.approaching;}
 get focus(){
  if(!this.stage?.ready||!this.available||this.controller.riding)return null;
  if(this.held)return{title:'Put down',detail:'Leave the ball wherever you like',icon:'⚽',enabled:!this.pending};
  const p=this.character.player.getPosition();
  if(Math.hypot(p.x-this.body.x,p.z-this.body.z)>.98||Math.hypot(this.body.vx,this.body.vz)>2.8)return null;
  return{title:'Kick',detail:'Face the ball to choose its direction',icon:'⚽',enabled:!this.pending&&!this.character.animator.busy};
 }
 private load(){
  const root=new Entity('School gate shared play',this.app);this.app.root.addChild(root);
  const materials:StandardMaterial[]=[],textures:Texture[]=[],meshes:Mesh[]=[];
  const mat=(n:string,c:string)=>{const m=material(n,c);materials.push(m);return m;};
  const s=primitives(this.app,root);
  const ballMaterial=mat('Poppy cream and coral playground ball','#fff7df');
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d')!;
  c.fillStyle='#f9dfbd';c.fillRect(0,0,512,256);
  for(let i=0;i<6;i++){
   c.fillStyle=i%2?'#df8069':'#699fa9';c.beginPath();c.moveTo(i*512/6,0);c.bezierCurveTo(i*512/6+32,70,i*512/6+32,186,i*512/6,256);c.lineTo((i+.64)*512/6,256);c.bezierCurveTo((i+.64)*512/6+32,186,(i+.64)*512/6+32,70,(i+.64)*512/6,0);c.fill();
   c.strokeStyle='#a1746033';c.lineWidth=2;c.stroke();
  }
  const tex=new Texture(this.app.graphicsDevice,{name:'Original school ball panels',mipmaps:true});tex.setSource(canvas);textures.push(tex);ballMaterial.diffuseMap=tex;ballMaterial.update();
  const ball=s('Poppy shared ball','sphere',[this.body.x,.31,this.body.z],[BALL_RADIUS*2,BALL_RADIUS*2,BALL_RADIUS*2],ballMaterial);
  const shadowMat=mat('Ball contact shadow','#8b887b');const shadow=s('Ball soft contact','cylinder',[this.body.x,.081,this.body.z],[.39,.004,.30],shadowMat,false);
  // A schoolbag and a bottle show whose ball this is; both sit against the wall.
  const bag=mat('Poppy rose backpack','#cb95b2'),trim=mat('Bag cream piping','#f3dfca');
  s('Poppy schoolbag','box',[18.6,.35,-29.38],[.44,.53,.25],bag);
  s('Bag round flap','sphere',[18.6,.58,-29.38],[.44,.19,.25],bag);
  s('Bag front pocket','box',[18.6,.28,-29.22],[.30,.20,.08],trim);
  s('Bag handle','box',[18.6,.7,-29.37],[.17,.06,.045],bag);
  s('Water bottle','cylinder',[18.98,.23,-29.35],[.14,.30,.14],mat('Bottle mint','#93bcb3'));
  // Leaves fell from the EXISTING school tree. They are irregular, not a pad.
  const colors=['#b87949','#d89d54','#ddbb73','#a59554'];
  const leafMats=colors.map((h,i)=>{const m=mat('School fallen leaf '+i,h);m.cull=CULLFACE_NONE;m.update();return m;});
  const mesh=new Mesh(this.app.graphicsDevice);mesh.setPositions([0,.025,0,-.09,0,-.07,-.065,0,-.18,0,.008,-.26,.065,0,-.18,.09,0,-.07,0,.012,.07]);mesh.setNormals(Array.from({length:7},()=>[0,1,0]).flat());mesh.setIndices([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,1]);mesh.update();meshes.push(mesh);
  const leaves:Leaf[]=[];
  for(let i=0;i<42;i++){
   const angle=i*2.39996,r=.12+Math.sqrt(i/42)*.85;
   const e=new Entity('Fallen maple leaf '+i,this.app);root.addChild(e);e.addComponent('render',{meshInstances:[new MeshInstance(mesh,leafMats[i%4])],castShadows:false});
   const home=new Vec3(LEAVES.x+Math.cos(angle)*r,.087+(i%4)*.018,LEAVES.z+Math.sin(angle)*r*.66);
   e.setPosition(home);e.setLocalEulerAngles(0,i*73,(i%3-1)*12);e.setLocalScale(.85+i%3*.2,.85+i%3*.2,.85+i%3*.2);leaves.push({entity:e,home,v:new Vec3(),spin:(i%2?1:-1)*(110+i*7)});
  }
  const person=new Entity('Poppy at the school gate',this.app);root.addChild(person);person.setPosition(HOME);
  const lease=leaseContainer(this.app,assetUrl('assets/people/student-poppy-play.glb'),'School gate Poppy');
  const planner=new HousePath({walkable:[{minX:14.35,maxX:30.65,minZ:-29.42,maxZ:-26.38}],obstacles:this.room.obstacles} as Bedroom,.23);
  const stage:Stage={root,ball,shadow,person,model:null,lease,materials,textures,meshes,leaves,ready:false,clip:'',age:0,popTimer:0,route:[],routeClock:0,planner};
  this.stage=stage;this.stats.loads++;this.npcState='waiting';this.npcTimer=1.8;this.invited=false;
  this.ballFloors=this.room.walkable!.map(r=>({...r}));
  this.ballSolids=this.room.obstacles.map(b=>({minX:b.center.x-b.halfExtents.x,maxX:b.center.x+b.halfExtents.x,minZ:b.center.z-b.halfExtents.z,maxZ:b.center.z+b.halfExtents.z}));
  // The existing school sidewalk's road edge receives a shallow physical curb.
  this.ballSolids.push({minX:14,maxX:20,minZ:-26.19,maxZ:-26.05});
  void lease.ready.then(resource=>{
   if(this.stage!==stage)return;
   const model=resource.instantiateModelEntity({castShadows:true});person.addChild(model);model.setLocalScale(1.34/2.14,1.34/2.14,1.34/2.14);
   const tracks=(resource as ContainerResource & {animations:Asset[]}).animations.map(a=>a.resource as AnimTrack);
   model.addComponent('anim',{activate:true});for(const t of tracks)model.anim!.assignAnimation(t.name,t,undefined,1,!['Wave','Kick_Right','Interact'].includes(t.name));
   model.anim!.playing=false;stage.model=model;stage.ready=true;this.clip('Idle_Neutral');model.anim!.update(0);
  }).catch(e=>{this.error=String(e);console.error('School play character',e);});
 }
 private clip(name:string){const s=this.stage;if(!s?.model||s.clip===name)return;s.clip=name;s.model.anim!.speed=1;s.model.anim!.baseLayer!.transition(name,.12);}
 private say(text:string){if(this.time-this.lastSay<5)return;this.lastSay=this.time;this.speech.textContent=text;this.speech.hidden=false;this.nodTime=3.5;}
 private distance(){const p=this.character.player.getPosition();return Math.hypot(p.x-this.body.x,p.z-this.body.z);}
 press(){
  const s=this.stage;if(!s?.ready||!this.focus?.enabled)return;this.audio.unlock();
  if(this.held){this.putDown();return;}
  this.pending=true;this.controller.reset();
  const target=new Vec3(this.body.x,.075,this.body.z);
  const act=()=>{
   if(!this.active){this.pending=false;return;}
   this.character.animator.playAction('PlayKick',.65,()=>{
    if(!this.active||this.held||this.distance()>1.05)return;
    const p=this.character.player.getPosition(),friend=s.person.getPosition();
    const pass=playerKick(this.body,p,friend);this.stats.playerKicks++;if(pass)this.stats.passes++;
    this.lastContact={kind:'player kick',distance:this.distance(),foot:this.character.animator.snapshot().feet[1]};
    this.lastPlayerContact=this.time;this.cooldown=.48;this.audio.tone(125,.14,'sine',.55);s.popTimer=.32;
    this.npcState='watching';this.npcTimer=.45;
   },target);
  };
  if(this.distance()>.64)this.controller.approachProp(target,act,()=>{this.pending=false;});else act();
 }
 private take(){
  if(!this.available||!this.stage?.ready||this.pending||this.held||this.character.animator.busy||this.distance()>1.05)return;
  this.pending=true;this.controller.reset();this.body.vx=0;this.body.vz=0;
  this.character.animator.playAction('PickUp',.7,()=>{
   if(!this.active||this.distance()>1.1)return;
   this.held=true;this.stats.pickups++;this.character.animator.setCarrying(true);this.npcState='following';this.npcTimer=0;
   this.lastPlayerContact=this.time;this.say('Can I have a turn?');
  },new Vec3(this.body.x,.075,this.body.z));
 }
 private putDown(){
  const s=this.stage;if(!s)return;const p=this.character.player.getPosition();
  const yaw=this.character.animator.snapshot().yaw*Math.PI/180;let point:Vec3|null=null;
  for(const a of [0,.6,-.6,1.3,-1.3,Math.PI]){const q=new Vec3(p.x+Math.sin(yaw+a)*.55,.075,p.z+Math.cos(yaw+a)*.55);if(ballFits(q.x,q.z,this.ballFloors,this.ballSolids)){point=q;break;}}
  if(!point)return;this.pending=true;this.controller.reset();const drop=point;
  this.character.animator.playAction('PutDown',.7,()=>{
   if(!this.active)return;this.held=false;this.character.animator.setCarrying(false);this.body={x:drop.x,z:drop.z,vx:0,vz:0};this.stats.putdowns++;this.cooldown=.8;this.lastPlayerContact=this.time;this.npcState='watching';this.npcTimer=2;s.popTimer=.18;
  },drop);
 }
 private attachHeld=()=>{
  const s=this.stage;if(!s||!this.held)return;const hands=this.character.animator.snapshot().hands;
  if(hands.length===2){const h=new Vec3().add2(new Vec3(...hands[0]),new Vec3(...hands[1])).mulScalar(.5);h.add(this.character.visual.getWorldTransform().transformVector(new Vec3(0,.05,.14)));s.ball.setPosition(h);this.body.x=h.x;this.body.z=h.z;}
 };
 private movePoppy(point:Vec3,dt:number){
  const s=this.stage!,at=s.person.getPosition();const target=point.clone();target.x=Math.max(14.8,Math.min(30.4,target.x));target.z=Math.max(-29.05,Math.min(-26.7,target.z));target.y=0;
  const player=this.character.player.getPosition();
  if(s.routeClock<=0){
   const planner=new HousePath({walkable:[{minX:14.35,maxX:30.65,minZ:-29.42,maxZ:-26.38}],obstacles:[...this.room.obstacles,new BoundingBox(new Vec3(player.x,.6,player.z),new Vec3(.48,.7,.48))]} as Bedroom,.23);
   s.route=planner.route(new Vec3(at.x,0,at.z),target);s.routeClock=.6;
  }s.routeClock-=dt;
  if(Math.hypot(at.x-target.x,at.z-target.z)<.12){s.route=[];return false;}
  const next=s.route[0];if(!next)return false;const delta=new Vec3(next.x-at.x,0,next.z-at.z),distance=delta.length();if(distance<.09){s.route.shift();return false;}
  delta.normalize();const step=Math.min(distance,1.0*dt),q=new Vec3(at.x+delta.x*step,.075,at.z+delta.z*step);
  if(q.distance(new Vec3(player.x,.075,player.z))<.7){s.routeClock=0;return false;}
  s.person.setPosition(q);s.person.setEulerAngles(0,Math.atan2(delta.x,delta.z)*180/Math.PI,0);this.clip('Walk');return true;
 }
 private face(point:{x:number;z:number},dt:number){const s=this.stage!,p=s.person.getPosition(),wanted=Math.atan2(point.x-p.x,point.z-p.z)*180/Math.PI,old=s.person.getEulerAngles().y;let d=(wanted-old+540)%360-180;s.person.setEulerAngles(0,old+d*(1-Math.exp(-9*dt)),0);}
 private startNpcKick(target:Vec3,practice=false){
  this.npcState='kick';this.npcTimer=0;this.npcKickTo.copy(target);this.kicked=false;this.clip('Kick_Right');
  this.npcPractice=practice;
 }
 private updatePoppy(dt:number){
  const s=this.stage!,p=s.person.getPosition(),player=this.character.player.getPosition(),ball=new Vec3(this.body.x,.075,this.body.z),speed=Math.hypot(this.body.vx,this.body.vz);
  // Step aside if Arianna walks up to us, including when a route starts inside
  // her avoidance radius. Otherwise two polite collision checks can deadlock.
  const space=Math.hypot(p.x-player.x,p.z-player.z);
  if(space<.7||(space<.95&&this.controller.input.lengthSq()>.01)){
   const away=Math.atan2(p.x-player.x,p.z-player.z);
   for(const offset of [0,.6,-.6,1.2,-1.2,1.55,-1.55]){
    const a=away+offset,q=new Vec3(p.x+Math.sin(a)*1.3*dt,.075,p.z+Math.cos(a)*1.3*dt);
    if(s.planner.free(q.x,q.z)&&Math.hypot(q.x-player.x,q.z-player.z)>space){s.person.setPosition(q);s.person.setEulerAngles(0,a*180/Math.PI,0);this.clip('Walk');this.npcState='waiting';this.npcTimer=.4;s.routeClock=0;return;}
   }
  }
  this.npcTimer-=dt;
  if(this.npcState==='kick'){
   this.npcTimer+=2*dt;this.face(ball,dt);
   const foot=s.model?.findByName('Foot.R')?.getPosition();
   if(!this.kicked&&this.npcTimer>.45){
    this.kicked=true;
    if(p.distance(ball)<.8&&!this.held){
     if(this.npcPractice)this.stats.practiceKicks++;else this.stats.returns++;
     const dx=this.npcKickTo.x-ball.x,dz=this.npcKickTo.z-ball.z,d=Math.hypot(dx,dz);kickSchoolBall(this.body,dx,dz,Math.min(4.5,d*.72+.28));
     this.lastContact={kind:'Poppy kick',distance:foot?Math.hypot(foot.x-ball.x,foot.z-ball.z):-1,foot:foot?.toArray()};s.popTimer=.22;this.cooldown=.6;this.audio.tone(135,.12,'sine',.6);
    }
   }
   if(this.npcTimer>1.2){this.npcState='watching';this.npcTimer=2;this.clip('Idle_Neutral');}return;
  }
  if(this.held){
   const dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);
   if(d>1.7&&player.z<-25.6&&player.x>13.5&&player.x<31){const goal=new Vec3(player.x-dx/Math.max(d,.01)*1.45,0,player.z-dz/Math.max(d,.01)*1.45);if(this.movePoppy(goal,dt))return;}
   this.clip('Interact');this.face(player,dt);return;
  }
  if(!this.invited&&player.distance(HOME)<5.8){this.invited=true;this.say('Want to play?');this.clip('Wave');this.npcState='greeting';this.npcTimer=1.6;}
  if(this.npcState==='greeting'&&this.npcTimer>0){this.face(player,dt);return;}
  // Give Arianna time to reach the ball. Poppy never snatches a ball at her feet.
  if(this.pending||this.time-this.lastPlayerContact<.7||this.npcTimer>0||this.distance()<1.3){this.clip('Idle_Neutral');this.face(ball,dt);return;}
  if(speed>1.15){this.clip('Idle_Neutral');this.face(ball,dt);return;}
  if(ball.x<14.3||ball.x>30.6||ball.z> -26.3||ball.z< -29.5){if(!this.movePoppy(HOME,dt)){this.clip('Idle_Neutral');this.face(player,dt);}return;}
  const joined=this.invited&&player.distance(HOME)<8.5;
  const target=joined?new Vec3(player.x,.075,player.z):new Vec3(17.6,.075,-30.3);
  // Approach from behind the ball relative to the intended pass.
  const d=new Vec3().sub2(target,ball);d.y=0;d.normalize();
  const behind=Math.atan2(-d.x,-d.z);let approach:Vec3|null=null;
  for(const angle of [0,.4,-.4,.8,-.8,1.3,-1.3,2,-2,Math.PI]){
   const q=new Vec3(ball.x+Math.sin(behind+angle)*.56,.075,ball.z+Math.cos(behind+angle)*.56);
   if(s.planner.free(q.x,q.z)&&q.distance(player)>.75){approach=q;break;}
  }
  if(!approach){this.clip('Idle_Neutral');return;}this.npcTarget.copy(approach);
  if(p.distance(this.npcTarget)>.16){if(this.movePoppy(this.npcTarget,dt)){this.npcState='retrieving';return;}this.clip('Idle_Neutral');return;}
  this.face(ball,dt);
  const wanted=Math.atan2(ball.x-p.x,ball.z-p.z)*180/Math.PI;
  if(Math.abs((wanted-s.person.getEulerAngles().y+540)%360-180)>12){this.clip('Idle_Neutral');return;}
  if(joined&&this.time-this.lastPlayerContact<1.7){this.clip('Idle_Neutral');return;}
  this.startNpcKick(target,!joined);if(joined)this.say('Your turn!');
 }
 private leaves(dt:number){
  const s=this.stage!,player=this.character.player.getPosition(),moving=this.controller.velocity.length(),jump=this.character.animator.actionName==='PlayJump';
  const triggerJump=jump&&!this.jumpSeen;this.jumpSeen=jump;this.leafSound=Math.max(0,this.leafSound-dt);
  let touched=0;
  for(const l of s.leaves){
   const p=l.entity.getPosition().clone(),pd=Math.hypot(p.x-player.x,p.z-player.z),bd=Math.hypot(p.x-this.body.x,p.z-this.body.z);
   const foot=pd<(triggerJump?1.15:.44)&&(moving>.12||triggerJump),ball=!this.held&&bd<.43&&Math.hypot(this.body.vx,this.body.vz)>.25;
   if((foot||ball)&&p.y<.18){const ox=p.x-(ball?this.body.x:player.x),oz=p.z-(ball?this.body.z:player.z),d=Math.max(.06,Math.hypot(ox,oz));l.v.set(ox/d*(triggerJump?1.6:.85),triggerJump?2.2:.75,oz/d*(triggerJump?1.6:.85));touched++;}
   if(l.v.lengthSq()>.001){p.add(l.v.clone().mulScalar(dt));l.v.y-=4.2*dt;l.v.x*=Math.exp(-1.8*dt);l.v.z*=Math.exp(-1.8*dt);if(p.y<.085){p.y=.085;l.v.y=0;l.v.x*=.7;l.v.z*=.7;}l.entity.setPosition(p);l.entity.rotateLocal(l.spin*dt*.3,l.spin*dt,l.spin*dt*.18);}
   // A slow breeze gathers settled leaves when nobody is looking at the tree.
   else if(player.distance(LEAVES)>6){l.entity.setPosition(new Vec3().lerp(p,l.home,1-Math.exp(-.3*dt)));}
  }
  if(touched&&!this.leafSound){this.leafSound=.4;this.stats.leafBursts++;this.audio.tone(420,.12,'triangle',.3);if(triggerJump)this.say('Look at them fly!');}
 }
 update(dt:number,outside:boolean,available:boolean){
  this.active=outside;this.available=outside&&available&&!this.controller.riding;
  if(!outside){this.leave();return;}
  const p=this.character.player.getPosition();
  const near=p.distance(HOME)<19||this.held||this.distance()<13;
  if(!near){if(this.stage)this.unload();return;}
  if(!this.stage)this.load();const s=this.stage!;
  this.pickup.hidden=!s.ready||!this.available||this.held||this.pending||this.character.animator.busy||this.distance()>.98||Math.hypot(this.body.vx,this.body.vz)>1.8;
  if(!available||dt<=0){this.speech.hidden=true;return;}
  this.time+=dt;s.age+=dt;this.cooldown=Math.max(0,this.cooldown-dt);s.popTimer=Math.max(0,s.popTimer-dt);
  if(this.pending&&!this.character.animator.busy&&!this.controller.approaching)this.pending=false;
  if(!this.held){
   const ox=this.body.x,oz=this.body.z,hit=stepSchoolBall(this.body,dt,this.ballFloors,this.ballSolids);
   if(hit){this.stats.wallBounces+=hit;if(this.cooldown<=0){this.audio.tone(100,.12,'sine',.6);this.cooldown=.12;}s.popTimer=.15;}
   const d=this.distance(),v=this.controller.velocity;
   // A received pass meets Arianna's shoes instead of rolling through her body.
   if(!this.pending&&d<.48&&d>.02){
    const nx=(this.body.x-p.x)/d,nz=(this.body.z-p.z)/d,toward=this.body.vx*nx+this.body.vz*nz;
    if(toward<-.08){this.body.vx-=toward*nx;this.body.vz-=toward*nz;this.body.vx*=.25;this.body.vz*=.25;this.cooldown=.15;s.popTimer=.12;}
   }
   if(!this.controller.riding&&!this.pending&&this.cooldown<=0&&d<.49&&v.length()>.2){
    const dx=this.body.x-p.x,dz=this.body.z-p.z;
    if(dx*v.x+dz*v.z>0){kickSchoolBall(this.body,dx,dz,Math.min(2.6,v.length()*.85));this.lastPlayerContact=this.time;this.stats.nudges++;this.cooldown=.22;this.npcTimer=1.8;this.audio.tone(110,.1,'sine',.5);}
   }
   const lift=Math.sin(Math.min(1,s.popTimer/.32)*Math.PI)*.07;
   s.ball.setPosition(this.body.x,.075+BALL_RADIUS+lift,this.body.z);s.ball.rotateLocal((this.body.z-oz)/BALL_RADIUS*57.3,0,-(this.body.x-ox)/BALL_RADIUS*57.3);
   s.shadow.setPosition(this.body.x,.081,this.body.z);s.shadow.enabled=true;
  }else{s.shadow.enabled=false;}
  if(s.ready){
   this.updatePoppy(dt);s.model!.anim!.update(dt);
   // Ground both original feet after imported idle/walk/kick motion.
   const lf=s.model!.findByName('Foot.L')!,rf=s.model!.findByName('Foot.R')!;
   const min=Math.min(lf.getPosition().y,rf.getPosition().y),local=s.model!.getLocalPosition();s.model!.setLocalPosition(local.x,local.y+(.11-min),local.z);
   const pp=s.person.getPosition();this.controller.dynamicObstacles.push(new BoundingBox(new Vec3(pp.x,.6,pp.z),new Vec3(.24,.7,.24)));
  }
  this.leaves(dt);
  this.nodTime=Math.max(0,this.nodTime-dt);this.speech.hidden=this.nodTime<=0||p.distance(s.person.getPosition())>9;
  if(!this.speech.hidden){const point=s.person.getPosition().clone();point.y+=1.65;this.camera.entity.camera!.worldToScreen(point,this.screen);const width=this.speech.parentElement!.clientWidth;this.speech.hidden=this.screen.x<0||this.screen.x>width;this.speech.style.left=`${Math.max(8,Math.min(width-this.speech.offsetWidth-8,this.screen.x-this.speech.offsetWidth/2))}px`;this.speech.style.top=`${Math.max(8,this.screen.y-this.speech.offsetHeight)}px`;}
 }
 leave(){
  if(this.pending){this.controller.reset();this.character.animator.cancelAction();}this.pending=false;
  if(this.held){this.held=false;this.character.animator.setCarrying(false);this.body={x:19.05,z:-27.6,vx:0,vz:0};}
  this.pickup.hidden=true;this.speech.hidden=true;if(this.stage)this.unload();
 }
 private unload(){const s=this.stage;if(!s)return;this.stage=null;s.root.destroy();s.lease.release();s.materials.forEach(m=>m.destroy());s.textures.forEach(t=>t.destroy());s.meshes.forEach(m=>m.destroy());this.stats.releases++;this.pickup.hidden=true;this.speech.hidden=true;}
 snapshot(){const s=this.stage;return{loaded:!!s,ready:s?.ready??false,error:this.error,held:this.held,pending:this.pending,ball:{...this.body},poppy:s?{position:s.person.getPosition().toArray(),state:this.npcState,clip:s.clip,feet:['Foot.L','Foot.R'].map(n=>s.model?.findByName(n)?.getPosition().toArray())}:null,stats:{...this.stats},contact:this.lastContact,leaves:s?.leaves.map(l=>l.entity.getPosition().toArray()),home:HOME.toArray()};}
 destroy(){this.leave();this.audio.destroy();this.abort.abort();this.pickup.remove();this.speech.remove();this.app.off('prerender',this.attachHeld,this);}
}


