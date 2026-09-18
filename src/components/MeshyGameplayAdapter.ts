import { AnimCurve, AnimData, AnimTrack, Entity, Quat, Vec3, INTERPOLATION_LINEAR, type GraphNode } from 'playcanvas';
import type { CharacterManifest } from './CharacterAnimator';
import { RUN_SPEED, WALK_SPEED } from './MovementPace';

/** Uses supplied locomotion/idle, with temporary interaction poses outside the untouched GLB. */
export type ChoreCapture = Record<'wipe'|'vacuum', {fps:number;samples:number[][]}>;
export function meshyGameplay(model: Entity, source: AnimTrack[], chore?:ChoreCapture) {
  const walking = source.find(track => track.name === 'Walking');
  if (!walking) throw new Error('The new Arianna is missing Walking.');
  const required = (name:string) => {const track=source.find(track=>track.name===name);if(!track)throw new Error('Missing Arianna clip: '+name);return track;};
  const running=required('Running'),authoredCarryWalk=required('CarryWalk'),authoredCarryRun=required('CarryRun'),idle=required('Idle');
  type Binding = { entityPath: string[]; component: string; propertyPath: string[] };
  const paths = (curve: AnimCurve) => curve.paths as unknown as Binding[];
  const channels = walking.curves.flatMap(curve => paths(curve).map(path => ({
    path, node: model.findByName(path.entityPath.at(-1)!)!, property: path.propertyPath[0],
  })));
  if (channels.some(channel => !channel.node)) throw new Error('Arianna animation targets do not match her rig.');
  const read = (node: GraphNode, property: string) => property === 'localRotation'
    ? [node.getLocalRotation().x,node.getLocalRotation().y,node.getLocalRotation().z,node.getLocalRotation().w]
    : (property === 'localPosition' ? node.getLocalPosition() : node.getLocalScale()).toArray();
  const capture = () => channels.map(({node,property}) => read(node,property));
  const rest = capture();
  const restore = () => channels.forEach(({node,property},i) => {
    const v=rest[i];
    if(property==='localRotation') node.setLocalRotation(v[0],v[1],v[2],v[3]);
    else if(property==='localPosition') node.setLocalPosition(v[0],v[1],v[2]);
    else node.setLocalScale(v[0],v[1],v[2]);
  });
  const aim = (node: GraphNode, child: GraphNode, target: Vec3) => {
    const from=child.getPosition().clone().sub(node.getPosition()).normalize();
    const to=target.clone().sub(node.getPosition()).normalize();
    node.setRotation(new Quat().mul2(new Quat().setFromDirections(from,to),node.getRotation()));
  };
  const crouch = () => {
    const feet=['Left','Right'].map(side=>({side,node:model.findByName(side+'Foot')!,point:model.findByName(side+'Foot')!.getPosition().clone(),rotation:model.findByName(side+'Foot')!.getRotation().clone()}));
    const hips=model.findByName('Hips')!,p=hips.getLocalPosition();hips.setLocalPosition(p.x,p.y-.29,p.z-.06);
    for(const foot of feet){
      const thigh=model.findByName(foot.side+'UpLeg')!,shin=model.findByName(foot.side+'Leg')!,origin=thigh.getPosition().clone();
      const upper=origin.distance(shin.getPosition()),lower=shin.getPosition().distance(foot.node.getPosition()),delta=foot.point.clone().sub(origin),length=delta.length();delta.normalize();
      const pole=model.getWorldTransform().transformVector(new Vec3(0,0,1));pole.sub(delta.clone().mulScalar(pole.dot(delta))).normalize();
      const along=(upper*upper-lower*lower+length*length)/(2*length),knee=origin.clone().add(delta.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,upper*upper-along*along))));
      aim(thigh,shin,knee);aim(shin,foot.node,foot.point);foot.node.setRotation(foot.rotation);
    }
  };
  const arms = (y: number,z: number,wide=.11, motion?:number[]) => {
    for(const [side,sign] of [['Left',1],['Right',-1]] as const) {
      const arm=model.findByName(side+'Arm')!,fore=model.findByName(side+'ForeArm')!,hand=model.findByName(side+'Hand')!;
      const i=side==='Right'?0:3;
      const shoulder=arm.getPosition().clone(),target=model.getWorldTransform().transformPoint(new Vec3(sign*wide+(motion?.[i]??0)*.09,y+(motion?.[i+1]??0)*.055,z+(motion?.[i+2]??0)*.09));
      const upper=shoulder.distance(fore.getPosition()),lower=fore.getPosition().distance(hand.getPosition());
      const direction=target.clone().sub(shoulder),distance=Math.min(direction.length(),upper+lower-.002);direction.normalize();
      const pole=model.getWorldTransform().transformVector(new Vec3(sign,-.6,-.3));
      pole.sub(direction.clone().mulScalar(pole.dot(direction))).normalize();
      const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
      const elbow=shoulder.clone().add(direction.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,upper*upper-along*along))));
      aim(arm,fore,elbow);aim(fore,hand,shoulder.clone().add(direction.mulScalar(distance)));
    }
  };
  // Use the authored palms for the stationary hold; retain the rest stance in the legs.
  for(const curve of authoredCarryWalk.curves)for(const path of paths(curve)){
    const name=path.entityPath.at(-1)!;
    if(!/^(Left|Right)(Shoulder|Arm|ForeArm|Hand)/.test(name))continue;
    const node=model.findByName(name)!,v=authoredCarryWalk.outputs[curve.output].data;
    if(path.propertyPath[0]==='localRotation')node.setLocalRotation(v[0],v[1],v[2],v[3]);
    else if(path.propertyPath[0]==='localPosition')node.setLocalPosition(v[0],v[1],v[2]);
    else node.setLocalScale(v[0],v[1],v[2]);
  }
  const carry=capture();restore();
  const spine=model.findByName('Spine02')!;
  const axis=model.getWorldTransform().transformVector(Vec3.RIGHT).normalize();
  spine.setRotation(new Quat().mul2(new Quat().setFromAxisAngle(axis,28),spine.getRotation()));
  arms(.47,.30);const reach=capture();restore();
  arms(1.02,.06,.23);const happy=capture();restore();
  const pose = (name:string,frames:number[][][],times:number[]) => new AnimTrack(name,times.at(-1)!,
    [new AnimData(1,times)],channels.map((_,i)=>new AnimData(rest[i].length,frames.flatMap(frame=>frame[i]))),
    channels.map(({path},i)=>new AnimCurve([path] as unknown as string[],0,i,INTERPOLATION_LINEAR)));
  // Blender exported a 1/15s lead-in. Shift runtime copies so the matching loop endpoints meet.
  const loop = (track:AnimTrack,name:string) => {
    const start=Math.min(...track.inputs.map(input=>input.data[0]));
    return new AnimTrack(name,track.duration-start,track.inputs.map(input=>new AnimData(input.components,Array.from(input.data,t=>t-start))),track.outputs,track.curves);
  };
  const tracks=[...source.filter(track=>!['Idle','CarryWalk','CarryRun'].includes(track.name)),
    loop(walking,'Walk'),loop(running,'Run'),loop(authoredCarryWalk,'CarryWalk'),loop(authoredCarryRun,'CarryRun'),loop(idle,'Idle'),
    pose('CarryIdle',[carry,carry],[0,2]),
    pose('PickUp',[rest,reach,carry],[0,.4,.8]),pose('PutDown',[carry,reach,rest],[0,.4,.8]),
    pose('Celebrate',[rest,happy,happy,rest],[0,.3,.7,1]),pose('SitCar',[rest,rest],[0,2])];
  if(chore)for(const [kind,name,y,z,bend] of [['wipe','Wipe',.02,.29,80],['vacuum','Vacuum',.60,.32,12]] as const){
    const data=chore[kind],frames=data.samples.map(sample=>{
      restore();if(kind==='wipe')crouch();const workingSpine=spine;
      workingSpine.setRotation(new Quat().mul2(new Quat().setFromAxisAngle(axis,bend),workingSpine.getRotation()));
      arms(y,z,.09,sample);return capture();
    });
    tracks.push(pose(name,frames,frames.map((_,i)=>i/data.fps)));restore();
  }
  const manifest:CharacterManifest={
    animations:tracks.map(track=>({name:track.name,duration_seconds:track.duration,loop:!['PickUp','PutDown','Celebrate'].includes(track.name)})),
    scale:{rest_height_m:1.20309758},locomotion:{Walk:{travel_speed_mps:WALK_SPEED},Run:{travel_speed_mps:RUN_SPEED},CarryWalk:{travel_speed_mps:WALK_SPEED},CarryRun:{travel_speed_mps:RUN_SPEED}},
    interaction_events:{PickUp:[{time_seconds:.4,event:'attach'}],PutDown:[{time_seconds:.4,event:'release'}]},
    hand_joints:['LeftHand','RightHand'],action_playback:1,walk_playback:1,
  };
  return {tracks,manifest};
}
