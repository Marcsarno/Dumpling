import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {HomePlayStore} from '../src/systems/HomePlayStore.ts';import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
try{for(const scenario of ['direct cup','glancing cup','block','markers','beanbag']){
 const state=new HomePlayStore({getItem:()=>null,setItem:()=>{}},'fixture',1).data;
 state.toys.ball.position=[1,.08,5.6];state.toys.cup0.position=[scenario==='glancing cup'?1.22:1,.08,scenario==='beanbag'?6.95:6.2];
 if(scenario==='block'){state.toys.cup0.position=[2,.08,8.4];state.toys.block0.position=[1,.08,6.2];}
 if(scenario==='markers'){state.toys.cup0.position=[2,.08,8.4];state.toys.marker0.position=[.6,.08,6.2];state.toys.marker1.position=[1.4,.08,6.2];}
 if(scenario==='beanbag'){state.toys.beanbag.owner='held';state.toys.ball.position=[2,.08,8.4];}
 const context=await browser.newContext({viewport:{width:700,height:800},hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(state=>{localStorage.setItem('dumpling.homePlayReview.home-play.v1',JSON.stringify(state));localStorage.setItem('dumpling.homePlayReview.daily.v1',JSON.stringify({version:1,day:1,phase:'afternoon',minutes:960,done:[],dust:[0,2,4],breakfast:'done',eggDrop:false,schoolSeconds:0}));},state);
 await page.goto('http://127.0.0.1:5195/?preview=home-play');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const source=await(await fetch('/src/main.ts')).text(),url=source.match(/from ["']([^"']*deps\/playcanvas[^"']*)/)[1],pc=await import(url),app=pc.Application.getApplication();app.root.findByName('Arianna').setPosition(1,.09,5.2);app.root.findByName('Character visual pivot').setLocalEulerAngles(0,0,0);});await page.waitForTimeout(250);
 const snap=()=>page.evaluate(()=>window.__roomTest.snapshot().loop.homePlay);
 if(scenario!=='beanbag')for(let i=0;i<40&&(await snap()).selected!=='ball';i++){await page.locator('#home-next-object').tap();await page.waitForTimeout(40);}
 const verb=scenario==='beanbag'?'Toss':'Kick softly';for(let i=0;i<20&&await page.locator('#action-title').textContent()!==verb;i++){await page.locator('#home-next-action').tap();await page.waitForTimeout(40);}assert.equal(await page.locator('#action-title').textContent(),verb);await page.locator('#action-button').tap();
 let tilt=0,effects=0;for(let i=0;i<60;i++){const h=await snap();tilt ||= h.state.toys[scenario==='block'?'block0':'cup0'].tilt;effects=Math.max(effects,h.effects);if(scenario==='markers'?effects>0:tilt>0)break;await page.waitForTimeout(40);}
 if(scenario==='beanbag')console.log('Beanbag contact',JSON.stringify((await snap()).objects.filter(o=>['beanbag','cup0'].includes(o.id))));
 if(scenario==='markers')assert(effects>0,'Crossing the placed markers produces a visible reaction');else assert.equal(tilt,scenario==='glancing cup'?24:78,scenario);
 await page.screenshot({path:'artifacts/home-play/contact-'+scenario.replaceAll(' ','-')+'.png'});checks.push({scenario,tilt,effects});console.log('PASS',scenario);await context.close();
}assert.deepEqual(errors,[]);await writeFile('artifacts/home-play/contacts-input.json',JSON.stringify({checks,errors},null,2));}finally{await browser.close();}
