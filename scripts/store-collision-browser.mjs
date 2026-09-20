import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {browser,page,errors,snap,sleep,photo,dev,setPlanner,moveTo,cdp,action} from './store-test-helpers.mjs';
try{
 await page.goto(process.env.GAME_URL);await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});await dev('store','corner');let s=await snap();setPlanner(s.loop.store);await moveTo(s.loop.store.sites[5].position);await action('hunt-site-5');await sleep(1400);
 assert.equal(await page.locator('.pop-launch').isVisible(),false);assert.equal(await page.locator('#hunt-find').isVisible(),true);assert.equal(await page.locator('#squishy-pop-shortcut').isVisible(),true);await photo('clover-product-panel');
 const obstacle=s.loop.store.obstacles[5],b=await page.locator('#joystick').boundingBox(),c={x:b.x+b.width/2,y:b.y+b.height/2};s=await snap();const dx=obstacle.center[0]-s.position[0],dz=obstacle.center[2]-s.position[2],d=Math.hypot(dx,dz),a=s.cameraRight,f=s.cameraForward,r=b.width*.29;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...c,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:c.x+r*(dx*a[0]+dz*a[2])/Math.hypot(a[0],a[2])/d,y:c.y-r*(dx*f[0]+dz*f[2])/Math.hypot(f[0],f[2])/d}]});await sleep(1800);const stopped=await snap();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(stopped.position[0]<obstacle.center[0]-obstacle.halfExtents[0]-.2,'Hero table stops Arianna at its authored collision edge');await sleep(500);await photo('clover-collision');assert.deepEqual(errors,[]);await writeFile('stores/evidence/phone/collision.json',JSON.stringify({checks:['Product panel clear of large Pop button; footer shortcut remains','Actual touch push stops at edited hero-table collision'],errors,position:stopped.position,obstacle},null,2));console.log('PASS store collision and product panel');
}finally{await browser.close();}
