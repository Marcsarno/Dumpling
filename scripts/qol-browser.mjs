import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHuntDay} from '../src/data/hunt.ts';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const out='artifacts/qol';await mkdir(out,{recursive:true});
const hunt=createHuntDay(3);hunt.stores.corner.visited=hunt.stores.toys.visited=true;
const daily={version:1,day:3,phase:'afternoon',minutes:1110,done:['dust-0','dust-1','spill','living-toy','feed-dog'],dust:[0,2,4],breakfast:'done',eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',spillSite:1};
const progress={version:1,balance:50,collection:{mochi:3,rosie:3,stardrop:2},boxes:[{id:'q1',dumplingId:'dewdrop-unicorn'},{id:'q2',dumplingId:'moonwish-panda'},{id:'q3',dumplingId:'solstice-dragon'}],creditedRounds:[],trip:{active:false,purchases:0},location:'home',reveal:null,hunt,pop:{tickets:15,bestScore:100,rounds:[],tutorialSeen:true,couponDay:0}};
await context.addInitScript(({daily,progress})=>{if(!localStorage.getItem('qol-fixture')){localStorage.setItem('arianna.daily.v1',JSON.stringify(daily));localStorage.setItem('arianna.progress.v1',JSON.stringify(progress));localStorage.setItem('qol-fixture','true');}},{daily,progress});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());const photo=name=>page.screenshot({path:out+'/'+name+'.png'});const pass=name=>{checks.push(name);console.log('PASS',name);};
async function dev(command,value){await page.keyboard.press('F2');const b=page.locator(`[data-command="${command}"]${value?`[data-value="${value}"]`:''}`);if(!await b.count()){await page.locator('[data-tab]').nth(1).click();}await b.first().click();if(await page.locator('#developer-panel').evaluate(e=>e.open))await page.locator('.dev-close').click();await page.waitForTimeout(200);}
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5191/dist/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await photo('epic-bedroom');
 assert.equal((await snap()).loop.boxes,2);assert.equal(await page.locator('#action-title').innerText(),'Open next');assert.equal(await page.locator('#collection-dialog').evaluate(e=>e.open),false);
 const styles=new Set();for(let i=0;i<16&&styles.size<3;i++){await page.locator('#squish-friend').tap();await page.waitForTimeout(1100);styles.add((await snap()).loop.opening.squishStyle);}assert.equal(styles.size,3);pass('Three squish styles and direct next-basket action');
 await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await photo('legendary-bedroom');
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});assert.equal((await snap()).loop.collection['moonwish-panda'],1);assert.equal((await snap()).loop.boxes,1);pass('Reload preserves opened receipt and remaining baskets');
 await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await photo('dragon-bedroom');await page.locator('#action-button').tap();
 assert.equal(await page.locator('#collection-dialog').evaluate(e=>e.open),true);await page.locator('#collection-grid').evaluate(e=>e.parentElement.scrollTop=1000);const box=await page.locator('#back-cleanup').boundingBox();assert.ok(box.y>=0&&box.y<844);await photo('collection-sticky');pass('Collection appears after the final basket; actions stay visible when scrolled');
 await page.locator('#back-cleanup').tap();await page.waitForTimeout(700);let s=await snap();assert.equal(s.cleanup.daily.day,3);assert.equal(s.loop.balance,50);
 await page.locator('#squishy-pop-shortcut').tap();await page.locator('[data-classic]').waitFor();await page.locator('[data-classic]').tap();await page.waitForTimeout(4700);s=await snap();console.log('AUDIO',JSON.stringify(s.loop.pop.audio));assert.equal(s.loop.pop.audio.state,'running');assert.equal(s.loop.pop.audio.music,true);assert.equal(s.loop.pop.audio.decoded,7);assert.deepEqual(s.loop.pop.audio.failures,[]);assert.ok(s.loop.pop.audio.played>0);await photo('pop-audio');pass('Pop music and effects decode and play');
 await page.locator('.pop-pause').tap();await page.locator('[data-quit]').tap();
 // Use the development fixture position hook only for setup, then real action buttons.
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(8.55,.09,-1.3);});
 await page.waitForTimeout(1200);console.log('CRIB_FOCUS',await page.locator('#action-button').getAttribute('data-target'));
 await photo('crib-before');
 assert.equal(await page.locator('#action-button').getAttribute('data-target'),'lilah-bed');await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.lilahAsleep);await page.waitForTimeout(700);s=await snap();assert.equal(s.lilah.state,'sleeping');assert.equal(s.loop.balance,51);assert.equal(await page.locator('#bedtime-fade').isVisible(),false);await photo('crib-asleep');pass('Crib action puts Lilah to sleep and awards $1');
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});assert.equal((await snap()).lilah.state,'sleeping');assert.equal((await snap()).loop.balance,51);pass('Lilah bedtime persists without another reward');
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-.85,.09,-1.6);});await page.waitForTimeout(600);assert.equal(await page.locator('#action-button').getAttribute('data-target'),'sleep');await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.day===4,undefined,{timeout:15000});pass('Early bedtime starts the next day before 7 PM');
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({checks,errors},null,2));
}catch(e){await photo('failure');await writeFile(out+'/failure.json',JSON.stringify({error:String(e),errors,snapshot:await snap().catch(()=>null)},null,2));throw e;}finally{await browser.close();}
