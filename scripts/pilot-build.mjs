import {build} from '../node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
mkdirSync('pilot',{recursive:true});
const common={bundle:true,format:'esm',platform:'browser',target:'es2022',external:['playcanvas'],define:{'import.meta.env.BASE_URL':'"/"','import.meta.env.DEV':'true'},logLevel:'warning'};
await build({...common,entryPoints:['scripts/pilot-export.ts'],outfile:'pilot/exporter.mjs'});
if(existsSync('src/pilot/BedroomPilot.ts')){await build({...common,entryPoints:['src/pilot/BedroomPilot.ts'],outfile:'pilot/bedroom-pilot.mjs'});writeFileSync('pilot/bedroom-pilot.mjs',readFileSync('pilot/bedroom-pilot.mjs','utf8').replace('var BedroomPilot = class extends Script {','class BedroomPilot extends Script {'));}
console.log('Pilot bundles built.');
