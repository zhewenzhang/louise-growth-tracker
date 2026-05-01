# Louise 成長記錄 - 部署指南

## 📦 部署到 GitHub + Zeabur

### 第 1 步：創建 GitHub 倉庫

1. 打開 [https://github.com/new](https://github.com/new)
2. 填寫倉庫名稱：`louise-growth-tracker`
3. 選擇 **Private** 或 **Public**（建議 Private，保護數據）
4. **不要** 勾選 "Initialize this repository with a README"
5. 點擊 **Create repository**

### 第 2 步：推送代碼到 GitHub

在你的本地終端執行（替換 `your-username` 為你的 GitHub 用戶名）：

```bash
cd "D:\女兒體重記錄"

# 添加遠程倉庫
git remote add origin https://github.com/your-username/louise-growth-tracker.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 第 3 步：在 Zeabur 部署

1. **註冊/登錄 Zeabur**
   - 打開 [https://zeabur.com](https://zeabur.com)
   - 點擊 "Get Started" 或 "Login"
   - 使用 GitHub 賬號授權登錄

2. **創建新項目**
   - 點擊 Dashboard 的 **"New Project"**
   - 填寫項目名稱：`louise-growth`
   - 點擊 **"Create"**

3. **連接 GitHub 倉庫**
   - 在項目頁面，點擊 **"Add Service"**
   - 選擇 **"Deploy from GitHub"**
   - 選擇你剛才創建的 `louise-growth-tracker` 倉庫
   - 點擊 **"Connect"**

4. **自動識別配置**
   - Zeabur 會自動讀取 `zeabur.json` 配置
   - 識別為 **Static Site**（靜態站點）
   - 構建命令：`npm run build`
   - 輸出目錄：`dist`

5. **配置環境變數（可選）**
   
   如果需要 Supabase 雲端同步，點擊 **"Variables"** 標籤頁添加：
   
   | 變數名 | 值 |
   |--------|-----|
   | `VITE_SUPABASE_URL` | `https://uwvlduprxppwdkjkvwby.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | 你的 anon key |

   如果不需要 Supabase，跳過此步驟，應用會自動使用本地模式。

6. **開始部署**
   - 點擊 **"Deploy"** 按鈕
   - Zeabur 會自動：
     - 克隆你的 GitHub 倉庫
     - 安裝依賴 (`npm install`)
     - 構建項目 (`npm run build`)
     - 部署到全球 CDN

7. **獲取訪問地址**
   - 部署完成後，點擊 **"Domains"** 標籤頁
   - 你會看到一個 `*.zeabur.app` 的地址
   - 點擊即可訪問你的應用

### 第 4 步：配置自定義域名（可選）

1. 在 **"Domains"** 標籤頁點擊 **"Add Domain"**
2. 輸入你的自定義域名（如 `louise.yourdomain.com`）
3. 按照提示在你的 DNS 服務商處添加 CNAME 記錄
4. 等待 DNS 生效（通常幾分鐘到幾小時）

---

## 🔄 後續更新

每次你推送代碼到 GitHub 的 `main` 分支：

```bash
# 修改代碼後
git add .
git commit -m "描述你的改動"
git push
```

Zeabur 會自動：
1. 檢測到新的提交
2. 自動觸發構建和部署
3. 部署完成後自動上線

無需手動操作！

---

## ⚠️ 重要注意事項

### 1. 環境變數安全
- `.env` 文件已在 `.gitignore` 中，不會被提交到 GitHub
- 在 Zeabur 中配置的環境變數是加密存儲的
- **不要** 在代碼中硬編碼 Supabase 密鑰

### 2. 數據存儲
- **本地模式**：數據存儲在用戶瀏覽器的 LocalStorage
  - 優點：無需服務器，完全免費
  - 缺點：清除瀏覽器數據會丟失，多設備不同步
  
- **Supabase 模式**：數據存儲在雲端
  - 優點：多設備同步，數據不丟失
  - 缺點：需要配置 Supabase（免費額度足夠個人使用）

### 3. Zeabur 免費額度
- Zeabur 提供免費額度用於個人項目
- 靜態站點通常在免費範圍內
- 如果流量很大，可能需要升級計劃

---

## 🐛 常見問題

### Q: Zeabur 構建失敗怎麼辦？
A: 檢查以下幾點：
- `package.json` 中的 `build` 腳本是否正確
- `zeabur.json` 配置是否正確
- 查看 Zeabur 的部署日誌找出錯誤原因

### Q: 部署後打開頁面是空白的？
A: 可能原因：
- 構建失敗，檢查部署日誌
- 路由配置問題，確保 `zeabur.json` 中的 routes 正確
- 瀏覽器緩存，嘗試硬刷新（Ctrl+Shift+R）

### Q: 如何在本地測試構建結果？
A: 執行以下命令：
```bash
npm run build
npm run preview
```
然後打開 `http://localhost:4173` 查看

### Q: Supabase 數據沒有同步？
A: 檢查：
- Zeabur 中的環境變數是否正確配置
- 瀏覽器控制台是否有錯誤信息
- Supabase 數據庫表是否已創建

---

## 📞 需要幫助？

如果部署過程中遇到問題：
1. 查看 Zeabur 的部署日誌
2. 檢查 GitHub Actions（如果有配置 CI/CD）
3. 參考 Zeabur 文檔：[https://zeabur.com/docs](https://zeabur.com/docs)

---

**部署完成後，你的應用將可以通過 `https://your-project.zeabur.app` 訪問！** 🎉
