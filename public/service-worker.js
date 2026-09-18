self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache or rewrite requests; the app uses immutable Vite asset hashes.
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
