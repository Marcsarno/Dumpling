import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const folder=`artifacts/squishy-polish/${process.env.AUDIT_LABEL??'after'}`;await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:600,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5178/scripts/squishy-viewer.html');await page.waitForFunction(()=>window.squishyReview?.ready);await page.locator('nav').evaluate(e=>e.style.display='none');await page.locator('p').evaluate(e=>e.style.display='none');
 for(const id of ['mochi','rosie','cocoa','blueberry','lavendream','peachy','stardrop','supernova']){await page.evaluate(id=>window.squishyReview.select(id),id);await page.waitForTimeout(200);await page.screenshot({path:`${folder}/${id}.png`});}
 await writeFile(`${folder}/errors.json`,JSON.stringify(errors));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
