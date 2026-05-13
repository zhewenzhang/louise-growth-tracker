<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# Batch 1：安全 + 隱藏 Bug 修復

**嚴格約束**：
- ✅ 不改變 UI 風格
- ✅ 不改變任何用戶可見的功能行為（除了 Settings 新增一小塊 UID 顯示）
- ❌ 不做 onSnapshot 改造（留給 Batch 2）
- ❌ 不做深色模式、inline style 遷移（另開 task）

---

## 📋 任務範圍

| Step | 內容 | 類別 |
|------|------|------|
| 1 | 啟用 Firestore IndexedDB persistence（離線寫入自動 replay） | 🐛 Bug fix |
| 2 | 疫苗 Firestore 保存缺失的 isCustom + dueDate 欄位 | 🐛 Bug fix |
| 3 | 改生日後自動重算所有疫苗 dueDate | 🐛 Bug fix |
| 4 | Settings 顯示當前匿名 UID + 提供 Firestore Rules 設定指引 | 🔒 安全 |

---

## Step 1：啟用 Firestore IndexedDB Persistence

**問題**：目前離線時所有寫入會 `console.warn` 失敗，重連後不會 replay。用戶可能以為資料有存，實際上遺失。

修改 `src/lib/firebase.js`：

改前：
```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = { ... };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

改後：
```js
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = { ... };

const app = initializeApp(firebaseConfig);

// 啟用 IndexedDB 持久化快取 + 多 tab 同步
// 效果：離線寫入會自動 queue，重連後自動 replay
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
```

`ensureAuth` 函數保留不變。

**注意**：必須用 `initializeFirestore` 取代 `getFirestore`，且必須在**任何** Firestore 操作前呼叫。`persistentMultipleTabManager` 讓多個 tab 共用同一個快取，避免衝突。

**驗證**：build 後開 devtools → Application → IndexedDB 應該看到 `firestore/...` database 被創建。

---

## Step 2：修復疫苗 isCustom + dueDate 欄位遺失

**問題**：`saveVaccinesToFirestore` 沒有保存 `isCustom` 和 `dueDate` 欄位。重新從 Firestore 載入後：
- 自訂疫苗失去「自訂」標記
- 手動編輯過的日期會消失

修改 `src/services/firestoreService.js` 的 `saveVaccinesToFirestore`：

改前：
```js
batch.set(ref, {
  userId: USER_ID,
  name: v.name,
  dose: v.dose,
  recommendedAge: v.recommendedAge,
  ageMonths: v.ageMonths,
  completed: v.completed,
  date: v.date,
  updatedAt: new Date().toISOString(),
}, { merge: true });
```

改後：
```js
batch.set(ref, {
  userId: USER_ID,
  name: v.name,
  dose: v.dose,
  recommendedAge: v.recommendedAge,
  ageMonths: v.ageMonths,
  completed: v.completed,
  date: v.date,
  dueDate: v.dueDate || '',
  isCustom: v.isCustom || false,
  updatedAt: new Date().toISOString(),
}, { merge: true });
```

**驗證**：
1. 新增一個自訂疫苗「腸病毒疫苗」
2. 重新整理頁面
3. 仍能看到「自訂」標籤
4. 編輯某支疫苗日期，重新整理後日期仍在

---

## Step 3：改生日後自動重算疫苗 dueDate

**問題**：`calcVaccineDates` 只在 `AppContext` init 跑一次。用戶在 Settings 改 birthDate 後，所有疫苗的 `dueDate` 還是舊的，但 Dashboard 和 Health 頁面用的是這個 `dueDate` 做「逾期/即將到來」判斷。

修改 `src/context/AppContext.jsx` 的 `updateUser` 函數：

改前：
```jsx
// ── User ──
const updateUser = (u) => {
  const newUser = typeof u === 'function' ? u(user) : u;
  setUser(newUser);
  saveUserToFirestore(newUser);
};
```

改後：
```jsx
// ── User ──
const updateUser = (u) => {
  const newUser = typeof u === 'function' ? u(user) : u;
  const birthChanged = newUser.birthDate !== user?.birthDate;

  setUser(newUser);
  saveUserToFirestore(newUser);

  // 生日變動時重新計算所有疫苗的 dueDate（保留已完成狀態和自訂疫苗）
  if (birthChanged && newUser.birthDate) {
    const recalc = calcVaccineDates(vaccineRecords, newUser.birthDate);
    setVaccineRecords(recalc);
    localStorage.setItem('louise_vaccines', JSON.stringify(recalc));
    saveVaccinesToFirestore(recalc);
  }
};
```

**注意**：`calcVaccineDates` 已 import。它會根據 `ageMonths` 重算 `dueDate`，已完成狀態（completed / date）不受影響，因為它只 spread 後覆蓋 dueDate。

**驗證**：
1. 在 Settings 改生日到一個不同的日期
2. 切到 Health 頁面
3. 確認疫苗的「預計接種日期」對應新生日

---

## Step 4：Settings 顯示 UID + Firestore Rules 指引

**問題**：目前 Firestore Rules 是 `if request.auth != null`，意思是**任何匿名用戶都能存取所有資料**。部署在公開 URL 上等於資料裸奔。

修法策略：
- 保留 `USER_ID = 'louise_default'` 作為資料命名空間（避免遷移現有資料）
- 把 Firestore Rules 改為 `request.auth.uid in ['uid1', 'uid2']` 白名單
- 用戶需要知道自己的 UID 才能填入規則
- 因此在 Settings 顯示 UID + 提供 rules 範本供複製

### 4a. firebase.js 匯出 `getCurrentUid` helper

修改 `src/lib/firebase.js`，在 `ensureAuth` 之後新增：

```js
import { onAuthStateChanged } from 'firebase/auth';

