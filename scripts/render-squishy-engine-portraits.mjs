// Render the exact current runtime material setup, rather than an approximation in Blender.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {DUMPLINGS} from '../src/data/collection.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const out='artifacts/squishy-art/portraits';await mkdir(out,{recursive:true});await mkdir('artifacts/squishy-polish',{recursive:true});const report=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:320,height:320},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.ART_URL??'http://127.0.0.1:5180')+'/scripts/squishy-viewer.html');await page.waitForFunction(()=>window.squishyReview?.ready);await page.locator('nav').evaluate(e=>e.style.display='none');await page.locator('p').evaluate(e=>e.style.display='none');
 for(const data of DUMPLINGS){await page.evaluate(id=>{window.squishyReview.select(id);window.squishyReview.portrait();},data.id);await page.waitForTimeout(150);const materials=await page.evaluate(()=>window.squishyReview.materials()),dough=materials.find(m=>m.name.startsWith('Dough tint'));assert.equal(dough.color.toLowerCase(),data.color);assert.equal(dough.map,data.special?(data.special==='cat'?'Seamless kitten cap mask':undefined):'satin-color');await page.screenshot({path:`${out}/${data.id}.png`,omitBackground:true});report.push({id:data.id,rarity:data.rarity,dough});}
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
execFileSync(process.execPath,['scripts/encode-squishy-portraits.mjs'],{stdio:'inherit'});
await writeFile('artifacts/squishy-polish/lineup-materials.json',JSON.stringify(report,null,2));console.log('PASS '+DUMPLINGS.length+' identities and engine-rendered portraits');
