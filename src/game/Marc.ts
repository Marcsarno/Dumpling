import {FamilyDinner} from './FamilyDinner';
import {propPoint,propYaw} from '../editor/PropSpace';
import {assetUrl} from '../editor/AssetUrls';
import { Asset, AnimData, AnimTrack, Entity, Quat, Vec3, type Application, type ContainerResource } from 'playcanvas';
import { CharacterAnimator, type CharacterManifest } from '../components/CharacterAnimator';
import { CharacterGrounding } from '../components/CharacterGrounding';
import { HousePath } from '../components/HousePath';
import { HOUSE_ROOMS } from '../data/house';
import type { Bedroom } from './bedroom';
import type { DailyLife } from './DailyLife';
import { material, primitives } from './primitives';

const SEAT = new Vec3(4.5,0,7.35), YAW = -35;
const FORWARD = new Vec3(Math.sin(YAW*Math.PI/180),0,Math.cos(YAW*Math.PI/180));
const ENTRY = SEAT.clone().add(FORWARD.clone().mulScalar(1.02));
const SEATED = SEAT.clone().add(FORWARD.clone().mulScalar(.28));
const PATROL = [[8.4,.5],[8.1,9.6],[.4,11.2],[3.8,2.0],[1.25,5.6]];
const REMARKS = ['Need a hand, sweetie?', 'I came. I saw. I stepped on a block.', 'Sweetie, is this a house or a tiny toy museum?', 'My coffee has been reheated three times. A new record.', 'The laundry and I are in a long-term relationship.', 'Nice collecting, sweetie. I collect missing socks.'];
type State = 'idle'|'walking'|'sitting-down'|'seated'|'standing-up'|'cleaning';

