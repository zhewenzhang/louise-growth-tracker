# Louise 成長記錄應用 - Qwen Code 實現指南

> 📌 本文檔指導如何使用 Qwen Code 實現完整的 Louise 成長記錄應用

---

## 📖 文檔結構

你現在有三個主要文檔：

### 1️⃣ **louise_engineering_spec.md** (工程規範)
- 📋 完整的技術架構
- 🎨 設計系統定義
- 📊 數據模型結構
- ✅ 驗收標準

**用途：** 理解項目全貌和技術要求。推薦作為參考文檔。

---

### 2️⃣ **QWEN_CODE_PROMPT.md** ⭐ **（直接複製給 Qwen Code）**
- 🎯 完整的實現步驟
- 💻 可複製的代碼示例
- ⚠️ 常見陷阱與解決方案
- ✅ 驗收檢查清單

**用途：** 直接複製整個文檔內容到 Qwen Code，讓它執行實現。

---

### 3️⃣ **DEVELOPMENT_PLAN.md** (開發時間表)
- 📅 14 天詳細的開發計劃
- 🔄 Phase 1a-1e 階段分解
- ⏱️ 每天的具體任務和時間估計
- 📊 測試用例和驗收標準

**用途：** 監控實現進度，確保按時完成各個階段。

---

## 🚀 使用流程

### 第一步：準備工作（5 分鐘）
1. ✅ 確認已閱讀 `louise_engineering_spec.md`
2. ✅ 準備好 Qwen Code 應用或界面
3. ✅ 打開 `QWEN_CODE_PROMPT.md`

### 第二步：複製提示到 Qwen Code（1 分鐘）
1. 打開 `QWEN_CODE_PROMPT.md`
2. 複製整個文檔内容（從 `# Louise 成長記錄應用 - Qwen Code 執行提示` 開始）
3. 粘貼到 Qwen Code 的對話框中
4. 按 Send/提交

### 第三步：監控實現進度（14 天）
1. 查看 `DEVELOPMENT_PLAN.md`
2. 根據每日計劃檢查進度
3. 按 Phase 驗收各階段完成情況

### 第四步：驗收交付物
1. 測試應用功能（對照檢查清單）
2. 驗證 WHO 曲線無 bug
3. 檢查響應式設計
4. 確認部署成功

---

## 📝 關鍵清單

### 項目信息
| 項目 | 詳情 |
|------|------|
| 項目名稱 | Louise 成長記錄應用 |
| 框架 | React 18 |
| 構建工具 | Vite（推薦）或 CRA |
| 數據存儲 | LocalStorage (Phase 1) |
| 設計風格 | Liquid Glass Morphism |
| **目標用戶** | Qwen Code |
| **預期周期** | 14 天 |

### Phase 1 交付物
- ✅ 6 個完整頁面（首頁、成長、日常、健康、回憶、FAB）
- ✅ 200+ 行 CSS 變數和 Liquid Glass 樣式
- ✅ 6 個 React 頁面組件
- ✅ 5 個自定義 Hooks
- ✅ 3 個工具函數模塊
- ✅ 全球狀態管理 (AppContext)
- ✅ WHO 標準曲線數據 + 計算邏輯
- ✅ LocalStorage 持久化
- ✅ 夜間模式
- ✅ CRUD 操作（編輯、刪除、復原）

### 驗收標準（14 天後應滿足）
- [ ] 6 個頁面功能完整
- [ ] WHO 曲線無無限延伸 bug
- [ ] LocalStorage 數據持久化正常
- [ ] 夜間模式工作正常
- [ ] 響應式設計 (320-768px) 完美
- [ ] 首屏加載 < 3 秒
- [ ] Chrome/Safari/Firefox 相容
- [ ] 可部署到 Vercel/Netlify

---

## ⚠️ 關鍵注意事項

### 1. WHO 曲線座標系統 🔴 (最常見 Bug)
❌ **不要混合座標格式：**
```javascript
// 錯誤的做法
datasets: [
  { data: [2.5, 3.0, 3.5, ...] },  // index 格式
  { data: [{x: date, y: 3.2}], parsing: {...} }  // date 格式
]
```

✅ **正確的做法：**
```javascript
// 統一使用 index 0-24
datasets: [
  { data: whoWeightData.p50 },
  { data: louisRecordsAtIndices }
]
```

### 2. LocalStorage 鍵名
確保使用正確的前綴 `louise_*`：
- `louise_user` - 用戶信息
- `louise_growth` - 成長記錄
- `louise_feeding` - 餵食記錄
- `louise_sleep` - 睡眠記錄
- `louise_health` - 健康記錄
- `louise_vaccines` - 疫苗追蹤
- `louise_milestones` - 里程碑
- `louise_letters` - 信件

### 3. 響應式設計優先級
手機優先 (320-480px)：
- 底部導航固定
- 內容區域撐滿可用空間
- 文字使用 `clamp()` 實現流暢縮放

### 4. Liquid Glass 效果要求
確保有足夠的 blur 和 saturate：
```css
.lg {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.06);
}
```

---

## 🔧 Qwen Code 實施提示

### 如果 Qwen Code 卡住或需要澄清

用以下提示重新啟動對話：

```
我正在用 Louise 成長記錄應用。目前完成了 [描述當前階段]。
遇到的問題是 [描述問題]。

請參考 QWEN_CODE_PROMPT.md 中的以下部分幫助我：
[引用相關部分]

我需要你繼續 Step [X]。
```

### 常見命令

