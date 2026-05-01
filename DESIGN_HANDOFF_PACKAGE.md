# Louise 成長記錄 - UI 設計交付包

> 📋 用於交付給 UI 設計工具（Figma / Stitch / Adobe XD 等）  
> 🎯 目的：為設計師提供完整的設計規範和背景信息  
> 📅 更新日期：2026-05-01

---

## 📦 必需文件清單

### **第 1 優先級（必需）**

#### 1️⃣ **設計系統文檔** 
📄 文件：`CLAUDE_DESIGN_SYSTEM.md`
- 色彩系統（8 種顏色 + 深淺模式）
- 排版系統（字體、字級、行高）
- 間距系統（8px 基數）
- 陰影系統（4 個級別）
- 圓角系統
- 動畫/過渡規則
- 組件規範（Button、Card、Input 等）

**設計師需要的部分：**
- ✅ 色彩板（RGB / HEX 值）
- ✅ 字體清單和字級表
- ✅ 圖層樣式（陰影、邊框）
- ✅ 動畫參數（時間、緩動）

---

#### 2️⃣ **設計審查和優化清單**
📄 文件：`DESIGN_AUDIT_AND_ENHANCEMENT.md`
- 當前設計評分（6/10）
- 10 項優化建議（P0/P1/P2）
- 排版改進方案（Playfair Display + Inter）
- 色彩升級方案（3 層次色體系）
- 間距統一規則
- 交互狀態定義
- 頁面過渡動畫

**設計師需要的部分：**
- ✅ P0 優化的設計稿示例
- ✅ 改進前後的對比圖
- ✅ 顏色層級定義圖
- ✅ 動畫時序圖

---

#### 3️⃣ **功能和頁面結構**
📄 文件：`README.md` 或應用功能文檔
- 6 個頁面描述（Home, Growth, Daily, Health, Memories, Quick Record）
- 每個頁面的主要元素
- 數據流和用戶旅程

**設計師需要的部分：**
- ✅ 頁面地圖（Sitemap）
- ✅ 用戶流程圖（User Flow）
- ✅ 信息架構（IA）

---

### **第 2 優先級（強烈推薦）**

#### 4️⃣ **實施指南**
📄 文件：`P0_IMPLEMENTATION_GUIDE.md`
- CSS 變數定義
- Tailwind 配置
- 具體的代碼實現細節

**設計師需要的部分：**
- ✅ CSS 變數表（用於在設計工具中應用）
- ✅ 響應式斷點清單

---

#### 5️⃣ **現有代碼和截圖**
📁 文件：應用源代碼
- 檢查當前 UI 的視覺狀態

**設計師需要的部分：**
- ✅ 應用截圖（深色和淺色模式各 6 頁）
- ✅ 組件截圖（按鈕、卡片、輸入框等）

---

#### 6️⃣ **品牌指南**
📄 文件：需要新建
- 應用名稱和 Logo
- 品牌調性（精緻、溫暖、可信任）
- 視覺語言（Liquid Glass、玫瑰粉主色）
- 排版個性（Playfair Display 的優雅）

---

### **第 3 優先級（可選但有用）**

#### 7️⃣ **優化路線圖**
📄 文件：`OPTIMIZATION_ROADMAP.md`
- Phase 1-3 的長期計劃
- 幫助設計師理解未來方向

---

## 🎨 導出步驟（按工具類型）

### **如果用 Figma：**

1. **建立 Design System 文件**
   ```
   📦 Louise Design System
   ├── 📄 Colors
   ├── 📄 Typography
   ├── 📄 Components
   ├── 📄 Animations
   └── 📄 Spacing
   ```

2. **上傳文件到 Figma**
   - 在 Figma 中新建 Team Library
   - 上傳所有設計資源

3. **分享給設計師**
   - 生成 Figma 連結
   - 給 View 權限

---

### **如果用 Stitch（Google 工具）：**

