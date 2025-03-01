// service-worker.js

// Generate a unique cache name based on the current timestamp
const CACHE_VERSION = new Date().getTime();
const CACHE_NAME = `character-trainer-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/db.js',
  '/style.js',
  '/manifest.json',
  '/japanese-jlpt.json',         // New JSON file for Japanese
  '/mandarin-simplified-hsk.json', // New JSON file for Chinese Simplified
  '/icon-512.png',
  '/icon-192.png',
  '/favicon.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event to delete old caches automatically
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
    })
  );
});

// Fetch event: respond from cache if available; otherwise fetch from network.
// If the request is for navigation and network fails, fallback to index.html.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found.
      if (response) {
        return response;
      }
      // Otherwise, try to fetch from network.
      return fetch(event.request).catch(() => {
        // Fallback: if navigation request fails, return cached index.html.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
