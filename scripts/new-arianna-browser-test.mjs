// Real touch input + read-only snapshots. No teleports, timer overrides or gameplay mutation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const baseURL = process.env.TEST_URL || 'http://localhost:5173';
const checks = [], errors = [];
await mkdir('artifacts/arianna-new', { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function createPlayer(name) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`${name}: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${name}: ${r.status()} ${r.url()}`); });
  await page.goto(baseURL); await page.locator('[data-ready=true]').waitFor();
  await page.waitForFunction(() => window.__roomTest.snapshot().characterLoaded);
  const cdp = await context.newCDPSession(page);
  await page.evaluate(() => {
    window.__pointerTrace = [];
    for (const event of ['pointerdown','pointerup','pointercancel','lostpointercapture']) document.addEventListener(event, e => window.__pointerTrace.push({event, id:e.pointerId, target:e.target.id, time:performance.now()}), true);
  });
  const snap = () => page.evaluate(() => window.__roomTest.snapshot());
  const currentTouches = new Map();
  async function touch(type, id, point) {
    if (type === 'touchEnd') currentTouches.delete(id);
    else if (type === 'touchCancel') currentTouches.clear();
    else currentTouches.set(id, { ...point, id });
    // CDP touchEnd ends the sequence. A partial finger lift is a changed active set on touchMove.
    const dispatchType = type === 'touchEnd' && currentTouches.size ? 'touchMove' : type;
    await cdp.send('Input.dispatchTouchEvent', { type: dispatchType, touchPoints: [...currentTouches.values()] });
  }
  async function center(selector) {
    const b = await page.locator(selector).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, radius: b.width * .29 };
  }
  async function moveTo(x, z, tolerance = .12) {
    const c = await center('#joystick');
    await touch('touchStart', 1, c);
    const began = Date.now();
    while (Date.now() - began < 7000) {
      const s = await snap();
      if (s.loop.mode === 'cleanup') assert.notEqual(s.cleanup.state, 'finished', `mission ended on route to ${x}, ${z}`);
      const dx = x - s.position[0], dz = z - s.position[2], length = Math.hypot(dx, dz);
      if (length < tolerance) { await touch('touchEnd', 1); await sleep(70); return; }
      // Convert world direction to screen-relative joystick axes using the unchanged camera basis.
      const magnitude = Math.min(1, Math.max(.3, length * 2.1));
      const right = s.cameraRight, forward = s.cameraForward;
      const screenX = (right[0] * dx + right[2] * dz) / Math.hypot(right[0], right[2]) / length * magnitude;
      const screenY = (forward[0] * dx + forward[2] * dz) / Math.hypot(forward[0], forward[2]) / length * magnitude;
      await touch('touchMove', 1, { x: c.x + c.radius * screenX, y: c.y - c.radius * screenY });
      await sleep(90);
    }
    await touch('touchEnd', 1);
    throw new Error(`Could not reach ${x},${z}; ${JSON.stringify((await snap()).position)}`);
  }
  async function press(expected, duration = 65) {
    await page.waitForFunction(id => document.querySelector('#action-button').dataset.target === id, expected, { timeout: 2000 }).catch(async error => {
      await screenshot('failure'); throw new Error(`${expected}: ${error.message}; ${JSON.stringify(await snap())}`);
    });
    const c = await center('#action-button');
    await touch('touchStart', 2, c); await sleep(duration); await touch('touchEnd', 2); await sleep(100);
    await page.waitForFunction(() => !window.__roomTest.snapshot().character.busy, undefined, { timeout: 6000 });
  }
  async function screenshot(file) { await page.screenshot({ path: `artifacts/arianna-new/${file}.png` }); }
  return { context, page, snap, touch, moveTo, press, center, screenshot };
}

