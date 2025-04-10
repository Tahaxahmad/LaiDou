const CACHE_NAME = 'laidou-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './manifest.json',
  './Assets/Logo.png',
  './Assets/sun.png',
  './Assets/moon.png',
  './Assets/bus.png',
  './Assets/train.png',
  './Assets/minibus.png',
  './Assets/icon-192x192.png',
  './Assets/icon-512x512.png',
  './bus-select.html',
  './train-select.html',
  './minibus-select.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('http://192.168.1.128')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
          });
      })
  );
});
