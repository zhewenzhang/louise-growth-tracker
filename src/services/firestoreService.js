import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Firestore 數據服務層
 * 
 * 架構模式：
 *   Collection: growth_records → { id, userId, date, type, value, unit, createdAt }
 *     type: 'weight' | 'height' | 'headCircumference' | 'chestCircumference'
 *   Collection: vaccines → { id, userId, name, dose, recommendedAge, ageMonths, dueDate, completed, date, updatedAt }
 *   Collection: milestones → { id, userId, title, date, emoji, note, createdAt }
 *   Collection: diary_entries → { id, userId, title, date, content, createdAt }
 *   Collection: users → { name, birthDate, gender, updatedAt }  (doc id: louise_default)
 * 
 * 新增功能時只需：
 *   1. 如果是新的 growth type → growth_records 已支援，只需在 UI 加 tab
 *   2. 如果是新的 collection → 複製現有 save/load/delete 函數模式
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
  } catch (e) { console.warn('Firestore save user:', e.message); }
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
    // 母乳/配方奶明細
    if (record.breastMilk !== undefined) data.breastMilk = record.breastMilk;
    if (record.formula !== undefined) data.formula = record.formula;
    await setDoc(doc(db, 'growth_records', record.id), data);
  } catch (e) { console.warn('Firestore save growth:', e.message); }
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
  try { await deleteDoc(doc(db, 'growth_records', id)); } catch (e) { console.warn('Firestore delete growth:', e.message); }
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
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    await batch.commit();
  } catch (e) { console.warn('Firestore save vaccines:', e.message); }
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
  } catch (e) { console.warn('Firestore save milestone:', e.message); }
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
  try { await deleteDoc(doc(db, 'milestones', id)); } catch (e) { console.warn('Firestore delete milestone:', e.message); }
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
  } catch (e) { console.warn('Firestore save diary:', e.message); }
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
  try { await deleteDoc(doc(db, 'diary_entries', id)); } catch (e) { console.warn('Firestore delete diary:', e.message); }
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
  } catch (e) { console.warn('Firestore save BP:', e.message); }
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
  try { await deleteDoc(doc(db, 'blood_pressure', id)); } catch (e) { console.warn('Firestore delete BP:', e.message); }
};
