import { AnimCurve, AnimData, AnimTrack, Entity, Quat, Vec3, INTERPOLATION_LINEAR } from 'playcanvas';

// Palm directions measured from this GLB's vertices with >80% hand weight.
// Mirroring bone axes alone does not mirror the visible palms: their bind frames differ.
export const RUN_PALM_AXES={Left:new Vec3(-.084140846,.99499861,-.05383385).normalize(),Right:new Vec3(-.16291618,.98452002,.06464243).normalize()};
export const RUN_WRIST_LIMIT=12;

/** Rebalance the imported run in bind space; never change the mesh or bone lengths. */
export function balancedRun(model: Entity, track: AnimTrack): AnimTrack {
  const bindings=track.curves.map(curve=>({curve,path:(curve.paths as unknown as {entityPath:string[];propertyPath:string[]}[])[0]}));
  const nodes=bindings.map(({path})=>model.findByName(path.entityPath.at(-1)!)!);
  const rest=nodes.map(n=>({p:n.getLocalPosition().clone(),q:n.getLocalRotation().clone(),s:n.getLocalScale().clone()}));
  const restore=()=>nodes.forEach((n,i)=>{n.setLocalPosition(rest[i].p);n.setLocalRotation(rest[i].q);n.setLocalScale(rest[i].s);});
  const names=['Hips','Spine02','Spine01','Spine','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand'];
  const bones=Object.fromEntries(names.map(name=>[name,model.findByName(name)!]));
  const bind=Object.fromEntries(names.map(name=>[name,bones[name].getRotation().clone()]));
  const start=Math.min(...track.inputs.map(i=>i.data[0])),duration=track.duration-start;
  const sample=(phase:number)=>{
    const time=start+phase*duration;
    bindings.forEach(({curve,path},i)=>{
      const times=track.inputs[curve.input].data,out=track.outputs[curve.output],data=out.data,c=out.components;
      let lo=0;while(lo<times.length-2&&times[lo+1]<time)lo++;
      const hi=Math.min(lo+1,times.length-1),alpha=Math.max(0,Math.min(1,(time-times[lo])/(times[hi]-times[lo]||1)));
      const a=Array.from(data.slice(lo*c,lo*c+c)),b=Array.from(data.slice(hi*c,hi*c+c));
      if(path.propertyPath[0]==='localRotation')nodes[i].setLocalRotation(new Quat().slerp(new Quat(...a),new Quat(...b),alpha));
      else {const v=a.map((v,k)=>v+(b[k]-v)*alpha);if(path.propertyPath[0]==='localPosition')nodes[i].setLocalPosition(v[0],v[1],v[2]);else nodes[i].setLocalScale(v[0],v[1],v[2]);}
    });
  };
  const delta=(name:string)=>new Quat().mul2(bones[name].getRotation(),bind[name].clone().invert());
  const mirror=(q:Quat)=>new Quat(q.x,-q.y,-q.z,q.w);
  const palmAlignment=new Quat().setFromDirections(RUN_PALM_AXES.Left,new Vec3(-RUN_PALM_AXES.Right.x,RUN_PALM_AXES.Right.y,RUN_PALM_AXES.Right.z));
  const settleRightWrist=()=>{
    const hand=bones.RightHand,fore=bones.RightForeArm;
    const direction=hand.getPosition().clone().sub(fore.getPosition()).normalize();
    const rotation=hand.getRotation().clone(),palm=rotation.transformVector(RUN_PALM_AXES.Right).normalize();
    const angle=Math.acos(Math.max(-1,Math.min(1,palm.dot(direction))))*180/Math.PI;
    const straight=new Quat().mul2(new Quat().setFromDirections(palm,direction),rotation);
    hand.setRotation(new Quat().slerp(straight,rotation,Math.min(1,RUN_WRIST_LIMIT/Math.max(angle,.001))));
  };
  const frames:number[][][]=[];const count=40;
  for(let f=0;f<=count;f++){
    const phase=f===count?0:f/count;
    sample((phase+.5)%1);
    settleRightWrist();
    const opposite=Object.fromEntries(names.map(name=>[name,delta(name)]));
    const oppositeX=bones.Hips.getLocalPosition().x;
    sample(phase);
    settleRightWrist();
    // Remove persistent lateral lean while retaining the alternating running rhythm.
    const central=names.slice(0,4).map(name=>new Quat().slerp(delta(name),mirror(opposite[name]),.5));
    const p=bones.Hips.getLocalPosition().clone();p.x=(p.x-oppositeX)*.5+rest[nodes.indexOf(bones.Hips)].p.x;bones.Hips.setLocalPosition(p);
    names.slice(0,4).forEach((name,i)=>bones[name].setRotation(new Quat().mul2(central[i],bind[name])));
    // Both arms use local Y along each bone. Reflect the clean right-arm world frame
    // half a stride later, avoiding the left bind pose's extra shoulder/wrist twist.
    for(const part of ['Shoulder','Arm','ForeArm','Hand']){
      const left='Left'+part,right='Right'+part;
      bones[left].setRotation(mirror(new Quat().mul2(opposite[right],bind[right])));
    }
    bones.LeftHand.setRotation(new Quat().mul2(bones.LeftHand.getRotation(),palmAlignment));
    frames.push(bindings.map(({path},i)=>path.propertyPath[0]==='localRotation'?nodes[i].getLocalRotation().toArray():
      (path.propertyPath[0]==='localPosition'?nodes[i].getLocalPosition():nodes[i].getLocalScale()).toArray()));
  }
  restore();
  return new AnimTrack('Run',duration,[new AnimData(1,frames.map((_,i)=>i*duration/count))],
    bindings.map((_,i)=>new AnimData(frames[0][i].length,frames.flatMap(frame=>frame[i]))),
    bindings.map(({curve},i)=>new AnimCurve(curve.paths,0,i,INTERPOLATION_LINEAR)));
}
