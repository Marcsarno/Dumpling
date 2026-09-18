// Offline conversion: CMU ASF/AMC → root-relative hand trajectories (120 → 30 Hz).
// Original data stays in ignored artifacts; shipped curves are adapted by the rig adapter.
import fs from 'node:fs';
import {Quat,Vec3} from 'playcanvas';
const base='artifacts/house-polish/sources/';
const asf=fs.readFileSync(base+'13.asf','utf8'),bones={};
for(const block of asf.split(':bonedata')[1].split(':hierarchy')[0].matchAll(/begin([\s\S]*?)end/g)){
 const lines=Object.fromEntries(block[1].trim().split('\n').map(l=>{const [k,...v]=l.trim().split(/\s+/);return [k,v];}));
 const q=new Quat().setFromEulerAngles(...lines.axis.slice(0,3).map(Number));
 bones[lines.name[0]]={dir:new Vec3(...lines.direction.map(Number)).mulScalar(Number(lines.length[0])),axis:q,dof:lines.dof??[]};
}
const hierarchy=asf.split(':hierarchy')[1].split('\n').map(l=>l.trim().split(/\s+/)).filter(a=>a.length>1);
function convert(file,start,end){
 const frames=[];let frame;
 for(const line of fs.readFileSync(base+file,'utf8').split('\n')){const a=line.trim().split(/\s+/);if(/^\d+$/.test(a[0])){frame={};frames.push(frame);}else if(frame&&bones[a[0]]||frame&&a[0]==='root')frame[a[0]]=a.slice(1).map(Number);}
 const output=[];
 for(let f=start;f<Math.min(end,frames.length);f+=4){const raw=frames[f],rot={root:new Quat()},pos={root:new Vec3()};
  function visit(name){for(const child of hierarchy.find(h=>h[0]===name)?.slice(1)??[]){const b=bones[child],angles=[0,0,0];b.dof.forEach((d,i)=>angles['xyz'.indexOf(d[1])]=raw[child]?.[i]??0);const local=new Quat().mul2(b.axis,new Quat().setFromEulerAngles(...angles)).mul(b.axis.clone().invert());rot[child]=new Quat().mul2(rot[name],local);pos[child]=pos[name].clone().add(rot[child].transformVector(b.dir));visit(child);}}
  visit('root');output.push(['rhand','lhand'].flatMap(n=>pos[n].toArray()));
 }
 // Center/scale each hand's working envelope. Retargeted IK applies Arianna-sized ranges.
 const means=Array.from({length:6},(_,i)=>output.reduce((s,v)=>s+v[i],0)/output.length);
 const spread=Math.max(...output.flatMap(v=>v.map((x,i)=>Math.abs(x-means[i]))));
 const data=output.map(v=>v.map((x,i)=>Number(((x-means[i])/spread).toFixed(4))));
 // Crossfade the final 0.2 seconds to the starting pose for a seamless working loop.
 for(let i=0;i<6;i++){const row=data.length-6+i,t=(i+1)/6;data[row]=data[row].map((v,c)=>v*(1-t)+data[0][c]*t);}
 return {fps:30,samples:data};
}
fs.mkdirSync('public/assets/animations/chores',{recursive:true});
fs.writeFileSync('public/assets/animations/chores/cmu-trajectories.json',JSON.stringify({wipe:convert('13_20.amc',180,540),vacuum:convert('13_23.amc',180,540)}));
console.log('Converted CMU 13_20 washing and 13_23 sweeping to 30 Hz hand trajectories.');
