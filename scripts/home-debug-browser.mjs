import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
await page.addInitScript(()=>localStorage.setItem('dumpling.homePlayReview.daily.v1',JSON.stringify({version:1,day:1,phase:'afternoon',minutes:960,done:[],dust:[0,2,4],breakfast:'done',eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',dinnerServed:true})));
await page.goto('http://127.0.0.1:5195/?preview=home-play');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
await page.evaluate(async()=>{const source=await(await fetch('/src/main.ts')).text(),url=source.match(/from ["']([^"']*deps\/playcanvas[^"']*)/)[1],pc=await import(url);window.app=pc.Application.getApplication();app.root.findByName('Arianna').setPosition(.55,.09,11.9);});
await page.waitForTimeout(500);
for(const action of ['Take a portion','Set plate down','Sit down']){for(let n=0;n<20;n++){if(await page.locator('#action-title').textContent()===action){await page.locator('#action-button').click();break;}await page.locator('#home-next-action').click();await page.waitForTimeout(40);}await page.waitForTimeout(1300);}
console.log('FOOD',JSON.stringify(await page.evaluate(()=>{const root=app.root.findByName('Arianna’s dinner plate');return {root:root.getPosition().toArray(),nodes:root.findComponents('render').map(r=>({name:r.entity.name,enabled:r.entity.enabled,local:r.entity.getLocalPosition().toArray(),world:r.entity.getPosition().toArray(),meshes:r.meshInstances.map(m=>({center:m.aabb.center.toArray(),half:m.aabb.halfExtents.toArray(),node:m.node.name}))})),bones:['Hips','Head','LeftHand'].map(n=>[n,app.root.findByName('Arianna').findByName(n)?.getPosition().toArray()])};}),null,2));
async function dev(c){await page.keyboard.press('F2');await page.locator(`[data-command="${c}"]`).first().click();if(await page.locator('.dev-close').isVisible())await page.locator('.dev-close').click();await page.waitForTimeout(1800);}
await dev('recess');await page.waitForTimeout(1500);await dev('home');
const before=await page.evaluate(()=>Array.from(app.graphicsDevice.textures).map(t=>t.id));
await dev('recess');await page.waitForTimeout(1500);await dev('home');
console.log('NEW TEXTURES',await page.evaluate(ids=>Array.from(app.graphicsDevice.textures).filter(t=>!ids.includes(t.id)).map(t=>({id:t.id,name:t.name,size:t._gpuSize,device:!!t.device,width:t.width,height:t.height})),before));
await browser.close();
