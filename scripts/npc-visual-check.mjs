import assert from 'node:assert/strict';
import {browser,page,errors,snap,sleep} from './store-test-helpers.mjs';
import {writeFile} from 'node:fs/promises';
async function frame(target,height){await page.evaluate(async({target,height})=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();if(window.photoFrame)app.off('prerender',window.photoFrame);const cams=app.root.findComponents('camera');const cam=cams.find(c=>c.entity.name==='Camera')??cams.at(-1);window.photoFrame=()=>{cam.orthoHeight=height;cam.entity.setPosition(target[0]+3,target[1]+3.2,target[2]+6);cam.entity.lookAt(new pc.Vec3(...target));};app.on('prerender',window.photoFrame);},{target,height});await sleep(600);}
try{
 await page.setViewportSize({width:1100,height:850});await page.route('**/favicon.ico',r=>r.fulfill({status:204}));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://127.0.0.1:5191/dist/index.html?preview=school');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});await sleep(1800);await page.screenshot({path:'artifacts/npc-upgrade/classroom.png'});
 await frame([-.4,.9,1.1],1.75);await page.screenshot({path:'artifacts/npc-upgrade/poppy-close.png'});
 await frame([2.1,.9,-2.2],1.65);await page.screenshot({path:'artifacts/npc-upgrade/remy-close.png'});
 await frame([-3.6,.9,-2.2],1.65);await page.screenshot({path:'artifacts/npc-upgrade/jules-close.png'});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(4.6,.09,-15);});await sleep(500);await frame([4.9,1.6,-22],2.1);await page.screenshot({path:'artifacts/npc-upgrade/cook-close.png'});
 await writeFile('artifacts/npc-upgrade/visual.json',JSON.stringify({errors,snapshot:await snap()},null,2));assert.deepEqual(errors,[]);console.log('NPC visual checks: all six classmates and cook loaded, no errors');
}finally{await browser.close();}
