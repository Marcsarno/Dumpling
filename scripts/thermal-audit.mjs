// Local diagnostic only: fresh browser saves; no resolution or character changes.
// Historical first pass: outdoor teleports can retain a toy-focused CHORE camera.
// Use thermal-deep-audit.mjs for verified outdoor/camera and observer-free CPU checks.
import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.EVIDENCE||'artifacts/thermal-audit';await mkdir(out,{recursive:true});
console.log('Launching isolated Edge audit');
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:30000});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],samples=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Page error',e.message);});
page.on('console',m=>{if(m.type()==='error')console.error('Console',m.text().slice(0,350));});
page.on('requestfailed',r=>console.error('Request failed',r.url(),r.failure()?.errorText));
const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
async function measure(name){
 await page.waitForTimeout(1200);
 const before=(await cdp.send('Performance.getMetrics')).metrics;
 const result=await page.evaluate(async()=>{
  const app=window.thermalApp,rows=[],mutations={};let updates=0,renders=0,updateStart=0,updateMs=0,renderStart=0;
  const observer=new MutationObserver(records=>{for(const r of records){const e=r.target.nodeType===1?r.target:r.target.parentElement,key=e?.id||e?.className||e?.nodeName||'?';mutations[key]=(mutations[key]||0)+1;}});
  observer.observe(document.querySelector('#game'),{subtree:true,attributes:true,childList:true,characterData:true});
  const begin=()=>updateStart=performance.now(),end=()=>updateMs=performance.now()-updateStart,pre=()=>renderStart=performance.now();
  const update=()=>updates++,render=()=>{renders++;rows.push({draws:app.graphicsDevice._drawCallsPerFrame,updateMs,renderCpuMs:performance.now()-renderStart});};
  app.on('frameupdate',begin);app.on('framerender',end);app.on('prerender',pre);
  app.on('update',update);app.on('postrender',render);const start=performance.now();await new Promise(r=>setTimeout(r,3000));const duration=performance.now()-start;app.off('update',update);app.off('postrender',render);app.off('frameupdate',begin);app.off('framerender',end);app.off('prerender',pre);observer.disconnect();
  const d=app.graphicsDevice,ext=d.gl.getExtension('WEBGL_debug_renderer_info');
  return {duration,updates,renders,renderFps:renders*1000/duration,average:Object.fromEntries(Object.keys(rows[0]||{}).map(k=>[k,rows.reduce((s,r)=>s+r[k],0)/rows.length])),mutations:Object.entries(mutations).sort((a,b)=>b[1]-a[1]).slice(0,20),mutationCount:Object.values(mutations).reduce((a,b)=>a+b,0),resolution:[d.width,d.height],vram:{...d._vram},textures:[...d.textures].length,assets:app.assets.list().length,renderer:ext?d.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,scene:window.__roomTest.snapshot().loop.mode,lights:app.root.findComponents('light').filter(l=>l.enabled&&l.entity.enabled).map(l=>({name:l.entity.name,shadows:l.castShadows,resolution:l.shadowResolution,distance:l.shadowDistance,cascades:l.numCascades,updateMode:l.shadowUpdateMode})),roots:app.root.children.map(e=>({name:e.name,enabled:e.enabled}))};
 });
 const after=(await cdp.send('Performance.getMetrics')).metrics;result.browserMetrics=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after.find(m=>m.name===k).value-before.find(m=>m.name===k).value]));
 samples.push({name,...result});console.log(name,JSON.stringify({fps:result.renderFps,average:result.average,textureMiB:result.vram.tex/1048576,mutations:result.mutationCount,metrics:result.browserMetrics}));
 await writeFile(out+'/report.json',JSON.stringify({note:'Desktop Edge at native 1170x2532. No physical phone, power, temperature or mobile GPU measurement. Shadow freeze is diagnostic only and is reverted immediately.',samples,errors},null,2));
}
async function dev(command,value){await page.keyboard.press('F2');await page.locator('[data-tab]').nth(command==='phase'?1:0).click();await page.locator(`[data-command="${command}"]${value?`[data-value="${value}"]`:''}`).first().click();if(await page.locator('#developer-panel').evaluate(d=>d.open))await page.locator('.dev-close').click();}
async function move(x,z){await page.evaluate(({x,z})=>window.thermalApp.root.findByName('Arianna').setPosition(x,.09,z),{x,z});}
try{
 console.log('Loading local game');await page.goto(process.env.GAME_URL||'http://127.0.0.1:5193/dist/index.html?preview=home-play');
 console.log('Page loaded');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:60000});console.log('Character ready');await page.waitForTimeout(3000);
 await page.evaluate(async()=>{const pc=await import('playcanvas');window.thermalApp=pc.Application.getApplication();});
 await dev('phase','morning');
 if(process.env.CACHE_ONLY){
  await measure('house-original-camera-lookups');
  await page.evaluate(()=>{const root=window.thermalApp.root,find=root.findByTag,camera=find.call(root,'migration.camera');window.thermalOriginalFind=find;root.findByTag=function(...args){return args.length===1&&args[0]==='migration.camera'?camera:find.apply(this,args);};});
  await measure('house-cached-camera-diagnostic');await page.locator('#adventure-menu-open').click();await measure('menu-cached-camera-diagnostic');
  await page.evaluate(()=>window.thermalApp.root.findByTag=window.thermalOriginalFind);
 }else if(process.env.PROFILE_ONLY){
  await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await page.waitForTimeout(5000);const {profile}=await cdp.send('Profiler.stop');await writeFile(out+'/house.cpuprofile',JSON.stringify(profile));
  const byId=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map();for(const n of profile.nodes)for(const c of n.children||[])parents.set(c,n.id);const own=new Map(),inclusive=new Map();
  for(let i=0;i<profile.samples.length;i++){let id=profile.samples[i],time=profile.timeDeltas[i];own.set(id,(own.get(id)||0)+time);while(id){inclusive.set(id,(inclusive.get(id)||0)+time);id=parents.get(id);}}
  const rows=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,selfMs:(own.get(n.id)||0)/1000,inclusiveMs:(inclusive.get(n.id)||0)/1000}));
  const summary={self:rows.sort((a,b)=>b.selfMs-a.selfMs).slice(0,25),inclusive:rows.sort((a,b)=>b.inclusiveMs-a.inclusiveMs).slice(0,30)};await writeFile(out+'/cpu-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
 }else{
 await measure('house-morning');await page.screenshot({path:out+'/house.png'});
 const inventory=await page.evaluate(()=>{const app=window.thermalApp;return{textures:[...app.graphicsDevice.textures].map(t=>({name:t.name,width:t.width,height:t.height,bytes:t.gpuSize})).sort((a,b)=>b.bytes-a.bytes),containers:app.assets.list().filter(a=>a.type==='container').map(a=>({name:a.name,loaded:a.loaded})),renderComponents:app.root.findComponents('render').length};});await writeFile(out+'/inventory.json',JSON.stringify(inventory,null,2));
 await page.locator('#adventure-menu-open').click();await measure('house-menu');await page.locator('#adventure-menu .adventure-close').click();
 // Repeat with unchanged-value DOM writes elided in this disposable page only.
 await page.evaluate(()=>{const p=Node.prototype,d=Object.getOwnPropertyDescriptor(p,'textContent');window.thermalTextDescriptor=d;Object.defineProperty(p,'textContent',{...d,set(value){if(d.get.call(this)!==String(value??''))d.set.call(this,value);}});});await measure('house-identical-text-writes-skipped');
 await page.evaluate(()=>Object.defineProperty(Node.prototype,'textContent',window.thermalTextDescriptor));
 await page.evaluate(()=>{window.thermalShadowModes=window.thermalApp.root.findComponents('light').filter(l=>l.castShadows).map(l=>[l,l.shadowUpdateMode]);for(const [l]of window.thermalShadowModes)l.shadowUpdateMode=0;});await measure('house-shadow-updates-frozen-diagnostic');await page.evaluate(()=>{for(const [l,mode]of window.thermalShadowModes)l.shadowUpdateMode=mode;});
 await dev('phase','night');await measure('house-night');
 await dev('store','corner');await measure('corner-store');
 await dev('phase','morning');await move(-6,8.2);await page.waitForTimeout(800);await move(-17,-22);await measure('lane-near-house');
 await move(-69,-22);await measure('lane-far');await page.screenshot({path:out+'/lane-far.png'});
 await dev('recess');await page.waitForTimeout(4000);await measure('school');
 await dev('phase','morning');await measure('house-after-school');
 console.log('Errors',JSON.stringify(errors));
 }
}catch(e){console.error(e);await page.screenshot({path:out+'/failure.png',timeout:10000}).catch(()=>{});throw e;}finally{await browser.close();}
