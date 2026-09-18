import {learnFirstChain} from './pop-learn-helper.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1200,height:950}}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await mkdir('artifacts/developer',{recursive:true});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),pop=async()=>(await snap()).loop.pop;
const pass=s=>{checks.push(s);console.log('PASS',s);};
const open=async()=>{if(!await page.locator('#developer-panel').evaluate(d=>d.open))await page.keyboard.press('F2');};
const close=()=>page.locator('#developer-panel .dev-close').click();
const tab=n=>page.locator(`#developer-panel [data-tab="${n}"]`).click();
const command=async(c,v)=>{const selector=`#developer-panel [data-command="${c}"]${v===undefined?'':`[data-value="${v}"]`}`;await page.locator(selector).filter({visible:true}).first().click();assert.equal(await page.locator('#developer-panel [data-status]').getAttribute('data-error'),'false');};
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.progress.v1')));
const ready=()=>page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded&&document.querySelector('.dev-launch'),{timeout:60000});
async function chain(path){const b=await page.locator('#squishy-pop canvas').boundingBox();for(let n=0;n<path.length;n++){const i=path[n];await page.mouse.move(b.x+(i%6+.5)*b.width/6,b.y+(Math.floor(i/6)+.5)*b.width/6);if(!n)await page.mouse.down();await page.waitForTimeout(25);}await page.mouse.up();await page.waitForTimeout(450);}
try{
 await page.goto('http://127.0.0.1:5173');await ready();await open();
 assert.equal(await page.evaluate(()=>localStorage.getItem('arianna.developer.checkpoint.v1')),null);
 const before=await snap();await page.waitForTimeout(1200);const after=await snap();assert.equal(after.cleanup.daily.minutes,before.cleanup.daily.minutes);assert.deepEqual(after.position,before.position);pass('Opening developer panel pauses world and creates no save checkpoint');
 await page.screenshot({path:'artifacts/developer/01-jump-desktop.png'});
 const money=(await saved()).balance;await command('complete-current');let s=await snap();assert.equal(s.cleanup.completed.length,s.cleanup.tasks.length);assert.equal((await saved()).balance,money);await command('complete-current');assert.equal((await saved()).balance,money);pass('Complete current morning tasks, repeat safely, no allowance awarded');
 const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.developer.checkpoint.v1')));assert.ok(checkpoint);
 await command('skip-chores');assert.equal(await page.locator('#developer-panel').evaluate(d=>d.open),false);s=await snap();assert.equal(s.cleanup.daily.phase,'afternoon');assert.equal(s.cleanup.completed.length,s.cleanup.tasks.length);pass('Skip chores moves to completed afternoon');
 await open();await tab(1);await command('cash');await command('tickets');await command('duplicates');await page.selectOption('#dev-friend','rosie');await command('give-box');await command('restock');let data=await saved();assert.equal(data.balance,money+20);assert.equal(data.pop.tickets,40);assert.equal(Object.keys(data.collection).length,26);assert.ok(Object.values(data.collection).every(v=>v===5));assert.equal(data.boxes.at(-1).dumplingId,'rosie');
 await command('freeze-clock');await close();const frozen=(await snap()).cleanup.daily.minutes;await page.waitForTimeout(1500);assert.equal((await snap()).cleanup.daily.minutes,frozen);await open();await command('freeze-clock');pass('Resource grants, duplicates, sealed box, restock and world clock freeze');
 for(const id of ['corner','toys','collector']){await tab(0);await command('store',id);s=await snap();assert.equal(s.loop.store.id,id);assert.equal(s.loop.boxes,1);assert.equal(s.loop.balance,money+20);await open();}
 pass('All three stores teleport instantly without consuming money or sealed boxes');
 await command('play-pop');await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.artFriends===26);await page.locator('#squishy-pop .dev-inline').click();await tab(2);const time=(await pop()).remaining;await page.waitForTimeout(1200);assert.equal((await pop()).remaining,time);pass('Panel opens above minigame and holds its timer');
 const popSave=JSON.stringify((await saved()).pop);
 for(const [n,power] of [[5,'bomb'],[7,'rainbow'],[10,'mega']]){await command('pop:chain',String(n));if(!(await pop()).timerFrozen)await command('pop:freeze');await page.locator('.dev-resume').click();await chain([12,13,14,15,16,17,23,22,21,20].slice(0,n));assert.equal((await pop()).lastResult.created,power);assert.equal((await pop()).practice,true);await page.locator('#squishy-pop .dev-inline').click();}
 for(const power of ['bomb','rainbow','mega']){await command('pop:'+power);assert.equal((await pop()).pieces[14].power,power);}
 await command('pop:deadlock');assert.ok((await pop()).valid.length>=3);await command('pop:frenzy');await page.screenshot({path:'artifacts/developer/02-pop-lab.png'});await command('pop:finish');assert.equal((await pop()).state,'results');assert.equal(JSON.stringify((await saved()).pop),popSave);await close();assert.match(await page.locator('.pop-ticket-prize').innerText(),/no rewards saved/);pass('5/7/10 drag chains create powers, injected powers, deadlock recovery, practice cannot award rewards');
 await page.locator('#squishy-pop .dev-inline').click();await command('pop:normal');assert.equal((await pop()).practice,false);assert.equal((await pop()).timerFrozen,false);await close();
 if(await page.locator('[data-start]').isVisible())await page.locator('[data-start]').click();await learnFirstChain(page);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='playing');await chain((await pop()).valid);
 // Real elapsed round verifies returning to normal mode restores legitimate rewards.
 await page.waitForFunction(()=>window.__roomTest.snapshot().loop.pop.state==='results',{},{timeout:70000});assert.ok((await saved()).pop.tickets>40);pass('Normal timed round after practice earns real tickets');
 await page.locator('#squishy-pop .dev-inline').click();await tab(3);
 for(const [w,h] of [[320,568],[390,844],[430,932]]){await page.setViewportSize({width:w,height:h});for(const n of [0,1,2,3]){await tab(n);assert.equal(await page.locator('#developer-panel').evaluate(d=>d.scrollWidth>d.clientWidth),false);const bounds=await page.locator('#developer-panel').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=w+1&&bounds.y+bounds.height<=h+1);}await tab(0);await page.screenshot({path:`artifacts/developer/03-mobile-${w}.png`});}
 pass('Panel fits 320, 390 and 430px phones; all tabs scroll without horizontal overflow');
 await tab(3);const download=page.waitForEvent('download');await page.locator('[data-tool="export"]').click();assert.equal((await download).suggestedFilename(),'arianna-save.json');
 const cpNow=await page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.developer.checkpoint.v1')));assert.deepEqual(cpNow,checkpoint);pass('Save export and original automatic checkpoint preserved through all changes');
 page.once('dialog',d=>d.accept());await page.locator('[data-tool="restore"]').click();await ready();data=await saved();const original=JSON.parse(checkpoint.values['arianna.progress.v1']);assert.deepEqual(data.collection,original.collection);assert.equal(data.balance,original.balance);assert.deepEqual(data.boxes,original.boxes);pass('Restore checkpoint reloads original collection, money and boxes');
 await open();await tab(3);page.once('dialog',d=>d.accept());await page.locator('[data-tool="reset"]').click();await ready();assert.equal((await saved()).balance,0);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.developer.checkpoint.v1'))),checkpoint);pass('Fresh save resets progress and retains restore checkpoint');
 assert.deepEqual(errors,[]);await writeFile('artifacts/developer/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
