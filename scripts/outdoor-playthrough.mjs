import {landFish} from './fishing-touch-helper.mjs';
import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {browser,context,page,errors,checks,snap,sleep,pass,moveTo,setPlanner,dev,cdp} from './store-test-helpers.mjs';
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.route('**/favicon.ico',route=>route.fulfill({status:204}));await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});let s=await snap();setPlanner(s.loop.outdoors);
 await dev('complete-current');assert.equal((await snap()).cleanup.daily.phase,'morning');assert.equal(s.loop.mode,'cleanup');assert.equal(s.loop.outdoors.roof,false);
 await moveTo([-6.3,.09,8.25]);assert.equal((await snap()).loop.mode,'outdoors');assert.equal((await snap()).loop.outdoors.roof,true);await page.screenshot({path:'artifacts/outdoors/phone-exit.png'});pass('Walked through the original house door; same touch controller; exterior roof appears');
 for(const p of [[-6.3,.09,0],[-6.3,.09,-4.5],[-3.5,.09,-7],[-.8,.09,-10],[-4.1,.09,-10]])await moveTo(p);
 await page.screenshot({path:'artifacts/outdoors/phone-pond.png'});pass('Walked garden path to reachable pond bank');
 const original=await page.evaluate(()=>{window.savedRandom=Math.random;return true});
 for(const [i,rng] of [.13,.35,.60,.85,0,0].entries()){
  await page.evaluate(n=>{const original=Math.random;let remaining=3;Math.random=()=>remaining-->0?n:original()},rng);await page.locator('#action-button[data-target=pond-fish]').tap();await sleep(850);await page.locator('#fish-action').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='bite');await page.locator('#fish-action').tap();
  await landFish(page,cdp,{photo:'artifacts/npc-upgrade/battle-'+i+'.png'});
  await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='catch');await sleep(1400);s=await snap();assert.equal(s.loop.fishing.catchKind,rng===0?'squishy':'fish');assert.equal(s.loop.fishing.loadedFish,4);assert.ok(s.character.clips.some(c=>c.name==='Fishing_Cast'));
  if(i>=4){assert.ok(s.loop.fishing.receipt.count>=1);assert.equal(s.loop.collection[s.loop.fishing.receipt.dumplingId],s.loop.fishing.receipt.count);}await page.screenshot({path:`artifacts/outdoors/phone-catch-${i}.png`});
  await page.locator('#fish-action').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='idle');assert.equal(await page.locator('#fishing-panel').isVisible(),false);
 }
 await page.evaluate(()=>{Math.random=window.savedRandom});pass('Caught and released all four animated fish; squishies entered the same collection');
 for(const p of [[-.8,.09,-10],[6,.09,-17.3],[18.5,.09,-17.7],[22,.09,-18],[22,.09,-22.5],[22,.09,-27],[22,.09,-29.4]])await moveTo(p);
 await page.screenshot({path:'artifacts/outdoors/phone-school-gate.png'});assert.equal(await page.locator('#action-button').getAttribute('data-target'),'school-gate');await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='recess');assert.equal((await snap()).loop.recess.area,'Classroom');assert.equal((await snap()).cleanup.daily.phase,'school');await page.screenshot({path:'artifacts/outdoors/phone-school-arrival.png'});pass('Walked sidewalk and crosswalk beside guard; gate enters the existing classroom');
 await page.locator('#leave-recess').tap();assert.equal((await snap()).cleanup.daily.phase,'afternoon');assert.equal((await snap()).loop.mode,'outdoors');setPlanner((await snap()).loop.outdoors);
 for(const p of [[22,.09,-27],[22,.09,-18],[6,.09,-17.3],[-.8,.09,-10],[-3.5,.09,-7],[-6.3,.09,-4.5],[-6.3,.09,8.25],[-2.2,.09,8.25]])await moveTo(p);
 assert.equal((await snap()).loop.mode,'cleanup');assert.equal((await snap()).loop.outdoors.roof,false);pass('Returned from school to house; roof hides and indoor chores resume');
 const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('dumpling.outdoorReview.progress.v1')));assert.equal(Object.values(save.collection).reduce((a,b)=>a+b,0),2);assert.equal(save.balance,0);assert.equal(await page.evaluate(()=>localStorage.getItem('arianna.progress.v1')),null);await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.deepEqual((await snap()).loop.collection,save.collection);assert.deepEqual(errors,[]);await writeFile('artifacts/outdoors/playthrough.json',JSON.stringify({checks,errors,save},null,2));
}catch(e){await page.screenshot({path:'artifacts/outdoors/walk-failed.png'});await writeFile('artifacts/outdoors/walk-failed.json',JSON.stringify({error:String(e),errors,snapshot:await snap().catch(()=>null)},null,2));throw e;}finally{await browser.close();}
