// service-worker.js
// Minimal service worker: caches the app shell so the PWA loads offline.
// Bin data itself is fetched fresh on each open (cache: no-store) and cached
// in localStorage by the app for offline read-only viewing.

const CACHE = 'roster-shell-v1';
const SHELL = [
    './',
    './index.html',
    './app.js',
    './app.css',
    './crypto-helper.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Never serve bin data from cache - we want fresh on every fetch.
    if (url.hostname.endsWith('jsonbin-zeta.vercel.app')) return;

    // Same-origin: cache-first for the app shell.
    if (url.origin === self.location.origin) {
        event.respondWith((async () => {
            const cached = await caches.match(req);
            if (cached) return cached;
            try {
                const fresh = await fetch(req);
                // Cache successful navigation/resource responses on the fly.
                if (fresh.ok) {
                    const cache = await caches.open(CACHE);
                    cache.put(req, fresh.clone());
                }
                return fresh;
            } catch (e) {
                // Offline and not cached - last resort: shell index.
                if (req.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                throw e;
            }
        })());
    }
});
