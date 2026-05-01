# Louise 應用 - 代碼優化與安全修復計劃

## 任務目標
修復代碼中的10個關鍵問題，使應用能夠正確與Supabase同步，並提升代碼穩定性和安全性。

## ⚠️ 重要提醒
- 所有文件必須保持 UTF-8 編碼
- 修復後執行 `npm run build` 驗證構建成功
- 每個Phase完成後執行測試驗證

---

## 🔴 Phase 1：關鍵問題修復（必須優先完成）

### 1. 修復中文字符亂碼問題
**優先級：🔴 CRITICAL**  
**文件：** `src/components/pages/Daily.jsx`, `Health.jsx`, `Memories.jsx`  
**問題：** 疫苗名稱、記錄按鈕標籤顯示為亂碼

**具體修復步驟：**
1. 使用 VS Code 或工具將以下文件重新編碼為 UTF-8（如果當前不是 UTF-8）：
   - `src/components/pages/Daily.jsx` (第18行的"記錄餵食"按鈕)
   - `src/components/pages/Health.jsx` (第7-17行的疫苗名稱)
   - `src/components/pages/Memories.jsx` (第18行的"里程碑"標籤)

2. 驗證文件編碼後，確保所有中文字符正確顯示

**驗證方法：** 開啟應用，檢查Daily、Health、Memories頁面的中文標籤是否清晰可讀

---

### 2. 修復 Supabase 安全問題（禁用暴露憑證）

**優先級：🔴 CRITICAL**  
**問題：** 
- `.env` 文件在 git history 中暴露了 VITE_SUPABASE_ANON_KEY
- 未啟用 Row Level Security (RLS)，任何人都可以讀寫數據

**修復步驟：**

**步驟 1：在 Supabase Dashboard 中操作**
1. 前往 https://supabase.com/dashboard
2. 選擇項目 "uwvlduprxppwdkjkvwby"
3. 進入 Settings → API
4. **重新生成 Anon Key**：
   - 點擊 "Regenerate" 按鈕，確認
   - 複製新的 Anon Key
5. 進入 SQL Editor，執行以下 SQL 啟用 RLS：

```sql
-- 為 users 表啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 為 growth_records 表啟用 RLS
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- 建立策略：只允許用戶讀寫自己的數據
-- 注意：此處使用簡單的 user_id 匹配，實際應用應整合 Supabase Auth

CREATE POLICY "users_select_own" ON users
FOR SELECT USING (id = 'default_user');

CREATE POLICY "users_insert_own" ON users
FOR INSERT WITH CHECK (id = 'default_user');

CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (id = 'default_user');

CREATE POLICY "records_select_own" ON growth_records
FOR SELECT USING (user_id = 'default_user');

CREATE POLICY "records_insert_own" ON growth_records
FOR INSERT WITH CHECK (user_id = 'default_user');

CREATE POLICY "records_update_own" ON growth_records
FOR UPDATE USING (user_id = 'default_user');
```

**步驟 2：在代碼中更新憑證**
1. 在項目根目錄找到 `.env` 文件
2. 用新生成的 Anon Key 更新 `VITE_SUPABASE_ANON_KEY` 的值
3. 執行 `npm run build` 驗證構建成功

**步驟 3：清理 git history（可選但推薦）**
```bash
# 從 git history 中移除 .env
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: remove .env from git tracking (security)"
```

**驗證方法：** 
- 確保應用連接到 Supabase 時，只能讀寫自己的數據
- 測試跨用戶訪問是否被阻止

---

### 3. 修復表單提交錯誤處理

**優先級：🔴 CRITICAL**  
**文件：** `src/components/pages/QuickRecord.jsx`  
**問題：** `handleSubmit()` 函數（第72行）缺少 try-catch，狀態更新失敗時會崩潰

**具體修復：**

