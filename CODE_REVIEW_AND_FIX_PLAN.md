# Louise 應用完整代碼審查與修復計劃

> 📋 給 Qwen Code 執行的詳細修復計劃  
> 👤 審查人：gstack review skill  
> 📅 日期：2026-05-01  
> 🎯 目標：從 6.5/10 提升到 8.0/10

---

## 📊 項目評分概況

| 維度 | 評分 | 狀態 | 優先級 |
|------|------|------|--------|
| **代碼質量** | 6.5/10 | ⚠️ 中等 | 🟡 中 |
| **安全性** | 4/10 | 🔴 需要改進 | 🔴 高 |
| **性能** | 6/10 | 🟡 可優化 | 🟡 中 |
| **可維護性** | 5.5/10 | ⚠️ 中等 | 🟡 中 |
| **測試覆蓋率** | 0% | 🔴 **嚴重** | 🔴 高 |
| **部署準備** | 5/10 | 🟡 不完全 | 🟠 高 |

---

## 🔴 第一階段：**P0 嚴重問題（立即修復）**

### 問題 1️⃣: 中文字符編碼損壞 [CRITICAL - 阻塞應用]

**影響文件**：
- `src/components/pages/Daily.jsx`（第 18 行）
- `src/components/pages/Health.jsx`（第 7-17 行）
- `src/components/pages/Memories.jsx`（第 18 行）

**症狀**：
```
Daily.jsx 第 18 行顯示：
+ ӛ�ÿ���jʳӛ�
應該顯示：
+ 記錄餵食時間和奶量
```

**根本原因**：檔案使用 GB2312/GBK 編碼，被讀取為 UTF-8

**修復步驟**：

#### 方法 A：使用 PowerShell 批量轉換（推薦）

```powershell
# 第 1 步：診斷 - 確認編碼類型
$file = "src/components/pages/Daily.jsx"
$bytes = [System.IO.File]::ReadAllBytes($file)
$gb2312 = [System.Text.Encoding]::GetEncoding('GB2312').GetString($bytes)
Write-Host "Daily.jsx 前 100 個字符（GB2312 解碼）："
Write-Host $gb2312.Substring(0, 100)

# 第 2 步：批量轉換三個檔案為 UTF-8
$files = @(
  "src/components/pages/Daily.jsx",
  "src/components/pages/Health.jsx",
  "src/components/pages/Memories.jsx"
)

foreach ($file in $files) {
  Write-Host "正在轉換 $file..."
  
  try {
    # 嘗試用 GB2312 讀取
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::GetEncoding('GB2312'))
    
    # 用 UTF-8 寫回
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    
    Write-Host "✅ $file 成功轉換為 UTF-8"
  }
  catch {
    Write-Host "⚠️ $file 轉換失敗，嘗試 GBK..."
    
    try {
      $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::GetEncoding('GBK'))
      [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
      Write-Host "✅ $file 用 GBK->UTF-8 成功轉換"
    }
    catch {
      Write-Host "❌ $file 無法轉換"
    }
  }
}

Write-Host ""
Write-Host "✅ 轉換完成！"
```

#### 第 3 步：驗證轉換成功

```bash
# 清理 Vite 緩存
rm -r node_modules/.vite

# 開發模式測試
npm run dev

# 檢查：所有中文應正確顯示，無亂碼
```

**預期結果**：
- ✅ Daily.jsx 第 18 行顯示「+ 記錄餵食」
- ✅ Health.jsx 疫苗名稱正確（「B肝疫苗」而不是亂碼）
- ✅ Memories.jsx 里程碑標籤正確（「里程碑」而不是亂碼）
- ✅ npm run dev 無編碼錯誤

---

### 問題 2️⃣: AppContext.jsx 中的循環依賴/效應鏈 [CRITICAL]

**位置**：`src/context/AppContext.jsx` 第 19-71 行

**問題代碼分析**：

```jsx
// ❌ 危險的依賴鏈：
// useEffect 1 (第 19-57)：初始化 Supabase，調用 setUser() 和 setGrowthRecords()
// useEffect 2 (第 60-64)：監聽 user，調用 syncUserData()，可能觸發 setUser()
// useEffect 3 (第 67-71)：監聽 growthRecords，調用 syncGrowthRecords()

// 導致：setUser → useEffect2 → syncUserData → setUser → useEffect2 (循環)
```

