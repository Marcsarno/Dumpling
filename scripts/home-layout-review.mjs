import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:850}});
await mkdir('artifacts/home-play',{recursive:true});
try{
 await page.goto('http://127.0.0.1:5195/?preview=home-play',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 for(const [name,x,z] of [['living',1,7],['dining',.55,11.9],['utility',4.7,11.4],['bedroom',.6,1.4],['garden',-6,4]]){
  await page.evaluate(async({x,z})=>{const source=await (await fetch('/src/main.ts')).text();const url=source.match(/from ["']([^"']*deps\/playcanvas[^"']*)/)[1];const pc=await import(url);pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
  await page.waitForTimeout(1200);await page.screenshot({path:`artifacts/home-play/before-${name}.png`});
 }
 await writeFile('artifacts/home-play/layout.json',JSON.stringify(await page.evaluate(()=>window.__roomTest.snapshot()),null,2));
}finally{await browser.close();}
