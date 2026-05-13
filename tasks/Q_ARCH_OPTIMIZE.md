<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 架構優化：修 bug + 清理技術債 + 補缺漏 UI

**嚴格約束**：
- ✅ 不改變任何現有 UI 風格（手繪風保留）
- ✅ 不改變任何功能行為
- ✅ 不動 package.json 版本號（只新增 crypto polyfill 不需要，原生支援）
- ❌ 不做 inline style → Tailwind 遷移（範圍太大，另開 task）
- ❌ 不做 Dashboard 拆分（另開 task）
- ❌ 不做深色模式 / 單元測試 / lazy loading（另開 task）

---

## 📋 任務範圍

本次 task 聚焦「**高優先級的架構修復 + 缺漏 UI 補齊**」，共 6 個步驟：

| Step | 內容 | 類別 |
|------|------|------|
| 1 | 修 auth race condition（await ensureAuth） | 🐛 Bug fix |
| 2 | Firestore 載入加 timeout fallback | 🐛 Bug fix |
| 3 | ID 改用 crypto.randomUUID() | 🐛 Bug fix |
| 4 | 統一 ChartModal 的 WHO 數據源 | 🧹 去重 |
| 5 | useLocalStorage 加 storage event 跨 tab 同步 | 🐛 Bug fix |
| 6 | 新增 Settings 頁面（用戶資料 + 匯出匯入） | ✨ 補缺 UI |

---

## Step 1：修 Auth Race Condition

**問題**：`AppContext.jsx` 中 `ensureAuth()` 是 fire-and-forget，但 Firestore Rules 要求 `request.auth != null`。如果 Firestore 請求比 auth 完成更快，會被 rules 拒絕，導致首次載入失敗。

修改 `src/context/AppContext.jsx` 第 37 行附近：

改前：
```jsx
(async () => {
  // 匿名登入（背景執行，不阻塞功能）
  ensureAuth();

  let anySuccess = false;
  try {
```

改後：
```jsx
(async () => {
  // 匿名登入（必須先完成才能讀寫 Firestore，規則要求 auth != null）
  await ensureAuth();

  let anySuccess = false;
  try {
```

**影響**：首次載入多等 100-300ms，但保證 Firestore 請求一定能通過 rules 驗證。

---

## Step 2：Firestore 載入 Timeout Fallback

**問題**：如果 Firestore 連線卡住（網路問題、防火牆、服務異常），`loaded` 永遠為 false，用戶會一直看到載入畫面。

修改 `src/context/AppContext.jsx` 的 useEffect，在最開始加一個 safety timeout：

在 `(async () => {` 之前加入：

```jsx
useEffect(() => {
  // Safety timeout: 即使 Firestore 完全不通，8 秒後強制進入離線模式
  const timeoutId = setTimeout(() => {
    setLoaded(prev => {
      if (!prev) {
        console.warn('⏱️ Firestore 載入超時，切換至離線模式');
        setFirestoreStatus('error');
        return true;
      }
      return prev;
    });
  }, 8000);

  (async () => {
    await ensureAuth();
    // ... 現有代碼
```

並在 async 函數最末尾（`setLoaded(true);` 之後）加入：

```jsx
    setLoaded(true);
    clearTimeout(timeoutId);
  })();
}, []);
```

**影響**：最差情況下用戶 8 秒後進入離線模式，而非無限等待。

---

## Step 3：ID 改用 crypto.randomUUID()

**問題**：`Date.now().toString()` 在快速連續操作時（例如一秒內按兩次新增）會產生重複 ID，造成 Firestore 覆寫 + UI 異常。

**影響範圍**：`AppContext.jsx`、`Growth.jsx`、`Health.jsx`、`Memories.jsx`

### 3a. AppContext.jsx

所有 `r.id || Date.now().toString()` 改為 `r.id || crypto.randomUUID()`：

- `addGrowthRecord`
- `addMilestone`
- `addDiaryEntry`
- `addBpRecord`

`addCustomVaccine` 的 `'custom_' + Date.now().toString()` 改為 `'custom_' + crypto.randomUUID()`。

### 3b. Growth.jsx

`id: Date.now().toString()` → `id: crypto.randomUUID()`

### 3c. Health.jsx（BP 表單內）

`id: Date.now().toString()` → `id: crypto.randomUUID()`

### 3d. Memories.jsx

里程碑和日記的 `id: Date.now().toString()` → `id: crypto.randomUUID()`

**注意**：`crypto.randomUUID()` 在 iOS Safari 15.4+ / Chrome 92+ 才支援。現代 PWA 環境都 OK，但若要保守可用：

```js
const genId = () => (crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
```

建議把這個 helper 放到 `src/utils/id.js` 供全項目使用。

---

## Step 4：統一 ChartModal 的 WHO 數據源

**問題**：`ChartModal.jsx` 前 40 行內嵌了一份 0-12 週的 WHO 數據（weight/height/headCircumference），而 `src/data/whoData.js` 已有完整 0-24 月數據。兩份數據格式不同（週 vs 月），但內容重複且容易不一致。

