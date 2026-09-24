import {Asset,AnimCurve,AnimData,AnimTrack,BoundingBox,Entity,Quat,Vec3,StandardMaterial,INTERPOLATION_LINEAR,type Application,type ContainerResource,type GraphNode,type RenderComponent} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
const assets=new WeakMap<Application,Map<string,Promise<ContainerResource & {animations:Asset[]}>>>();
type Path={entityPath:string[];component:string;propertyPath:string[]};
/** Preserve the source skin and rig; bake chair fitting into each peaceful clip. */
function seatedTrack(model:Entity,source:AnimTrack,scale:number){
 const channels=source.curves.flatMap(curve=>(curve.paths as unknown as Path[]).map(path=>({curve,path,node:model.findByName(path.entityPath.at(-1)!)!})));
 const output=channels.map(()=>[] as number[]),times=Array.from({length:Math.ceil(source.duration*24)+1},(_,i)=>Math.min(source.duration,i/24));
 const sample=(time:number)=>{for(const {curve,path,node} of channels){const input=source.inputs[curve.input].data,data=source.outputs[curve.output],n=data.components;let a=0;while(a<input.length-2&&input[a+1]<=time)a++;const b=Math.min(a+1,input.length-1),t=input[b]===input[a]?0:Math.max(0,Math.min(1,(time-input[a])/(input[b]-input[a]))),v=data.data;
  if(path.propertyPath[0]==='localRotation')node.setLocalRotation(new Quat().slerp(new Quat(v[a*n],v[a*n+1],v[a*n+2],v[a*n+3]),new Quat(v[b*n],v[b*n+1],v[b*n+2],v[b*n+3]),t));
  else if(path.propertyPath[0]==='localPosition')node.setLocalPosition(v[a*n]*(1-t)+v[b*n]*t,v[a*n+1]*(1-t)+v[b*n+1]*t,v[a*n+2]*(1-t)+v[b*n+2]*t);
 }};
 const aim=(node:GraphNode,to:Vec3)=>{const from=node.getRotation().transformVector(Vec3.UP);node.setRotation(new Quat().mul2(new Quat().setFromDirections(from,to.clone().normalize()),node.getRotation()));};
 for(const time of times){sample(time);
  const legs=['L','R'].map(side=>{const upper=model.findByName('UpperLeg.'+side)!,lower=model.findByName('LowerLeg.'+side)!,foot=model.findByName('Foot.'+side)!;return{upper,lower,foot,length:lower.getPosition().distance(foot.getPosition()),rotation:foot.getRotation().clone()};});
  const body=model.findByName('Body')!,p=body.getPosition().clone();p.y+=.52/scale-legs[0].upper.getPosition().y;body.setPosition(p);
  for(const leg of legs){aim(leg.upper,new Vec3(0,-.08,1));aim(leg.lower,new Vec3(0,-1,0));leg.foot.setPosition(leg.lower.getPosition().clone().add(new Vec3(0,-leg.length,.035)));leg.foot.setRotation(leg.rotation);}
  for(const [i,{path,node}] of channels.entries()){const v=path.propertyPath[0]==='localRotation'?node.getLocalRotation():path.propertyPath[0]==='localScale'?node.getLocalScale():node.getLocalPosition();output[i].push(v.x,v.y,v.z);if(v instanceof Quat)output[i].push(v.w);}
 }
 return new AnimTrack(source.name,source.duration,[new AnimData(1,times)],output.map((v,i)=>new AnimData(channels[i].path.propertyPath[0]==='localRotation'?4:3,v)),channels.map((c,i)=>new AnimCurve([c.path] as unknown as string[],0,i,INTERPOLATION_LINEAR)));
}
export async function schoolPerson(app:Application,parent:Entity,file:string,name:string,height=1.38,seated=false){
 let cache=assets.get(app);if(!cache){cache=new Map();assets.set(app,cache);}if(!cache.has(file))cache.set(file,new Promise((resolve,reject)=>{const a=new Asset(name,'container',{url:assetUrl('assets/people/'+file+'.glb')});a.once('load',()=>resolve(a.resource as ContainerResource & {animations:Asset[]}));a.once('error',reject);app.assets.add(a);app.assets.load(a);}));
 const res=await cache.get(file)!,model=res.instantiateRenderEntity({castShadows:true}),bounds=new BoundingBox();let first=true;for(const render of model.findComponents('render') as RenderComponent[])for(const m of render.meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
 if(seated){model.findByName('Head')!.setLocalScale(1.20,1.20,1.20);const palette:Record<string,Record<string,string>>={jules:{Purple:'#9d88bf',LightBlue:'#587995',White:'#eee4d8'},remy:{LightBrown:'#9dbda6',Red_Dark:'#6c8d78',LightBlue:'#567188'},poppy:{White:'#ead2e6',Orange:'#b88aac',Grey:'#ede3d7'}};for(const render of model.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances){const color=palette[file]?.[mesh.material.name];if(color){const mat=mesh.material.clone() as StandardMaterial;mat.diffuse.fromString(color);mat.update();mesh.material=mat;}}}
 const scale=height/(bounds.halfExtents.y*2),tracks=res.animations.map(a=>a.resource as AnimTrack).map(t=>seated?seatedTrack(model,t,scale):t);
 const root=new Entity(name,app),sizing=new Entity('Proportional size',app);parent.addChild(root);root.addChild(sizing);sizing.addChild(model);sizing.setLocalScale(scale,scale,scale);if(!seated)sizing.setLocalPosition(-bounds.center.x*scale,-(bounds.center.y-bounds.halfExtents.y)*scale,-bounds.center.z*scale);
 model.addComponent('anim',{activate:true});for(const t of tracks)model.anim!.assignAnimation(t.name,t);model.anim!.baseLayer!.play('Idle_Neutral');
 let waving=false,until=0;
 return{root,model,height,scale,update(time:number,greeting=false){if(greeting&&!waving){model.anim!.baseLayer!.transition('Wave',.22);until=time+(tracks.find(t=>t.name==='Wave')?.duration??2);waving=true;}if(waving&&time>until){model.anim!.baseLayer!.transition('Idle_Neutral',.28);waving=false;}}};
}
