# Louise 應用 - 完整優化與設計修復計劃 v2.0

## 任務目標
修復所有關鍵問題並優化 UI/UX，使應用能夠：
1. 正確與 Supabase 同步，無重複記錄
2. 暗黑模式完美運作
3. 在手機上提供緊湊、友好的界面
4. 支持多用戶和家庭分享（未來）

## ⚠️ 重要提醒
- 所有文件必須保持 UTF-8 編碼
- 修復後執行 `npm run build` 驗證構建成功
- 每個Phase完成後執行測試驗證
- 暗黑模式修復後需要重新加載頁面測試

---

## 🔴 Phase 1：CRITICAL 級別修復

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

### 2. 修復 Supabase 安全問題與重複記錄

**優先級：🔴 CRITICAL**  
**問題：** 
- `.env` 文件在 git history 中暴露了 VITE_SUPABASE_ANON_KEY
- 未啟用 Row Level Security (RLS)，任何人都可以讀寫數據
- **重複記錄問題**：由於沒有用戶隔離，多個實例可能同時同步相同記錄

**修復步驟：**

**步驟 1：在 Supabase Dashboard 中操作**
1. 前往 https://supabase.com/dashboard
2. 選擇項目 "uwvlduprxppwdkjkvwby"
3. 進入 Settings → API
4. **重新生成 Anon Key**：
   - 點擊 "Regenerate" 按鈕，確認
   - 複製新的 Anon Key
5. 進入 SQL Editor，執行以下 SQL 啟用 RLS 並修復重複記錄：

```sql
-- 為 users 表啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 為 growth_records 表啟用 RLS
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- 清理可能的重複記錄（選擇最新的保留）
DELETE FROM growth_records WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, record_date, type) id 
  FROM growth_records 
  ORDER BY user_id, record_date, type, created_at DESC
);

-- 建立策略：只允許用戶讀寫自己的數據
CREATE POLICY "users_select_own" ON users
FOR SELECT USING (id = 'default_user');

CREATE POLICY "users_insert_own" ON users
FOR INSERT WITH CHECK (id = 'default_user');

CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (id = 'default_user');

-- 為 growth_records 添加唯一約束防止重複
ALTER TABLE growth_records ADD CONSTRAINT unique_record 
UNIQUE(user_id, record_date, type);

CREATE POLICY "records_select_own" ON growth_records
FOR SELECT USING (user_id = 'default_user');

CREATE POLICY "records_insert_own" ON growth_records
FOR INSERT WITH CHECK (user_id = 'default_user');

CREATE POLICY "records_update_own" ON growth_records
FOR UPDATE USING (user_id = 'default_user');

CREATE POLICY "records_delete_own" ON growth_records
FOR DELETE USING (user_id = 'default_user');
```

**步驟 2：在代碼中更新憑證**
1. 在項目根目錄找到 `.env` 文件
2. 用新生成的 Anon Key 更新 `VITE_SUPABASE_ANON_KEY` 的值
3. 執行 `npm run build` 驗證構建成功

**步驟 3：修復 syncService 中的重複邏輯**

編輯 `src/services/syncService.js`，改進 upsert 邏輯：

```javascript
export const syncGrowthRecords = async (records) => {
  if (!supabase) return { success: false, reason: 'supabase_not_configured' };

  try {
    if (records.length === 0) return { success: true };

    // 使用改進的 upsert：利用 unique constraint 防止重複
    const { error } = await supabase
      .from('growth_records')
      .upsert(
        records.map(r => ({
          user_id: 'default_user',
          record_date: r.date,
          type: r.type,
          value: r.value,
          unit: r.unit,
          note: r.note,
          updated_at: new Date().toISOString()
        })),
        { 
          onConflict: 'user_id,record_date,type'  // 使用複合唯一鍵
        }
      );

    if (error) {
      console.error('❌ 同步成長記錄失敗:', error.message);
      // 如果是唯一約束衝突，說明記錄已存在（正常）
      if (error.code === '23505') {
        console.log('ℹ️  記錄已存在，跳過重複');
        return { success: true };
      }
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ 同步成長記錄出錯:', error);
    return { success: false, error };
  }
};
```

**步驟 4：清理 git history（可選但推薦）**
```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: remove .env from git tracking (security)"
```

**驗證方法：** 
- 確保應用連接到 Supabase 時，只能讀寫自己的數據
- 測試多次保存相同日期的體重記錄，確保沒有重複

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

