import {readFileSync as read,writeFileSync as write,readdirSync} from 'node:fs';
import {join} from 'node:path';
throw new Error('One-time source conversion already applied. Do not rerun on migrated sources. Use migration-build.mjs.');
const files=['game/HouseArt.ts','game/ImportedProp.ts','game/Lilah.ts','game/Marc.ts','game/SquishyArt.ts','game/dumplingVisual.ts','game/Classmates.ts','ui/HouseMusic.ts','ui/PopArt.ts','ui/PopAudio.ts'];
for(const file of files){let s=read('src/'+file,'utf8');
 s=s.replace(/`\$\{import\.meta\.env\.BASE_URL\}assets\/[^`]+`/g,m=>'assetUrl('+m+')');
 s=s.replace("fetch('/assets/animations/rest/sleep.json')","fetch(assetUrl('/assets/animations/rest/sleep.json'))");
 s=s.replace("url:'/assets/characters/classmates/'+names[i]+'.glb'","url:assetUrl('/assets/characters/classmates/'+names[i]+'.glb')");
 s=s.replace("image.src='/assets/pop/'+file+'.png'","image.crossOrigin='anonymous';image.src=assetUrl('/assets/pop/'+file+'.png')");
 s=s.replace("fetch(`/assets/pop/audio/${name}.${name==='happy-adventure'?'mp3':'wav'}`)","fetch(assetUrl(`/assets/pop/audio/${name}.${name==='happy-adventure'?'mp3':'wav'}`))");
 write('src/'+file,"import {assetUrl} from '../editor/AssetUrls';\n"+s);
}
let c=read('src/components/CharacterVisual.ts','utf8');c="import {assetUrl} from '../editor/AssetUrls';\n"+c.replace('=> `${import.meta.env.BASE_URL}${path}`','=> assetUrl(`${import.meta.env.BASE_URL}${path}`)');write('src/components/CharacterVisual.ts',c);
for(const dir of ['src/systems','src/game','src/ui','src/dev'])for(const file of readdirSync(dir)){if(!file.endsWith('.ts'))continue;const p=join(dir,file),s=read(p,'utf8');if(s.includes('arianna.'))write(p,s.replaceAll('arianna.','dumpling.editorMigration.'));}
let m=read('src/main.ts','utf8');m="import {captureWorld} from './editor/LayoutBridge';\n"+m;
m=m.replace('async function start() {','export async function startGame(editorApp?:Application) {');
m=m.replace("const app = new Application(canvas,", "const app = editorApp ?? new Application(canvas,");
m=m.replace("const sun = new Entity('Soft afternoon sunlight', app);","const sun = (editorApp?.root.findByTag('migration.sun')[0] as Entity) ?? new Entity('Soft afternoon sunlight', app);");
m=m.replace("sun.addComponent('light',", "if(!sun.light) sun.addComponent('light',");
m=m.replace('app.root.addChild(sun);','if(!sun.parent)app.root.addChild(sun);');
m=m.replace('new IsometricCamera(app);',"new IsometricCamera(app,editorApp?.root.findByTag('migration.camera')[0] as Entity|undefined);");
m=m.replace('  app.start();',"  await captureWorld(app,room,props,loop,!!editorApp);\n  if(!editorApp)app.start();");
m=m.replace('void start().catch',"if(!(window as any).__editorMode)void startGame().catch");write('src/main.ts',m);
console.log('Full-game entry and asset/save isolation prepared.');
