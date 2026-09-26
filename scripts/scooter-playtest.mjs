import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
page.on('pageerror',e=>errors.push(e.message));const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-6.3,.09,8.25);});await page.waitForFunction(()=>window.__roomTest.snapshot().loop.scooter.ready);await page.locator('#scooter-toggle').tap();
 const b=await page.locator('#joystick').boundingBox(),c={x:b.x+b.width/2,y:b.y+b.height/2},r=b.width*.3;
 async function steer(x,z){const s=await snap(),a=s.cameraRight,f=s.cameraForward;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:c.x+r*(x*a[0]+z*a[2])/Math.hypot(a[0],a[2]),y:c.y-r*(x*f[0]+z*f[2])/Math.hypot(f[0],f[2])}]});}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...c,id:1}]});await steer(-1,0);await page.waitForTimeout(1900);const straight=await snap();assert.ok(straight.position[0]<-10,'Ride through garden opening');
 await steer(-.95,.3);await page.waitForTimeout(350);const turning=await snap();assert.ok(Math.abs(turning.loop.scooter.lean)>.001,'Rider leans during touch turn');
 await page.screenshot({path:'artifacts/journeys/scooter-phone-turn.png'});await steer(-1,0);await page.waitForTimeout(750);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1300);const stopped=await snap();assert.ok(stopped.loop.scooter.speed<.04,'Release gently stops');
 await page.screenshot({path:'artifacts/journeys/scooter-phone-lane.png'});await page.locator('#scooter-toggle').tap();await page.waitForTimeout(400);assert.equal((await snap()).loop.scooter.riding,false);
 const keys=await page.evaluate(()=>Object.keys(localStorage));assert.ok(keys.every(k=>!k.startsWith('arianna.')),'No real save namespace written');assert.deepEqual(errors,[]);
 await writeFile('artifacts/journeys/scooter-playtest.json',JSON.stringify({straight,turning,stopped,keys,errors},null,2));console.log('PASS touch ride, gentle lean, release, dismount, isolated saves');
}finally{await browser.close();}