**驗證方法：** 測試各種記錄類型的保存，確保失敗時顯示錯誤提示

---

### 4. 修復暗黑模式失效問題

**優先級：🔴 CRITICAL**  
**文件：** `src/App.jsx`, `tailwind.config.js`, `src/styles/globals.css`  
**問題：** 暗黑模式切換時，DOM 沒有更新 class，導致樣式不變

**修復步驟：**

**步驟 1：修改 App.jsx**

```jsx
import { useEffect } from 'react';

export default function App() {
  const { isDarkMode, setIsDarkMode } = useApp();

  // 🔧 關鍵修復：確保 html 元素的 dark class 被更新
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    // ... 其他組件
  );
}
```

**步驟 2：驗證 tailwind.config.js**

確保包含以下配置：

```javascript
module.exports = {
  darkMode: 'class',  // ✅ 確保這一行存在
  theme: {
    extend: {
      colors: {
        // 自定義顏色...
      }
    }
  }
}
```

**步驟 3：添加暗黑模式 CSS 變數**

編輯 `src/styles/globals.css`，添加：

```css
/* 淺色模式（默認） */
html {
  --color-bg: #ffffff;
  --color-bg-secondary: #f9f9f9;
  --color-text: #1a1a1a;
  --color-text-secondary: rgba(0, 0, 0, 0.6);
  --color-border: rgba(0, 0, 0, 0.1);
  
  /* Liquid Glass 淺色 */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(0, 0, 0, 0.1);
}

/* 暗黑模式 */
html.dark {
  --color-bg: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-text: #f5f5f5;
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-border: rgba(255, 255, 255, 0.1);
  
  /* Liquid Glass 暗黑 */
  --glass-bg: rgba(30, 30, 30, 0.8);
  --glass-border: rgba(255, 255, 255, 0.15);
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.15);
}

html.dark .glass-card:hover {
  background: rgba(40, 40, 40, 0.9);
}
```

**驗證方法：** 
- 刷新頁面
- 點擊主題切換按鈕
- 確保整個應用界面（包括卡片、文字、邊框）都正確切換顏色

---

### 5. 優化首頁出生日期顯示格式

**優先級：🔴 CRITICAL**  
**文件：** `src/utils/calculations.js`, `src/components/pages/Home.jsx`  
**改進：** 出生日期從"2024-01-15"改為"3月2週4天"

**步驟 1：添加日期計算工具函數**

編輯 `src/utils/calculations.js`，添加：

```javascript
/**
 * 計算寶寶月齡為 "x月x週x天" 格式
 * @param {string} birthDate - ISO 日期字符串 (YYYY-MM-DD)
 * @returns {string} 例如 "3月2週4天"
 */
export const formatAgeDetailed = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'string') {
    return '年齡未知';
  }

  try {
    const birth = new Date(birthDate + 'T00:00:00Z');
    const today = new Date();
    
    if (isNaN(birth.getTime())) {
      return '日期無效';
    }

    // 計算總天數
    const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    
    if (totalDays < 0) {
      return '未出生';
    }

    // 轉換為 月 週 天
    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    const weeks = Math.floor(remainingDays / 7);
    const days = remainingDays % 7;

    return `${months}月${weeks}週${days}天`;
  } catch (error) {
    console.error('計算年齡出錯:', error);
    return '計算失敗';
  }
};

/**
 * 簡化版 - 只顯示月齡（例如 "3個月")
 */
export const formatAgeSimple = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'string') {
    return '年齡未知';
  }

  try {
    const birth = new Date(birthDate + 'T00:00:00Z');
    const today = new Date();
    
    const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);

    return `${months}個月`;
  } catch (error) {
    return '年齡未知';
  }
};
```

**步驟 2：更新 Home.jsx 使用新格式**

在 `src/components/pages/Home.jsx` 的導入部分添加：

```javascript
import { formatAgeDetailed, formatAgeSimple } from '../../utils/calculations';
```

然後修改首頁寶寶名字和年齡的顯示部分（替換原有的 formatAge）：

```jsx
const ageDisplay = user?.birthDate ? formatAgeDetailed(user.birthDate) : '未記錄出生日期';

// 在頁面中的使用
<div className="mb-6">
  <h1 className="text-4xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
    {user.name || '寶寶'}
  </h1>
  <p className="text-lg text-rose/70 font-semibold">
    {ageDisplay}
  </p>
  {user.birthDate && (
    <p className="text-sm text-white/40 mt-1">
      出生日期：{user.birthDate}
    </p>
  )}
</div>
```

