import {readdirSync,readFileSync,copyFileSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {join,extname,resolve} from 'node:path';
mkdirSync('migration/upload',{recursive:true});
const files=[];function walk(dir){for(const d of readdirSync(dir,{withFileTypes:true})){const p=join(dir,d.name);d.isDirectory()?walk(p):files.push(p);}}walk('public/assets');
const assets=[];
for(const p of files){const rel=p.replaceAll('\\','/').slice('public/assets/'.length),ext=extname(p).toLowerCase();
 if(!['.glb','.json','.png','.webp','.mp3','.wav','.md','.txt'].includes(ext))continue;
 // Keep backups locally; only ship the models the complete game uses.
 if(rel.startsWith('pets/')&&ext==='.glb'&&!['sunny-pup.glb','paper.glb','poop.glb','shovel.glb','soap.glb'].includes(rel.split('/').at(-1)))continue;
 const file=resolve('migration/upload',rel.replaceAll('/','__')+(ext==='.glb'?'.bin':''));copyFileSync(p,file);
 assets.push({path:file,name:'game__'+rel.replaceAll('/','__')+(ext==='.glb'?'.bin':''),type:ext==='.json'?'json':ext==='.png'||ext==='.webp'?'texture':ext==='.mp3'||ext==='.wav'?'audio':ext==='.md'||ext==='.txt'?'text':'binary',preload:false,tags:['migration.asset','path:'+rel],bytes:statSync(p).size});
}
assets.push({path:resolve('public/asset-credits.html'),name:'game__asset-credits.html',type:'html',preload:false,tags:['migration.asset']});
writeFileSync('migration/upload-manifest.json',JSON.stringify(assets,null,2));console.log(JSON.stringify({files:assets.length,MB:assets.reduce((n,a)=>n+(a.bytes||0),0)/1048576,petFiles:assets.filter(a=>a.name.includes('pets')).map(a=>a.name)}));
