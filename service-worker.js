// service-worker.js
const CACHE_NAME = 'character-trainer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/db.js',
  '/style.js',
  '/manifest.json',
  '/characters.json',
  '/icon-512.png',    // make sure this file exists
  '/icon-192.png',    // make sure this file exists
  '/favicon.webp'     // make sure this file exists
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If a cached response is found, return it.
        if (response) {
          return response;
        }
        // Otherwise, attempt a network fetch.
        return fetch(event.request).catch(() => {
          // If the request is for navigation, return the cached index.html.
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
