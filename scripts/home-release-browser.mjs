import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
try{for(const scenario of ['breakfast','dad']){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(scenario=>localStorage.setItem('dumpling.homePlayReview.daily.v1',JSON.stringify({version:1,day:1,phase:scenario==='breakfast'?'morning':'afternoon',minutes:scenario==='breakfast'?430:1010,done:['teeth','outfit'],dust:[0,2,4],breakfast:scenario==='breakfast'?'serve':'done',breakfastAtTable:scenario==='breakfast',eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',dinnerServed:false})),scenario);
 await page.goto(process.env.HOME_PLAY_URL||'http://127.0.0.1:5196/dist/index.html?preview=home-play');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().marc?.loaded,undefined,{timeout:120000});
 if(scenario==='breakfast'){
  await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(.55,.09,11.9);});
  await page.waitForFunction(()=>document.querySelector('#action-button').dataset.target==='eat-breakfast');await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.breakfast==='done',undefined,{timeout:20000});checks.push('Existing breakfast remains playable in the built release');
 }else{
  await page.waitForFunction(()=>window.__roomTest.snapshot().marc.dinner.served,undefined,{timeout:90000});
  const state=await page.evaluate(()=>window.__roomTest.snapshot());assert.equal(state.loop.homePlay.state.dinner.portions.filter(Boolean).length,8);assert.equal(state.loop.homePlay.state.dinner.plate,null);checks.push('Dad fetches and serves dinner with eight claimable portions');
 }
 await page.screenshot({path:`artifacts/home-play/release-${scenario}.png`});console.log('PASS',scenario);await context.close();
}assert.deepEqual(errors,[]);await writeFile('artifacts/home-play/release-input.json',JSON.stringify({checks,errors},null,2));}finally{await browser.close();}