### 4a. 擴充 whoData.js

在 `src/data/whoData.js` 末尾新增 0-12 週的週數據（Chart Modal 用），以及 y 軸配置：

```js
// WHO Child Growth Standards — Girls 0-12 weeks（ChartModal 用，更精細）
// ageWeeks: 週齡, P3, P15, P50, P85, P97
export const WHO_WEIGHT_GIRLS_WEEKLY = {
  P3:  [2.4,2.6,2.8,3.0,3.2,3.4,3.5,3.7,3.8,3.9,4.0,4.1,4.2],
  P15: [2.7,2.9,3.2,3.4,3.6,3.8,4.0,4.1,4.3,4.4,4.5,4.6,4.7],
  P50: [3.2,3.4,3.7,3.9,4.1,4.3,4.5,4.7,4.8,5.0,5.1,5.2,5.4],
  P85: [3.7,4.0,4.3,4.6,4.8,5.1,5.3,5.5,5.6,5.8,5.9,6.1,6.2],
  P97: [4.2,4.5,4.8,5.1,5.3,5.5,5.7,5.9,6.1,6.3,6.5,6.7,6.8],
  yMin: 1.5, yMax: 7.5, yStep: 0.5, unit: 'kg', label: '體重',
};

export const WHO_HEIGHT_GIRLS_WEEKLY = {
  P3:  [45.6,46.7,47.8,48.8,49.7,50.5,51.3,52.0,52.6,53.3,53.9,54.5,55.0],
  P15: [47.2,48.4,49.5,50.5,51.5,52.3,53.1,53.8,54.5,55.2,55.8,56.4,57.0],
  P50: [49.4,50.5,51.7,52.7,53.7,54.6,55.5,56.3,57.0,57.7,58.4,59.0,59.7],
  P85: [51.5,52.7,53.8,54.9,56.0,56.9,57.8,58.6,59.4,60.1,60.8,61.5,62.1],
  P97: [53.1,54.3,55.4,56.5,57.5,58.4,59.3,60.1,60.9,61.6,62.3,63.0,63.6],
  yMin: 42, yMax: 68, yStep: 2, unit: 'cm', label: '身高',
};

export const WHO_HEAD_GIRLS_WEEKLY = {
  P3:  [31.7,32.3,33.0,33.6,34.1,34.6,35.1,35.5,35.9,36.2,36.5,36.8,37.1],
  P15: [32.6,33.3,34.0,34.6,35.1,35.6,36.1,36.5,36.9,37.2,37.5,37.8,38.1],
  P50: [34.0,34.7,35.4,36.0,36.6,37.1,37.6,38.0,38.4,38.8,39.1,39.5,39.8],
  P85: [35.3,36.1,36.8,37.4,38.0,38.5,39.0,39.5,39.9,40.3,40.7,41.0,41.3],
  P97: [36.3,37.0,37.7,38.3,38.9,39.4,39.9,40.4,40.8,41.2,41.6,41.9,42.2],
  yMin: 28, yMax: 45, yStep: 2, unit: 'cm', label: '頭圍',
};

export const WHO_WEEKLY = {
  weight: WHO_WEIGHT_GIRLS_WEEKLY,
  height: WHO_HEIGHT_GIRLS_WEEKLY,
  headCircumference: WHO_HEAD_GIRLS_WEEKLY,
};
```

### 4b. 修改 ChartModal.jsx

移除檔案頂部第 4-29 行的 `const WHO = { weight: {...}, height: {...}, headCircumference: {...} }` 區塊。

改為從 whoData 引入：

```jsx
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { WHO_WEEKLY } from '../data/whoData';
```

然後把所有 `WHO[metric]` 改為 `WHO_WEEKLY[metric]`。

**驗證**：diff 後確認 ChartModal 的 WHO_WEEKLY 跟原 WHO 數據完全一致（內容一樣，只是換了位置）。

---

## Step 5：useLocalStorage 跨 Tab 同步

**問題**：在多個 tab 同時開啟 app 時（例如手機和電腦），一邊修改數據另一邊不會更新，只有重新整理才看得到。

修改 `src/hooks/useLocalStorage.js`：

```js
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 監聽其他 tab 的 localStorage 變化
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setStoredValue(JSON.parse(e.newValue));
      } catch (error) {
        console.error(`Error syncing localStorage key "${key}":`, error);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};
```

**注意**：`storage` event 只在**其他** tab 觸發，不會在自己的 tab 觸發，不會造成無限迴圈。

---

## Step 6：新增 Settings 頁面（補缺 UI）

**問題**：`AppContext` 已有 `updateUser`、`exportData`、`importData` 函數，但沒有任何 UI 暴露。用戶無法：
- 修改寶寶名字、出生日期、預產期
- 手動備份數據（匯出 JSON）
- 從備份還原數據（匯入 JSON）

### 6a. 新增 Settings.jsx

新建 `src/components/pages/Settings.jsx`：

