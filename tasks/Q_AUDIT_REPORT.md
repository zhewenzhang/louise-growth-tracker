# 項目審計報告：系統 / 代碼 / UI 三維度分析

**性質**：純分析報告，非執行 task。列出後續可優化項供決策參考。

---

## 1. 系統架構（System Architecture）

### 🟢 優點
- Firestore + localStorage 雙寫策略已建立
- 已啟用 IndexedDB persistence，離線寫入會自動 replay
- 已有匿名登入 + UID 白名單規則，資料隔離正確
- PWA Service Worker 採 stale-while-revalidate，靜態資源快取良好

### 🔴 待改進

| 編號 | 問題 | 影響 | 建議 |
|------|------|------|------|
| S1 | 用 `getDocs` 一次性讀取，不是 `onSnapshot` realtime listener | 換手機/換 tab 不會自動同步，必須重新整理 | 改用 onSnapshot |
| S2 | Firestore 載入完成才顯示頁面（loaded 為 false 時 Loading 畫面） | 首屏體感慢 1-3 秒 | localStorage 立即顯示，Firestore 背景同步 |
| S3 | Firebase config 硬編碼在 `firebase.js` | 切換 dev/prod 不便，部署需手動改 | 改為 `import.meta.env.VITE_FIREBASE_*` |
| S4 | 沒有錯誤上報機制 | bug 發生用戶不會回報，自己看不到 | 可選：簡單 `window.onerror` 寫到 Firestore errors collection |
| S5 | 沒有 CI/CD 自動部署 | 每次 build + gh-pages 手動執行 | GitHub Actions 自動部署 master |

---

## 2. 代碼架構（Code Architecture）

### 🟢 優點
- context / services / hooks / utils / data / components 分層清楚
- Firestore service 文件有清楚的 schema 註解
- WHO 數據已統一（不再有重複）
- ID 用 UUID，避免衝突

### 🔴 待改進

| 編號 | 問題 | 影響 | 建議 |
|------|------|------|------|
| C1 | 沒有 TypeScript / JSDoc | IDE 補全弱，refactor 風險高 | 漸進式 JSDoc 或一次性轉 TS |
| C2 | 沒有任何單元測試 | `calcPercentile` 等核心邏輯改錯不會被發現 | Vitest + 重點覆蓋 utils/ |
| C3 | Dashboard 230 行 + 10+ useMemo | 難維護，re-render 多 | 拆 SummaryCardRow / FeedingCard |
| C4 | `AppContext` 變得很大（300+ 行）+ 一個 useEffect 內塞 6 個 collection 載入 | 載入失敗難 debug | 抽 `useFirestoreSync()` hook |
| C5 | 缺資料驗證層 | 體重 999kg、負數值都能存 | 在 add* 函數加 schema 驗證 |
| C6 | Date.now() 仍出現在 `localStorage` 同步邏輯中（updatedAt） | 不嚴重，但時間 race | 統一用 `genId` / Firestore serverTimestamp |
| C7 | 沒有 lazy loading | bundle 178KB 一次載入 | `React.lazy` 拆頁 |
| C8 | Service Worker 不會自動更新版本 | 用戶看不到新功能 | Workbox 或加版本號 cache busting |

---

## 3. UI 架構（UI Architecture）

### 🟢 優點
- 手繪風格統一（wobbly border、hard shadow、便利貼）
- CSS 變數系統合理（colors / fonts / shadows）
- 動畫節制（slide / fade / wiggle）
- 響應式間距系統

### 🔴 待改進

| 編號 | 問題 | 影響 | 建議 |
|------|------|------|------|
| U1 | 大量 inline style（每個組件都 `style={{}}`） | 跟 Tailwind 並存矛盾，難維護 | 抽 `<Card>` `<Button>` `<Input>` 統一組件 |
| U2 | 深色模式已配置但無切換 | 晚上餵奶傷眼 | 加 toggle + dark 色票 |
| U3 | 字體大小寫死 px / rem 混用 | 不同設備不一致 | 統一用 rem + clamp() |
| U4 | 沒有 a11y 支援（aria-label 等） | 視障用戶無法用 | 至少 button title + aria-label |
| U5 | 表單沒有 error 提示動畫 | 用戶不知道為什麼提交失敗 | 加 invalid 狀態 + 紅色震動 |
| U6 | Loading 畫面太陽春 | 體感差 | 改成 skeleton screen |
| U7 | 沒有空狀態插畫 | 第一次打開像沒做完 | 各頁加 empty state SVG / emoji |

---

## 4. 後續可加功能（Backlog）

### 🌟 高價值
- **PIN 密碼鎖** → 見 `Q_PIN_LOCK.md`
- 📷 照片附件（Firebase Storage）
- 🔔 疫苗到期推送通知（Web Push）
- 🌙 深色模式切換
- 👥 多寶寶切換（未來二寶用）

### 🌱 加分項
- 😴 睡眠記錄
- 💊 用藥記錄
- 🌡️ 體溫/症狀追蹤
- 📊 週/月成長報表
- 🇹🇼 WHO 男嬰數據（依 gender 切換）
- 📱 PWA 加桌面 install prompt

---

## 建議執行優先序

**第 1 批（安全 + 體驗）**
- ✅ 已完成：A1 Firestore Rules / A2 isCustom / A3 重算疫苗 / A4 IndexedDB persistence
- 🔥 PIN 密碼鎖（`Q_PIN_LOCK.md`）

**第 2 批（架構優化）**
- U1 抽組件 `<Card>` `<Button>`
- C3 拆分 Dashboard
- S1 Firestore onSnapshot realtime

**第 3 批（深度優化）**
- U2 深色模式
- C2 單元測試
- S2 漸進式載入
- C5 資料驗證層

**第 4 批（新功能）**
- 📷 照片附件
- 🔔 Web Push 通知
- 👥 多寶寶切換
