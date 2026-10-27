const CACHE_NAME = 'lifepilot-v3';
const OFFLINE_URL = '/offline.html';

// Static core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/lifepilot-icon.png',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/lifepilot-icon.png',
];

// Install: Cache core assets and immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache generations and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Safe caching for static frontend assets only
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Only process GET requests (POST, PUT, DELETE pass directly to network)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Only handle HTTP/HTTPS protocols (ignore chrome-extension:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. SECURITY & PRIVACY: NEVER cache API calls or Gemini planning requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 4. In development mode, ignore Vite internals and HMR endpoints
  if (
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // 5. HTML Page Navigation (Network-First with offline.html fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 6. Static Assets (JS, CSS, images, fonts)
  // Cache-First with background revalidation for same-origin and Google Fonts
  if (
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {
              // Ignore background update errors when offline
            });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
  }
});

