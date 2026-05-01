# Supabase 數據庫建表 SQL

> 在 Supabase SQL Editor 中執行以下語句

## 使用方法
1. 打開 [https://supabase.com/dashboard/project/uwvlduprxppwdkjkvwby/editor/sql](https://supabase.com/dashboard/project/uwvlduprxppwdkjkvwby/editor/sql)
2. 複製下方所有 SQL 代碼
3. 粘貼到 SQL Editor
4. 點擊 **Run** 或按 **Ctrl+Enter**

---

## 完整建表 SQL

```sql
-- 1. 創建 users 表
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

-- 2. 創建 growth_records 表（移除外鍵約束，避免類型不匹配）
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  record_date DATE NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC(5,2) NOT NULL,
  unit TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 創建索引
CREATE INDEX IF NOT EXISTS idx_growth_records_user_date ON growth_records(user_id, record_date DESC);

-- 4. 啟用行級安全（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- 5. 設置 RLS 政策
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON growth_records FOR ALL USING (true);
```

---

執行完成後，在 Supabase 左側點擊 **Table Editor** 應該能看到 `users` 和 `growth_records` 兩個表。
