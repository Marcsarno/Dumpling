import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.TEST_URL || 'http://localhost:5173'); await page.locator('[data-ready=true]').waitFor();
  await page.locator('#mission-practice').focus(); await page.keyboard.press('Space');
  await page.waitForTimeout(100); assert.equal(await page.locator('#mission-clock').textContent(), '∞');
  await page.locator('#game-canvas').focus(); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(180); await page.keyboard.up('ArrowRight');
  await page.locator('#collection-button').focus(); await page.keyboard.press('Space'); await page.locator('#collection-dialog[open]').waitFor();
  await page.locator('#back-cleanup').focus(); await page.keyboard.press('Space'); await page.waitForTimeout(100);
  assert.equal(await page.locator('#collection-dialog').evaluate(e => e.open), false);
  await page.locator('#mission-house').focus(); await page.keyboard.press('Space'); await page.waitForTimeout(100);
  assert.equal(await page.locator('#mission-clock').textContent(), '1:00'); assert.equal(await page.locator('#task-count').textContent(), '0 / 6');
  assert.deepEqual(errors, []);
  console.log('PASS Explore can open collection after movement; Space activates focused menus without triggering world actions');
} finally { await browser.close(); }
