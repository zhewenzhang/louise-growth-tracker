# Batch 2：體驗升級（onSnapshot + 漸進式載入 + 資料驗證 + 深色模式）

## 🎯 目標

提升用戶體感：多裝置自動同步、首屏秒開、防止錯誤數據、晚上餵奶不傷眼。

### 嚴格約束
- ✅ 不改變 UI 風格（手繪風保留）
- ✅ 不動 package.json（不加新依賴）
- ❌ 不做 Dashboard 拆分（另開 task）
- ❌ 不做 TypeScript 遷移

---

## 📋 步驟

| Step | 內容 | 類別 |
|------|------|------|
| 1 | Firestore 改用 onSnapshot realtime listener | ✨ 體驗 |
| 2 | 漸進式載入（localStorage 先顯示，Firestore 背景同步） | ✨ 體驗 |
| 3 | 資料範圍驗證（防止異常值） | 🐛 防錯 |
| 4 | 深色模式切換 | ✨ 體驗 |

---

## Step 1：Firestore 改用 onSnapshot

**問題**：目前用 `getDocs` 一次性讀取。手機新增記錄後，電腦不會自動更新，必須重新整理。

### 1a. 修改 `src/services/firestoreService.js`

新增 realtime listener 函數（保留原有的 save/delete 函數不動）：

```js
import { doc, setDoc, getDoc, collection, deleteDoc, getDocs, writeBatch, onSnapshot, query, orderBy } from 'firebase/firestore';

// ── Realtime Listeners ──

export const subscribeGrowth = (callback) => {
  const q = query(collection(db, 'growth_records'), orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => {
    console.warn('Growth listener error:', err.message);
  });
};

export const subscribeVaccines = (callback) => {
  return onSnapshot(collection(db, 'vaccines'), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => a.ageMonths - b.ageMonths);
    callback(data);
  }, (err) => {
    console.warn('Vaccines listener error:', err.message);
  });
};

export const subscribeMilestones = (callback) => {
  return onSnapshot(collection(db, 'milestones'), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    callback(data);
  }, (err) => {
    console.warn('Milestones listener error:', err.message);
  });
};

export const subscribeDiary = (callback) => {
  return onSnapshot(collection(db, 'diary_entries'), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    callback(data);
  }, (err) => {
    console.warn('Diary listener error:', err.message);
  });
};

export const subscribeBp = (callback) => {
  return onSnapshot(collection(db, 'blood_pressure'), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    callback(data);
  }, (err) => {
    console.warn('BP listener error:', err.message);
  });
};
```

### 1b. 修改 `src/context/AppContext.jsx`

在初始化 useEffect 中，把 `getDocs` 一次性讀取改為 `subscribe*` realtime listener。

**核心改動邏輯**：

```jsx
import {
  // ... 保留原有 import
  subscribeGrowth, subscribeVaccines, subscribeMilestones, subscribeDiary, subscribeBp,
} from '../services/firestoreService';

// 在 useEffect 內，auth 成功後：
// 改前：const remoteGrowth = await loadGrowthFromFirestore(); ...
// 改後：

const unsubGrowth = subscribeGrowth((data) => {
  if (data.length > 0) {
    setGrowthRecords(data);
    localStorage.setItem('louise_growth', JSON.stringify(data));
  }
});

const unsubVaccines = subscribeVaccines((data) => {
  if (data.length > 0) {
    const vWithDates = calcVaccineDates(data, user?.birthDate || '2026-04-26');
    setVaccineRecords(vWithDates);
    localStorage.setItem('louise_vaccines', JSON.stringify(vWithDates));
  }
});

const unsubMilestones = subscribeMilestones((data) => {
  if (data.length > 0) {
    setMilestones(data);
    localStorage.setItem('louise_milestones', JSON.stringify(data));
  }
});

const unsubDiary = subscribeDiary((data) => {
  if (data.length > 0) {
    setDiaryEntries(data);
    localStorage.setItem('louise_diary', JSON.stringify(data));
  }
});

const unsubBp = subscribeBp((data) => {
  if (data.length > 0) {
    setBpRecords(data);
    localStorage.setItem('louise_blood_pressure', JSON.stringify(data));
  }
});

setFirestoreStatus('connected');
setLoaded(true);
clearTimeout(timeoutId);

// useEffect return 清理
return () => {
  unsubGrowth(); unsubVaccines(); unsubMilestones(); unsubDiary(); unsubBp();
};
```

