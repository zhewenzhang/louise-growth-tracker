# Qwen Code - 登錄與家庭分享功能 Prompt

> 📋 複製此內容，粘貼到 Qwen Code 中執行  
> 🎯 目標：實現 MVP 版本登錄和家庭分享功能  
> ⏱️ 預期耗時：1-2 週  
> 📊 優先級：Phase 2 核心功能

---

## 完整 Prompt（適合 Qwen Code）

```
你好！我需要你幫我在 Louise 成長記錄應用中添加登錄和家庭分享功能。

【核心需求】
應用目前是完全本地化的單用戶系統，我希望添加：
1. 用戶認證（用戶名+密碼登錄）
2. 家庭分享功能（多人協作記錄同一個寶寶）
3. 邀請碼機制（簡單加入家庭）

當前應用架構：
- React 18 + Vite + Tailwind CSS
- 使用 Supabase（已配置，但無認證）
- LocalStorage 本地存儲 + 可選 Supabase 同步
- 6 個頁面（Home、Growth、Daily、Health、Memories）

【實施方案】
我已經為你準備了詳細的規劃文檔：`louise-auth-family-sharing.md`

請按照以下順序實施（MVP 版本）：

## STEP 1: 後端準備（Supabase）

### 1.1 建立以下表結構：

```sql
-- 1. 用戶資料擴展表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 家庭表
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_code VARCHAR(6) UNIQUE NOT NULL,
  family_name VARCHAR NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 孩子表
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR,
  birth_weight FLOAT,
  birth_height FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 家庭成員表
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);
```

### 1.2 在 Supabase RLS 中設置以下策略：
- user_profiles: 用戶只能看和編輯自己的
- families: 只有成員才能訪問
- babies: 只有家庭成員才能訪問
- family_members: 只有成員才能看到

## STEP 2: 前端結構建立

### 2.1 新建以下文件：

**contexts/**
```
contexts/AuthContext.jsx          - 認證狀態管理
contexts/FamilyContext.jsx        - 家庭狀態管理
```

**pages/Auth/**
```
pages/Auth/LoginPage.jsx          - 登錄頁面
pages/Auth/SignupPage.jsx         - 註冊頁面
pages/Auth/FamilySelectPage.jsx   - 家庭選擇/建立頁面
```

**services/**
```
services/authService.js           - 認證邏輯
services/familyService.js         - 家庭邏輯
```

**components/**
```
components/FamilyHeader.jsx       - 顯示當前家庭和用戶
components/InviteModal.jsx        - 邀請碼彈窗
components/CreateFamilyModal.jsx  - 建立家庭彈窗
```

### 2.2 AuthContext.jsx 應包含：
```javascript
// 狀態
- user: 當前登錄用戶 (null 或 user object)
- loading: boolean
- error: string or null

// 方法
- signup(email, username, password)
- login(email, password)
- logout()
- getCurrentUser()
- checkAuthStatus()

// 效果
- 監聽 Supabase auth state 變化
- 保存會話到 localStorage
```

### 2.3 FamilyContext.jsx 應包含：
```javascript
// 狀態
- currentFamily: 當前選中的家庭 (null 或 family object)
- currentBaby: 當前選中的孩子 (null 或 baby object)
- families: 用戶所有家庭列表
- familyMembers: 當前家庭的成員列表
- loading: boolean

// 方法
- selectFamily(familyId)
- selectBaby(babyId)
- createFamily(familyName, babyInfo)
- generateInviteCode(familyId)
- joinFamilyByCode(inviteCode)
- getFamilies(userId)
- getFamilyMembers(familyId)
```

## STEP 3: 認證服務實施（authService.js）

實現以下函數：

```javascript
// 使用 Supabase Auth
- signup(email, username, password)
  * 在 auth.users 中建立用戶
  * 在 user_profiles 中存儲用戶名
  * 返回成功/錯誤信息

- login(email, password)
  * 驗證用戶憑證
  * 返回 session

- logout()
  * 清除 Supabase session
  * 清除 localStorage 中的會話

- getCurrentUser()
  * 返回當前登錄用戶信息

- updateUserProfile(userId, username, displayName)
  * 更新 user_profiles 表
