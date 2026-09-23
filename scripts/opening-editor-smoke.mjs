import {writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{await page.goto('https://launch.playcanvas.com/2600724?debug=true&device=webgl2');await page.locator('#game[data-ready=true]').waitFor({timeout:120000});await page.screenshot({path:'artifacts/opening/editor-launch.png'});if(errors.length)throw Error(errors.join('\n'));console.log('PASS fresh PlayCanvas launch with new backdrop asset/runtime');await writeFile('artifacts/opening/editor-report.json',JSON.stringify({errors}));}finally{await browser.close();}
