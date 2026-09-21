import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {browser,context,page,errors,snap,sleep,dev,setPlanner,moveTo,action} from './store-test-helpers.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:5186/dist/index.html';
await context.addInitScript(()=>{if(!localStorage.getItem('production-fixture')){for(const suffix of ['progress.v1','daily.v1'])localStorage.setItem('arianna.'+suffix,localStorage.getItem('dumpling.editorMigration.'+suffix));localStorage.setItem('arianna.house-music.muted','true');localStorage.setItem('production-fixture','yes');}});
try{
 await page.goto(url);await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 assert.equal(await page.evaluate(()=>globalThis.__productionRelease),true);let s=await snap();assert.equal(s.loop.balance,50);assert.equal(s.loop.boxes,1);
 const isolated=await page.evaluate(()=>localStorage.getItem('dumpling.editorMigration.progress.v1'));
 const plants=await page.evaluate(async()=>{const pc=await import('playcanvas');return ['corner','toys','collector'].map(id=>pc.Application.getApplication().root.findByTag('store.finishing:'+id).length);});assert.deepEqual(plants,[3,3,3]);
 await dev('store','corner');s=await snap();setPlanner(s.loop.store);await moveTo(s.loop.store.sites[0].position);await action('hunt-site-0');await sleep(700);await action('hunt-site-0');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.boxes===2);
 const balance=(await snap()).loop.balance;await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});s=await snap();assert.equal(s.loop.boxes,2);assert.equal(s.loop.balance,balance);assert.equal(s.loop.store.id,'corner');
 assert.equal(await page.evaluate(()=>localStorage.getItem('dumpling.editorMigration.progress.v1')),isolated);
 assert.equal(await page.evaluate(()=>localStorage.getItem('arianna.house-music.muted')),'true');
 setPlanner(s.loop.store);await moveTo(s.loop.store.exit);await action('go-home');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='home');assert.deepEqual(errors,[]);
 const output=process.env.EVIDENCE||'artifacts/editor-release';await mkdir(output,{recursive:true});await page.screenshot({path:output+'/smoke.png'});await writeFile(output+'/smoke.json',JSON.stringify({url,checks:['Existing production balance and collection loaded','Nine authored planters present','Store purchase saved using original keys','Saved store visit resumes and exits','Preview saves untouched','Music mute retained'],errors},null,2));console.log('PASS production Editor release and original save continuity');
}finally{await browser.close();}
