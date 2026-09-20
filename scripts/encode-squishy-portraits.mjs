import {mkdirSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {DUMPLINGS} from '../src/data/collection.ts';
const encoder=process.env.FFMPEG??'C:/pinokio/bin/miniconda/Library/bin/ffmpeg.exe';
mkdirSync('public/assets/squishies/portraits',{recursive:true});let bytes=0;
for(const {id} of DUMPLINGS){const file=`public/assets/squishies/portraits/${id}.webp`;execFileSync(encoder,['-v','error','-y','-i',`artifacts/squishy-art/portraits/${id}.png`,'-c:v','libwebp','-quality','86',file]);bytes+=statSync(file).size;}
console.log(`Encoded ${DUMPLINGS.length} matching portraits: ${(bytes/1024).toFixed(0)} KiB total`);
