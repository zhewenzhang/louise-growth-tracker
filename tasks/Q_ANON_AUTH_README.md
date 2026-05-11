<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 匿名登入保護 + README 隱私模糊化

## ⚠️ 前置步驟（使用者需自行操作）

前往 Firebase Console → Authentication → Sign-in method → **啟用匿名登入**：
https://console.firebase.google.com/project/louise-tracker/authentication/providers

這一步不做，App 會停在載入畫面無法進入。

---

## Step 1：firebase.js — 加入匿名 Auth

修改 D:\louise-growth-tracker-gh-pages\src\lib\firebase.js：

```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDRCQgUnwfSJAAk577TmZGg82pB_l3fe1w",
  authDomain: "louise-tracker.firebaseapp.com",
  projectId: "louise-tracker",
  storageBucket: "louise-tracker.firebasestorage.app",
  messagingSenderId: "129214921641",
  appId: "1:129214921641:web:b1270f16953314dca5e2b8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 匿名登入（在 AppContext 初始化時呼叫）
// 回傳 user uid，登入失敗不影響離線功能
export const ensureAuth = async () => {
  try {
    const cred = await signInAnonymously(auth);
    console.log('🔥 匿名登入成功, uid:', cred.user.uid);
    return cred.user.uid;
  } catch (e) {
    console.warn('🔥 匿名登入失敗（不影響離線使用）:', e.message);
    return null;
  }
};

export default db;
```

## Step 2：AppContext.jsx — 初始化時先 Auth

修改 D:\louise-growth-tracker-gh-pages\src\context\AppContext.jsx：

### 2a. import 加入 `ensureAuth`
在現有 imports 中加入：
```jsx
import { ensureAuth } from '../lib/firebase';
```

### 2b. 在 useEffect 開頭加入匿名登入
在 `useEffect` 的第 1 行加入：
```jsx
useEffect(() => {
    (async () => {
      // 匿名登入（背景執行，不阻塞功能）
      ensureAuth();

      let anySuccess = false;
      try {
        // ... 以下保持現有代碼不變（loadUser, loadGrowth, etc.）
```

匿名登入非同步執行，不 await。Firestore 讀寫請求會自動帶上 auth token。

## Step 3：README 隱私模糊化

修改 D:\louise-growth-tracker-gh-pages\README.md：

### 3a. 開頭描述
改前：
```
**Louise 是我們的女兒，34 週又 6 天早產來到這個世界。這個小小的 App，是我們記錄她每一天成長的地方。**
```
改後：
```
**這是為我們的女兒打造的成長記錄 App。記錄每一天的體重、身高、奶量和重要時刻。**
```

### 3b. 功能表「矯正月齡」行
改前：
```
| 👶 **矯正月齡** | 針對早產兒自動計算矯正週齡，所有評估以矯正月齡為準 |
```
改後：
```
| 👶 **矯正月齡** | 針對不同出生週數的寶寶自動計算矯正週齡，評估以矯正月齡為準 |
```

### 3c. 結尾
改前：
```
*從 2026 年 4 月 26 日開始，每一天都在長大。*
```
改後：
```
*每一天都在長大。*
```

## Step 4：Firestore Rules 更新

請到 Firebase Console 更新規則：
https://console.firebase.google.com/project/louise-tracker/firestore/rules

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**注意**：舊規則 `allow read, write: if true` 要替換為 `if request.auth != null`。

## Step 5：構建驗證

```bash
cd D:\louise-growth-tracker-gh-pages
npm run build
npx gh-pages -d dist
```
