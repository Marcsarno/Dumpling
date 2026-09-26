import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],frames=[];
await mkdir('artifacts/daily-play',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:800}});page.on('pageerror',e=>errors.push(e.stack));
 await page.goto('http://127.0.0.1:5191/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-6,.09,8.2);});await page.waitForTimeout(1000);await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-4.1,.09,-10);});await page.waitForTimeout(2500);
 await page.screenshot({path:'artifacts/daily-play/restored-backyard.png'});
 await page.evaluate(async()=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(-6,.09,-17.7);});await page.waitForTimeout(700);
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication(),player=app.root.findByName('Arianna'),model=player.findComponents('anim')[0].entity,layer=model.anim.baseLayer,camera=app.root.findByTag('migration.camera')[0];app.timeScale=0;app.off('update');layer.playing=false;window.pose={app,player,model,layer,camera,angle:'front'};app.on('prerender',()=>{player.findByName('Character visual pivot').setLocalEulerAngles(0,0,0);camera.camera.orthoHeight=1.05;camera.setPosition(window.pose.angle==='side'?-3.4:-6,1.8,window.pose.angle==='side'?-17.4:-13.7);camera.lookAt(new pc.Vec3(-6,.8,-17.7));});});
 for(const clip of ['PlayInteract','PlayReach','PlayThrow','PlayRoll','PlayUse','PlayKick','PlayWave','PlayJump']){
  for(const angle of ['front','side'])for(const phase of [0,.15,.30,.50,.70,.85,.99]){
   await page.evaluate(({clip,angle,phase})=>{const p=window.pose;p.angle=angle;p.layer.play(clip);p.layer.playing=false;p.layer.activeStateCurrentTime=p.layer.activeStateDuration*phase;},{clip,angle,phase});await page.waitForTimeout(35);
   const path=`artifacts/daily-play/${clip}-${angle}-${phase}.png`;await page.screenshot({path});frames.push({clip,angle,phase,path});
  }
 }
 await writeFile('artifacts/daily-play/motion-review.json',JSON.stringify({errors,frames},null,2));
 for(const angle of ['front','side']){
  const sheet=await browser.newPage({viewport:{width:1400,height:1660}});const rows=frames.filter(f=>f.angle===angle);
  await sheet.setContent(`<style>body{margin:4px;display:grid;grid-template-columns:repeat(7,1fr);gap:3px;align-content:start;background:#ede6f1;font:11px Arial}img{width:100%}p{margin:2px}</style>`+(await Promise.all(rows.map(async f=>`<div><p>${f.clip} ${f.phase}</p><img src="data:image/png;base64,${(await readFile(f.path)).toString('base64')}"></div>`))).join(''));await sheet.screenshot({path:`artifacts/daily-play/poses-${angle}.png`});await sheet.close();
 }
 console.log(JSON.stringify({frames:frames.length,errors}));
}finally{await browser.close();}

