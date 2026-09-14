import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto(process.env.TEST_URL || 'http://localhost:4173');
  await page.locator('[data-ready=true]').waitFor();
  assert.equal(await page.evaluate(() => typeof window.__roomTest), 'undefined');
  // A saved sealed-box fixture tests shipped reveal assets/UI separately from the full earned-money test.
  await page.evaluate(() => localStorage.setItem('arianna.progress.v1', JSON.stringify({ version: 1, balance: 3, collection: {}, boxes: [{ id: 'production-fixture', dumplingId: 'blueberry' }], creditedRounds: [], trip: { active: false, purchases: 0 }, location: 'home', reveal: null })));
  await page.reload(); await page.locator('[data-ready=true]').waitFor();
  await page.locator('#action-button[data-target=open-box]').tap(); await page.waitForTimeout(2800);
  assert.equal(await page.locator('#reveal-copy h2').textContent(), 'Blueberry');
  assert.match(await page.locator('#reveal-copy small').textContent(), /Rare/);
  await page.locator('#action-button[data-target=collection]').tap();
  assert.equal(await page.locator('.dumpling-card.owned').count(), 1);
  await page.reload(); await page.locator('#collection-dialog[open]').waitFor();
  assert.match(await page.locator('#collection-summary').textContent(), /Wallet \$3/);
  await page.locator('#back-cleanup').tap();
  assert.equal(await page.locator('#mission-clock').textContent(), '1:00');
  assert.equal(await page.locator('#wallet').textContent(), '$3');
  assert.deepEqual(errors, []);
  console.log('PASS production reveal, rarity, collection, persistence and cleanup return; no debug API or browser errors');
} finally { await browser.close(); }
