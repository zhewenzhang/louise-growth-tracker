# Supabase 數據庫設置指南

## 1. 創建 Supabase 項目

1. 前往 [https://supabase.com](https://supabase.com)
2. 點擊 "Start your project"
3. 使用 GitHub 賬號登錄
4. 點擊 "New project"
5. 選擇組織（或創建一個）
6. 填寫項目名稱（如 `louise-growth-tracker`）
7. 設置數據庫密碼（請保存好）
8. 選擇區域（推薦 `Singapore` 或 `Tokyo`，離亞洲用戶近）
9. 點擊 "Create new project"（等待約 2 分鐘）

## 2. 獲取 API 信息

1. 進入項目後，點擊左側菜單的 **Settings**（齒輪圖標）
2. 點擊 **API**
3. 複製以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`（很長一串）

## 3. 配置環境變數

1. 在項目根目錄複製 `.env.example` 到 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 文件，填寫你的 Supabase 信息：
   ```env
   VITE_SUPABASE_URL=https://你的項目ID.supabase.co
   VITE_SUPABASE_ANON_KEY=你的anon-key
   ```

3. **重要**：`.env` 文件已經在 `.gitignore` 中，不會被提交到 Git

## 4. 創建數據庫表

在 Supabase 儀表板中，點擊左側的 **SQL Editor**，然後執行以下 SQL：

### 創建 users 表
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  birth_weight NUMERIC(5,2),
  birth_height NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);
```

### 創建 growth_records 表
```sql
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight', 'height', 'headCircumference')),
  value NUMERIC(5,2) NOT NULL,
  unit TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_growth_records_user_date 
  ON growth_records(user_id, record_date DESC);

CREATE INDEX IF NOT EXISTS idx_growth_records_type 
  ON growth_records(type);
```

### 創建 feeding_records 表（可選）
```sql
CREATE TABLE IF NOT EXISTS feeding_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_time TIME,
  type TEXT NOT NULL CHECK (type IN ('breastfeeding', 'formula', 'solid')),
  duration INTEGER,
  amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feeding_records_user_date 
  ON feeding_records(user_id, record_date DESC);
```

### 創建 sleep_records 表（可選）
```sql
CREATE TABLE IF NOT EXISTS sleep_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration INTEGER NOT NULL,
  quality TEXT CHECK (quality IN ('good', 'normal', 'poor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date 
  ON sleep_records(user_id, record_date DESC);
```

### 創建 milestones 表（可選）
```sql
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎉',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_date 
  ON milestones(user_id, record_date DESC);
```

## 5. 啟用實時功能

1. 在 Supabase 儀表板點擊 **Database** > **Replication**
2. 確保以下表的實時已啟用：
   - `users`
   - `growth_records`
   - `feeding_records`
   - `sleep_records`
   - `milestones`

## 6. 設置行級安全（RLS）政策

為了安全起見，建議設置 RLS 政策：

```sql
-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- 允許匿名讀取和寫入（單用戶模式簡化版）
CREATE POLICY "Allow all access" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access" ON growth_records FOR ALL USING (true);
CREATE POLICY "Allow all access" ON feeding_records FOR ALL USING (true);
CREATE POLICY "Allow all access" ON sleep_records FOR ALL USING (true);
CREATE POLICY "Allow all access" ON milestones FOR ALL USING (true);
```

## 7. 測試連接

1. 確保 `.env` 文件已正確配置
2. 重啟開發服務器：
   ```bash
   npm run dev
   ```
3. 打開瀏覽器控制台（F12），應該看到：
   ```
   🔄 初始化 Supabase...
   ```

## 8. 驗證數據同步

1. 在應用中添加一條成長記錄
2. 在 Supabase 儀表板點擊 **Table Editor**
3. 查看 `growth_records` 表，應該能看到剛才添加的記錄

## 常見問題

### Q: 看到 "Supabase 未配置 - 使用本地模式"
A: 這意味著 `.env` 文件不存在或未正確配置。檢查：
- `.env` 文件是否存在於項目根目錄
- 變數名是否正確（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
- 值是否正確複製（不要有多餘空格）

### Q: 數據沒有同步
A: 檢查：
- 數據庫表是否已創建
- RLS 政策是否設置正確
- 瀏覽器控制台是否有錯誤信息

### Q: 如何遷移現有本地數據到 Supabase？
A: 當前版本會在首次配置 Supabase 後自動將本地數據同步上去。如果你已經有本地數據：
1. 配置 `.env`
2. 重啟應用
3. 應用會自動將 localStorage 中的數據同步到 Supabase
