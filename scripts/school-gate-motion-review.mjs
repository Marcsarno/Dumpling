import {chromium} from 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
const dir='artifacts/school-gate/motion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],frames=[];
try {
 const page=await browser.newPage({viewport:{width:480,height:520}});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5192/dist/index.html?preview=outdoors');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:120000});
 const move=(x,z)=>page.evaluate(async({x,z})=>{const pc=await import('playcanvas');pc.Application.getApplication().root.findByName('Arianna').setPosition(x,.09,z);},{x,z});
 await move(-6,8.2);await page.waitForTimeout(200);await move(21,-27.4);await page.waitForFunction(()=>window.__roomTest.snapshot().loop.schoolGate.ready);await page.waitForTimeout(800);
 await page.addStyleTag({content:'body *{visibility:hidden!important}canvas{visibility:visible!important}'});
 await page.evaluate(async()=>{const pc=await import('playcanvas'),app=pc.Application.getApplication(),arianna=app.root.findByName('Arianna'),poppy=app.root.findByName('Poppy at the school gate'),camera=app.root.findByTag('migration.camera')[0];app.timeScale=0;app.off('update');window.pose={app,arianna,poppy,camera,subject:'Arianna',angle:'front'};app.on('prerender',()=>{const w=window.pose,person=w.subject==='Arianna'?arianna:poppy,p=person.getPosition();arianna.enabled=w.subject==='Arianna';poppy.enabled=w.subject==='Poppy';person.setEulerAngles(0,0,0);if(w.subject==='Arianna')arianna.findByName('Character visual pivot').setLocalEulerAngles(0,0,0);camera.camera.orthoHeight=1.02;camera.setPosition(p.x+(w.angle==='side'?3:0),1.5,p.z+(w.angle==='side'?0:3));camera.lookAt(new pc.Vec3(p.x,.76,p.z));});});
 for(const [subject,clips] of [['Arianna',['PlayKick','PickUp','PutDown']],['Poppy',['Walk','Kick_Right']]])for(const clip of clips)for(const angle of ['front','side'])for(const phase of [0,.15,.30,.50,.70,.85,.99]){
  await page.evaluate(({subject,clip,angle,phase})=>{const w=window.pose;w.subject=subject;w.angle=angle;const person=subject==='Arianna'?w.arianna:w.poppy,anim=person.findComponents('anim')[0],layer=anim.baseLayer;anim.playing=false;layer.play(clip);layer.activeStateCurrentTime=layer.activeStateDuration*phase;anim.update(0);layer.playing=false;},{subject,clip,angle,phase});await page.waitForTimeout(40);
  const path=`${dir}/${subject}-${clip}-${angle}-${phase}.png`;await page.screenshot({path});frames.push({subject,clip,angle,phase,path});
 }
 for(const angle of ['front','side']){const sheet=await browser.newPage({viewport:{width:1400,height:1150}});await sheet.setContent('<style>body{margin:4px;display:grid;grid-template-columns:repeat(7,1fr);gap:3px;align-content:start;background:#ede6f1;font:12px Arial}img{width:100%}p{margin:2px}</style>'+(await Promise.all(frames.filter(f=>f.angle===angle).map(async f=>`<div><p>${f.subject} ${f.clip} ${f.phase}</p><img src="data:image/png;base64,${(await readFile(f.path)).toString('base64')}"></div>`))).join(''));await sheet.screenshot({path:`${dir}/${angle}.png`});await sheet.close();}
 await writeFile(`${dir}/review.json`,JSON.stringify({errors,frames},null,2));console.log(JSON.stringify({errors,frames:frames.length}));
}finally{await browser.close();}
