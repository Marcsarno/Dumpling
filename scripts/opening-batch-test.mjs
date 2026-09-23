import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://127.0.0.1:5191/scripts/opening-review.html');
const frame=page.frames().find(f=>f.url().includes('/dist/'))??await new Promise(r=>page.once('frameattached',r));
await frame.locator('#game[data-ready=true]').waitFor({timeout:90000});
for(let i=0;i<4;i++){
 await frame.locator('#action-button[data-target=open-box]').click();
 if(i===2){await frame.waitForFunction(()=>window.__roomTest.snapshot().loop.opening.elapsed>.35);await frame.evaluate(()=>location.reload());await frame.locator('#game[data-ready=true]').waitFor();}
 await frame.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await page.waitForTimeout(500);
 assert.equal(await frame.locator('#collection-dialog').evaluate(d=>d.open),false);
 const save=await frame.evaluate(()=>JSON.parse(localStorage.getItem('dumpling.openingReview.progress.v1')));
 assert.equal(Object.values(save.collection).reduce((a,b)=>a+b,0),i+1);assert.equal(save.boxes.length,3-i);
 if(i===3)await page.screenshot({path:'artifacts/opening/desktop-legendary.png'});
}
assert.equal(await frame.locator('#action-title').innerText(),'Collection');
assert.equal(await frame.evaluate(()=>localStorage.getItem('arianna.progress.v1')),null);
assert.deepEqual(errors,[]);console.log('PASS four sequential openings, mid-animation reload exactly once, collection stays closed, real save untouched');
await writeFile('artifacts/opening/batch-report.json',JSON.stringify({errors,passed:true}));
}finally{await browser.close();}
