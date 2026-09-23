// Resample embedded material images only. Mesh, rig and animation buffer views are copied verbatim.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ffmpeg='C:/pinokio/bin/miniconda/Library/bin/ffmpeg.exe';
const dir='artifacts/texture-optimization';mkdirSync(dir,{recursive:true});
const report=[];
for(const file of ['characters/arianna/arianna.glb','characters/marc/marc.glb','characters/lilah/lilah.glb','pets/sunny-pup.glb']){
 const path='public/assets/'+file,backup=dir+'/'+file.replaceAll('/','-');if(!existsSync(backup))copyFileSync(path,backup);
 const b=readFileSync(backup),length=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+length)),bin=b.subarray(28+length);
 const originalViews=json.bufferViews.map(v=>bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength));
 const replacements=new Map();
 for(const [i,img] of (json.images||[]).entries()){
  if(img.bufferView===undefined)continue;
  const input=dir+'/input.png',output=dir+'/output.png',limit=/rough|metal/i.test(img.name||'')?512:1024;
  writeFileSync(input,originalViews[img.bufferView]);
  execFileSync(ffmpeg,['-y','-loglevel','error','-i',input,'-vf',`scale=w='min(${limit},iw)':h='min(${limit},ih)':force_original_aspect_ratio=decrease`,'-frames:v','1',output]);
  replacements.set(img.bufferView,readFileSync(output));img.mimeType='image/png';
 }
 let offset=0;const chunks=[];
 for(const [i,v] of json.bufferViews.entries()){
  const data=replacements.get(i)||originalViews[i];v.byteOffset=offset;v.byteLength=data.length;const pad=Buffer.alloc((4-data.length%4)%4);chunks.push(data,pad);offset+=data.length+pad.length;
 }
 json.buffers[0].byteLength=offset;const binary=Buffer.concat(chunks);let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);
 const head=Buffer.alloc(20),bh=Buffer.alloc(8);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+j.length+binary.length,8);head.writeUInt32LE(j.length,12);head.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
 const result=Buffer.concat([head,j,bh,binary]);writeFileSync(path,result);
 const hash=views=>createHash('sha256').update(Buffer.concat(views.filter((_,i)=>!replacements.has(i)))).digest('hex');
 const meshBefore=hash(originalViews),meshAfter=hash(json.bufferViews.map(v=>binary.subarray(v.byteOffset,v.byteOffset+v.byteLength)));if(meshBefore!==meshAfter)throw Error('Geometry changed: '+file);
 report.push({file,beforeBytes:b.length,afterBytes:result.length,preservedGeometryAndAnimation:meshBefore===meshAfter});
}
writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(report);
