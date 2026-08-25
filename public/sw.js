// SHOPTANTRA service worker - network-first so authentication, cart, checkout and
// live marketplace data always hit the production backend. Static assets fall back
// to the cache only when offline.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Never intercept non-GET requests (API writes must reach the server).
  if (event.request.method !== 'GET') return;

  // Network-first, with a cache fallback for offline resilience.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        try {
          const cacheUrl = event.request.url;
          if (response.ok && new URL(cacheUrl).origin === self.location.origin) {
            caches.open('shoptantra-shell-v1').then((cache) => cache.put(event.request, response.clone()));
          }
        } catch (e) {
          // Caching is best-effort; never block the response.
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});