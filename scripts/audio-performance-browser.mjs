import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage();
const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const pass=s=>{checks.push(s);console.log('PASS',s);};const out='artifacts/audio-performance';await mkdir(out,{recursive:true});
async function setVolume(channel,value){await page.locator(`[data-channel="${channel}"]`).fill(String(value));await page.locator(`[data-channel="${channel}"]`).dispatchEvent('input');}
async function frameCount(){return page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();let count=0;const cb=()=>count++;app.on('postrender',cb);await new Promise(r=>setTimeout(r,1100));app.off('postrender',cb);return count;});}
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 await page.locator('#audio-settings').tap();assert.equal(await page.locator('[data-channel="music"]').inputValue(),'50');assert.equal(await page.locator('[data-channel="effects"]').inputValue(),'100');
 assert.equal(await page.locator('#battery-saver').count(),0);
 await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.audio.decoded===5);assert.deepEqual(await page.evaluate(()=>window.__roomTest.snapshot().cleanup.audio.failures),[]);pass('Quieter music default and 5 recorded foley assets decode');
 assert.equal(await frameCount(),0);pass('Settings pause 3D rendering');
 await setVolume('music',25);await setVolume('effects',40);await page.screenshot({path:out+'/controls.png'});await page.getByRole('button',{name:'Done',exact:true}).tap();
 await page.waitForTimeout(1200);let snap=await page.evaluate(()=>window.__roomTest.snapshot());assert.ok(Math.abs(snap.houseMusic.volume-.063)<.015);assert.equal(snap.resolution[0],682);const frames=await frameCount();assert.ok(frames>0);pass('Music level applies live; normal resolution restored without battery saver');
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(900);await page.keyboard.up('ArrowUp');assert.equal((await page.evaluate(()=>window.__roomTest.snapshot().cleanup.audio.steps)),0);pass('Walking produces no footsteps');
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});await page.locator('#audio-settings').tap();assert.equal(await page.locator('[data-channel="music"]').inputValue(),'25');assert.equal(await page.locator('[data-channel="effects"]').inputValue(),'40');
 await setVolume('music',0);await page.getByRole('button',{name:'Done',exact:true}).tap();await page.waitForTimeout(1000);assert.equal((await page.evaluate(()=>window.__roomTest.snapshot().houseMusic.volume)),0);pass('Independent volumes persist after reload; zero silences music');
 await page.locator('#squishy-pop-shortcut').tap();await page.locator('[data-classic]').tap();if(await page.locator('[data-start]').count()){await page.locator('[data-start]').tap();const b=await page.locator('#squishy-pop canvas').boundingBox();await page.mouse.move(b.x+b.width/12,b.y+b.height*2.5/6);await page.mouse.down();await page.mouse.move(b.x+b.width*2.5/6,b.y+b.height*2.5/6,{steps:12});await page.mouse.up();}await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='playing');
 await page.locator('#pop-volume').tap();const remaining=await page.evaluate(()=>window.__roomTest.snapshot().loop.pop.remaining);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.__roomTest.snapshot().loop.pop.remaining),remaining);await setVolume('music',60);await page.getByRole('button',{name:'Done',exact:true}).tap();await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>window.__roomTest.snapshot().loop.pop.remaining)<remaining-.8);assert.equal(await frameCount(),0);pass('Pop volume controls pause its round timer; hidden 3D world stays unrendered');
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({checks,frames,errors},null,2));
}finally{await browser.close();}
