const CACHE='family-tree-v6-recovery';
const CORE=[
  './',
  './index.html',
  './family-v2.css?v=6',
  './stability-fixes.css?v=4',
  './family-v3.css?v=2',
  './family-v4.css?v=2',
  './family-v5.css?v=2',
  './data.js?v=6',
  './corrections.js?v=6',
  './final-fixes.js?v=6',
  './backend-config.js?v=2',
  './backend-preload.js?v=2',
  './family-v2.js?v=6',
  './stability-fixes.js?v=4',
  './family-platform-stable.js?v=2',
  './family-v4.js?v=2',
  './family-v5.js?v=2',
  './manifest.webmanifest',
  './family-tree-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;

      // Only page navigations may fall back to index.html.
      // Never return HTML for a missing JS/CSS/image request.
      if (request.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
