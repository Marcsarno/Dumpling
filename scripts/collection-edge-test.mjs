// Real touch input + read-only snapshots. No teleports, timer overrides or gameplay mutation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const baseURL = process.env.TEST_URL || 'http://localhost:5173';
const checks = [], errors = [];
await mkdir('artifacts/stage3', { recursive: true });
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
  async function screenshot(file) { await page.screenshot({ path: `artifacts/stage3/${file}.png` }); }
  return { context, page, snap, touch, moveTo, press, center, screenshot };
}

// Saved-state fixtures exercise rare presentation and purchase boundaries without spending dozens of rounds.
// The separate collection-browser-test uses only real gameplay from a fresh wallet.
try {
  for (const [rarity, id, color, stars] of [['Common', 'mochi', '#c4b7d1', 5], ['Rare', 'blueberry', '#78b8ec', 10], ['Epic', 'lavendream', '#be87e6', 16], ['Legendary', 'stardrop', '#f2c661', 24]]) {
    const play = await createPlayer(rarity); const { page, snap, press } = play;
    await page.evaluate(({ id }) => localStorage.setItem('arianna.progress.v1', JSON.stringify({ version: 1, balance: 3, collection: {}, boxes: [{ id: 'fixture-box', dumplingId: id }], creditedRounds: [], trip: { active: false, purchases: 0 }, location: 'home', reveal: null })), { id });
    await page.setViewportSize({ width: 360, height: 640 }); await page.reload(); await page.locator('[data-ready=true]').waitFor(); await sleep(200);
    await page.screenshot({ path: `artifacts/stage3/fixture-${rarity}-sealed.png` });
    await press('open-box'); await sleep(1650);
    assert.equal(await page.locator('.reveal-spark').count(), stars);
    assert.equal(await page.locator('#reveal-copy').evaluate(e => e.style.getPropertyValue('--rarity')), color);
    await page.screenshot({ path: `artifacts/stage3/fixture-${rarity}-effect.png` });
    await sleep(950); assert.equal((await snap()).loop.phase, 'revealed');
    await page.screenshot({ path: `artifacts/stage3/fixture-${rarity}-revealed.png` });
    await press('collection'); assert.equal((await snap()).loop.collection[id], 1);
    const button = await page.locator('#back-cleanup').boundingBox(); assert.ok(button.y >= 0 && button.y + button.height <= 640);
    await play.context.close(); console.log(`PASS ${rarity} presentation, configured color, ${stars} particles, phone layout and collection`);
  }
  const play = await createPlayer('trip cap'); const { page, snap, press, moveTo } = play;
  await page.evaluate(() => localStorage.setItem('arianna.progress.v1', JSON.stringify({ version: 1, balance: 20, collection: {}, boxes: [], creditedRounds: [], trip: { active: true, purchases: 0 }, location: 'store', reveal: null })));
  await page.reload(); await page.locator('[data-ready=true]').waitFor(); await sleep(200);
  await moveTo(-.7, .7); await press('buy-box'); await press('buy-box'); await press('buy-box');
  assert.equal((await snap()).loop.balance, 8); assert.equal((await snap()).loop.boxes, 3);
  assert.equal(await page.locator('#action-title').textContent(), 'Bag full'); assert.equal(await page.locator('#action-button').isDisabled(), true);
  await page.keyboard.press('Space'); assert.equal((await snap()).loop.boxes, 3);
  await page.reload(); await page.locator('[data-ready=true]').waitFor(); await moveTo(-.7, .7);
  assert.equal(await page.locator('#action-button').isDisabled(), true); assert.equal((await snap()).loop.purchases, 3);
  await moveTo(0, 2.4); await press('go-home'); await press('open-box'); await sleep(2800); await press('collection');
  await page.locator('#back-cleanup').tap(); await sleep(150);
  assert.equal((await snap()).loop.boxes, 2); await page.locator('#collection-button').tap(); assert.equal(await page.locator('#open-next').isVisible(), true);
  console.log('PASS three-box trip cap survives refresh; remaining paid boxes are reachable after returning to cleanup');
  assert.deepEqual(errors, []); console.log('PASS no browser console errors or failed requests');
} finally { await browser.close(); }


