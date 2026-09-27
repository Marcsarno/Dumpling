// Existing CC0 Quaternius skeleton/motion; preserve the original student sculpt.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=process.argv[2]??'.',out=process.argv[3]??'public/assets/people/student-poppy-play.glb';
const base=await readFile(root+'/public/assets/people/student-poppy.glb');
const jsonLength=base.readUInt32LE(12),g=JSON.parse(base.subarray(20,20+jsonLength).toString());
const binaryStart=20+jsonLength+8,binary=base.subarray(binaryStart,binaryStart+base.readUInt32LE(20+jsonLength));
const source=JSON.parse(await readFile(root+'/artifacts/npc-upgrade/source/CasualWoman.gltf','utf8'));
const sourceBuffer=Buffer.from(source.buffers[0].uri.split(',')[1],'base64');
const chunks=[binary];let size=binary.length;
const views=new Map(),accessors=new Map();
function copyAccessor(index){
 if(accessors.has(index))return accessors.get(index);
 const a=structuredClone(source.accessors[index]);
 if(a.sparse)throw Error('Sparse motion needs explicit conversion');
 if(!views.has(a.bufferView)){
  const v=source.bufferViews[a.bufferView],pad=(4-size%4)%4;if(pad){chunks.push(Buffer.alloc(pad));size+=pad;}
  const data=sourceBuffer.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);
  const n=g.bufferViews.length;g.bufferViews.push({...v,buffer:0,byteOffset:size});chunks.push(data);size+=data.length;views.set(a.bufferView,n);
 }
 a.bufferView=views.get(a.bufferView);const n=g.accessors.length;g.accessors.push(a);accessors.set(index,n);return n;
}
const report=[];
for(const name of ['Walk','Kick_Right']){
 const anim=source.animations.find(a=>a.name===name);if(!anim)throw Error('Missing '+name);
 const channels=anim.channels.map(c=>{
  const nodeName=source.nodes[c.target.node].name,target=g.nodes.findIndex(n=>n.name===nodeName);
  if(target<0)throw Error('Missing matching student bone '+nodeName);
  return {...c,target:{...c.target,node:target}};
 });
 const samplers=anim.samplers.map(s=>({...s,input:copyAccessor(s.input),output:copyAccessor(s.output)}));
 g.animations.push({name,channels,samplers});report.push({name,duration:Math.max(...anim.samplers.map(s=>source.accessors[s.input].max?.[0]??0)),channels:channels.length});
}
g.buffers=[{byteLength:size}];const j=Buffer.from(JSON.stringify(g)),jpad=Buffer.alloc((4-j.length%4)%4,32),bin=Buffer.concat(chunks),bpad=Buffer.alloc((4-bin.length%4)%4);
const header=Buffer.alloc(20),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+jpad.length+bin.length+bpad.length,8);header.writeUInt32LE(j.length+jpad.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length+bpad.length,0);bh.writeUInt32LE(0x004e4942,4);
await mkdir(out.slice(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,Buffer.concat([header,j,jpad,bh,bin,bpad]));console.log(JSON.stringify({out,bytes:header.readUInt32LE(8),motion:report}));
