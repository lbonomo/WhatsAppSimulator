// Service Worker para JAWS
const CACHE_NAME = 'jaws-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/script.js',
  '/assets/js/simulator.js',
  '/assets/js/uiController.js',
  '/assets/js/messageManager.js',
  '/assets/js/voiceMessageManager.js',
  '/assets/js/chatConfigManager.js',
  '/assets/js/configManager.js',
  '/assets/js/simulationEngine.js',
  '/assets/js/linkPreview.js',
  '/assets/img/avatar-default.svg',
  '/assets/img/background.png',
  '/docs/wa-example.jpg',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap'
];

// Instalar el service worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});