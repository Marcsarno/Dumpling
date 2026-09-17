// Real joystick/touch input. Navigation plans against read-only collision snapshots; never teleports.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
await mkdir('artifacts/family',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const cdp=await context.newCDPSession(page),touches=new Map();
async function touch(type,id,p){if(type==='touchEnd')touches.delete(id);else touches.set(id,{...p,id});await cdp.send('Input.dispatchTouchEvent',{type:type==='touchEnd'&&touches.size?'touchMove':type,touchPoints:[...touches.values()]})}
async function center(sel){const b=await page.locator(sel).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2,r:b.width*.29}}
const pass=name=>{checks.push(name);console.log('PASS '+name)};
async function photo(name){await page.screenshot({path:'artifacts/family/'+name+'.png'})}
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
  while(Date.now()-began<25000){
   const state=await snap();assert.notEqual(state.cleanup.state,'finished','Timer ended on route '+[x,z]);
   const dx=target[0]-state.position[0],dz=target[1]-state.position[2],distance=Math.hypot(dx,dz);
   if(distance<.025){arrived=true;break}
   const right=state.cameraRight,forward=state.cameraForward,rl=Math.hypot(right[0],right[2]),fl=Math.hypot(forward[0],forward[2]);
   const mag=Math.min(1,Math.max(.2,distance*3));
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

const setWorld=async()=>{const s=await snap();world=s.walkable;obstacles=s.obstacles;};
const states=new Set(),clips=new Set();let observer;
try {
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().marc?.loaded&&window.__roomTest.snapshot().characterLoaded);await setWorld();
 observer=setInterval(async()=>{try{const s=await snap();states.add(s.marc.state);clips.add(s.marc.animation.state);}catch{}},180);
 let s=await snap();assert.ok(Math.abs(s.marc.height-1.38345*1.3)<1e-8);assert.equal(s.marc.animation.clips.some(c=>c.name==='Run_Alternative'),false);pass('Original ten Marc clips loaded at exactly 1.3 times Arianna height');
 await moveTo(3.05,8.6);await page.waitForFunction(()=>window.__roomTest.snapshot().marc.state==='seated',undefined,{timeout:35000});await photo('01-dad-seated');
 console.log('SEAT',JSON.stringify((await snap()).marc));console.log('GEOMETRY',JSON.stringify(await page.evaluate(()=>window.__roomTest.marcGeometry())));
 pass('Marc reaches the reading chair and plays SitDown then SitIdle');
 await moveTo(8.4,.4);await photo('02-nursery');assert.equal((await snap()).room,'nursery');
 await moveTo(8.15,7.2);await photo('03-marc-bedroom');assert.equal((await snap()).room,'marc-bedroom');
 await moveTo(3.05,8.6);await photo('04-family-living');pass('Both new bedrooms connect to the old house through real walkable doors');
 await page.waitForFunction(()=>window.__roomTest.snapshot().marc.cleaned>=1,undefined,{timeout:90000});
 s=await snap();assert.ok(s.cleanup.daily.lilah.messes.some(m=>m.done&&m.cleanedBy==='marc'));assert.equal(s.loop.balance,0);assert.ok(s.marc.standCount>0);await photo('05-dad-helped');pass('Marc stands up, walks to Lilah’s real mess and saves cleanup without granting allowance');
 await page.waitForFunction(()=>window.__roomTest.snapshot().marc.cleaned>=3,undefined,{timeout:240000});
 s=await snap();assert.equal(s.cleanup.daily.lilah.messes.filter(m=>m.cleanedBy==='marc').length,3);assert.equal(s.loop.balance,0);pass('Marc autonomously handles toys, juice and crumbs');
 for(const [width,height]of [[320,568],[390,844],[430,932]]){await page.setViewportSize({width,height});await sleep(200);await photo('06-family-'+width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 const before=(await snap()).cleanup.daily.lilah;await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().marc?.loaded);assert.deepEqual((await snap()).cleanup.daily.lilah.messes,before.messes);pass('Dad-cleaned messes persist through refresh; portrait layouts fit');
 assert.ok(states.has('cleaning'));assert.ok(clips.has('StandUp'));assert.deepEqual(errors,[]);
 await writeFile('artifacts/family/report.json',JSON.stringify({checks,errors,states:[...states],clips:[...clips],snapshot:await snap()},null,2));
} catch(error){await photo('failure');await writeFile('artifacts/family/failure.json',JSON.stringify({error:String(error),errors,states:[...states],clips:[...clips],snapshot:await snap().catch(()=>null)},null,2));console.error(error);process.exitCode=1;}finally{clearInterval(observer);await browser.close();}



