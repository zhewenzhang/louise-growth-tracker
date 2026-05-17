import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, deleteDoc, getDocs, writeBatch, updateDoc, onSnapshot } from 'firebase/firestore';

// ── 寫入錯誤通知機制 ──
// 寫入失敗�?dispatch 全域事件，AppContext 監聽後可顯示警告給用�?// 避免靜默吞掉錯誤造成「以為存了但沒存」的慘況
const notifyWriteError = (operation, error) => {
  console.error(`🔥 Firestore ${operation} FAILED:`, error.code || '', error.message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-write-error', {
      detail: { operation, code: error.code, message: error.message, timestamp: Date.now() },
    }));
  }
};

/**
 * Firestore 數據服務�? * 
 * 架構模式�? *   Collection: growth_records �?{ id, userId, date, type, value, unit, createdAt }
 *     type: 'weight' | 'height' | 'headCircumference' | 'chestCircumference'
 *   Collection: vaccines �?{ id, userId, name, dose, recommendedAge, ageMonths, dueDate, completed, date, updatedAt }
 *   Collection: milestones �?{ id, userId, title, date, emoji, note, createdAt }
 *   Collection: diary_entries �?{ id, userId, title, date, content, createdAt }
 *   Collection: users �?{ name, birthDate, gender, updatedAt }  (doc id: louise_default)
 * 
 * 新增功能時只需�? *   1. 如果是新�?growth type �?growth_records 已支援，只需�?UI �?tab
 *   2. 如果是新�?collection �?複製現有 save/load/delete 函數模式
 */

const USER_ID = 'louise_default';

// ── User ──
export const saveUserToFirestore = async (user) => {
  try {
    await setDoc(doc(db, 'users', USER_ID), {
      name: user.name,
      birthDate: user.birthDate,
      dueDate: user.dueDate || '',
      gender: user.gender || 'female',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) { notifyWriteError('save user', e); }
};

export const loadUserFromFirestore = async () => {
  try {
    const snap = await getDoc(doc(db, 'users', USER_ID));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.error('🔥 Firestore load user FAILED:', e.code, e.message, e);
  }
  return null;
};

// ── Growth Records ──
export const saveGrowthToFirestore = async (record) => {
  try {
    const data = {
      userId: USER_ID,
      date: record.date,
      type: record.type,
      value: record.value,
      unit: record.unit,
      createdAt: new Date().toISOString(),
    };
    // 奶量記錄附帶時間
    if (record.time) data.time = record.time;
    // 母乳/配方奶明細（即使是 0 也明確存，避免後續判斷錯誤）
    if (record.type === 'feeding') {
      data.breastMilk = Number(record.breastMilk) || 0;
      data.formula = Number(record.formula) || 0;
    } else {
      if (record.breastMilk !== undefined) data.breastMilk = record.breastMilk;
      if (record.formula !== undefined) data.formula = record.formula;
    }
    await setDoc(doc(db, 'growth_records', record.id), data);
  } catch (e) { notifyWriteError('save growth', e); }
};

export const loadGrowthFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'growth_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    return data;
  } catch (e) {
    console.error('🔥 Firestore load growth FAILED:', e.code, e.message, e);
    return null;
  }
};

export const deleteGrowthFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'growth_records', id)); } catch (e) { notifyWriteError('delete growth', e); }
};

// ── Vaccines ──
export const saveVaccinesToFirestore = async (vaccines) => {
  try {
    const batch = writeBatch(db);
    vaccines.forEach(v => {
      const ref = doc(db, 'vaccines', v.id);
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
    });
    await batch.commit();
  } catch (e) { notifyWriteError('save vaccines', e); }
};

export const loadVaccinesFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'vaccines'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => a.ageMonths - b.ageMonths);
    return data;
  } catch (e) {
    console.error('🔥 Firestore load vaccines FAILED:', e.code, e.message, e);
    return null;
  }
};

