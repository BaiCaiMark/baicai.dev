import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.env.BRAND_BASE_URL ?? 'http://127.0.0.1:3333'
const out = path.join(process.cwd(), 'test-results', 'brand-home')
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
let failures = 0
for (const [name, width, height] of [
  ['desktop', 1440, 900],
  ['tablet', 768, 1024],
  ['mobile', 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto(root, { waitUntil: 'networkidle' })
  await page.locator('img[loading="lazy"]').evaluateAll((images) => { for (const image of images) image.loading = 'eager' })
  await page.waitForTimeout(650)
  const result = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent?.replace(/\\s+/g, ' '),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    imgs: [...document.images].filter((x) => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden').map((x) => ({ src: x.getAttribute('src')?.slice(0,100), ok: x.complete && x.naturalWidth > 0 })),
    toolsLink: !!document.querySelector('a[href="/tools"]'),
    palette: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  }))
  const imageFailures = result.imgs.filter((i) => !i.ok)
  if (result.overflow > 0 || imageFailures.length || !result.toolsLink || !result.heading?.includes('Precision')) failures++
  await page.screenshot({ path: path.join(out, `homepage-${name}.png`), fullPage: true })
  console.log(name + ': ' + JSON.stringify({ title: result.title, overflow: result.overflow, imageFailures, toolsLink: result.toolsLink, palette: result.palette, heading: result.heading }))
  await page.close()
}
for (const route of ['/tools', '/tools/site-measure', '/tools/cad-viewer', '/about']) {
  const page = await browser.newPage()
  const response = await page.goto(root + route, { waitUntil: 'domcontentloaded' })
  const status = response?.status() ?? 0
  if (status !== 200) failures++
  console.log(route + ': ' + status)
  await page.close()
}
await browser.close()
if (failures) {
  console.error('Smoke test failures:', failures)
  process.exitCode = 1
} else {
  console.log('Brand + route smoke test passed')
}
