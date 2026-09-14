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

function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
async function cleanupRound(play) {
  const { moveTo, press, page } = play;
  await moveTo(-.55, 1.25); await press('pickup-teddy'); await moveTo(-.3, .4); await moveTo(1.75, -.3); await press('toy-chest');
  await moveTo(0, .4); await moveTo(-1.45, .55); await press('pickup-shirt'); await moveTo(-1.7, .8); await press('hamper');
  await moveTo(-.25, .4); await moveTo(.15, -.55); await press('pickup-book'); await moveTo(.35, -1.45); await moveTo(1, -1.8); await press('bookshelf');
  await moveTo(1, .7); await press('crayons'); await sleep(550);
  await moveTo(.3, 2.25); await press('pickup-vacuum'); await moveTo(-.65, 2.6); await press('dirt', 1320);
  await page.locator('#results[open]').waitFor();
}
try {
  const play = await createPlayer('collection loop'); const { page, snap, moveTo, press, screenshot } = play;
  await sleep(400); const camera = (await snap()).cameraPosition;
  await cleanupRound(play);
  assert.equal((await snap()).loop.balance, 7); assert.equal((await snap()).cleanup.allowance, 7);
  await screenshot('01-earned-wallet'); pass('Complete five-task touch cleanup credits $7 to persistent wallet');
  await page.locator('#go-shopping').tap(); await sleep(200);
  assert.equal((await snap()).loop.mode, 'store');
  await screenshot('02-store-entrance');
  await moveTo(-.7, .7); await screenshot('03-display'); await press('buy-box');
  assert.equal((await snap()).loop.balance, 3); assert.equal((await snap()).loop.boxes, 1);
  await sleep(100); assert.equal(await page.locator('#action-button').isDisabled(), true);
  pass('Store joystick reaches display; Action buys a sealed $4 box and blocks insufficient funds');
  await page.reload(); await page.locator('[data-ready=true]').waitFor(); await sleep(150);
  assert.equal((await snap()).loop.mode, 'store'); assert.equal((await snap()).loop.balance, 3); assert.equal((await snap()).loop.boxes, 1); assert.equal((await snap()).loop.purchases, 1);
  pass('Store refresh preserves wallet, sealed box and trip purchase count');
  await press('go-home'); await sleep(200); await screenshot('04-sealed-at-home');
  assert.equal((await snap()).loop.mode, 'home'); await press('open-box');
  await sleep(750); await screenshot('05-opening');
  await sleep(1900); assert.equal((await snap()).loop.phase, 'revealed');
  const first = (await snap()).loop.reveal;
  assert.ok(first.dumplingId); assert.equal((await snap()).loop.collection[first.dumplingId], 1);
  await screenshot('06-revealed');
  await page.reload(); await page.locator('[data-ready=true]').waitFor(); await sleep(150);
  assert.deepEqual((await snap()).loop.reveal, first); assert.equal((await snap()).loop.collection[first.dumplingId], 1);
  pass('Short shake/lid/reveal sequence commits one friend, and refresh cannot duplicate or reroll it');
  await press('collection'); await page.locator('#collection-dialog[open]').waitFor();
  assert.equal(await page.locator('.dumpling-card').count(), 8); assert.equal(await page.locator('.dumpling-card.owned').count(), 1);
  await screenshot('07-collection');
  await page.reload(); await page.locator('#collection-dialog[open]').waitFor();
  assert.equal((await snap()).loop.balance, 3); assert.equal((await snap()).loop.collection[first.dumplingId], 1);
  pass('Collection shows eight entries, locked silhouettes and owned counts; refresh restores collection and wallet');
  await page.locator('#back-cleanup').tap(); await sleep(150);
  assert.equal((await snap()).cleanup.state, 'ready'); assert.equal((await snap()).cleanup.remaining, 60000);
  assert.deepEqual((await snap()).cameraPosition, camera);
  await cleanupRound(play); assert.equal((await snap()).loop.balance, 10);
  await page.locator('#go-shopping').tap(); await moveTo(-.7, .7); await press('buy-box'); await press('buy-box');
  assert.equal((await snap()).loop.balance, 2); assert.equal((await snap()).loop.boxes, 2);
  await moveTo(0, 2.4); await press('go-home'); await press('open-box'); await sleep(2800); await press('collection');
  await page.locator('#open-next').tap(); await press('open-box'); await sleep(2800); await press('collection');
  const final = (await snap()).loop;
  assert.equal(Object.values(final.collection).reduce((a, b) => a + b, 0), 3);
  assert.equal(final.boxes, 0); assert.equal(final.balance, 2);
  await screenshot('08-repeated-loop');
  pass('Second full cleanup loop earns another $7, buys two boxes, opens both, and preserves three collected friends');
  await page.setViewportSize({ width: 360, height: 640 }); await screenshot('09-small-portrait-collection');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false); await page.locator('#back-cleanup').tap(); await sleep(200); await screenshot('10-small-portrait-cleanup');
  pass('360×640 portrait collection and return-to-cleanup fit without horizontal overflow');
  assert.deepEqual(errors, []); pass('No browser exceptions, console warnings/errors or failed requests');
  await writeFile('artifacts/stage3/report.json', JSON.stringify({ checks, errors, final }, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }

