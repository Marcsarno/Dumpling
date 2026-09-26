import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 const report=await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication(),model=app.root.findByName('Arianna').findComponents('anim')[0].entity;return{devicePixelRatio,renderRatio:app.graphicsDevice.maxPixelRatio,canvas:[app.graphicsDevice.width,app.graphicsDevice.height],materials:model.findComponents('render').flatMap(r=>r.meshInstances.map(m=>({name:m.material.name,color:[m.material.diffuseMap.width,m.material.diffuseMap.height],normal:[m.material.normalMap.width,m.material.normalMap.height],triangles:m.mesh.primitive[0].count/3,joints:m.skinInstance.bones.length}))),keys:Object.keys(localStorage)};});
 assert.equal(report.renderRatio,3);assert.deepEqual(report.canvas,[1170,2532]);
 for(const material of report.materials){assert.deepEqual(material.color,[2048,2048]);assert.deepEqual(material.normal,[2048,2048]);assert.equal(material.triangles,14694);assert.equal(material.joints,28);}
 assert(report.keys.every(k=>!k.startsWith('arianna.')));assert.deepEqual(errors,[]);
 await writeFile('artifacts/journeys/arianna-quality-browser.json',JSON.stringify({report,errors,note:'Desktop emulation verifies quality settings, not physical-phone performance.'},null,2));
 console.log('PASS original 2048px maps, 14,694 triangles, 28 joints, native 3× rendering, isolated saves');
}finally{await browser.close();}
