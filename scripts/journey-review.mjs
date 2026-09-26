import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],samples=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const move=position=>page.evaluate(async position=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(...position);},position);
const sample=async name=>{await page.waitForTimeout(1300);const v=await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();return{snapshot:window.__roomTest.snapshot(),vram:app.stats.vram,draws:app.stats.drawCalls.total,triangles:app.stats.frame.triangles,schoolAssets:app.assets.list().filter(a=>a.type==='container'&&/School classroom|School cafeteria|Jules|Poppy|Remy/.test(a.name)).map(a=>a.name),sections:app.root.children.filter(e=>e.name.startsWith('Neighborhood section')).map(e=>e.name)};});samples.push({name,...v});await page.screenshot({path:'artifacts/journeys/'+name+'.png'});};
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});await sample('house-lazy');
 await move([-6.3,.09,8.25]);await page.waitForTimeout(800);
 for(const [name,p] of [['clover-exterior',[-26,.09,-.3]],['peachy-exterior',[-50,.09,-.3]],['moonbeam-exterior',[-74,.09,-.3]],['willow-turnaround',[-92,.09,8.2]]]){await move(p);await sample(name);}
 await move([-18,.09,8.2]);await page.waitForTimeout(500);
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication(),camera=app.root.findByTag('migration.camera')[0];window.poseFrame=()=>{camera.camera.orthoHeight=1.3;camera.setPosition(-15.5,2.8,12.9);camera.lookAt(new pc.Vec3(-18,.8,8.2));};app.on('prerender',window.poseFrame);});
 await page.locator('#journey-jump').click();
 for(let i=0;i<5;i++){await page.waitForTimeout(i?130:60);samples.push({name:'jump-'+i,snapshot:await page.evaluate(()=>window.__roomTest.snapshot()),geometry:await page.evaluate(()=>window.__roomTest.characterGeometry())});await page.screenshot({path:'artifacts/journeys/jump-'+i+'.png'});}
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();app.off('prerender',window.poseFrame);window.dispatchEvent(new Event('resize'));});await page.waitForTimeout(800);
 await move([22,.09,-29.4]);await sample('school-walk');await page.locator('#action-button').click();await page.waitForTimeout(4500);await sample('school-lazy-loaded');
 await writeFile('artifacts/journeys/journey-review.json',JSON.stringify({samples,errors},null,2));console.log(JSON.stringify({samples:samples.map(s=>({name:s.name,vram:s.vram,draws:s.draws,sections:s.sections,geometry:s.geometry})),errors},null,2));
}finally{await browser.close();}