**注意**：
- 第一次 snapshot 回調就是初始數據，不需要再 `await loadXxxFromFirestore()`
- 如果 Firestore 空的（新用戶），listener 會回傳空陣列，此時保留 localStorage 數據
- 仍保留 localStorage → Firestore 的上推邏輯（只在首次 snapshot 為空時執行一次）

---

## Step 2：漸進式載入

**問題**：目前 `loaded = false` 時顯示 Loading 畫面，要等 Firestore 全部回來才顯示。

### 改動策略

把 `loaded` 的初始值改為 `true`（因為 localStorage 已經有數據了），Loading 畫面只在**完全沒有任何數據**時顯示。

```jsx
// 改前
const [loaded, setLoaded] = useState(false);

// 改後
// localStorage 已有數據 → 立即顯示（Firestore 背景同步）
// localStorage 完全空 → 等 Firestore 回來
const hasLocalData = () => {
  try {
    const g = JSON.parse(localStorage.getItem('louise_growth') || '[]');
    const u = JSON.parse(localStorage.getItem('louise_user') || 'null');
    return g.length > 0 || !!u?.name;
  } catch { return false; }
};
const [loaded, setLoaded] = useState(hasLocalData);
```

**效果**：
- 有本地數據 → 首屏 0ms 顯示（Firestore 在背景同步，有新數據會自動更新 UI）
- 完全新用戶 → 仍等 Firestore（最多 8 秒 timeout）

---

## Step 3：資料範圍驗證

**問題**：體重 999kg、身高 -10cm 等明顯錯誤值目前都能存。

### 3a. 新增 `src/utils/validation.js`

```js
// 資料範圍驗證
// 返回 { valid: boolean, error?: string }

const RANGES = {
  weight: { min: 0.3, max: 30, unit: 'kg' },
  height: { min: 20, max: 130, unit: 'cm' },
  headCircumference: { min: 20, max: 60, unit: 'cm' },
  chestCircumference: { min: 20, max: 60, unit: 'cm' },
  feeding: { min: 1, max: 500, unit: 'ml' },
};

export const validateGrowthValue = (type, value) => {
  const range = RANGES[type];
  if (!range) return { valid: true };

  const v = parseFloat(value);
  if (isNaN(v)) return { valid: false, error: '請輸入有效數字' };
  if (v < range.min) return { valid: false, error: `數值過低（最小 ${range.min} ${range.unit}）` };
  if (v > range.max) return { valid: false, error: `數值過高（最大 ${range.max} ${range.unit}）` };
  return { valid: true };
};

export const validateBp = (systolic, diastolic, pulse) => {
  const s = parseInt(systolic);
  const d = parseInt(diastolic);
  const p = parseInt(pulse);

  if (isNaN(s) || s < 60 || s > 250) return { valid: false, error: '高壓範圍 60-250' };
  if (isNaN(d) || d < 30 || d > 150) return { valid: false, error: '低壓範圍 30-150' };
  if (s <= d) return { valid: false, error: '高壓必須大於低壓' };
  if (pulse && (isNaN(p) || p < 30 || p > 250)) return { valid: false, error: '脈搏範圍 30-250' };
  return { valid: true };
};
```

### 3b. 在 Growth.jsx 的 handleSubmit 加驗證

```jsx
import { validateGrowthValue } from '../../utils/validation';

// 在 handleSubmit 內，addGrowthRecord 之前：
const validation = validateGrowthValue(activeTab, activeTab === 'feeding' ? (bm + fm) : value);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### 3c. 在 Health.jsx 的 BP 表單加驗證

```jsx
import { validateBp } from '../../utils/validation';