*我需要知道 Stitch 的具體上傳方式，但通常步驟是：*

1. 導出設計資源
   - 色彩板（CSV 或 JSON）
   - 字體列表
   - 圖層樣式

2. 上傳到 Stitch
   - 按照 Stitch 的導入格式
   - 配置設計 tokens

---

### **如果用 Adobe XD：**

1. **建立共享庫**
   - 在 Adobe XD 中建立 Design System 文件
   - 發佈為共享庫

2. **導出 Design Tokens**
   - Color Palette
   - Typography Scale
   - Component Library

---

## 📊 設計師需要的數據格式

### **1. 色彩系統（JSON 格式）**

```json
{
  "colors": {
    "primary": {
      "base": "#e8909a",
      "light": "#f0b8c0",
      "dark": "#c06878"
    },
    "accent": {
      "warm": "#f5a85c",
      "cool": "#7acaca"
    },
    "neutral": {
      "bg_primary": "#1e0d14",
      "bg_secondary": "#2d1420",
      "text_primary": "rgba(255,255,255,0.95)",
      "text_secondary": "rgba(255,255,255,0.65)"
    }
  }
}
```

### **2. 排版系統（CSV 或表格）**

| 層級 | 字體 | 大小 | 字重 | 行高 | 字母間距 | 用途 |
|------|------|------|------|------|---------|------|
| h1 | Playfair Display | 3.5rem | 700 | 1.1 | -0.02em | 頁面標題 |
| h2 | Playfair Display | 2.5rem | 600 | 1.2 | -0.015em | 副標題 |
| h3 | Playfair Display | 1.5rem | 600 | 1.3 | - | 小標題 |
| body | Inter | 1rem | 400 | 1.7 | 0.3px | 正文 |
| caption | Inter | 0.875rem | 500 | 1.5 | - | 輔助文本 |

### **3. 間距系統（單位：px）**

| 層級 | 值 | 用途 |
|------|-----|------|
| spacing-1 | 8px | 小組件間距 |
| spacing-2 | 16px | 頁面邊距 |
| spacing-3 | 24px | 卡片間距 |
| spacing-4 | 32px | 卡片內邊距 |
| spacing-5 | 40px | 大組件間距 |
| spacing-6 | 48px | 頁面主間距 |

### **4. 陰影系統**

```
Shadow-sm:   0 2px 4px rgba(0, 0, 0, 0.1)
Shadow-md:   0 4px 12px rgba(0, 0, 0, 0.1)
Shadow-lg:   0 12px 24px rgba(0, 0, 0, 0.15)
Shadow-xl:   0 20px 40px rgba(0, 0, 0, 0.2)
```

### **5. 動畫系統**

```javascript
{
  "animations": {
    "fast": { "duration": "200ms", "easing": "cubic-bezier(0.4, 0, 0.2, 1)" },
    "standard": { "duration": "300ms", "easing": "ease-out" },
    "pageTransition": { "duration": "400ms", "easing": "ease-out" },
    "complex": { "duration": "800ms", "easing": "ease-in-out" }
  }
}
```

---

## 📋 交付清單

### **給設計師的完整文件包：**

```
📦 Louise_Design_Package
├── 📄 DESIGN_SYSTEM_SUMMARY.md          （設計系統速查表）
├── 📄 DESIGN_AUDIT.md                   （設計分析）
├── 📄 COLORS.json                       （色彩系統）
├── 📄 TYPOGRAPHY.csv                    （排版系統）
├── 📄 SPACING.csv                       （間距系統）
├── 📄 ANIMATIONS.json                   （動畫規則）
├── 📸 SCREENSHOTS/                      （應用截圖）
│   ├── home-dark.png
│   ├── growth-dark.png
│   ├── daily-dark.png
│   ├── health-dark.png
│   ├── memories-dark.png
│   ├── home-light.png
│   └── ...
├── 📸 COMPONENTS/                       （組件示例）
│   ├── buttons.png
│   ├── cards.png
│   ├── inputs.png
│   └── ...
├── 📄 BRAND_GUIDE.md                    （品牌指南）
├── 📄 USER_FLOWS.md                     （用戶流程）
└── 🔗 FIGMA_LINK.txt                    （Figma 設計文件連結）
```

