# Louise 成長記錄應用 - 工程規範文檔

## 📋 項目信息

| 項目 | 詳情 |
|------|------|
| **項目名稱** | Louise 成長記錄應用（Louise Growth Tracker） |
| **設計來源** | Claude Design 原型設計文件 |
| **開發工具** | Qwen Code（Alibaba Qwen 編碼助手） |
| **首選框架** | React 18 |
| **部署方式** | Web應用（Web-first approach） |
| **數據庫** | Supabase (PostgreSQL) |
| **目標用戶** | 父母、祖父母、Lousie本人（未來回顧） |
| **開發階段** | Phase 1: 前端頁面 + 本地功能 |

---

## 🎯 核心功能清單（優先級排序）

### Phase 1：基礎頁面 + 功能實現（Web）
#### Tier 1 - 核心必做（Week 1-2）
- [x] **首頁儀表板** - Louise月齡顯示、最新數據、快速統計
- [x] **成長追蹤頁** - 體重/身高/頭圍記錄 + WHO標準曲線圖表
- [x] **日常記錄頁** - 餵食、睡眠、大小便記錄
- [x] **健康管理頁** - 疫苗接種追蹤（11項），健康檢查記錄
- [x] **回憶時間軸** - 里程碑、信件記錄
- [x] **快速記錄** - 浮動按鈕快速添加
- [x] **夜間模式** - 深色護眼設計切換
- [x] **本地存儲** - LocalStorage持久化

#### Tier 2 - 增強功能（Week 3）
- [ ] **數據導出** - PDF成長報告、CSV數據匯出
- [ ] **搜尋功能** - 按日期、類型搜尋記錄
- [ ] **數據統計** - 月均體重增長率、身高/頭圍同比
- [ ] **提醒通知** - 疫苗接種提醒、定期檢查提醒
- [ ] **多設備同步** - Supabase數據庫同步

#### Tier 3 - 高級功能（Phase 2+）
- [ ] **照片相冊** - 時間軸照片管理、按月份分類
- [ ] **多用戶支持** - 父母賬戶、祖父母查看權限
- [ ] **數據備份** - iCloud/Google Drive備份選項
- [ ] **分享功能** - 成長報告分享給家人
- [ ] **AI洞察** - 智能健康建議（集成AI模型）

---

## 🏗️ 技術架構

### Frontend Stack
```
React 18
├── State Management: useState + useContext (本地) / Zustand (未來)
├── UI Components: 原生 React + Styled Components (CSS-in-JS)
├── Charts: Chart.js 4.4.0 + React-Chartjs-2
├── Forms: Controlled Components + 自定義驗證
├── Storage: LocalStorage (Phase 1) → Supabase (Phase 2)
└── Build: Vite (推薦) 或 Create React App
```

### Backend Stack (Phase 2)
```
Supabase (PostgreSQL + Auth + Real-time)
├── Authentication: Supabase Auth (Email/社交登錄)
├── Database: PostgreSQL
│   ├── users (用戶表)
│   ├── growth_records (體重/身高/頭圍)
│   ├── feeding_records (餵食)
│   ├── sleep_records (睡眠)
│   ├── health_records (健康檢查)
│   ├── milestones (里程碑)
│   ├── letters (信件)
│   └── photos (照片元數據)
├── Storage: Supabase Storage (照片/文件)
├── Real-time: Realtime Subscriptions (多用戶同步)
└── Edge Functions: Serverless (PDF生成、郵件通知)
```

### Design System
```
顏色系統 (CSS Variables)
├── --rose: #e8909a (主色 - 玫瑰粉)
├── --rose-deep: #c06878 (深玫瑰)
├── --peach: #e8a87c (桃色)
├── --teal: #7acaca (綠松石)
├── --mauve: #b09acc (紫色)
├── --sage: #8ac8a0 (鼠尾草綠)
├── --amber: #e8c880 (琥珀色)
├── --sky: #80b8e0 (天藍)
├── --coral: #e89090 (珊瑚紅)
└── --bg: #1e0d14 (深紫黑背景)

Liquid Glass 效果
├── .lg: backdrop-filter blur(20px) saturate(180%)
├── .lg-sm: backdrop-filter blur(12px) (輸入框)
└── .lg-nav: backdrop-filter blur(32px) (導航)

圓角系統: --r1 (8px) ~ --r5 (28px)
字體: Lora (serif) + DM Sans (sans-serif)
```

---

## 📊 數據模型（Phase 1 - LocalStorage結構）

