/* Site Measure Studio: isolated offline shell. Never cache project data. */
const VERSION = 'site-measure-offline-v1';
const SHELL = '/tools/site-measure';
const REQUIRED = [
  '/site-measure.webmanifest',
  '/pwa-192.png',
  '/pwa-512.png',
  '/fonts/site-measure/NotoSansTC-Regular.ttf'
];

function isAppShell(url) {
  return url.pathname === SHELL || url.pathname === SHELL + '/';
}
function isAppAsset(url) {
  return url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/fonts/site-measure/') ||
      REQUIRED.includes(url.pathname));
}
async function cacheResponse(cache, url) {
  const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
  if (!response.ok || response.type === 'opaque') throw new Error('Offline asset failed: ' + url);
  await cache.put(url, response.clone());
  return response;
}
async function installShell() {
  const cache = await caches.open(VERSION);
  const html = await cacheResponse(cache, SHELL);
  const markup = await html.text();
  const refs = new Set(REQUIRED);
  for (const tag of markup.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const attr = tag[0].match(/\b(?:src|href)=["']([^"']+)["']/i);
    if (!attr) continue;
    const url = new URL(attr[1], self.location.origin);
    if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
      refs.add(url.pathname + url.search);
    }
  }
  // Fail installation rather than claim offline support with missing application chunks.
  const assets = [...refs];
  for (let i = 0; i < assets.length; i += 6) {
    await Promise.all(assets.slice(i, i + 6).map(url => cacheResponse(cache, url)));
  }
}
self.addEventListener('install', event => {
  event.waitUntil(installShell().then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('site-measure-offline-') && n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
async function appPage(request) {
  const cache = await caches.open(VERSION);
  // A weak mobile hotspot must not leave the field app waiting indefinitely.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (!response.ok) throw new Error('Network navigation unavailable');
    if (response.headers.get('content-type')?.includes('text/html')) {
      await cache.put(SHELL, response.clone());
    }
    return response;
  } catch {
    return await cache.match(SHELL) || Response.error();
  } finally {
    clearTimeout(timer);
  }
}
async function appAsset(request) {
  const cache = await caches.open(VERSION);
  const match = await cache.match(request);
  if (match) return match;
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') {
    await cache.put(request, response.clone());
  }
  return response;
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && isAppShell(url)) {
    event.respondWith(appPage(request));
  } else if (isAppAsset(url)) {
    event.respondWith(appAsset(request));
  }
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'SITE_MEASURE_STATUS' || !event.ports?.[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const shell = await cache.match(SHELL);
    const font = await cache.match(REQUIRED[3]);
    port.postMessage({ ready: !!shell && !!font });
  })());
});
