// Original procedural artwork: neutral satin albedo/blush and packed normal/roughness.
// No source image is edited. Deterministic, dependency-free PNG output.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='public/assets/squishies/materials';mkdirSync(out,{recursive:true});
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,data){const type=Buffer.from(name),n=Buffer.alloc(4),end=Buffer.alloc(4);n.writeUInt32BE(data.length);end.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([n,type,data,end]);}
function png(name,n,pixel){const raw=Buffer.alloc(n*(1+n*4));for(let y=0;y<n;y++)for(let x=0;x<n;x++){const rgba=pixel(x,y,n);for(let c=0;c<4;c++)raw[y*(1+n*4)+1+x*4+c]=Math.round(Math.max(0,Math.min(255,rgba[c])));}const header=Buffer.alloc(13);header.writeUInt32BE(n);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;writeFileSync(`${out}/${name}.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));}
const wave=(x,y,n)=>Math.sin(x/n*Math.PI*2*31)*Math.cos(y/n*Math.PI*2*27)+.35*Math.sin((x+y)/n*Math.PI*2*53);
png('satin-color',512,(x,y,n)=>{const v=1-y/(n-1),a=x/(n-1)*Math.PI*2;let blush=0;for(const center of [.57,2*Math.PI-.57]){const d=Math.atan2(Math.sin(a-center),Math.cos(a-center));blush+=Math.exp(-((d/.185)**2+((v-.30)/.080)**2))*.27;}const base=253-7*(1-v)**4+wave(x,y,n)*.45;return [base+(255-base)*blush,base+(126-base)*blush,base+(151-base)*blush,255];});
png('satin-surface',256,(x,y,n)=>{const dx=(wave(x+1,y,n)-wave(x-1,y,n))*.022,dy=(wave(x,y+1,n)-wave(x,y-1,n))*.022,z=1/Math.sqrt(1+dx*dx+dy*dy);return[(1-dx*z)*127.5,(1-dy*z)*127.5,(1+z)*127.5,244+wave(x,y,n)*5];});
console.log('Built shared satin color (512px) and packed surface (256px).');
