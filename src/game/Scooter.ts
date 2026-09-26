import {Asset,Entity,Quat,Vec3,type Application,type ContainerResource,type GraphNode} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
export class Scooter {
 readonly root:Entity;ready=false;error='';private loading=false;private model?:Entity;
 private steering?:GraphNode;private wheels:GraphNode[]=[];private roll=0;private time=0;
 private button=document.createElement('button');private stop=document.createElement('button');
 constructor(private app:Application,private character:ReturnType<typeof createCharacter>,private controller:PlayerController){
  this.root=new Entity('Arianna’s maple scooter',app);app.root.addChild(this.root);this.root.setPosition(-6.5,.03,7.1);this.root.setEulerAngles(0,-90,0);this.root.enabled=false;
  this.button.id='scooter-toggle';this.button.className='journey-button';this.button.textContent='🛴 Ride scooter';this.button.hidden=true;
  this.stop.id='scooter-brake';this.stop.className='journey-button';this.stop.textContent='✋ Brake';this.stop.hidden=true;
  const game=document.querySelector('#game')!;game.append(this.button,this.stop);
  this.button.onclick=()=>this.toggle();this.stop.onpointerdown=()=>{controller.reset();this.character.animator.setWorkClip('ScooterCoast');};
  const style=document.createElement('style');style.textContent='.journey-button{position:absolute;z-index:30;bottom:162px;right:18px;min-height:48px;padding:10px 18px;border:2px solid #fff8ed;border-radius:24px;background:#dcebe1;color:#46534d;box-shadow:0 3px 12px #39463325;font:bold 14px system-ui;touch-action:none}.journey-button[hidden]{display:none}#scooter-brake{right:180px;background:#eee3f5}';game.append(style);
  app.on('prerender',this.fitHands,this);
 }
 private async load(){
  if(this.loading||this.ready)return;this.loading=true;
  try{const asset=new Asset('Maple kick scooter','container',{url:assetUrl('assets/outdoors/maple-scooter.glb')});this.app.assets.add(asset);await new Promise<void>((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);this.app.assets.load(asset);});
   this.model=(asset.resource as ContainerResource).instantiateRenderEntity();this.root.addChild(this.model);this.steering=this.model.findByName('Steering pivot')!;this.wheels=['Rear wheel','Front wheel'].map(n=>this.model!.findByName(n)!);this.ready=true;
  }catch(e){this.error=String(e);console.error('Scooter failed to load',e);}finally{this.loading=false;}
 }
 toggle(){
  if(!this.ready||this.character.placeholder.enabled)return;
  if(this.controller.riding){this.dismount();return;}
  const p=this.character.player.getPosition();if(p.distance(this.root.getPosition())>1.6)return;
  this.controller.reset();this.controller.riding=true;this.controller.scooter.reset(-Math.PI/2);this.time=0;
  this.character.animator.setWorkClip('ScooterCoast');
 }
 dismount(){
  this.controller.riding=false;this.controller.reset();this.character.animator.setWorkClip(null);this.character.visual.setLocalEulerAngles(0,this.controller.scooter.heading*180/Math.PI,0);this.character.grounding!.surfaceHeight=null;
 }
 update(dt:number,outside:boolean,available=true,hop=0){
  if(outside)void this.load();
  if(!outside&&this.controller.riding)this.dismount();
  this.root.enabled=outside&&this.ready;
  const riding=this.controller.riding,p=this.character.player.getPosition();
  this.button.hidden=!outside||!available||!this.ready||(!riding&&p.distance(this.root.getPosition())>1.6);this.button.textContent=riding?'🚶 Walk instead':'🛴 Ride scooter';this.stop.hidden=!riding||!available;
  if(!riding)return;
  const sim=this.controller.scooter;this.time+=dt;
  const ground=(p.z<-16||p.x<-9?.08:.03)+hop;
  this.character.grounding!.surfaceHeight=ground+.192;
  const yaw=sim.heading*180/Math.PI,lean=sim.lean*180/Math.PI;
  this.root.setPosition(p.x,ground,p.z);this.root.setEulerAngles(0,yaw,-lean);
  this.character.visual.setLocalEulerAngles(0,yaw,-lean);
  this.steering?.setLocalEulerAngles(0,sim.steer*180/Math.PI,0);
  this.roll+=Math.hypot(sim.vx,sim.vz)*dt/.113*180/Math.PI;for(const wheel of this.wheels)wheel.setLocalEulerAngles(this.roll,0,0);
  const pushing=this.controller.input.length()>.3&&Math.hypot(sim.vx,sim.vz)<3;
  this.character.animator.setWorkClip(pushing?'ScooterPush':'ScooterCoast');
 }
 private fitHands(){
  if(!this.controller.riding||!this.steering)return;
  const model=this.character.visual.findComponents('anim')[0]?.entity;if(!model)return;
  const rotate=(a:GraphNode,b:GraphNode,target:Vec3)=>a.setRotation(new Quat().mul2(new Quat().setFromDirections(b.getPosition().clone().sub(a.getPosition()).normalize(),target.clone().sub(a.getPosition()).normalize()),a.getRotation()));
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1,arm=model.findByName(side+'Arm')!,fore=model.findByName(side+'ForeArm')!,hand=model.findByName(side+'Hand')!,wrist=hand.getRotation().clone();
   const target=this.steering.getWorldTransform().transformPoint(new Vec3(sign*.209,.913,-.185)),origin=arm.getPosition().clone(),a=origin.distance(fore.getPosition()),b=fore.getPosition().distance(hand.getPosition()),dir=target.clone().sub(origin),d=Math.min(dir.length(),a+b-.001);dir.normalize();
   const pole=this.root.getRotation().transformVector(new Vec3(sign*.65,-1,-.3));pole.sub(dir.clone().mulScalar(pole.dot(dir))).normalize();const along=(a*a-b*b+d*d)/(2*d);
   const elbow=origin.clone().add(dir.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,a*a-along*along))));rotate(arm,fore,elbow);rotate(fore,hand,origin.add(dir.mulScalar(d)));hand.setRotation(wrist);
  }
 }
 snapshot(){return{ready:this.ready,error:this.error,riding:this.controller.riding,position:this.root.getPosition().toArray(),heading:this.controller.scooter.heading,lean:this.controller.scooter.lean,steer:this.controller.scooter.steer,speed:Math.hypot(this.controller.scooter.vx,this.controller.scooter.vz)};}
 destroy(){this.app.off('prerender',this.fitHands,this);this.root.destroy();this.button.remove();this.stop.remove();}
}