function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
try {
  const play = await createPlayer('Arianna clip integration');
  const { page, snap, moveTo, touch, center, screenshot } = play;
  await page.locator('#mission-practice').tap();
  const initial = await snap();
  assert.equal(initial.characterLoaded, true);
  assert.ok(Math.abs(initial.character.scale-1.15)<.001);
  assert.deepEqual(initial.character.materials, ['Arianna baked game material']);
  assert.equal(initial.character.clips.length, 13);
  for (const clip of initial.character.clips) assert.equal(clip.loop, !['PickUp','PutDown','Celebrate'].includes(clip.name));
  pass('Approved GLB imports at authored scale with the supplied textured material and all supplied and runtime states');
  const observations = [];
  const geometry = await page.evaluate(() => window.__roomTest.characterGeometry());
  assert.equal(geometry[0].joints,28); assert.equal(geometry[0].vertices,18525); assert.equal(geometry[0].vertexColors,true);
  assert.ok(Math.abs(geometry[0].minY-initial.character.groundY)<.005, JSON.stringify(geometry));
  assert.ok(Math.abs(geometry[0].maxY-geometry[0].minY-1.38345)<.025);
  observations.push({idleGeometry:geometry});
  pass('Actual skinned mesh retains 28 joints and 1.38345m height; shoe soles contact the rug');
  async function action(expected, clip, eventTime, before, after) {
    await page.waitForFunction(id => document.querySelector('#action-button').dataset.target === id, expected);
    await touch('touchStart', 2, await center('#action-button')); await sleep(60); await touch('touchEnd', 2);
    await page.waitForFunction(()=>window.__roomTest.snapshot().character.busy);
    const origin = (await snap()).position, started=Date.now();
    await page.keyboard.down('ArrowRight');
    const samples = await page.evaluate(async () => {
      const samples = [];
      while (window.__roomTest.snapshot().character.busy) {
        const s=window.__roomTest.snapshot();
        samples.push({character:s.character,carrying:s.cleanup.carrying,allowance:s.cleanup.allowance,position:s.position});
        await new Promise(requestAnimationFrame);
      }
      return samples;
    });
    await page.keyboard.up('ArrowRight');
    assert.ok(samples.length > 20);
    assert.ok(samples.every(s => s.character.state === clip));
    assert.ok(samples.filter(s=>s.character.clipTime < eventTime).every(before));
    assert.ok(samples.filter(s=>s.character.clipTime >= eventTime+.05).every(after));
    assert.ok(samples.every(s=> Math.hypot(s.position[0]-origin[0],s.position[2]-origin[2]) < .002));
    const event = samples.find(s=>s.character.lastEvent?.clip===clip)?.character.lastEvent;
    assert.ok(event.time >= eventTime && event.time < eventTime+.16, JSON.stringify(event));
    assert.ok(samples.at(-1).character.clipTime > .75);
    assert.ok(Date.now()-started<1100,'Gesture should complete in about 0.8 seconds');
    observations.push({clip,event,samples:samples.length,finalClipTime:samples.at(-1).character.clipTime});
    pass(clip + ' plays the full clip in about 0.8 seconds, locks translation and commits at authored clip time ' + eventTime);
  }
  await moveTo(.15,-.55);
  await action('pickup-book','PickUp',.4,s=>s.carrying===null,s=>s.carrying==='book');
  await sleep(230);
  let s=await snap(); assert.equal(s.animationState,'CarryIdle');
  const mid=s.character.hands[0].map((v,i)=>(v+s.character.hands[1][i])/2);
  assert.ok(Math.hypot(...mid.map((v,i)=>v-s.character.socket[i])) < .03);
  await screenshot('02-carry-idle');
  pass('Held book follows the midpoint of the animated hand joints');
  async function walkSample(carrying, bulky=false) {
    const c=await center('#joystick');
    await touch('touchStart',1,c);
    await touch('touchMove',1,{x:c.x+c.radius*.8,y:c.y+c.radius*.6});
    await sleep(240);
    const samples=await page.evaluate(async()=>{
      const out=[];
      for(let i=0;i<24;i++){const s=window.__roomTest.snapshot();out.push({character:s.character,velocity:s.velocity,position:s.position,geometry:window.__roomTest.characterGeometry()});await new Promise(requestAnimationFrame);}
      return out;
    });
    await screenshot(carrying?(bulky?'06-carry-walk':'03-carry-run'):'05-run');
    await touch('touchEnd',1);
    const moving=samples.filter(s=>Math.hypot(...s.velocity)>(bulky?1.5:2.8));
    assert.ok(moving.length>4);
    for(const s of moving){
      assert.equal(s.character.state,carrying?(bulky?'CarryWalk':'CarryRun'):'Run');
      const expected=Math.min(1,Math.hypot(...s.velocity)/(bulky?1.65:3.15))*s.character.frameScale;
      assert.ok(Math.abs(s.character.playbackRate-expected)<.1);
      const yaw=Math.atan2(s.velocity[0],s.velocity[2])*180/Math.PI;
      const delta=((s.character.yaw-yaw+540)%360)-180;
      assert.ok(Math.abs(delta)<8);
      const sole=Math.min(s.geometry[0].leftSole,s.geometry[0].rightSole);
      assert.ok(Math.abs(sole-s.character.groundY)<.075, JSON.stringify({sole,ground:s.character.groundY}));
    }
    observations.push({gait:carrying?(bulky?'CarryWalk':'CarryRun'):'Run',rate:moving[0].character.playbackRate});
    pass((carrying?(bulky?'CarryWalk':'CarryRun'):'Run')+' loops at relaxed playback and faces the movement direction');
  }
  await walkSample(true);
  await moveTo(.35,-1.45); await moveTo(1,-1.8);
  await action('bookshelf','PutDown',.4,s=>s.carrying==='book',s=>s.carrying===null);
  await moveTo(1,.1); await walkSample(false);
  await sleep(220); assert.equal((await snap()).animationState,'Idle');
  pass('Locomotion blends back to Idle after releasing the joystick');
  await moveTo(1,1.6); await moveTo(.65,2.5); await play.press('pickup-vacuum'); await walkSample(true,true); await screenshot('06-vacuum-carry-walk');
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/arianna-new/animation-report.json',JSON.stringify({checks,errors,observations},null,2));
} finally { await browser.close(); }



