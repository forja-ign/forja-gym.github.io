/* FORJA — service worker (misma estrategia que Bonsai).
   Solo toca sus propias cachés (forja-*): otras apps del mismo github.io quedan intactas. */
const CACHE = 'forja-v8';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/styles.css', './js/data.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png', './icons/icon.svg',
  './fonts/inter-400.woff2', './fonts/inter-500.woff2', './fonts/inter-600.woff2',
  './fonts/inter-tight-300.woff2', './fonts/inter-tight-400.woff2', './fonts/inter-tight-500.woff2', './fonts/inter-tight-600.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('forja-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Páginas: red primero (para recibir actualizaciones), caché si no hay conexión.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Resto de archivos: red primero para que las actualizaciones lleguen, caché sin conexión.
  e.respondWith(
    fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