```javascript
{
  // 用戶信息
  user: {
    name: "Louise",
    birthDate: "2026-04-26",
    gender: "female"
  },
  
  // 成長記錄
  growthRecords: [
    {
      id: timestamp,
      date: "2026-05-01",
      type: "weight" | "height" | "headCircumference",
      value: 3.5,
      unit: "kg" | "cm",
      note: "",
      percentile: 50 // WHO百分位
    }
  ],
  
  // 餵食記錄
  feedingRecords: [
    {
      id: timestamp,
      date: "2026-05-01",
      type: "breastfeeding" | "formula" | "complementary",
      duration: 20, // 分鐘（母乳）/ 毫升（奶粉）/ -（副食品）
      amount: 180,
      note: ""
    }
  ],
  
  // 睡眠記錄
  sleepRecords: [
    {
      id: timestamp,
      date: "2026-05-01",
      startTime: "21:00",
      endTime: "06:00",
      duration: 540, // 分鐘
      quality: "good" | "normal" | "poor"
    }
  ],
  
  // 健康記錄
  healthRecords: [
    {
      id: timestamp,
      date: "2026-05-01",
      type: "general" | "visit" | "emergency" | "checkup" | "other",
      weight: 3.5,
      height: 50.5,
      note: "醫囑或觀察"
    }
  ],
  
  // 疫苗追蹤
  vaccineRecords: [
    {
      id: "vaccine_name",
      name: "B肝疫苗",
      completed: true,
      dates: ["2026-04-26", "2026-05-26"]
    }
  ],
  
  // 里程碑
  milestones: [
    {
      id: timestamp,
      date: "2026-05-01",
      title: "第一次微笑",
      icon: "heart",
      note: "露出燦爛的笑容"
    }
  ],
  
  // 信件
  letters: [
    {
      id: timestamp,
      date: "2026-05-01",
      title: "給 Louise 的信",
      content: "親愛的 Louise..."
    }
  ]
}
```

---

## 🖼️ 頁面結構詳解

### 1. 首頁儀表板 (`/`)
**組件結構：**
- Header: Louise年月齡 + 日期 + 設置按鈕
- Stats Grid (3列)
  - 當前體重 + 增長趨勢
  - 當前身高 + 增長趨勢
  - 頭圍 + 健康狀態
- Today's Activity (3欄)
  - 最後一次餵食時間
  - 最後一次睡眠
  - 今日大小便次數
- Quick Actions (4個卡片)
  - 新增記錄
  - 查看成長曲線
  - 疫苗進度
  - 最近里程碑

**交互：**
- 點擊各數據卡進入詳細頁面
- 點擊"新增記錄"打開快速記錄浮窗

---

### 2. 成長追蹤頁 (`/growth`)
**組件結構：**
- Tab切換: 體重 / 身高 / 頭圍
- 圖表區域 (Chart.js)
  - X軸: 月齡 (0-24)
  - Y軸: 數值
  - 實線: Louise 實際數據
  - 虛線: WHO P50 (中位數)
  - 填充區域: WHO P3-P97 正常範圍
  - 點擊點顯示詳細信息
- 記錄列表
  - 倒序顯示所有記錄
  - 顯示日期、值、百分位
  - 可編輯/刪除

**WHO曲線數據：**
- 內置 WHO 女童標準數據 (0-24月)
- 自動計算每條記錄的百分位 (P3/P15/P50/P85/P97)
- 顯示偏差指示 (例："比平均高 +0.3kg")

---

### 3. 日常記錄頁 (`/daily`)
**Tab 1: 餵食 (Feeding)**
- 記錄類型:
  - 母乳 (分鐘)
  - 配方奶 (毫升)
  - 副食品 (文字描述)
- 每日總結 (今日已餵食次數、總時長)
- 最近7天趨勢

**Tab 2: 睡眠 (Sleep)**
- 開始/結束時間選擇
- 睡眠質量評分 (好/正常/差)
- 夜晚驚醒記錄
- 周統計 (總睡眠時數)

**Tab 3: 排便 (Diaper)**
- 大小便記錄 (含顏色、性質)
- 每日次數統計
- 異常提示

---

### 4. 健康管理頁 (`/health`)
**Tab 1: 疫苗 (Vaccines)**
- 11種推薦疫苗清單:
  1. B肝疫苗 (第0、1、6月)
  2. 卡介苗 (第0月)
  3. 脊髓灰質炎 (第2、4、6月)
  4. ... (其他8種)
- 進度條 (0/3 完成)
- 下次接種提醒

**Tab 2: 健康檢查 (Checkups)**
- 記錄類型: 一般檢查、就診、急診、體檢、其他
- 關聯體重/身高
- 醫囑備註

---

### 5. 回憶時間軸頁 (`/memories`)
**Tab 1: 里程碑 (Milestones)**
- 垂直時間軸設計
- 預設里程碑列表 (可快速選擇):
  - 第一次翻身
  - 第一次坐起
  - 第一顆牙
  - 第一次微笑
  - 第一步
  - ...等10個
- 自定義里程碑 (圖標 + 標題 + 日期 + 備註)
- 時間軸倒序排列

