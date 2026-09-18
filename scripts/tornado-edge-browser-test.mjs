import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],samples=[];const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5174');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().lilah.loaded);
 await page.locator('#tornado-launch').tap();await page.locator('[data-action=begin]').tap();const initial=await snap();
 await page.waitForTimeout(1400);await page.keyboard.press('F2');const pause=await snap();await page.waitForTimeout(1300);assert.equal((await snap()).tornado.elapsed,pause.tornado.elapsed);await page.keyboard.press('F2');
 for(const [width,height]of [[320,568],[390,844],[430,932]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);const hud=await page.locator('#tornado-hud').boundingBox(),action=await page.locator('#action-button').boundingBox();assert.ok(hud.y+hud.height<action.y);assert.ok(hud.x>=0&&hud.x+hud.width<=width);assert.ok(action.y+action.height<=height);await page.screenshot({path:`artifacts/house-polish/event-${width}.png`});
 }
 while((await snap()).tornado.phase==='playing'){const s=await snap();assert.ok(s.tornado.messes.length<=3);samples.push({elapsed:s.tornado.elapsed,messes:s.tornado.messes.length,fps:s.fps,drawCalls:s.drawCalls});await page.waitForTimeout(750);}
 let s=await snap();assert.equal(s.tornado.cleaned,0);assert.equal(s.tornado.reward,1);assert.equal(s.loop.balance,initial.loop.balance+1);assert.equal(s.cleanup.daily.minutes,initial.cleanup.daily.minutes);assert.equal(s.cleanup.daily.phase,initial.cleanup.daily.phase);
 await page.screenshot({path:'artifacts/house-polish/gentle-result.png'});await page.locator('[data-action=back]').tap();await page.waitForTimeout(1300);s=await snap();assert.equal(s.cameraState,'EXPLORE');assert.equal(s.tornado.phase,'idle');
 const balance=s.loop.balance,messes=s.cleanup.daily.lilah.messes.length;await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await page.waitForTimeout(6000);s=await snap();assert.equal(s.loop.balance,balance);assert.equal(s.tornado.phase,'idle');assert.equal(s.cleanup.daily.lilah.messes.length,messes);
 assert.deepEqual(errors,[]);await writeFile('artifacts/house-polish/edge.json',JSON.stringify({errors,samples,result:s.tornado,balance},null,2));console.log('PASS pause, three mobile layouts, full idle round, mess cap, minimum reward, frozen day clock, clean exit and reload');
}catch(e){console.error(e);await page.screenshot({path:'artifacts/house-polish/edge-failure.png'});process.exitCode=1;}finally{await browser.close();}
