// Local-only overlay while Editor uploads are paused at the account storage limit.
import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
for(const target of ['stores/exports/game/js/esm-scripts/full-game.mjs','stores/exports/game/files/assets/307711680/1/full-game.mjs'])copyFileSync('migration/full-game.mjs',target);
writeFileSync('stores/exports/game/LOCAL_PATCH.txt','This export includes the local store-resume entrance correction in src/main.ts. Editor script 307711680 and public build 64260 do not yet include that correction. Uploads were paused at the account disk-allowance warning. All scene/art data is the saved Editor export.\n');
console.log('Local store export updated; Editor and production untouched.');
