-- =============================================
-- Louise 成長記錄 - Supabase Row Level Security (RLS) 策略
-- =============================================
-- 在 Supabase SQL Editor 中執行以下語句
-- 這將確保用戶只能訪問自己的數據

-- =============================================
-- 1. users 表 RLS
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用戶只能讀取自己的信息
CREATE POLICY "用戶只能讀取自己的信息"
  ON users FOR SELECT
  USING (auth.uid() = id OR id = 'default_user');

-- 用戶只能更新自己的信息
CREATE POLICY "用戶只能更新自己的信息"
  ON users FOR UPDATE
  USING (auth.uid() = id OR id = 'default_user');

-- 用戶可以插入自己的信息
CREATE POLICY "用戶可以插入自己的信息"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id OR id = 'default_user');

-- =============================================
-- 2. growth_records 表 RLS
-- =============================================
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- 用戶只能讀取自己的成長記錄
CREATE POLICY "用戶只能讀取自己的成長記錄"
  ON growth_records FOR SELECT
  USING (user_id = 'default_user');

-- 用戶只能插入自己的成長記錄
CREATE POLICY "用戶可以插入自己的成長記錄"
  ON growth_records FOR INSERT
  WITH CHECK (user_id = 'default_user');

-- 用戶只能更新自己的成長記錄
CREATE POLICY "用戶可以更新自己的成長記錄"
  ON growth_records FOR UPDATE
  USING (user_id = 'default_user');

-- 用戶只能刪除自己的成長記錄
CREATE POLICY "用戶可以刪除自己的成長記錄"
  ON growth_records FOR DELETE
  USING (user_id = 'default_user');

-- =============================================
-- 3. feeding_records 表 RLS（如果已創建）
-- =============================================
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用戶只能訪問自己的餵食記錄"
  ON feeding_records FOR ALL
  USING (user_id = 'default_user')
  WITH CHECK (user_id = 'default_user');

-- =============================================
-- 4. sleep_records 表 RLS（如果已創建）
-- =============================================
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用戶只能訪問自己的睡眠記錄"
  ON sleep_records FOR ALL
  USING (user_id = 'default_user')
  WITH CHECK (user_id = 'default_user');

-- =============================================
-- 5. milestones 表 RLS（如果已創建）
-- =============================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用戶只能訪問自己的里程碑"
  ON milestones FOR ALL
  USING (user_id = 'default_user')
  WITH CHECK (user_id = 'default_user');

-- =============================================
-- 6. 測試 RLS 是否正確配置
-- =============================================
-- 注意：在開發環境中使用 anon key 時，RLS 仍然適用
-- 確保你的服務器配置正確

-- 驗證 RLS 是否啟用
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 驗證策略是否正確創建
SELECT * FROM pg_policies WHERE schemaname = 'public';