// ── Milestones ──
export const saveMilestoneToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'milestones', record.id), {
      userId: USER_ID,
      title: record.title,
      date: record.date,
      emoji: record.emoji,
      note: record.note || '',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save milestone', e); }
};

export const loadMilestonesFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'milestones'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return data;
  } catch (e) {
    console.error('🔥 Firestore load milestones FAILED:', e.code, e.message, e);
    return null;
  }
};

export const deleteMilestoneFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'milestones', id)); } catch (e) { notifyWriteError('delete milestone', e); }
};

// ── Diary ──
export const saveDiaryToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'diary_entries', record.id), {
      userId: USER_ID,
      title: record.title,
      date: record.date,
      content: record.content,
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save diary', e); }
};

export const loadDiaryFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'diary_entries'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return data;
  } catch (e) {
    console.error('🔥 Firestore load diary FAILED:', e.code, e.message, e);
    return null;
  }
};

export const deleteDiaryFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'diary_entries', id)); } catch (e) { notifyWriteError('delete diary', e); }
};

// ── Medications ──
export const saveMedicationToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'medications', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      name: record.name,
      dose: record.dose || '',
      frequency: record.frequency || '',
      reason: record.reason || '',
      note: record.note || '',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save medication', e); }
};

export const loadMedicationsFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'medications'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load medication:', e.message); return null; }
};

export const deleteMedicationFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'medications', id)); } catch (e) { notifyWriteError('delete medication', e); }
};

export const updateMedicationInFirestore = async (id, fields) => {
  try { await updateDoc(doc(db, 'medications', id), fields); } catch (e) { notifyWriteError('update medication', e); }
};

// ── Doctor Visits ──
export const saveDoctorVisitToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'doctor_visits', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      hospital: record.hospital || '',
      location: record.location || '',
      department: record.department || '',
      visitNumber: record.visitNumber || '',
      doctor: record.doctor || '',
      reason: record.reason || '',
      questions: record.questions || '',
      diagnosis: record.diagnosis || '',
      advice: record.advice || '',
      followUpDate: record.followUpDate || '',
      status: record.status || 'completed',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save doctor visit', e); }
};

export const loadDoctorVisitsFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'doctor_visits'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load doctor visit:', e.message); return null; }
};

export const deleteDoctorVisitFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'doctor_visits', id)); } catch (e) { notifyWriteError('delete doctor visit', e); }
};

// ── Blood Pressure ──
export const saveBloodPressureToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'blood_pressure', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      systolic: record.systolic,
      diastolic: record.diastolic,
      pulse: record.pulse,
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save BP', e); }
};

export const loadBloodPressureFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'blood_pressure'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load BP:', e.message); return null; }
};

export const deleteBloodPressureFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'blood_pressure', id)); } catch (e) { notifyWriteError('delete BP', e); }
};


// ════════════════════════════════════════════════════════════════
//  即時同步訂閱（onSnapshot�?//  解決多裝置同步問題：任何裝置寫入 Firestore，所有監聽中的裝置會即時收到更新
// ════════════════════════════════════════════════════════════════

/**
 * 訂閱單一文件（用�?user�? * @returns unsubscribe function
 */
export const subscribeToUser = (callback) => {
  return onSnapshot(doc(db, 'users', USER_ID), (snap) => {
    if (snap.exists()) callback(snap.data());
  }, (err) => {
    console.warn('🔥 subscribe user error:', err.message);
  });
};

/**
 * 訂閱整�?collection
 * @param colName collection 名稱
 * @param sortFn 可選排序函數
 * @returns unsubscribe function
 */
export const subscribeToCollection = (colName, callback, sortFn) => {
  return onSnapshot(collection(db, colName), (snap) => {
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (sortFn) data.sort(sortFn);
    callback(data);
  }, (err) => {
    console.warn(`🔥 subscribe ${colName} error:`, err.message);
  });
};
