import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[],checks=[],photos=[];
await mkdir('artifacts/school-gate',{recursive:true});page.on('pageerror',e=>{errors.push(String(e));console.log('ERROR',String(e));});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms),shot=async n=>{await page.screenshot({path:`artifacts/school-gate/${n}.png`});photos.push(n);},pass=n=>{checks.push(n);console.log('PASS',n);};
async function moveTo(x,z,tolerance=.13){
 const j=await page.locator('#joystick').boundingBox(),cx=j.x+j.width/2,cy=j.y+j.height/2,r=j.width*.29;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:cx,y:cy}]});const start=Date.now();let arrived=false;
 try{while(Date.now()-start<45000){const s=await snap(),dx=x-s.position[0],dz=z-s.position[2],d=Math.hypot(dx,dz);if(d<tolerance){arrived=true;break;}const a=s.cameraRight,f=s.cameraForward,m=Math.min(1,Math.max(.2,d*1.25));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:cx+r*(dx*a[0]+dz*a[2])/Math.hypot(a[0],a[2])/d*m,y:cy-r*(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/d*m}]});await sleep(80);
 }}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 if(!arrived)throw Error('Could not walk to '+[x,z]+' from '+JSON.stringify((await snap()).position));await sleep(120);
}
const place=(x,z)=>page.evaluate(async({x,z})=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
async function pickBall(){
 for(let tries=0;tries<5;tries++){
  const s=(await snap()).loop.schoolGate,b=s.ball,pp=(await snap()).position;
  if(await page.locator('#school-ball-pickup').isVisible()){await page.locator('#school-ball-pickup').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.schoolGate.held,undefined,{timeout:4000});await sleep(650);return;}
  const dx=pp[0]-b.x,dz=pp[2]-b.z,d=Math.max(.01,Math.hypot(dx,dz));await moveTo(b.x+dx/d*.64,b.z+dz/d*.64,.16);await sleep(250);
 }
 throw Error('Unable to pick up ball');
}
try{
 await page.goto('http://127.0.0.1:5192/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 const money=(await snap()).loop.balance;
 // Traverse the complete actual route with touchscreen input; no teleport for discovery.
 if(process.env.GATE_SHORT){await place(-6.3,8.2);await sleep(200);await place(21,-27.15);}else for(const [x,z]of [[-3.8,8.2],[-6.3,8.2],[-6.3,-3.5],[-3.5,-7],[0,-12],[6,-17.3],[18.7,-16.7],[21.7,-16.7],[21.7,-17.7],[22,-26.65],[21,-27.15]])await moveTo(x,z,.2);
 pass(process.env.GATE_SHORT?'Isolated school-gate touch check':'Walked from home through the real garden/crossing to school with touch');await shot('phone-arrival');
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.schoolGate.ready);await sleep(2500);
 assert.equal(await page.locator('#daily-play-open').isVisible(),false);assert.equal((await snap()).loop.dailyPlay.stations.length,0);pass('No numbered stations or daily-play checklist');
 await pickBall();pass('Picked up Poppy’s ball with the contextual touch control');await shot('phone-holding');
 const beforeFollow=(await snap()).loop.schoolGate.poppy.position;
 await moveTo(22.5,-27.4,.2);await sleep(2200);
 const afterFollow=(await snap()).loop.schoolGate.poppy.position;assert(Math.hypot(afterFollow[0]-beforeFollow[0],afterFollow[2]-beforeFollow[2])>.3);pass('Poppy followed the carried ball');
 await page.locator('#action-button[data-target=school-ball]').tap();await page.waitForFunction(()=>!window.__roomTest.snapshot().loop.schoolGate.held);await sleep(650);pass('Put the ball down at the chosen location');
 // Kick directly after putting down; walking through a ball intentionally nudges it.
 const kicks=(await snap()).loop.schoolGate.stats.playerKicks;await page.locator('#action-button[data-target=school-ball]').tap();
 await page.waitForFunction(k=>window.__roomTest.snapshot().loop.schoolGate.stats.playerKicks>k,kicks,{timeout:5000});await shot('phone-kick');pass('Kicked with Action; ball moved at animation contact');
 const returns=(await snap()).loop.schoolGate.stats.returns;await page.waitForFunction(n=>window.__roomTest.snapshot().loop.schoolGate.stats.returns>n,returns,{timeout:15000});await sleep(1600);pass('Poppy retrieved and returned a player kick');await shot('phone-return');
 // Walk through the physical leaf patch. Leave the ball where play put it.
 await moveTo(19.3,-26.65,.2);await moveTo(15.7,-26.65,.2);await moveTo(15.6,-28.25,.2);
 const leafBefore=(await snap()).loop.schoolGate.stats.leafBursts;await moveTo(15.5,-28.7,.14);await page.locator('#journey-jump').tap();await sleep(500);await shot('phone-leaves');
 assert((await snap()).loop.schoolGate.stats.leafBursts>leafBefore);pass('Walking/jumping scatters leaves without activating a station');
 // Leave through the actual gate and return; art and NPC resources must retire.
 await moveTo(18.4,-27.1,.2);await moveTo(22,-27.4,.18);await moveTo(22,-28.4,.15);await page.locator('#action-button[data-target=school-gate]').tap();
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='recess');await sleep(1500);
 assert.equal((await snap()).loop.schoolGate.loaded,false);pass('School entry unloads outdoor play and preserves classroom access');
 await page.locator('#recess-leave').count().then(async n=>{if(n)await page.locator('#recess-leave').tap();else await page.getByRole('button',{name:/Finish school.*walk home|Back to the school gate/}).tap();});
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='outdoors');await sleep(2000);pass('Returned from school through existing flow');
 assert.equal((await snap()).loop.balance,money);
 const keys=await page.evaluate(()=>Object.keys(localStorage));assert(keys.every(k=>!k.startsWith('arianna.')));pass('Preview stayed isolated from production saves');
 await writeFile('artifacts/school-gate/playtest.json',JSON.stringify({checks,errors,photos,snapshot:await snap(),keys},null,2));assert.deepEqual(errors,[]);
}catch(e){await shot('failure');await writeFile('artifacts/school-gate/playtest-failure.json',JSON.stringify({error:String(e),checks,errors,snapshot:await snap()},null,2));throw e;}
finally{await browser.close();}


