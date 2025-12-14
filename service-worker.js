const CACHE_NAME = 'chord-sheets-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時に必要最小限のファイルだけをキャッシュ
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// フェッチ戦略: 外部CDNは常にネットワークから取得
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // 外部CDNのリソースは常にネットワークから取得（CORSエラー回避）
  if (url.includes('unpkg.com') || 
      url.includes('cdn.tailwindcss.com') ||
      url.includes('cdnjs.cloudflare.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // アプリ自体のファイルはキャッシュファースト
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[Service Worker] Using cached:', event.request.url);
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // 有効なレスポンスのみキャッシュ
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            console.log('[Service Worker] Offline, no cache:', event.request.url);
          });
      })
  );
});

// 古いキャッシュを削除
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
    .then(() => self.clients.claim())
  );
});
