import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
mkdirSync('public/assets/food',{recursive:true});
for(const name of ['pizza','taco','turkey']){
 const file=`artifacts/food-kit/source/Models/GLB format/${name}.glb`,b=readFileSync(file),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length));
 let bin=b.subarray(28+length);for(const img of j.images||[]){if(!img.uri)continue;const bytes=readFileSync(resolve(dirname(file),img.uri)),pad=Buffer.alloc((4-bytes.length%4)%4);img.bufferView=j.bufferViews.length;img.mimeType='image/png';delete img.uri;j.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:bytes.length});bin=Buffer.concat([bin,bytes,pad]);}
 j.buffers[0].byteLength=bin.length;let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const head=Buffer.alloc(20),tail=Buffer.alloc(8);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+json.length+bin.length,8);head.writeUInt32LE(json.length,12);head.writeUInt32LE(0x4e4f534a,16);tail.writeUInt32LE(bin.length);tail.writeUInt32LE(0x004e4942,4);writeFileSync(`public/assets/food/${name}.glb`,Buffer.concat([head,json,tail,bin]));
}
