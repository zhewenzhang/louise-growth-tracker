# Qwen Code - 設計文檔組織 Prompt

> 📋 複製此內容，粘貼到 Qwen Code 中執行
> 🎯 目標：將所有設計文檔整理到統一的設計文件夾中

---

## 📌 給 Qwen Code 的完整 Prompt

```
我需要你幫我整理和組織 Louise 成長記錄應用的設計文檔。

請按照以下步驟執行：

### 第 1 步：建立文件夾結構

在 D:\女兒體重記錄 目錄下，建立以下文件夾結構：

```
📦 DESIGN_DOCS/
├── 📂 01_Design_System/
│   ├── CLAUDE_DESIGN_SYSTEM.md
│   └── DESIGN_SYSTEM_SUMMARY.md (新建：簡版)
│
├── 📂 02_Design_Audit/
│   ├── DESIGN_AUDIT_AND_ENHANCEMENT.md
│   ├── FINAL_VERIFICATION_REPORT.md
│   └── 設計審查概要.txt (新建：簡明版)
│
├── 📂 03_Implementation_Guides/
│   ├── P0_IMPLEMENTATION_GUIDE.md
│   ├── DESIGN_HANDOFF_PACKAGE.md
│   └── 實施檢查清單.txt (新建)
│
├── 📂 04_Product_Roadmap/
│   ├── OPTIMIZATION_ROADMAP.md
│   └── 產品規劃概要.txt (新建：簡版)
│
├── 📂 05_Data_Formats/
│   ├── COLORS.json (新建：從設計系統提取)
│   ├── TYPOGRAPHY.csv (新建：從設計系統提取)
│   ├── SPACING.csv (新建：從設計系統提取)
│   ├── SHADOWS.json (新建：從設計系統提取)
│   └── ANIMATIONS.json (新建：從設計系統提取)
│
└── 📄 INDEX.md (新建：總索引和導航)
```

### 第 2 步：複製和移動現有文件

- 將 CLAUDE_DESIGN_SYSTEM.md 複製到 01_Design_System/
- 將 DESIGN_AUDIT_AND_ENHANCEMENT.md 複製到 02_Design_Audit/
- 將 FINAL_VERIFICATION_REPORT.md 複製到 02_Design_Audit/
- 將 P0_IMPLEMENTATION_GUIDE.md 複製到 03_Implementation_Guides/
- 將 DESIGN_HANDOFF_PACKAGE.md 複製到 03_Implementation_Guides/
- 將 OPTIMIZATION_ROADMAP.md 複製到 04_Product_Roadmap/

### 第 3 步：建立 5 份新文件

#### 3.1 DESIGN_SYSTEM_SUMMARY.md (在 01_Design_System/)
內容：CLAUDE_DESIGN_SYSTEM.md 的簡版（只保留最關鍵的部分）
- 色彩系統快速參考
- 排版規則速查表
- 間距和陰影的簡明版本

#### 3.2 設計審查概要.txt (在 02_Design_Audit/)
內容：DESIGN_AUDIT_AND_ENHANCEMENT.md 的 1 頁概要
- 當前設計評分
- 5 個主要問題
- P0/P1/P2 優化清單

#### 3.3 實施檢查清單.txt (在 03_Implementation_Guides/)
內容：所有實施步驟的檢查清單
- P0 實施清單
- P1 實施清單
- P2 實施清單

#### 3.4 產品規劃概要.txt (在 04_Product_Roadmap/)
內容：OPTIMIZATION_ROADMAP.md 的 1 頁概要
- Phase 1-3 概述
- 優先級矩陣
- 時間表估計

#### 3.5 INDEX.md (在 DESIGN_DOCS/ 根目錄)
內容：完整的設計文檔導航和索引
```markdown
# Louise 成長記錄 - 設計文檔中心

> 所有設計資源的統一入口

## 📚 文件夾導航

### 01. 設計系統 (Design System)
- `CLAUDE_DESIGN_SYSTEM.md` - 完整設計規範
- `DESIGN_SYSTEM_SUMMARY.md` - 快速參考（推薦首先閱讀）

**適用於：** 設計師、開發者建立設計系統

---

### 02. 設計審查 (Design Audit)
- `DESIGN_AUDIT_AND_ENHANCEMENT.md` - 詳細的設計分析和 10 項優化建議
- `FINAL_VERIFICATION_REPORT.md` - 代碼改進驗收報告
- `設計審查概要.txt` - 1 頁快速概要