// 在 addBpRecord 之前：
const bpValidation = validateBp(bpSystolic, bpDiastolic, bpPulse);
if (!bpValidation.valid) {
  alert(bpValidation.error);
  return;
}
```

---

## Step 4：深色模式切換

### 4a. 在 `src/styles/globals.css` 加 dark 色票

在 `:root` 之後新增：

```css
.dark {
  --bg: #1a1a2e;
  --fg: #e0e0e0;
  --muted: #2d2d4a;
  --accent: #ff6b6b;
  --blue: #6ba3ff;
  --yellow: #3d3a20;
  --green: #4caf50;
  --shadow-hard: 4px 4px 0px 0px rgba(0,0,0,0.5);
  --shadow-lg: 6px 6px 0px 0px rgba(0,0,0,0.5);
  --shadow-sm: 3px 3px 0px 0px rgba(0,0,0,0.5);
}

.dark body {
  background-image: radial-gradient(var(--muted) 1px, transparent 1px);
}

.dark .card, .dark .card-sm {
  background: #2a2a4a;
  border-color: var(--fg);
}

.dark .sticky-note {
  background: var(--yellow);
  border-color: var(--fg);
}

.dark .btn {
  background: #2a2a4a;
  color: var(--fg);
  border-color: var(--fg);
}
.dark .btn:hover {
  background: var(--accent);
  color: #fff;
}

.dark .btn-blue {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}

.dark input, .dark select, .dark textarea {
  background: #2a2a4a;
  color: var(--fg);
  border-color: var(--fg);
}

.dark nav {
  background: #1a1a2e !important;
  border-color: var(--fg) !important;
}
```

### 4b. 新增 `src/hooks/useDarkMode.js`

```js
import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('louise_dark_mode');
    if (stored !== null) return stored === 'true';
    // 跟隨系統偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('louise_dark_mode', String(dark));
  }, [dark]);

  return [dark, setDark];
};
```

### 4c. 在 App.jsx 使用

在 `AppContent` 組件內：

```jsx
import { useDarkMode } from './hooks/useDarkMode';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [dark, setDark] = useDarkMode();
  // ...
```

把 `dark` 和 `setDark` 透過 props 或 context 傳給需要的組件。

### 4d. 在 Dashboard 齒輪按鈕旁加一個月亮/太陽切換

在 Dashboard 的 greeting 區域，齒輪按鈕旁邊加：

```jsx
<button
  onClick={() => setDark?.(!dark)}
  style={{
    background: '#fff',
    border: '2px solid var(--fg)',
    borderRadius: 'var(--wobbly-sm)',
    padding: '8px 10px',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    fontSize: '0.85rem',
  }}
  title={dark ? '切換淺色' : '切換深色'}
>
  {dark ? '☀️' : '🌙'}
</button>
```

**注意**：需要把 `dark` 和 `setDark` 傳到 Dashboard。最簡單的方式是加到 AppContext，或者在 AppContent 透過 props 傳遞。建議加到 AppContext 的 Provider value 中。

---

## Step 5：構建驗證 + 部署

```bash
npm run build
git add -A
git commit -m "Batch 2：onSnapshot realtime + 漸進式載入 + 資料驗證 + 深色模式"
git push origin master
npx gh-pages -d dist
```

驗證清單：
- [ ] 構建無錯誤
- [ ] 首屏載入速度明顯加快（有本地數據時不再顯示 Loading）
- [ ] 開兩個 tab → 一邊新增記錄 → 另一邊自動更新（不用重新整理）
- [ ] 手機新增 → 電腦自動出現（需同一 Firebase 帳號）
- [ ] 體重輸入 999 → 彈出「數值過高」提示
- [ ] 身高輸入 -5 → 彈出「數值過低」提示
- [ ] 血壓高壓 < 低壓 → 彈出「高壓必須大於低壓」
- [ ] 點月亮按鈕 → 切換深色模式 → 所有卡片、按鈕、輸入框變暗色
- [ ] 重新整理 → 深色模式保持（localStorage 記住）
- [ ] 跟隨系統偏好（首次未設定時）

---

## 🔮 後續可做

- Dashboard 拆分（C3）
- 單元測試 Vitest（C2）
- 照片附件（Firebase Storage）
- 疫苗推送通知（Web Push）
- 多寶寶切換
