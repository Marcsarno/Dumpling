import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {Vec3,BoundingBox} from 'playcanvas';
import {HousePath} from '../src/components/HousePath.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],rounds=[];await mkdir('artifacts/house-polish',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms),cdp=await context.newCDPSession(page);
let planner;
async function moveTo(point){
 let s=await snap();const path=planner.route(new Vec3(s.position[0],0,s.position[2]),new Vec3(...point));assert.ok(path.length,'Reachable spawned mess');
 const b=await page.locator('#joystick').boundingBox(),center={x:b.x+b.width/2,y:b.y+b.height/2},radius=b.width*.29;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...center,id:1}]});const start=Date.now();
 for(let i=0;i<path.length;i++){
   while(Date.now()-start<14000){s=await snap();if(s.tornado.phase!=='playing')break;const dx=path[i].x-s.position[0],dz=path[i].z-s.position[2],d=Math.hypot(dx,dz);if(d<(i===path.length-1?.7:.12))break;
     const r=s.cameraRight,f=s.cameraForward,mag=Math.min(1,d*3),x=(dx*r[0]+dz*r[2])/Math.hypot(r[0],r[2])/d*mag,y=(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/d*mag;
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:center.x+radius*x,y:center.y-radius*y}]});await sleep(60);
   }
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().lilah.loaded&&window.__roomTest.snapshot().cleanup.pet.loaded);await sleep(300);
 let s=await snap();planner=new HousePath({walkable:s.walkable,obstacles:s.obstacles.map(o=>new BoundingBox(new Vec3(...o.center),new Vec3(...o.halfExtents)))},.265);
 for(const special of ['none','basket','dog']){
   await page.keyboard.press('F2');await page.locator(`[data-command=tornado][data-value="${special}"]`).click();await page.locator('#tornado-dialog [data-action=begin]').click();
   const initial=await snap(),balance=initial.loop.balance,day=initial.cleanup.daily,seen=new Set(),stats=[];let nextPhoto=10;
   while((s=await snap()).tornado.phase==='playing'){
     assert.ok(s.tornado.messes.length<=3);stats.push({time:s.tornado.elapsed,fps:s.fps,drawCalls:s.drawCalls,position:s.lilah.position});
     for(const m of s.tornado.messes){seen.add(m.special);assert.ok(planner.free(m.point[0],m.point[2]));}
     const mess=s.tornado.messes.find(m=>m.special!=='none')??s.tornado.messes[0];
     if(mess&&!s.tornado.cleaning){await moveTo(mess.point);s=await snap();if(s.tornado.phase==='playing'&&!(await page.locator('#action-button').isDisabled())){await page.locator('#action-button').tap();await sleep(650);if((await snap()).cameraState==='CHORE')await page.screenshot({path:`artifacts/house-polish/${special}-chore-${s.tornado.cleaned}.png`});await sleep(1500);}}
     else await sleep(180);
     s=await snap();if(s.tornado.elapsed>nextPhoto&&s.tornado.phase==='playing'){await page.screenshot({path:`artifacts/house-polish/${special}-${nextPhoto}.png`});nextPhoto+=15;}
   }
   assert.equal(s.tornado.paid,true);assert.equal(s.loop.balance,balance+s.tornado.reward);assert.ok(s.tornado.cleaned>=3,'At least 3 real cleanups');
   if(special!=='none')assert.ok(seen.has(special),'Visible '+special+' interruption');
   assert.equal(s.tornado.elapsed,55);await page.screenshot({path:`artifacts/house-polish/${special}-result.png`});rounds.push({special,seen:[...seen],result:s.tornado,stats,dayBefore:day,dayAfter:s.cleanup.daily});console.log('ROUND',special,JSON.stringify(s.tornado));
   await page.locator('#tornado-dialog [data-action=back]').click();await sleep(1200);s=await snap();assert.equal(s.cameraState,'EXPLORE');assert.equal(s.tornado.phase,'idle');assert.ok(Math.abs(s.cameraHeight-5.735)<.1);assert.equal(s.character.busy,false);
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/house-polish/rounds.json',JSON.stringify({errors,rounds},null,2));
}catch(error){await page.screenshot({path:'artifacts/house-polish/failure.png'});await writeFile('artifacts/house-polish/failure.json',JSON.stringify({error:String(error),errors,rounds,snapshot:await snap()},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}

