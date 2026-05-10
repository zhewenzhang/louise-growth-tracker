---
name: 四大功能更新 - 奶量分離/圖表點擊/PWA
description: 2026-05-10 完成四大功能更新：母乳/配方奶分開記錄、點擊圖表趨勢、PWA 支援
type: project
---

## 四大功能更新

### 1. 奶量資料模型（母乳 + 配方奶分開）
- **firestoreService.js**: `saveGrowthToFirestore` 支援 `breastMilk` / `formula` 欄位
- **Growth.jsx**: 
  - 奶量 tab 表單改為雙輸入（🤱 母乳 ml + 🍼 配方奶 ml）
  - `TABS` 陣列 feeding 加入 `showFeeding: true`
  - 今日奶量統計分開顯示：`🤱 {breastMilk}ml + 🍼 {formula}ml = {total}ml（{count} 次）`
  - 歷史列表顯示明細：`🤱40 + 🍼20 = 60 ml`
  - `value` 仍儲存總量供統計用

### 2. ChartModal.jsx — 共用圖表彈窗
- 新建 `src/components/ChartModal.jsx`
- 支援 5 種指標：weight/height/headCircumference/chestCircumference/feeding
- 每種指標有獨立顏色和標籤
- 點擊遮罩或關閉按鈕關閉

### 3. Dashboard.jsx — 卡片點擊打開圖表
- 5 張 summary card（體重/身高/頭圍/胸圍/奶量）改為 `<button>` 可點擊
- 條件：`records.length >= 2` 才可點擊
- 點擊後打開 ChartModal 顯示趨勢圖
- 底部加入 `<ChartModal>` 組件渲染

### 4. PWA 支援
- **public/manifest.json**: PWA manifest，start_url 為 `/louise-growth-tracker/`
- **public/sw.js**: Service Worker，快取靜態資源，API 請求走網路
- **index.html**: 加入 PWA meta（apple-mobile-web-app-capable, manifest, apple-touch-icon, svg favicon）
- **main.jsx**: 註冊 Service Worker

## 部署
- 構建：`npm run build` 成功
- 部署：`npx gh-pages -d dist` 成功
