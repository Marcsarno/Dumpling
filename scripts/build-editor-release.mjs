import {cp,mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
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
