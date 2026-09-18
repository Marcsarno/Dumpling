import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:320,height:568}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto((process.env.POP_URL??'http://127.0.0.1:5174')+'/scripts/pop-core.html');await page.locator('[data-level="0"]').click();
 // Presentation fixture only; sequential natural gameplay is in pop-levels-browser.mjs.
 for(let i=0;i<3;i++){
   await page.evaluate(()=>{window.pop.board.score=1800;window.pop.levelRun.values=window.pop.level.objectives.map(o=>o.target);window.pop.state='results';window.pop.showCover();});
   await page.waitForTimeout(1200);
   for(const [width,height] of [[320,568],[390,844],[430,932]]){
     await page.setViewportSize({width,height});const bounds=await page.locator('.pop-cover button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{label:b.textContent,visible:r.top>=0&&r.bottom<=innerHeight,height:r.height};}));assert.ok(bounds.every(b=>b.visible&&b.height>=44),JSON.stringify(bounds));await page.screenshot({path:`artifacts/pop-levels/polished-results-${i}-${width}.png`});
   }
   if(i<2){await page.locator('[data-next-level]').click();assert.equal(await page.evaluate(()=>window.pop.level.id),i===0?'big-squishes':'friend-party');}
 }
 assert.deepEqual(errors,[]);console.log('PASS all result actions visible at three phone sizes, Next level navigation and clean console');
}finally{await browser.close();}
