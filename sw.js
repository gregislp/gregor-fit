// Service Worker: speichert die App für den Offline-Betrieb.
// Bei jeder Änderung an App-Dateien VERSION erhöhen, damit iPhones das Update laden.
const VERSION = 'gregorfit-v1.0.3';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/store.js',
  './js/util.js',
  './js/data/exercises.js',
  './js/data/cardio.js',
  './js/data/foods.js',
  './js/data/mobility.js',
  './js/logic/planner.js',
  './js/logic/nutrition.js',
  './js/views/components.js',
  './js/views/onboarding.js',
  './js/views/home.js',
  './js/views/training.js',
  './js/views/session.js',
  './js/views/cardio.js',
  './js/views/mobility.js',
  './js/views/nutrition.js',
  './js/views/stats.js',
  './js/views/profile.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' umgeht den HTTP-Cache des Browsers, sonst landen beim Update alte Dateien im neuen Cache
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.origin !== location.origin) return;

  // App-Dateien: Cache zuerst. Updates kommen nur über eine neue VERSION oben.
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      } catch {
        return c.match('./index.html');
      }
    })
  );
});
