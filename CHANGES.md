# 📋 修復說明與 Supabase 集成

## ✅ 已修復的問題

### 1. 引導頁數據不保存
**問題原因**：
- `Onboarding.jsx` 中使用 `...user` 擴展了舊的用戶數據
- `App.jsx` 中的 `useEffect` 可能在引導頁完成前重置了用戶數據

**修復方案**：
- `Onboarding.jsx` 現在直接創建新的用戶對象，不再擴展舊數據
- `App.jsx` 只在第一次加載時檢查是否需要引導頁，不會覆蓋已保存的數據

### 2. 如何測試修復
1. 清除瀏覽器 localStorage：
   - 打開瀏覽器控制台（F12）
   - 執行 `localStorage.clear()`
   - 刷新頁面
2. 你應該會看到引導頁
3. 填寫信息並完成引導
4. 首頁應該顯示你剛才填寫的名字

---

## 🗄️ Supabase 數據庫集成

### 已完成的內容

1. **安裝 Supabase SDK** ✅
   - `@supabase/supabase-js` 已添加到項目

2. **創建配置文件** ✅
   - `.env.example` - 環境變數模板
   - `src/lib/supabase.js` - Supabase 客戶端
   - `src/services/syncService.js` - 數據同步服務

3. **更新 AppContext** ✅
   - 自動從 Supabase 加載數據
   - 數據變化時自動同步
   - 支持實時監聽遠程更新
   - Supabase 不可用時自動降級為本地模式

4. **創建設置文檔** ✅
   - `SUPABASE_SETUP.md` - 完整的 Supabase 設置指南

### 如何使用 Supabase

#### 步驟 1：創建 Supabase 項目
1. 前往 https://supabase.com
2. 註冊並創建新項目
3. 複製 Project URL 和 anon key

#### 步驟 2：配置環境變數
```bash
# 複製模板
cp .env.example .env

# 編輯 .env，填寫你的 Supabase 信息
```

#### 步驟 3：創建數據庫表
1. 在 Supabase 儀表板打開 SQL Editor
2. 複製 `SUPABASE_SETUP.md` 中的 SQL 語句執行
3. 確保啟用了 RLS 政策和實時功能

#### 步驟 4：測試連接
```bash
npm run dev
```
打開瀏覽器控制台，應該看到：
```
🔄 初始化 Supabase...
```

### 同步邏輯

**本地模式**（未配置 Supabase）：
- 所有數據保存在 localStorage
- 控制台顯示：`📱 Supabase 未配置 - 使用本地模式`

**雲端模式**（已配置 Supabase）：
1. 啟動時從 Supabase 加載數據
2. 數據變化時自動同步到 Supabase
3. 監聽 Supabase 實時更新
4. 多設備之間數據自動同步

### 數據表結構

| 表名 | 用途 | 字段 |
|------|------|------|
| `users` | 用戶基本信息 | id, name, birth_date, gender, birth_weight, birth_height |
| `growth_records` | 成長記錄 | id, user_id, record_date, type, value, unit, note |
| `feeding_records` | 餵食記錄（可選） | id, user_id, record_date, type, duration, amount |
| `sleep_records` | 睡眠記錄（可選） | id, user_id, record_date, duration, quality |
| `milestones` | 里程碑（可選） | id, user_id, record_date, title, icon, note |

---

## 🚀 下一步

1. **測試引導頁修復** - 清除 localStorage 後重新訪問應用
2. **配置 Supabase** - 按照 `SUPABASE_SETUP.md` 設置雲端數據庫
3. **測試數據同步** - 在一個設備添加記錄，在另一個設備查看

---

需要幫助嗎？查看 `SUPABASE_SETUP.md` 獲取詳細的設置指南。
