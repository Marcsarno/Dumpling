import {browser,page,errors,snap,sleep} from './store-test-helpers.mjs';
import {writeFile} from 'node:fs/promises';
const metrics=[];
try{await page.route('**/favicon.ico',r=>r.fulfill({status:204}));await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
const move=p=>page.evaluate(async p=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(...p)},p);
await move([-6.3,.09,8.25]);await sleep(1000);
for(const [name,p] of [['pond',[-4.1,.09,-10]],['entry',[22,.09,-26]],['garden',[-5.5,.09,-5]]]){await move(p);await sleep(1600);await page.screenshot({path:`artifacts/refinement/${name}-phone.png`});metrics.push(await snap());}
await page.setViewportSize({width:1280,height:900});for(const [name,p] of [['garden',[-5.5,.09,-5]],['school',[22,.09,-26]],['pond',[-4.1,.09,-10]]]){await move(p);await sleep(1600);await page.screenshot({path:`artifacts/refinement/${name}-wide.png`});metrics.push(await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();return{vram:app.stats.vram,triangles:app.stats.frame.triangles,drawCalls:app.stats.drawCalls.total,lights:app.root.findComponents('light').length}}));}
await writeFile('artifacts/refinement/outdoors-review.json',JSON.stringify({metrics,errors},null,2));console.log('Outdoor screenshots saved',errors);
}finally{await browser.close();}
