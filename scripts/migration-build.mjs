import {build} from '../node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js';
import {readFileSync as read,writeFileSync as write,mkdirSync} from 'node:fs';
mkdirSync('migration',{recursive:true});
const common={bundle:true,format:'esm',platform:'browser',target:'es2022',external:['playcanvas'],define:{'import.meta.env.BASE_URL':'"/"','import.meta.env.DEV':'true'},logLevel:'warning'};
await build({...common,entryPoints:['src/main.ts'],outfile:'migration/local.mjs'});
await build({...common,entryPoints:['src/editor/FullGame.ts'],outfile:'migration/full-game.mjs',loader:{'.html':'text','.css':'text'}});
write('migration/full-game.mjs',read('migration/full-game.mjs','utf8').replace('var FullGame = class extends Script {','class FullGame extends Script {'));
write('migration/source.html',read('index.html','utf8').replace('<script type="module" src="/src/main.ts"></script>','<link rel="stylesheet" href="/migration/local.css"><script type="importmap">{"imports":{"playcanvas":"/engine.mjs"}}</script><script type="module" src="/migration/local.mjs"></script>'));
console.log('Built full game migration and isolated source preview.');