**適用於：** 了解當前設計狀況和改進方向

---

### 03. 實施指南 (Implementation Guides)
- `P0_IMPLEMENTATION_GUIDE.md` - P0 優化的詳細實施步驟（給 Qwen Code）
- `DESIGN_HANDOFF_PACKAGE.md` - 給 UI 設計工具的交付包說明
- `實施檢查清單.txt` - 實施驗收清單

**適用於：** Qwen Code 實施設計改進

---

### 04. 產品規劃 (Product Roadmap)
- `OPTIMIZATION_ROADMAP.md` - 6 個月的完整產品規劃
- `產品規劃概要.txt` - 1 頁快速概要

**適用於：** 了解產品長期方向和優先級

---

### 05. 設計數據格式 (Data Formats)
JSON 和 CSV 格式的設計系統數據，可直接導入設計工具：
- `COLORS.json` - 色彩系統
- `TYPOGRAPHY.csv` - 排版系統
- `SPACING.csv` - 間距系統
- `SHADOWS.json` - 陰影系統
- `ANIMATIONS.json` - 動畫規則

**適用於：** Figma / Stitch / Adobe XD 等設計工具

---

## 🎯 快速開始指南

### 我是設計師，想在 Figma/Stitch 中開始設計
👉 **步驟：**
1. 閱讀 `01_Design_System/DESIGN_SYSTEM_SUMMARY.md` (5 分鐘)
2. 查閱 `05_Data_Formats/` 中的 JSON/CSV 文件 (2 分鐘)
3. 參考 `DESIGN_AUDIT_AND_ENHANCEMENT.md` 的設計方向 (10 分鐘)
4. 開始在設計工具中建立設計系統

### 我是開發者，想用 Qwen Code 實施設計改進
👉 **步驟：**
1. 閱讀 `02_Design_Audit/設計審查概要.txt` (3 分鐘)
2. 查看 `03_Implementation_Guides/P0_IMPLEMENTATION_GUIDE.md` (20 分鐘)
3. 按照指南給 Qwen Code 下指令實施

### 我想了解產品的長期方向
👉 **步驟：**
1. 閱讀 `04_Product_Roadmap/產品規劃概要.txt` (5 分鐘)
2. 深入閱讀 `OPTIMIZATION_ROADMAP.md` (20 分鐘)

---

## 📊 設計進度

| 階段 | 狀態 | 預期時間 |
|------|------|---------|
| P0 設計優化（排版、色彩、間距） | 📋 計劃中 | 1-2 天 |
| P1 設計優化（動畫、交互、列表） | 📋 計劃中 | 3-5 天 |
| P2 設計優化（背景、微細節） | 📋 計劃中 | 1 周 |
| Phase 2 產品功能 | 📋 計劃中 | 8-10 周 |

---

## 🔗 重要連結

- 🎨 當前應用：D:\女兒體重記錄\src\
- 📱 首頁組件：src/components/pages/Home.jsx
- 🎯 設計系統配置：src/index.css + tailwind.config.js

---