**驗證方法：** 
- 打開首頁，確保寶寶名字下顯示"x月x週x天"格式
- 每天重新打開應用，確保天數遞增

---

## 🟠 Phase 2：HIGH 優先級修復

### 6. 優化首頁為手機友好的緊湊設計

**優先級：🟠 HIGH**  
**文件：** `src/components/pages/Home.jsx`, `src/styles/globals.css`  
**目標：** 減少 padding，優化卡片排列，在手機上提供最佳體驗

**步驟 1：完全重構 Home.jsx 的首頁佈局**

用以下代碼替換整個 Home 組件：

```jsx
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useToast } from '../../context/ToastContext';
import { formatAgeDetailed } from '../../utils/calculations';
import Icons from '../shared/Icons';
import EmptyState from '../shared/EmptyState';

const Home = ({ onOpenQuickRecord }) => {
  const { user, growthRecords, feedingRecords, sleepRecords, milestones, isDarkMode, setIsDarkMode, exportData, importData } = useApp();
  const { success, error } = useToast();

  const weightRecords = growthRecords.filter(r => r.type === 'weight');
  const heightRecords = growthRecords.filter(r => r.type === 'height');
  const headRecords = growthRecords.filter(r => r.type === 'headCircumference');

  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const latestHeight = heightRecords.length > 0 ? heightRecords[heightRecords.length - 1] : null;
  const latestHead = headRecords.length > 0 ? headRecords[headRecords.length - 1] : null;

  const ageDisplay = user?.birthDate ? formatAgeDetailed(user.birthDate) : '未記錄出生日期';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div className="flex-1 overflow-auto pb-20">
      {/* 頂部欄 */}
      <div className="px-3 sm:px-4 pt-4 sm:pt-6 pb-4 sm:pb-6 sticky top-0 z-10 backdrop-blur-sm bg-white/50 dark:bg-black/50">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <p className="text-white/50 text-xs sm:text-sm">{greeting} 👋</p>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={isDarkMode ? '切換到淺色模式' : '切換到深色模式'}
          >
            <Icons.theme className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
          </button>
        </div>

        {/* 寶寶名字 + 年齡 */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
          {user.name || '寶寶'}
        </h1>
        <p className="text-base sm:text-lg text-rose/70 font-semibold mt-0.5">
          {ageDisplay}
        </p>
      </div>

      {/* 主要內容 */}
      <div className="px-3 sm:px-4 space-y-3 sm:space-y-4">
        
        {/* 核心統計卡片 - 3 列緊湊 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {latestWeight && (
            <div className="glass-card p-2.5 sm:p-3 flex flex-col items-center text-center">
              <Icons.weight className="w-4 h-4 text-rose/60 mb-1" />
              <p className="text-xs text-white/50">體重</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">
                {latestWeight.value}<span className="text-xs text-white/50 ml-0.5">kg</span>
              </p>
            </div>
          )}

          {latestHeight && (
            <div className="glass-card p-2.5 sm:p-3 flex flex-col items-center text-center">
              <Icons.ruler className="w-4 h-4 text-sage/60 mb-1" />
              <p className="text-xs text-white/50">身高</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">
                {latestHeight.value}<span className="text-xs text-white/50 ml-0.5">cm</span>
              </p>
            </div>
          )}

          {latestHead && (
            <div className="glass-card p-2.5 sm:p-3 flex flex-col items-center text-center">
              <Icons.head className="w-4 h-4 text-sky/60 mb-1" />
              <p className="text-xs text-white/50">頭圍</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">
                {latestHead.value}<span className="text-xs text-white/50 ml-0.5">cm</span>
              </p>
            </div>
          )}
        </div>

        {/* 如果沒有數據，顯示 Empty State */}
        {!latestWeight && !latestHeight && !latestHead && (
          <EmptyState
            icon="🌱"
            title="開始記錄 Louise 的成長"
            description="添加第一筆數據，查看成長曲線對比"
            actionLabel="添加第一筆記錄"
            onAction={() => onOpenQuickRecord('weight')}
          />
        )}

        {/* 快速記錄按鈕 */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white/85 mb-2">快速記錄</h3>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
            {[
              { id: 'weight', label: '體重', Icon: Icons.weight },
              { id: 'height', label: '身高', Icon: Icons.ruler },
              { id: 'head', label: '頭圍', Icon: Icons.head },
              { id: 'feeding', label: '餵食', Icon: Icons.feeding },
              { id: 'sleep', label: '睡眠', Icon: Icons.sleep },
              { id: 'milestone', label: '里程碑', Icon: Icons.milestone },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onOpenQuickRecord(item.id)}
                className="flex flex-col items-center gap-1 glass-card p-2 sm:p-3 min-w-[65px] sm:min-w-[75px] hover:bg-white/10 transition-all flex-shrink-0 text-center"
              >
                <item.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-rose/60" />
                <span className="text-xs text-white/85 leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 最近活動 - 只在有數據時顯示 */}
        {(growthRecords.length > 0 || milestones.length > 0 || feedingRecords.length > 0) && (
          <div className="glass-card p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-bold text-white/85 mb-2">最近活動</h3>
            <div className="space-y-1.5 text-xs sm:text-sm">
              {growthRecords.length > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>成長記錄</span>
                  <span className="text-white font-semibold">{growthRecords.length} 筆</span>
                </div>
              )}
              {feedingRecords.length > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>餵食記錄</span>
                  <span className="text-white font-semibold">{feedingRecords.length} 筆</span>
                </div>
              )}
              {milestones.length > 0 && (
                <div className="flex justify-between text-white/50">
                  <span>里程碑</span>
                  <span className="text-white font-semibold">{milestones.length} 個</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 數據管理 - 緊湊版 */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportData();
                success('數據已備份');
              }}
              className="flex-1 glass-card p-2.5 sm:p-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-white/85 hover:bg-white/10 transition-all"
            >
              <Icons.backup className="w-4 h-4" />
              <span className="hidden sm:inline">備份</span>
            </button>
            <button
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
                    
                    reader.readAsText(file);
                  } catch (err) {
                    console.error('文件上傳錯誤:', err);
                    error('操作失敗: ' + err.message);
                  }
                };
                input.click();
              }}
              className="flex-1 glass-card p-2.5 sm:p-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-white/85 hover:bg-white/10 transition-all"
            >
              <Icons.restore className="w-4 h-4" />
              <span className="hidden sm:inline">恢復</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
```

