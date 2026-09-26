import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
await mkdir('artifacts/daily-play',{recursive:true});
const groups=[['goal','bowling','cans','cart','boat'],['duck','bubbles','flower','pinwheel','jack'],['puddles','leaves','plane','flamingo','picnic']];
const group=Number(process.argv[2]??0),ids=groups[group];
const page=await browser.newPage({viewport:{width:1100,height:850}});page.on('pageerror',e=>{errors.push(String(e));console.log('ERROR',String(e));});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const move=(x,z)=>page.evaluate(async({x,z})=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
const state=async id=>(await snap()).loop.dailyPlay.stations.find(s=>s.id===id);
async function act(){await page.locator('#action-button').click();await page.waitForTimeout(1900);}
try{
 await page.addInitScript(ids=>{if(!sessionStorage.seeded){localStorage.setItem('dumpling.outdoorReview.daily-play.v1',JSON.stringify({version:1,seed:1234,day:1,ids,progress:{}}));sessionStorage.seeded='yes';}},ids);
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await move(-6,8.2);await page.waitForTimeout(1200);
 for(const [index,id] of ids.entries()){
  if(process.argv[3]&&id!==process.argv[3])continue;console.log('TRY',id);const x=-17-index*13,z=-15.3;
  await move(x,z+1.7);await page.waitForTimeout(1600);
  await page.screenshot({path:`artifacts/daily-play/${id}-before.png`});
  if(['goal','bowling'].includes(id)){await move(x,z+1.5);await act();await page.waitForTimeout(4000);}
  else if(id==='cart'){
   await move(x,z+1.3);await act();
   // Camera-space diagonal produces straight world -Z in this isometric camera.
   const j=await page.locator('#joystick').boundingBox();await page.mouse.move(j.x+j.width/2,j.y+j.height/2);await page.mouse.down();await page.mouse.move(j.x+j.width/2+18,j.y+j.height/2-54);await page.waitForTimeout(4500);await page.mouse.up();await page.waitForTimeout(3000);
  }else if(['duck','pinwheel','jack'].includes(id)){
   const s=await state(id);await move(s.target[0],s.target[2]+.6);for(let i=0;i<3;i++)await act();await page.waitForTimeout(5200);
  }else if(['cans','boat','flower','plane','flamingo','picnic'].includes(id)){
   for(let i=0;i<(id==='picnic'?3:1);i++){
    let s=await state(id);await move(s.target[0],s.target[2]+.66);await page.waitForTimeout(300);await act();
    console.log('HELD',id,(await snap()).loop.dailyPlay.holding);
    s=await state(id);const offset=id==='cans'?1.8:id==='boat'?.7:.7;
    await move(s.target[0]+(id==='boat'?.4:0),s.target[2]+(id==='boat'?0:offset));await page.waitForTimeout(300);await act();await page.waitForTimeout(4300);
   }
  }else if(id==='bubbles'){
   await move(x,z+1.3);await act();for(let i=0;i<6;i++){const s=await state(id),b=s.parts.filter(p=>p.name.startsWith('Bubble')&&p.enabled)[0];if(b){await move(b.position[0],b.position[2]);await page.waitForTimeout(450);}}
  }else if(id==='puddles'){
   const s=await state(id);for(const p of s.parts.filter(p=>p.name.startsWith('Puddle'))){await move(p.position[0],p.position[2]);await page.waitForTimeout(650);}
  }else if(id==='leaves'){await move(x,z+.4);await page.waitForTimeout(250);await act();await page.waitForTimeout(2100);}
  await page.screenshot({path:`artifacts/daily-play/${id}-after.png`});
  assert.equal((await snap()).loop.dailyPlay.progress[id]?.done,true,id+' must finish through normal actions');
  console.log('RESULT',JSON.stringify({id,state:await state(id),progress:(await snap()).loop.dailyPlay.progress[id]}));
 }
 await writeFile(`artifacts/daily-play/group-${group}.json`,JSON.stringify({errors,snapshot:await snap()},null,2));
}finally{await browser.close();}

