const CACHE_NAME = 'grafana-cache-v1';
const GRAFANA_URLS = [
  'https://unpkg.com/@grafana/faro-web-sdk@2/dist/bundle/faro-web-sdk.iife.js',
  'https://unpkg.com/@grafana/faro-web-tracing@2/dist/bundle/faro-web-tracing.iife.js',
];

// Install event: pre-cache Grafana scripts on first install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't block installation if caching fails (network might be offline)
      return Promise.allSettled(
        GRAFANA_URLS.map((url) => cache.add(url).catch(() => {
          console.warn(`Failed to cache ${url}`);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only intercept Grafana CDN requests
  if (event.request.url.includes('unpkg.com/@grafana')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        // Otherwise, fetch from network and cache it
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          // If network fails and not in cache, return error
          console.warn(`Failed to fetch ${event.request.url}`);
          throw new Error('Network request failed and cache unavailable');
        });
      })
    );
  }
});
