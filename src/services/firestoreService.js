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

// ── Growth Records (Weight, Height, Head, Chest) ──
export const saveGrowthToFirestore = async (record) => {
  if (!record) return;
  if (record.type === 'feeding') {
    return saveFeedingToFirestore(record);
  }
  try {
    const data = {
      userId: USER_ID,
      date: record.date,
      type: record.type,
      value: record.value,
      unit: record.unit,
      createdAt: new Date().toISOString(),
    };
    if (record.time) data.time = record.time;
    await setDoc(doc(db, 'growth_records', record.id), data);
  } catch (e) { notifyWriteError('save growth', e); }
};

export const loadGrowthFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'growth_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // 只保留身高、體重、頭圍、胸圍記錄
    const filtered = data.filter(d => d.type !== 'feeding');
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    return filtered;
  } catch (e) {
    console.error('🔥 Firestore load growth FAILED:', e.code, e.message, e);
    return null;
  }
};

export const deleteGrowthFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'growth_records', id)); } catch (e) { notifyWriteError('delete growth', e); }
};

// ── Feeding Records (独立高频集合) ──
export const saveFeedingToFirestore = async (record) => {
  if (!record) return;
  try {
    const bm = Number(record.breastMilk) || 0;
    const fm = Number(record.formula) || 0;
    // 只有當明確填寫了母乳或配方奶 (> 0) 時，才重新加和；否則保留原有的 record.value (防止歷史記錄被清零)
    const val = (bm > 0 || fm > 0) ? (bm + fm) : (Number(record.value) || Number(record.amount) || 0);

    const data = {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      type: 'feeding',
      breastMilk: bm,
      formula: fm,
      value: val,
      unit: 'ml',
      note: record.note || '',
      batchId: record.batchId || null,
      createdAt: record.createdAt || new Date().toISOString(),
    };
    await setDoc(doc(db, 'feeding_records', record.id), data);
  } catch (e) { notifyWriteError('save feeding', e); }
};

export const loadFeedingsFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'feeding_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      if (a.date === b.date && a.time && b.time) return a.time.localeCompare(b.time);
      return new Date(a.date) - new Date(b.date);
    });
    return data;
  } catch (e) {
    console.warn('🔥 Firestore load feedings:', e.message);
    return null;
  }
};

export const deleteFeedingFromFirestore = async (id) => {
  try {
    // 兼顧舊版 growth_records 裡的 feeding 和新版 feeding_records
    await deleteDoc(doc(db, 'feeding_records', id));
    await deleteDoc(doc(db, 'growth_records', id));
  } catch (e) { notifyWriteError('delete feeding', e); }
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

export const deleteVaccineFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'vaccines', id)); } catch (e) { notifyWriteError('delete vaccine', e); }
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

// ── Temperature (體溫/發燒記錄) ──
export const saveTemperatureToFirestore = async (record) => {
  try {
    const rawTemp = Number(record.temperature);
    const method = record.method || 'ear';
    // 腋溫通常需 +0.5°C 作為實際核心體溫參考
    const refTemp = method === 'armpit' ? (rawTemp + 0.5) : rawTemp;
    const feverStatus = record.feverStatus || (refTemp >= 38.5 ? 'high' : refTemp >= 37.5 ? 'mild' : 'normal');

    await setDoc(doc(db, 'temperature_records', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      temperature: rawTemp,
      method,
      refTemperature: parseFloat(refTemp.toFixed(1)),
      feverStatus,
      medicationName: record.medicationName || '',
      note: record.note || '',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save temperature', e); }
};

export const loadTemperaturesFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'temperature_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load temperature:', e.message); return null; }
};

export const deleteTemperatureFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'temperature_records', id)); } catch (e) { notifyWriteError('delete temperature', e); }
};

// ── Sleep (睡眠記錄) ──
export const saveSleepToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'sleep_records', record.id), {
      userId: USER_ID,
      date: record.date,
      startTime: record.startTime || '',
      endTime: record.endTime || '',
      durationMinutes: Number(record.durationMinutes) || 0,
      quality: record.quality || 'good',
      note: record.note || '',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save sleep', e); }
};

