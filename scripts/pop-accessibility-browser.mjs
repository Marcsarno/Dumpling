import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('artifacts/pop-milestone',{recursive:true});await page.goto((process.env.POP_URL??'http://127.0.0.1:5173')+'/scripts/pop-core.html');await page.locator('[data-classic]').click();await page.locator('[data-start]').waitFor({state:'visible'});
 await page.locator('.pop-sound').click();assert.equal((await page.evaluate(()=>window.pop.snapshot())).audio.muted,true);
 await page.evaluate(()=>{window.pop.developerControl('chain',7);window.pop.developerControl('freeze');});const b=await page.locator('canvas').boundingBox();
 for(const [n,i] of [12,13,14,15,16,17,23].entries()){await page.mouse.move(b.x+(i%6+.5)*b.width/6,b.y+(Math.floor(i/6)+.5)*b.width/6);if(!n)await page.mouse.down();}
 await page.waitForTimeout(100);assert.match(await page.locator('.pop-chain-cue').innerText(),/Rainbow/);assert.equal(await page.locator('.pop-chain-cue b').evaluate(e=>getComputedStyle(e).animationName),'none');await page.mouse.up();await page.waitForTimeout(200);assert.equal((await page.evaluate(()=>window.pop.snapshot())).particles,0);
 await page.evaluate(()=>{window.pop.developerControl('finish');});await page.waitForTimeout(100);const s=await page.evaluate(()=>window.pop.snapshot());assert.equal(await page.locator('[data-result-score]').innerText(),s.score.toLocaleString());assert.match(await page.locator('.pop-ticket-prize').innerText(),/no rewards/);await page.screenshot({path:'artifacts/pop-milestone/08-reduced-motion-320.png'});
 assert.equal(await page.locator('#squishy-pop').evaluate(d=>d.scrollWidth>d.clientWidth),false);assert.ok(await page.locator('[data-back]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
 await page.locator('[data-back]').click();await page.evaluate(()=>{window.pop.open();window.pop.developerControl('close');window.pop.open();});await page.locator('[data-classic]').click();await page.locator('[data-start]').waitFor({state:'visible'});await page.evaluate(()=>{window.pop.developerControl('chain',3);});const before=await page.evaluate(()=>window.pop.snapshot().remaining);await page.waitForTimeout(1000);const after=await page.evaluate(()=>window.pop.snapshot().remaining);assert.ok(before-after>.7&&before-after<1.4,'Rapid reopening has exactly one timer');
 assert.deepEqual(errors,[]);console.log('PASS reduced-motion cues, no moving particles, immediate result score, mute, 320px result controls, rapid reopening uses one timer');
}finally{await browser.close();}
