// === Service Worker for Flappy Kiro PWA ===

const CACHE_NAME = 'flappy-kiro-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/ghosty.png',
  './assets/jump.wav',
  './assets/game_over.wav'
];

// Pattern to detect leaderboard/firebase requests
const LEADERBOARD_API_PATTERN = /firebase|firebaseio\.com|leaderboard/i;

// === Install Event: Cache static assets ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((error) => {
        // If caching fails, reject the promise so the SW doesn't activate
        // It will reattempt on the next page load
        console.error('Service Worker install failed:', error);
        throw error;
      })
  );
});

// === Activate Event: Clean old caches ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// === Fetch Event: Cache-first for static, network-first for leaderboard ===
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Network-first strategy for leaderboard/firebase requests
  if (LEADERBOARD_API_PATTERN.test(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the successful response for offline fallback
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network unavailable: serve cached response or error
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cached response available, return error JSON
            return new Response(
              JSON.stringify({ error: 'Leaderboard unavailable offline' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        // Optionally cache new static resources
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
