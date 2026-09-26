import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],reports=[];
page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const move=(x,z)=>page.evaluate(async({x,z})=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
const sleep=ms=>page.waitForTimeout(ms);
const metrics=()=>page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();return{assets:app.assets.list().length,toys:app.assets.list().filter(a=>a.type==='container'&&a.name.startsWith('Daily toy')).map(a=>a.name),draw:app.stats.drawCalls.total,vram:app.graphicsDevice._vram,sections:window.__roomTest.snapshot().loop.neighborhood.loadedSections};});
async function input(dx,dz,ms){const j=await page.locator('#joystick').boundingBox(),cx=j.x+j.width/2,cy=j.y+j.height/2,r=j.width*.29;await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+dx*r,cy-dz*r);await sleep(ms);await page.mouse.up();}
try{
 await page.route('**/favicon.ico',r=>r.fulfill({status:204}));
 await page.addInitScript(()=>{if(!sessionStorage.seeded){localStorage.setItem('dumpling.outdoorReview.daily-play.v1',JSON.stringify({version:1,seed:1234,day:1,ids:['cart','boat','flamingo','flower','duck'],progress:{}}));sessionStorage.seeded='yes';}});
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 assert.equal((await snap()).loop.dailyPlay.stations.length,0);reports.push({name:'indoors',metrics:await metrics()});
 await move(-3.05,8.2);await input(-.949,.316,1600);assert.equal((await snap()).loop.mode,'outdoors');
 await move(-4.1,-10);await sleep(1500);await page.locator('#action-button[data-target=pond-fish]').click();await sleep(700);assert.equal((await snap()).loop.fishing.phase,'prepare');await page.locator('#fish-action').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='wait');await page.screenshot({path:'artifacts/daily-play/fishing-restored.png'});await page.getByRole('button',{name:'Leave pond',exact:true}).click();
 // Actual joystick walk across the restored road join in the middle of the street.
 await move(-3,-22.5);await input(-.949,.316,2600);let p=(await snap()).position;assert(p[0]<-5.5);assert(Math.abs(p[2]+22.5)<.12);
 await page.screenshot({path:'artifacts/daily-play/road-join.png'});
 // The trolley is solid before its handle is selected.
 await move(-17,-14);await sleep(1000);await input(.316,.949,1100);p=(await snap()).position;assert(p[2]>-14.75,'Cannot walk through the trolley');const blocked=p;
 await page.locator('#action-button').click();await sleep(1700);assert.equal((await snap()).loop.dailyPlay.pushing,'cart');await input(.316,.949,3800);await sleep(2600);assert.equal((await snap()).loop.dailyPlay.progress.cart.done,true);reports.push({name:'solid trolley and delivery',blocked,finished:(await snap()).position});
 const selected=(await snap()).loop.dailyPlay.ids;await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.deepEqual((await snap()).loop.dailyPlay.ids,selected);assert.equal((await snap()).loop.dailyPlay.progress.cart.done,true);
 await move(-6,8.2);await sleep(700);
 // Revisit both ends repeatedly and verify leased resources return to the same count.
 for(let round=0;round<3;round++)for(const x of [-17,-69]){await move(x,-13.6);await sleep(2000);reports.push({name:`visit-${round}-${x}`,metrics:await metrics()});}
 const far=reports.filter(r=>r.name.endsWith('-69'));assert(far[2].metrics.assets<=far[0].metrics.assets+2,'Assets must not accumulate after revisits');assert(far[2].metrics.toys.length<=3);
 // Leave while carrying a toy. Its pose, contact colliders and leases must all clear.
 await move(-28.55,-13.84);await sleep(1000);await page.locator('#action-button').click();await sleep(1800);assert.equal((await snap()).loop.dailyPlay.holding,'Boat');await move(-2.9,8.2);await sleep(1400);assert.equal((await snap()).loop.mode,'cleanup');assert.equal((await snap()).loop.dailyPlay.holding,null);assert.equal((await snap()).loop.dailyPlay.stations.length,0);assert.equal((await snap()).character.state,'Idle');assert.equal((await metrics()).toys.length,0);reports.push({name:'returned home',metrics:await metrics()});
 const keys=await page.evaluate(()=>Object.keys(localStorage));assert(keys.every(k=>!k.startsWith('arianna.')));await writeFile('artifacts/daily-play/edge-checks.json',JSON.stringify({reports,keys,errors},null,2));assert.deepEqual(errors,[]);console.log('PASS fishing, street crossing, solid trolley, delivery, reload, bounded asset revisits and carrying cleanup');
}finally{await browser.close();}
