import {learnFirstChain} from './pop-learn-helper.mjs';
// Deterministic UI fixtures live only in this development harness, never in the game/save API.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await page.context().newCDPSession(page);
const snap=()=>page.evaluate(()=>window.pop.snapshot());
async function drag(path,finish=true){const b=await page.locator('canvas').boundingBox();for(let n=0;n<path.length;n++){const i=path[n];await cdp.send('Input.dispatchTouchEvent',{type:n?'touchMove':'touchStart',touchPoints:[{id:1,x:b.x+(i%6+.5)*b.width/6,y:b.y+(Math.floor(i/6)+.5)*b.width/6}]});await page.waitForTimeout(40);}if(finish)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
const shape=[0,1,2,3,4,5,11,10,9,8,7,6];
try{
await page.goto((process.env.POP_URL??'http://127.0.0.1:5173')+'/scripts/pop-core.html',{waitUntil:'domcontentloaded'});await page.locator('[data-classic]').click();await page.locator('[data-start]').tap();await learnFirstChain(page);await page.waitForFunction(()=>window.pop.snapshot().state==='playing');
for(const [n,power] of [[5,'bomb'],[7,'rainbow'],[10,'mega']]){
 await page.evaluate(()=>{window.pop.board.pieces.forEach(p=>{p.kind='rosie';delete p.power;});window.pop.lockedUntil=0;});await drag(shape.slice(0,n));assert.equal((await snap()).lastResult.created,power);await page.waitForTimeout(450);await page.screenshot({path:`artifacts/squishy-pop/power-${power}.png`});
 const p=await snap(),at=p.pieces.findIndex(p=>p.power===power);assert.ok(at>=0);if(power!=='rainbow'){await drag([at]);assert.ok((await snap()).lastResult.activated.includes(power));}else{
  const next=at%6<4?[at+1,at+2]:[at-1,at-2];await page.evaluate(indices=>indices.forEach(i=>window.pop.board.pieces[i].kind='blueberry'),next);await drag([at,...next]);assert.ok((await snap()).lastResult.activated.includes('rainbow'));
 }await page.waitForTimeout(450);
}
assert.equal((await snap()).frenzy,true);console.log('PASS real touch creates and activates Bomb, Rainbow and Mega; strong quick chains trigger Frenzy');
await page.evaluate(()=>{window.pop.board.pieces.forEach((p,i)=>{p.kind=['mochi','rosie','minty','blueberry','sunny','lavendream'][(i%6+Math.floor(i/6)*2)%6];delete p.power;});});assert.equal((await snap()).valid.length,0);await page.evaluate(()=>{const b=window.pop.board;b.ensurePlayable();window.pop.feedback='A little shuffle!';window.pop.feedbackUntil=window.pop.activeTime+1;});assert.ok((await snap()).valid.length>=3);
const bounds=[];for(const size of [[320,568],[390,844],[430,932]]){await page.setViewportSize({width:size[0],height:size[1]});await page.waitForTimeout(100);const b=await page.locator('canvas').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=size[1]);bounds.push({size,cell:b.width/6});await page.screenshot({path:`artifacts/squishy-pop/live-${size[0]}.png`});}
await page.setViewportSize({width:390,height:844});let current=await snap();await drag(current.valid,false);const selected=(await snap()).chain;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:130,y:350},{id:2,x:210,y:350}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap()).chain.length,0);console.log('PASS phone layouts, shuffle recovery and multi-touch cancellation');
for(let n=0;n<12;n++){await page.evaluate(()=>window.pop.finish());await page.locator('[data-replay]').tap();await page.locator('[data-start]').tap();await learnFirstChain(page);await page.evaluate(()=>{window.pop.state='playing';window.pop.showCover();});await page.waitForTimeout(90);}
await page.locator('.pop-pause').tap();await page.waitForTimeout(600);const end=await snap();assert.equal(end.audio.voices,0);assert.equal(end.audio.music,false);assert.equal(end.artFriends,26);assert.ok(end.particles<=90);assert.deepEqual(errors,[]);await writeFile('artifacts/squishy-pop/powers-report.json',JSON.stringify({bounds,errors,audio:end.audio,artFriends:end.artFriends,particles:end.particles},null,2));console.log('PASS twelve replay cycles keep 26 cached friends, <=90 particles, and release all audio voices on pause');
}finally{await browser.close();}

