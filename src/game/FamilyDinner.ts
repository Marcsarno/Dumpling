import {Asset,BoundingBox,Entity,Vec3,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import {propPoint,propYaw} from '../editor/PropSpace';
import {HousePath} from '../components/HousePath';
import type {CharacterAnimator} from '../components/CharacterAnimator';
import type {Bedroom} from './bedroom';
import type {DailyLife} from './DailyLife';
import {material,primitives} from './primitives';

/** One saved dinner per day, using the same collision-aware walking as the household. */
export class FamilyDinner {
 readonly tray:Entity;readonly socket:Entity;
 private models:Entity[]=[];private ready=false;private day=0;private stage='idle';private route:Vec3[]=[];private goal=new Vec3();private timer=0;private blocked=0;private retry=0;
 private planner:HousePath;private serving='pizza';
 constructor(private app:Application,private house:Bedroom,private daily:DailyLife,private root:Entity,private visual:Entity,private animator:CharacterAnimator,private say:(s:string)=>void){
  this.planner=new HousePath(house,.25);this.socket=new Entity('Dad serving hands',app);visual.addChild(this.socket);animator.bindCarrySocket(this.socket);
  this.tray=new Entity('Family dinner',app);house.root.addChild(this.tray);this.tray.enabled=false;
  primitives(app,this.tray)('Dinner platter','cylinder',[0,0,0],[.72,.025,.58],material('Dinner china','#fff2d9'),false);
  void Promise.all(['pizza','taco','turkey'].map(async name=>{
   const a=new Asset('Family '+name,'container',{url:assetUrl(`/assets/food/${name}.glb`)});app.assets.add(a);await new Promise<void>((resolve,reject)=>{a.once('load',resolve);a.once('error',reject);app.assets.load(a);});
   const model=(a.resource as ContainerResource).instantiateRenderEntity({castShadows:true}),bounds=new BoundingBox();let first=true;
   for(const r of model.findComponents('render') as RenderComponent[])for(const m of r.meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
   const scale=.57/(bounds.halfExtents.x*2);model.setLocalScale(scale,scale,scale);model.setLocalPosition(-bounds.center.x*scale,.02-(bounds.center.y-bounds.halfExtents.y)*scale,-bounds.center.z*scale);model.name=name;this.tray.addChild(model);model.enabled=false;return model;
  })).then(models=>{this.models=models;this.ready=true;}).catch(e=>console.error('Dinner models failed',e));
 }
 private table(){this.tray.reparent(this.house.root);this.tray.setPosition(propPoint('dining',new Vec3(.55,.99,14.35)));this.tray.setEulerAngles(0,propYaw('dining',0),0);this.tray.enabled=true;}
 private go(p:Vec3,stage:string){const at=this.root.getPosition();this.goal.copy(p);this.route=this.planner.route(new Vec3(at.x,0,at.z),p);this.stage=stage;this.blocked=0;return this.route.length>0;}
 private finish(){this.stage='idle';this.route=[];this.animator.setCarrying(false);this.animator.setIdleClip('Idle');this.animator.cancelAction();this.animator.faceTowards(null);this.retry=15;}
 get active(){return this.stage!=='idle';}
 due(){const s=this.daily.clock.state;return this.ready&&!s.dinnerServed&&s.phase==='afternoon'&&s.minutes>=930+(s.day*37)%90&&s.minutes<1140&&this.retry<=0;}
 update(dt:number,canStart:boolean,people:Vec3[],velocity:Vec3){
  const s=this.daily.clock.state;this.retry=Math.max(0,this.retry-dt);
  if(this.day!==s.day){this.day=s.day;this.finish();this.retry=0;this.tray.enabled=false;this.serving=['pizza','taco','turkey'][(s.day-1)%3];this.models.forEach(m=>m.enabled=m.name===this.serving);if(s.dinnerServed)this.table();}
  if(!this.ready)return false;
  this.models.forEach(m=>m.enabled=m.name===this.serving);
  if(this.stage==='idle'){
   if(s.dinnerServed&&!this.tray.enabled)this.table();
   if(!canStart||!this.due())return false;
   if(!this.go(propPoint('fridge',new Vec3(-1.65,0,14.55)),'fetch')){this.finish();return false;}
   this.say(['I’ll put some pizza out for us.','Taco night! I’ll set the table.','Something warm for dinner today.'][(s.day-1)%3]);
  }
  if(['fetch','carry','seat'].includes(this.stage)){
   const p=this.root.getPosition(),next=this.route[0];
   if(next){const delta=new Vec3(next.x-p.x,0,next.z-p.z),distance=delta.length(),step=Math.min(distance,dt*1.05);delta.normalize();const q=p.clone().add(delta.clone().mulScalar(step));
    if(people.some(v=>Math.hypot(v.x-q.x,v.z-q.z)<.6)||!this.planner.free(q.x,q.z)){this.blocked+=dt;if(this.blocked>3){this.route=this.planner.route(new Vec3(p.x,0,p.z),this.goal);this.blocked=0;}return true;}
    this.root.setPosition(q.x,.09,q.z);if(dt>0)velocity.copy(delta).mulScalar(step/dt);if(distance<=step+.01)this.route.shift();return true;
   }
   if(Math.hypot(p.x-this.goal.x,p.z-this.goal.z)>.5){this.tray.enabled=!!s.dinnerServed;this.finish();return false;}
   if(this.stage==='fetch'){this.stage='pickup';this.timer=1.4;this.animator.setIdleClip('Cleaning');this.animator.faceTowards(propPoint('fridge',new Vec3(-2.65,1,14.55)));}
   else if(this.stage==='carry'){this.stage='place';this.timer=1.1;this.animator.faceTowards(propPoint('dining',new Vec3(.55,1,13.85)));}
   else{this.stage='sitting';this.timer=1.3;this.visual.setLocalEulerAngles(0,propYaw('dining',180),0);this.animator.setIdleClip('SitIdle');this.animator.playAction('SitDown',1.3);}
  }else{
   this.timer-=dt;
   if(this.stage==='sitting'||this.stage==='standing'){const down=this.stage==='sitting',t=Math.max(0,Math.min(1,1-this.timer/(down?1.3:1.2))),z=down?15.65-.55*t:15.1+.55*t;this.root.setPosition(propPoint('dining',new Vec3(.55,.09,z)));}
   if(this.timer>0)return true;
   if(this.stage==='pickup'){this.animator.faceTowards(null);this.animator.setIdleClip('Idle');this.animator.setCarrying(true);this.tray.reparent(this.socket);this.tray.setLocalPosition(0,.035,.06);this.tray.setLocalEulerAngles(0,0,0);this.tray.enabled=true;if(!this.go(propPoint('dining',new Vec3(.55,0,15.65)),'carry')){this.tray.enabled=false;this.finish();}}
   else if(this.stage==='place'){this.animator.setCarrying(false);this.animator.faceTowards(null);this.table();s.dinnerServed=true;this.daily.save();this.say('Dinner is ready whenever you are, sweetie.');this.stage='sitting';this.timer=1.3;this.visual.setLocalEulerAngles(0,propYaw('dining',180),0);this.animator.setIdleClip('SitIdle');this.animator.playAction('SitDown',1.3);}
   else if(this.stage==='sitting'){this.stage='seated';this.timer=12+(s.day%4)*2;this.root.setPosition(propPoint('dining',new Vec3(.55,.09,15.1)));}
   else if(this.stage==='seated'){this.stage='standing';this.timer=1.2;this.animator.setIdleClip('Idle');this.animator.playAction('StandUp',1.2);}
   else if(this.stage==='standing'){this.root.setPosition(propPoint('dining',new Vec3(.55,.09,15.65)));this.finish();return false;}
  }
  return true;
 }
 snapshot(){return{ready:this.ready,stage:this.stage,food:this.serving,served:!!this.daily.clock.state.dinnerServed,position:this.tray.getPosition().toArray(),visible:this.tray.enabled,route:this.route.map(p=>p.toArray())};}
 destroy(){this.tray.destroy();this.socket.destroy();}
}
