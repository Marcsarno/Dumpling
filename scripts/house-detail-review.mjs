import {mkdir,writeFile} from 'node:fs/promises';
import {browser,page,sleep} from './store-test-helpers.mjs';
const out=process.env.EVIDENCE||'artifacts/house-detail-before';await mkdir(out,{recursive:true});
try{
 await page.goto('http://127.0.0.1:5191/dist/index.html');await page.waitForFunction(()=>window.__roomTest?.snapshot().characterLoaded,undefined,{timeout:90000});await sleep(4000);
 for(const [name,x,z] of [['bathroom',4.6,-1],['living',4.4,6.4],['kitchen',.5,12]]){
  await page.evaluate(async({x,z})=>{const pc=await import('playcanvas'),app=pc.Application.getApplication();app.root.findByName('Arianna').setPosition(x,.09,z);}, {x,z});await sleep(2000);await page.screenshot({path:out+'/'+name+'.png'});
 }
 const geometry=await page.evaluate(async()=>{const pc=await import('playcanvas'),a=pc.Application.getApplication();return a.root.findComponents('render').filter(r=>r.entity.enabled&&/bathroomSink|bathroomMirror|loungeChair|soap/i.test(r.entity.name)).map(r=>({name:r.entity.name,position:r.entity.getPosition().toArray(),meshes:r.meshInstances.map(m=>({name:m.material.name,center:m.aabb.center.toArray(),half:m.aabb.halfExtents.toArray()}))}));});await writeFile(out+'/geometry.json',JSON.stringify(geometry,null,2));
}finally{await browser.close();}
