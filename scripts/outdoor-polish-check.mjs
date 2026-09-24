import {landFish} from './fishing-touch-helper.mjs';
import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {browser,page,errors,snap,sleep,cdp} from './store-test-helpers.mjs';
const metrics=[];page.on('console',async m=>{if(m.type()==='error'){for(const a of m.args())console.log(await a.evaluate(e=>e?.stack??String(e)));errors.push(m.text());}});
const teleport=p=>page.evaluate(async p=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(...p)},p);
try{
 await page.route('**/favicon.ico',route=>route.fulfill({status:204}));await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});await teleport([-6.3,.09,8.25]);await sleep(500);await teleport([-4.1,.09,-10]);await sleep(1800);const zoom=(await snap()).cameraHeight;
 for(let i=0;i<3;i++){
  await page.evaluate(i=>{const original=Math.random;let remaining=3;Math.random=()=>remaining-->0?(i===0?.13:0):original()},i);await page.locator('#action-button[data-target=pond-fish]').tap();await sleep(1000);await page.screenshot({path:`artifacts/outdoors/rod-prepare-${i}.png`});
  await page.locator('#fish-action').tap();await sleep(650);await page.screenshot({path:`artifacts/outdoors/rod-cast-${i}.png`});await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='bite');await page.locator('#fish-action').tap();
  await sleep(350);await page.screenshot({path:`artifacts/outdoors/rod-reel-${i}.png`});metrics.push(await snap());
  await landFish(page,cdp);await sleep(1200);await page.locator('#fish-action').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='idle');await sleep(1800);assert.ok(Math.abs((await snap()).cameraHeight-zoom)<.025);
 }
 await page.locator('#action-button[data-target=pond-fish]').tap();await sleep(850);await page.locator('#fishing-panel button').last().tap();await sleep(1600);assert.equal((await snap()).loop.fishing.phase,'idle');assert.equal((await snap()).cameraState,'EXPLORE');
 // A missed bite can be retried, and storage failure must not lose the catch.
 await page.locator('#action-button[data-target=pond-fish]').tap();await sleep(850);await page.locator('#fish-action').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='miss');await page.locator('#fish-action').tap();assert.equal((await snap()).loop.fishing.phase,'prepare');await page.locator('#fishing-panel button').last().tap();
 const before={...(await snap()).loop.collection};await page.evaluate(()=>{const original=Math.random;let remaining=3;Math.random=()=>remaining-->0?0:original();window.originalSave=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='dumpling.outdoorReview.progress.v1')throw Error('test quota');return window.originalSave.call(this,k,v)};});
 await page.locator('#action-button[data-target=pond-fish]').tap();await sleep(850);await page.locator('#fish-action').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='bite');await page.locator('#fish-action').tap();await landFish(page,cdp);await sleep(500);assert.equal(await page.locator('#fish-action').textContent(),'Retry saving');assert.deepEqual((await snap()).loop.collection,before);
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSave});await page.locator('#fish-action').tap();assert.ok((await snap()).loop.fishing.receipt);await page.locator('#fish-action').tap();assert.equal((await snap()).loop.fishing.phase,'idle');
 await teleport([22,.09,-18]);await sleep(1800);await page.screenshot({path:'artifacts/outdoors/guard-close.png'});metrics.push(await snap());metrics.push(await page.evaluate(async()=>{const pc=await import('playcanvas'),a=pc.Application.getApplication();return{vram:a.stats.vram,triangles:a.stats.frame.triangles,lights:a.root.findComponents('light').length}}));
 await page.setViewportSize({width:1280,height:900});await teleport([-5.5,.09,-5]);await sleep(1800);await page.screenshot({path:'artifacts/outdoors/garden-wide.png'});await teleport([22,.09,-26]);await sleep(1800);await page.screenshot({path:'artifacts/outdoors/school-wide.png'});
 await writeFile('artifacts/outdoors/polish.json',JSON.stringify({errors,metrics},null,2));assert.deepEqual(errors,[]);
}finally{await browser.close();}
