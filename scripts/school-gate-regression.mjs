import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
await mkdir('artifacts/school-gate',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],checks=[],cycles=[];
page.on('pageerror',e=>errors.push(String(e)));
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms),pass=x=>{checks.push(x);console.log('PASS',x);};
const place=(x,z)=>page.evaluate(async({x,z})=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
const resources=()=>page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();return{playContainers:app.assets.list().filter(a=>a.type==='container'&&a.file?.url?.includes('student-poppy-play')).length,playRoots:app.root.find(n=>n.name==='School gate shared play').length,textureBytes:app.stats.vram.tex,assets:app.assets.list().length,textures:[...app.graphicsDevice.textures].map(t=>({id:t.id,name:t.name,width:t.width,height:t.height,bytes:t.gpuSize}))};});
try{
 await page.goto('http://127.0.0.1:5192/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await place(-6,8.2);await sleep(300);
 for(let i=0;i<3;i++){
  await place(18,-27.3);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.schoolGate.ready);await sleep(600);const on=await resources();assert.equal(on.playContainers,1);assert.equal(on.playRoots,1);
  if(i===0){await sleep(1300);await page.screenshot({path:'artifacts/school-gate/desktop-scene.png'});}
  await place(-6,0);await sleep(900);const off=await resources();assert.equal(off.playContainers,0);assert.equal(off.playRoots,0);assert.equal((await snap()).loop.schoolGate.loaded,false);cycles.push({on,off});
 }
 await writeFile('artifacts/school-gate/memory.json',JSON.stringify(cycles,null,2));assert(cycles[2].off.textureBytes<=cycles[1].off.textureBytes+1024);pass('Three visits release Poppy container, scene entities, and texture memory without accumulation');
 await place(-6.3,8.2);await sleep(300);await place(-3,8.2);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='cleanup');pass('Existing cottage entry still works');
 await place(-6,8.2);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='outdoors');await place(-4.1,-10);await sleep(900);await page.locator('#action-button[data-target=pond-fish]').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.fishing.phase==='prepare');pass('Fishing still opens from its actual pond interaction');
 await page.screenshot({path:'artifacts/school-gate/pond-regression.png'});
 assert.deepEqual(errors,[]);await writeFile('artifacts/school-gate/regression.json',JSON.stringify({checks,cycles,errors,snapshot:await snap()},null,2));
}catch(e){await writeFile('artifacts/school-gate/regression-failure.json',JSON.stringify({error:String(e),checks,cycles,errors,snapshot:await snap()},null,2));throw e;}finally{await browser.close();}