**上次更新：2026-05-01**
```

### 第 4 步：建立 5 份數據導出文件

#### 4.1 COLORS.json (在 05_Data_Formats/)
```json
{
  "colors": {
    "primary": {
      "rose": "#e8909a",
      "rose_light": "#f0b8c0",
      "rose_deep": "#c06878"
    },
    "accent": {
      "warm": "#f5a85c",
      "cool": "#7acaca"
    },
    "background": {
      "dark": "#1e0d14",
      "dark_secondary": "#2d1420",
      "dark_tertiary": "#3a1f2d",
      "light": "#f5f1ed",
      "light_secondary": "#ece8e3"
    },
    "neutrals": {
      "text_primary": "rgba(255, 255, 255, 0.95)",
      "text_secondary": "rgba(255, 255, 255, 0.65)",
      "text_tertiary": "rgba(255, 255, 255, 0.40)",
      "border": "rgba(232, 144, 154, 0.15)"
    }
  }
}
```

#### 4.2 TYPOGRAPHY.csv (在 05_Data_Formats/)
```csv
Layer,Font,Size,Weight,LineHeight,LetterSpacing,Usage
h1,Playfair Display,3.5rem,700,1.1,-0.02em,Page Title
h2,Playfair Display,2.5rem,600,1.2,-0.015em,Subtitle
h3,Playfair Display,1.5rem,600,1.3,-,Small Title
body,Inter,1rem,400,1.7,0.3px,Body Text
caption,Inter,0.875rem,500,1.5,-,Helper Text
```

#### 4.3 SPACING.csv (在 05_Data_Formats/)
```csv
Name,Value,Usage
spacing-1,8px,Small component spacing
spacing-2,16px,Page padding
spacing-3,24px,Card spacing
spacing-4,32px,Card padding
spacing-5,40px,Large component spacing
spacing-6,48px,Page main spacing
```

#### 4.4 SHADOWS.json (在 05_Data_Formats/)
```json
{
  "shadows": {
    "sm": "0 2px 4px rgba(0, 0, 0, 0.1)",
    "md": "0 4px 12px rgba(0, 0, 0, 0.1)",
    "lg": "0 12px 24px rgba(0, 0, 0, 0.15)",
    "xl": "0 20px 40px rgba(0, 0, 0, 0.2)"
  }
}
```

#### 4.5 ANIMATIONS.json (在 05_Data_Formats/)
```json
{
  "animations": {
    "fast": {
      "duration": "200ms",
      "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    "standard": {
      "duration": "300ms",
      "easing": "ease-out"
    },
    "pageTransition": {
      "duration": "400ms",
      "easing": "ease-out"
    },
    "complex": {
      "duration": "800ms",
      "easing": "ease-in-out"
    }
  }
}
```

### 第 5 步：驗證和報告

完成後，請輸出以下內容：

1. 確認已建立的文件夾結構
2. 列出所有複製和新建的文件
3. 生成一份完成報告：
```
✅ DESIGN_DOCS 文件夾組織完成

📊 統計信息：
- 建立文件夾：5 個
- 複製文件：7 個
- 新建文件：10 個
- 總文件數：17 個

📁 路徑：D:\女兒體重記錄\DESIGN_DOCS\

📖 導航文件：INDEX.md（在 DESIGN_DOCS 根目錄）

✨ 下一步：
1. 將 DESIGN_DOCS 文件夾分享給設計師
2. 設計師從 INDEX.md 開始閱讀
3. 使用 05_Data_Formats/ 中的 JSON/CSV 導入設計工具
```
```

---

## 📌 複製粘貼完整 Prompt（選項 B - 簡化版）

如果上面太長，這是簡化版本：

```
請幫我建立一個 DESIGN_DOCS 文件夾，用來整理 Louise 成長記錄應用的所有設計文檔。

文件夾結構：
- 01_Design_System/（設計系統）
- 02_Design_Audit/（設計審查）
- 03_Implementation_Guides/（實施指南）
- 04_Product_Roadmap/（產品規劃）
- 05_Data_Formats/（數據格式：JSON 和 CSV）

請執行：
1. 建立上述文件夾結構
2. 複製現有的 MD 文件到對應文件夾
3. 建立 INDEX.md 作為導航文件
4. 從設計系統提取色彩、排版、間距、陰影、動畫數據並保存為 JSON 或 CSV
5. 驗證完成並報告

謝謝！
```

---

## 💡 使用建議

### 方式 1：完整詳細版（推薦）
- 複製上面「📌 給 Qwen Code 的完整 Prompt」整個段落
- 粘貼到 Qwen Code
- Qwen Code 會按步驟執行

### 方式 2：簡化版
- 複製「簡化版本」部分
- 粘貼到 Qwen Code
- 更快但細節少一些

### 方式 3：對話方式
- 開始對話：「幫我整理設計文檔」
- 讓 Qwen Code 提出建議
- 確認後執行

---

## ✅ 預期成果

執行完成後，你將擁有：

```
📦 DESIGN_DOCS/
├── 📂 01_Design_System/          (設計師用)
├── 📂 02_Design_Audit/           (了解現狀用)
├── 📂 03_Implementation_Guides/  (Qwen Code 用)
├── 📂 04_Product_Roadmap/        (產品規劃用)
├── 📂 05_Data_Formats/           (導入工具用)
└── 📄 INDEX.md                   (統一入口)

✨ 所有設計資源在同一地方，易於查找和分享！
```

---

**準備好了嗎？複製上面的 Prompt 給 Qwen Code 吧！** 🚀
