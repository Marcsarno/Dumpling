import {AnimCurve,AnimData,AnimTrack,Quat,Vec3,INTERPOLATION_LINEAR,type Entity,type GraphNode} from 'playcanvas';
type Path={entityPath:string[];component:string;propertyPath:string[]};
/** Fit contact points on the original rig; never alter its bones or skin weights. */
export function scooterTracks(model:Entity,idle:AnimTrack){
 const channels=idle.curves.flatMap(c=>(c.paths as unknown as Path[]).map(path=>({path,node:model.findByName(path.entityPath.at(-1)!)!,data:idle.outputs[c.output],prop:path.propertyPath[0]})));
 const saved=channels.map(c=>({p:c.node.getLocalPosition().clone(),q:c.node.getLocalRotation().clone(),s:c.node.getLocalScale().clone()}));
 const neutral=()=>channels.forEach(c=>{const v=c.data.data;if(c.prop==='localRotation')c.node.setLocalRotation(v[0],v[1],v[2],v[3]);else if(c.prop==='localPosition')c.node.setLocalPosition(v[0],v[1],v[2]);});
 const bone=(n:string)=>model.findByName(n)!;
 const scale=1.1499067266;
 const aim=(node:GraphNode,child:GraphNode,p:Vec3)=>{const a=child.getPosition().clone().sub(node.getPosition()).normalize(),b=p.clone().sub(node.getPosition()).normalize();node.setRotation(new Quat().mul2(new Quat().setFromDirections(a,b),node.getRotation()));};
 function ik(upper:GraphNode,lower:GraphNode,tip:GraphNode,target:Vec3,pole:Vec3){
  const origin=upper.getPosition().clone(),a=origin.distance(lower.getPosition()),b=lower.getPosition().distance(tip.getPosition()),dir=target.clone().sub(origin),d=Math.max(.001,Math.min(dir.length(),a+b-.0005));dir.normalize();
  pole.sub(dir.clone().mulScalar(pole.dot(dir))).normalize();
  const along=(a*a-b*b+d*d)/(2*d),elbow=origin.clone().add(dir.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,a*a-along*along))));
  aim(upper,lower,elbow);aim(lower,tip,origin.add(dir.mulScalar(d)));
 }
 const tracks=['ScooterCoast','ScooterPush'].map(name=>{
  const duration=name==='ScooterPush'?1.15:2.4,times=Array.from({length:Math.ceil(duration*30)+1},(_,i)=>Math.min(duration,i/30)),output=channels.map(()=>[] as number[]);
  for(const time of times){neutral();
   const feet=['Left','Right'].map(side=>({side,foot:bone(side+'Foot'),q:bone(side+'Foot').getRotation().clone(),y:bone(side+'Foot').getPosition().y}));
   const hips=bone('Hips'),p=hips.getLocalPosition().clone();p.y-=.075/scale;p.z+=.012/scale;hips.setLocalPosition(p);
   const spine=bone('Spine02');spine.setLocalRotation(new Quat().mul2(spine.getLocalRotation(),new Quat().setFromEulerAngles(5,0,0)));
   const kick=name==='ScooterPush'?Math.max(0,Math.sin(time/duration*Math.PI*2)):0;
   for(const f of feet){
    const left=f.side==='Left',target=new Vec3((left?.065:-.065)/scale,f.y-(left?.005:.014)/scale,(left?.12:-.18)/scale);
    if(!left&&kick){target.x-=kick*.15/scale;target.y-=kick*.14/scale;target.z-=kick*.18/scale;}
    ik(bone(f.side+'UpLeg'),bone(f.side+'Leg'),f.foot,target,new Vec3(0,0,1));f.foot.setRotation(f.q);
   }
   for(const side of ['Left','Right']){
    const sign=side==='Left'?1:-1,hand=bone(side+'Hand'),q=hand.getRotation().clone();
    ik(bone(side+'Arm'),bone(side+'ForeArm'),hand,new Vec3(sign*.209/scale,.838/scale,.245/scale),new Vec3(sign*.65,-1,-.3));
    // The wrist has no finger joints. Use the authored hand orientation from
    // carrying, rotated to a forward grip; keep wrist aligned to the forearm.
    const tip=bone(side+'Hand_End');if(tip)aim(hand,tip,hand.getPosition().clone().add(new Vec3(0,-.022,.07)));
    else hand.setRotation(q);
   }
   channels.forEach((c,i)=>{const v=c.prop==='localRotation'?c.node.getLocalRotation():c.prop==='localScale'?c.node.getLocalScale():c.node.getLocalPosition();output[i].push(v.x,v.y,v.z);if(v instanceof Quat)output[i].push(v.w);});
  }
  return new AnimTrack(name,duration,[new AnimData(1,times)],output.map((v,i)=>new AnimData(channels[i].prop==='localRotation'?4:3,v)),channels.map((c,i)=>new AnimCurve([c.path] as unknown as string[],0,i,INTERPOLATION_LINEAR)));
 });
 channels.forEach((c,i)=>{c.node.setLocalPosition(saved[i].p);c.node.setLocalRotation(saved[i].q);c.node.setLocalScale(saved[i].s);});return tracks;
}