```

## STEP 4: 家庭服務實施（familyService.js）

實現以下函數：

```javascript
// 家庭相關
- createFamily(familyName, babyInfo, userId)
  * 在 families 表建立新家庭
  * 生成 6 位邀請碼
  * 在 babies 表建立寶寶
  * 在 family_members 表添加創建者

- generateInviteCode(familyId)
  * 生成 6 位唯一邀請碼
  * 確保碼在 families.family_code 中唯一

- joinFamilyByCode(inviteCode, userId)
  * 驗證邀請碼是否存在和有效
  * 在 family_members 中添加用戶
  * 返回加入結果

- getFamilies(userId)
  * 查詢 family_members 找出用戶所有家庭
  * 返回家庭列表

- getFamilyMembers(familyId)
  * 查詢 family_members 表
  * 返回該家庭所有成員

- selectFamily(familyId)
  * 設置當前選中的家庭
  * 存儲到 localStorage

- selectBaby(babyId)
  * 設置當前選中的孩子
  * 存儲到 localStorage
```

## STEP 5: 認證頁面實施

### 5.1 LoginPage.jsx
UI 應包括：
- 郵箱或用戶名輸入框
- 密碼輸入框
- 登錄按鈕
- 「沒有賬戶？去註冊」連結
- 錯誤提示區域

功能：
- 驗證輸入
- 調用 authService.login()
- 成功 → 跳轉到 FamilySelectPage
- 失敗 → 顯示錯誤信息

### 5.2 SignupPage.jsx
UI 應包括：
- 用戶名輸入框（實時檢查唯一性）
- 郵箱輸入框
- 密碼輸入框（至少 8 字符）
- 確認密碼輸入框
- 註冊按鈕
- 「已有賬戶？去登錄」連結

功能：
- 驗證密碼匹配
- 驗證郵箱格式
- 驗證用戶名唯一性
- 調用 authService.signup()
- 成功 → 自動登錄並跳轉到 FamilySelectPage
- 失敗 → 顯示錯誤信息

### 5.3 FamilySelectPage.jsx
情況 1：用戶已有家庭
- 列表顯示所有家庭
- 點擊家庭進入
- 「建立新家庭」按鈕

情況 2：用戶沒有家庭
- 顯示空狀態提示
- 「建立新家庭」按鈕
- 「加入家庭」按鈕

### 5.4 CreateFamilyModal.jsx（在 FamilySelectPage 中使用）
表單應包括：
- 家庭名稱輸入框
- 寶寶名稱輸入框
- 出生日期選擇器
- 性別選擇（男/女/其他）
- 出生體重輸入（可選）
- 出生身高輸入（可選）
- 建立按鈕
- 取消按鈕

### 5.5 InviteModal.jsx（在 FamilySelectPage 中使用）
表單應包括：
- 邀請碼輸入框（6 位數字）
- 加入按鈕
- 取消按鈕
- 錯誤提示（無效碼、已加入等）

## STEP 6: 修改現有頁面和上下文

### 6.1 修改 App.jsx
路由邏輯應為：
```
1. 檢查 AuthContext.user 是否存在
2. 未登錄 → 顯示 LoginPage（如果是新用戶）或 SignupPage
3. 已登錄但無家庭 → 顯示 FamilySelectPage
4. 已登錄且有家庭 → 顯示主應用（Navigation + 6 個頁面）
5. 在主應用頁面頂部/導航欄顯示 FamilyHeader（當前用戶和家庭）
```

### 6.2 修改 AppContext.jsx
- 添加 familyId 和 babyId 狀態
- 修改所有數據查詢加上 family_id 篩選
- 添加 syncData() 時檢查登錄狀態和家庭選擇

### 6.3 修改 syncService.js
- 原來的 user_id: 'default_user' 改為當前登錄用戶 ID
- 添加 family_id 和 baby_id 參數
- 所有 upsert、select、subscribe 都要包含 family_id

### 6.4 修改 Home.jsx
- 在頂部添加 FamilyHeader 組件
- 顯示當前家庭和登錄用戶
- 添加「家庭設置」按鈕（點擊顯示邀請碼和成員列表）
- 添加「用戶菜單」（設置、登出）

## STEP 7: 實時協作（可選但推薦）

修改 syncService.js，添加 Supabase 實時訂閱：
```javascript
// 當家庭成員添加/修改記錄時，實時更新 UI
supabase
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'growth_records' },
    (payload) => {
      if (payload.new.family_id === currentFamilyId) {
        // 更新 UI
      }
    }
  )
  .subscribe()
