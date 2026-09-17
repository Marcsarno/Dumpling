import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
await mkdir('artifacts/house-lighting',{recursive:true});
const snap=()=>page.evaluate(()=>window.__roomTest.snapshot());
const ready=()=>page.waitForFunction(()=>window.__roomTest?.snapshot().lilah.loaded&&window.__roomTest.snapshot().characterLoaded&&window.__roomTest.snapshot().houseArt.loaded>140);
async function phase(phase,minutes) {
  await page.evaluate(({phase,minutes})=>{const s=JSON.parse(localStorage.getItem('arianna.daily.v1'));s.phase=phase;s.minutes=minutes;s.done=[];localStorage.setItem('arianna.daily.v1',JSON.stringify(s));},{phase,minutes});
  await page.reload();await ready();
}
try {
  await page.goto('http://127.0.0.1:5173');await ready();
  const day=await snap();assert.equal(day.lilah.height,.86465625);assert.ok(day.lighting.lights.every(l=>!l.enabled));
  const bounds=await page.evaluate(()=>({ari:window.__roomTest.characterGeometry()[0],lilah:window.__roomTest.lilahGeometry()[0]}));
  const ratio=(bounds.lilah.maxY-bounds.lilah.minY)/(bounds.ari.maxY-bounds.ari.minY);assert.ok(Math.abs(ratio-.625)<.025);
  await page.screenshot({path:'artifacts/house-lighting/day.png'});
  await phase('night',1140);
  await page.waitForFunction(()=>window.__roomTest.snapshot().lighting.amount===1);
  const night=await snap();assert.equal(night.lighting.lights.length,13);assert.ok(night.lighting.lights.every(l=>l.enabled&&l.intensity>0&&l.mask===1));assert.ok(night.lighting.glowingShades>=3);assert.equal(night.lighting.exteriorMask,8);
  await page.screenshot({path:'artifacts/house-lighting/night.png'});
  await phase('afternoon',1139.7);
  await page.waitForFunction(()=>window.__roomTest.snapshot().cleanup.daily.phase==='night'&&window.__roomTest.snapshot().lighting.amount===1);
  await page.screenshot({path:'artifacts/house-lighting/living-night.png'});
  await phase('morning',420);assert.equal((await snap()).lighting.amount,0);assert.ok((await snap()).lighting.lights.every(l=>!l.enabled));
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/house-lighting/report.json',JSON.stringify({checks:['Lilah 25% taller, preserved eight clips','Lights off during daylight','Nine real fixture lights and soft interior fill at night','Lamp shade emission','Exterior excluded from indoor light masks','Automatic evening transition','Lights reset next morning'],ratio,bounds,day,night,errors},null,2));
  console.log('PASS Lilah scale, daytime, night lamps, automatic dusk and next morning; no browser errors');
} catch(error) {await page.screenshot({path:'artifacts/house-lighting/failure.png'});console.error(error);process.exitCode=1;} finally {await browser.close();}
