import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:850},deviceScaleFactor:1.75}),errors=[],frames=[];
page.on('pageerror',e=>{errors.push(e.stack??e.message);console.error(e.stack??e.message);});
await page.route('**/favicon.ico',route=>route.fulfill({status:204}));
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();app.root.findByName('Arianna').setPosition(-18,.09,8.2);});
 await page.waitForTimeout(1600);
 await page.evaluate(async()=>{
  const pc=await import('playcanvas'),app=pc.Application.getApplication(),player=app.root.findByName('Arianna');
  const model=player.findComponents('anim')[0].entity,layer=model.anim.baseLayer,camera=app.root.findByTag('migration.camera')[0];
  app.timeScale=0;layer.play('Idle');layer.playing=false;layer.activeStateCurrentTime=0;
  window.jumpQA={app,model,layer,camera,pc,angle:'front'};
  app.on('prerender',()=>{player.findByName('Character visual pivot').setLocalEulerAngles(0,0,0);camera.camera.orthoHeight=1.04;camera.setPosition(window.jumpQA.angle==='side'?-15.5:-18,1.65,window.jumpQA.angle==='side'?8.6:12.2);camera.lookAt(new pc.Vec3(-18,.92,8.2));});
 });
 await page.waitForTimeout(150);await page.screenshot({path:'artifacts/journeys/jump-fixed-idle.png'});
 const upper=()=>page.evaluate(()=>Object.fromEntries(['Spine02','Spine01','Spine','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand'].map(name=>{const n=window.jumpQA.model.findByName(name);return[name,{p:n.getLocalPosition().toArray(),q:n.getLocalRotation().toArray()}];})));
 const idle=await upper();
 // Trigger the real jump button, then inspect the same live clip at exact frames.
 await page.locator('#journey-jump').click();
 assert.equal(await page.evaluate(()=>window.__roomTest.snapshot().character.state),'JourneyJump');
 await page.evaluate(()=>{
  // Scrubbing must not race the gameplay action clock or its transitions.
  // This disposable review page keeps rendering; input transitions have a
  // separate unmodified game-session test in jump-playtest.mjs.
  window.jumpQA.app.off('update');
  window.jumpQA.layer.play('JourneyJump');window.jumpQA.layer.playing=false;
 });
 for(const angle of ['front','side'])for(const [name,time] of [['start',0],['crouch',.20],['takeoff',.40],['falling',.60],['landing',.88],['settle',1.10]]){
  await page.evaluate(({angle,time})=>{window.jumpQA.angle=angle;window.jumpQA.layer.activeStateCurrentTime=time;},{angle,time});
  await page.waitForTimeout(70);
  const pose=await upper();for(const n of Object.keys(idle))for(const key of ['p','q'])pose[n][key].forEach((v,i)=>assert(Math.abs(v-idle[n][key][i])<.00001,`${name}: authored ${n} ${key} changed`));
  const path=`artifacts/journeys/jump-fixed-${angle}-${name}.png`;await page.screenshot({path});
  frames.push({angle,name,time,path,geometry:await page.evaluate(()=>window.__roomTest.characterGeometry())});
 }
 const sampled=await page.evaluate(names=>Array.from({length:71},(_,frame)=>{window.jumpQA.layer.activeStateCurrentTime=frame/60;return Object.fromEntries(names.map(name=>{const n=window.jumpQA.model.findByName(name);return[name,{p:n.getLocalPosition().toArray(),q:n.getLocalRotation().toArray()}];}));}),Object.keys(idle));
 sampled.forEach((pose,frame)=>{for(const n of Object.keys(idle))for(const key of ['p','q'])pose[n][key].forEach((v,i)=>assert(Math.abs(v-idle[n][key][i])<.00001,`frame ${frame}: ${n} ${key} changed`));});
 assert(Math.max(...frames.map(f=>f.geometry[0].minY))-Math.min(...frames.map(f=>f.geometry[0].minY))>.15,'Jump review must include airborne geometry, not frozen idle');
 // Exact-frame review intentionally freezes the live state machine. Real input
 // transitions are checked independently in jump-playtest.mjs without scrubbing.
 const quality=await page.evaluate(()=>{const {app,model}=window.jumpQA;return{devicePixelRatio,canvas:[app.graphicsDevice.width,app.graphicsDevice.height],materials:model.findComponents('render').flatMap(r=>r.meshInstances.map(m=>({name:m.material.name,diffuse:m.material.diffuseMap?[m.material.diffuseMap.width,m.material.diffuseMap.height]:null,normal:m.material.normalMap?[m.material.normalMap.width,m.material.normalMap.height]:null})))}});
 for(const material of quality.materials){assert.deepEqual(material.diffuse,[2048,2048]);assert.deepEqual(material.normal,[2048,2048]);}
 assert.deepEqual(quality.canvas,[1925,1487]);
 await writeFile('artifacts/journeys/jump-review.json',JSON.stringify({errors,authoredUpperBodyPreserved:true,upperBodySamples:71,quality,frames},null,2));
 assert.deepEqual(errors,[]);
 const sheet=await browser.newPage({viewport:{width:1320,height:530}});
 const images=await Promise.all(frames.map(async f=>`<div><label>${f.angle} · ${f.name} · ${f.time.toFixed(2)}s</label><img src="data:image/png;base64,${(await readFile(f.path)).toString('base64')}"></div>`));
 await sheet.setContent(`<style>body{margin:8px;background:#f1e8f5;font:13px Arial;color:#433956;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;align-content:start}div{overflow:hidden}label{display:block;text-align:center;padding:6px}img{width:100%}</style>${images.join('')}`);
 await sheet.screenshot({path:'artifacts/journeys/jump-fixed-contact-sheet.png'});
 console.log(JSON.stringify({authoredUpperBodyPreserved:true,upperBodySamples:71,quality,errors},null,2));
}finally{await browser.close();}
