var cacheName = 'weatherPWA';
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

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache){
      console.log(cache);
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keylist) {
      return Promise.all(keylist.map(function(key) {
        console.log(keylist);
        if(key !== cacheName && key !== dataCacheName) {
          return caches.delete(key);
        }
      }))
    })
  );
});

self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