**步驟 2：添加響應式 CSS**

編輯 `src/styles/globals.css`，確保包含：

```css
/* 響應式間距 - 移動優先 */
@layer components {
  .glass-card {
    @apply backdrop-blur-sm bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-lg transition-all;
  }

  .glass-card:hover {
    @apply bg-white/20 dark:bg-white/10 border-white/20 dark:border-white/20;
  }
}

/* 手機 (sm: < 640px) */
@media (max-width: 639px) {
  .container {
    @apply px-3;
  }
}

/* 平板 (md: >= 768px) */
@media (min-width: 768px) {
  .container {
    @apply px-4;
  }
}
```

**驗證方法：** 
- 在手機（375px 寬）、平板（768px 寬）、桌面（1280px 寬）上測試
- 確保所有卡片、按鈕都能正確顯示
- 確保沒有水平滾動條（除了快速記錄區域）

---

### 7. 修復文件上傳錯誤處理

**優先級：🟠 HIGH**  
**文件：** `src/components/pages/Home.jsx` (已在上面的重構中包含)  
**改進：** 完整的 FileReader 錯誤處理

---

### 8. 增強 Supabase 異步操作的錯誤處理

**優先級：🟠 HIGH**  
**文件：** `src/context/AppContext.jsx`

添加同步狀態跟蹤（第49行後）：

```javascript
// 同步狀態跟蹤
const [syncStatus, setSyncStatus] = useLocalStorage('louise_sync_status', 'idle');
const [syncError, setSyncError] = useLocalStorage('louise_sync_error', null);
```

修改初始化 useEffect（第100-148行）：

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
        const remoteUser = await loadUserData();
        if (remoteUser && !user.name) {
          setUser(remoteUser);
        }

        const remoteRecords = await loadGrowthRecords();
        if (remoteRecords.length > 0 && growthRecords.length === 0) {
          setGrowthRecords(remoteRecords);
        }

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

在 context value 中添加（第166-178行）：

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

---

### 9. 修復表單驗證中的類型強制問題

**優先級：🟠 HIGH**  
**文件：** `src/components/pages/QuickRecord.jsx` (第43-70行)

