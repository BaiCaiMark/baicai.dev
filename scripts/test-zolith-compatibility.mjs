// Development-only checks. Supply Playwright through NODE_PATH; no site dependency.
// node scripts/test-zolith-compatibility.mjs baseline|local|preview|production URL OUTPUT_DIR
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const runtimeRequire = createRequire(import.meta.url);
const { chromium } = runtimeRequire('playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const [stage, base, output] = process.argv.slice(2);
assert(stage && base && output);
fs.mkdirSync(output, { recursive: true });
const original = fs.readFileSync(path.join(directory, '../public/zolith-test.html'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const results = { stage, base, expectedSha256: hash(original), browsers: [] };
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const state = page => page.evaluate(() => {
  const m = new DOMMatrix(getComputedStyle(document.getElementById('assembly')).transform);
  return { x: m.e, y: m.f, scale: m.a, zoom: document.getElementById('zoom').value };
});
async function homeSnapshot(page) {
  return page.evaluate(() => ({
    text: document.body.innerText,
    nav: [...document.querySelectorAll('nav a')].map(a => ({ text: a.textContent, href: a.getAttribute('href') })),
    images: [...document.images].map(i => ({ alt: i.alt, loaded: i.complete && i.naturalWidth > 0 })),
  }));
}
(async () => {
  for (const channel of stage === 'baseline' ? ['chrome'] : ['chrome', 'msedge']) {
    const browser = await chromium.launch({ channel, headless: true });
    const record = { channel, version: browser.version(), errors: [], failures: [], checks: [] };
    results.browsers.push(record);
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      if (process.env.ZOLITH_ACCESS_FILE) {
        // Optional short-lived Vercel share URL; never log it or browser cookies.
        const { url } = JSON.parse(fs.readFileSync(process.env.ZOLITH_ACCESS_FILE, 'utf8'));
        const auth = await context.newPage();
        await auth.goto(url, { waitUntil: 'load' });
        await auth.close();
      }
      const page = await context.newPage();
      page.on('pageerror', e => record.errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') record.errors.push(m.text()); });
      page.on('requestfailed', r => record.failures.push({ url: r.url().split('?')[0], error: r.failure()?.errorText }));
      page.on('response', r => { if (r.status() >= 400) record.failures.push({ url: r.url().split('?')[0], status: r.status() }); });
      let response = await page.goto(new URL('/', base).href);
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => { for (const image of document.images) image.loading = 'eager'; });
      await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      record.home = await homeSnapshot(page);
      assert(record.home.text.includes('Think clearly.') && record.home.text.includes('Build useful things.'));
      assert(record.home.images.every(i => i.loaded));
      await page.screenshot({ path: path.join(output, `${stage}-${channel}-home.png`), fullPage: true });
      if (stage !== 'baseline') {
        const baseline = JSON.parse(fs.readFileSync(path.join(output, 'baseline.json'), 'utf8')).browsers[0].home;
        assert.equal(record.home.text, baseline.text, 'Homepage visible content unchanged');
        assert.deepEqual(record.home.nav, baseline.nav, 'Navigation unchanged');
      }
      record.checks.push('Homepage HTTP 200, visible content/navigation match baseline, images loaded');
      if (stage === 'baseline') {
        assert.deepEqual(record.errors, []);
        assert.deepEqual(record.failures, []);
        record.status = 'PASS';
        continue;
      }

      response = await page.goto(new URL('/zolith-test', base).href);
      assert.equal(response.status(), 200);
      assert(response.headers()['content-type'].includes('text/html'));
      assert(response.headers()['x-robots-tag'].includes('noindex'));
      assert(response.headers()['cache-control'].includes('no-transform'));
      record.servedSha256 = hash(await response.body());
      assert.equal(record.servedSha256, hash(original), 'HTTPS/HTTP bytes equal offline original');
      await page.locator('#controls').waitFor({ state: 'visible' });
      await settle(page);
      assert.equal(await page.title(), 'Compatibility Test · Zolith Review');
      assert.equal(await page.locator('#project-name').innerText(), 'Compatibility Test');
      assert((await page.locator('.notes').innerText()).includes('Sample Marble'));
      assert(await page.evaluate(() => [...document.images].length === 2 && [...document.images].every(i => i.complete && i.naturalWidth > 0)));
      assert.equal(await page.locator('nav').count(), 0, 'No site navigation/layout injected');
      record.checks.push('Test route HTTP 200, HTML MIME, noindex, byte-identical standalone content, logo/stone/information visible');
      await page.screenshot({ path: path.join(output, `${stage}-${channel}-viewer.png`), fullPage: true });
      const fit = await state(page);
      await page.locator('#zoom-in').click(); await settle(page);
      assert((await state(page)).scale > fit.scale);
      await page.locator('#zoom-out').click(); await settle(page);
      assert(Math.abs((await state(page)).scale - fit.scale) < .00001);
      const box = await page.locator('#viewer').boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      for (let n = 0; n < 3; n++) await page.mouse.wheel(0, -500);
      await settle(page);
      const before = await state(page);
      assert(before.scale > fit.scale * 3);
      await page.mouse.down(); await page.mouse.move(x - 70, y - 40, { steps: 10 }); await page.mouse.up();
      await settle(page);
      const after = await state(page);
      assert(Math.abs(after.x - before.x + 70) < 1 && Math.abs(after.y - before.y + 40) < 1);
      await page.locator('#fit').click(); await settle(page);
      assert.equal((await state(page)).zoom, '100%');
      assert(Math.abs((await state(page)).scale - fit.scale) < .00001);
      record.checks.push('Zoom +/- and mouse wheel, mouse drag pan, Fit reset');
      for (const [w, h] of [[390, 844], [844, 390], [768, 1024]]) {
        await page.setViewportSize({ width: w, height: h }); await settle(page);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert(await page.evaluate(() => {
          const b = document.getElementById('assembly').getBoundingClientRect();
          return Math.abs(b.width / b.height - 2400 / 1680) < .001;
        }));
      }
      record.checks.push('Phone portrait/landscape and tablet viewport emulation: no horizontal overflow, fixed image aspect');
      // Actual Chromium touch input injection; this remains desktop emulation.
      await page.setViewportSize({ width: 390, height: 844 }); await settle(page);
      await page.locator('#viewer').scrollIntoViewIfNeeded();
      const touchBox = await page.locator('#viewer').boundingBox();
      const tx = touchBox.x + touchBox.width / 2, ty = touchBox.y + touchBox.height / 2;
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type,
        touchPoints: points.map(([x, y, id]) => ({ x, y, id })) });
      await touch('touchStart', [[tx - 30, ty, 1], [tx + 30, ty, 2]]);
      await touch('touchMove', [[tx - 100, ty, 1], [tx + 100, ty, 2]]);
      await touch('touchEnd', []); await settle(page);
      assert(parseInt((await state(page)).zoom) > 300);
      const touchBefore = await state(page);
      await touch('touchStart', [[tx, ty, 3]]);
      await touch('touchMove', [[tx - 30, ty - 20, 3]]);
      await touch('touchEnd', []); await settle(page);
      assert(Math.abs((await state(page)).x - touchBefore.x + 30) < 2);
      record.checks.push('Desktop Chromium touch emulation: pinch zoom and one-finger pan');
      await context.close();
      const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      // Static fallback is independently checked on the public production URL/local server.
      if (!process.env.ZOLITH_ACCESS_FILE) {
        const staticPage = await staticContext.newPage();
        const staticResponse = await staticPage.goto(new URL('/zolith-test', base).href);
        assert.equal(staticResponse.status(), 200);
        assert(await staticPage.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)));
        assert(await staticPage.locator('#controls').isHidden());
        assert((await staticPage.locator('.notes').innerText()).includes('Sample Marble'));
        record.checks.push('JavaScript-disabled static image + information remain visible');
      }
      await staticContext.close();
      assert.deepEqual(record.errors, []);
      assert.deepEqual(record.failures, []);
      record.checks.push('Zero browser JavaScript/console errors and zero failed/missing resources');
      record.status = 'PASS';
    } catch (error) {
      record.status = 'FAIL'; record.failure = error.stack; throw error;
    } finally {
      await browser.close();
      fs.writeFileSync(path.join(output, `${stage}.json`), JSON.stringify(results, null, 2));
    }
  }
  console.log(JSON.stringify(results.browsers.map(({ channel, version, status, checks }) => ({ channel, version, status, checks })), null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
