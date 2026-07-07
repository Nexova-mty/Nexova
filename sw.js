// Firebase Messaging SW (background push notifications)
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyAhStb6vYzd17ff6zH2lppFYAp7B58tr8g",
    authDomain: "nexova-mty.firebaseapp.com",
    projectId: "nexova-mty",
    storageBucket: "nexova-mty.firebasestorage.app",
    messagingSenderId: "712813418598",
    appId: "1:712813418598:web:9697a7e39c7987bef4f5a7"
  });
  var _messaging = firebase.messaging();
  _messaging.onBackgroundMessage(function(payload) {
    var title = (payload.notification && payload.notification.title) || 'NEXOVA';
    var body = (payload.notification && payload.notification.body) || '';
    self.registration.showNotification(title, { body: body, icon: './icon-192.png', badge: './icon-192.png', tag: payload.collapseKey || 'nexova-push' });
  });
} catch(e) { console.warn('FCM SW init failed:', e); }

var CACHE_NAME = 'nexova-b1783385972';
// Videos excluded — large files cause install timeouts; cached lazily on first fetch
var urlsToCache = [
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './404.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  // Activate immediately — do not wait for old SW to release
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      // Take control of all open pages immediately
      return self.clients.claim();
    }).then(function() {
      // Force reload all controlled pages so they get the latest HTML
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.navigate(client.url);
        });
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  var isHtml = event.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname === '/'
    || url.pathname.endsWith('/Nexova/');

  if (isHtml) {
    // HTML: ALWAYS fetch fresh from network bypassing ALL caches.
    // cache:'reload' forces the browser to skip HTTP cache too (not just SW cache).
    // Fallback to SW cache only when offline.
    event.respondWith(
      fetch(event.request, { cache: 'reload' }).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./404.html');
        });
      })
    );
    return;
  }

  // Static assets (icons, images, fonts): cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() {
        return new Response('', { status: 503 });
      });
    })
  );
});
