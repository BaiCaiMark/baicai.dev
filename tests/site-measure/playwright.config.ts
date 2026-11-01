import { defineConfig } from '@playwright/test'
import path from 'node:path'
export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: false, workers: 1, timeout: 45_000,
  expect: { timeout: 10_000 }, outputDir: '../../test-results/site-measure',
  reporter: [['list'], ['json', { outputFile: path.resolve('artifacts/site-measure/browser-results.json') }]],
  use: {
    baseURL: process.env.SM_BASE_URL || 'http://127.0.0.1:3012',
    browserName: 'chromium', channel: 'chrome', headless: true,
    viewport: { width: 1280, height: 900 }, hasTouch: true,
    screenshot: 'only-on-failure', trace: 'retain-on-failure', acceptDownloads: true,
  },
})