```

## STEP 8: 測試驗收

完成後，請驗證以下項目：

認證測試：
- [ ] 註冊新用戶成功
- [ ] 登錄成功並保存會話
- [ ] 刷新頁面後仍保持登錄狀態
- [ ] 登出成功並清除會話

家庭管理測試：
- [ ] 建立新家庭成功
- [ ] 邀請碼可複製
- [ ] 用邀請碼加入家庭成功（使用另一個用戶）
- [ ] 無效邀請碼提示錯誤
- [ ] 多個家庭可切換

數據隔離測試：
- [ ] 家庭 A 的數據不會出現在家庭 B
- [ ] 每個家庭有獨立的寶寶記錄
- [ ] 權限檢查：未登錄用戶無法訪問數據

實時協作測試：
- [ ] 成員 1 添加記錄 → 成員 2 實時看到更新
- [ ] 多設備登錄同一家庭 → 數據同步

UI/UX 測試：
- [ ] 登錄/註冊頁面美觀
- [ ] 錯誤提示清晰
- [ ] 手機、平板、桌面都能正常顯示
- [ ] 無殘障訪問支持（TAB 鍵導航等）

## 注意事項

1. **安全考慮**
   - 密碼應該至少 8 字符
   - 邀請碼應該是唯一的且有效期可考慮
   - 使用 Supabase RLS 保護數據

2. **性能考慮**
   - 使用 useMemo 優化組件重新渲染
   - 實時訂閱應該在組件卸載時清理

3. **離線模式**
   - MVP 版本可不支持完整離線，但應該告知用戶需要網絡
   - 後期可優化為本地優先 + 後台同步

4. **環境配置**
   - 確保 .env 中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 正確
   - 不要提交 .env 到代碼庫

## 參考資源

- 詳細規劃文檔：louise-auth-family-sharing.md
- Supabase 文檔：https://supabase.com/docs
- Supabase Auth：https://supabase.com/docs/guides/auth
- RLS 策略：https://supabase.com/docs/guides/auth/row-level-security

準備好了嗎？ 🚀 按照上面的步驟依次實施，有問題隨時告訴我！
```

---

## 簡化版 Prompt（快速版）

如果上面太長，用這個簡化版：

```
我需要在 Louise 成長記錄應用中添加登錄和家庭分享功能。

【需求】
1. 用戶認證（用戶名+密碼，使用 Supabase Auth）
2. 家庭分享（多人協作記錄同一寶寶）
3. 邀請碼機制（簡單加入）

【實施順序】
1. Supabase 後端：建立 user_profiles、families、babies、family_members 表
2. 前端 Context：AuthContext（認證狀態）+ FamilyContext（家庭狀態）
3. 認證服務：signup/login/logout 邏輯
4. 家庭服務：建立家庭、生成邀請碼、加入家庭、獲取家庭信息
5. 新建頁面：LoginPage、SignupPage、FamilySelectPage
6. 修改現有：App.jsx（路由邏輯）、AppContext.jsx（支持多家庭）、Home.jsx（添加用戶信息）
7. 測試驗收

詳細規劃見：louise-auth-family-sharing.md
```

---

## 📌 複製哪個版本？

- **完整版**（推薦）：適合仔細理解和執行
- **簡化版**（快速）：如果 Qwen Code 能理解簡要指令

---

## 💡 執行後的驗證步驟

完成後，你可以通過以下方式驗證：

1. **本地測試**
```
npm run dev
→ 應該跳轉到登錄頁面（因為未登錄）
→ 註冊新用戶
→ 建立新家庭
→ 添加記錄
→ 邀請另一個用戶加入
→ 驗證數據同步
```

2. **多用戶測試**
```
用戶 A：建立家庭「Louise」，邀請碼為 ABC123
用戶 B：用邀請碼 ABC123 加入
用戶 A 添加記錄 → 用戶 B 看到實時更新
```

3. **權限隔離**
```
用戶 A 的家庭「Louise」
用戶 C 的家庭「Alice」
用戶 A 登錄 → 只看到 Louise 的數據
用戶 C 登錄 → 只看到 Alice 的數據
```

---

**準備好開始了嗎？複製上面的 Prompt 給 Qwen Code！** 🚀

