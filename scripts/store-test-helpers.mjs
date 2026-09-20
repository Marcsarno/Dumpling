import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {Vec3,BoundingBox} from 'playcanvas';
import {HousePath} from '../src/components/HousePath.ts';
import {createHuntDay} from '../src/data/hunt.ts';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
await mkdir('stores/evidence/phone',{recursive:true});const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const progress={version:1,balance:50,collection:{mochi:3,rosie:3},boxes:[{id:'old-unopened',dumplingId:'bunny'}],creditedRounds:[],trip:{active:false,purchases:0},location:'cleanup',reveal:null,pop:{tickets:15,bestScore:100,rounds:[],tutorialSeen:true,couponDay:0}};
const daily={version:1,day:3,phase:'morning',minutes:430,done:['teeth','outfit'],dust:[0,2,4],breakfast:'cook',eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',spillSite:1};
// Valid disposable stock fixture guarantees the MCP-moved display has a box.
progress.hunt=createHuntDay(3,()=>.99);
for(const [id,series] of [['corner','garden'],['toys','animals'],['collector','galaxy']])progress.hunt.stores[id].slots=Array.from({length:6},(_,site)=>({site,series,remaining:1,discovered:false}));
await context.addInitScript(({progress,daily})=>{if(!localStorage.getItem('qa-seeded')){localStorage.setItem('dumpling.editorMigration.progress.v1',JSON.stringify(progress));localStorage.setItem('dumpling.editorMigration.daily.v1',JSON.stringify(daily));localStorage.setItem('qa-seeded','yes');}},{progress,daily});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms),cdp=await context.newCDPSession(page);let planner;
const photo=n=>page.screenshot({path:`stores/evidence/phone/${n}.png`});
const pass=n=>{checks.push(n);console.log('PASS',n);};
async function moveTo(point,tolerance=.24){const s=await snap(),path=planner.route(new Vec3(s.position[0],0,s.position[2]),new Vec3(...point));assert.ok(path.length,'Reachable '+point);const b=await page.locator('#joystick').boundingBox(),c={x:b.x+b.width/2,y:b.y+b.height/2},r=b.width*.29;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...c,id:1}]});const start=Date.now();try{for(let i=0;i<path.length;i++){while(Date.now()-start<90000){const s=await snap(),dx=path[i].x-s.position[0],dz=path[i].z-s.position[2],d=Math.hypot(dx,dz);if(d<(i===path.length-1?tolerance:.2))break;const a=s.cameraRight,f=s.cameraForward,mag=Math.max(.3,Math.min(1,d*1.5));await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:c.x+r*(dx*a[0]+dz*a[2])/Math.hypot(a[0],a[2])/d*mag,y:c.y-r*(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/d*mag}]});await sleep(65);}}}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}await sleep(200);const end=await snap();assert.ok(Math.hypot(end.position[0]-point[0],end.position[2]-point[2])<tolerance+.15,'Arrived '+point);}
async function action(id){assert.equal(await page.locator('#action-button').getAttribute('data-target'),id);await page.locator('#action-button').tap();}
async function dev(command,value){await page.keyboard.press('F2');await page.locator('[data-tab]').nth(command==='phase'?1:0).click();const selector=`[data-command="${command}"]${value?`[data-value="${value}"]`:''}`;await page.locator(selector).first().click();if(await page.locator('#developer-panel').evaluate(d=>d.open))await page.locator('.dev-close').click();await sleep(250);}

export {browser,context,page,errors,checks,snap,sleep,photo,pass,moveTo,action,dev,cdp};
export function setPlanner(world){planner=new HousePath({walkable:world.walkable,obstacles:world.obstacles.map(o=>new BoundingBox(new Vec3(...o.center),new Vec3(...o.halfExtents)))},.24);}

