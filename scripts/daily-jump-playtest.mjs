import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],cases=[];
page.on('pageerror',e=>{errors.push(e.stack??e.message);console.error(e.stack??e.message);});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const move=position=>page.evaluate(async position=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(...position);},position);
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await move([-6,.09,8.2]);await page.waitForTimeout(800);await move([-12,.09,-17.75]);await page.waitForTimeout(1000);
 await page.evaluate(async()=>{
  const pc=await import('playcanvas'),app=pc.Application.getApplication(),model=app.root.findByName('Arianna').findComponents('anim')[0].entity;
  const names=['Spine02','Spine01','Spine','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand'];
  const original=names.map(n=>model.findByName(n).getLocalRotation().clone());
  window.jumpRun={samples:[]};
  app.on('postrender',()=>{
   const character=window.__roomTest.snapshot().character;
   if(character.state!=='PlayJump')return;
   const maxArmDifference=Math.max(...names.map((n,i)=>{const q=model.findByName(n).getLocalRotation(),a=original[i];return Math.min(Math.hypot(q.x-a.x,q.y-a.y,q.z-a.z,q.w-a.w),Math.hypot(q.x+a.x,q.y+a.y,q.z+a.z,q.w+a.w));}));
   window.jumpRun.samples.push({time:character.clipTime,maxArmDifference,geometry:window.__roomTest.characterGeometry()[0],position:window.__roomTest.snapshot().position});
  });
 });
 async function jump(name){
  await page.evaluate(()=>window.jumpRun.samples=[]);
  await page.keyboard.press('KeyJ');
  await page.waitForFunction(()=>window.__roomTest.snapshot().character.action==='PlayJump');
  await page.waitForFunction(()=>window.__roomTest.snapshot().character.action===null,undefined,{timeout:15000});
  const samples=await page.evaluate(()=>window.jumpRun.samples);
  assert(samples.length>=6,`${name}: actual jump frames`);
  const flight=samples.filter(s=>s.time>.20&&s.time<1.02);assert(flight.length>=3);
  assert(Math.max(...flight.map(s=>s.maxArmDifference))>.01,`${name}: adapted imported upper-body motion is active`);
  assert(Math.max(...samples.map(s=>s.geometry.minY))-Math.min(...samples.map(s=>s.geometry.minY))>.2,`${name}: visible takeoff and landing`);
  cases.push({name,samples});await page.waitForTimeout(450);
 }
 await jump('stationary');
 await move([-35,.09,-17.75]);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await jump('moving');await page.keyboard.up('ArrowLeft');
 assert(cases[1].samples.at(-1).position[0]<cases[1].samples[0].position[0]-.1,'Continue moving through jump');
 await move([-6.3,.09,8.25]);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.scooter.ready);
 await page.locator('#scooter-toggle').click();await page.waitForTimeout(500);assert.equal((await snap()).loop.scooter.riding,true);
 await page.locator('#scooter-toggle').click();await page.waitForTimeout(450);await jump('after-dismount');
 assert.equal((await snap()).loop.scooter.riding,false);assert.equal((await snap()).character.state,'Idle');
 const keys=await page.evaluate(()=>Object.keys(localStorage));assert(keys.every(k=>!k.startsWith('arianna.')));assert.deepEqual(errors,[]);
 await writeFile('artifacts/daily-play/jump-input-check.json',JSON.stringify({cases,keys,errors},null,2));
 console.log('PASS actual input: stationary jump, moving jump, scooter dismount to jump, adapted imported arms, landing, isolated saves');
}finally{await browser.close();}