**潛在風險**：
- 初始化時多次同步（浪費網路和存儲）
- Supabase 訂閱與本地狀態衝突
- 數據不一致

**修復步驟**：

在 `src/context/AppContext.jsx` 中，使用 ref 追蹤初始化狀態：

```jsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isSupabaseAvailable, syncUserData, loadUserData, syncGrowthRecords, loadGrowthRecords, subscribeToChanges } from '../services/syncService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 用戶信息
  const [user, setUser] = useLocalStorage('louise_user', {
    name: '',
    birthDate: '',
    gender: ''
  });

  // 成長記錄
  const [growthRecords, setGrowthRecords] = useLocalStorage('louise_growth', []);

  // ✅ 新增：追蹤初始化狀態（防止循環同步）
  const initRef = useRef(false);
  const subscriptionRef = useRef(null);

  // ✅ 修復：初始化邏輯 - 只運行一次
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let subscription = null;
    
    const initSupabase = async () => {
      if (isSupabaseAvailable()) {
        console.log('🔄 初始化 Supabase...');
        
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
          
          // 訂閱實時變化（不在初始化時觸發下面的 sync useEffect）
          subscription = subscribeToChanges(async () => {
            const updatedRecords = await loadGrowthRecords();
            setGrowthRecords(updatedRecords);
          });
          
          subscriptionRef.current = subscription;
        } catch (error) {
          console.error('❌ Supabase 初始化失敗:', error);
          console.log('📱 使用本地模式');
        }
      } else {
        console.log('📱 Supabase 未配置 - 使用本地模式');
      }
    };
    
    initSupabase();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []); // ✅ 空依賴數組 - 只運行一次

  // ✅ 修復：用戶數據同步 - 只在初始化後執行
  useEffect(() => {
    // ✅ 防止：初始化時自動觸發同步
    if (!initRef.current) return;
    if (!user.name || !user.birthDate) return;

    syncUserData(user);
  }, [user]); // user 變化時同步

  // ✅ 修復：成長記錄同步 - 只在初始化後執行
  useEffect(() => {
    // ✅ 防止：初始化時自動觸發同步
    if (!initRef.current) return;
    if (growthRecords.length === 0) return;

    syncGrowthRecords(growthRecords);
  }, [growthRecords]);

  // ... 其餘代碼保持不變 ...
```

**驗證步驟**：

```bash
# 1. 運行應用
npm run dev

# 2. 打開瀏覽器控制台，檢查日誌：
# 應該看到：
# 🔄 初始化 Supabase...
# ✅ 數據加載完成
# （不應該有重複的同步日誌）

# 3. 在應用中編輯一條記錄
# 應該只同步一次，不會無限循環
```

**預期結果**：
- ✅ 初始化只運行一次
- ✅ 編輯數據時正確同步到 Supabase
- ✅ 沒有無限循環或重複同步

---

### 問題 3️⃣: Supabase 認證和數據安全 [CRITICAL]

**位置**：`src/services/syncService.js` 和 `.env` 配置

**問題**：
1. 前端暴露 Supabase Anon Key（任何人可以通過瀏覽器獲取）
2. 沒有 Row Level Security (RLS)，任何認證用戶可以讀取所有數據
3. 沒有錯誤處理，同步失敗會靜默失敗

**修復步驟**：

#### 步驟 1：在 Supabase 中啟用 Row Level Security

登錄 Supabase 控制台，對所有表執行以下操作：

```sql
-- 1. 為 louise_users 表啟用 RLS
ALTER TABLE louise_users ENABLE ROW LEVEL SECURITY;

-- 2. 創建策略：用戶只能讀取自己的數據
CREATE POLICY "用戶只能讀取自己的信息"
  ON louise_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用戶只能更新自己的信息"
  ON louise_users FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. 為 louise_growth 表啟用 RLS（假設有 user_id 欄位）
ALTER TABLE louise_growth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用戶只能讀取自己寶寶的成長記錄"
  ON louise_growth FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "用戶只能修改自己寶寶的成長記錄"
  ON louise_growth FOR UPDATE
  USING (user_id = auth.uid());

-- 4. 對所有其他表重複以上操作（feeding, sleep, health, vaccines, milestones, letters）
```

