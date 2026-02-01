const CACHE_NAME = 'hydranten-app-v4-beta';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-v3-192.png',
    './icon-v3-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
