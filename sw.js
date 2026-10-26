const CACHE_NAME = 'hicon-me-app-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/html5-qrcode'
];

// Cài đặt Service Worker và lưu giao diện vào bộ nhớ Offline của điện thoại
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

// Kích hoạt và dọn bộ nhớ cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Chế độ Offline thông minh: Có mạng thì lấy dữ liệu mới nhất, mất mạng thì lấy từ bộ nhớ máy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Không cache trực tiếp request API của Firebase để hàm JS tự quản lý Offline Queue
  if (event.request.url.includes('firebasedatabase.app')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedRes) => {
          return cachedRes || caches.match('./index.html');
        });
      })
  );
});