#### 步驟 2：改進 syncService.js 的錯誤處理

```javascript
// src/services/syncService.js

const syncUserData = async (userData) => {
  try {
    if (!isSupabaseAvailable()) return;
    
    const { data, error } = await supabase
      .from('louise_users')
      .upsert({
        user_id: 'default_user',
        name: userData.name,
        birthDate: userData.birthDate,
        gender: userData.gender,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ 同步用戶數據失敗:', error.message);
      // ✅ 觸發 toast 通知用戶
      return;
    }

    console.log('✅ 用戶數據已同步');
  } catch (error) {
    console.error('❌ 同步出錯:', error);
  }
};

const syncGrowthRecords = async (records) => {
  try {
    if (!isSupabaseAvailable() || records.length === 0) return;

    // ❌ 危險：使用 delete().eq() 可能刪除所有記錄
    // 原代碼：await supabase.from('louise_growth').delete().eq('user_id', 'default_user');

    // ✅ 正確做法：使用 upsert，只同步需要同步的記錄
    const { error } = await supabase
      .from('louise_growth')
      .upsert(
        records.map(r => ({
          ...r,
          user_id: 'default_user',
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'id' }
      );

    if (error) {
      console.error('❌ 同步成長記錄失敗:', error.message);
      return;
    }

    console.log('✅ 成長記錄已同步');
  } catch (error) {
    console.error('❌ 同步出錯:', error);
  }
};

const loadUserData = async () => {
  try {
    const { data, error } = await supabase
      .from('louise_users')
      .select()
      .eq('user_id', 'default_user')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = 沒有找到記錄（正常）
      console.error('❌ 加載用戶數據失敗:', error.message);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('❌ 加載用戶數據出錯:', error);
    return null;
  }
};
```

**驗證步驟**：

```bash
# 1. 檢查 Supabase 控制台，確認 RLS 已啟用
# Supabase → Database → Tables → 選擇表 → RLS 應為 "ON"

# 2. 運行應用
npm run dev

# 3. 編輯用戶信息，檢查瀏覽器控制台
# 應該看到：✅ 用戶數據已同步（沒有錯誤）

# 4. 添加成長記錄
# 應該正確同步，不會刪除其他記錄
```

**預期結果**：
- ✅ RLS 已啟用，防止未授權訪問
- ✅ 同步操作有錯誤處理
- ✅ 用戶只能訪問自己的數據

---

## 🟠 第二階段：**P1 高優先級問題（本週修復）**

### 問題 4️⃣: 異步操作缺少錯誤處理 [HIGH]

**影響文件**：
- `src/components/pages/QuickRecord.jsx`（表單提交）
- `src/services/syncService.js`（已在上面修復）

**修復**：為所有異步操作添加 try-catch

```jsx
// src/components/pages/QuickRecord.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError(null);
    
    // 調用 addRecord
    await addRecord(recordData);
    
    // 顯示成功消息
    showToast('記錄已保存', 'success');
    
    // 關閉模態
    onClose();
  } catch (error) {
    console.error('❌ 保存失敗:', error);
    setError(error.message || '保存失敗，請重試');
    showToast('保存失敗：' + error.message, 'error');
  } finally {
    setLoading(false);
  }
};

return (
  <>
    {error && (
      <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4">
        ❌ {error}
      </div>
    )}
    <button disabled={loading} type="submit">
      {loading ? '保存中...' : '保存'}
    </button>
  </>
);
```

---

### 問題 5️⃣: 零測試覆蓋率 [HIGH]

**當前狀態**：26 個 .jsx/.js 文件，0 個測試

**建立測試框架**：

#### 步驟 1：安裝測試依賴

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

#### 步驟 2：創建 vitest 配置

創建 `vitest.config.js`：

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
```

#### 步驟 3：創建測試設置

創建 `src/test/setup.js`：

```javascript
import '@testing-library/jest-dom';
```

#### 步驟 4：為關鍵函數添加測試

創建 `src/utils/__tests__/whoCalculations.test.js`：

```javascript
import { describe, it, expect } from 'vitest';
import { calculatePercentile, interpolatePercentile } from '../whoCalculations';

