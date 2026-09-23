import {cp,mkdir,readFile,writeFile,copyFile,readdir} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import './migration-build.mjs';

// The committed Editor export supplies authored layout and assets. Compile the
// current gameplay into it so Git deployments cannot silently restore old rooms.
const output=resolve('dist');
await mkdir(output,{recursive:true});
await cp('editor-release',output,{recursive:true});
const config=JSON.parse(await readFile('dist/config.json','utf8'));
// Updated source assets override the historical scene-export copies.
let updatedId=900002000;
const overlays=['backgrounds/squishy-bedroom.png','school-kit/classroom.glb','school-kit/cafeteria.glb','food/pizza.glb','food/taco.glb','food/turkey.glb','characters/arianna/arianna.glb','characters/marc/marc.glb','characters/lilah/lilah.glb','pets/sunny-pup.glb','environment/kenney/furniture/loungeChairUpright.glb',...(await readdir('public/assets/audio/foley')).filter(f=>f.endsWith('.mp3')).map(f=>'audio/foley/'+f)];
for(const path of overlays){
 const url='assets/'+path,name='game__'+path.replaceAll('/','__')+(path.endsWith('.glb')?'.bin':'');
 await mkdir(dirname(resolve(output,url)),{recursive:true});await copyFile('public/'+url,resolve(output,url));
 const existing=Object.values(config.assets).find(a=>a.name===name);
 if(existing){existing.file={...existing.file,url};continue;}
 while(config.assets[updatedId])updatedId++;
 config.assets[updatedId]={id:String(updatedId),name,type:'binary',file:{url,filename:basename(path)},data:{},preload:false,tags:[]};updatedId++;
}
// Code-owned reference-led animal sculpts use the same binary naming convention
// as migrated GLBs. Keep authored scene files intact and overlay current art.
let sculptId=900001000;
for(const kind of ['panda','frog','bunny','cat']){
 const file='animal-'+kind+'.glb',url='assets/squishies/'+file,name='game__squishies__'+file+'.bin';
 await mkdir(resolve(output,'assets/squishies'),{recursive:true});await copyFile('public/'+url,resolve(output,url));
 const existing=Object.values(config.assets).find(a=>a.name===name);
 if(existing){existing.file={...existing.file,url};continue;}
 while(config.assets[sculptId])sculptId++;
 config.assets[sculptId]={id:String(sculptId),name,type:'binary',file:{url,filename:file},data:{},preload:false,tags:[]};sculptId++;
}
// Runtime-created squishies use current portraits, including newly added friends.
// Preserve the authored export while adding these small code-owned assets to the release registry.
await mkdir(resolve(output,'assets/squishies/portraits'),{recursive:true});
let portraitId=900000000;
for(const file of await readdir('public/assets/squishies/portraits')){
 if(!file.endsWith('.webp'))continue;
 const name='game__squishies__portraits__'+file,url='assets/squishies/portraits/'+file;
 await copyFile('public/'+url,resolve(output,url));
 const existing=Object.values(config.assets).find(a=>a.name===name);
 if(existing){existing.file={...existing.file,url};continue;}
 while(config.assets[portraitId])portraitId++;
 config.assets[portraitId]={id:String(portraitId),name,type:'binary',file:{url,filename:file},data:{},preload:false,tags:[]};portraitId++;
}
const runtime=config.assets['307711680'];
if(!runtime?.file?.url)throw Error('Editor runtime missing from release snapshot');
const bundle=await readFile('migration/full-game.mjs');
const hash=createHash('sha256').update(bundle).digest('hex').slice(0,16);
const oldPath=runtime.file.url.split('?')[0];
const relative=dirname(oldPath).replaceAll('\\','/')+'/full-game-'+hash+'.mjs';
const destination=resolve(output,relative);
if(!destination.startsWith(output+'/')&&!destination.startsWith(output+'\\'))throw Error('Invalid runtime path');
await copyFile('migration/full-game.mjs',destination);
runtime.file.url=relative;runtime.file.filename=basename(relative);runtime.file.hash=hash;runtime.file.size=bundle.length;
await writeFile('dist/config.json',JSON.stringify(config));
const html=await readFile('editor-release/index.html','utf8');
await writeFile('dist/index.html',html.replace('<head>','<head>\n<script>globalThis.__productionRelease=true;</script>').replace(/<title>.*?<\/title>/,'<title>Arianna · Little Everyday Adventures</title>'));
const commit=process.env.VERCEL_GIT_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile('dist/release.json',JSON.stringify({commit,scene:2600724,checkpoint:'4cb508b4-1c57-4729-bcf6-05d7f29eba7c',runtimeHash:hash,savePrefix:'arianna'},null,2));
console.log('Production Editor release built:',commit,hash);
