self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// Simple network-first for HTML, cache-first for assets
const ASSET_CACHE = 'assets-v1';
const isAsset = (url) => /\.(css|js|woff2?|ttf|png|svg|jpg|jpeg|gif|webp|avif)$/.test(url);

self.addEventListener('fetch', (event) => {
	const req = event.request;
	const url = new URL(req.url);
	if (req.method !== 'GET' || url.origin !== location.origin) return;

	if (isAsset(url.pathname)) {
		event.respondWith(
			caches.open(ASSET_CACHE).then(async (cache) => {
				const cached = await cache.match(req);
				if (cached) return cached;
				const res = await fetch(req);
				if (res.ok) cache.put(req, res.clone());
				return res;
			})
		);
		return;
	}

	// HTML/doc requests: network-first with fallback
	event.respondWith(
		fetch(req).catch(() => caches.match('/'))
	);
});

