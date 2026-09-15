import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');await page.locator('[data-ready=true]').waitFor();
 // Saved states put the clock near a boundary; transitions still run through real game frames.
 await page.evaluate(()=>{
  localStorage.setItem('arianna.daily.v1',JSON.stringify({version:1,day:2,minutes:1136,phase:'afternoon',done:['spill'],eggDrop:false,breakfast:'done',dust:[0,2,4],schoolSeconds:0}));
  localStorage.setItem('arianna.progress.v1',JSON.stringify({version:1,balance:8,collection:{},boxes:[],creditedRounds:[],trip:{active:true,purchases:0},location:'store',reveal:null}));
 });
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);
 assert.equal(await page.evaluate(()=>window.__roomTest.snapshot().loop.mode),'store');
 assert.ok(await page.locator('#mission-clock').isVisible());
 await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.phase==='night',undefined,{timeout:12000});
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='cleanup');
 assert.ok((await page.locator('#day-label').textContent()).includes('night'));
 for(const selector of ['#joystick','#action-button','#mission-picker']){
  const b=await page.locator(selector).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=320.5&&b.y+b.height<=568.5,selector);
 }
 await page.screenshot({path:'artifacts/daily-life/night-small-phone.png'});
 await page.locator('#collection-button').tap();await page.locator('#back-cleanup').tap();
 assert.equal(await page.evaluate(()=>window.__roomTest.snapshot().cleanup.daily.phase),'night');
 assert.deepEqual(errors,[]);
 console.log('PASS Store clock stays visible; 7 PM returns home; collection return retains day phase; controls fit 320px phone');
} finally {await browser.close()}
