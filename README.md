# 👶 Louise 成長記錄

**Louise 是我們的女兒，34 週又 6 天早產來到這個世界。這個小小的 App，是我們記錄她每一天成長的地方。**

---

## ✨ 功能一覽

| 功能 | 說明 |
|------|------|
| 📏 **成長追蹤** | 記錄體重、身高、頭圍、胸圍，搭配 WHO 百分位曲線即時對比 |
| 🍼 **奶量記錄** | 分開記錄母乳與配方奶，自動計算 ml/kg/day 是否達標 |
| 💉 **疫苗管理** | 支援台灣 18 劑標準疫苗 + 自訂疫苗，可手動編輯日期 |
| 🎉 **里程碑** | 直覺的縱向時間軸，記錄寶寶的每一個第一次 |
| 📝 **成長日記** | 每天寫下想記住的事，點日期回顧 |
| 👶 **矯正月齡** | 針對早產兒自動計算矯正週齡，所有評估以矯正月齡為準 |
| 📱 **PWA 支援** | 可加到手機桌面，離線也可使用 |
| ☁️ **Firebase 同步** | 資料即時備份到雲端，換手機也不怕 |

## 🛠️ 技術架構

```
Louise Growth Tracker
├── React 18 · Vite 5 · Tailwind CSS 3
├── Firebase Firestore (雲端儲存)
├── localStorage (即時快取)
├── Chart.js · react-chartjs-2 (圖表)
├── lucide-react (圖標)
├── PWA · Service Worker
└── 手繪風格設計系統 ✏️
```

## 🎨 設計特色

沒有直角、沒有柔和陰影。我們用的是：

- **波浪邊框**：`border-radius: 255px 15px 225px 15px`
- **硬陰影**：`box-shadow: 4px 4px 0px 0px #2d2d2d`
- **手寫字體**：Kalam + Patrick Hand
- **紙紋背景**：點狀筆記本質感
- **便利貼**：黃色貼紙風格元件

每一個細節都讓這個 App 看起來像是手繪筆記本，而不是冷冰冰的生產力工具。

## 🚀 開發

```bash
npm install      # 安裝依賴
npm run dev      # 本機開發
npm run build    # 打包
npx gh-pages -d dist  # 部署
```

## 🌐 網址

[https://zhewenzhang.github.io/louise-growth-tracker/](https://zhewenzhang.github.io/louise-growth-tracker/)

---

*從 2026 年 4 月 26 日開始，每一天都在長大。*
