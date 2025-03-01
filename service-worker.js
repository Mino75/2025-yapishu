// service-worker.js

// Generate a unique cache name based on the current timestamp.
const CACHE_VERSION = new Date().getTime();
const CACHE_NAME = `character-trainer-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/db.js',
  '/style.js',
  '/manifest.json',
  '/japanese-jlpt.json',          // New JSON file for Japanese
  '/mandarin-simplified-hsk.json', // New JSON file for Chinese Simplified
  '/icon-512.png',
  '/icon-192.png',
  '/favicon.webp'
];

self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Delete all caches that aren't the current one.
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Claim clients immediately so that the new service worker controls them.
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found.
        if (response) {
          return response;
        }
        // Otherwise, try fetching from the network.
        return fetch(event.request).catch(() => {
          // If the request is a navigation request and the network fails,
          // return the cached index.html.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
