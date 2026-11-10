/**
 * Surge Listings — Enterprise Progressive Web App (PWA) Service Worker
 * Version: 1.0.0
 * 
 * Features:
 * - App shell caching for desktop standalone performance
 * - Graceful offline fallback to /offline.html
 * - STRICT privacy: No caching of auth tokens, sessions, or private documents
 * - Stale-while-revalidate for static shell assets
 * - Seamless background version upgrades
 */

const CACHE_VERSION = 'surge-pwa-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Core App Shell Resources
const APP_SHELL = [
  '/',
  '/index.html',
  '/marketplace.html',
  '/login.html',
  '/offline.html',
  '/styles.css',
  '/notifications.css',
  '/notifications.js',
  '/app.js',
  '/pwa.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/favicon.ico'
];

// Sensitive endpoints that MUST NEVER be cached
const SENSITIVE_PATTERNS = [
  /\/api\/.*auth/,
  /\/api\/.*login/,
  /\/api\/.*logout/,
  /\/api\/.*\/download/,
  /\/api\/.*password/,
  /\/api\/admin\/users/
];

function isSensitive(url) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(url));
}

// ============================================================
// 1. INSTALL LIFECYCLE
// Pre-caches the application shell
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use allSettled so single optional asset failure doesn't block PWA install
      return Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn(`[PWA SW] Pre-cache skipped for ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ============================================================
// 2. ACTIVATE LIFECYCLE
// Cleans up legacy caches and claims clients immediately
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE) {
            console.info(`[PWA SW] Purging obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// 3. FETCH INTERCEPTION & STRATEGIES
// ============================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Non-GET requests (mutations) MUST ALWAYS go directly to the network
  if (req.method !== 'GET') {
    return;
  }

  // Cross-origin tracking or non-http protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // SENSITIVE ROUTES: Pass straight to network, never cache
  if (isSensitive(url.pathname)) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'You are currently offline. An active connection is required to authenticate.',
            offline: true
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // NAVIGATION REQUESTS (HTML documents) -> Network-First with /offline.html fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          // If offline, check if specific page is cached
          const cachedPage = await caches.match(req);
          if (cachedPage) return cachedPage;

          // Fallback to offline page shell
          const offlineFallback = await caches.match('/offline.html');
          if (offlineFallback) return offlineFallback;

          return new Response(
            '<h1>Surge Listings Offline</h1><p>Check your internet connection.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // API DATA REQUESTS (Non-auth GETs) -> Network-First, do not fallback to outdated private records
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Network connection unavailable. Reconnect to sync with Surge Cloud.',
            offline: true
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // STATIC SHELL ASSETS (CSS, JS, Icons, Images) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => null);

      return cachedRes || fetchPromise;
    })
  );
});

// ============================================================
// 4. CLIENT MESSAGING (Skip waiting / updates)
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

