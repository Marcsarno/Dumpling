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

const {createHuntDay,STORES}=await import('../src/data/hunt.ts');
const daily={version:1,day:1,minutes:925,phase:'afternoon',done:['dust-0','dust-1','dust-2','spill','laundry-clothes'],eggDrop:false,breakfast:'done',dust:[0,1,2],schoolSeconds:0};
const progress={version:1,balance:100,collection:{},boxes:[],creditedRounds:[],trip:{active:false,purchases:0},location:'cleanup',reveal:null,hunt:createHuntDay(1,()=>.5)};
await context.addInitScript(({progress,daily})=>{if(!localStorage.getItem('fixture-loaded')){localStorage.setItem('arianna.progress.v1',JSON.stringify(progress));localStorage.setItem('arianna.daily.v1',JSON.stringify(daily));localStorage.setItem('fixture-loaded','1');}},{progress,daily});
const setWorld=async()=>{const s=await snap();world=s.loop.store?.walkable??s.walkable;obstacles=s.loop.store?.obstacles??s.obstacles;};
async function replaceFixture(p,d){await page.evaluate(({p,d})=>{localStorage.setItem('arianna.progress.v1',JSON.stringify(p));localStorage.setItem('arianna.daily.v1',JSON.stringify(d));},{p,d});await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await setWorld();}
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);await setWorld();
 await approach('shop-door');await press('shop-door');await page.locator('[data-store=collector]').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.store?.id==='collector');await setWorld();
 assert.ok((await snap()).cleanup.daily.minutes>=1090);await photo('09-specialty-entry');
 const searchStart=Date.now();
 for(const id of [3,1,0,4,5,2]){
  const site=(await snap()).loop.store.sites.find(s=>s.id===id);await moveTo(site.position[0],site.position[2]);await sleep(1700);
  const stock=(await snap()).loop.hunt.stores.collector.slots.find(s=>s.site===id);
  if(stock?.remaining){await press('hunt-site-'+id);await page.waitForFunction(id=>window.__roomTest.snapshot().loop.hunt.stores.collector.slots.find(s=>s.site===id).discovered,id);await sleep(1200);await photo('10-specialty-find-'+id);}
 }
 const searchSeconds=(Date.now()-searchStart)/1000;console.log('Paced specialty search:',searchSeconds.toFixed(1),'seconds');
 let s=await snap();assert.deepEqual(s.loop.store.art.errors,[]);assert.ok(s.loop.store.art.loaded>=22);pass('Specialty travel, six collision-free approaches, series inspections and imported assets');
 const selected=s.loop.hunt.stores.collector.slots[0];const site=s.loop.store.sites.find(x=>x.id===selected.site);await moveTo(site.position[0],site.position[2]);await press('hunt-site-'+selected.site);await sleep(150);assert.equal((await snap()).loop.boxes,1);
 const exit=(await snap()).loop.store.exit;await moveTo(exit[0],exit[2]-.1);await press('go-home');await press('open-box');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await photo('11-specialty-reveal');await press('collection');await page.locator('#back-cleanup').click();await setWorld();await approach('shop-door');await press('shop-door');
 assert.equal(await page.locator('.store-choice:not(:disabled)').count(),0);await photo('12-no-third-trip');pass('Specialty outing leaves insufficient time for another store');
 // Cover every final fixture approach in both other layouts, including nearly-sold-out days.
 for(const store of STORES.filter(s=>s.id!=='collector')){
  const p=structuredClone(progress);p.hunt.activeStore=store.id;p.location='store';p.trip.active=true;
  p.hunt.stores[store.id].slots=[0,1,2,3,4,5].map(site=>({site,series:'treats',remaining:1,discovered:false}));
  await replaceFixture(p,daily);
  for(const id of [3,1,0,4,5,2]){const site=(await snap()).loop.store.sites.find(x=>x.id===id);await moveTo(site.position[0],site.position[2]);await press('hunt-site-'+id);await page.waitForFunction(({id,store})=>window.__roomTest.snapshot().loop.hunt.stores[store].slots.find(x=>x.site===id).discovered,{id,store:store.id});if(id===0||id===3||id===5)await photo('final-'+store.id+'-'+id);}
  assert.deepEqual((await snap()).loop.store.art.errors,[]);pass(store.name+' final display placements, collision and all six discoveries');
 }
 const p=structuredClone(progress);p.location='store';p.trip.active=true;p.hunt.activeStore='collector';p.hunt.stores.collector.slots=[{site:3,series:'galaxy',remaining:1,discovered:false}];
 await replaceFixture(p,daily);s=await snap();const basket=s.loop.store.sites.find(x=>x.id===3);await moveTo(basket.position[0],basket.position[2]);await press('hunt-site-3');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.hunt.stores.collector.slots[0].discovered);await press('hunt-site-3');await sleep(100);assert.equal((await snap()).loop.hunt.stores.collector.slots[0].remaining,0);assert.ok((await page.locator('#cleanup-hint').innerText()).includes('gone'));await photo('13-sold-out');pass('Last-box purchase visibly empties the display and prevents another purchase');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.progress.v1'))),late={...daily,minutes:1138};
 await replaceFixture(saved,late);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.mode==='home');s=await snap();assert.equal(s.cleanup.daily.phase,'night');assert.equal(s.loop.boxes,1);await photo('14-closing-time');
 await press('open-box');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.phase==='revealed');await press('collection');await page.locator('#back-cleanup').click();assert.ok((await snap()).cleanup.tasks.includes('read'));pass('7 PM returns Arianna safely with her paid box; night tasks are ready');
 assert.deepEqual(errors,[]);await writeFile('artifacts/squishy-hunt/boundaries.json',JSON.stringify({checks,searchSeconds,errors,snapshot:await snap()},null,2));
}catch(error){await photo('boundary-failure');await writeFile('artifacts/squishy-hunt/boundary-failure.json',JSON.stringify({error:String(error),errors,snapshot:await snap().catch(()=>null)},null,2));console.error(error);process.exitCode=1}finally{await browser.close()}
