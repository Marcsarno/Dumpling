import {AnimCurve,AnimData,AnimTrack,Entity,Quat,Vec3,INTERPOLATION_LINEAR,type GraphNode} from 'playcanvas';
export interface RestMotion {leftKnee:number;rightKnee:number;leftElbow:number;rightElbow:number}
export function bedEntryTrack(model:Entity,source:AnimTrack,sleep:AnimTrack){
 const bindings=source.curves.map(c=>({curve:c,path:(c.paths as unknown as {entityPath:string[];propertyPath:string[]}[])[0]})),nodes=bindings.map(b=>model.findByName(b.path.entityPath.at(-1)!)!);
 const read=()=>nodes.map((n,i)=>bindings[i].path.propertyPath[0]==='localRotation'?n.getLocalRotation().toArray():bindings[i].path.propertyPath[0]==='localPosition'?n.getLocalPosition().toArray():n.getLocalScale().toArray());
 const rest=read(),apply=(frame:number[][])=>nodes.forEach((n,i)=>{const v=frame[i],p=bindings[i].path.propertyPath[0];if(p==='localRotation')n.setLocalRotation(...v as [number,number,number,number]);else if(p==='localPosition')n.setLocalPosition(...v as [number,number,number]);else n.setLocalScale(...v as [number,number,number]);});
 const meshy=!!model.findByName('Hips'),hips=model.findByName(meshy?'Hips':'pelvis')!,initial=hips.getLocalPosition().clone();
 const bone=(s:string,p:string)=>model.findByName(meshy?s+({arm:'Arm',fore:'ForeArm',hand:'Hand',thigh:'UpLeg',shin:'Leg',foot:'Foot'} as Record<string,string>)[p]:({arm:'upper_arm',fore:'forearm',hand:'hand',thigh:'thigh',shin:'shin',foot:'foot'} as Record<string,string>)[p]+'.'+s[0])!;
 const aim=(n:GraphNode,child:GraphNode,d:Vec3)=>n.setRotation(new Quat().mul2(new Quat().setFromDirections(child.getPosition().clone().sub(n.getPosition()).normalize(),d.normalize()),n.getRotation()));
 const frames:number[][][]=[];
 for(let stage=0;stage<4;stage++){
  apply(rest);hips.setLocalPosition(initial.x,[initial.y,initial.y-.12,.17,.12][stage],initial.z);
  for(const [s,sign]of [['Left',1],['Right',-1]] as const){
   aim(bone(s,'arm'),bone(s,'fore'),stage===1?new Vec3(sign*.2,.25,.8):stage===2?new Vec3(sign*.25,-.3,.7):new Vec3(sign*.12,-1,.06));
   aim(bone(s,'fore'),bone(s,'hand'),stage===1?new Vec3(0,.2,.8):new Vec3(0,-.7,.35));
   const tuck=stage>=2?1:stage===1&&s==='Left'?.6:0;
   aim(bone(s,'thigh'),bone(s,'shin'),new Vec3(sign*.04,-1+tuck,tuck));aim(bone(s,'shin'),bone(s,'foot'),new Vec3(0,-1,stage>=2?-.15:0));
  }
  frames.push(read());
 }
 frames.push(bindings.map((b,i)=>Array.from(sleep.outputs[sleep.curves[i].output].data.slice(0,rest[i].length))));apply(rest);
 return new AnimTrack('SleepEnter',3.2,[new AnimData(1,[0,.5,1.2,1.9,3.2])],bindings.map((_,i)=>new AnimData(rest[i].length,frames.flatMap(f=>f[i]))),bindings.map(({curve},i)=>new AnimCurve(curve.paths,0,i,INTERPOLATION_LINEAR)));
}
/** Adapted CMU resting flex on each character's own rig; source GLBs stay untouched. */
export function sleepingTrack(model:Entity,source:AnimTrack,motion:RestMotion):AnimTrack{
 const bindings=source.curves.map(c=>({curve:c,path:(c.paths as unknown as {entityPath:string[];propertyPath:string[]}[])[0]}));
 const nodes=bindings.map(b=>model.findByName(b.path.entityPath.at(-1)!)!);
 const read=(i:number)=>bindings[i].path.propertyPath[0]==='localRotation'?nodes[i].getLocalRotation().toArray():bindings[i].path.propertyPath[0]==='localPosition'?nodes[i].getLocalPosition().toArray():nodes[i].getLocalScale().toArray();
 const rest=nodes.map((_,i)=>read(i));const restore=()=>nodes.forEach((n,i)=>{const v=rest[i],p=bindings[i].path.propertyPath[0];if(p==='localRotation')n.setLocalRotation(...v as [number,number,number,number]);else if(p==='localPosition')n.setLocalPosition(...v as [number,number,number]);else n.setLocalScale(...v as [number,number,number]);});
 const meshy=!!model.findByName('Hips'),bone=(side:string,part:string)=>model.findByName(meshy?side+({thigh:'UpLeg',shin:'Leg',foot:'Foot',arm:'Arm',fore:'ForeArm',hand:'Hand'} as Record<string,string>)[part]:({thigh:'thigh',shin:'shin',foot:'foot',arm:'upper_arm',fore:'forearm',hand:'hand'} as Record<string,string>)[part]+'.'+side[0])!;
 const hips=model.findByName(meshy?'Hips':'pelvis')!,chest=model.findByName(meshy?'Spine02':'chest')!;
 const aim=(n:GraphNode,child:GraphNode,direction:Vec3)=>{const from=child.getPosition().clone().sub(n.getPosition()).normalize();n.setRotation(new Quat().mul2(new Quat().setFromDirections(from,direction.clone().normalize()),n.getRotation()));};
 const frames:number[][][]=[];
 for(let f=0;f<=24;f++){
  restore();const breath=Math.sin(f/24*Math.PI*2)*.003;
  for(const [side,knee,elbow] of [['Left',motion.leftKnee,motion.leftElbow],['Right',motion.rightKnee,motion.rightElbow]] as const){
   const sign=side==='Left'?1:-1,rad=knee*Math.PI/180;
   aim(bone(side,'thigh'),bone(side,'shin'),new Vec3(sign*.05,-Math.cos(rad/2),Math.sin(rad/2)));
   aim(bone(side,'shin'),bone(side,'foot'),new Vec3(0,-Math.cos(rad/2),-Math.sin(rad/2)));
   aim(bone(side,'arm'),bone(side,'fore'),new Vec3(sign*.15,-1,.05));
   aim(bone(side,'fore'),bone(side,'hand'),new Vec3(-sign*.12,-1,Math.sin(elbow*Math.PI/180)*.4));
  }
  chest.rotateLocal(breath*50,0,0);
  // +Z forward becomes face-up; head points toward the pillow at -Z.
  hips.setRotation(new Quat().mul2(new Quat().setFromEulerAngles(-90,0,0),hips.getRotation()));
  const p=hips.getLocalPosition().clone();hips.setLocalPosition(p.x,.12+breath,0);
  frames.push(nodes.map((_,i)=>read(i)));
 }
 frames[24]=frames[0];restore();
 return new AnimTrack('Sleep',4,[new AnimData(1,frames.map((_,i)=>i/6))],bindings.map((_,i)=>new AnimData(rest[i].length,frames.flatMap(f=>f[i]))),bindings.map(({curve},i)=>new AnimCurve(curve.paths,0,i,INTERPOLATION_LINEAR)));
}
