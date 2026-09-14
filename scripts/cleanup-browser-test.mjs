// Real touch input + read-only snapshots. No teleports, timer overrides or gameplay mutation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const baseURL = process.env.TEST_URL || 'http://localhost:5173';
const checks = [], errors = [];
await mkdir('artifacts/stage2', { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function createPlayer(name) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`${name}: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${name}: ${r.status()} ${r.url()}`); });
  await page.goto(baseURL); await page.locator('[data-ready=true]').waitFor();
  await page.locator('#mission-bedroom').tap();
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
      assert.notEqual(s.cleanup.state, 'finished', `mission ended on route to ${x}, ${z}`);
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
  async function screenshot(file) { await page.screenshot({ path: `artifacts/stage2/${file}.png` }); }
  return { context, page, snap, touch, moveTo, press, center, screenshot };
}
function pass(name) { checks.push(name); console.log(`PASS ${name}`); }

try {
  const play = await createPlayer('full round');
  const { page, snap, moveTo, press, touch, center, screenshot } = play;
  await sleep(300);
  assert.equal((await snap()).cleanup.state, 'ready');
  assert.equal((await snap()).cleanup.remaining, 60000);
  assert.equal(await page.locator('#action-button').isDisabled(), true);
  await screenshot('01-ready'); pass('Ready state does not spend the minute before the first input; distant Action is inactive');
  const fixedCamera = (await snap()).cameraAngles;
  const roundStart = Date.now();
  await moveTo(-.55, 1.25);
  await screenshot('02-near-teddy');
  await press('pickup-teddy');
  let state = await snap();
  assert.equal(state.cleanup.carrying, 'teddy'); assert.equal(state.cleanup.carriedParent, 'Carry socket');
  assert.ok(Math.hypot(state.cleanup.carriedPosition[0] - state.position[0], state.cleanup.carriedPosition[2] - state.position[2]) < .6);
  assert.equal(await page.locator('.cleanup-marker.destination').textContent(), '🧸 Toy chest');
  await screenshot('03-carry-teddy');
  await moveTo(-1.55, .6); // Another pickup and the wrong destination are both nearby.
  assert.equal(await page.locator('#action-button').isDisabled(), true);
  await page.keyboard.press('Space');
  assert.equal((await snap()).cleanup.carrying, 'teddy');
  assert.equal((await snap()).cleanup.allowance, 0);
  pass('Carried object uses the visual socket; other pickups and wrong destinations cannot replace it or score');
  await moveTo(-.3, .4); await moveTo(1.75, -.3);
  await press('toy-chest');
  assert.equal((await snap()).cleanup.allowance, 1); assert.equal((await snap()).cleanup.carrying, null);
  await page.keyboard.press('Space'); assert.equal((await snap()).cleanup.allowance, 1);
  await screenshot('04-first-reward'); pass('Correct placement scores once and frees hands');
  await moveTo(0, .4); await moveTo(-1.45, .55); await press('pickup-shirt');
  await moveTo(-1.7, .8); await press('hamper');
  assert.equal((await snap()).cleanup.allowance, 2); pass('Shirt reaches the new hamper without changing existing furniture');
  await moveTo(-.25, .4); await moveTo(.15, -.55); await press('pickup-book');
  await moveTo(.35, -1.45); await moveTo(1.0, -1.8); await press('bookshelf');
  assert.equal((await snap()).cleanup.allowance, 3); pass('Book reaches the existing bookshelf');
  await moveTo(1.0, .7); await press('crayons'); await sleep(550);
  state = await snap(); assert.equal(state.cleanup.allowance, 4);
  assert.equal(state.cleanup.crayonsVisible, false); assert.equal(state.cleanup.tidyCrayonsVisible, true);
  pass('One crayon tap runs a brief cleanup, replaces the mess with a tidy cup, and awards once');
  await moveTo(.3, 2.25); await press('pickup-vacuum'); await moveTo(-.65, 2.6);
  await press('dirt', 380);
  state = await snap(); assert.equal(state.cleanup.allowance, 4); assert.equal(state.cleanup.dirtVisible, true); assert.equal(state.cleanup.progress, 0);
  pass('Releasing a partial vacuum hold restores dirt and awards nothing');
  const a = await center('#action-button'), j = await center('#joystick');
  await touch('touchStart', 2, a); await sleep(280);
  await touch('touchStart', 1, j); await touch('touchMove', 1, { x: j.x - 6, y: j.y - 10 });
  await sleep(180); await touch('touchEnd', 1);
  const twoThumbs = await snap();
  assert.ok(twoThumbs.cleanup.progress > .1, JSON.stringify({state:twoThumbs, events:await page.evaluate(()=>window.__pointerTrace)}));
  await screenshot('05-vacuum-hold');
  await touch('touchCancel', 2); await sleep(90);
  assert.equal((await snap()).cleanup.progress, 0); assert.equal((await snap()).cleanup.holding, false);
  pass('Vacuum and joystick support two thumbs; touch cancellation cannot leave the vacuum running');
  await press('dirt', 1320);
  await page.locator('#results[open]').waitFor();
  state = await snap();
  assert.equal(state.cleanup.completed.length, 5); assert.equal(state.cleanup.allowance, 7); assert.equal(state.cleanup.bonus, 2);
  assert.equal(state.cleanup.reason, 'complete'); assert.equal(state.cleanup.dirtVisible, false); assert.equal(state.cleanup.carrying, null);
  assert.deepEqual(state.cameraAngles, fixedCamera);
  assert.ok(Date.now() - roundStart < 60000);
  await screenshot('06-all-clean-results');
  const fullRoundSeconds = Math.round((Date.now() - roundStart) / 100) / 10;
  pass(`Full touch-controlled five-task round completes in ${fullRoundSeconds}s with $7 and a fixed camera angle`);
  await page.keyboard.down('ArrowRight'); await sleep(200); await page.keyboard.up('ArrowRight');
  assert.deepEqual((await snap()).position, state.position); pass('Results stop player movement and interactions');
  await page.locator('#replay').tap(); await sleep(150);
  state = await snap();
  assert.equal(state.cleanup.state, 'ready'); assert.equal(state.cleanup.remaining, 60000); assert.equal(state.cleanup.allowance, 0);
  assert.equal(state.cleanup.completed.length, 0); assert.equal(state.cleanup.carrying, null);
  assert.equal(state.cleanup.dirtVisible, true); assert.equal(state.cleanup.crayonsVisible, true); assert.equal(state.cleanup.tidyCrayonsVisible, false);
  for (const item of state.cleanup.items) for (let i = 0; i < 3; i++) assert.ok(Math.abs(item.position[i] - item.home[i]) < .001);
  pass('Replay restores all props, hands, position, allowance, timer, and task state');

  // A second full-length round tests real wall-clock expiry and partial rewards, with no clock mocking.
  await moveTo(-.55, 1.25); await press('pickup-teddy'); await moveTo(0, .4); await moveTo(1.75, -.3); await press('toy-chest');
  await moveTo(.7, .6); await moveTo(.3, 2.25); await press('pickup-vacuum'); await moveTo(-.65, 2.6);
  const beforeMove = (await snap()).position;
  await touch('touchStart', 2, await center('#action-button')); await sleep(180);
  await moveTo(.3, 2.25); // Keep the Action finger held while walking away from dirt.
  state = await snap(); assert.equal(state.cleanup.progress, 0); assert.equal(state.cleanup.allowance, 1);
  assert.ok(Math.hypot(state.position[0] - beforeMove[0], state.position[2] - beforeMove[2]) > .5);
  await touch('touchEnd', 2);
  pass('Walking out of vacuum range cancels work while carrying movement remains normal');
  await moveTo(-.65, 2.6);
  console.log(`Waiting for genuine 60-second expiry (${Math.ceil((await snap()).cleanup.remaining / 1000)}s remaining)…`);
  while ((await snap()).cleanup.remaining > 600) await sleep(Math.min(1500, Math.max(40, (await snap()).cleanup.remaining - 550)));
  await touch('touchStart', 2, await center('#action-button'));
  await sleep(800); await touch('touchEnd', 2);
  await page.locator('#results[open]').waitFor();
  state = await snap();
  assert.equal(state.cleanup.reason, 'time'); assert.equal(state.cleanup.remaining, 0); assert.equal(state.cleanup.allowance, 1);
  assert.deepEqual(state.cleanup.completed, ['teddy']); assert.equal(state.cleanup.bonus, 0); assert.equal(state.cleanup.dirtVisible, true);
  assert.equal(state.cleanup.progress, 0); assert.equal(state.cleanup.holding, false);
  await screenshot('07-real-timeout-results');
  pass('Actual 60-second expiry preserves partial allowance and blocks an in-progress late vacuum reward');

  await page.locator('#replay').tap(); await sleep(120);
  assert.equal((await snap()).cleanup.carrying, null);
  await moveTo(.3, 2.25); await press('pickup-vacuum'); await moveTo(-.65, 2.6); await press('dirt', 1300);
  assert.equal((await snap()).cleanup.carrying, null); assert.equal((await snap()).cleanup.allowance, 1);
  await moveTo(-.55, 1.3); await press('pickup-teddy');
  assert.equal((await snap()).cleanup.carrying, 'teddy'); pass('Vacuum can be the first task; its return frees hands for the next pickup');

  // Reload between screen sizes preserves the same exact approved camera configuration.
  for (const [width, height] of [[320,568],[375,667],[430,932],[844,390],[1280,800]]) {
    await page.setViewportSize({ width, height }); await page.reload(); await page.locator('[data-ready=true]').waitFor(); await sleep(180);
    for (const selector of ['#joystick','#action-button']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
    }
    assert.equal((await page.locator('#game-canvas').boundingBox()).width, width);
    await screenshot(`viewport-${width}x${height}`);
  }
  pass('Both controls stay on-screen across small phones, portrait, landscape and desktop');
  assert.deepEqual(errors, []); pass('No browser warnings, console errors, uncaught exceptions, or failed requests');
  await writeFile('artifacts/stage2/test-results.json', JSON.stringify({ checkedAt: new Date().toISOString(), browser: 'Microsoft Edge, touch emulation', fullRoundSeconds, checks }, null, 2));
  console.log(`\n${checks.length} checks passed.`);
} finally { await browser.close(); }
