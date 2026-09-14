// Uses an existing Playwright installation; it is not a game/runtime dependency.
// PLAYWRIGHT_MODULE can point to the absolute file: URL of a bundled index.mjs.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const results = [];
const baseURL = process.env.TEST_URL || 'http://localhost:5173';
await mkdir('artifacts', { recursive: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
const snapshot = () => page.evaluate(() => window.__roomTest.snapshot());
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
async function ready() {
  await page.goto(baseURL);
  await page.locator('[data-ready="true"]').waitFor();
  await page.waitForTimeout(300);
}
async function report(name, fn) { await fn(); results.push(name); console.log(`PASS ${name}`); }

try {
  await report('Portrait boots with approved Arianna and no scroll overflow', async () => {
    await ready();
    await page.waitForFunction(() => window.__roomTest.snapshot().characterLoaded);
    assert.equal((await snapshot()).characterLoaded, true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    await page.screenshot({ path: 'artifacts/portrait-390x844.png' });
  });
  await report('All four keyboard directions follow the screen; following keeps angle and scale fixed', async () => {
    for (const [key, axis, sign] of [['ArrowRight', 0, 1], ['ArrowLeft', 0, -1], ['ArrowUp', 1, -1], ['ArrowDown', 1, 1]]) {
      await ready();
      const before = await snapshot();
      await page.keyboard.down(key);
      await page.waitForTimeout(400);
      await page.keyboard.up(key);
      const after = await snapshot();
      assert.ok((after.playerScreen[axis] - before.playerScreen[axis]) * sign > 3, `${key} moves correctly before camera catches up`);
      assert.ok(Math.abs(after.playerScreen[1 - axis] - before.playerScreen[1 - axis]) < 3, `${key} is aligned to screen`);
      assert.deepEqual(after.cameraAngles, before.cameraAngles); assert.equal(after.cameraHeight, before.cameraHeight);
      assert.ok(distance(after.cameraPosition, before.cameraPosition) > .1);
    }
  });
  await report('Diagonal input is normalized and releasing keys stops movement', async () => {
    await ready();
    await page.keyboard.down('ArrowRight'); await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(150);
    const active = await snapshot();
    assert.ok(Math.abs(Math.hypot(...active.velocity) - 2.25) < 0.025);
    await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(80);
    const stopped = await snapshot();
    await page.waitForTimeout(200);
    assert.ok(distance(stopped.position, (await snapshot()).position) < 0.001);
  });
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  let center;
  async function touchStart() {
    const box = await page.locator('#joystick').boundingBox();
    center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await touch('touchStart', [{ ...center, id: 1 }]);
  }
  await report('Actual touch drag moves, clamps outside the joystick, and releases cleanly', async () => {
    await ready();
    const before = await snapshot();
    await touchStart();
    await touch('touchMove', [{ x: center.x + 115, y: center.y, id: 1 }]);
    await page.waitForTimeout(350);
    const during = await snapshot();
    assert.ok(during.playerScreen[0] > before.playerScreen[0] + 3);
    assert.ok(Math.hypot(...during.joystick) <= 1.001);
    await touch('touchEnd', []);
    await page.waitForTimeout(80);
    const after = await snapshot();
    assert.deepEqual(after.joystick, [0, 0]);
    await page.waitForTimeout(150);
    assert.ok(distance(after.position, (await snapshot()).position) < 0.001);
  });
  await report('Touch cancellation and a second finger cannot leave movement stuck', async () => {
    await ready(); await touchStart();
    const primary = { x: center.x + 30, y: center.y, id: 1 };
    await touch('touchMove', [primary]);
    await touch('touchStart', [primary, { x: 300, y: 700, id: 2 }]);
    await page.waitForTimeout(80);
    assert.ok((await snapshot()).joystick[0] > 0.6);
    await touch('touchCancel', []);
    await page.waitForTimeout(80);
    assert.deepEqual((await snapshot()).joystick, [0, 0]);
    await touchStart();
    await touch('touchMove', [{ x: center.x, y: center.y - 30, id: 1 }]);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(80);
    assert.deepEqual((await snapshot()).joystick, [0, 0]);
    await touch('touchEnd', []);
  });
  await report('Furniture and room edges block sustained movement', async () => {
    await ready();
    for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']) {
      await page.keyboard.down(key);
      for (let i = 0; i < 12; i++) {
        await page.waitForTimeout(180);
        const state = await snapshot();
        const [x, , z] = state.position;
        assert.ok(Math.abs(x) <= 3.061 && Math.abs(z) <= 3.361, 'player stays inside room');
        for (const box of state.obstacles) {
          assert.ok(!(Math.abs(x - box.center[0]) < box.halfExtents[0] + 0.239 && Math.abs(z - box.center[2]) < box.halfExtents[2] + 0.239), 'player does not penetrate furniture');
        }
      }
      await page.keyboard.up(key);
    }
  });
  await report('Resize during a drag resets input; small phones and landscape render', async () => {
    await ready(); await touchStart();
    await touch('touchMove', [{ x: center.x + 30, y: center.y, id: 1 }]);
    for (const [width, height] of [[375, 667], [320, 568], [430, 932], [844, 390], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(220);
      assert.deepEqual((await snapshot()).joystick, [0, 0]);
      const box = await page.locator('#joystick').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      const canvas = await page.locator('#game-canvas').boundingBox();
      assert.equal(canvas.width, width, 'canvas follows viewport width after rotation');
      assert.equal(canvas.height, height, 'canvas follows viewport height after rotation');
      await page.screenshot({ path: `artifacts/viewport-${width}x${height}.png` });
    }
    await touch('touchEnd', []);
  });
  await report('Mouse drag can leave the joystick and still release', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready();
    const box = await page.locator('#joystick').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + box.height / 2);
    await page.waitForTimeout(100);
    assert.ok((await snapshot()).joystick[0] > 0.9);
    await page.mouse.up();
    await page.waitForTimeout(80);
    assert.deepEqual((await snapshot()).joystick, [0, 0]);
  });
  assert.deepEqual(errors, [], 'No browser console warnings/errors or page errors');
  results.push('No browser console warnings/errors or page errors');

  await report('Approved GLB uses engine Idle/Walk transitions without controller changes', async () => {
    await ready();
    await page.waitForFunction(() => window.__roomTest.snapshot().characterLoaded);
    await page.waitForTimeout(100);
    assert.equal((await snapshot()).animationState, 'Idle');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(150);
    assert.equal((await snapshot()).animationState, 'Walk');
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);
    assert.equal((await snapshot()).animationState, 'Idle');
    assert.deepEqual(errors, []);
  });
  await report('A broken GLB preserves a playable capsule', async () => {
    await page.route('**/arianna.glb', route => route.fulfill({body:'invalid glb',contentType:'model/gltf-binary'}));
    await ready();
    assert.equal((await snapshot()).characterLoaded, false);
    const before = await snapshot();
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(150); await page.keyboard.up('ArrowDown');
    assert.ok(distance(before.position, (await snapshot()).position) > 0.1);
    assert.ok(errors.some(error => error.includes('Keeping the Arianna placeholder')));
  });
  await writeFile('artifacts/test-results.json', JSON.stringify({ browser:'Microsoft Edge / Chromium, emulated touch', date:new Date().toISOString(), passed:results }, null, 2));
  console.log(`\n${results.length} checks passed. Screenshots and report are in artifacts/.`);
} finally { await browser.close(); }
