import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source=readFileSync('public/assets/pets/Meshy_AI_Sunny_Pup_0919020946_texture.glb');
assert.equal(createHash('sha256').update(source).digest('hex'),'38a8584ebc5ed2944472e84b2b3292915b390798f13657f9d7adf611a57c8524');
const b=readFileSync('public/assets/pets/sunny-pup.glb'),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length)),binary=28+length;
function values(index){const a=j.accessors[index],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],bytes={5126:4,5123:2,5121:1}[a.componentType],read={5126:'readFloatLE',5123:'readUInt16LE',5121:'readUInt8'}[a.componentType];return Array.from({length:a.count},(_,i)=>Array.from({length:n},(_,k)=>b[read](binary+(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??n*bytes)+k*bytes)));}
assert.equal(j.skins.length,1);assert.ok(j.skins[0].joints.length>=30);
for(const m of j.meshes)for(const p of m.primitives){assert.ok(p.attributes.TEXCOORD_0!==undefined);const weights=values(p.attributes.WEIGHTS_0),joints=values(p.attributes.JOINTS_0);assert.equal(weights.length,13756);for(let i=0;i<weights.length;i++){assert.ok(Math.abs(weights[i].reduce((a,b)=>a+b,0)-1)<1e-5);assert.ok(weights[i].every(w=>Number.isFinite(w)&&w>=0));assert.ok(joints[i].every(k=>k<j.skins[0].joints.length));}}
assert.deepEqual(j.animations.map(a=>a.name).sort(),['Idle','Walk']);
for(const a of j.animations){let moving=0;for(const c of a.channels){const s=a.samplers[c.sampler],v=values(s.output);assert.ok(v.flat().every(Number.isFinite));const end=v.at(-1);assert.ok(v[0].every((n,i)=>Math.abs(n-end[i])<.0001),`${a.name} ${j.nodes[c.target.node].name} loop seam`);if(c.target.path==='rotation'){v.forEach(q=>assert.ok(Math.abs(Math.hypot(...q)-1)<.001));if(v.some(q=>q.some((n,i)=>Math.abs(n-v[0][i])>.01)))moving++;}}assert.ok(moving>=8,`${a.name} moves real joints`);}
console.log('PASS original source unchanged, 13,756 textured vertices, normalized four-weight skin, joint indices, finite looping Idle/Walk and animated joints');
