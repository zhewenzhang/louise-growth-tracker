const CACHE = 'louise-v3';

// 立即接管所有 client（避免舊版本繼續執行）
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', (e) => {
  const { url } = e.request;

  // Firebase API 請求不快取
  if (url.includes('firestore') || url.includes('googleapis')) {
    return;
  }

  // HTML 一律 network-first（確保用戶總是拿到最新版本）
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // 其他靜態資源：cache-first + 後台更新
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
    Promise.all([
      // 清除所有舊版快取
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
      // 立即接管所有 client（強制使用新版本）
      self.clients.claim(),
    ])
  );
});