// 取得當前 uid（若尚未登入會等到登入完成）
export const getCurrentUid = () => new Promise((resolve) => {
  if (auth.currentUser) return resolve(auth.currentUser.uid);
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    resolve(user?.uid || null);
  });
});
```

### 4b. Settings.jsx 新增「雲端同步狀態」卡片

修改 `src/components/pages/Settings.jsx`，在「關於」卡片**之前**新增：

```jsx
import { getCurrentUid } from '../../lib/firebase';
// ...

const [uid, setUid] = useState('');
const [copyStatus, setCopyStatus] = useState('');

useEffect(() => {
  getCurrentUid().then(id => setUid(id || '未登入'));
}, []);

const handleCopyUid = () => {
  navigator.clipboard.writeText(uid);
  setCopyStatus('✅ 已複製');
  setTimeout(() => setCopyStatus(''), 2000);
};

const rulesTemplate = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth.uid in [
        "${uid}"
      ];
    }
  }
}`;

const handleCopyRules = () => {
  navigator.clipboard.writeText(rulesTemplate);
  setCopyStatus('✅ 規則已複製');
  setTimeout(() => setCopyStatus(''), 2000);
};
```

UI 部分（插在「關於」卡片之前）：

```jsx
{/* 雲端同步 */}
<div className="card">
  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>
    🔒 雲端同步安全
  </h3>
  <div className="space-y-3">
    <div>
      <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
        當前裝置 UID
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={uid}
          readOnly
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
        <button type="button" onClick={handleCopyUid} className="btn-sm" style={{ flexShrink: 0 }}>
          📋
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>
        每個裝置/瀏覽器有獨立 UID。清除瀏覽器資料會產生新 UID。
      </p>
    </div>

    <details>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
        📖 如何設定 Firestore 存取規則（必讀）
      </summary>
      <div style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.8 }}>
        <p style={{ marginBottom: 8 }}>
          前往 <a
            href="https://console.firebase.google.com/project/louise-tracker/firestore/rules"
            target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--blue)', textDecoration: 'underline' }}
          >Firebase Console → Firestore Rules</a>
          ，複製下方規則貼上並發布：
        </p>
        <pre style={{
          background: '#2d2d2d', color: '#fdfbf7',
          padding: 12, borderRadius: 'var(--wobbly-sm)',
          fontSize: '0.7rem', overflow: 'auto', fontFamily: 'monospace',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{rulesTemplate}</pre>
        <button type="button" onClick={handleCopyRules} className="btn-sm" style={{ marginTop: 8 }}>
          📋 複製規則
        </button>
        <p style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.7 }}>
          ⚠️ 其他裝置登入時會有不同 UID，需在 <code>request.auth.uid in [...]</code> 陣列中新增該 UID。
        </p>
      </div>
    </details>

    {copyStatus && (
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--green)' }}>{copyStatus}</p>
    )}
  </div>
</div>
```

**重要**：
- 需要 import `useEffect`（原本只有 `useState, useRef`）
- 用戶第一次打開看到自己的 UID 後，才能去 Firebase Console 更新規則
- 規則更新後，**舊的 `if request.auth != null` 要完全取代掉**

### 4c. 使用者操作指引（寫在 task 最後提醒）

完成代碼修改後，**使用者需手動操作**：
1. 打開 app → 設定頁面
2. 複製「當前裝置 UID」
3. 打開 Firebase Console Rules 頁面
4. 貼上新規則（包含自己的 UID），發布
5. 若要從手機也能用，手機打開 app，記下手機的 UID，把它加進規則陣列

---

## Step 5：構建驗證

```bash
npm run build
```

驗證清單：
- [ ] 構建無錯誤
- [ ] Settings 頁面看到「雲端同步安全」卡片，顯示一串 UID（非 "未登入"）
- [ ] 點「📋」能複製 UID
- [ ] 點 details 展開能看到 Firestore Rules 範本
- [ ] 新增自訂疫苗 + 編輯日期 → 重新整理 → 自訂標籤和日期都還在
- [ ] 在 Settings 改生日 → 切到 Health → 疫苗日期已重算
- [ ] DevTools → Application → IndexedDB 能看到 firebaseLocalStorageDb / firestore 相關 DB
- [ ] 開瀏覽器離線模式 → 新增記錄不報錯 → 恢復連線 → 重整後記錄仍在 Firestore

---

## 🚨 部署後的必要手動步驟

⚠️ **A1 Firestore Rules 不更新 = 資料繼續裸奔**。務必在本次部署完成後：

1. `npm run build && npx gh-pages -d dist`
2. 等 Pages 生效（1-2 分鐘）
3. 打開 app → Settings → 複製 UID
4. Firebase Console → Rules → 貼上新規則 → 發布
5. 測試：打開隱私瀏覽視窗開 app → 應該看不到任何資料（被 rules 擋住）

---

## 🔮 Batch 2 預告（未涵蓋）

- B1 Firestore onSnapshot realtime 同步
- B2 漸進式載入（localStorage 先顯示）
- B3 資料範圍驗證
- B5 深色模式切換
