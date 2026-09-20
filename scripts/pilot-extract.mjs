import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:5186/scripts/pilot-export.html');await page.waitForFunction(()=>window.__pilotExport);const data=await page.evaluate(()=>window.__pilotExport);await mkdir('pilot',{recursive:true});await writeFile('pilot/bedroom-source.json',JSON.stringify(data,null,2));console.log('Extracted materials: '+Object.keys(data.materials).length+', groups: '+data.room.children.length);}finally{await browser.close();}
