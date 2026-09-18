import {learnFirstChain} from './pop-learn-helper.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.POP_URL??'http://127.0.0.1:5173')+'/scripts/pop-core.html');await page.locator('[data-classic]').click();await page.locator('[data-start]').tap();await learnFirstChain(page);await page.waitForFunction(()=>window.pop.snapshot().state==='playing');const cdp=await context.newCDPSession(page);
for(let k=0;k<25;k++){const snap=await page.evaluate(()=>window.pop.snapshot()),b=await page.locator('canvas').boundingBox(),path=snap.valid;
 for(let n=0;n<path.length;n++){const i=path[n];await cdp.send('Input.dispatchTouchEvent',{type:n?'touchMove':'touchStart',touchPoints:[{id:1,x:b.x+(i%6+.5)*b.width/6,y:b.y+(Math.floor(i/6)+.5)*b.width/6}]});await page.waitForTimeout(45);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);assert.ok((await page.evaluate(()=>window.pop.snapshot())).score>snap.score);
}
await mkdir('artifacts/squishy-pop',{recursive:true});await page.screenshot({path:'artifacts/squishy-pop/core.png'});assert.deepEqual(errors,[]);console.log('PASS 25 real touch chains, gravity/refill, no runtime errors');await browser.close();
