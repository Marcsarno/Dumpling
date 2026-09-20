import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='stores/evidence/house-'+(process.env.STAGE||'before');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{await page.goto(process.env.GAME_URL||'http://127.0.0.1:5186/stores/exports/game/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});await page.waitForTimeout(1200);
const snapshot=await page.evaluate(()=>window.__roomTest.snapshot());await writeFile(out+'/snapshot.json',JSON.stringify({snapshot,errors},null,2));
await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().off('update');document.querySelectorAll('body *').forEach(e=>{if(e.tagName!=='CANVAS'&&!e.contains(document.querySelector('canvas')))e.style.visibility='hidden';});});
for(const [name,x,z,h] of [['overview',4,7,19],['bedrooms',5,-1,9],['living',2,7,8],['kitchen',0,14,7],['marc-room',8.8,8,7],['bathroom',4.9,-1.5,5],['nursery',8.8,-.5,5]]){await page.evaluate(async({x,z,h})=>{const pc=await import('playcanvas'),camera=pc.Application.getApplication().root.findByTag('migration.camera')[0];camera.setPosition(x+12,20,z+18);camera.lookAt(x,0,z);camera.camera.orthoHeight=h;},{x,z,h});await page.waitForTimeout(200);await page.screenshot({path:out+'/'+name+'.png'});}console.log('House review captured',errors);
}finally{await browser.close();}
