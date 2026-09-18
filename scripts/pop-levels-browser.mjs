import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],rounds=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const cdp=await context.newCDPSession(page),pop=()=>page.evaluate(()=>window.__roomTest.snapshot().loop.pop),save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.progress.v1')));
async function drag(path){const b=await page.locator('#squishy-pop canvas').boundingBox();for(const [n,i] of path.entries()){await cdp.send('Input.dispatchTouchEvent',{type:n?'touchMove':'touchStart',touchPoints:[{id:1,x:b.x+(i%6+.5)*b.width/6,y:b.y+(Math.floor(i/6)+.5)*b.width/6}]});await page.waitForTimeout(65);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(450);}
function chain(s,min=5){const pieces=s.pieces;function walk(path){if(path.length>=min)return path;const last=path.at(-1),base=path.find(i=>pieces[i].power!=='rainbow');for(let i=0;i<36;i++)if(!path.includes(i)&&Math.abs(i%6-last%6)<=1&&Math.abs(Math.floor(i/6)-Math.floor(last/6))<=1&&(base===undefined||pieces[i].power==='rainbow'||pieces[i].kind===pieces[base].kind)){const got=walk([...path,i]);if(got.length)return got;}return [];}for(let i=0;i<36;i++){const found=walk([i]);if(found.length)return found;}return [];}
async function layout(label){for(const [width,height] of [[320,568],[390,844],[430,932]]){await page.setViewportSize({width,height});const result=await page.locator('#squishy-pop').evaluate(d=>({overflow:d.scrollWidth>d.clientWidth,small:[...d.querySelectorAll('button')].filter(b=>b.getClientRects().length).some(b=>b.getBoundingClientRect().height<44)}));assert.deepEqual(result,{overflow:false,small:false});await page.screenshot({path:`artifacts/pop-levels/${label}-${width}.png`});}await page.setViewportSize({width:390,height:844});}
try{
 await mkdir('artifacts/pop-levels',{recursive:true});await page.goto(process.env.POP_URL??'http://127.0.0.1:5174');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,{},{timeout:60000});
 const before=await save();await page.locator('#squishy-pop-shortcut').tap();await page.locator('[data-level="0"]').waitFor();assert.equal(await page.locator('[data-level="1"]').isDisabled(),true);assert.equal(await page.locator('[data-level="2"]').isDisabled(),true);await layout('trail');
 for(let n=0;n<3;n++){
   await page.locator(`[data-level="${n}"]`).tap();await layout('briefing-'+n);await page.locator('[data-play-level]').tap();
   if(n===0){await page.locator('[data-start]').tap();await drag([12,13,14]);}
   await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='playing');await layout('playing-'+n);
   let moves=0,activated=new Set(),created=new Set(),goalAt=null;const start=Date.now();
   while((await pop()).state==='playing'){
     const s=await pop();if(s.completed&&goalAt===null)goalAt=Math.round((Date.now()-start)/1000);
     const power=s.pieces.findIndex(p=>p.power==='bomb'||p.power==='mega');
     await drag(power>=0?[power]:chain(s,moves%4===0?7:5).length?chain(s,moves%4===0?7:5):chain(s,3));moves++;
     const result=(await pop()).lastResult;if(result?.created)created.add(result.created);result?.activated.forEach(p=>activated.add(p));await page.waitForTimeout(650);
   }
   await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='results',{},{timeout:10000});const s=await pop(),saved=await save();assert.ok(s.completed,JSON.stringify(s.objectives));assert.ok(saved.pop.levels[s.level].completed);assert.equal(saved.pop.rounds.length,n+1);assert.equal(s.practice,false);assert.deepEqual(errors,[]);await layout('results-'+n);
   rounds.push({level:s.level,objectives:s.objectives,score:s.score,bestChain:s.bestChain,moves,goalAt,created:[...created],activated:[...activated],record:saved.pop.levels[s.level]});console.log('PASS round',JSON.stringify(rounds.at(-1)));
   await page.reload();await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,{},{timeout:60000});await page.locator('#squishy-pop-shortcut').tap();await page.locator('[data-level="0"]').waitFor();if(n<2)assert.equal(await page.locator(`[data-level="${n+1}"]`).isDisabled(),false);
 }
 const completed=await save();if(before)for(const k of Object.keys(before).filter(k=>k!=='pop'))assert.deepEqual(completed[k],before[k]);
 await page.locator('[data-level="0"]').tap();await page.locator('[data-play-level]').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='playing');
 // An idle replay must not erase completion, stars or best performance.
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='results',{},{timeout:70000});const replay=await save();assert.equal(replay.pop.levels['little-chains'].bestScore,completed.pop.levels['little-chains'].bestScore);assert.equal(replay.pop.levels['little-chains'].stars,completed.pop.levels['little-chains'].stars);assert.ok(replay.pop.levels['little-chains'].completed);
 await page.locator('[data-levels]').tap();await page.locator('[data-classic]').tap();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='playing');assert.equal((await pop()).pool.length,5);assert.equal((await pop()).level,undefined);await page.locator('.pop-pause').tap();await page.locator('[data-quit]').tap();
 assert.deepEqual(errors,[]);await writeFile('artifacts/pop-levels/report.json',JSON.stringify({rounds,errors,replayRetained:true,classic:true},null,2));console.log('PASS reload/unlocks, idle replay retention, Classic, touch, mobile layout and clean console');
}finally{await browser.close();}
