const CACHE_NAME = 'chord-sheets-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// インストール時に即座に有効化
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // すぐに有効化
  );
});

// キャッシュファースト戦略（オフライン優先）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          console.log('[Service Worker] Using cached:', event.request.url);
          return response;
        }
        
        // キャッシュになければネットワークから取得し、キャッシュに保存
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効かチェック
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // CDNやHTTPSのリソースをキャッシュ
            if (event.request.url.startsWith('http')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('[Service Worker] Cached:', event.request.url);
                });
            }
            
            return response;
          })
          .catch(() => {
            // オフライン時は何も返せない
            console.log('[Service Worker] Offline, no cache available for:', event.request.url);
          });
      })
  );
});

// 古いキャッシュを削除し、即座に制御を取得
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // すぐに制御を開始
  );
});