```bash
# 開始新項目
npm create vite@latest louise-growth-tracker -- --template react
cd louise-growth-tracker
npm install

# 安裝依賴
npm install chart.js react-chartjs-2 date-fns clsx

# 開發模式
npm run dev

# 生產構建
npm run build

# 預覽生產版本
npm run preview

# 部署到 Vercel
npm install -g vercel
vercel login
vercel deploy --prod
```

---

## 📊 進度追蹤表

### Phase 1a: 項目初始化 & 基礎 (Day 1-3)
- [ ] Day 1: Vite 初始化 + 文件結構
- [ ] Day 2: CSS 變數系統 + Liquid Glass
- [ ] Day 3: Hooks + 工具函數 + AppContext

**預期成果：** 乾淨的 React 項目 + 設計系統

---

### Phase 1b: 首頁 & 成長頁 (Day 4-7)
- [ ] Day 4: 首頁儀表板（StatCard + 數據拉取）
- [ ] Day 5-6: 成長頁（⚠️ 重點：WHO 曲線bug預防）
- [ ] Day 7: 測試數據 + 視覺調整

**預期成果：** 兩個完整頁面 + 圖表交互

---

### Phase 1c: 日常、健康、回憶頁 (Day 8-10)
- [ ] Day 8: 日常頁 + 健康頁
- [ ] Day 9: 回憶頁 + FAB
- [ ] Day 10: 導航集成 + 全面測試

**預期成果：** 五個完整頁面 + 導航 + FAB

---

### Phase 1d: 持久化 & 主題 (Day 11-12)
- [ ] Day 11: 編輯/刪除/復原功能
- [ ] Day 12: 夜間模式 + LocalStorage 驗證

**預期成果：** 完整 CRUD + 主題切換 + 數據持久化

---

### Phase 1e: 測試 & 部署 (Day 13-14)
- [ ] Day 13: 功能測試 + Bug 修復
- [ ] Day 14: 性能優化 + 部署

**預期成果：** 可公開訪問的 Web 應用

---

## 📞 遇到問題？

### 如果遇到 WHO 曲線 Bug
1. 檢查 Step 5.2 和 5.3 中座標系統的說明
2. 查看 `louise_engineering_spec.md` 的數據模型部分
3. 確認所有數據集都使用 index 0-24 格式
4. 設置 `spanGaps: false` 防止連線

### 如果 LocalStorage 不工作
1. 檢查瀏覽器控制台是否有錯誤
2. 驗證鍵名是否正確（`louise_*` 前綴）
3. 確認 useLocalStorage Hook 實現正確
4. 在 DevTools 中檢查 Application > Local Storage

### 如果響應式設計有問題
1. 檢查 CSS 中是否有 `width: 100%` 在容器中
2. 使用 `clamp()` 函數調整字體大小
3. 在 DevTools 中測試 375px 寬度（iPhone SE）
4. 確保底部導航固定 (position: fixed)

### 如果部署失敗
1. 運行 `npm run build` 檢查是否有編譯錯誤
2. 確認環境變數配置（如需）
3. 檢查部署平台（Vercel/Netlify）的設置
4. 查看構建日誌中的錯誤信息

---

## 🎯 最終檢查清單

在 Day 14 驗收時，確保以下項目都已完成：

### 功能
- [ ] 6 個頁面都可正常導航
- [ ] 所有 CRUD 操作正常（新增、編輯、刪除、復原）
- [ ] WHO 曲線圖表正確顯示，無無限延伸
- [ ] 快速記錄浮窗 (FAB) 六個選項全部可用
- [ ] 夜間模式可切換，UI 正確調整
- [ ] LocalStorage 數據持久化，刷新頁面後恢復

### 設計
- [ ] Liquid Glass 效果在深色背景上清晰可見
- [ ] 所有顏色符合 CSS 變數定義
- [ ] 文本對比度達 WCAG AA 級（4.5:1）
- [ ] 所有按鈕/卡片≥ 44px 點擊區域

### 響應式
- [ ] iPhone SE (375×667) 完美顯示
- [ ] iPhone 14 (390×844) 完美顯示
- [ ] iPad (768×1024) 完美顯示
- [ ] 無水平滾動條
- [ ] 導航、FAB 位置合理

### 性能
- [ ] 首屏加載 < 3 秒
- [ ] 圖表交互 60fps 流暢
- [ ] 頁面切換無延遲
- [ ] 輸入框响應即時

### 部署
- [ ] `npm run build` 成功，無錯誤
- [ ] 應用可部署到 Vercel/Netlify
- [ ] 公開 URL 可正常訪問
- [ ] 線上版本功能完整

---

## 🎉 準備完畢！

你現在擁有：
1. ✅ 完整的工程規範文檔
2. ✅ Qwen Code 的詳細執行提示
3. ✅ 14 天的開發計劃和時間表
4. ✅ 驗收標準和檢查清單

**下一步：**
1. 複製 `QWEN_CODE_PROMPT.md` 的全部內容
2. 粘貼到 Qwen Code 中
3. 讓 Qwen Code 按照計劃執行實現
4. 監控進度，對照 `DEVELOPMENT_PLAN.md` 驗收每個階段

**祝編碼順利！Louise 成長記錄應用即將誕生！** 🎊

---

**文件清單：**
- ✅ louise_engineering_spec.md (工程規範)
- ✅ QWEN_CODE_PROMPT.md (Qwen Code 執行提示) ⭐
- ✅ DEVELOPMENT_PLAN.md (開發計劃)
- ✅ README_FOR_QWEN_CODE.md (本文檔)
