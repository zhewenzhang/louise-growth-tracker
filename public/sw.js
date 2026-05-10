const CACHE = 'louise-v2';

// 安裝時：無需預快取，首次請求自動快取
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', (e) => {
  const { url } = e.request;

  // Firebase API 請求不快取
  if (url.includes('firestore') || url.includes('googleapis')) {
    return;
  }

  // 靜態資源：cache-first + 後台更新
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(e.request, res.clone());
        return res;
      });
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});
