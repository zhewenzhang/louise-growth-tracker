// 版本資訊與強制更新工具
// __APP_VERSION__ 和 __BUILD_TIME__ 由 vite.config.js 在構建時注入

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

// 格式化建置時間（顯示用）
export const formatBuildTime = () => {
  try {
    const d = new Date(BUILD_TIME);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return BUILD_TIME;
  }
};

/**
 * 強制更新到最新版本
 * 1. 取消註冊所有 Service Worker
 * 2. 清除所有快取
 * 3. 強制重新載入頁面（繞過 HTTP cache）
 *
 * 注意：保留 localStorage（用戶資料）和 IndexedDB（Firestore 離線快取）
 */
export const forceUpdate = async () => {
  try {
    // 1. 取消註冊所有 Service Worker
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }

    // 2. 清除所有 Cache Storage（不會動 localStorage / IndexedDB）
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // 3. 強制重新載入（不使用快取）
    // 加 timestamp 確保完全繞過任何中間層快取
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  } catch (e) {
    console.error('強制更新失敗:', e);
    // 失敗時退而求其次：硬重新整理
    window.location.reload();
  }
};

/**
 * 檢查是否有新版本（透過比對 index.html 的 ETag）
 * 回傳 true 表示有新版本
 */
export const checkForUpdate = async () => {
  try {
    const res = await fetch(window.location.origin + window.location.pathname, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const html = await res.text();
    // 從 HTML 抓 script 路徑（vite 打包後 hash 不同代表版本不同）
    const match = html.match(/src="([^"]*\/index-[^"]+\.js)"/);
    if (!match) return false;
    const remoteScript = match[1];
    // 取得當前頁面用的 script 路徑
    const currentScripts = Array.from(document.querySelectorAll('script[src*="index-"]'));
    const currentScript = currentScripts.find(s => s.src.includes('/index-'));
    if (!currentScript) return false;
    return !currentScript.src.endsWith(remoteScript.replace(/^.*\//, ''));
  } catch {
    return false;
  }
};
