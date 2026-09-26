import {AnimCurve,AnimData,AnimTrack,Quat,Vec3,INTERPOLATION_LINEAR,type Entity} from 'playcanvas';
import type {FishingMotion} from './FishingRetarget';
/** Lower-body jump motion only. Keep Arianna's authored upper-body pose and original rig. */
export function jumpTrack(model:Entity,idle:AnimTrack,data:FishingMotion){
 type Path={entityPath:string[];component:string;propertyPath:string[]};
 const channels=idle.curves.flatMap(c=>(c.paths as unknown as Path[]).map(path=>({path,node:model.findByName(path.entityPath.at(-1)!)!,prop:path.propertyPath[0],v:idle.outputs[c.output].data})));
 const saved=channels.map(c=>({p:c.node.getLocalPosition().clone(),q:c.node.getLocalRotation().clone(),s:c.node.getLocalScale().clone()}));
 const neutral=()=>channels.forEach(c=>{if(c.prop==='localRotation')c.node.setLocalRotation(c.v[0],c.v[1],c.v[2],c.v[3]);else if(c.prop==='localPosition')c.node.setLocalPosition(c.v[0],c.v[1],c.v[2]);});
 neutral();const node=(n:string)=>model.findByName(n)!,hip=node('Hips'),ankle=(node('LeftFoot').getPosition().y+node('RightFoot').getPosition().y)/2;
 const feet=['Left','Right'].map(s=>node(s+'Foot').getRotation().clone());
 const clip=data.clips.Jump_Full_Short,output=channels.map(()=>[] as number[]),source=(positions:number[][],name:string)=>new Vec3(...positions[data.bones.indexOf(name)]);
 const baseAnkle=(source(clip.positions[0],'foot.l').y+source(clip.positions[0],'foot.r').y)/2;
 for(const [f,positions] of clip.positions.entries()){
  neutral();
  for(const [side,suffix] of [['Left','l'],['Right','r']])for(const [bone,child,src,end] of [['UpLeg','Leg','upperleg','lowerleg'],['Leg','Foot','lowerleg','foot']]){
   const a=node(side+bone),b=node(side+child),from=b.getPosition().clone().sub(a.getPosition()).normalize(),to=source(positions,end+'.'+suffix).sub(source(positions,src+'.'+suffix)).normalize();
   a.setRotation(new Quat().mul2(new Quat().setFromDirections(from,to),a.getRotation()));
  }
  ['Left','Right'].forEach((s,i)=>node(s+'Foot').setRotation(feet[i]));
  const footY=(node('LeftFoot').getPosition().y+node('RightFoot').getPosition().y)/2;
  const sourceY=(source(positions,'foot.l').y+source(positions,'foot.r').y)/2;
  const p=hip.getPosition().clone();p.y+=ankle+(sourceY-baseAnkle)*1.8-footY;hip.setPosition(p);
  channels.forEach((c,i)=>{const v=c.prop==='localRotation'?c.node.getLocalRotation():c.prop==='localScale'?c.node.getLocalScale():c.node.getLocalPosition();output[i].push(v.x,v.y,v.z);if(v instanceof Quat)output[i].push(v.w);});
 }
 channels.forEach((c,i)=>{c.node.setLocalPosition(saved[i].p);c.node.setLocalRotation(saved[i].q);c.node.setLocalScale(saved[i].s);});
 return new AnimTrack('JourneyJump',clip.duration,[new AnimData(1,clip.frames.map((_,i)=>Math.min(clip.duration,i/clip.fps)))],output.map((v,i)=>new AnimData(channels[i].prop==='localRotation'?4:3,v)),channels.map((c,i)=>new AnimCurve([c.path] as unknown as string[],0,i,INTERPOLATION_LINEAR)));
}
