// sw.js — SmartFarm AI Service Worker
// Caches core assets for offline use

const CACHE_NAME = 'smartfarm-v1';
const OFFLINE_URL = '/index.html';

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/weather.html',
  '/soil.html',
  '/disease.html',
  '/market.html',
  '/harvest.html',
  '/css/style.css',
  '/js/script.js',
  '/js/smartfarm.js',
  '/manifest.json',
];

// ── Install: cache core assets ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network first, cache fallback ──────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests (APIs, CDNs)
  if (!url.origin.includes(self.location.origin)) return;

  // Skip API calls — always need fresh data
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request)
          .then(cached => cached || caches.match(OFFLINE_URL));
      })
  );
});

// ── Push Notifications (for market alerts) ───────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'SmartFarm AI', body: 'You have a new farm alert!' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'SmartFarm AI', {
      body: data.body,
      icon: '/manifest.json',
      badge: '/manifest.json',
      tag: data.tag || 'smartfarm-alert',
      data: { url: data.url || '/market.html' },
      actions: [
        { action: 'view', title: 'View Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action !== 'dismiss') {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
  }
});