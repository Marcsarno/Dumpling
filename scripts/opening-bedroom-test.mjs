// Real touch input and isolated save fixtures, never the user's browser profile.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {DUMPLINGS} from '../src/data/collection.ts';
import {SQUISHY_PRESENTATION,revealDuration} from '../src/data/squishyPresentation.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const output='artifacts/opening';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
const cases=[['rosie',false,390,844],['mochi',true,320,568],['blueberry',false,390,844],['cocoa',true,320,568],['sugarplum-bunny',false,390,844],['starlight-panda',true,320,568],['solstice-dragon',false,390,844],['moonwish-panda',true,1280,800],['opal-bunny',true,430,932,true]];
try{for(const[id,duplicate,width,height,reduced=false] of cases.filter(c=>!process.env.OPENING_CASES||process.env.OPENING_CASES.split(",").includes(c[0]))){
 const data=DUMPLINGS.find(d=>d.id===id),context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await context.addInitScript(({id,duplicate})=>{if(localStorage.getItem('polish-fixture'))return;localStorage.setItem('polish-fixture','1');localStorage.setItem('arianna.progress.v1',JSON.stringify({version:1,balance:27,collection:duplicate?{[id]:2}:{},boxes:[{id:'polish-box',dumplingId:id}],creditedRounds:['old-round'],trip:{active:false,purchases:0},location:'home',reveal:null,pop:{tickets:11,bestScore:900,rounds:['old-pop'],tutorialSeen:true,couponDay:0}}));},{id,duplicate});
 const snapshot=()=>page.evaluate(()=>window.__roomTest.snapshot()),save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.progress.v1')));
 try{
  await page.goto(process.env.GAME_URL??'http://127.0.0.1:5191/dist/index.html');await page.locator('#game[data-ready=true]').waitFor({timeout:60000});await page.waitForTimeout(350);
  const camera=(await snapshot()).cameraHeight;await page.evaluate(()=>{window.polishFrames=[];window.polishMeasure=true;let last=performance.now();function frame(now){if(!window.polishMeasure)return;window.polishFrames.push(now-last);last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  await page.locator('#action-button[data-target=open-box]').tap();
  if(!reduced){await page.waitForFunction(()=>window.__roomTest.snapshot().loop.opening.elapsed>1.65);assert.equal((await snapshot()).loop.phase,'opening');await page.screenshot({path:`${output}/${id}-burst-${width}.png`});}
  await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');
  const state=await snapshot(),duration=state.loop.opening.elapsed,config=SQUISHY_PRESENTATION[data.rarity];
  assert.equal(state.loop.opening.rarity,data.rarity);assert.equal(state.loop.opening.vfx.burstStars,config.sparkles);assert.ok(state.loop.opening.vfx.triangles<650);assert.equal(state.loop.opening.vfx.drawCalls,1);assert.equal(state.cameraHeight,camera);
  if(!reduced)assert.ok(duration>=revealDuration(data.rarity)&&duration<revealDuration(data.rarity)+.06);else assert.equal(duration,0);
  assert.equal(await page.locator('.reveal-status').innerText(),duplicate?'DUPLICATE · ×3':'NEW!');assert.equal(await page.locator('#reveal-copy h2').innerText(),data.name);assert.ok((await page.locator('.reveal-rarity').innerText()).includes(data.rarity));
  const copy=await page.locator('#reveal-copy').boundingBox();for(const selector of ['#squish-friend','#action-button','.dev-launch']){const b=await page.locator(selector).boundingBox();assert.ok(b.x>=0&&b.x+b.width<=width&&b.y+b.height<height);assert.ok(copy.y+copy.height<b.y||b.y+b.height<copy.y,'Copy clear of controls');}
  await page.screenshot({path:`${output}/${id}-settled-${width}.png`});
  const before=await save();assert.equal(before.collection[id],duplicate?3:1);assert.equal(before.balance,27);assert.equal(before.pop.tickets,11);
  await page.locator('#squish-friend').tap();await page.waitForTimeout(180);assert.deepEqual(await save(),before);
  const timing=await page.evaluate(()=>{window.polishMeasure=false;const frames=window.polishFrames.slice(3).sort((a,b)=>a-b);return{p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],frames:frames.length};});
  // Separate settled performance from shader warm-up, asset arrival and screenshots.
  const idleTiming=await page.evaluate(()=>new Promise(resolve=>{const frames=[];let last=performance.now(),start=last;function tick(now){frames.push(now-last);last=now;if(now-start<1200)requestAnimationFrame(tick);else{frames.sort((a,b)=>a-b);resolve({p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],frames:frames.length});}}requestAnimationFrame(tick);}));
  await page.reload();await page.locator('#game[data-ready=true]').waitFor();assert.deepEqual(await save(),before);assert.equal((await snapshot()).loop.phase,'revealed');assert.equal(await page.locator('.reveal-status').innerText(),duplicate?'DUPLICATE · ×3':'NEW!');
  assert.equal(await page.locator('video').count(),0);assert.deepEqual(errors,[]);
  report.push({id,rarity:data.rarity,duplicate,width,height,reduced,duration,drawCalls:state.drawCalls,vfx:state.loop.opening.vfx,timing,idleTiming,errors});console.log('PASS',id,data.rarity,duplicate?'duplicate':'new',width,reduced?'reduced':'animated','frame p95',timing.p95.toFixed(1),'settled p95',idleTiming.p95.toFixed(1));
 }catch(e){await page.screenshot({path:`${output}/FAIL-${id}-${width}.png`});throw e;}finally{await context.close();}
}}finally{await browser.close();await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));}
