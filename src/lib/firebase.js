import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDRCQgUnwfSJAAk577TmZGg82pB_l3fe1w",
  authDomain: "louise-tracker.firebaseapp.com",
  projectId: "louise-tracker",
  storageBucket: "louise-tracker.firebasestorage.app",
  messagingSenderId: "129214921641",
  appId: "1:129214921641:web:b1270f16953314dca5e2b8"
};

const app = initializeApp(firebaseConfig);

// 啟用 IndexedDB 持久化快取 + 多 tab 同步
// 效果：離線寫入會自動 queue，重連後自動 replay
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

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

// 取得當前 uid（若尚未登入會等到登入完成）
export const getCurrentUid = () => new Promise((resolve) => {
  if (auth.currentUser) return resolve(auth.currentUser.uid);
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    resolve(user?.uid || null);
  });
});

export default db;
