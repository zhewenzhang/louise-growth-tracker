# Louise 成長記錄系統

一個精美的寶寶成長記錄應用，支持：

- 📊 **多維度記錄**：體重、身高、頭圍
- 📈 **WHO 成長曲線對比**：P3/P50/P97 百分位
- 🍼 **日常記錄**：餵食、睡眠
- 🎉 **里程碑**：記錄重要時刻 + 慶祝動畫
- 💌 **信件**：寫給寶寶的未來信件
- 💉 **健康記錄**：疫苗、就醫、用藥
- 💾 **數據備份**：JSON 導出/導入
- ☁️ **Supabase 雲端同步**：多設備數據同步
- 🌙 **深色/淺色主題**：自動切換
- 📱 **響應式設計**：完美適配手機和桌面

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 預覽生產構建
npm run preview
```

### 部署到 Zeabur

1. **推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用戶名/louise-growth-tracker.git
   git push -u origin main
   ```

2. **在 Zeabur 部署**
   - 打開 [https://zeabur.com](https://zeabur.com)
   - 點擊 "New Project"
   - 連接你的 GitHub 倉庫
   - Zeabur 會自動識別 `zeabur.json` 配置
   - 點擊 "Deploy"

3. **配置環境變數（可選）**
   
   如果需要 Supabase 雲端同步，在 Zeabur 控制台添加：
   - `VITE_SUPABASE_URL`：你的 Supabase 項目 URL
   - `VITE_SUPABASE_ANON_KEY`：你的 Supabase anon key

   如果不配置這些變數，應用會自動使用本地模式（LocalStorage）。

## 📁 項目結構

```
louise-growth-tracker/
├── src/
│   ├── components/          # React 組件
│   │   ├── pages/           # 頁面組件
│   │   └── shared/          # 共享組件
│   ├── context/             # React Context
│   ├── hooks/               # 自定義 Hooks
│   ├── lib/                 # 第三方庫配置
│   ├── services/            # 服務層（Supabase 同步）
│   └── styles/              # CSS 樣式
├── public/                  # 靜態資源
├── index.html               # HTML 入口
├── vite.config.js           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── zeabur.json              # Zeabur 部署配置
└── package.json
```

## 🗄️ Supabase 設置（可選）

如果你想要雲端數據同步：

1. 在 [https://supabase.com](https://supabase.com) 創建項目
2. 複製 `.env.example` 到 `.env` 並填寫你的 Supabase 信息
3. 在 Supabase SQL Editor 中執行 `supabase-init.sql` 創建數據庫表

詳細指南請查看 `SUPABASE_SETUP.md`

## 🎨 設計特點

- **Liquid Glass Morphism** 設計風格
- **Playfair Display** + **Inter** 字體組合
- 玫瑰粉色系為主色調
- 統一的 8px 間距系統
- 完整的深色/淺色主題支持

## 📄 許可證

MIT
