import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Entity, AnimTrack, AnimData, AnimCurve, INTERPOLATION_LINEAR } from 'playcanvas';
import { balancedRun } from '../src/components/RunningPose.ts';
const buffer=fs.readFileSync('public/assets/characters/arianna/arianna.glb');
const length=buffer.readUInt32LE(12),gltf=JSON.parse(buffer.subarray(20,20+length)),bin=buffer.subarray(28+length);
const nodes=gltf.nodes.map(n=>{const e=new Entity(n.name);if(n.translation)e.setLocalPosition(...n.translation);if(n.rotation)e.setLocalRotation(...n.rotation);if(n.scale)e.setLocalScale(...n.scale);return e;});
gltf.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].addChild(nodes[c])));
const model=new Entity('Model');gltf.scenes[gltf.scene].nodes.forEach(n=>model.addChild(nodes[n]));
const data=i=>{const a=gltf.accessors[i],v=gltf.bufferViews[a.bufferView],components={SCALAR:1,VEC3:3,VEC4:4}[a.type];return new AnimData(components,Array.from(new Float32Array(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*components)));};
const animation=gltf.animations.find(a=>a.name==='Running');
const inputs=animation.samplers.map(s=>data(s.input)),outputs=animation.samplers.map(s=>data(s.output));
const curves=animation.channels.map(c=>new AnimCurve([{entityPath:[nodes[c.target.node].name],component:'graph',propertyPath:[{translation:'localPosition',rotation:'localRotation',scale:'localScale'}[c.target.path]]}],c.sampler,c.sampler,INTERPOLATION_LINEAR));
const source=new AnimTrack('Running',Math.max(...inputs.map(i=>i.data.at(-1))),inputs,outputs,curves);
const snapshot=()=>nodes.map(n=>[n.getLocalPosition().toArray(),n.getLocalRotation().toArray(),n.getLocalScale().toArray()]);
const rest=snapshot(),original=JSON.stringify([inputs,outputs]),run=balancedRun(model,source);
assert.deepEqual(snapshot(),rest,'Rig must be restored after baking');
assert.equal(JSON.stringify([inputs,outputs]),original,'Original clip must stay untouched');
assert(Math.abs(run.duration-(source.duration-inputs[0].data[0]))<1e-6);
for(const curve of run.curves){
 const out=run.outputs[curve.output],c=out.components,v=out.data;
 assert(v.every(Number.isFinite),'No invalid transforms');
 for(let k=0;k<c;k++)assert(Math.abs(v[k]-v[v.length-c+k])<1e-6,'Loop must close exactly');
 if(c===4)for(let i=0;i<v.length;i+=4){
  assert(Math.abs(Math.hypot(...v.slice(i,i+4))-1)<1e-5,'Unit rotations');
  if(i){const dot=Math.abs(v.slice(i,i+4).reduce((s,x,k)=>s+x*v[i-4+k],0));assert(2*Math.acos(Math.min(1,dot))*180/Math.PI<30,'No rotation jumps');}
 }
 if(curve.paths[0].propertyPath[0]==='localPosition' && curve.paths[0].entityPath[0]!=='Hips'){
  const originalCurve=source.curves.find(c=>c.paths[0].entityPath[0]===curve.paths[0].entityPath[0]&&c.paths[0].propertyPath[0]==='localPosition');
  const expected=source.outputs[originalCurve.output].data;
  for(let i=0;i<v.length;i++)assert(Math.abs(v[i]-expected[i%3])<1e-5,'Bone lengths unchanged');
 }
}
console.log('PASS: original clip and rig preserved; run duration, closed loop, normalized continuous rotations and bone lengths verified.');

// Check visible palm direction, not just bone quaternions. These axes were
// independently measured from the source mesh's strongly hand-weighted vertices.
const {Vec3}=await import('playcanvas');
const palmAxes={Left:new Vec3(-.084140846,.99499861,-.05383385).normalize(),Right:new Vec3(-.16291618,.98452002,.06464243).normalize()};
const angles=[];
for(let f=0;f<40;f++){
 for(const c of run.curves){const path=c.paths[0],node=model.findByName(path.entityPath[0]),out=run.outputs[c.output],v=out.data.slice(f*out.components,(f+1)*out.components);if(out.components===4)node.setLocalRotation(...v);else if(path.propertyPath[0]==='localPosition')node.setLocalPosition(...v);else node.setLocalScale(...v);}
 angles.push(['Left','Right'].map(side=>{const hand=model.findByName(side+'Hand'),fore=model.findByName(side+'ForeArm'),direction=hand.getPosition().clone().sub(fore.getPosition()).normalize(),palm=hand.getRotation().transformVector(palmAxes[side]).normalize();const angle=Math.acos(Math.max(-1,Math.min(1,direction.dot(palm))))*180/Math.PI;assert(angle<=12.01,'Visible wrist must stay in line with the forearm through every swing');return angle;}));
}
for(let f=0;f<40;f++)assert(Math.abs(angles[f][0]-angles[(f+20)%40][1])<.01,'Left visible wrist must match the right half a stride later');
console.log('PASS: both visible wrists stay within 12 degrees of the forearm; left/right wrist flex matches throughout the cycle.');
