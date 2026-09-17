// Real joystick/touch input. Navigation plans against read-only collision snapshots; never teleports.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
await mkdir('artifacts/squishy-hunt',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const cdp=await context.newCDPSession(page),touches=new Map();
async function touch(type,id,p){if(type==='touchEnd')touches.delete(id);else touches.set(id,{...p,id});await cdp.send('Input.dispatchTouchEvent',{type:type==='touchEnd'&&touches.size?'touchMove':type,touchPoints:[...touches.values()]})}
async function center(sel){const b=await page.locator(sel).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2,r:b.width*.29}}
const pass=name=>{checks.push(name);console.log('PASS '+name)};
async function photo(name){await page.screenshot({path:'artifacts/squishy-hunt/'+name+'.png'})}
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
 candidates.sort((a,b)=>Math.hypot(a[0]-t.position[0],a[1]-t.position[2])*4+Math.hypot(a[0]-s.position[0],a[1]-s.position[2])-Math.hypot(b[0]-t.position[0],b[1]-t.position[2])*4-Math.hypot(b[0]-s.position[0],b[1]-s.position[2]));
 for(const p of candidates){try{route([s.position[0],s.position[2]],p);await moveTo(...p);return}catch(e){if(String(e).includes('Stuck'))throw e}}
 throw Error('No approach to '+id);
}
async function press(id,hold=60){
 await page.waitForFunction(id=>document.querySelector('#action-button').dataset.target===id,id,{timeout:2500});
 const c=await center('#action-button');await touch('touchStart',2,c);await sleep(hold);await touch('touchEnd',2);await sleep(40);
 await page.waitForFunction(()=>!window.__roomTest.snapshot().character.busy && !window.__roomTest.snapshot().cleanup.aligning && window.__roomTest.snapshot().cleanup.progress===0,undefined,{timeout:6500});
}
async function chore(pick,place){await approach(pick);await press(pick);assert.ok((await snap()).cleanup.carrying);await approach(place);await press(place);assert.equal((await snap()).cleanup.carrying,null)}
const {createHuntDay}=await import('../src/data/hunt.ts');
let seed=42;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const initial={version:1,balance:25,collection:{},boxes:[],creditedRounds:['prior-savings'],trip:{active:false,purchases:0},location:'cleanup',reveal:null,hunt:createHuntDay(1,random)};
await context.addInitScript(progress=>{if(!localStorage.getItem('test-started')){localStorage.setItem('arianna.progress.v1',JSON.stringify(progress));localStorage.setItem('test-started','1');}},initial);
const setWorld=async()=>{const s=await snap();world=s.loop.store?.walkable??s.walkable;obstacles=s.loop.store?.obstacles??s.obstacles;};
async function act(id,hold=60){await approach(id);await press(id,hold);await sleep(100)}
async function inspect(site,buy=false){
 const s=await snap(),location=s.loop.store.sites.find(x=>x.id===site);await moveTo(location.position[0],location.position[2]);await sleep(120);
 const slot=(await snap()).loop.hunt.stores[s.loop.store.id].slots.find(x=>x.site===site);
 if(slot?.remaining){
  if(!slot.discovered){await press('hunt-site-'+site);await page.waitForFunction(({id,site})=>window.__roomTest.snapshot().loop.hunt.stores[id].slots.find(x=>x.site===site).discovered,{id:s.loop.store.id,site});}
  assert.ok(await page.locator('#hunt-find').isVisible());
  if(buy){const before=(await snap()).loop;await press('hunt-site-'+site);await sleep(120);const after=(await snap()).loop;assert.equal(after.boxes,before.boxes+1);assert.ok(after.balance<before.balance);}
 }
}
async function home(){const s=await snap();await moveTo(s.loop.store.exit[0],s.loop.store.exit[2]-.12);await press('go-home');assert.equal((await snap()).loop.mode,'home');}
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);let s=await snap();await setWorld();
 await act('choose-clothes');await act('get-dressed');await act('daily-teeth');
 await act('take-egg');await act('crack-egg');s=await snap();if(s.cleanup.daily.eggDrop){await act('take-towel');await act('wipe-egg',1400);}await act('cook-egg');await act('eat-breakfast');
 await act('school-door');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='recess');await page.locator('#leave-recess').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.phase==='afternoon');pass('Morning activities, recess exit and school remain intact');
 await act('daily-vacuum');for(let i=0;i<3;i++)await act('vacuum-'+i,1350);await act('put-tool-away');
 await act('take-towel');await act('wipe-spill',1400);await chore('pickup-laundry-clothes','place-laundry-clothes');pass('All five afternoon chores complete with normal touch controls');
 await act('shop-door');assert.ok(await page.locator('#hunt-routes').isVisible());await photo('01-store-choices');
 const beforeTravel=(await snap()).cleanup.daily.minutes;await page.locator('[data-store=corner]').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='store');await setWorld();
 s=await snap();assert.ok(s.cleanup.daily.minutes>=beforeTravel+55);assert.ok(s.loop.hunt.stores.corner.rumor);pass('Three clues and travel costs; nearby trip advances the same afternoon clock');
 const began=Date.now();let bought=0;
 for(const site of [3,1,0,4,5,2]){const slot=(await snap()).loop.hunt.stores.corner.slots.find(x=>x.site===site);await inspect(site,!!slot&&bought<2);if(slot&&bought<2)bought++;if(site===0)await photo('02-nearby-hunt');}
 console.log('Nearby full search seconds:',(Date.now()-began)/1000);assert.ok(bought>0);await photo('03-series-find');pass('Physical search reaches all six display locations; inspect and purchase distinct series');
 const persisted=(await snap()).loop;await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await setWorld();s=await snap();assert.equal(s.loop.boxes,persisted.boxes);assert.equal(s.loop.balance,persisted.balance);assert.deepEqual(s.loop.hunt.stores,persisted.hunt.stores);pass('Store stock, discoveries, charged allowance and sealed boxes survive refresh');
 await home();await press('open-box');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await photo('04-home-reveal');const first=(await snap()).loop.reveal;assert.ok(first.count>0);await press('collection');assert.equal(await page.locator('.series-heading').count(),4);await photo('05-collection');await page.locator('#back-cleanup').click();await setWorld();
 await act('shop-door');await photo('06-second-trip-choice');assert.equal(await page.locator('[data-store=collector]').isDisabled(),true);assert.equal(await page.locator('[data-store=toys]').isDisabled(),false);
 await page.locator('[data-store=toys]').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.store?.id==='toys');await setWorld();
 for(const site of [3,1,0,4,5,2])await inspect(site,false);await photo('07-toy-store');await home();pass('Second nearby/medium outing fits; distant third store is too late');
 // Advance only the saved clock in this isolated fixture to avoid waiting through an uneventful evening.
 // Night chores, sleep, the next morning, and restocking still run through the real controls.
 const saved=await page.evaluate(()=>({progress:JSON.parse(localStorage.getItem('arianna.progress.v1')),daily:JSON.parse(localStorage.getItem('arianna.daily.v1'))}));
 const oldStock=structuredClone(saved.progress.hunt.stores);saved.progress.location='cleanup';saved.progress.reveal=null;saved.daily.phase='night';saved.daily.minutes=1200;saved.daily.done=[];
 // Apply before the next game boot: a running clock's autosave can otherwise overwrite this fixture between evaluate and reload.
 await page.addInitScript(saved=>{if(!sessionStorage.getItem('hunt-night-fixture')){localStorage.setItem('arianna.progress.v1',JSON.stringify(saved.progress));localStorage.setItem('arianna.daily.v1',JSON.stringify(saved.daily));sessionStorage.setItem('hunt-night-fixture','1');}},saved);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await setWorld();
 await act('daily-teeth');await act('bedtime-book');await act('night-clothes');await act('clothes-drawer');await act('sleep');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.hunt.day===2);
 s=await snap();assert.equal(s.cleanup.daily.phase,'morning');assert.notDeepEqual(s.loop.hunt.stores,oldStock);assert.equal(s.loop.collection[first.dumplingId],first.count);await photo('08-new-day');pass('Night routine, sleep and next-day restock preserve earned collection');
 assert.deepEqual(errors,[]);await writeFile('artifacts/squishy-hunt/playthrough.json',JSON.stringify({checks,errors,snapshot:await snap()},null,2));
}catch(error){await photo('failure');await writeFile('artifacts/squishy-hunt/failure.json',JSON.stringify({error:String(error),errors,snapshot:await snap().catch(()=>null)},null,2));console.error(error);process.exitCode=1}finally{await browser.close()}





