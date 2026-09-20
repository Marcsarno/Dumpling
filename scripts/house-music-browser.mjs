// Isolated playback lifecycle test. Seeking near the end avoids a two-minute wait;
// this verifies real media decoding/ended behavior, not subjective listening quality.
import assert from 'node:assert/strict';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true}),page=await context.newPage();
await context.addInitScript(()=>{const Native=window.Audio;window.qaAudio=[];window.Audio=class extends Native{constructor(...args){super(...args);window.qaAudio.push(this);}};});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const music=()=>page.evaluate(()=>window.__roomTest.snapshot().houseMusic);
async function dev(command,value=''){await page.keyboard.press('F2');await page.locator('[data-tab]').nth(command==='phase'?1:0).click();await page.locator(`[data-command="${command}"]${value?`[data-value="${value}"]`:''}`).first().click();if(await page.locator('#developer-panel').evaluate(d=>d.open))await page.locator('.dev-close').click();}
const playing=track=>page.waitForFunction(track=>{const m=window.__roomTest.snapshot().houseMusic;return m.track===track&&m.playing&&m.duration>0;},track);
try{
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5178');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);
 await page.locator('#house-music').tap();await page.locator('#house-music').tap();
 await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing&&window.__roomTest.snapshot().houseMusic.volume>.1);
 assert.equal((await music()).track,'Home · morning & night');
 await page.evaluate(()=>{const a=window.qaAudio.find(a=>decodeURIComponent(a.src).includes('Squishy home clean'));a.currentTime=a.duration-.15;});
 await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.gap>4);assert.equal((await music()).volume,0);
 await page.waitForFunction(()=>{const m=window.__roomTest.snapshot().houseMusic;return m.gap===0&&m.playing&&m.position<2;},{},{timeout:10000});
 await dev('phase','afternoon');await playing('Home · after-school chores');
 await dev('phase','night');await playing('Home · morning & night');
 await dev('recess');await playing('School trading');
 await dev('store','corner');await playing('Shopping · 1');
 await page.keyboard.press('F2');await page.locator('.dev-close').click();await playing('Shopping · 1');
 await dev('store','toys');await playing('Shopping · 2');
 await page.locator('#squishy-pop-shortcut').tap();await page.waitForFunction(()=>!window.__roomTest.snapshot().houseMusic.playing);
 await page.locator('#squishy-pop [data-back]').click();await playing('Shopping · 2');
 await dev('store','collector');await playing('Shopping · 1');
 await page.locator('#house-music').tap();assert.equal((await music()).muted,true);assert.equal((await music()).playing,false);
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.equal((await music()).muted,true);
 await page.locator('#house-music').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing);
 await page.keyboard.press('F2');assert.equal((await music()).playing,false);await page.locator('.dev-close').click();await page.waitForFunction(()=>window.__roomTest.snapshot().houseMusic.playing);
 assert.equal(await page.evaluate(()=>window.qaAudio.some(a=>a.src.includes('unlock.mp3'))),false);
 assert.equal((await music()).error,null);assert.deepEqual(errors,[]);console.log('PASS five tracks decode, morning/night and chores routing, school, store alternation, Pop pause/resume, real end/repeat gap, persistent mute and DEV pause; unlock audio never loaded');
}finally{await browser.close();}
