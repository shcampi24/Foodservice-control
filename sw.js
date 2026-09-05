// FSCC Service Worker v1
const CACHE_NAME = 'fscc-v29';
const ASSETS = [
  '/Foodservice-control/',
  '/Foodservice-control/index.html',
  '/Foodservice-control/manifest.json',
  '/Foodservice-control/icon-192.png',
  '/Foodservice-control/icon-512.png'
];

// Instalar: cachear archivos esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para HTML, cache-first para assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No cachear requests a Firebase, Google APIs, etc.
  if (url.origin !== location.origin) return;

  // HTML principal: network-first (siempre intentar traer la última versión)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets estáticos: cache-first
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }))
  );
});
