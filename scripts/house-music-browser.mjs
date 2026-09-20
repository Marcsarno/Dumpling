// Isolated playback lifecycle test. Seeking near the end avoids a two-minute wait;
// this verifies real media decoding/ended behavior, not subjective listening quality.
import assert from 'node:assert/strict';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true}),page=await context.newPage();
await context.addInitScript(()=>{const Native=window.Audio;window.qaAudio=[];window.Audio=class extends Native{constructor(...args){super(...args);window.qaAudio.push(this);}};});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const music=()=>page.evaluate(()=>window.__roomTest.snapshot().houseMusic);
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5178');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);
 await page.locator('#house-music').tap();await page.locator('#house-music').tap();
 await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing&&window.__roomTest.snapshot().houseMusic.volume>.1);
 assert.equal((await music()).track,'Sunny ukulele');
 await page.evaluate(()=>{const a=window.qaAudio.find(a=>a.src.includes('sunny-house'));a.currentTime=a.duration-.15;});
 await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.gap>10);assert.equal((await music()).volume,0);
 await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.track==='Gentle piano'&&window.__roomTest.snapshot().houseMusic.playing,{},{timeout:20000});
 await page.locator('#house-music').tap();assert.equal((await music()).muted,true);assert.equal((await music()).playing,false);
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.equal((await music()).muted,true);
 await page.locator('#house-music').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing);
 await page.keyboard.press('F2');assert.equal((await music()).playing,false);await page.locator('.dev-close').click();await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing);
 assert.equal((await music()).error,null);assert.deepEqual(errors,[]);console.log('PASS quiet fade, real track end, 12-second gap, playlist, persistent mute and developer pause at 320px');
}finally{await browser.close();}
