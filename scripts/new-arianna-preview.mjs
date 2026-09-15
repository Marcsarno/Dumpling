import {writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
 await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(5000);
 const state=await page.evaluate(()=>({snapshot:window.__roomTest?.snapshot(),geometry:window.__roomTest?.characterGeometry()}));
 await page.screenshot({path:'artifacts/arianna-new/idle.png'});
 await writeFile('artifacts/arianna-new/preview.json',JSON.stringify({errors,...state},null,2));
 console.log(JSON.stringify({errors,loaded:state.snapshot?.characterLoaded,character:state.snapshot?.character,geometry:state.geometry},null,2));
} finally {await browser.close()}