改進 validate() 函數（詳見 Phase 1 中的完整代碼）

---

## 🟡 Phase 3：MEDIUM 優先級修復

### 10. 添加數據導入驗證

**優先級：🟡 MEDIUM**  
**文件：** `src/context/AppContext.jsx`

修改 importData 函數（第69-93行）...（詳見原檔案）

---

### 11. 添加空值安全檢查

**優先級：🟡 MEDIUM**  
**文件：** `src/components/pages/Home.jsx` (已在重構中包含)

---

## 🔵 Phase 4：多用戶系統與家庭分享規劃

**優先級：🔵 FUTURE（下一階段實施，當前為了解而記錄）**

### 📋 工程審查 (Plan-Eng-Review)

#### **當前架構問題**

| 問題 | 原因 | 影響 | 嚴重度 |
|------|------|------|--------|
| **單一 default_user** | 所有記錄綁定到 'default_user' | 無用戶隔離，重複記錄易發生 | 🔴 HIGH |
| **無認證系統** | 沒有 Supabase Auth 集成 | 任何人訪問應用都看到同樣數據 | 🔴 HIGH |
| **無權限管理** | RLS 只基於硬編碼 ID | 無法實現家庭分享或多人協作 | 🟠 MEDIUM |
| **同步邏輯簡陋** | upsert 依賴記錄日期和類型 | 多設備同時編輯易導致衝突 | 🟠 MEDIUM |
| **無版本控制** | 沒有記錄修改歷史 | 無法追蹤誰改了什麼、何時改的 | 🟡 LOW |

#### **技術方案對比**

```
方案 A：設備 ID（快速但有限）
├─ 實施時間：1-2 天
├─ 複雜度：低
├─ 成本：$0
├─ 支持多人：✅ 同設備，❌ 跨設備
└─ 數據隔離：設備級別

方案 B：家庭賬戶（平衡方案 ✅ 推薦）
├─ 實施時間：1-2 週
├─ 複雜度：中等
├─ 成本：Supabase Auth（免費額度內）
├─ 支持多人：✅ 同家庭多設備
├─ 數據隔離：家庭級別
└─ 未來擴展性：⭐⭐⭐⭐

方案 C：完整多寶寶系統（終極方案）
├─ 實施時間：1 個月
├─ 複雜度：高
├─ 成本：需要後端服務
├─ 支持多人：✅ 跨家庭多機構
├─ 數據隔離：寶寶級別
└─ 未來擴展性：⭐⭐⭐⭐⭐
```

#### **短期行動（當前至 v1.1）**

**目標**：修復重複記錄，為多用戶做準備

```javascript
// 1. 添加設備 ID（而非 default_user）
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('louise_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('louise_device_id', deviceId);
  }
  return deviceId;
};

// 2. 修改 AppContext 使用設備 ID
const deviceId = getOrCreateDeviceId();
syncGrowthRecords(growthRecords, deviceId);  // 傳遞設備 ID

// 3. Supabase 查詢改為
const { data } = await supabase
  .from('growth_records')
  .select('*')
  .eq('device_id', deviceId)  // 而非 'default_user'
  .order('record_date');
```

#### **中期規劃（v1.2-v1.3）**

1. **集成 Supabase Auth**
   ```sql
   -- 建立關係
   ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users;
   ALTER TABLE growth_records ADD COLUMN device_id TEXT, updated_by UUID;
   
   -- RLS 改為基於認證用戶
   CREATE POLICY "user_can_read_own_records"
   ON growth_records FOR SELECT
   USING (auth.uid() = updated_by);
   ```

2. **家庭成員邀請**
   - 生成邀請碼（UUID 縮寫）
   - 掃碼或輸入碼加入家庭
   - 設置父親/母親/其他角色

3. **共享儀表板**
   - 所有家庭成員看到同一寶寶的數據
   - 但可以追蹤誰添加了什麼記錄

#### **數據遷移策略**

當從 'default_user' 遷移到設備 ID 或認證系統時：

```sql
-- 步驟 1：備份現有數據
CREATE TABLE growth_records_backup AS SELECT * FROM growth_records;

-- 步驟 2：添加新列
ALTER TABLE growth_records ADD COLUMN device_id TEXT DEFAULT 'migrated_default';
ALTER TABLE growth_records ADD COLUMN migrated_at TIMESTAMP DEFAULT NOW();

-- 步驟 3：遷移認證 ID（稍後）
UPDATE growth_records SET updated_by = auth.uid() 
WHERE device_id IS NOT NULL;

-- 步驟 4：驗證無遺漏
SELECT COUNT(*) FROM growth_records WHERE device_id IS NULL;
```

