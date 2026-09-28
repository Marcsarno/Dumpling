import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
const errors=[],checks=[];page.on('pageerror',e=>{errors.push(String(e));console.log(String(e));});
await mkdir('artifacts/home-play',{recursive:true});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms),shot=n=>page.screenshot({path:`artifacts/home-play/${n}.png`});
async function position(x,z){await page.evaluate(async({x,z})=>{const source=await(await fetch('/src/main.ts')).text(),url=source.match(/from ["']([^"']*deps\/playcanvas[^"']*)/)[1],pc=await import(document.querySelector('script[type=importmap]')?'playcanvas':url);pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});await sleep(300);}
async function select(id){for(let n=0;n<50;n++){if((await snap()).loop.homePlay.selected===id)return;await page.locator('#home-next-object').tap();await sleep(50);}throw Error('Cannot select '+id);}
async function action(title){for(let n=0;n<20;n++){if((await page.locator('#action-title').textContent())===title){await page.locator('#action-button').tap();await sleep(900);return;}await page.locator('#home-next-action').tap();await sleep(60);}throw Error('Missing action '+title+' '+JSON.stringify((await snap()).loop.homePlay));}
try{
 await page.goto(process.env.HOME_PLAY_URL||'http://127.0.0.1:5195/?preview=home-play',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await position(1.7,7.65);await select('ball');await action('Pick up');assert.equal((await snap()).cleanup.carrying,'home-ball');checks.push('Shared carry socket owns ball');await shot('phase1-phone-carry');
 await page.keyboard.down('KeyA');await sleep(350);await page.keyboard.up('KeyA');await sleep(200);await action('Roll ball');await sleep(1500);assert.equal((await snap()).cleanup.carrying,null);checks.push('Ball rolls from actual chosen position');await shot('phase1-phone-roll');
 await position(1.7,7.65);await select('cup0');await action('Pick up');await position(.2,7.4);await action('Place here');const placed=(await snap()).loop.homePlay.state.toys.cup0.position;
 await position(0,2);await position(.2,7.4);assert.deepEqual((await snap()).loop.homePlay.state.toys.cup0.position,placed);checks.push('Cup persists across rooms');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded);assert.deepEqual((await snap()).loop.homePlay.state.toys.cup0.position,placed);checks.push('Cup placement persists after reload');
 await position(1.7,7.65);await select('basket');await action('Gather basket toys');assert.equal((await snap()).loop.homePlay.state.toys.cup0.position[0],1.78);checks.push('Basket tidies shared pieces');
 assert.deepEqual(errors,[]);await writeFile('artifacts/home-play/phase1-input.json',JSON.stringify({checks,errors,snapshot:await snap()},null,2));console.log(checks);
}catch(e){await shot('input-failure');await writeFile('artifacts/home-play/input-failure.json',JSON.stringify({error:String(e),errors,snapshot:await snap()},null,2));throw e;}finally{await browser.close();}
