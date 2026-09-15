// Real joystick/touch input. Navigation plans against read-only collision snapshots; never teleports.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors=[],checks=[];
await mkdir('artifacts/house-v2',{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const cdp=await context.newCDPSession(page),touches=new Map();
async function touch(type,id,p){if(type==='touchEnd')touches.delete(id);else touches.set(id,{...p,id});await cdp.send('Input.dispatchTouchEvent',{type:type==='touchEnd'&&touches.size?'touchMove':type,touchPoints:[...touches.values()]})}
async function center(sel){const b=await page.locator(sel).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2,r:b.width*.29}}
const pass=name=>{checks.push(name);console.log('PASS '+name)};
async function photo(name){await page.screenshot({path:'artifacts/house-v2/'+name+'.png'})}
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
 await page.waitForFunction(()=>!window.__roomTest.snapshot().character.busy,undefined,{timeout:6500});
}
async function chore(pick,place){await approach(pick);await press(pick);assert.ok((await snap()).cleanup.carrying);await approach(place);await press(place);assert.equal((await snap()).cleanup.carrying,null)}
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5173');
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&window.__roomTest.snapshot().houseArt?.loaded>=169);
 const initial=await snap();world=initial.walkable;obstacles=initial.obstacles;
 assert.equal(initial.houseArt.errors.length,0);assert.equal(initial.houseArt.models,42);
 assert.ok(initial.cameraHeight<6);
 assert.ok(Math.max(...world.map(r=>r.maxZ))-Math.min(...world.map(r=>r.minZ))>1.8*(Math.max(...world.map(r=>r.maxX))-Math.min(...world.map(r=>r.minX))));
 await photo('01-bedroom');pass('42 imported models / 169 placements load; deep floor plan and close portrait framing');
 await page.locator('#mission-practice').tap();
 // Observe every real animation frame through a reversal; root translation and facing must agree.
 await page.keyboard.down('ArrowRight');await sleep(230);await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');
 const turn=await page.evaluate(async()=>{const out=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);const s=__roomTest.snapshot();out.push({v:s.velocity,yaw:s.character.yaw,rate:s.character.playbackRate})}return out});
 await page.keyboard.up('ArrowLeft');
 for(const s of turn.filter(s=>Math.hypot(...s.v)>.05)){const a=Math.atan2(s.v[0],s.v[2])*180/Math.PI,d=((s.yaw-a+540)%360)-180;assert.ok(Math.abs(d)<.05);assert.ok(s.rate<=1.501)}
 pass('Direction reversals face actual movement on every sampled frame; relaxed gait never exceeds 1.5x');
 await moveTo(1,2.95);await moveTo(4.6,2.65);await photo('02-landing');
 await chore('pickup-hall-shoes','place-hall-shoes');await chore('pickup-hall-mail','place-hall-mail');
 await moveTo(4.8,-1.2);await photo('03-bathroom');await chore('pickup-bath-towel','place-bath-towel');await chore('pickup-bath-bottle','place-bath-bottle');
 await moveTo(4.8,5.6);await photo('04-living');await chore('pickup-living-toy','place-living-toy');await chore('pickup-living-cushion','place-living-cushion');
 await moveTo(3.1,7.7);await photo('05-reading-nook');
 await moveTo(.1,11.3);await photo('06-kitchen');await chore('pickup-kitchen-dish','place-kitchen-dish');await chore('pickup-kitchen-trash','place-kitchen-trash');
 await moveTo(1.85,14.85);await photo('07-dining-garden');
 await moveTo(4.5,10.8);await photo('08-utility');await chore('pickup-laundry-clothes','place-laundry-clothes');await chore('pickup-laundry-clean','place-laundry-clean');
 pass('All six rooms and ten house carry/place tasks are reachable through real doorways');
 assert.equal((await snap()).cleanup.allowance,0);
 await page.locator('#mission-house').tap();await sleep(100);
 const began=Date.now();
 await chore('pickup-book','bookshelf');
 await chore('pickup-bath-towel','place-bath-towel');
 await chore('pickup-living-toy','place-living-toy');
 await chore('pickup-laundry-clothes','place-laundry-clothes');
 await chore('pickup-kitchen-dish','place-kitchen-dish');
 await chore('pickup-kitchen-trash','place-kitchen-trash');
 await page.locator('#results[open]').waitFor();const final=await snap(),seconds=(Date.now()-began)/1000;
 assert.equal(final.cleanup.reason,'complete');assert.equal(final.cleanup.completed.length,6);assert.equal(final.loop.balance,8);
 await photo('09-house-results');pass('Full six-task touch mission completes with $8 in '+seconds.toFixed(1)+'s');
 await page.locator('#replay').tap();await sleep(100);assert.equal((await snap()).cleanup.state,'ready');
 for(const [width,height]of[[320,568],[360,640],[430,932],[844,390]]){
  await page.setViewportSize({width,height});await sleep(220);
  for(const selector of['#joystick','#action-button']){const b=await page.locator(selector).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height)}
  const p=(await snap()).playerScreen;assert.ok(p[0]>width*.2&&p[0]<width*.8&&p[1]>height*.25&&p[1]<height*.72);
  await photo('viewport-'+width+'x'+height);
 }
 pass('Small phones, portrait and landscape retain visible player and touch controls');
 assert.deepEqual(errors,[]);pass('No missing assets, browser errors or console warnings');
 await writeFile('artifacts/house-v2/report.json',JSON.stringify({checks,seconds,errors,art:initial.houseArt,turn},null,2));
}catch(error){await photo('failure');console.error(error);process.exitCode=1}finally{await browser.close()}