describe('WHO 百分位計算', () => {
  it('應該正確計算男嬰 0 個月的體重百分位', () => {
    const result = calculatePercentile('male', 0, 3.5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('應該正確計算女嬰 12 個月的體重百分位', () => {
    const result = calculatePercentile('female', 12, 8.2);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('應該正確插值百分位', () => {
    const result = interpolatePercentile([{ age: 0, p50: 3.5 }, { age: 1, p50: 4.8 }], 0.5);
    expect(result).toBeGreaterThan(3.5);
    expect(result).toBeLessThan(4.8);
  });
});
```

#### 步驟 5：運行測試

```bash
npm run test

# 添加到 package.json
# "test": "vitest",
# "test:ui": "vitest --ui",
# "test:coverage": "vitest --coverage"
```

**目標**：第 1 週達到 30% 覆蓋率，第 4 週達到 60% 覆蓋率

---

## 🟡 第三階段：**P2 中優先級問題（下週開始）**

### 問題 6️⃣: 設計系統冗杂 [MEDIUM]

**參考**：已創建的 `設計冗杂檢讨優化 Prompt`

**簡要修復**：
1. 統一 CSS 變數定義（只在 `tailwind.config.js` 中）
2. 刪除 `src/styles/liquid-glass.css` 中的重複定義
3. 統一玻璃卡片類名（使用 `.glass-card` 為主）

---

### 問題 7️⃣: 長列表性能優化 [MEDIUM]

**優化**：使用虛擬化列表

```jsx
// src/components/pages/Daily.jsx

import { useMemo } from 'react';

export default function Daily() {
  const { feedingRecords } = useApp();
  
  // ✅ 只渲染最新 50 條記錄，不用全部渲染
  const visibleRecords = useMemo(
    () => [...feedingRecords].reverse().slice(0, 50),
    [feedingRecords]
  );

  return (
    <>
      {visibleRecords.map(record => (
        <div key={record.id} className="glass-card p-3">
          {/* ... */}
        </div>
      ))}
    </>
  );
}
```

---

## ✅ 完成檢查清單

### P0 - 嚴重問題（本週完成）
- [ ] 修復中文編碼（Daily, Health, Memories）
- [ ] 修復 AppContext 循環依賴
- [ ] 啟用 Supabase RLS 和錯誤處理
- [ ] `npm run dev` 無錯誤，中文正確顯示

### P1 - 高優先級（下週完成）
- [ ] 添加 vitest 測試框架
- [ ] 為 whoCalculations 添加單元測試
- [ ] 為 QuickRecord 添加錯誤處理
- [ ] 測試覆蓋率達到 30%

### P2 - 中優先級（下下週開始）
- [ ] 解決設計系統冗杂
- [ ] 優化長列表渲染
- [ ] 添加全局錯誤邊界和 toast 通知

---

## 📋 給 Qwen Code 的執行 Prompt

```
我的 Louise 應用有代碼審查發現的問題需要修復。

【P0 嚴重問題 - 立即修復】

## 問題 1：中文字符編碼損壞

三個檔案顯示亂碼：
- src/components/pages/Daily.jsx
- src/components/pages/Health.jsx  
- src/components/pages/Memories.jsx

請用 PowerShell 批量轉換為 UTF-8 編碼：

[複製上面的 PowerShell 代碼]

## 問題 2：AppContext 循環依賴

src/context/AppContext.jsx 第 19-71 行有循環依賴的 useEffect。

請替換為：

[複製上面的修復代碼]

## 問題 3：Supabase 安全性

1. 在 Supabase 控制台執行 RLS SQL 語句（參考文檔）
2. 更新 src/services/syncService.js（參考修復代碼）

完成後運行 npm run dev 驗證。
```

---

**🎯 最終目標**：
- ✅ P0 問題修復（編碼、循環依賴、安全性）
- ✅ 應用正常運行，無 console 錯誤
- ✅ 所有中文正確顯示
- ✅ Supabase 同步正確，無無限循環
- ✅ 為 P1 測試框架建設做準備

**📞 如有問題**：參考本文檔的詳細說明，或提供錯誤消息給我進一步診斷。
