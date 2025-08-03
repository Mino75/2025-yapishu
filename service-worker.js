// service-worker.js

/**
 *  CACHE STRATEGY REQUIREMENTS
 * ===================================
 * 
 * GOAL: "Get once, always work, update if possible"
 * 
 * CONTEXT: Adapt to Network conditions 
 * - Very slow network connections in some areas
 * - Network can cut at any moment during fetch
 * - Users need reliable offline experience
 * - This is a microservice - all cached  declaredfiles are critical
 * 
 * STRATEGY: Adaptive Network-First with Smart Timeouts
 * 
 * 1. FIRST FETCH (New User / No Cache)
 *    - HIGH TIMEOUT (20-30 seconds)
 *    - Purpose: Ensure we get a complete working version cached
 *    - Behavior: Wait longer to accommodate slow networks
 *    - Fallback: If timeout/failure, show error (no cache available)
 * 
 * 2. SUBSEQUENT FETCHES (Returning User / Has Cache)
 *    - SHORT TIMEOUT (3-5 seconds)
 *    - Purpose: Don't block user experience while trying to update
 *    - Behavior: Quick network attempt, fast fallback to cache
 *    - Fallback: Serve cached version immediately on timeout/failure
 * 
 * 3. NETWORK FAILURE HANDLING
 *    - Any network timeout or connection cut -> serve from cache
 *    - Cache always serves the last working version
 *    - No partial updates - either complete success or use cache
 * 
 * 4. CRITICAL FILES POLICY
 *    - ALL manifest files are critical (no optional resources)
 *    - Failed fetch on any critical file = fallback to cached version
 *    - Never serve a mix of new/old files (consistency requirement)
 * 
 * 5. CACHE MANAGEMENT
 *    - Complete atomic updates only (all files or none)
 *    - Old cache versions must be cleaned up properly
 *    - Cache corruption protection (verify all files present)
 * 
 * 6. USER EXPERIENCE PRIORITIES
 *    - Reliability > Speed (app must always work)
 *    - Offline capability is essential
 *    - Background updates when possible, no blocking
 *    - Clear feedback when updates are available
 * 
 * IMPLEMENTATION NOTES:
 * - Detect first-time vs returning users by cache presence
 * - Use different timeout strategies to adapt to worst and best conditions (what can do more can do less)
 * - Implement proper service worker lifecycle management
 * - Ensure cache consistency and cleanup
 * - Handle challenging network conditions gracefully
 */
// CONFIGURABLE PARAMETERS - Override with environment variables
const CONFIG = {
  CACHE_NAME: self.SW_CACHE_NAME || 'yapishu-v2',
  TEMP_CACHE_NAME: self.SW_TEMP_CACHE_NAME || 'yapishu-temp-v2',
  FIRST_TIME_TIMEOUT: parseInt(self.SW_FIRST_TIME_TIMEOUT) || 30000, // 30 seconds
  RETURNING_USER_TIMEOUT: parseInt(self.SW_RETURNING_USER_TIMEOUT) || 5000, // 5 seconds
  ENABLE_LOGS: self.SW_ENABLE_LOGS !== 'false' // true by default, false if set to 'false'
};

// Extract app name from current cache name dynamically
function getAppPrefix(cacheName) {
  // Extract everything before the first hyphen
  // 'sakafokana-v2' → 'sakafokana'
  // 'dia-v1' → 'dia'
  // 'faritany-temp-v3' → 'faritany'
  return cacheName.split('-')[0];
}

const LIVE_CACHE = CONFIG.CACHE_NAME;
const TEMP_CACHE = CONFIG.TEMP_CACHE_NAME;

const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/db.js',
  '/style.js',
  '/manifest.json',
  '/japanese-jlpt.json',          // New JSON file for Japanese
  '/mandarin-simplified-hsk.json', // New JSON file for Chinese Simplified
  '/russian-torfl.json', // New JSON file for Chinese Simplified
  '/icon-512.png',
  '/icon-192.png',
  '/favicon.webp'
];

// Install: Download all assets into a temporary cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(TEMP_CACHE).then(tempCache => {
      // Fetch and cache every asset.
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch ${url}`);
            }
            return tempCache.put(url, response.clone());
          });
        })
      );
    })
  );
});

// Activate: If staging is complete, replace the live cache.
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const tempCache = await caches.open(TEMP_CACHE);
      const cachedRequests = await tempCache.keys();
      if (cachedRequests.length === ASSETS.length) {
        // New version is fully staged. Delete the old live cache.
        await caches.delete(LIVE_CACHE);
        const liveCache = await caches.open(LIVE_CACHE);
        // Copy everything from the temporary cache to the live cache.
        for (const request of cachedRequests) {
          const response = await tempCache.match(request);
          await liveCache.put(request, response);
        }
        // Delete the temporary cache.
        await caches.delete(TEMP_CACHE);
        // Optionally, notify clients to reload.
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage({ action: 'reload' }));
      } else {
        // If staging failed, delete the temporary cache and keep the old live cache.
        console.error('Staging failed. Keeping the old cache.');
        await caches.delete(TEMP_CACHE);
      }
      await self.clients.claim();
    })()
  );
});

// Fetch: Always try the network first, but fall back to live cache if offline.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Update the live cache with the fresh response.
        const responseClone = networkResponse.clone();
        caches.open(LIVE_CACHE).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try to serve from the live cache.
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Optionally, return a fallback for unmatched requests.
          return new Response('Network error occurred', {
            status: 408,
            statusText: 'Network error'
          });
        });
      })
  );
});