export const loadSleepFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'sleep_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date + 'T' + (b.startTime || '00:00')) - new Date(a.date + 'T' + (a.startTime || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load sleep:', e.message); return null; }
};

export const deleteSleepFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'sleep_records', id)); } catch (e) { notifyWriteError('delete sleep', e); }
};

// ── Diaper (尿布/排泄記錄) ──
export const saveDiaperToFirestore = async (record) => {
  try {
    await setDoc(doc(db, 'diaper_records', record.id), {
      userId: USER_ID,
      date: record.date,
      time: record.time || '',
      type: record.type || 'wet', // 'wet' | 'poop' | 'both'
      poopColor: record.poopColor || '',
      poopTexture: record.poopTexture || '',
      note: record.note || '',
      createdAt: new Date().toISOString(),
    });
  } catch (e) { notifyWriteError('save diaper', e); }
};

export const loadDiapersFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'diaper_records'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    return data;
  } catch (e) { console.warn('Firestore load diaper:', e.message); return null; }
};

export const deleteDiaperFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'diaper_records', id)); } catch (e) { notifyWriteError('delete diaper', e); }
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
 * 訂閱整?collection
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

/**
 * 訂閱喂奶記錄（兼顧新舊 Collection 平滑過渡）
 */
export const subscribeToFeedings = (callback) => {
  let legacyData = [];
  let newData = [];

  const mergeAndEmit = () => {
    const map = new Map();
    // 優先保留新 collection 的資料
    legacyData.forEach(item => map.set(item.id, item));
    newData.forEach(item => map.set(item.id, item));
    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      if (a.date === b.date && a.time && b.time) return a.time.localeCompare(b.time);
      return new Date(a.date) - new Date(b.date);
    });
    callback(merged);
  };

  const unsubNew = onSnapshot(collection(db, 'feeding_records'), (snap) => {
    newData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mergeAndEmit();
  }, (err) => console.warn('🔥 subscribe feeding_records error:', err.message));

  const unsubLegacy = onSnapshot(collection(db, 'growth_records'), (snap) => {
    legacyData = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.type === 'feeding');
    mergeAndEmit();
  }, (err) => console.warn('🔥 subscribe legacy growth feeding error:', err.message));

  return () => {
    unsubNew();
    unsubLegacy();
  };
};


// ════════════════════════════════════════════════════════════════
//  照片批量匯入（Feeding Batches）
//  記錄每次 AI 識別批量上傳，方便日後倒查、整批撤銷
// ════════════════════════════════════════════════════════════════
import { storage } from '../lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * 上傳原始照片到 Firebase Storage
 * @param {string} batchId 批次 ID
 * @param {string} dataURL 圖片 base64
 * @returns {Promise<string>} 下載 URL（失敗回傳空字串）
 */
export const uploadBatchImage = async (batchId, dataURL) => {
  try {
    const path = `feeding_photos/${batchId}.jpg`;
    const ref = storageRef(storage, path);
    await uploadString(ref, dataURL, 'data_url');
    return await getDownloadURL(ref);
  } catch (e) {
    notifyWriteError('upload batch image', e);
    return '';
  }
};

/**
 * 儲存批次記錄
 */
export const saveBatchToFirestore = async (batch) => {
  try {
    await setDoc(doc(db, 'feeding_batches', batch.id), {
      userId: USER_ID,
      uploadedAt: batch.uploadedAt,
      model: batch.model || '',
      recordCount: batch.recordCount || 0,
      recordIds: batch.recordIds || [],
      imageUrl: batch.imageUrl || '',
      note: batch.note || '',
    });
  } catch (e) { notifyWriteError('save batch', e); }
};

export const loadBatchesFromFirestore = async () => {
  try {
    const snap = await getDocs(collection(db, 'feeding_batches'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    return data;
  } catch (e) { console.warn('Firestore load batches:', e.message); return null; }
};

export const deleteBatchFromFirestore = async (id) => {
  try { await deleteDoc(doc(db, 'feeding_batches', id)); } catch (e) { notifyWriteError('delete batch', e); }
};

export const subscribeToBatches = (callback) => {
  return onSnapshot(collection(db, 'feeding_batches'), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    callback(data);
  }, (err) => console.warn('🔥 subscribe batches error:', err.message));
};