```jsx
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const Settings = () => {
  const { user, setUser, exportData, importData } = useApp();
  const [form, setForm] = useState({
    name: user?.name || '',
    birthDate: user?.birthDate || '',
    dueDate: user?.dueDate || '',
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleSave = (e) => {
    e.preventDefault();
    setUser({ ...user, ...form });
    setSaveStatus('✅ 已儲存');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('⚠️ 匯入會覆蓋目前所有資料，確定要繼續嗎？')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importData(event.target.result);
        setImportStatus('✅ 匯入成功');
        setTimeout(() => setImportStatus(''), 3000);
      } catch (err) {
        setImportStatus(`❌ 匯入失敗：${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '80px' }}>
      <h2 className="section-title">⚙️ 設定</h2>

      {/* 寶寶資料 */}
      <form onSubmit={handleSave} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>👶 寶寶資料</h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>名字</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>出生日期</label>
            <input type="date" value={form.birthDate}
              onChange={(e) => setForm(p => ({ ...p, birthDate: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>預產期（早產計算用）</label>
            <input type="date" value={form.dueDate}
              onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>
              若為足月兒，預產期 = 出生日期
            </p>
          </div>
          <button type="submit" className="btn w-full">✅ 儲存</button>
          {saveStatus && (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--green)' }}>{saveStatus}</p>
          )}
        </div>
      </form>

      {/* 資料備份 */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>💾 資料備份</h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="btn w-full">📤 匯出 JSON 備份</button>
          <button onClick={handleImportClick} className="btn w-full">📥 從 JSON 還原</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {importStatus && (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)' }}>{importStatus}</p>
          )}
          <p style={{ fontSize: '0.8rem', opacity: 0.6, fontFamily: 'var(--font-body)' }}>
            ⚠️ 匯入會覆蓋目前資料，建議先匯出一份作為還原點。
          </p>
        </div>
      </div>

      {/* 關於 */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 8 }}>ℹ️ 關於</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.7 }}>
          Louise 成長記錄 v1.0.0<br/>
          雲端同步：Firebase Firestore<br/>
          離線存儲：localStorage
        </p>
      </div>
    </div>
  );
};

export default Settings;
```

### 6b. 修改 App.jsx — 加入 Settings tab

在 `App.jsx` 的 `pages` 陣列加入 Settings，並 import `Settings` icon：

```jsx
import { Home, TrendingUp, Heart, BookOpen, Settings as SettingsIcon } from 'lucide-react';
// ...
import Settings from './components/pages/Settings';

const pages = [
  { id: 'home', label: '首頁', icon: Home, component: Dashboard },
  { id: 'growth', label: '成長', icon: TrendingUp, component: Growth },
  { id: 'health', label: '健康', icon: Heart, component: Health },
  { id: 'memories', label: '回憶', icon: BookOpen, component: Memories },
  { id: 'settings', label: '設定', icon: SettingsIcon, component: Settings },
];
```

**注意**：底部導航原本是 4 個 tab，變成 5 個後需要檢查 mobile 下是否還能正常顯示（`flex-1` 已經是平均分配，應該 OK，但每個 tab 會變窄）。若視覺上太擠，可改為 Dashboard 右上角齒輪按鈕，而非獨立 tab。

**替代方案**（若要保持 4 tab）：在 Dashboard 右上角加一個齒輪按鈕，點擊後 `onNavigate('settings')`，settings 頁不出現在底部 nav。做法：
- App.jsx 的 `pages` 陣列維持 4 個
- 另外維護 `allPages` 包含 Settings
- 渲染時從 `allPages` 找組件，但 nav 只 render `pages`
- Dashboard 加齒輪按鈕呼叫 `onNavigate('settings')`

---

## Step 7：構建驗證

```bash
npm run build
```

驗證清單：
- [ ] 構建無錯誤
- [ ] Dashboard、Growth、Health、Memories 功能不受影響
- [ ] Settings 頁面可以修改寶寶資料並看到即時反映（例如 Dashboard 的名字）
- [ ] 匯出 JSON 能正常下載
- [ ] 匯入 JSON 能還原數據
- [ ] 開兩個 tab 測試：一邊改資料，另一邊自動更新（storage event）
- [ ] 離線測試：斷網後 app 仍能使用（timeout fallback）
- [ ] 連續快速新增記錄不會出現 ID 衝突

---

## 🔮 本 task 未涵蓋（另開 task）

以下項目因範圍大 / 影響廣，建議另外開 task 處理：

1. **Q_INLINE_TO_TAILWIND.md** — 把 inline style 遷移到 Tailwind class
2. **Q_DASHBOARD_SPLIT.md** — 拆分 Dashboard 為小組件
3. **Q_DARK_MODE.md** — 啟用深色模式切換
4. **Q_UNIT_TESTS.md** — 為 utils 加 Vitest 測試
5. **Q_LAZY_ROUTES.md** — 頁面 lazy loading
6. **Q_FIREBASE_ENV.md** — Firebase config 移到環境變數
7. **Q_PHOTO_UPLOAD.md** — 里程碑/日記照片附件（需 Firebase Storage）
