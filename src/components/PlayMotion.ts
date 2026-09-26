import {AnimCurve,AnimData,AnimTrack,Quat,Vec3,INTERPOLATION_LINEAR,type Entity} from 'playcanvas';
import type {FishingMotion} from './FishingRetarget';
type Motion=FishingMotion&{reference:number[][]};

/** Retarget motion relative to BOTH characters' neutral standing poses. The
 * previous direction-only arm aiming discarded roll and the different rest
 * frames. Here full rotations retain twist and use Arianna's authored offsets.
 * No joints, weights, lengths, mesh data, or source animation is edited. */
export function playTracks(model:Entity,idle:AnimTrack,data:Motion){
 type Path={entityPath:string[];component:string;propertyPath:string[]};
 const channels=idle.curves.flatMap(c=>(c.paths as unknown as Path[]).map(path=>({path,node:model.findByName(path.entityPath.at(-1)!)!,prop:path.propertyPath[0],v:idle.outputs[c.output].data})));
 const saved=channels.map(c=>({p:c.node.getLocalPosition().clone(),q:c.node.getLocalRotation().clone(),s:c.node.getLocalScale().clone()}));
 const neutral=()=>channels.forEach(c=>{if(c.prop==='localRotation')c.node.setLocalRotation(c.v[0],c.v[1],c.v[2],c.v[3]);else if(c.prop==='localPosition')c.node.setLocalPosition(c.v[0],c.v[1],c.v[2]);else c.node.setLocalScale(c.v[0],c.v[1],c.v[2]);});
 neutral();
 const map=[['spine','Spine02'],['chest','Spine'],['head','Head'],['upperarm.l','LeftArm'],['lowerarm.l','LeftForeArm'],['wrist.l','LeftHand'],['upperarm.r','RightArm'],['lowerarm.r','RightForeArm'],['wrist.r','RightHand'],['upperleg.l','LeftUpLeg'],['lowerleg.l','LeftLeg'],['foot.l','LeftFoot'],['upperleg.r','RightUpLeg'],['lowerleg.r','RightLeg'],['foot.r','RightFoot']];
 const targets=map.map(([source,name])=>({node:model.findByName(name)!,index:data.bones.indexOf(source),q:model.findByName(name)!.getRotation().clone()}));
 const arms=['Left','Right'].map(side=>{const upper=model.findByName(side+'Arm')!,lower=model.findByName(side+'ForeArm')!,hand=model.findByName(side+'Hand')!;return{upper,lower,hand,elbowX:Math.abs(lower.getPosition().x-upper.getPosition().x),handX:Math.abs(hand.getPosition().x)};});
 const left=model.findByName('LeftFoot')!,right=model.findByName('RightFoot')!,hips=model.findByName('Hips')!,ground=Math.min(left.getPosition().y,right.getPosition().y);
 const variants=[['PlayInteract','Interact'],['PlayReach','PickUp'],['PlayThrow','Throw'],['PlayRoll','Throw'],['PlayUse','Use_Item'],['PlayKick','Melee_Unarmed_Attack_Kick'],['PlayWave','Waving'],['PlayJump','Jump_Full_Short']];
 const result:AnimTrack[]=[];
 try{for(const [name,source] of variants){
  const clip=data.clips[source],output=channels.map(()=>[] as number[]);
  for(const [index,frame] of clip.frames.entries()){
   neutral();
   for(const t of targets){
    const delta=new Quat().mul2(new Quat(...frame[t.index]),new Quat(...data.reference[t.index]).invert());
    // Throw becomes a child-sized underarm roll, using the same captured timing.
    const limb=t.node.name;
    // Adapt the source animation's broad arm
    // excursion to this child's short arms and loose coat while preserving
    // imported timing and rotation, including wrist roll. Bone lengths stay fixed.
    const arm=/^(Left|Right)Arm$/.test(limb),distal=/^(Left|Right)(ForeArm|Hand)$/.test(limb);
    const amount=(name==='PlayRoll'?.35:1)*(arm?.22:distal?.65:1);
    const q=new Quat().mul2(new Quat().slerp(Quat.IDENTITY,delta,amount),t.q);t.node.setRotation(q);
   }
   // Preserve the coat's authored lateral silhouette. Redirect broad source
   // abduction into a forward arm swing for Arianna's different proportions.
   // This is an animation-space contact/range correction, not a skin edit.
   for(const a of arms){
    const from=a.lower.getPosition().clone().sub(a.upper.getPosition()),to=from.clone(),limit=a.elbowX+.006;
    const excess=Math.max(0,Math.abs(to.x)-limit);to.x=Math.max(-limit,Math.min(limit,to.x));to.z+=excess;
    a.upper.setRotation(new Quat().mul2(new Quat().setFromDirections(from.normalize(),to.normalize()),a.upper.getRotation()));
    const hand=a.hand.getPosition().clone(),origin=a.lower.getPosition().clone(),max=a.handX+.012;
    const target=hand.clone();target.x=Math.max(-max,Math.min(max,target.x));target.z+=Math.abs(hand.x-target.x);
    a.lower.setRotation(new Quat().mul2(new Quat().setFromDirections(hand.sub(origin).normalize(),target.sub(origin).normalize()),a.lower.getRotation()));
   }
   const footY=Math.min(left.getPosition().y,right.getPosition().y);
   const pose=clip.positions[index],start=clip.positions[0],l=data.bones.indexOf('foot.l'),r=data.bones.indexOf('foot.r');
   const lift=name==='PlayJump'?((pose[l][1]+pose[r][1])-(start[l][1]+start[r][1]))*.9:0;
   const p=hips.getPosition().clone();p.y+=ground+lift-footY;hips.setPosition(p);
   channels.forEach((c,i)=>{const v=c.prop==='localRotation'?c.node.getLocalRotation():c.prop==='localScale'?c.node.getLocalScale():c.node.getLocalPosition();output[i].push(v.x,v.y,v.z);if(v instanceof Quat)output[i].push(v.w);});
  }
  result.push(new AnimTrack(name,clip.duration,[new AnimData(1,clip.frames.map((_,i)=>Math.min(clip.duration,i/clip.fps)))],output.map((v,i)=>new AnimData(channels[i].prop==='localRotation'?4:3,v)),channels.map((c,i)=>new AnimCurve([c.path] as unknown as string[],0,i,INTERPOLATION_LINEAR))));
 }}finally{channels.forEach((c,i)=>{c.node.setLocalPosition(saved[i].p);c.node.setLocalRotation(saved[i].q);c.node.setLocalScale(saved[i].s);});}
 return result;
}

