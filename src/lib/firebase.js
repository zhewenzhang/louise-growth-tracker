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
