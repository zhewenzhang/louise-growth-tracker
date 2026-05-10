<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 夜間優化 — 不修改任何功能與配置

**嚴格約束**：
- ❌ 不修改任何 component 行為
- ❌ 不修改任何 data flow
- ❌ 不修改任何 UI 樣式
- ❌ 不修改 package.json
- ❌ 不修改 vite.config.js / tailwind.config.js
- ✅ 只清理未用 import、console.log、PWA 增強、git 配置

---

## Step 1：移除 firestoreService.js 未使用的 import

修正 D:\louise-growth-tracker-gh-pages\src\services\firestoreService.js 第 2 行：

```js
import { doc, setDoc, getDoc, collection, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
```

移除 `addDoc` 和 `updateDoc`（程式碼中共未使用）。

## Step 2：精簡 SW 註冊日誌

修正 D:\louise-growth-tracker-gh-pages\src\main.jsx 第 15-17 行：

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/louise-growth-tracker/sw.js').catch(
      (err) => console.warn('SW registration failed:', err)
    );
  });
}
```

移除成功 log，只保留錯誤警告。

## Step 3：新增 .gitattributes

新建 D:\louise-growth-tracker-gh-pages\.gitattributes：

```
# 統一換行符號
* text=auto eol=lf

# 二進制文件
*.png binary
*.jpg binary
*.ico binary
```

解決每次 commit 的 CRLF 警告。

## Step 4：增強 PWA Service Worker 快取策略

重寫 D:\louise-growth-tracker-gh-pages\public\sw.js，採用 runtime cache + stale-while-revalidate：

```js
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
```

## Step 5：構建驗證

```bash
cd D:\louise-growth-tracker-gh-pages
npm run build
npx gh-pages -d dist
```
