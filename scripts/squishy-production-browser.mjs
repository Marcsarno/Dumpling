import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await context.addInitScript(()=>{if(!localStorage.getItem('squishy-production')){localStorage.setItem('arianna.progress.v1',JSON.stringify({version:1,balance:27,collection:{mochi:2,rosie:3},boxes:[{id:'production-basket',dumplingId:'mochi'}],creditedRounds:['previous-reward'],trip:{active:false,purchases:0},location:'home',reveal:null}));localStorage.setItem('squishy-production','yes');}});
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('arianna.progress.v1')));
await context.addInitScript(()=>{const Native=window.Audio;window.releaseAudio=[];window.Audio=class extends Native{constructor(...args){super(...args);window.releaseAudio.push(this);}};});
const music=file=>page.waitForFunction(file=>window.releaseAudio.some(a=>decodeURIComponent(a.src).endsWith(file)&&!a.paused&&a.currentTime>0&&a.duration>0),file,{timeout:20000});
async function dev(command,value=''){await page.keyboard.press('F2');await page.locator('[data-tab]').nth(command==='phase'?1:0).click();await page.locator(`[data-command="${command}"]${value?`[data-value="${value}"]`:''}`).first().click();if(await page.locator('#developer-panel').evaluate(d=>d.open))await page.locator('.dev-close').click();}
try{
 await page.goto(process.env.TEST_URL??'http://127.0.0.1:4179');await page.locator('#game[data-ready=true]').waitFor({timeout:60000});assert.equal(await page.evaluate(()=>typeof window.__roomTest),'undefined');
 await page.locator('#action-button[data-target=open-box]').tap();await page.locator('#squish-friend').waitFor();assert.equal((await saved()).collection.mochi,3);await page.locator('#squish-friend').tap();await page.waitForTimeout(950);await page.screenshot({path:'artifacts/squishy-art/production-reward.png'});
 await page.reload();await page.locator('#game[data-ready=true]').waitFor();assert.equal((await saved()).collection.mochi,3);assert.equal((await saved()).balance,27);assert.equal((await saved()).boxes.length,0);assert.deepEqual((await saved()).creditedRounds,['previous-reward']);
 await page.locator('#action-button').tap();await page.waitForFunction(()=>[...document.querySelectorAll('.dumpling-card.owned img')].every(i=>i.complete&&i.naturalWidth===320));await page.locator('#visit-recess').tap();await page.waitForTimeout(1600);await page.screenshot({path:'artifacts/squishy-art/production-classroom.png'});assert.deepEqual(errors,[]);
 await music('Squishy school trading.mp3');
 await dev('phase','morning');await music('Squishy home clean.mp3');
 await dev('phase','afternoon');await music('Squishy Home clean v2.mp3');
 await dev('store','corner');await music('Squishy shopping.mp3');
 await dev('store','toys');await music('Squishy shopping v2.mp3');
 assert.equal(await page.evaluate(()=>window.releaseAudio.some(a=>a.src.includes('unlock.mp3'))),false);assert.deepEqual(errors,[]);
 await writeFile('artifacts/squishy-art/production-report.json',JSON.stringify({url:page.url(),errors,rewardCount:3,oldBalancePreserved:true,portraits:true,classroom:true,musicTracks:5,unlockUnused:true},null,2));console.log('PASS production reveal, saved receipt/reload, portraits, classroom and all five scene music tracks; unlock unused');
}finally{await browser.close();}