**Tab 2: 相冊 (Photo Album)**
- 佔位符: "照片功能即將推出"
- 提示文案: 正式APP版本支援

**Tab 3: 信件 (Letters)**
- 可展開/收起顯示
- 給 Louise 的信（未來回顧）
- 支援長文本、Markdown格式

---

### 6. 快速記錄浮窗 (`FAB - Floating Action Button`)
**場景：** 任意頁面點擊右下角 "+" 按鈕
**快速選項：**
- 快速記錄體重
- 快速記錄身高
- 記錄餵食
- 記錄睡眠
- 記錄里程碑
- 新增健康記錄

**行為：** 打開簡化的 Modal，只填最必要字段

---

## 🎨 設計系統規範

### 顏色應用
```
主要動作: var(--rose) #e8909a
成功狀態: var(--sage) #8ac8a0
警告狀態: var(--coral) #e89090
信息提示: var(--sky) #80b8e0
中性背景: rgba(255,255,255,0.06)
文本主色: rgba(255,255,255,0.85)
文本次色: rgba(255,255,255,0.50)
文本三級: rgba(255,255,255,0.28)
```

### Liquid Glass 組件
```
.lg 標準容器
- background: rgba(255,255,255,0.06)
- backdrop-filter: blur(20px)
- border: 漸層邊框
- box-shadow: 內凹光效 + 外投影

.lg-sm 輕量版
- 用於輸入框、小卡片
- blur(12px)

.lg-nav 導航專用
- 暗色底層 rgba(18,8,12,0.55)
- blur(32px)
- 頂部發光邊
```

### 間距系統
```
--r1: 8px (小圓角)
--r2: 14px (中圓角)
--r3: 18px (標準)
--r4: 22px (大)
--r5: 28px (超大)
--rf: 9999px (完全圓形)
```

---

## 📱 響應式設計要求

### 斷點
- 手機: 320px - 480px (優先)
- 平板: 481px - 768px
- 桌面: 769px+ (可選)

### 優化規則
- **底部導航固定**（手機和平板）
- **內容區域撐滿可用空間**
- **卡片適應寬度**（Grid自動調整列數）
- **字體響應式縮放** (使用clamp())

---

## ✅ 驗收標準 (Quality Gate)

### Functional Testing
- [ ] 所有6個頁面可正常導航
- [ ] 數據CRUD操作正常（創建、讀取、編輯、刪除）
- [ ] WHO曲線圖表正確顯示（無無限延伸bug）
- [ ] 快速記錄浮窗功能正常
- [ ] 夜間模式可切換，無樣式錯亂
- [ ] LocalStorage持久化正常

### Performance
- [ ] 首屏加載 < 3秒（Lighthouse score > 80）
- [ ] 圖表交互 60fps 流暢
- [ ] 響應式無延遲

### Visual
- [ ] 所有UI匹配設計稿（顏色、圓角、間距）
- [ ] Liquid Glass效果清晰可見
- [ ] 文本對比度 WCAG AA級 (4.5:1)
- [ ] 所有按鈕 >= 44px 點擊區域

### Browser Support
- [ ] Chrome / Edge 最新版本
- [ ] Safari (iOS 14+)
- [ ] Firefox 最新版本

---

## 📅 開發計劃時間線

| 階段 | 時間 | 任務 | 交付物 |
|------|------|------|--------|
| **Phase 1a** | Day 1-3 | 項目初始化 + 基礎組件庫 | React項目 + UI組件 |
| **Phase 1b** | Day 4-7 | 首頁 + 成長頁實現 | 2個完整頁面 |
| **Phase 1c** | Day 8-10 | 日常 + 健康 + 回憶頁 | 3個完整頁面 + FAB |
| **Phase 1d** | Day 11-12 | LocalStorage + 夜間模式 | 完整功能集成 |
| **Phase 1e** | Day 13-14 | 測試 + bug修復 + 部署 | 可部署Web版本 |
| **Phase 2** | 待定 | Supabase集成 + 多用戶同步 | 雲端版本 |

---

## 🔒 注意事項

### 不做的事情 (Out of Scope for Phase 1)
- ❌ 照片上傳功能（Phase 2）
- ❌ 多用戶支持（Phase 2）
- ❌ 後端API（Phase 2）
- ❌ 移動應用（Phase 3）
- ❌ 推送通知（Phase 2）

### 假設條件
- ✅ 用戶有瀏覽器支持（Chrome/Safari）
- ✅ 數據只在本機存儲（不涉及隱私合規）
- ✅ Louise出生日期固定為 2026-04-26
- ✅ 所有記錄時間均為用戶手動輸入

---

## 📚 參考資源

- **WHO成長標準曲線數據** - 內置於代碼中 (0-24月)
- **圖表庫** - Chart.js 4.4.0 官方文檔
- **設計原型** - Louise Growth App.html (Claude Design)
- **色彩系統** - CSS變數已定義在根據