---

### 🎨 設計審查 (Plan-Design-Review)

#### **數據模型架構**

```
當前（v1.0）：
┌─────────────────┐
│  localStorage   │
│   (本地存儲)     │
└────────┬────────┘
         │ upsert
         ▼
┌─────────────────┐
│  Supabase       │
│  growth_records │ ← 所有記錄 user_id='default_user'
│  (無用戶隔離)    │
└─────────────────┘

推薦（v1.2+）：
┌──────────────────┐
│  localStorage    │
│  (設備層緩存)      │
└────────┬─────────┘
         │ sync (device_id + auth)
         ▼
┌──────────────────┬──────────────┐
│  Supabase        │  Supabase    │
│  ┌────────────┐  │  ┌────────┐  │
│  │ families   │  │  │ auth   │  │
│  │ (family_id)│  │  │(user)  │  │
│  └────┬───────┘  │  └───┬────┘  │
│       │          │      │       │
│  ┌────▼───────┐  │  ┌───▼────┐  │
│  │   users    │  │  │ devices│  │
│  │(family_id) │  │  │(user_id)  │
│  └────┬───────┘  │  └───┬────┘  │
│       │          │      │       │
│  ┌────▼──────────────────▼────┐  │
│  │ growth_records             │  │
│  │ (family_id, device_id)     │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

#### **RLS 策略演進**

```sql
-- 當前 (v1.0)：硬編碼
CREATE POLICY "current_policy"
ON growth_records FOR SELECT
USING (user_id = 'default_user');

-- 短期 (v1.1)：設備隔離
CREATE POLICY "device_based"
ON growth_records FOR SELECT
USING (device_id = current_setting('app.device_id'));

-- 中期 (v1.2)：認證用戶
CREATE POLICY "auth_user_only"
ON growth_records FOR SELECT
USING (auth.uid() = created_by);

-- 長期 (v1.3+)：家庭共享
CREATE POLICY "family_shared"
ON growth_records FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM families 
    WHERE auth.uid() = ANY(member_ids)
  )
);
```

#### **用戶流程設計**

**首次啟動流程：**
```
用戶打開應用
    ↓
檢查是否有本地數據
    ├─ 有 → 進入主頁（離線優先）
    └─ 無 → 顯示歡迎畫面
         ├─ 新建檔案（輸入寶寶名字）→ 主頁
         └─ 恢復備份（上傳 JSON）→ 主頁
```

**未來登錄流程（v1.2+）：**
```
用戶打開應用
    ↓
檢查是否已認證
    ├─ 已認證 → 加載該用戶/家庭的數據
    └─ 未認證 → 登錄/註冊界面
         ├─ 用 Email/社交登錄
         ├─ 新建家庭或加入現有家庭
         └─ 同步云端數據 → 主頁
```

#### **重複記錄根本原因與解決方案**

| 重複原因 | 當前狀態 | 短期修復 | 長期方案 |
|---------|---------|---------|---------|
| 多設備同時同步相同日期記錄 | 🔴 易發生 | 添加 `unique(device_id, date, type)` | 認證用戶級隔離 |
| 網絡延遲導致重複 upsert | 🔴 可能 | 改進 upsert 邏輯，加重試機制 | 樂觀鎖（version field） |
| localStorage 和 Supabase 不同步 | 🟠 中等 | 實現 offline-first sync queue | 事件驅動架構 |
| 用戶手動上傳相同備份多次 | 🟡 低 | 添加重複檢測，提示覆蓋 | 版本管理系統 |

**立即可做：**
1. 啟用 Supabase 的 UNIQUE 約束
2. 在 sync 前檢查本地記錄是否已上傳
3. 添加衝突解決策略（最後修改時間優先）

---

### 🏗️ 數據庫架構規劃

#### **v1.1 設備隔離方案**

```sql
-- 添加設備隔離
ALTER TABLE growth_records 
ADD COLUMN device_id TEXT NOT NULL DEFAULT 'migrated';

ALTER TABLE growth_records 
ADD UNIQUE(device_id, record_date, type);

