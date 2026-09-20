import {propPoint} from '../editor/PropSpace';
import {assetUrl} from '../editor/AssetUrls';
import {Asset,BoundingBox,Entity,Vec3,type AnimTrack,type Application,type ContainerResource} from 'playcanvas';
import {CharacterAnimator,type CharacterManifest} from '../components/CharacterAnimator';
import {CharacterGrounding} from '../components/CharacterGrounding';
import {HousePath} from '../components/HousePath';
import {sleepingTrack,bedEntryTrack} from '../components/RestingPose';
import {bedEntry,BED_ENTRY_SECONDS} from '../components/BedEntry';
import {material,primitives} from './primitives';
import type {Bedroom} from './bedroom';
import type {DailyLife} from './DailyLife';

/** Toddler personality decisions are independent of her model, clips and mission rules. */
export class Lilah {
  readonly root:Entity;
  private readonly visual:Entity;
  private readonly animator:CharacterAnimator;
  private readonly planner:HousePath;
  private readonly toy:Entity;
  private readonly socket:Entity;
  private grounding:CharacterGrounding|null=null;
  private readonly label=document.createElement('div');
  private route:Vec3[]=[];
  private destination='';
  private nextDecision=0;
  private nextMess=8;
  private time=0;
  private day=0;
  private height=.86465625;
  private loaded=false;
  private carrying=false;
  private state='watching';
  private bedStart:{position:Vec3;yaw:number;elapsed:number}|null=null;
  private speech='Hi, Ari!';
  private speechUntil=0;
  private visited=new Set<string>();
  private scripted=false;
  private job:{point:Vec3;icon:string;drop:()=>void;wait:number;blocked:number}|null=null;
  get ready(){return this.loaded;}
  get working(){return !!this.job;}
  beginTornado(){this.scripted=true;this.job=null;this.route=[];this.animator.cancelAction();this.carrying=false;this.toy.enabled=false;this.animator.setCarrying(false);this.say('🌪️ Ready, Ari?');}
  endTornado(){this.scripted=false;this.job=null;this.route=[];this.animator.cancelAction();this.animator.setCarrying(false);this.toy.enabled=false;this.carrying=false;this.state='watching';this.nextDecision=this.time+10;this.say('✨ We did it together!');}
  visitForMess(point:Vec3,icon:string,drop:()=>void){
    if(!this.scripted||this.job)return false;
    const start=this.root.getPosition().clone();start.y=0;const route=new HousePath(this.house,.27).route(start,point);
    if(!route.length)return false;
    this.route=route;this.job={point:point.clone(),icon,drop,wait:0,blocked:0};this.state='tornado-travel';this.toy.enabled=true;this.carrying=true;this.animator.setCarrying(true);this.say(icon+'  I have an idea!');return true;
  }
  private updateTornado(dt:number,arianna:Vec3,velocity:Vec3){
    const job=this.job;if(!job||this.animator.busy)return;
    if(this.route.length){
      const p=this.root.getPosition(),next=this.route[0],delta=new Vec3(next.x-p.x,0,next.z-p.z),distance=delta.length();
      if(distance<.035){this.route.shift();return;}
      delta.normalize();const q=p.clone().add(delta.clone().mulScalar(Math.min(distance,1.05*dt)));
      const separation=Math.hypot(q.x-arianna.x,q.z-arianna.z),previousSeparation=Math.hypot(p.x-arianna.x,p.z-arianna.z);
      if(separation<.43&&separation<=previousSeparation){
        job.blocked+=dt;
        if(job.blocked>.45){
          const obstacle=new BoundingBox(new Vec3(arianna.x,0,arianna.z),new Vec3(.27,2,.27)),planner=new HousePath({...this.house,obstacles:[...this.house.obstacles,obstacle]},.18),start=new Vec3(p.x,0,p.z);
          let path=planner.route(start,job.point);
          // A player can step into our clearance circle. First step OUT of it, then route around.
          if(!path.length){for(let i=0;i<16;i++){const angle=i*Math.PI/8,escape=new Vec3(p.x+Math.sin(angle)*.65,0,p.z+Math.cos(angle)*.65);if(Math.hypot(escape.x-arianna.x,escape.z-arianna.z)<.55||(escape.x-p.x)*(p.x-arianna.x)+(escape.z-p.z)*(p.z-arianna.z)<=0||!this.planner.line(start,escape))continue;const rest=planner.route(escape,job.point);if(rest.length){path=[escape,...rest];break;}}}
          if(path.length)this.route=path;job.blocked=0;
        }
        return;
      }
      if(this.planner.free(q.x,q.z)){this.root.setPosition(q);velocity.copy(delta).mulScalar(1.05);}else {this.route=this.planner.route(new Vec3(p.x,0,p.z),job.point);}
    }else{
      if(!job.wait){this.say(job.icon+'  …');this.state='tornado-thinking';}
      job.wait+=dt;if(job.wait<1.1)return;
      this.state='tornado-drop';this.animator.playAction('PutDown',.8,()=>{
        if(this.job!==job||!this.scripted)return;
        this.toy.enabled=false;this.carrying=false;this.animator.setCarrying(false);this.job=null;job.drop();this.say(job.icon==='🧺'?'Oops! ALL the toys!':'Ta-da! Your turn, Ari!');
      },new Vec3(job.point.x,.1,job.point.z+.3));
    }
  }
  constructor(private app:Application,private house:Bedroom,private daily:DailyLife){
    this.root=new Entity('Lilah · age 2',app);app.root.addChild(this.root);this.root.setPosition(1,.09,.7);
    this.visual=new Entity('Lilah visual',app);this.root.addChild(this.visual);
    const placeholder=new Entity('Lilah loading',app);this.visual.addChild(placeholder);
    this.animator=new CharacterAnimator(this.visual,placeholder);this.planner=new HousePath(house);
    this.socket=new Entity('Lilah toy grip',app);this.visual.addChild(this.socket);this.animator.bindCarrySocket(this.socket);
    this.toy=primitives(app,this.socket)('Favorite block','box',[0,0,0],[.13,.13,.13],material('Lilah favorite block','#edb867'));
    this.toy.enabled=false;
    this.label.id='lilah-label';this.label.className='lilah-label';this.label.hidden=true;document.querySelector('#game')!.append(this.label);
    this.say('Hi, Ari!');
    this.daily.onPlayLilah=()=>this.playTogether();
    this.daily.lilahMesses.onClean=actor=>{if(!this.animator.busy){this.say(actor==='marc'?'Daddy fixed it! I supervised!':'All better! I helped!');this.animator.playAction('Celebrate',1.6);}};
    void this.load().catch(error=>{console.error('Lilah could not load:',error);this.label.textContent='Lilah is still loading';});
  }
  private async load(){
    const config=await (await fetch(assetUrl(`${import.meta.env.BASE_URL}assets/characters/arianna/character.json`))).json();this.height=config.height*.625;
    const asset=new Asset('Lilah Meshy review','container',{url:assetUrl(`${import.meta.env.BASE_URL}assets/characters/lilah/lilah.glb`)});
    await new Promise<void>((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);this.app.assets.add(asset);this.app.assets.load(asset);});
    const resource=asset.resource as ContainerResource & {animations:Asset[]};
    const model=resource.instantiateRenderEntity({castShadows:true}),tracks=resource.animations.map(a=>a.resource as AnimTrack);
    const sleep=sleepingTrack(model,tracks.find(t=>t.name==='Idle')!,await(await fetch(assetUrl('/assets/animations/rest/sleep.json'))).json());tracks.push(sleep,bedEntryTrack(model,tracks.find(t=>t.name==='Idle')!,sleep));
    const manifest:CharacterManifest={animations:tracks.map(t=>({name:t.name,duration_seconds:t.duration,loop:!['PickUp','PutDown','Celebrate','SleepEnter'].includes(t.name)})),
      scale:{rest_height_m:1.03},locomotion:{Walk:{travel_speed_mps:.7},CarryWalk:{travel_speed_mps:.7}},
      interaction_events:{PickUp:[{time_seconds:1.1,event:'take-toy'}],PutDown:[{time_seconds:1.3,event:'drop-toy'}]},action_playback:3,walk_playback:1};
    for(const required of ['Idle','Walk','CarryIdle','CarryWalk','PickUp','PutDown','Celebrate'])if(!tracks.some(t=>t.name===required))throw new Error('Missing Lilah clip '+required);
    const alignment=new Entity('Lilah ground alignment',this.app);this.visual.addChild(alignment);alignment.addChild(model);
    model.setLocalScale(this.height/1.03,this.height/1.03,this.height/1.03);
    this.animator.attach(model,tracks,manifest,this.height/1.03);this.grounding=new CharacterGrounding(this.app.root,this.root,alignment);this.loaded=true;
  }
  private say(text:string){this.speech=text;this.label.textContent=text;this.speechUntil=performance.now()+2600;}
  private go(point:Vec3,purpose:string){const p=this.root.getPosition().clone();p.y=0;this.route=this.planner.route(p,point);this.destination=purpose;return this.route.length>0;}
  private playTogether(){
    if(!this.loaded)return;
    this.route=[];this.carrying=false;this.toy.enabled=false;this.animator.setCarrying(false);this.animator.cancelAction();
    this.state='playing';this.say('Again! Again!');this.nextMess=this.time+75;this.nextDecision=this.time+10;this.animator.playAction('Celebrate',1.6);
  }
  private decide(arianna:Vec3){
    const clock=this.daily.clock;
    if(clock.state.phase==='night'){
      this.state='sleepy';this.say('Sleepy…');this.carrying=false;this.toy.enabled=false;this.animator.setCarrying(false);
      this.go(propPoint('crib',new Vec3(8.55,0,-1.3)),'bedtime');this.nextDecision=this.time+30;return;
    }
    if(Math.random()<.55){
      for(const [x,z]of [[.9,.7],[-.9,.7],[.9,-.7],[-.9,-.7]])if(this.go(new Vec3(arianna.x+x,0,arianna.z+z),'follow'))break;
      this.state='following';this.say(['Ari! Wait for me!','I do it too!','Whatcha doing?'][Math.floor(Math.random()*3)]);
    }else{
      const spots=[[1.1,1.3],[3.8,2],[1.4,5.6],[.5,10.8],[4.3,11.4],[8.4,.5]],p=spots[Math.floor(Math.random()*spots.length)];
      this.go(new Vec3(p[0],0,p[1]),'explore');this.state='exploring';this.say('Ooh! What’s that?');
    }
    this.nextDecision=this.time+12;
  }
  update(dt:number,elapsed:number,visible:boolean,canMischief:boolean,arianna:Vec3,camera:Entity){
    this.root.enabled=visible&&this.loaded;this.label.hidden=!this.root.enabled;
    this.daily.lilahAvailable=this.root.enabled&&!this.animator.busy&&this.state!=='sleeping'&&!this.bedStart;
    const target=this.daily.lilahTarget;target.anchor.copy(this.root.getPosition());target.marker.copy(target.anchor);target.marker.y+=this.height+.08;
    if(!this.root.enabled||document.hidden)return;
    if(this.day!==this.daily.clock.state.day){this.day=this.daily.clock.state.day;this.time=0;this.nextMess=8;this.nextDecision=3;this.route=[];this.animator.reset();this.carrying=false;this.toy.enabled=false;if(this.grounding)this.grounding.surfaceHeight=null;if(this.state==='sleeping'||this.bedStart)this.root.setPosition(propPoint('crib',new Vec3(8.55,.09,-1.3)));this.bedStart=null;this.state='watching';}
    if((this.state==='sleeping'||this.bedStart)&&this.daily.clock.state.phase!=='night'){this.root.setPosition(propPoint('crib',new Vec3(8.55,.09,-1.3)));this.state='watching';this.bedStart=null;this.animator.setWorkClip(null);this.animator.setIdleClip('Idle');if(this.grounding)this.grounding.surfaceHeight=null;}
    if(canMischief)this.time+=dt;
    if(!this.scripted&&canMischief&&this.daily.clock.state.phase==='night'&&this.state!=='sleepy'&&this.state!=='sleeping'&&!this.bedStart){
      this.route=[];this.animator.cancelAction();this.decide(arianna);
    }
    const velocity=new Vec3();
    if(this.scripted)this.updateTornado(dt,arianna,velocity);
    else if(this.bedStart){const entry=this.bedStart;if(canMischief)entry.elapsed+=dt;const t=entry.elapsed/BED_ENTRY_SECONDS,pose=bedEntry(entry.position,entry.yaw,true,t);this.root.setPosition(pose.position);this.visual.setLocalEulerAngles(0,pose.yaw,0);if(this.grounding)this.grounding.surfaceHeight=pose.height;if(t>=1){this.bedStart=null;this.state='sleeping';this.animator.setWorkClip(null);this.animator.setIdleClip('Sleep');this.say('Zzz…');}}
    else if(canMischief&&!this.animator.busy&&this.state!=='sleeping'){
      if(this.route.length){
        const p=this.root.getPosition(),next=this.route[0],dx=next.x-p.x,dz=next.z-p.z,distance=Math.hypot(dx,dz);
        if(distance<.0001){this.route.shift();if(!this.route.length)this.arrive();}
        else {
          const step=Math.min(distance,.7*dt),x=p.x+dx/distance*step,z=p.z+dz/distance*step;
          // Stop for Arianna instead of clipping through her; reroute on the next decision.
          if(Math.hypot(x-arianna.x,z-arianna.z)>.4&&this.planner.free(x,z)){this.root.setPosition(x,p.y,z);velocity.set(dx/distance*.7,0,dz/distance*.7);}
          else{this.route=[];this.nextDecision=this.time+2;}
        }
      }else if(this.time>=this.nextDecision)this.decide(arianna);
    }
    this.grounding?.update();this.animator.update(dt,velocity,elapsed);
    const p=this.root.getPosition();this.visited.add(p.z<3?'bedroom':p.z<9?'living':'kitchen');
    const screen=camera.camera!.worldToScreen(new Vec3(p.x,p.y+this.height+.12,p.z));
    const viewport=document.querySelector('#game')!.getBoundingClientRect();
    this.label.hidden=performance.now()>this.speechUntil||screen.x<10||screen.x>viewport.width-10||screen.y<130||screen.y>viewport.height-130;
    this.label.style.transform=`translate(${Math.max(4,Math.min(viewport.width-this.label.offsetWidth-4,screen.x-this.label.offsetWidth/2))}px,${screen.y-this.label.offsetHeight}px)`;
  }
  private arrive(){
    this.nextDecision=this.time+7;
    if(this.destination==='mess'){
      this.animator.playAction('PutDown',.8,()=>{
        const made=this.daily.clock.state.phase!=='night'&&this.daily.lilahMesses.add(this.root.getPosition());this.carrying=false;this.toy.enabled=false;this.animator.setCarrying(false);
        this.say(made?['Ta-da! I helping!','Uh-oh. All wet!','Crumbs are confetti!'][this.daily.lilahMesses.count-1]:'I did it!');
        this.nextMess=this.time+50;this.state='proud';
      });
    }else if(this.destination==='bedtime'){this.state='bedtime-entry';this.bedStart={position:this.root.getPosition().clone(),yaw:this.visual.getLocalEulerAngles().y,elapsed:0};this.animator.setWorkClip('SleepEnter');this.say('Night night!');}
    else{this.state='watching';this.say(this.destination==='follow'?'You’re my favorite, Ari!':'Ooh…');}
  }
  snapshot(){return {loaded:this.loaded,height:this.height,position:this.root.getPosition().toArray(),state:this.state,scripted:this.scripted,job:this.job?{point:this.job.point.toArray(),icon:this.job.icon,wait:this.job.wait}:null,speech:this.speech,carrying:this.carrying,animation:this.animator.snapshot(),visited:[...this.visited],routeLength:this.route.length,time:this.time,nextMess:this.nextMess};}
  geometry(){return this.animator.geometrySnapshot();}
  destroy(){this.label.remove();this.root.destroy();}
}
