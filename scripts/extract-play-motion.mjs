import fs from 'node:fs';
import {Quat,Vec3,Mat4} from 'playcanvas';
const directory='artifacts/outdoors/source/kay/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/';
const names=['hips','spine','chest','head','upperarm.l','lowerarm.l','wrist.l','upperarm.r','lowerarm.r','wrist.r','upperleg.l','lowerleg.l','foot.l','toes.l','upperleg.r','lowerleg.r','foot.r','toes.r'];
const result={source:'KayKit Character Animations 1.1, CC0',bones:names,reference:[],clips:{}};
for(const [file,selected] of [['General',['Idle_A','Interact','PickUp','Throw','Use_Item']],['CombatMelee',['Melee_Unarmed_Attack_Kick']],['Simulation',['Waving']],['MovementBasic',['Jump_Full_Short']]]){
 const b=fs.readFileSync(directory+'Rig_Medium_'+file+'.glb'),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n);
 const acc=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type],r=[];for(let k=0;k<a.count;k++)for(let c=0;c<n;c++)r.push(bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+k*(v.byteStride??n*4)+c*4));return r;};
 const parents={};j.nodes.forEach((n,i)=>n.children?.forEach(c=>parents[c]=i));
 const rest=j.nodes.map(n=>({p:n.translation??[0,0,0],q:n.rotation??[0,0,0,1],s:n.scale??[1,1,1]})),ids=names.map(n=>j.nodes.findIndex(x=>x.name===n));
 function worlds(local){const cache={};function w(i){if(cache[i])return cache[i];const n=local[i],m=new Mat4().setTRS(new Vec3(...n.p),new Quat(...n.q),new Vec3(...n.s));return cache[i]=parents[i]===undefined?m:new Mat4().mul2(w(parents[i]),m);}return j.nodes.map((_,i)=>w(i));}
 for(const a of j.animations.filter(a=>selected.includes(a.name))){
  const channels=a.channels.map(c=>{const s=a.samplers[c.sampler];return{node:c.target.node,path:c.target.path,t:acc(s.input),v:acc(s.output)};}),duration=Math.max(...channels.map(c=>c.t.at(-1))),frames=[],positions=[];
  for(let f=0;f<=Math.ceil(duration*30);f++){
   const t=Math.min(duration,f/30),local=structuredClone(rest);
   for(const c of channels){let lo=0;while(lo<c.t.length-2&&c.t[lo+1]<t)lo++;const hi=Math.min(lo+1,c.t.length-1),n=c.path==='rotation'?4:3,u=Math.min(1,Math.max(0,(t-c.t[lo])/(c.t[hi]-c.t[lo]||1)));let v;
    if(n===4){const q=new Quat().slerp(new Quat(...c.v.slice(lo*n,lo*n+n)),new Quat(...c.v.slice(hi*n,hi*n+n)),u);v=[q.x,q.y,q.z,q.w];}
    else v=c.v.slice(lo*n,lo*n+n).map((v,k)=>v+(c.v[hi*n+k]-v)*u);local[c.node][c.path==='rotation'?'q':c.path==='translation'?'p':'s']=v;
   }
   const w=worlds(local);frames.push(ids.map(i=>{const q=new Quat().setFromMat4(w[i]);return[q.x,q.y,q.z,q.w].map(v=>+v.toFixed(6));}));positions.push(ids.map(i=>w[i].getTranslation().toArray().map(v=>+v.toFixed(6))));
  }
  result.clips[a.name]={duration,fps:30,frames,positions};if(a.name==='Idle_A')result.reference=frames[0];
 }
}
fs.writeFileSync('public/assets/outdoors/play-motion.json',JSON.stringify(result));console.log(Object.entries(result.clips).map(([name,c])=>[name,c.duration]));