/** Household help only: never completes Arianna's base chores or awards her money. */
export class Marc {
  readonly root: Entity;
  private visual: Entity;
  private animator: CharacterAnimator;
  private grounding: CharacterGrounding | null = null;
  private planner: HousePath;
  private dinner: FamilyDinner;
  private label=document.createElement('div');
  private tools: Entity[]=[];
  private route: Vec3[]=[];
  private loaded=false;
  private height=1.798485;
  private state:State='idle';
  private purpose='seat';
  private time=0;
  private until=1;
  private transitionStart=0;
  private day=0;
  private target:string|null=null;
  private seen=new Map<string,number>();
  private speech='';
  private speechUntil=0;
  private nextSpeech=6;
  private lineIndex=0;
  private patrolIndex=0;
  private cleaned=0;
  private standCount=0;
  private sitCount=0;
  private visited=new Set<string>();
  private velocity=new Vec3();
  private blockedFor=0;
  private nextScan=0;
  constructor(private app:Application,private house:Bedroom,private daily:DailyLife){
    this.root=new Entity('Marc',app);app.root.addChild(this.root);this.root.setPosition(3.5,.09,6.2);
    this.visual=new Entity('Marc visual',app);this.root.addChild(this.visual);
    const placeholder=new Entity('Marc loading',app);this.visual.addChild(placeholder);
    this.animator=new CharacterAnimator(this.visual,placeholder);this.planner=new HousePath(house,.25);
    this.dinner=new FamilyDinner(app,house,daily,this.root,this.visual,this.animator,text=>this.say(text));
    this.label.id='marc-label';this.label.className='lilah-label marc-label';this.label.hidden=true;document.querySelector('#game')!.append(this.label);
    const colors=['#cda678','#c5d9dd','#b8c39d'];
    for(let i=0;i<3;i++){
      const tool=new Entity(['Marc toy tidy','Marc wiping cloth','Marc crumb brush'][i],app);this.root.addChild(tool);const shape=primitives(app,tool);
      shape('Dad cleanup tool','box',[0,0,0],i===0?[.25,.16,.23]:i===1?[.3,.025,.23]:[.3,.07,.13],material('Dad tool '+i,colors[i]));
      if(i===2)shape('Brush handle','capsule',[0,.18,0],[.055,.35,.055],material('Brush wood','#ac8158'));
      tool.enabled=false;this.tools.push(tool);
    }
    void this.load().catch(error=>console.error('Marc could not load:',error));
  }
  private async load(){
    const config=await(await fetch(assetUrl(`${import.meta.env.BASE_URL}assets/characters/arianna/character.json`))).json();this.height=config.height*1.3;
    const asset=new Asset('Marc animation v2','container',{url:assetUrl(`${import.meta.env.BASE_URL}assets/characters/marc/marc.glb`)});
    await new Promise<void>((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);this.app.assets.add(asset);this.app.assets.load(asset);});
    const resource=asset.resource as ContainerResource & {animations:Asset[]};
    const model=resource.instantiateRenderEntity({castShadows:true}),source=resource.animations.map(a=>a.resource as AnimTrack);
    const required=(name:string)=>{const track=source.find(t=>t.name===name);if(!track)throw Error('Missing Marc clip '+name);return track;};
    for(const name of ['SitDown','SitIdle','StandUp','Idle','Walk_Basic'])required(name);
    const walk=required('Walk_Basic'),idle=required('Idle');
    const tracks=[...source,new AnimTrack('Walk',walk.duration,walk.inputs,walk.outputs,walk.curves)];
    const carry=required('CarryWalk'),carryOutputs=carry.outputs.map(o=>new AnimData(o.components,Array.from(o.data,(v,i)=>o.data[i%o.components])));
    tracks.push(new AnimTrack('CarryIdle',carry.duration,carry.inputs,carryOutputs,carry.curves));
    // A modest runtime torso bend for cleanup; this is not an authored source animation.
    const outputs=idle.outputs.map(o=>new AnimData(o.components,Array.from(o.data)));
    for(const curve of idle.curves){
      const paths=curve.paths as unknown as {entityPath:string[];propertyPath:string[]}[];
      if(paths.some(p=>p.entityPath.at(-1)==='Spine02'&&p.propertyPath[0]==='localRotation')){
        const data=outputs[curve.output].data;
        for(let i=0;i<data.length;i+=4){const q=new Quat(data[i],data[i+1],data[i+2],data[i+3]).mul(new Quat().setFromEulerAngles(24,0,0));data[i]=q.x;data[i+1]=q.y;data[i+2]=q.z;data[i+3]=q.w;}
      }
    }
    tracks.push(new AnimTrack('Cleaning',idle.duration,idle.inputs,outputs,idle.curves));
    const manifest:CharacterManifest={animations:tracks.map(t=>({name:t.name,duration_seconds:t.duration,loop:!['SitDown','StandUp'].includes(t.name)})),locomotion:{Walk:{travel_speed_mps:1.2},CarryWalk:{travel_speed_mps:1.05}},interaction_events:{},scale:{rest_height_m:1.8},hand_joints:['LeftHand','RightHand'],walk_playback:1};
    const alignment=new Entity('Marc ground alignment',this.app);this.visual.addChild(alignment);alignment.addChild(model);
    model.setLocalScale(this.height/1.8,this.height/1.8,this.height/1.8);this.animator.attach(model,tracks,manifest,this.height/1.8);
    this.grounding=new CharacterGrounding(this.house.root,this.root,alignment);this.loaded=true;
  }
  private say(text:string){this.speech=text;this.label.textContent=text;this.speechUntil=performance.now()+3800;this.nextSpeech=this.time+24;}
  private go(point:Vec3,purpose:string){
    const start=this.root.getPosition().clone();start.y=0;this.route=this.planner.route(start,point);this.purpose=purpose;
    if(this.route.length){this.state='walking';this.animator.setIdleClip('Idle');return true;}return false;
  }
  private mess(){return this.daily.lilahMesses.snapshot().messes.find(m=>m.id===this.target&&!m.done);}
  private approachMess(){
    const m=this.mess();if(!m)return false;
    const p=this.root.getPosition(),candidates:Vec3[]=[];
    for(const radius of [.65,.85])for(let i=0;i<12;i++){const a=i*Math.PI/6,v=new Vec3(m.x+Math.cos(a)*radius,0,m.z+Math.sin(a)*radius);if(this.planner.free(v.x,v.z))candidates.push(v);}
    candidates.sort((a,b)=>a.distance(p)-b.distance(p));for(const point of candidates)if(this.go(point,'mess'))return true;return false;
  }
  private stand(){this.state='standing-up';this.transitionStart=this.time;this.until=this.time+1;this.animator.setIdleClip('Idle');this.animator.playAction('StandUp',1);this.standCount++;}
  private settle(){this.state='idle';this.until=this.time+4;this.target=null;this.animator.setIdleClip('Idle');this.animator.faceTowards(null);this.tools.forEach(t=>t.enabled=false);}
  update(dt:number,elapsed:number,visible:boolean,active:boolean,arianna:Vec3,lilah:Vec3,playerTarget:string|null,camera:Entity){
    this.root.enabled=visible&&this.loaded;this.label.hidden=true;if(!this.root.enabled||document.hidden)return;
    if(!active){this.animator.update(0,new Vec3(),Math.max(elapsed,.001));return;}
    this.time+=dt;this.velocity.set(0,0,0);
    if(this.day!==this.daily.clock.state.day){this.day=this.daily.clock.state.day;this.seen.clear();this.target=null;if(this.state==='cleaning')this.settle();}
    if(this.dinner.due()&&!this.target&&this.state==='seated')this.stand();
    const dining=this.dinner.update(dt,!this.target&&['idle','walking'].includes(this.state)&&!this.animator.busy,[arianna,lilah],this.velocity);
    if(dining){this.route=[];this.state='idle';this.target=null;this.until=this.time+4;this.tools.forEach(t=>t.enabled=false);}
    else {
    const messes=this.daily.lilahMesses.snapshot().messes;
    for(const m of messes)if(!this.seen.has(m.id))this.seen.set(m.id,this.time);
    const eligible=()=>messes.find(m=>!m.done&&m.id!==playerTarget&&Math.hypot(m.x-arianna.x,m.z-arianna.z)>1.65&&this.time-(this.seen.get(m.id)??this.time)>8);
    if(!this.target&&this.time>=this.nextScan&&this.state!=='sitting-down'&&this.state!=='standing-up'){
      this.nextScan=this.time+1;
      const m=eligible();if(m){this.target=m.id;if(this.state==='seated'){this.say('Just sat down. The tiny boss has other plans!');this.stand();}else if(!this.approachMess())this.target=null;}
    }
    const m=this.mess();
    if(this.target&&this.state!=='standing-up'&&(!m||playerTarget===this.target||Math.hypot(m.x-arianna.x,m.z-arianna.z)<1.35)){
      this.route=[];if(m&&playerTarget===this.target)this.say('You’ve got this, sweetie. I’ll be over here.');this.settle();
    }
    if(this.state==='walking'){
      const p=this.root.getPosition(),next=this.route[0];
      if(!next){this.state='idle';this.until=this.time;}
      else{
        const dx=next.x-p.x,dz=next.z-p.z,distance=Math.hypot(dx,dz),step=Math.min(distance,1.2*dt);
        const x=p.x+dx/Math.max(distance,.001)*step,z=p.z+dz/Math.max(distance,.001)*step;
        if(Math.hypot(x-arianna.x,z-arianna.z)>.6&&Math.hypot(x-lilah.x,z-lilah.z)>.48&&this.planner.free(x,z)){
          this.blockedFor=0;if(dt>0)this.velocity.set((x-p.x)/dt,0,(z-p.z)/dt);this.root.setPosition(x,p.y,z);
          if(distance<=step+.00001){this.route.shift();if(!this.route.length){
            if(this.purpose==='seat'){
              this.state='sitting-down';this.transitionStart=this.time;this.until=this.time+1.3;this.visual.setLocalEulerAngles(0,propYaw('marc-seat',YAW),0);this.animator.setIdleClip('SitIdle');this.animator.playAction('SitDown',1.3);this.sitCount++;
            }else if(this.purpose==='mess'&&this.mess()){
              this.state='cleaning';this.transitionStart=this.time;this.until=this.time+3;this.animator.setIdleClip('Cleaning');const mess=this.mess()!;this.animator.faceTowards(new Vec3(mess.x,0,mess.z));this.say(['These blocks are plotting against my feet.','Ah, floor juice. My least favorite flavor.','Crumbs: the glitter of snack time.'][Number(mess.id.at(-1))]);
            }else{this.state='idle';this.until=this.time+6;}
          }}
        }else{this.blockedFor+=dt;if(this.blockedFor>2){this.route=[];this.target=null;this.state='idle';this.until=this.time+3;this.blockedFor=0;}}
      }
    }else if(this.state==='sitting-down'||this.state==='standing-up'){
      const down=this.state==='sitting-down',t=Math.min(1,(this.time-this.transitionStart)/(down?1.3:1)),smooth=t*t*(3-2*t);
      const p=new Vec3().lerp(propPoint('marc-seat',down?ENTRY:SEATED),propPoint('marc-seat',down?SEATED:ENTRY),smooth);this.root.setPosition(p.x,.09,p.z);this.visual.setLocalEulerAngles(0,propYaw('marc-seat',YAW),0);
      if(this.time>=this.until&&!this.animator.busy){
        if(down){this.state='seated';this.until=this.time+18;}
        else{this.state='idle';this.until=this.time+1;if(this.target&&!this.approachMess())this.target=null;}
      }
    }else if(this.state==='cleaning'){
      const mess=this.mess();if(mess){
        const i=Number(mess.id.at(-1)),tool=this.tools[i];tool.enabled=true;tool.setPosition(mess.x+Math.sin(this.time*8)*.16,.1+ (i===0?.05:0),mess.z+Math.cos(this.time*5)*.12);
        if(this.time>=this.until){if(this.daily.lilahMesses.complete(mess.id,'marc')){this.cleaned++;this.say('All tidy, sweetie. Until the sequel.');}this.settle();}
      }
    }else if(this.state==='seated'){
      if(this.time>=this.until)this.stand();
    }else if(this.time>=this.until){
      if(this.purpose==='seat'||this.purpose==='mess'){const point=PATROL[this.patrolIndex++%PATROL.length];if(!this.go(new Vec3(point[0],0,point[1]),'wander'))this.until=this.time+3;}
      else if(!this.go(propPoint('marc-seat',ENTRY),'seat'))this.until=this.time+3;
    }
    // The first destination is the chair, so a later Lilah incident can interrupt a real rest.
    if(this.time<2&&this.state==='idle'){this.go(propPoint('marc-seat',ENTRY),'seat');}
    if(this.time>=this.nextSpeech&&arianna.distance(this.root.getPosition())<5&&this.state!=='cleaning')this.say(REMARKS[this.lineIndex++%REMARKS.length]);
    }
    this.grounding?.update();this.animator.update(dt,this.velocity,elapsed);
    const p=this.root.getPosition(),room=HOUSE_ROOMS.find(r=>p.x>=r.minX&&p.x<=r.maxX&&p.z>=r.minZ&&p.z<=r.maxZ);if(room)this.visited.add(room.id);
    const screen=camera.camera!.worldToScreen(new Vec3(p.x,p.y+this.height+.1,p.z)),viewport=document.querySelector('#game')!.getBoundingClientRect();
    this.label.hidden=performance.now()>this.speechUntil||screen.x<0||screen.x>viewport.width||screen.y<135||screen.y>viewport.height-145;
    this.label.style.transform=`translate(${Math.max(6,Math.min(viewport.width-this.label.offsetWidth-6,screen.x-this.label.offsetWidth/2))}px,${screen.y-this.label.offsetHeight}px)`;
  }
  snapshot(){return {dinner:this.dinner.snapshot(),loaded:this.loaded,height:this.height,position:this.root.getPosition().toArray(),state:this.state,target:this.target,route:this.route.map(p=>p.toArray()),speech:this.speech,cleaned:this.cleaned,sitCount:this.sitCount,standCount:this.standCount,visited:[...this.visited],animation:this.animator.snapshot(),seat:{center:SEAT.toArray(),entry:ENTRY.toArray(),anchor:SEATED.toArray()}};}
  geometry(){return this.animator.geometrySnapshot();}
  destroy(){this.dinner.destroy();this.label.remove();this.root.destroy();}
}
