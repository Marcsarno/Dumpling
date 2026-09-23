import {mkdir} from 'node:fs/promises';
import {browser,page,context,sleep} from './store-test-helpers.mjs';
await context.addInitScript(()=>{if(!localStorage.getItem('eat-fixture')){localStorage.setItem('arianna.daily.v1',JSON.stringify({version:1,day:1,phase:'morning',minutes:430,done:['teeth','outfit'],dust:[0,2,4],breakfast:'serve',breakfastAtTable:true,eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',spillSite:1}));localStorage.setItem('eat-fixture','true');}});
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(.55,.09,11.9);});await sleep(1600);
 await page.waitForFunction(()=>document.querySelector('#action-button').dataset.target==='eat-breakfast');await page.locator('#action-button').tap();await sleep(1800);await mkdir('artifacts/house-detail-after',{recursive:true});await page.screenshot({path:'artifacts/house-detail-after/breakfast.png'});
 await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.breakfast==='done');console.log('PASS Larger dining chair breakfast animation and completion');
}finally{await browser.close();}
