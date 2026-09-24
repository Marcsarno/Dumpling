import {AnimCurve,AnimData,AnimTrack,Entity,Quat,Vec3,INTERPOLATION_LINEAR,type GraphNode} from 'playcanvas';
export interface FishingMotion {bones:string[];rest:number[][];clips:Record<string,{duration:number;fps:number;frames:number[][][];positions:number[][][]}>}
/** Retarget CC0 KayKit world-space rotation deltas onto Arianna's original bind pose.
 * Her armature, skin weights, locomotion and body proportions remain unchanged. */
export function fishingTracks(model:Entity,idle:AnimTrack,data:FishingMotion){
 const map:Record<string,string>={'spine':'Spine01','chest':'Spine02','head':'Head','upperarm.l':'LeftArm','lowerarm.l':'LeftForeArm','wrist.l':'LeftHand','upperarm.r':'RightArm','lowerarm.r':'RightForeArm','wrist.r':'RightHand'};
 const targets=Object.entries(map).map(([source,name])=>{const node=model.findByName(name)!;return{index:data.bones.indexOf(source),node,rest:node.getRotation().clone()};});
 const nodes:GraphNode[]=[];const visit=(n:GraphNode)=>{nodes.push(n);n.children.forEach(visit);};visit(model);
 const bind=nodes.map(n=>({p:n.getLocalPosition().clone(),q:n.getLocalRotation().clone(),s:n.getLocalScale().clone()}));
 const restore=()=>nodes.forEach((n,i)=>{n.setLocalPosition(bind[i].p);n.setLocalRotation(bind[i].q);n.setLocalScale(bind[i].s);});
 type Path={entityPath:string[];component:string;propertyPath:string[]};
 const channels=idle.curves.flatMap(c=>(c.paths as unknown as Path[]).map(path=>({path,node:model.findByName(path.entityPath.at(-1)!)!,values:idle.outputs[c.output].data,prop:path.propertyPath[0]})));
 const variants={...data.clips,Fishing_Left:data.clips.Fishing_Reeling,Fishing_Right:data.clips.Fishing_Reeling};
 const tracks=Object.entries(variants).map(([name,clip])=>{
  const output=channels.map(()=>[] as number[]);
  for(const [frameIndex,frame] of clip.frames.entries()){restore();
   for(const t of targets){const source=new Quat(...frame[t.index]),inverse=new Quat(...data.rest[t.index]).invert();t.node.setRotation(new Quat().mul2(new Quat().mul2(source,inverse),t.rest));}
   // The packs have different arm bind poses. Match the captured shoulder/elbow
   // directions as well as rotations, retaining Arianna's own segment lengths.
   const positions=clip.positions[frameIndex];
   for(const [side,suffix] of [['Left','l'],['Right','r']])for(const [bone,child,source,next] of [['Arm','ForeArm','upperarm','lowerarm'],['ForeArm','Hand','lowerarm','wrist']]){
    const node=model.findByName(side+bone)!,tip=model.findByName(side+child)!;
    const a=new Vec3(...positions[data.bones.indexOf(source+'.'+suffix)]),b=new Vec3(...positions[data.bones.indexOf(next+'.'+suffix)]);
    const from=tip.getPosition().clone().sub(node.getPosition()).normalize(),to=b.sub(a).normalize();
    node.setRotation(new Quat().mul2(new Quat().setFromDirections(from,to),node.getRotation()));
   }
   if(name!=='Fishing_Catch'){
    // Fit the supporting hand to the same rod on a child-sized rig. The main
    // casting/reeling motion still comes from the captured right arm and torso.
    const arm=model.findByName('LeftArm')!,fore=model.findByName('LeftForeArm')!,hand=model.findByName('LeftHand')!,right=model.findByName('RightHand')!;
    const origin=arm.getPosition().clone(),target=right.getPosition().clone().add(new Vec3(0,.14,.12));
    const upper=origin.distance(fore.getPosition()),lower=fore.getPosition().distance(hand.getPosition()),dir=target.clone().sub(origin),length=Math.min(dir.length(),upper+lower-.002);dir.normalize();
    const pole=new Vec3(1,-.6,-.3);pole.sub(dir.clone().mulScalar(pole.dot(dir))).normalize();const along=(upper*upper-lower*lower+length*length)/(2*length);
    const elbow=origin.clone().add(dir.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,upper*upper-along*along))));
    for(const [node,tip,point] of [[arm,fore,elbow],[fore,hand,target]] as const){const from=tip.getPosition().clone().sub(node.getPosition()).normalize(),to=point.clone().sub(node.getPosition()).normalize();node.setRotation(new Quat().mul2(new Quat().setFromDirections(from,to),node.getRotation()));}
   }
   if(name==='Fishing_Left'||name==='Fishing_Right'){const spine=model.findByName('Spine01')!;spine.setLocalRotation(new Quat().mul2(spine.getLocalRotation(),new Quat().setFromEulerAngles(0,name==='Fishing_Left'?-6:6,name==='Fishing_Left'?7:-7)));}
   channels.forEach((c,i)=>{if(c.prop==='localRotation'){const q=c.node.getLocalRotation();output[i].push(q.x,q.y,q.z,q.w);}else output[i].push(...Array.from(c.values).slice(0,3));});
  }
  return new AnimTrack(name,clip.duration,[new AnimData(1,clip.frames.map((_,i)=>Math.min(clip.duration,i/clip.fps)))],output.map((v,i)=>new AnimData(channels[i].prop==='localRotation'?4:3,v)),channels.map((c,i)=>new AnimCurve([c.path] as unknown as string[],0,i,INTERPOLATION_LINEAR)));
 });restore();return tracks;
}
