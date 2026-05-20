// service-worker.js
// Caches the app shell so the PWA loads offline. The roster data file
// itself (roster.json) is *always* fetched from the network and never
// served from cache - otherwise we'd never see updated rosters.

const CACHE = 'roster-shell-v3';
const DATA_FILE = 'roster.json';
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

    // Never cache the roster data - always fetch fresh.
    if (url.origin === self.location.origin && isRosterDataPath(url.pathname)) {
        event.respondWith(fetchNoStore(req));
        return;
    }

    // Same-origin shell: cache-first.
    if (url.origin === self.location.origin) {
        event.respondWith(shellCacheFirst(req));
    }
});

function isRosterDataPath(pathname) {
    // Match the data file at any path depth (handles repo-name subdirectory on github.io)
    return pathname.endsWith('/' + DATA_FILE) || pathname.endsWith(DATA_FILE);
}

async function fetchNoStore(req) {
    try {
        return await fetch(req, { cache: 'no-store' });
    } catch (e) {
        // Offline: surface a synthetic 503 so the app can detect it
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            statusText: 'offline',
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function shellCacheFirst(req) {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
        const fresh = await fetch(req);
        if (fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, fresh.clone());
        }
        return fresh;
    } catch (e) {
        if (req.mode === 'navigate') {
            return caches.match('./index.html');
        }
        throw e;
    }
}
