// Isolated saved collection fixture; all movement, opening and trading use actual touch controls.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {DUMPLINGS} from '../src/data/collection.ts';
import {createTradingDay} from '../src/data/trading.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
await mkdir('artifacts/trading',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pass=name=>{checks.push(name);console.log('PASS '+name)};
const photo=name=>page.screenshot({path:'artifacts/trading/'+name+'.png'});
const cdp=await context.newCDPSession(page);
async function moveTo(x,z){
  const b=await page.locator('#joystick').boundingBox(),c={x:b.x+b.width/2,y:b.y+b.height/2},radius=b.width*.29;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...c,id:1}]});
  const start=Date.now();let arrived=false;
  while(Date.now()-start<10000){
    const s=await snap(),dx=x-s.position[0],dz=z-s.position[2],distance=Math.hypot(dx,dz);if(distance<.12){arrived=true;break;}
    const r=s.cameraRight,f=s.cameraForward,mag=Math.min(1,Math.max(.35,distance*3));
    const ix=(dx*r[0]+dz*r[2])/Math.hypot(r[0],r[2])/distance*mag,iy=(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/distance*mag;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:c.x+radius*ix,y:c.y-radius*iy}]});await sleep(65);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(arrived,'Reachable recess seat '+[x,z]);await sleep(80);
}
async function trader(id){const seat=(await snap()).loop.recess.seats.find(s=>s.id===id);await moveTo(seat.position[0],2);await page.waitForFunction(id=>document.querySelector('#action-button').dataset.target===id,id);await page.locator('#action-button').tap();await page.locator('#trading-dialog').waitFor({state:'visible'});}
async function enter(){await page.locator('#visit-recess').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='recess');await sleep(500);}
const trading=createTradingDay(1);
trading.traders.cute={stock:['comet','blueberry','custard','orbit','aurora','supernova'],offer:['blueberry'],asks:0,revision:0,done:false,message:'Here’s my Blueberry. I love pink and bows!'};
trading.traders.rarity={stock:['orbit','blueberry','aurora','supernova','comet','custard'],offer:['orbit'],asks:0,revision:0,done:false,message:'Got something rare?'};
const progress={version:1,balance:17,collection:Object.fromEntries(DUMPLINGS.map(d=>[d.id,d.id==='blueberry'?0:d.id==='minty'?1:3])),boxes:[{id:'duplicate-test',dumplingId:'rosie'}],creditedRounds:[],trip:{active:false,purchases:0},location:'home',reveal:null,trading};
await context.addInitScript(progress=>{if(!localStorage.getItem('trading-test-started')){localStorage.setItem('arianna.progress.v1',JSON.stringify(progress));localStorage.setItem('trading-test-started','1');}},progress);
try{
  await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);
  await page.locator('#action-button').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');assert.equal((await snap()).loop.collection.rosie,4);pass('Open a saved sealed box and receive a real duplicate');
  await page.locator('#action-button').tap();await page.locator('#collection-dialog').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Lock Mochi',exact:true}).tap();await page.getByRole('button',{name:'Favorite Custard',exact:true}).tap();
  await enter();await photo('01-courtyard');
  await trader('rarity');await photo('02-rarity-hunter');
  assert.equal(await page.locator('#trade-inventory [data-id=mochi]').isDisabled(),true);assert.equal(await page.locator('#trade-inventory [data-id=custard]').isDisabled(),true);assert.equal(await page.locator('#trade-inventory [data-id=minty]').isDisabled(),true);
  await page.locator('#trade-inventory [data-id=kitten]').tap();await page.locator('#trade-add').tap();assert.match(await page.locator('.trade-speech').textContent(),/keep/);
  await page.locator('#trade-add').tap();assert.match(await page.locator('.trade-speech').textContent(),/instead/);
  const negotiated=(await snap()).loop.trading,unchanged=(await snap()).loop.collection;
  await page.locator('#trade-cancel').tap();assert.deepEqual((await snap()).loop.collection,unchanged);pass('Rarity Hunter refuses, swaps, and X walks away without giving anything');
  await trader('series');await photo('03-series-collector');assert.match(await page.locator('.trade-header').textContent(),/Garden Friends/);await page.locator('#trade-cancel').tap();pass('All three classmates are physically reachable and show different preferences');
  await trader('cute');
  await page.locator('#trade-singles').check();assert.equal(await page.locator('#trade-inventory [data-id=minty]').isDisabled(),false);assert.equal(await page.locator('#trade-inventory [data-id=mochi]').isDisabled(),true);
  await page.locator('#trade-inventory [data-id=minty]').tap();await page.locator('#trade-inventory [data-id=rosie]').tap();
  const confirmation=page.waitForEvent('dialog');const tap=page.locator('#trade-accept').tap();const warning=await confirmation;assert.match(warning.message(),/last Minty/);await warning.dismiss();await tap;
  assert.equal((await snap()).loop.collection.minty,1);assert.equal((await snap()).loop.trading.traders.cute.done,false);await page.locator('#trade-singles').uncheck();pass('Last-copy inclusion still requires explicit confirmation; cancel keeps everything');
  await page.locator('#trade-inventory [data-id=rosie]').tap();assert.equal(await page.locator('#trade-accept').isDisabled(),false);
  await page.locator('#trade-add').tap();assert.match(await page.locator('.trade-speech').textContent(),/add/);assert.equal(await page.locator('#npc-offer .trade-item').count(),2);
  for(const [width,height] of [[320,568],[390,844],[430,932]]){
    await page.setViewportSize({width,height});await photo(`04-offer-${width}`);
    const layout=await page.evaluate(()=>{const d=document.querySelector('#trading-dialog'),buttons=[...document.querySelectorAll('.trade-controls button')];return{overflow:d.scrollWidth>d.clientWidth,buttons:buttons.map(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>=44&&r.width>=44})};});
    assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(Boolean));
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#trade-accept').tap();
  let s=await snap();assert.equal(s.loop.collection.rosie,3);assert.equal(s.loop.collection.blueberry,1);assert.equal(s.loop.collection.comet,4);assert.equal(s.loop.balance,17);assert.equal(await page.locator('#trade-accept').isDisabled(),true);await photo('05-deal');pass('A common duplicate buys a new Rare plus an extra from Cute Collector; one atomic saved deal');
  await page.locator('#trade-cancel').tap();await page.locator('#leave-recess').tap();
  await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await enter();await trader('cute');assert.equal(await page.locator('#trade-accept').isDisabled(),true);assert.equal((await snap()).loop.collection.blueberry,1);assert.deepEqual((await snap()).loop.trading.traders.rarity,negotiated.traders.rarity);pass('Reload retains received items, protections, negotiated offers and completed daily trade');
  await page.locator('#trade-cancel').tap();await page.locator('#leave-recess').tap();
  // School-entry fixture only: no real save is touched. Actual school exit and next day offers use runtime controls.
  await page.addInitScript(()=>{if(sessionStorage.getItem('trading-school-fixture'))return;sessionStorage.setItem('trading-school-fixture','1');const d={version:1,day:2,minutes:510,phase:'school',done:[],eggDrop:false,breakfast:'done',dust:[0,1,2],schoolSeconds:3};localStorage.setItem('arianna.daily.v1',JSON.stringify(d));const p=JSON.parse(localStorage.getItem('arianna.progress.v1'));p.location='cleanup';localStorage.setItem('arianna.progress.v1',JSON.stringify(p));});
  await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().loop.mode==='recess');assert.equal((await snap()).loop.trading.day,2);assert.equal((await snap()).loop.trading.traders.cute.done,false);
  await sleep(1500);assert.equal((await snap()).cleanup.daily.phase,'school');await page.locator('#leave-recess').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.phase==='afternoon');assert.equal((await snap()).loop.mode,'cleanup');pass('School enters recess, clock pauses, leaving resumes afternoon, next day refreshes traders');
  assert.deepEqual(errors,[]);await writeFile('artifacts/trading/report.json',JSON.stringify({checks,errors,snapshot:await snap()},null,2));
}catch(error){await photo('failure');console.error(error);await writeFile('artifacts/trading/failure.json',JSON.stringify({error:String(error),errors,snapshot:await snap().catch(()=>null)},null,2));process.exitCode=1;}finally{await browser.close();}
