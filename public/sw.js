const CACHE = 'enduro-v1';
const OFFLINE_GPS = '/gps';

// Assets to cache on install
const PRECACHE = [
  '/',
  '/gps',
  '/map',
  '/offline',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // API calls: network only, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Navigation: try network, fall back to cached page or GPS page
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(r => r || caches.match(OFFLINE_GPS))
      )
    );
    return;
  }

  // Static assets: cache first
  e.respondWith(
    caches.match(request).then(r =>
      r || fetch(request).then(res => {
        if (res.ok && !url.pathname.includes('_next/webpack')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match('/gps'))
    )
  );
});
