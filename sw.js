/* PEWS-spell service worker — cache-first, so the app opens with no network at all. */
var CACHE = 'pews-spell-1.2.1-7b48d136';
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "favicon-32.png",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
  "fonts/ibm-plex-mono-latin-600-normal.woff2",
  "fonts/ibm-plex-mono-latin-700-normal.woff2",
  "fonts/sarabun-latin-400-normal.woff2",
  "fonts/sarabun-latin-600-normal.woff2",
  "fonts/sarabun-latin-700-normal.woff2",
  "fonts/sarabun-latin-800-normal.woff2",
  "fonts/sarabun-thai-400-normal.woff2",
  "fonts/sarabun-thai-600-normal.woff2",
  "fonts/sarabun-thai-700-normal.woff2",
  "fonts/sarabun-thai-800-normal.woff2"
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      return k === CACHE ? null : caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // refresh the copy in the background; the user always gets an instant answer
        fetch(req).then(function (res) {
          if (res && res.ok) caches.open(CACHE).then(function (c) { c.put(req, res); });
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('index.html');   // navigations while offline
      });
    })
  );
});
