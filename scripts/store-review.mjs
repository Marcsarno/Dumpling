import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.env.STAGE||'before',out='stores/evidence/'+stage;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{for(const store of (process.env.STORES||'corner,toys,collector').split(',')){
 const context=await browser.newContext({viewport:{width:1280,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(r.status()+' '+r.url().split('?')[0]);});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5186/migration/exports/game/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});
 await page.keyboard.press('F2');await page.locator('[data-command="store"][data-value="'+store+'"]').click();if(await page.locator('.dev-close').isVisible())await page.locator('.dev-close').click();await page.waitForTimeout(900);
 const snapshot=await page.evaluate(()=>window.__roomTest.snapshot());
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication(),camera=app.root.findByTag('migration.camera')[0];app.off('update');camera.setPosition(13,19,23);camera.lookAt(0,.5,0);camera.camera.orthoHeight=10.5;document.querySelectorAll('#game > :not(canvas)').forEach(e=>e.style.display='none');document.querySelectorAll('body *').forEach(e=>{if(e.tagName!=='CANVAS'&&!e.contains(document.querySelector('canvas')))e.style.visibility='hidden';});});await page.waitForTimeout(500);
 await page.screenshot({path:out+'/'+store+'.png'});results.push({store,errors,snapshot});await context.close();console.log('CAPTURE',store,errors.length+' errors');
}}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(results,null,2));}


