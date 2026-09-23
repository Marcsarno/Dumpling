import {assetUrl,containerOptions} from '../editor/AssetUrls';
import {Asset,BoundingBox,Entity,Quat,Texture,StandardMaterial,CULLFACE_NONE,type AnimTrack,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {TRADERS,type TradingDay} from '../data/trading';
import {dailyWish} from '../data/tradeHelp';

export function classroomSign(app:Application,parent:Entity,name:string,text:string,position:[number,number,number],width=1,height=.26,color='#5c496e'){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
 const texture=new Texture(app.graphicsDevice,{mipmaps:false});texture.setSource(canvas);
 const material=new StandardMaterial();material.diffuseMap=texture;material.emissiveMap=texture;material.emissive.set(.45,.45,.45);material.cull=CULLFACE_NONE;material.update();
 const sign=new Entity(name,app);parent.addChild(sign);sign.addComponent('render',{type:'plane',material,castShadows:false});sign.setLocalPosition(...position);sign.setLocalEulerAngles(90,0,0);sign.setLocalScale(width,1,height);
 const paint=(words:string)=>{const c=canvas.getContext('2d')!;c.fillStyle='#fff6df';c.fillRect(0,0,768,256);c.strokeStyle=color;c.lineWidth=16;c.strokeRect(10,10,748,236);c.fillStyle='#514365';c.textAlign='center';c.textBaseline='middle';c.font='bold 56px Trebuchet MS';words.split('\n').forEach((line,i,a)=>c.fillText(line,384,128+(i-(a.length-1)/2)*76,720));texture.upload();};paint(text);return paint;
}

/** CC0 Kenney classmates use the pack's seated pose, with small greeting gestures. */
export class Classmates {
 readonly ready:Promise<void>;readonly errors:string[]=[];loaded=0;private time=0;private last=0;
 private actors:{model:Entity;head:Entity;arm:Entity;headRest:Quat;armRest:Quat;id:string;hello:number;near:boolean}[]=[];
 private signs:((s:string)=>void)[]=[];
 constructor(private app:Application,parent:Entity,placements?:{x:number;z:number}[],showNames=true){
  const names=['character-male-a','character-female-b','character-female-f'];
  this.ready=Promise.all(TRADERS.map(async(t,i)=>{
   const x=placements?.[i].x??(i-1)*1.75,z=placements?.[i].z??-.74;
   if(showNames)this.signs[i]=classroomSign(app,parent,t.name+' nameplate',t.name+'\n'+t.title,[x,.92,z+1.12],1.0,.24,t.color);
   try{
    const path='/assets/characters/classmates/'+names[i]+'.glb';
    const asset=new Asset(t.name+' classmate','container',{url:assetUrl(path)},{},containerOptions(path));
    await new Promise<void>((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);app.assets.add(asset);app.assets.load(asset);});
    const resource=asset.resource as ContainerResource&{animations:Asset[]},model=resource.instantiateRenderEntity({castShadows:true});
    const bounds=new BoundingBox();let first=true;for(const r of model.findComponents('render'))for(const m of (r as RenderComponent).meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
    const scale=1.15/(2*bounds.halfExtents.y),sit=resource.animations.map(a=>a.resource as AnimTrack).find(a=>a.name==='sit')!;
    for(const curve of sit.curves)for(const path of curve.paths as unknown as {entityPath:string[];propertyPath:string[]}[]){const n=model.findByName(path.entityPath.at(-1)!)!,v=sit.outputs[curve.output].data;if(path.propertyPath[0]==='localRotation')n.setLocalRotation(v[0],v[1],v[2],v[3]);else if(path.propertyPath[0]==='localPosition')n.setLocalPosition(v[0],v[1],v[2]);}
    parent.addChild(model);model.setLocalScale(scale,scale,scale);model.setLocalPosition(x,.45-.02625*scale,z);
    const head=model.findByName('head') as Entity,arm=model.findByName('arm-right') as Entity;
    this.actors.push({model,head,arm,headRest:head.getLocalRotation().clone(),armRest:arm.getLocalRotation().clone(),id:t.id,hello:-10,near:false});this.loaded++;
   }catch(e){this.errors.push(t.name);console.error('Classmate failed to load',e);}
  })).then(()=>{});
 }
 sync(day:TradingDay){TRADERS.forEach((t,i)=>this.signs[i]?.(t.name+'\n'+(day.traders[t.id].done?'Thanks for trading!':'Wishes for '+dailyWish(day,t.id).name)));}
 attachLayout(group:Entity){
  const nodes=[...this.actors.map(a=>a.model),...TRADERS.map(t=>group.root.findByName(t.name+' nameplate') as Entity)];
  for(const node of nodes){const p=node.getLocalPosition().clone();node.reparent(group);node.setLocalPosition(p.x,p.y,p.z+.3);}
 }
 update(now:number,focus:string){const dt=this.last?Math.min(.04,(now-this.last)/1000):0;this.last=now;this.time+=dt;for(const a of this.actors){if(focus===a.id&&!a.near)a.hello=this.time;a.near=focus===a.id;const greeting=this.time-a.hello,wave=greeting<1.5?Math.sin(greeting*Math.PI/1.5)*.7:0;a.arm.setLocalRotation(new Quat().mul2(a.armRest,new Quat().setFromEulerAngles(0,0,wave*45+Math.sin(greeting*14)*wave*12)));a.head.setLocalRotation(new Quat().mul2(a.headRest,new Quat().setFromEulerAngles(Math.sin(this.time*1.4)*2,a.near?0:Math.sin(this.time*.5)*5,0)));}}
 snapshot(){return{loaded:this.loaded,errors:[...this.errors]};}
}
