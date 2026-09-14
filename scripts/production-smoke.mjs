import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto(process.env.TEST_URL || 'http://localhost:4173');
  await page.locator('[data-ready=true]').waitFor(); await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => typeof window.__roomTest), 'undefined');
  assert.equal(await page.locator('#action-button').isDisabled(), true);
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(400); await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(60);
  assert.equal(await page.locator('#action-button').getAttribute('data-target'), 'pickup-teddy');
  await page.locator('#action-button').tap(); await page.waitForTimeout(100);
  assert.equal(await page.locator('.cleanup-marker.destination').textContent(), '🧸 Toy chest');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1320); await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#action-button').getAttribute('data-target'), 'toy-chest');
  await page.locator('#action-button').tap(); await page.waitForTimeout(100);
  assert.equal(await page.locator('#allowance').textContent(), '$1');
  await page.screenshot({ path: 'artifacts/stage2/production-reward.png' });
  for (const [width, height, name] of [[320, 568, 'small-phone'], [390, 844, 'portrait']]) {
    await page.setViewportSize({ width, height }); await page.reload();
    await page.locator('[data-ready=true]').waitFor(); await page.waitForTimeout(200);
    await page.screenshot({ path: `artifacts/stage2/final-${name}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('PASS production scene, no debug API, Action gating, pickup, destination, placement, reward, phone resize, no errors');
} finally { await browser.close(); }
