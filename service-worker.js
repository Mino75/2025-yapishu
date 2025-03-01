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
  self.skipWaiting(); // Force the new SW to skip waiting.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // After taking control, notify clients to reload.
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ action: 'reload' }));
      });
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
        // Otherwise, attempt a network fetch.
        return fetch(event.request).catch(() => {
          // If the request is for navigation and network fails, return cached index.html.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
