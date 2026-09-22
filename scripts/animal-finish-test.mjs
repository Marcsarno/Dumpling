import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
function read(path){const b=readFileSync(path),size=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+size)),bin:b.subarray(28+size)};}
function values(g,index){const a=g.json.accessors[index],view=g.json.bufferViews[a.bufferView],channels={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes=a.componentType===5126?4:a.componentType===5123?2:1,out=[];for(let i=0;i<a.count;i++){const row=[];for(let c=0;c<channels;c++){const offset=(view.byteOffset??0)+(a.byteOffset??0)+i*(view.byteStride??channels*bytes)+c*bytes;row.push(bytes===4?g.bin.readFloatLE(offset):bytes===2?g.bin.readUInt16LE(offset)/(a.normalized?65535:1):g.bin.readUInt8(offset)/(a.normalized?255:1));}out.push(row);}return out;}
function positions(g){const points=new Set();for(const m of g.json.meshes)for(const p of m.primitives)for(const v of values(g,p.attributes.POSITION))points.add(v.join(','));return createHash('sha256').update([...points].sort().join(';')).digest('hex');}
test('Each finished material has bounded, nonuniform local occlusion and opaque vertex alpha',()=>{
 const report=[];
 for(const kind of ['panda','frog','bunny','cat']){
  const g=read(`public/assets/squishies/animal-${kind}.glb`);let min=1,max=0;
  for(const m of g.json.meshes)for(const p of m.primitives){assert.notEqual(p.attributes.COLOR_0,undefined);for(const [r,green,b,a]of values(g,p.attributes.COLOR_0)){assert.ok(r>=.47&&r<=1);assert.ok(Math.abs(r-green)<.001&&Math.abs(r-b)<.001);assert.equal(a,1);min=Math.min(min,r);max=Math.max(max,r);}}
  assert.ok(max-min>.1);const before=`artifacts/animal-squishies/before-finish/animal-${kind}.glb`,hash=positions(g);
  if(existsSync(before))assert.equal(hash,positions(read(before)),`${kind}: approved vertex positions must not change`);
  report.push({kind,positionHash:hash,min,max});
 }
 if(existsSync('artifacts/animal-squishies'))writeFileSync('artifacts/animal-squishies/finish-validation.json',JSON.stringify(report,null,2));
});
