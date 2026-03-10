// Very simple offline cache for the app shell
const CACHE_NAME = 'remodelpro-invoice-v2';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'js/constants.js',
  'js/utils.js',
  'js/storage.js',
  'js/ui.js',
  'js/invoicing.js',
  'js/printing.js',
  'js/expenses.js',
  'js/reports.js',
  'js/app.js',
  'js/firebase.js',
  'assets/logo.png',
  'assets/user-circle.svg',
  'assets/favicon-96x96.png',
  'assets/favicon.svg',
  'assets/apple-touch-icon.png',
  'assets/web-app-manifest-192x192.png',
  'assets/web-app-manifest-512x512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