將 `handleSubmit` 函數改為：

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  try {
    const id = Date.now();

    const typeLabels = {
      weight: '體重', height: '身高', head: '頭圍',
      feeding: '餵食', sleep: '睡眠', milestone: '里程碑',
      letter: '信件', health: '健康記錄'
    };

    switch(type) {
      case 'weight':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'weight', 
          value: parseFloat(formData.value), unit: 'kg'
        }]);
        break;
      case 'height':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'height', 
          value: parseFloat(formData.value), unit: 'cm'
        }]);
        break;
      case 'head':
        setGrowthRecords([...growthRecords, {
          id, date: formData.date, type: 'headCircumference', 
          value: parseFloat(formData.value), unit: 'cm'
        }]);
        break;
      case 'feeding':
        setFeedingRecords([...feedingRecords, {
          id, date: formData.date, time: formData.time, 
          type: formData.feedingType,
          duration: formData.duration ? parseInt(formData.duration) : null,
          amount: formData.amount ? parseInt(formData.amount) : null
        }]);
        break;
      case 'sleep':
        setSleepRecords([...sleepRecords, {
          id, date: formData.date, startTime: formData.startTime,
          endTime: formData.endTime || '', 
          duration: parseInt(formData.duration),
          quality: formData.quality
        }]);
        break;
      case 'milestone':
        setMilestones([...milestones, {
          id, date: formData.date, title: formData.title,
          icon: formData.icon || '🎉', note: formData.note
        }]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        break;
      case 'letter':
        setLetters([...letters, {
          id, date: formData.date, title: formData.title, 
          content: formData.content
        }]);
        break;
      case 'health':
        setHealthRecords([...healthRecords, {
          id, date: formData.date, type: formData.healthType || '其他', 
          note: formData.note
        }]);
        break;
      default:
        throw new Error(`未知的記錄類型: ${type}`);
    }

    success(`已記錄${typeLabels[type]}`);
    onClose();
  } catch (err) {
    console.error('記錄保存失敗:', err);
    error(`保存失敗: ${err.message}`);
  }
};
```

**改進點：**
- 使用 try-catch 包裹所有邏輯
- 添加未知類型的錯誤拋出
- 捕獲錯誤並通過 toast 顯示給用戶
- 使用 error() toast 函數顯示失敗信息

**驗證方法：** 測試各種記錄類型的保存，確保失敗時顯示錯誤提示

---

## 🟠 Phase 2：高優先級修復

### 4. 修復文件上傳錯誤處理

**優先級：🟠 HIGH**  
**文件：** `src/components/pages/Home.jsx` (第171-194行)  
**問題：** FileReader 錯誤未處理，JSON.parse 可能拋出未捕獲的異常

**修復代碼：** 將導入邏輯改為：

```javascript
onClick={() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        error('未選擇文件');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== 'string') {
            error('文件內容無效');
            return;
          }
          
          const data = JSON.parse(content);
          
          // 驗證導入數據結構
          if (!data.user || !Array.isArray(data.growthRecords)) {
            throw new Error('無效的備份文件格式');
          }
          
          if (importData(data)) {
            success('數據導入成功！');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            error('數據導入失敗，請檢查文件格式');
          }
        } catch (parseError) {
          console.error('解析JSON失敗:', parseError);
          error(`導入失敗: ${parseError.message}`);
        }
      };
      
      reader.onerror = () => {
        console.error('文件讀取失敗');
        error('無法讀取文件，請重試');
      };
      
      reader.onabort = () => {
        error('文件讀取被中斷');
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error('文件上傳錯誤:', err);
      error('操作失敗: ' + err.message);
    }
  };
  input.click();
}}
```

**改進點：**
- 添加 reader.onerror 處理
- 添加 reader.onabort 處理
- JSON.parse 用 try-catch 包裹
- 驗證文件內容類型
- 所有錯誤都通過 toast 顯示

---

### 5. 增強 Supabase 異步操作的錯誤處理

**優先級：🟠 HIGH**  
**文件：** `src/context/AppContext.jsx`

**修復內容：** 在 useEffect 中添加更健壯的錯誤処理和狀態跟蹤

步驟：
1. 在 AppProvider 組件狀態變數後（第49行後）添加：

```javascript
// 同步狀態跟蹤
const [syncStatus, setSyncStatus] = useLocalStorage('louise_sync_status', 'idle');
const [syncError, setSyncError] = useLocalStorage('louise_sync_error', null);
```

2. 修改初始化 useEffect（第100-148行）為：

```javascript
useEffect(() => {
  if (initRef.current) return;
  initRef.current = true;

  let subscription = null;

  const initSupabase = async () => {
    if (isSupabaseAvailable()) {
      console.log('🔄 初始化 Supabase...');
      setSyncStatus('connecting');

      try {
        // 加載用戶數據（只在本地為空時）
        const remoteUser = await loadUserData();
        if (remoteUser && !user.name) {
          setUser(remoteUser);
        }

        // 加載成長記錄（只在本地為空時）
        const remoteRecords = await loadGrowthRecords();
        if (remoteRecords.length > 0 && growthRecords.length === 0) {
          setGrowthRecords(remoteRecords);
        }

        // 訂閱實時變化
        subscription = subscribeToChanges(async () => {
          try {
            const updatedRecords = await loadGrowthRecords();
            setGrowthRecords(updatedRecords);
            setSyncStatus('synced');
            setSyncError(null);
          } catch (subError) {
            console.error('❌ 實時訂閱更新失敗:', subError);
            setSyncError(subError.message);
            setSyncStatus('error');
          }
        });

        subscriptionRef.current = subscription;
        setSyncStatus('synced');
        setSyncError(null);
        console.log('✅ Supabase 初始化完成');
      } catch (err) {
        console.error('❌ Supabase 初始化失敗:', err);
        setSyncError(err.message);
        setSyncStatus('offline');
        console.log('📱 使用本地模式');
      }
    } else {
      setSyncStatus('unconfigured');
      console.log('📱 Supabase 未配置 - 使用本地模式');
    }
  };

  initSupabase();

  return () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
  };
}, []);
```

3. 修改用戶數據同步 useEffect（第151-156行）添加錯誤處理：

```javascript
useEffect(() => {
  if (!initRef.current) return;
  if (!user.name || !user.birthDate) return;

  syncUserData(user).then(result => {
    if (!result.success) {
      console.warn('用戶數據同步失敗:', result.error);
      setSyncStatus('error');
    }
  }).catch(err => {
    console.error('用戶數據同步異常:', err);
    setSyncStatus('error');
  });
}, [user]);
```

4. 修改成長記錄同步 useEffect（第159-164行）添加錯誤處理：

```javascript
useEffect(() => {
  if (!initRef.current) return;
  if (growthRecords.length === 0) return;

  syncGrowthRecords(growthRecords).then(result => {
    if (!result.success) {
      console.warn('成長記錄同步失敗:', result.error);
      setSyncStatus('error');
    } else {
      setSyncStatus('synced');
    }
  }).catch(err => {
    console.error('成長記錄同步異常:', err);
    setSyncStatus('error');
  });
}, [growthRecords]);
```

5. 在 context value 中添加（第166-178行修改為）：

```javascript
const value = {
  user, setUser,
  growthRecords, setGrowthRecords,
  feedingRecords, setFeedingRecords,
  sleepRecords, setSleepRecords,
  healthRecords, setHealthRecords,
  vaccineRecords, setVaccineRecords,
  milestones, setMilestones,
  letters, setLetters,
  isDarkMode, setIsDarkMode,
  exportData,
  importData,
  syncStatus,  // 新增
  syncError    // 新增
};
```

**改進點：**
- 追蹤同步狀態（connecting, synced, offline, error, unconfigured）
- 追蹤同步錯誤信息
- 訂閱回調中添加錯誤處理
- 允許應用感知 Supabase 連接狀態

---

### 6. 修復表單驗證中的類型強制問題

**優先級：🟠 HIGH**  
**文件：** `src/components/pages/QuickRecord.jsx` (第43-70行)

**修復 validate() 函數：**

```javascript
const validate = () => {
  const newErrors = {};

  if ((type === 'weight' || type === 'height' || type === 'head') && !formData.value) {
    newErrors.value = '請輸入數值';
  } else if (type === 'weight' || type === 'height' || type === 'head') {
    const value = parseFloat(formData.value);
    
    // 檢查是否為有效的數字
    if (isNaN(value)) {
      newErrors.value = '請輸入有效的數值';
    } else if (type === 'weight' && (value < 0 || value > 50)) {
      newErrors.value = '體重應在 0-50 kg 之間';
    } else if (type === 'height' && (value < 30 || value > 120)) {
      newErrors.value = '身高應在 30-120 cm 之間';
    } else if (type === 'head' && (value < 20 || value > 60)) {
      newErrors.value = '頭圍應在 20-60 cm 之間';
    }
  }
  
  if (type === 'feeding' && !formData.amount && !formData.duration) {
    newErrors.feeding = '請輸入奶量或時長';
  } else if (type === 'feeding' && formData.duration) {
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      newErrors.duration = '時長應為正整數';
    }
  }
  
  if (type === 'sleep' && !formData.duration) {
    newErrors.duration = '請輸入睡眠時長';
  } else if (type === 'sleep' && formData.duration) {
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      newErrors.duration = '睡眠時長應為正整數';
    }
  }
  
  if (type === 'milestone' && !formData.title) {
    newErrors.title = '請輸入標題';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**改進點：**
- 驗證前先檢查 NaN
- 檢查正整數的有效性
- 更清晰的錯誤信息

---

## 🟡 Phase 3：中優先級修復

### 7. 添加數據導入驗證

**優先級：🟡 MEDIUM**  
**文件：** `src/context/AppContext.jsx`

**修改 importData 函數（第69-93行）為：**

```javascript
const validateRecord = (record) => {
  if (!record || typeof record !== 'object') return false;
  if (!record.id || !record.date) return false;
  const allowedTypes = ['weight', 'height', 'headCircumference'];
  return allowedTypes.includes(record.type) && 
         typeof record.value === 'number' && 
         record.value > 0;
};

const importData = (jsonString) => {
  try {
    const data = typeof jsonString === 'string' 
      ? JSON.parse(jsonString) 
      : jsonString;

    // 驗證數據結構
    if (!data || typeof data !== 'object') {
      throw new Error('無效的備份文件格式');
    }
    
    if (!data.user || typeof data.user !== 'object') {
      throw new Error('缺少用戶信息');
    }
    
    if (!Array.isArray(data.growthRecords)) {
      throw new Error('缺少成長記錄');
    }

    // 驗證成長記錄
    const validRecords = data.growthRecords.filter(r => {
      if (!validateRecord(r)) {
        console.warn('跳過無效記錄:', r);
        return false;
      }
      return true;
    });

    if (validRecords.length === 0 && data.growthRecords.length > 0) {
      throw new Error('備份文件中沒有有效的記錄');
    }

    // 導入所有數據
    setUser(data.user);
    setGrowthRecords(validRecords.length > 0 ? validRecords : []);
    setFeedingRecords(Array.isArray(data.feedingRecords) ? data.feedingRecords : []);
    setSleepRecords(Array.isArray(data.sleepRecords) ? data.sleepRecords : []);
    setHealthRecords(Array.isArray(data.healthRecords) ? data.healthRecords : []);
    setVaccineRecords(Array.isArray(data.vaccineRecords) ? data.vaccineRecords : []);
    setMilestones(Array.isArray(data.milestones) ? data.milestones : []);
    setLetters(Array.isArray(data.letters) ? data.letters : []);

    return true;
  } catch (err) {
    console.error('導入失敗:', err);
    return false;
  }
};
```

---

### 8. 添加空值安全檢查

**優先級：🟡 MEDIUM**

**文件 1：** `src/components/pages/Home.jsx` (第20行)  
**修複：**

```javascript
const ageDisplay = user?.birthDate ? formatAge(user.birthDate) : '未記錄出生日期';
```

**文件 2：** `src/utils/calculations.js`  
**在 formatAge 函數開始添加防禦性檢查：**

```javascript
export const formatAge = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'string') {
    return '年齡未知';
  }
  
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      return '日期無效';
    }
    // ... 其餘原有邏輯
  } catch (err) {
    console.error('計算年齡出錯:', err);
    return '計算失敗';
  }
};
```

---

## ✅ 驗證清單

完成所有修復後，執行以下驗證：

- [ ] 執行 `npm run build` — 構建成功無警告
- [ ] 打開應用，檢查 Daily、Health、Memories 頁面的中文是否清晰
- [ ] 在主頁測試「備份」功能 — 下載 JSON 文件成功
- [ ] 在主頁測試「恢復」功能 — 導入剛下載的 JSON 文件
- [ ] 測試表單提交 — 輸入無效數據，檢查是否顯示錯誤提示
- [ ] 測試不同記錄類型（體重、身高、餵食等），確保都能保存
- [ ] 檢查瀏覽器控制台，確保沒有 JavaScript 錯誤
- [ ] 測試網絡離線時的行為 — 確保應用能使用本地模式
- [ ] 驗證 Supabase 同步 — 使用已配置的 Supabase 測試數據上傳

---

## 🎯 最後提醒

1. **文件編碼：** 所有修改都要保持 UTF-8 編碼
2. **測試Supabase：** 修復後需要在實際 Supabase 項目中驗證 RLS 生效
3. **Git提交：** 完成後建議用有意義的 commit message，例如：
   - `fix: 修復中文字符亂碼`
   - `security: 加强 Supabase 認證和 RLS`
   - `feat: 增強表單錯誤處理`
   - `chore: remove .env from git tracking`

---

## 📌 執行順序

按以下順序執行，確保每個 Phase 都正常工作：

1. **Phase 1** 必須先完成（CRITICAL 級別）
   - 完成後構建並驗證
   
2. **Phase 2** 在 Phase 1 通過後執行
   - 完成後構建並驗證
   
3. **Phase 3** 在 Phase 2 通過後執行
   - 完成後執行完整驗證清單

---

**本文件由 Claude Code 審計工具生成**  
**用於 Qwen Code 執行的優化計劃**
