import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
await mkdir('artifacts/home-play/foods',{recursive:true});
try{for(const [food,day]of [['pizza',1],['taco',2],['turkey',3],['sandwich',1]]){
 const context=await browser.newContext({viewport:{width:800,height:800},hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(day=>localStorage.setItem('dumpling.homePlayReview.daily.v1',JSON.stringify({version:1,day,phase:'afternoon',minutes:960,done:['spill'],dust:[0,2,4],breakfast:'done',eggDrop:false,schoolSeconds:0,petTask:'feed-dog',sideTask:'living-toy',dinnerServed:true})),day);
 await page.goto('http://127.0.0.1:5195/?preview=home-play');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const source=await(await fetch('/src/main.ts')).text(),url=source.match(/from ["']([^"']*deps\/playcanvas[^"']*)/)[1],pc=await import(url);window.app=pc.Application.getApplication();});
 const snap=()=>page.evaluate(()=>window.__roomTest.snapshot()),sleep=ms=>page.waitForTimeout(ms);
 const position=async(x,z)=>{await page.evaluate(({x,z})=>app.root.findByName('Arianna').setPosition(x,.09,z),{x,z});await sleep(250);};
 const action=async(title,wait=1000)=>{for(let n=0;n<25;n++){if(await page.locator('#action-title').textContent()===title){await page.locator('#action-button').tap();await sleep(wait);return;}await page.locator('#home-next-action').tap();await sleep(40);}throw Error('Missing '+title);};
 if(food==='sandwich'){await page.keyboard.press('F2');await page.locator('[data-command="recess"]').click();if(await page.locator('.dev-close').isVisible())await page.locator('.dev-close').click();await page.waitForFunction(()=>window.__roomTest.snapshot().loop.recess?.art?.loaded===2);await position(4.6,-20.15);await action('Choose sandwich');await action('Choose orange');await action('Take lunch',2300);await position(1.6,-15.65);}
 else{await position(.55,11.9);await action('Take a portion');}
 await action('Set plate down');await action('Sit down');assert.equal((await snap()).loop.meals.plate.food,food);
 await page.evaluate(lunch=>{window.angle='front';window.pauseContact=false;const player=app.root.findByName('Arianna'),camera=app.root.findComponents('camera')[0].entity;app.on('prerender',()=>{const p=player.getPosition(),side=window.angle==='side';camera.setPosition(p.x+(side?3:0),1.7,p.z+(side?0:lunch?-3:3));camera.lookAt(p.x,.82,p.z);camera.camera.orthoHeight=1.4;});app.on('postrender',()=>{const c=window.__roomTest.snapshot().character;if(window.pauseContact&&c.clipTime>=.65&&['MealBite','MealDrink'].includes(c.action)){app.timeScale=0;window.pauseContact=false;}});},food==='sandwich');
 for(const [label,verb]of [['bite','Eat'],['drink','Drink'],...(food==='sandwich'?[['fruit','Eat fruit']]:[])]){
  await page.evaluate(()=>{window.pauseContact=true;app.timeScale=1;});await action(verb,900);await page.waitForFunction(()=>app.timeScale===0);
  for(const angle of ['front','side']){await page.evaluate(angle=>window.angle=angle,angle);await sleep(80);await page.screenshot({path:`artifacts/home-play/foods/${food}-${label}-${angle}.png`});}
  await page.evaluate(()=>app.timeScale=1);await sleep(800);
 }
 const result=(await snap()).loop.meals.plate;assert.equal(result.bites,1);assert.equal(result.drink,1);if(food==='sandwich')assert.equal(result.fruitBites,1);
 await page.locator('#home-next-object').tap();await sleep(900);assert.equal((await snap()).loop.meals.seat,undefined);
 checks.push({food,bites:result.bites,drink:result.drink,fruitBites:result.fruitBites,seatReleased:true});console.log('PASS',food);await context.close();
}assert.deepEqual(errors,[]);await writeFile('artifacts/home-play/food-input.json',JSON.stringify({checks,errors},null,2));}finally{await browser.close();}
