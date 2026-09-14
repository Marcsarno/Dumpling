// Real touch input + read-only snapshots. No teleports, timer overrides or gameplay mutation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const baseURL = process.env.TEST_URL || 'http://localhost:5173';
const checks = [], errors = [];
await mkdir('artifacts/stage4', { recursive: true });
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
      const screenX = (13 * dx - 10 * dz) / Math.sqrt(269) / length * magnitude;
      const screenY = (-10 * dx - 13 * dz) / Math.sqrt(269) / length * magnitude;
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
  async function screenshot(file) { await page.screenshot({ path: `artifacts/stage4/${file}.png` }); }
  return { context, page, snap, touch, moveTo, press, center, screenshot };
}

function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
try {
  const play = await createPlayer('connected house'); const { page, snap, moveTo, press, screenshot } = play;
  await page.locator('#mission-practice').tap(); await sleep(200);
  const original = await snap(), rooms = new Set(), performanceSamples = [];
  async function room(name, file) {
    await sleep(350); const s = await snap(); assert.equal(s.room, name); rooms.add(name);
    assert.deepEqual(s.cameraAngles, original.cameraAngles); assert.equal(s.cameraHeight, original.cameraHeight);
    assert.ok(Math.abs((s.cameraPosition[0] - 10) - s.position[0]) < .3);
    assert.ok(Math.abs((s.cameraPosition[2] - 13) - (s.position[2] - .9)) < .3);
    performanceSamples.push({ room: name, drawCalls: s.drawCalls, fps: s.fps }); await screenshot(file);
  }
  await room('bedroom', '01-bedroom');
  await moveTo(1, .05); await moveTo(3.3, 0); await moveTo(4.3, 0); await room('hall', '02-hall');
  await moveTo(4.3, 1.5); await press('pickup-hall-shoes'); await moveTo(4.3, 2.15); await press('place-hall-shoes');
  await moveTo(4.3, -1.3); await press('pickup-hall-mail'); await moveTo(4.3, -2.7); await press('place-hall-mail');
  pass('Bedroom doorway opens into the hall; both hall carry-and-place interactions work');
  await moveTo(4.3, 1.15); await moveTo(5.7, 1.15); await moveTo(6.3, 1.5); await room('living', '03-living');
  await press('pickup-living-toy'); await moveTo(6.7, 2.9); await moveTo(9.6, 3.15); await press('place-living-toy');
  await moveTo(9.2, 2.8); await press('pickup-living-cushion'); await moveTo(9.5, 1.05); await moveTo(7.55, .85); await press('place-living-cushion');
  pass('Living room toy basket and sofa cushion work with clear paths around the coffee table');
  await moveTo(9.6, 1.05); await moveTo(10.4, 2.2); await moveTo(12, 2.2); await room('kitchen', '04-kitchen');
  await moveTo(12.15, 1.45); await press('pickup-kitchen-dish'); await moveTo(12.8, .8); await moveTo(14.05, .7); await press('place-kitchen-dish');
  await moveTo(12.8, 1.1); await moveTo(12.8, 3.2); await moveTo(14.7, 3.85); await press('pickup-kitchen-trash');
  await moveTo(12.35, 3.25); await press('place-kitchen-trash');
  pass('Kitchen dish reaches sink and trash disappears into its bin; island and appliances stay navigable');
  await moveTo(12.55, 1.1); await moveTo(12.5, -.9); await moveTo(12.1, -1.8); await room('laundry', '05-laundry');
  await moveTo(11.45, -1.85); await press('pickup-laundry-clothes'); await moveTo(10.25, -2.3); await press('place-laundry-clothes');
  await moveTo(12.1, -2.1); await moveTo(12.35, -1.8); await press('pickup-laundry-clean'); await moveTo(13, -2.65); await press('place-laundry-clean');
  pass('Laundry room connects directly from kitchen; washer and folding-counter tasks both work');
  await moveTo(11.8, -2.25); await moveTo(9.3, -2.35); await moveTo(7.6, -2.5); await room('bathroom', '06-bathroom');
  await press('pickup-bath-towel'); await moveTo(6.3, -2); await press('place-bath-towel');
  await moveTo(7.65, -1.95); await press('pickup-bath-bottle'); await moveTo(6.35, -2.85); await press('place-bath-bottle');
  pass('Bathroom towel and toiletries work, with clear circulation past bath, toilet and vanity');
  await moveTo(6, -2.35); await moveTo(4.3, -2.35); await room('hall', '07-bathroom-to-hall');
  await moveTo(4.3, 0); await moveTo(3.3, 0); await moveTo(1, 0); await moveTo(0, .9); await room('bedroom', '08-back-bedroom');
  assert.equal(rooms.size, 6); assert.equal((await snap()).cleanup.allowance, 0); assert.equal((await snap()).cleanup.remaining, 60000);
  pass('All six spaces form one walkable loop; untimed practice neither spends the minute nor creates allowance');
  // The separate living/laundry doorway must also be traversable in both directions.
  await moveTo(1, 0); await moveTo(4.3, 0); await moveTo(4.3, 1.15); await moveTo(5.8, 1.15);
  await moveTo(6.7, .9); await moveTo(9.9, .8); await moveTo(10.25, -.9); await moveTo(10.25, -1.75);
  assert.equal((await snap()).room, 'laundry'); await moveTo(10.25, -.9); await moveTo(10.25, .7);
  assert.equal((await snap()).room, 'living'); pass('Additional living/laundry doorway is traversable without clipping furniture');
  await page.locator('#mission-house').tap(); await sleep(200);
  assert.equal((await snap()).cleanup.tasks.length, 6); assert.equal((await snap()).cleanup.state, 'ready');
  const began = Date.now();
  await moveTo(.15, -.55); await press('pickup-book'); await moveTo(.35, -1.45); await moveTo(1, -1.8); await press('bookshelf');
  await moveTo(1, 0); await moveTo(4.3, 0); await moveTo(4.3, 1.15); await moveTo(6.3, 1.5); await press('pickup-living-toy');
  await moveTo(6.7, 2.9); await moveTo(9.6, 3.15); await press('place-living-toy');
  await moveTo(10.4, 2.2); await moveTo(12.15, 1.45); await press('pickup-kitchen-dish'); await moveTo(12.8, .8); await moveTo(14.05, .7); await press('place-kitchen-dish');
  await moveTo(12.8, 1.1); await moveTo(12.8, 3.2); await moveTo(14.7, 3.85); await press('pickup-kitchen-trash'); await moveTo(12.35, 3.25); await press('place-kitchen-trash');
  await moveTo(12.55, 1.1); await moveTo(12.5, -.9); await moveTo(11.45, -1.85); await press('pickup-laundry-clothes'); await moveTo(10.25, -2.3); await press('place-laundry-clothes');
  await moveTo(9.3, -2.35); await moveTo(7.6, -2.5); await press('pickup-bath-towel'); await moveTo(6.3, -2); await press('place-bath-towel');
  await page.locator('#results[open]').waitFor(); const final = await snap();
  assert.equal(final.cleanup.reason, 'complete'); assert.equal(final.cleanup.completed.length, 6); assert.equal(final.cleanup.allowance, 8); assert.equal(final.loop.balance, 8);
  assert.ok(Date.now() - began < 60000); await screenshot('09-house-results');
  const missionSeconds = Math.round((Date.now() - began) / 100) / 10;
  pass(`Six-task house mission completes with real touch input in ${missionSeconds}s; $6 earnings + $2 bonus save to wallet`);
  await page.locator('#replay').tap(); await sleep(200); assert.equal((await snap()).room, 'bedroom'); assert.equal((await snap()).cleanup.state, 'ready');
  await page.locator('#mission-bedroom').tap(); await sleep(150); assert.equal((await snap()).cleanup.tasks.length, 5); assert.equal((await snap()).cleanup.mode, 'bedroom');
  await moveTo(-.55, 1.25); await press('pickup-teddy'); assert.equal((await snap()).cleanup.carrying, 'teddy');
  pass('Replay returns to bedroom; approved five-task bedroom mission remains selectable and carrying works');
  assert.deepEqual(errors, []); pass('No browser warnings/errors, exceptions or failed asset requests');
  await writeFile('artifacts/stage4/report.json', JSON.stringify({ checks, errors, missionSeconds, performanceSamples }, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }
