import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const samples = [];
try {
  for (const [name, url] of [['approved-stage3', 'http://127.0.0.1:5175'], ['stage4-house', 'http://localhost:5173']]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(url); await page.locator('[data-ready=true]').waitFor(); await page.waitForTimeout(1500);
    const values = [];
    for (let i = 0; i < 6; i++) { values.push(await page.evaluate(() => window.__roomTest.snapshot())); await page.waitForTimeout(200); }
    samples.push({ name, viewport: [390, 844], resolution: values[0].resolution, drawCalls: values.map(s => s.drawCalls), fps: values.map(s => s.fps) });
    await page.close();
  }
  console.log(JSON.stringify(samples, null, 2)); await writeFile('artifacts/stage4/performance-comparison.json', JSON.stringify(samples, null, 2));
} finally { await browser.close(); }
