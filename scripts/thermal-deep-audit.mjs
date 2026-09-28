// Disposable browser instrumentation only. Does not modify production runtime/assets/saves.
import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.AUDIT_OUT||'artifacts/thermal-deep-audit',mode=process.env.AUDIT_MODE||'cpu';await mkdir(out,{recursive:true});
const config=JSON.parse(await readFile('dist/config.json','utf8')),file=config.assets['307711680'].file.url.replace(/^\.\//,'');
const source=await readFile('dist/'+file,'utf8'),hook='  const dogRoaming = new DogRoaming(room, props.pet.dog, props.daily);';assert.equal(source.split(hook).length,2);
const instrumented=source.replace(hook,hook+'\n  window.__deep={app,loop,cleanup,navigation,camera,character,props,room};');
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:30000});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage();
const errors=[],httpErrors=[],results=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
await page.route('**/'+file,route=>route.fulfill({status:200,contentType:'text/javascript',body:instrumented}));
const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
const save=async()=>writeFile(`${out}/${mode}.json`,JSON.stringify({note:'Isolated Edge desktop. CPU samples have no MutationObserver. Controlled scheduler is a diagnostic, not a game change. Full native 1170x2532. No phone temperature/power measurement.',results,errors,httpErrors},null,2));
const command=(cmd,value='')=>page.evaluate(({cmd,value})=>window.__deep.loop.developerCommand(cmd,value),{cmd,value});
const move=(x,z)=>page.evaluate(({x,z})=>window.__deep.character.player.setPosition(x,.09,z),{x,z});
async function walkOut(){
 const box=await page.locator('#joystick').boundingBox(),center={x:box.x+box.width/2,y:box.y+box.height/2},radius=box.width*.29;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...center,id:1}]});const trail=[];
 try{for(let i=0;i<150;i++){const s=await page.evaluate(()=>{const {character,camera,loop}=window.__deep;return{p:character.player.getPosition().toArray(),right:camera.entity.right.toArray(),forward:camera.entity.forward.toArray(),scene:loop.mode,state:camera.state};});trail.push(s);const dx=-6.3-s.p[0],dz=8.25-s.p[2],d=Math.hypot(dx,dz);if(d<.3)break;const a=s.right,f=s.forward;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:center.x+radius*(dx*a[0]+dz*a[2])/Math.hypot(a[0],a[2])/d,y:center.y-radius*(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/d}]});await page.waitForTimeout(60);}}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await page.waitForTimeout(700);results.push({name:'real-joystick-doorway',trail,after:await page.evaluate(()=>({state:window.__deep.camera.state,scene:window.__deep.loop.mode,player:window.__deep.character.player.getPosition().toArray(),target:window.__deep.camera.target?.toArray()}))});await save();
}
async function sample(name,ms=2500){
 await page.waitForTimeout(600);const before=(await cdp.send('Performance.getMetrics')).metrics;
 const data=await page.evaluate(async ms=>{
  const {app,cleanup,navigation}=window.__deep,rows=[],times={},restores=[];let start=0,updates=0,renders=0,draws=0,lookups=0,lookupMs=0;
  const find=app.root.findByTag;app.root.findByTag=function(...args){const t=performance.now();try{return find.apply(this,args);}finally{lookups++;lookupMs+=performance.now()-t;}};restores.push(()=>app.root.findByTag=find);
  for(const [label,object,method]of [['feedback',cleanup.feedback,'update'],['doorLabels',navigation,'update']]){const fn=object[method];times[label]=0;object[method]=function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{times[label]+=performance.now()-t;}};restores.push(()=>object[method]=fn);}
  const begin=()=>start=performance.now(),end=()=>{updates++;rows.push(performance.now()-start);},render=()=>{renders++;draws+=app.graphicsDevice._drawCallsPerFrame;};
  app.on('frameupdate',begin);app.on('framerender',end);app.on('postrender',render);const t=performance.now();await new Promise(r=>setTimeout(r,ms));const duration=performance.now()-t;app.off('frameupdate',begin);app.off('framerender',end);app.off('postrender',render);restores.reverse().forEach(f=>f());rows.sort((a,b)=>a-b);
  return {duration,updates,renders,fps:renders*1000/duration,meanUpdateMs:rows.reduce((a,b)=>a+b,0)/rows.length,p50:rows[Math.floor(rows.length*.5)],p95:rows[Math.floor(rows.length*.95)],draws:renders?draws/renders:0,lookups,lookupMs,componentMs:times,markers:{total:cleanup.feedback.markers.length,visible:cleanup.feedback.markers.filter(m=>!m.label.hidden).length},resolution:[app.graphicsDevice.width,app.graphicsDevice.height]};
 },ms);
 const after=(await cdp.send('Performance.getMetrics')).metrics;data.metrics=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after.find(m=>m.name===k).value-before.find(m=>m.name===k).value]));results.push({name,...data});console.log(name,JSON.stringify(data));await save();
}
async function cacheCamera(on){await page.evaluate(on=>{const {app}=window.__deep;if(!window.__deepFind){window.__deepFind=app.root.findByTag;window.__deepCamera=app.root.findByTag('migration.camera');}app.root.findByTag=on?function(...args){return args.length===1&&args[0]==='migration.camera'?window.__deepCamera:window.__deepFind.apply(this,args);}:window.__deepFind;},on);}
async function cadence(hz){await page.evaluate(hz=>{const {app}=window.__deep;cancelAnimationFrame(app.frameRequestId);app.frameRequestId=null;clearTimeout(window.__deepTimer);let next=performance.now();app.requestAnimationFrame=function(){next+=1000/hz;if(next<performance.now()-1000/hz)next=performance.now()+1000/hz;window.__deepTimer=setTimeout(()=>{app.frameRequestId=null;app.tick(performance.now());},Math.max(0,next-performance.now()));};app.requestAnimationFrame();},hz);}
async function resources(name){
 await page.waitForTimeout(1200);await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage');
 const data=await page.evaluate(()=>{const {app,loop}=window.__deep,d=app.graphicsDevice,entities=app.root.find(()=>true),renders=app.root.findComponents('render'),models=app.root.findComponents('model'),assets=app.assets.list(),textures=[...d.textures];return {scene:loop.mode,heapJs:performance.memory?.usedJSHeapSize,vram:{...d._vram},entities:entities.length,renders:renders.length,models:models.length,batches:app.batcher._batchList.length,groups:Object.keys(app.batcher._batchGroups).length,assets:assets.length,loadedContainers:assets.filter(a=>a.type==='container'&&a.loaded).length,textures:textures.map(t=>({id:t.id??t._id,name:t.name,bytes:t.gpuSize,width:t.width,height:t.height})),postupdateListeners:app._callbacks.get('postupdate')?.length,sections:loop.neighborhood.snapshot().loadedSections};});
 results.push({name,heap,...data});console.log(name,JSON.stringify({scene:data.scene,entities:data.entities,assets:data.assets,textures:data.textures.length,texMiB:data.vram.tex/1048576,vbMiB:data.vram.vb/1048576,heapMiB:heap.usedSize/1048576}));await save();
}
async function rendering(name){
 await page.waitForTimeout(900);
 const data=await page.evaluate(async()=>{
  const {app,camera}=window.__deep,r=app.renderer,shadow=r._shadowRenderer??r.shadowRenderer; if(!shadow?.submitCasters)throw Error('Cannot inspect shadow renderer: '+Object.keys(r).filter(k=>/shadow/i.test(k)));
  const path=node=>{const names=[];while(node&&node!==app.root){names.unshift(node.name);node=node.parent;}return names.join('/');};
  const batchMap=new Map(app.batcher._batchList.map(b=>[b.meshInstance,b]));const describe=m=>{const b=batchMap.get(m),originals=b?.origMeshInstances??[m];return {name:m.node.name,path:path(m.node),material:m.material.name,triangles:(m.mesh.primitive[0]?.count??0)/3,visible:m.visible,nodeEnabled:m.node.enabled,insideView:!!camera.entity.camera.frustum.containsAabb(m.aabb),batchGroup:b?app.batcher._batchGroups[b.batchGroupId]?.name:null,sourceCount:originals.length,sources:originals.map(m=>({path:path(m.node),enabled:m.node.enabled,material:m.material.name})).slice(0,30)};};
  let submissions=[];const original=shadow.submitCasters;shadow.submitCasters=function(casters,light,cam){submissions.push({light:light._node?.name,casters:casters.map(describe)});return original.call(this,casters,light,cam);};
  await new Promise(resolve=>app.once('postrender',resolve));shadow.submitCasters=original;
  const layer=app.scene.layers.getLayerById(0),culled=layer.getCulledInstances(camera.entity.camera.camera);
  const forward=[...culled.opaque,...culled.transparent].map(describe);
  return {shadow:submissions,forward,draws:app.graphicsDevice._drawCallsPerFrame,resolution:[app.graphicsDevice.width,app.graphicsDevice.height],engineVersion:window.__deepVersion,player:window.__deep.character.player.getPosition().toArray(),cameraState:camera.state,cameraOffset:camera.offset.toArray(),cameras:app.root.findComponents('camera').map(c=>({name:c.entity.name,enabled:c.enabled&&c.entity.enabled,position:c.entity.getPosition().toArray(),forward:c.entity.forward.toArray(),priority:c.priority,followed:c.entity===camera.entity})),disabledPreviewRoots:app.root.findByTag('migration.preview').filter(n=>!n.enabled).length};
 });results.push({name,...data});console.log(name,JSON.stringify({draws:data.draws,forward:data.forward.length,shadow:data.shadow.map(s=>s.casters.length),disabledPreviewRoots:data.disabledPreviewRoots}));await save();
}
try{
 await page.goto('http://127.0.0.1:5193/dist/index.html?preview=home-play');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:60000});await page.waitForTimeout(3500);
 await page.evaluate(async()=>{window.__deepVersion=(await import('playcanvas')).version;});await command('phase','morning');await command('freeze-clock');console.log('Ready',mode);
 if(mode==='regression'){
  const ready=()=>page.waitForFunction(()=>!window.__deep.character.animator.busy&&!window.__deep.cleanup.activeInteractionId,undefined,{timeout:15000});
  const target=async id=>{await page.evaluate(id=>{const {props,character}=window.__deep,t=props.interactions.find(t=>t.id===id);assertTarget(t);function assertTarget(t){if(!t)throw Error('Missing target '+id);}character.player.setPosition(t.anchor.x-.65,.09,t.anchor.z);},id);await page.waitForFunction(id=>window.__deep.cleanup.interactions.focus?.id===id,id,{timeout:5000});for(let i=0;i<12&&await page.locator('#action-button').getAttribute('data-target')!==id;i++){await page.keyboard.press('r');await page.waitForTimeout(80);}assert.equal(await page.locator('#action-button').getAttribute('data-target'),id);};
  await command('phase','afternoon');await target('daily-vacuum');await page.locator('#action-button').tap();await ready();
  await page.waitForFunction(()=>window.__deep.cleanup.carry.item?.id==='vacuum');
  const guided=()=>page.locator('.cleanup-marker[data-guided="true"]').getAttribute('data-target');
  assert.match(await guided(),/^vacuum-/);assert.equal(await page.locator('.cleanup-marker[data-target="put-tool-away"]').getAttribute('data-guided'),'false');
  // A remote destination remains clamped on screen; hidden labels need no projection.
  await move(-2.1,8.2);await page.waitForTimeout(700);
  const guidance=await page.evaluate(()=>{const {cleanup}=window.__deep,m=cleanup.feedback.markers.find(m=>m.label.dataset.guided==='true');return{id:m.target.id,hidden:m.label.hidden,offscreen:m.label.classList.contains('offscreen'),transform:m.label.style.transform};});
  assert.equal(guidance.hidden,false);assert.ok(guidance.transform);results.push({name:'carried-tool-guidance',...guidance});await page.screenshot({path:out+'/guidance.png'});
  await page.locator('#adventure-menu-open').click();await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__deep.cleanup.feedback.markers.filter(m=>!m.label.hidden).length),0);
  await command('freeze-clock');const time=await page.evaluate(()=>window.__deep.props.daily.clock.state.minutes);await page.waitForTimeout(1200);
  assert.ok(await page.evaluate(t=>window.__deep.props.daily.clock.state.minutes>t,time),'Daily clock continues behind menu');
  await page.locator('#adventure-menu .adventure-close').click();await command('freeze-clock');await page.waitForTimeout(250);assert.equal(await page.locator('.cleanup-marker[data-guided="true"]').isVisible(),true);
  await target('put-tool-away');await page.locator('#action-button').tap();await ready();assert.equal(await page.evaluate(()=>window.__deep.cleanup.carry.item?.id??null),null);
  await command('phase','morning');await walkOut();assert.equal(await page.evaluate(()=>window.__deep.loop.mode),'outdoors');assert.equal(await page.evaluate(()=>window.__deep.camera.state),'EXPLORE');
  await move(-69,-22);await resources('far-lane');const far=await page.evaluate(()=>window.__deep.loop.neighborhood.snapshot().loadedSections);assert.ok(far.length>0&&far.length<4);
  await page.screenshot({path:out+'/outdoors.png'});await command('phase','morning');await resources('returned-home');assert.deepEqual(await page.evaluate(()=>window.__deep.loop.neighborhood.snapshot().loadedSections),[]);
  await move(.55,11.9);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__deep.navigation.current),'kitchen');assert.equal(await page.locator('h1').textContent(),'Something good cooking.');
  await command('store','corner');await command('phase','morning');await move(.55,11.9);await page.waitForTimeout(300);assert.equal(await page.locator('h1').textContent(),'Something good cooking.');
  await page.screenshot({path:out+'/home.png'});
  const quality=await page.evaluate(()=>{const {app,character}=window.__deep,model=character.player.findComponents('anim')[0].entity;return{resolution:[app.graphicsDevice.width,app.graphicsDevice.height],ratio:app.graphicsDevice.maxPixelRatio,maps:model.findComponents('render').flatMap(r=>r.meshInstances.map(m=>({color:[m.material.diffuseMap.width,m.material.diffuseMap.height],normal:[m.material.normalMap.width,m.material.normalMap.height],triangles:m.mesh.primitive[0].count/3,joints:m.skinInstance.bones.length}))),keys:Object.keys(localStorage)};});
  assert.deepEqual(quality.resolution,[1170,2532]);assert.equal(quality.ratio,3);assert.ok(quality.maps.length);for(const m of quality.maps){assert.deepEqual(m.color,[2048,2048]);assert.deepEqual(m.normal,[2048,2048]);assert.equal(m.triangles,14694);assert.equal(m.joints,28);}assert.ok(quality.keys.every(k=>!k.startsWith('arianna.')));results.push({name:'quality-and-save-isolation',...quality});await save();assert.deepEqual(httpErrors,[]);
 }else if(mode==='cpu'){
  await sample('native-cadence-original-no-observer');await cadence(30);
  for(const [name,on]of [['original-A1',false],['cached-B1',true],['cached-B2',true],['original-A2',false]]){await cacheCamera(on);await sample('controlled-30Hz-'+name);}
  await page.locator('#adventure-menu-open').click();await sample('controlled-30Hz-menu-original');await cacheCamera(true);await sample('controlled-30Hz-menu-cached');await page.locator('#adventure-menu .adventure-close').click();
  await cacheCamera(false);await command('play-pop');await page.waitForTimeout(1800);await sample('controlled-30Hz-pop-menu-original');await cacheCamera(true);await sample('controlled-30Hz-pop-menu-cached');
 }else if(mode==='batch'){
  await cacheCamera(true);await cadence(30);await sample('toys-original');await rendering('toys-original');await page.screenshot({path:out+'/toys-original.png'});
  const batchInfo=await page.evaluate(()=>{const {app,loop}=window.__deep;const group=app.batcher.addGroup('Audit only: toy parts',true,6),renderers=[...loop.homePlay.items.values()].flatMap(item=>item.entity.findComponents('render'));window.__deepToyBatch={group,renderers,ids:renderers.map(r=>r.batchGroupId)};for(const r of renderers)r.batchGroupId=group.id;app.batcher.generate([group.id]);return{parts:renderers.length,group:group.id};});results.push({name:'temporary-toy-batch',...batchInfo});
  await page.waitForTimeout(2000);await sample('toys-dynamic-batch');await rendering('toys-dynamic-batch');await page.screenshot({path:out+'/toys-batched.png'});
  await page.evaluate(()=>{const {app}=window.__deep,{group,renderers,ids}=window.__deepToyBatch;renderers.forEach((r,i)=>r.batchGroupId=ids[i]);app.batcher.removeGroup(group.id);});await sample('toys-restored');
 }else if(mode==='render'){
  await rendering('house');await cacheCamera(true);await command('store','corner');await rendering('store');await command('phase','morning');await walkOut();await move(-17,-22);await page.waitForTimeout(1800);await rendering('lane-near');await move(-69,-22);await page.waitForTimeout(1800);await rendering('lane-far');await page.screenshot({path:out+'/lane-far.png'});
 }else if(mode==='memory'){
  await cacheCamera(true);await cadence(30);await resources('initial-house');
  for(let i=1;i<=4;i++){
   await command('recess');await page.waitForFunction(()=>window.__deep.loop.recess.isReady,undefined,{timeout:60000});await resources('school-'+i);await command('phase','morning');await resources('home-after-school-'+i);
   await walkOut();await move(-69,-22);await page.waitForTimeout(1800);await resources('lane-'+i);await command('phase','morning');await resources('home-after-lane-'+i);
  }
 }
 assert.deepEqual(errors,[]);console.log('Complete',mode);
}catch(e){console.error(e);results.push({name:'failure-state',snapshot:await page.evaluate(()=>window.__roomTest?.snapshot())});await page.screenshot({path:out+'/failure.png'});await save();throw e;}finally{await browser.close();}
