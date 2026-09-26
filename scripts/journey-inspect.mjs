import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:850}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('artifacts/journeys',{recursive:true});
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.waitForTimeout(1500);
 const report=await page.evaluate(async()=>{
  const pc=await import('playcanvas'),app=pc.Application.getApplication(),player=app.root.findByName('Arianna'),visual=player.findByName('Character visual pivot'),model=visual.findComponents('anim')[0].entity;
  const bones=['Hips','Spine01','Spine02','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];
  const inv=new pc.Mat4().copy(visual.getWorldTransform()).invert();
  return{snapshot:window.__roomTest.snapshot(),geometry:window.__roomTest.characterGeometry(),bones:bones.map(name=>{const b=model.findByName(name);return{name,p:b?inv.transformPoint(b.getPosition(),new pc.Vec3()).toArray():null,q:b?.getLocalRotation(),children:b?.children.map(c=>c.name)}}),vram:app.stats.vram};
 });
 await writeFile('artifacts/journeys/baseline.json',JSON.stringify({report,errors},null,2));
 await page.screenshot({path:'artifacts/journeys/baseline.png'});console.log(JSON.stringify({bones:report.bones,geometry:report.geometry,vram:report.vram,errors},null,2));
}finally{await browser.close();}
