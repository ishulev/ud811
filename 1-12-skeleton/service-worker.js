var shellCache = 'weatherShellCache';
var apiCache = 'weatherApiCache';
var filesToCache = [
  '/',
  '/scripts/app.js',
  '/index.html',
  '/styles/ud811.css',
  '/favicon.ico',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(shellCache).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(keylist => {
      Promise.all(keylist.map(function (key) {
        if (key !== shellCache && key !== apiCache) {
          return caches.delete(key);
        }
      }))
    })
  );
});

self.addEventListener('fetch', function (e) {
  console.log('[ServiceWorker] fetch', e.request.url);
  if (e.request.url.startsWith('http://127.0.0.1:9800')) {
    e.respondWith(
      fetch(e.request).then(response => {
        return caches.open(apiCache).then(cache => {
          cache.put(e.request.url, response.clone());
          console.log('[Service Worker] fetched and cached');
          return response;
        })
      })
    );
  }
  else {
    e.respondWith(
      caches.match(e.request).then(function (response) {
        return response || fetch(e.request);
      })
    );
  }
});
