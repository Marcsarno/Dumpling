import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {browser,context,page,errors,checks,snap,sleep,photo,pass,moveTo,action,dev,setPlanner} from './store-test-helpers.mjs';
const results=[];
try {
 await page.goto(process.env.GAME_URL);
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 await page.evaluate(()=>{for(const k of ['arianna.progress.v1','arianna.daily.v1','arianna.lilah.v1'])localStorage.setItem(k,'QA sentinel — disposable context');});
 for(const id of ['corner','toys','collector']){
  await dev('store',id);let s=await snap();setPlanner(s.loop.store);assert.deepEqual(s.loop.store.art.errors,[]);
  const before={balance:s.loop.balance,boxes:s.loop.boxes},sites=s.loop.store.sites;
  for(const site of sites){
   await moveTo(site.position);await action('hunt-site-'+site.id);
   await page.waitForFunction(({id,site})=>window.__roomTest.snapshot().loop.hunt.stores[id].slots.find(s=>s.site===site).discovered,{id,site:site.id},{timeout:10000});
   pass(id+' · walk and inspect display '+site.id);
   if(site.id===0){await sleep(250);await action('hunt-site-0');await page.waitForFunction(n=>window.__roomTest.snapshot().loop.boxes===n,before.boxes+1);assert.ok((await snap()).loop.balance<before.balance);pass(id+' · purchase retains original economy');}
  }
  await moveTo(s.loop.store.exit);await sleep(900);assert.equal(await page.locator('#action-button').getAttribute('data-target'),'go-home');
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});await sleep(250);const rects=await page.locator('#joystick, #action-button').evaluateAll(ns=>ns.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));assert.ok(rects.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=width+1&&r.y+r.h<=845));await photo(id+'-'+width);}
  await page.setViewportSize({width:390,height:844});s=await snap();assert.equal(s.characterLoaded,true);assert.equal(s.animationState,'Idle');
  const purchased=s.loop.boxes;await page.reload();await page.waitForFunction(id=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().loop.store?.id===id,id,{timeout:90000});s=await snap();assert.equal(s.loop.boxes,purchased);assert.equal(s.loop.hunt.stores[id].slots.filter(s=>s.discovered).length,6);pass(id+' · reload persists purchase and all discoveries');results.push({id,snapshot:s});setPlanner(s.loop.store);await moveTo(s.loop.store.exit);await action('go-home');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='home');pass(id+' · welcome mat returns home');
 }
 const protectedValues=await page.evaluate(()=>['arianna.progress.v1','arianna.daily.v1','arianna.lilah.v1'].map(k=>localStorage.getItem(k)));assert.ok(protectedValues.every(v=>v==='QA sentinel — disposable context'));pass('Production save keys remain untouched');
 await dev('home');await sleep(1500);assert.equal((await snap()).loop.mode,'cleanup');assert.ok((await snap()).characterLoaded);pass('Return to original house and character');assert.deepEqual(errors,[]);
 await writeFile('stores/evidence/phone/report.json',JSON.stringify({url:process.env.GAME_URL,checks,errors,results},null,2));
}catch(e){console.error(e);await photo('failure');await writeFile('stores/evidence/phone/failure.json',JSON.stringify({error:String(e),checks,errors,snapshot:await snap()},null,2));process.exitCode=1;}finally{await browser.close();}
