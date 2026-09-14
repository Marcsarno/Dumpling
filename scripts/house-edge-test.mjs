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
  }
  async function screenshot(file) { await page.screenshot({ path: `artifacts/stage4/${file}.png` }); }
  return { context, page, snap, touch, moveTo, press, center, screenshot };
}

try {
  const play = await createPlayer('house edges'); const { page, snap, touch, moveTo, press, center, screenshot } = play;
  await page.locator('#mission-practice').tap();
  // Walk into walls away from their openings: the low visual must still have full collision.
  await moveTo(.5, 2.7); await moveTo(1.2, 3.1);
  const j = await center('#joystick');
  async function pushWorld(dx, dz, duration) {
    await touch('touchStart', 1, j);
    const length = Math.hypot(dx, dz), x = (13 * dx - 10 * dz) / Math.sqrt(269) / length, y = (-10 * dx - 13 * dz) / Math.sqrt(269) / length;
    await touch('touchMove', 1, { x: j.x + j.radius * x, y: j.y - j.radius * y }); await sleep(duration); await touch('touchEnd', 1); await sleep(100);
  }
  await pushWorld(0, 1, 700); assert.ok((await snap()).position[2] < 3.32);
  await moveTo(1.2, 2.8); await moveTo(2.8, 3); await pushWorld(1, 0, 600); assert.ok((await snap()).position[0] < 3.02);
  console.log('PASS Low cutaway walls block walking; players cannot leave the bedroom through a non-door edge');
  await moveTo(1.15, 2.7); await moveTo(1.1, 0); await moveTo(4.3, 0);
  await moveTo(4.3, 1.15); await moveTo(6.3, 1.5);
  await moveTo(6.7, 2.9); await moveTo(8.2, 2.9); await pushWorld(0, -1, 600); assert.ok((await snap()).position[2] > 2.55);
  console.log('PASS Coffee table has a full player-radius collision footprint');
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932], [844, 390]]) {
    await page.setViewportSize({ width, height }); await sleep(300);
    const state = await snap();
    for (const selector of ['#joystick', '#action-button']) {
      const b = await page.locator(selector).boundingBox(); assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height);
    }
    assert.ok(state.playerScreen[0] > width * .2 && state.playerScreen[0] < width * .8);
    assert.ok(state.playerScreen[1] > height * .3 && state.playerScreen[1] < height * .7);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await screenshot(`edge-living-${width}x${height}`);
  }
  console.log('PASS Following keeps the player readable and controls on-screen at small portrait sizes and landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mission-house').tap(); await sleep(200);
  await moveTo(.15, -.55); await press('pickup-book'); await moveTo(.35, -1.45); await moveTo(1, -1.8); await press('bookshelf');
  await moveTo(1, 0); await moveTo(4.3, 0); await moveTo(4.3, 1.15); await moveTo(6.3, 1.5); await press('pickup-living-toy');
  const cameraAtRoom = (await snap()).cameraPosition;
  console.log('Waiting for the actual whole-house 60-second expiry while carrying…');
  while ((await snap()).cleanup.remaining > 0) await sleep(Math.min(1200, (await snap()).cleanup.remaining + 100));
  await page.locator('#results[open]').waitFor();
  assert.equal((await snap()).cleanup.reason, 'time'); assert.equal((await snap()).loop.balance, 1); assert.equal((await snap()).cleanup.allowance, 1);
  assert.equal((await snap()).cleanup.completed.length, 1); assert.equal((await snap()).room, 'living');
  assert.ok(Math.hypot((await snap()).cameraPosition[0] - cameraAtRoom[0], (await snap()).cameraPosition[2] - cameraAtRoom[2]) < .6);
  await screenshot('edge-house-timeout');
  await page.locator('#go-shopping').tap(); await sleep(200);
  assert.equal((await snap()).cleanup.carrying, null); assert.equal((await snap()).loop.mode, 'store');
  assert.deepEqual((await snap()).cameraPosition, [10, 15, 13]);
  await press('go-home'); await press('collection'); await page.locator('#back-cleanup').tap(); await sleep(200);
  assert.equal((await snap()).room, 'bedroom'); assert.equal((await snap()).cleanup.state, 'ready');
  assert.equal((await snap()).loop.balance, 1);
  console.log('PASS Real 60-second house expiry keeps partial earnings, ends gently, clears carried props for shopping and returns home correctly');
  assert.deepEqual(errors, []); console.log('PASS no browser errors');
} finally { await browser.close(); }