---

## 🎯 設計師的工作清單

給設計師的初始任務：

- [ ] 導入色彩系統到設計工具
- [ ] 建立排版樣式庫
- [ ] 建立組件庫（Button、Card、Modal、Input）
- [ ] 設計 P0 優化的頁面（Home、Growth）
- [ ] 設計 P1 動畫和交互（Hover、Active、Focus 狀態）
- [ ] 建立響應式斷點設計（mobile / tablet / desktop）
- [ ] 深色和淺色模式的完整設計
- [ ] 建立動畫時序圖和過渡規則文檔
- [ ] 準備高保真原型給開發者

---

## 🚀 快速集成步驟

### **如果設計師用 Figma：**

1. **在 Figma 中建立文件**
   ```
   File → New File → Name: "Louise Design System"
   ```

2. **導入色彩**
   - Assets → Colors → 新增所有色彩
   - 設置色彩變數

3. **建立文本樣式**
   - Assets → Typography → 建立 h1, h2, body 等樣式

4. **建立組件**
   - 每個組件作為獨立 component
   - 支持 variants（Normal, Hover, Active, Disabled）

5. **分享連結**
   - Share → 複製連結給開發者

---

## 💬 給設計師的背景說明

準備一份簡短的設計簡報：

```markdown
# Louise 成長記錄 - 設計簡報

## 項目背景
- 父母用於記錄寶寶成長數據（體重、身高、餵食、睡眠等）
- 目標用戶：年輕父母（25-40 歲）
- 平台：Web 應用（響應式設計，支持手機）

## 設計方向
- **風格**：精緻的育兒典範（Refined Parenting Exemplar）
- **靈感**：Apple Health、Notion、高級育兒產品
- **核心特質**：優雅、溫暖、可信任

## 色彩調性
- 主色：玫瑰粉（#e8909a）- 溫暖、親切
- 強調色：溫暖橙色 + 冷色藍綠色
- 背景：深色模式為主（#1e0d14 + #2d1420）

## 排版個性
- 標題：Playfair Display（優雅的 Serif）
- 正文：Inter（現代精緻的 Sans-serif）
- 組合能營造「精緻 + 可信任」的感受

## 優化優先級
1. **P0（立即）**：排版、色彩、間距系統
2. **P1（本週）**：交互狀態、動畫、過渡
3. **P2（後續）**：背景氛圍、微細節

## 響應式斷點
- Mobile: 320px - 480px
- Tablet: 481px - 1024px
- Desktop: 1025px+

## 組件庫清單
- Button（4 種狀態：Normal, Hover, Active, Disabled）
- Card（標準卡片 + Liquid Glass 卡片）
- Modal（快速記錄彈窗）
- Input（文本輸入、日期選擇）
- Stat Card（統計顯示）
- Chart（成長曲線圖表）
- Navigation（底部導航）
- FAB（浮動操作按鈕）
```

---

## ✅ 驗收標準

設計師的交付物應該包含：

- ✅ 完整的色彩系統定義（含深淺模式）
- ✅ 排版樣式庫（h1-h6, body, caption）
- ✅ 所有組件的高保真設計稿
- ✅ 所有組件的 4 種狀態（Normal/Hover/Active/Disabled）
- ✅ 響應式設計（mobile/tablet/desktop 三套）
- ✅ 動畫和過渡的詳細說明
- ✅ 可交互原型（可用 Figma prototype）
- ✅ 設計 tokens（JSON 或 CSV 格式）

---

**現在你可以把這個文件夾給設計師，讓他們在 Figma/Stitch 中開始工作了！** 🎨

