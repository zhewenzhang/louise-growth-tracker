import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
export default db;
