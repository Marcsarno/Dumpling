// Real joystick/touch input. Navigation plans against read-only collision snapshots; never teleports.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
await mkdir('artifacts/daily-life',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const cdp=await context.newCDPSession(page),touches=new Map();
async function touch(type,id,p){if(type==='touchEnd')touches.delete(id);else touches.set(id,{...p,id});await cdp.send('Input.dispatchTouchEvent',{type:type==='touchEnd'&&touches.size?'touchMove':type,touchPoints:[...touches.values()]})}
async function center(sel){const b=await page.locator(sel).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2,r:b.width*.29}}
const pass=name=>{checks.push(name);console.log('PASS '+name)};
async function photo(name){await page.screenshot({path:'artifacts/daily-life/'+name+'.png'})}
let world,obstacles;
function free(x,z){
 const radius=.265;
 for(const a of [x-radius,x+radius])for(const b of[z-radius,z+radius])if(!world.some(r=>a>=r.minX&&a<=r.maxX&&b>=r.minZ&&b<=r.maxZ))return false;
 return !obstacles.some(o=>Math.abs(x-o.center[0])<=o.halfExtents[0]+radius&&Math.abs(z-o.center[2])<=o.halfExtents[2]+radius);
}
function line(a,b){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1);for(let i=1;i<=n;i++)if(!free(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;return true}
function route(start,end){
 if(line(start,end))return[end];
 const step=.2,key=(x,z)=>x+','+z;
 const sx=Math.round(start[0]/step),sz=Math.round(start[1]/step);
 const open=[{x:sx,z:sz,g:0,f:0}],cost=new Map([[key(sx,sz),0]]),parents=new Map();
 let finish;
 while(open.length){
  open.sort((a,b)=>a.f-b.f);const current=open.shift(),p=[current.x*step,current.z*step];
  if(Math.hypot(p[0]-end[0],p[1]-end[1])<.32&&line(p,end)){finish=current;break}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=current.x+dx,z=current.z+dz,point=[x*step,z*step];if(!free(...point)||!line(p,point))continue;
   const g=current.g+Math.hypot(dx,dz),k=key(x,z);if(g>=(cost.get(k)??Infinity))continue;
   cost.set(k,g);parents.set(k,current);open.push({x,z,g,f:g+Math.hypot(point[0]-end[0],point[1]-end[1])/step});
  }
 }
 assert.ok(finish,'No collision-free route to '+end);
 const path=[end];while(finish){path.unshift([finish.x*step,finish.z*step]);finish=parents.get(key(finish.x,finish.z))}
 path[0]=start;
 const short=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!line(path[i],path[j]))j--;short.push(path[j]);i=j}return short;
}
async function moveTo(x,z){
 const s=await snap();const points=route([s.position[0],s.position[2]],[x,z]);const c=await center('#joystick');
 await touch('touchStart',1,c);const began=Date.now();
 for(const target of points){
  let arrived=false;
  while(Date.now()-began<18000){
   const state=await snap();assert.notEqual(state.cleanup.state,'finished','Timer ended on route '+[x,z]);
   const dx=target[0]-state.position[0],dz=target[1]-state.position[2],distance=Math.hypot(dx,dz);
   if(distance<.12){arrived=true;break}
   const right=state.cameraRight,forward=state.cameraForward,rl=Math.hypot(right[0],right[2]),fl=Math.hypot(forward[0],forward[2]);
   const mag=Math.min(1,Math.max(.35,distance*3));
   const ix=(dx*right[0]+dz*right[2])/rl/distance*mag,iy=(dx*forward[0]+dz*forward[2])/fl/distance*mag;
   await touch('touchMove',1,{x:c.x+c.r*ix,y:c.y-c.r*iy});await sleep(65);
  }
  if(!arrived){await photo('failure-route');throw Error('Stuck at '+JSON.stringify((await snap()).position)+' heading to '+target)}
 }
 await touch('touchEnd',1);await sleep(35);
}
async function approach(id){
 const s=await snap(),t=s.cleanup.targets.find(t=>t.id===id),candidates=[];
 for(let radius=.3;radius<=t.range*.75;radius+=.15)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/6){
  const x=t.position[0]+Math.cos(angle)*radius,z=t.position[2]+Math.sin(angle)*radius;if(free(x,z))candidates.push([x,z]);
 }
 candidates.sort((a,b)=>Math.hypot(a[0]-s.position[0],a[1]-s.position[2])-Math.hypot(b[0]-s.position[0],b[1]-s.position[2]));
 for(const p of candidates){try{route([s.position[0],s.position[2]],p);await moveTo(...p);return}catch(e){if(String(e).includes('Stuck'))throw e}}
 throw Error('No approach to '+id);
}
async function press(id,hold=60){
 await page.waitForFunction(id=>document.querySelector('#action-button').dataset.target===id,id,{timeout:2500});
 const c=await center('#action-button');await touch('touchStart',2,c);await sleep(hold);await touch('touchEnd',2);await sleep(40);
 await page.waitForFunction(()=>!window.__roomTest.snapshot().character.busy && !window.__roomTest.snapshot().cleanup.aligning && window.__roomTest.snapshot().cleanup.progress===0,undefined,{timeout:6500});
}
async function chore(pick,place){await approach(pick);await press(pick);assert.ok((await snap()).cleanup.carrying);await approach(place);await press(place);assert.equal((await snap()).cleanup.carrying,null)}
try{
 await page.goto('http://127.0.0.1:5173');await page.locator('[data-ready=true]').waitFor();
 const fixture={version:1,day:1,minutes:420,phase:'morning',done:['teeth','outfit'],eggDrop:true,breakfast:'eggs',dust:[0,2,4],schoolSeconds:0};
 await page.evaluate(s=>localStorage.setItem('arianna.daily.v1',JSON.stringify(s)),fixture);await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);let s=await snap();world=s.walkable;obstacles=s.obstacles;
 async function act(id,hold=60){await approach(id);await press(id,hold);await sleep(120)}
 await act('take-egg');await act('crack-egg');assert.equal((await snap()).cleanup.daily.eggSpill,true);await photo('egg-dropped');
 await act('take-towel');await approach('wipe-egg');await press('wipe-egg',400);assert.equal((await snap()).cleanup.daily.eggSpill,true);assert.equal((await snap()).cleanup.daily.breakfast,'spill');pass('Partial wiping leaves the dropped egg and blocks cooking');
 await press('wipe-egg',1400);assert.equal((await snap()).cleanup.daily.eggSpill,false);await act('cook-egg');await act('eat-breakfast');pass('Dropped-egg branch cleans with paper towel, cooks, and serves breakfast');
 const night={...fixture,phase:'afternoon',minutes:1139.5,done:[],breakfast:'done',eggDrop:false};await page.evaluate(s=>localStorage.setItem('arianna.daily.v1',JSON.stringify(s)),night);await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().cleanup.daily.phase==='night');s=await snap();world=s.walkable;obstacles=s.obstacles;assert.equal(s.cleanup.daily.canShop,false);await photo('night');
 await act('night-clothes');assert.equal((await snap()).cleanup.carrying,'daily-outfit');await act('clothes-drawer');assert.equal((await snap()).cleanup.carrying,null);await photo('clothes-put-inside');
 await act('daily-teeth');await act('bedtime-book');await act('sleep');await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.day===2);assert.equal((await snap()).cleanup.daily.phase,'morning');pass('Clock enters night, store closes, night chores and sleep start the next morning');
 await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.equal((await snap()).cleanup.daily.day,2);pass('Daily clock and routine state survive reload');
 assert.deepEqual(errors,[]);await writeFile('artifacts/daily-life/edge-report.json',JSON.stringify({checks,errors},null,2));
}catch(error){await photo('edge-failure');console.error(error);process.exitCode=1}finally{await browser.close()}
