import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('artifacts/journeys',{recursive:true});await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-6.3,.09,8.25);});
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.scooter.ready);await page.locator('#scooter-toggle').click();await page.waitForTimeout(1200);
 await page.screenshot({path:'artifacts/journeys/scooter-gameplay.png'});
 const results=[];
 for(const [name,angle] of [['front',0],['side',90],['rear',180],['three-quarter',45]]){
  await page.evaluate(async({angle})=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();window.reviewApp=app;const camera=app.root.findByTag('migration.camera')[0],player=app.root.findByName('Arianna'),p=player.getPosition().clone();
   if(window.reviewCamera)app.off('prerender',window.reviewCamera);
   window.reviewCamera=()=>{const scooter=app.root.findByName('Arianna’s maple scooter'),forward=scooter.getRotation().transformVector(new pc.Vec3(Math.sin(angle*Math.PI/180)*4,1.5,Math.cos(angle*Math.PI/180)*4));camera.setPosition(p.clone().add(forward));camera.lookAt(p.clone().add(new pc.Vec3(0,.78,0)));camera.camera.orthoHeight=1.06;};app.on('prerender',window.reviewCamera);
  },{angle});await page.waitForTimeout(300);await page.screenshot({path:`artifacts/journeys/scooter-${name}.png`});results.push({name,snapshot:await page.evaluate(()=>window.__roomTest.snapshot()),geometry:await page.evaluate(()=>window.__roomTest.characterGeometry())});
 }
 await writeFile('artifacts/journeys/scooter-review.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({errors,results:results.map(r=>({name:r.name,geometry:r.geometry,scooter:r.snapshot.loop.scooter}))}));
}finally{await browser.close();}