-- 創建索引以加快查詢
CREATE INDEX idx_growth_records_device ON growth_records(device_id, record_date DESC);
```

#### **v1.2+ 家庭架構**

```sql
-- 新建 families 表
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW(),
  invite_code TEXT UNIQUE,
  settings JSONB DEFAULT '{}'
);

-- 修改 users 表
ALTER TABLE users 
ADD COLUMN family_id UUID REFERENCES families,
ADD COLUMN role TEXT DEFAULT 'parent'; -- 'parent' | 'grandparent' | 'caregiver'

-- 修改 growth_records 表
ALTER TABLE growth_records
DROP COLUMN user_id,
ADD COLUMN family_id UUID REFERENCES families,
ADD COLUMN created_by UUID REFERENCES auth.users,
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- 新的 UNIQUE 約束（按家庭）
ALTER TABLE growth_records
ADD UNIQUE(family_id, record_date, type);

-- 新的 RLS
CREATE POLICY "families_select"
ON growth_records FOR SELECT
USING (
  family_id IN (
    SELECT id FROM families WHERE auth.uid() = created_by
  )
  OR
  family_id IN (
    SELECT family_id FROM users 
    WHERE auth.uid() = (SELECT auth.uid() FROM auth.users)
  )
);
```

#### **認證集成清單**

- [ ] 啟用 Supabase Auth
- [ ] 添加郵箱/密碼登錄
- [ ] 添加社交登錄（Google、Apple）
- [ ] 實現忘記密碼流程
- [ ] 添加電郵驗證
- [ ] 創建用戶資料編輯頁面
- [ ] 實現登出功能

---

### 📊 實施時間線

```
現在 (v1.0)        修復重複記錄 (v1.1)     家庭分享 (v1.2)      多寶寶 (v2.0)
   │                    │                     │                    │
   ├─ 3-5 天 ────────┤                        │                    │
   │ • 修復亂碼         │ 設備 ID 隔離          │ Supabase Auth       │ 完整系統
   │ • 修復暗黑模式    │ 防重複約束           │ 邀請機制            │ 權限系統
   │ • UI 優化         │ 衝突解決             │ 角色管理            │ 多寶寶切換
   │ • Supabase 安全  │                      │ 共享儀表板          │ 統計對比
   │                    └─ 1-2 週 ────────┤                        │
   │                                       │ 另外 1-2 週 ────┤
   └────────────────────────────────────────────────────────── 3 個月
```

---

## ✅ 完整驗證清單

**Phase 1 完成後：**
- [ ] 執行 `npm run build` — 構建成功無警告
- [ ] 中文字符清晰顯示（Daily、Health、Memories）
- [ ] 暗黑模式可以正常切換（html 有 dark class）
- [ ] 出生日期顯示為 "x月x週x天" 格式
- [ ] 首頁在手機上排布緊湊，無多餘空白
- [ ] 統計卡片在 3 列網格中正確顯示
- [ ] 快速記錄按鈕可以水平滾動
- [ ] 表單提交失敗時有錯誤提示

**Phase 2 完成後：**
- [ ] 文件上傳/恢復功能正常
- [ ] 多次測試同一記錄，確保無重複
- [ ] Supabase 同步狀態可跟蹤
- [ ] 表單驗證正確檢查 NaN

**Phase 3 完成後：**
- [ ] 數據導入驗證有效
- [ ] 空值檢查不會崩潰

**整體測試：**
- [ ] 在真實手機上（iPhone、Android）測試
- [ ] 在平板上測試
- [ ] 在桌面瀏覽器上測試
- [ ] 離線時應用仍可使用本地模式
- [ ] 連接 Supabase 時數據正確同步
- [ ] 暗黑/淺色模式切換流暢

---

## 🎯 最後提醒

1. **優先級順序**：Phase 1 (CRITICAL) → Phase 2 (HIGH) → Phase 3 (MEDIUM)
2. **每個 Phase 後都要 `npm run build` 和測試**
3. **暗黑模式修復後需要硬刷新（Ctrl+Shift+R）**
4. **所有文件保持 UTF-8 編碼**
5. **Git Commits：**
   - `fix: 修復中文字符亂碼和暗黑模式`
   - `feat: 優化首頁設計，改進出生日期顯示`
   - `security: 加強 Supabase 安全和防重複`
   - `refactor: 重構首頁為手機優先設計`

---

**本文件由 Claude Code 審計工具生成**  
**用於 Qwen Code 執行的完整優化計劃 v2.0**
