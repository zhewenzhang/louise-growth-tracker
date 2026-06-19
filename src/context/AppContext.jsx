import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_VACCINES, calcVaccineDates } from '../data/vaccines';
import { ensureAuth } from '../lib/firebase';
import { genId } from '../utils/id';
import {
  saveUserToFirestore, loadUserFromFirestore,
  saveGrowthToFirestore, loadGrowthFromFirestore, deleteGrowthFromFirestore,
  saveVaccinesToFirestore, loadVaccinesFromFirestore,
  saveMilestoneToFirestore, loadMilestonesFromFirestore, deleteMilestoneFromFirestore,
  saveDiaryToFirestore, loadDiaryFromFirestore, deleteDiaryFromFirestore,
  saveBloodPressureToFirestore, loadBloodPressureFromFirestore, deleteBloodPressureFromFirestore,
  saveMedicationToFirestore, loadMedicationsFromFirestore, deleteMedicationFromFirestore,
  saveDoctorVisitToFirestore, loadDoctorVisitsFromFirestore, deleteDoctorVisitFromFirestore,
  subscribeToUser, subscribeToCollection,
  saveBatchToFirestore, deleteBatchFromFirestore, subscribeToBatches, uploadBatchImage,
} from '../services/firestoreService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('louise_user', { name: 'Louise', birthDate: '2026-04-26', dueDate: '2026-06-01', gender: 'female' });
  const [growthRecords, setGrowthRecords] = useLocalStorage('louise_growth', []);
  const [vaccineRecords, setVaccineRecords] = useLocalStorage('louise_vaccines',
    calcVaccineDates(DEFAULT_VACCINES.map(v => ({ ...v, completed: false, date: null })), '2026-04-26')
  );
  const [milestones, setMilestones] = useLocalStorage('louise_milestones', []);
  const [diaryEntries, setDiaryEntries] = useLocalStorage('louise_diary', []);
  const [bpRecords, setBpRecords] = useLocalStorage('louise_blood_pressure', []);
  const [medications, setMedications] = useLocalStorage('louise_medications', []);
  const [doctorVisits, setDoctorVisits] = useLocalStorage('louise_doctor_visits', []);
  const [feedingBatches, setFeedingBatches] = useLocalStorage('louise_feeding_batches', []);
  const [loaded, setLoaded] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState('connecting'); // 'connecting' | 'connected' | 'empty' | 'error'
  const [writeError, setWriteError] = useState(null); // 寫入失敗時的最新錯誤

  // 監聽 Firestore 寫入失敗事件（避免靜默吞掉錯誤）
  useEffect(() => {
    const handler = (e) => {
      setWriteError({
        operation: e.detail.operation,
        message: e.detail.message,
        timestamp: e.detail.timestamp,
      });
      // 5 秒後自動清除（除非有新錯誤覆蓋）
      setTimeout(() => {
        setWriteError(prev => (prev && prev.timestamp === e.detail.timestamp) ? null : prev);
      }, 8000);
    };
    window.addEventListener('firestore-write-error', handler);
    return () => window.removeEventListener('firestore-write-error', handler);
  }, []);

  // 初始化：訂閱 Firestore 即時更新（支援多裝置同步）
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

    const unsubscribers = [];
    let firstSnapReceived = false;
    const markLoaded = () => {
      if (!firstSnapReceived) {
        firstSnapReceived = true;
        setLoaded(true);
        setFirestoreStatus('connected');
        clearTimeout(timeoutId);
      }
    };

    (async () => {
      // 匿名登入（必須先完成才能讀寫 Firestore，規則要求 auth != null）
      await ensureAuth();

      try {
        // ── 一次性讀取（首次資料遷移用）──
        // 如果 Firestore 完全為空但 localStorage 有資料，把本地資料推上去
        // 之後就完全靠 onSnapshot 即時同步
        const [
          remoteUser, remoteGrowth, remoteVaccines, remoteMilestones,
          remoteDiary, remoteBp, remoteMed, remoteVisits,
        ] = await Promise.all([
          loadUserFromFirestore(),
          loadGrowthFromFirestore(),
          loadVaccinesFromFirestore(),
          loadMilestonesFromFirestore(),
          loadDiaryFromFirestore(),
          loadBloodPressureFromFirestore(),
          loadMedicationsFromFirestore(),
          loadDoctorVisitsFromFirestore(),
        ]);

        // ════════════════════════════════════════════════════════
        // 救援機制：每次啟動時，把「本地有但雲端沒有」的資料推上去
        // 即使之前有 bug 導致雲端資料丟失，只要本地還有就能找回來
        // ════════════════════════════════════════════════════════
        const rescueRecords = (lsKey, remoteData, saveFn, getId = r => r.id) => {
          if (!Array.isArray(remoteData)) return 0; // 載入失敗時不救援，避免重複寫入
          const ls = JSON.parse(localStorage.getItem(lsKey) || '[]');
          if (!Array.isArray(ls) || ls.length === 0) return 0;
          const remoteIds = new Set(remoteData.map(r => getId(r) || r.id));
          const missing = ls.filter(r => !remoteIds.has(getId(r) || r.id));
          if (missing.length > 0) {
            console.log(`🆘 救援 ${lsKey}: 本地有 ${missing.length} 筆雲端缺失的資料，推送中...`);
            missing.forEach(r => saveFn(r));
          }
          return missing.length;
        };

        let rescuedCount = 0;
        rescuedCount += rescueRecords('louise_growth', remoteGrowth, saveGrowthToFirestore);
        rescuedCount += rescueRecords('louise_milestones', remoteMilestones, saveMilestoneToFirestore);
        rescuedCount += rescueRecords('louise_diary', remoteDiary, saveDiaryToFirestore);
        rescuedCount += rescueRecords('louise_blood_pressure', remoteBp, saveBloodPressureToFirestore);
        rescuedCount += rescueRecords('louise_medications', remoteMed, saveMedicationToFirestore);
        rescuedCount += rescueRecords('louise_doctor_visits', remoteVisits, saveDoctorVisitToFirestore);

        if (rescuedCount > 0) {
          console.log(`✅ 已救援 ${rescuedCount} 筆遺失的資料`);
        }

        // 首次遷移邏輯：只在 Firestore 真的回傳「空陣列」（不是 null/載入失敗）時，
        // 才把 localStorage 推上去。避免因為網路問題把舊資料覆蓋雲端的新資料。
        // ⚠️ 必須 await，否則 subscribeToCollection 會先收到 empty snapshot 把本地清空
        const migrationPromises = [];

        if (Array.isArray(remoteGrowth) && remoteGrowth.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_growth') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveGrowthToFirestore(r)));
        }
        if (Array.isArray(remoteVaccines) && remoteVaccines.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_vaccines') || 'null');
          if (ls && ls.length > 0) migrationPromises.push(saveVaccinesToFirestore(ls));
        }
        if (Array.isArray(remoteMilestones) && remoteMilestones.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_milestones') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveMilestoneToFirestore(r)));
        }
        if (Array.isArray(remoteDiary) && remoteDiary.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_diary') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveDiaryToFirestore(r)));
        }
        if (Array.isArray(remoteBp) && remoteBp.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_blood_pressure') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveBloodPressureToFirestore(r)));
        }
        if (Array.isArray(remoteMed) && remoteMed.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_medications') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveMedicationToFirestore(r)));
        }
        if (Array.isArray(remoteVisits) && remoteVisits.length === 0) {
          const ls = JSON.parse(localStorage.getItem('louise_doctor_visits') || '[]');
          if (ls.length > 0) ls.forEach(r => migrationPromises.push(saveDoctorVisitToFirestore(r)));
        }
        if (!remoteUser) {
          const lsUser = JSON.parse(localStorage.getItem('louise_user') || 'null');
          if (lsUser?.name) migrationPromises.push(saveUserToFirestore(lsUser));
        }

        // 等遷移完成才開始訂閱，避免 empty snapshot 清空本地資料
        if (migrationPromises.length > 0) {
          console.log(`📤 首次遷移 ${migrationPromises.length} 筆本地資料到雲端...`);
          await Promise.all(migrationPromises);
          console.log('✅ 首次遷移完成');
        }

        // ── 訂閱即時同步（核心同步邏輯）──
        // 任何裝置寫入 Firestore，所有訂閱中的裝置會即時收到更新
        unsubscribers.push(subscribeToUser((data) => {
          if (data?.name) {
            setUser({
              name: data.name,
              birthDate: data.birthDate,
              dueDate: data.dueDate || data.birthDate,
              gender: data.gender || 'female',
            });
            localStorage.setItem('louise_user', JSON.stringify({
              name: data.name, birthDate: data.birthDate,
              dueDate: data.dueDate || data.birthDate, gender: data.gender || 'female',
            }));
          }
          markLoaded();
        }));

        unsubscribers.push(subscribeToCollection('growth_records', (data) => {
          setGrowthRecords(data);
          localStorage.setItem('louise_growth', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(a.date) - new Date(b.date)));

        unsubscribers.push(subscribeToCollection('vaccines', (data) => {
          // 不再強制重算 dueDate（避免覆蓋手動編輯）
          // dueDate 已經在 saveVaccinesToFirestore 時保存到雲端，直接用即可
          // 只在缺失時補算（保險起見）
          const currentBirthDate = remoteUser?.birthDate
            || JSON.parse(localStorage.getItem('louise_user') || '{}').birthDate
            || '2026-04-26';
          const filled = data.map(v => {
            if (v.dueDate) return v; // 已有 dueDate（不論手動還是計算過的）
            // 缺 dueDate 才計算
            const birth = new Date(currentBirthDate);
            const due = new Date(birth);
            due.setMonth(birth.getMonth() + (v.ageMonths || 0));
            return { ...v, dueDate: due.toISOString().split('T')[0] };
          });
          setVaccineRecords(filled);
          localStorage.setItem('louise_vaccines', JSON.stringify(filled));
          markLoaded();
        }, (a, b) => (a.ageMonths || 0) - (b.ageMonths || 0)));

        unsubscribers.push(subscribeToCollection('milestones', (data) => {
          setMilestones(data);
          localStorage.setItem('louise_milestones', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(b.date) - new Date(a.date)));

        unsubscribers.push(subscribeToCollection('diary_entries', (data) => {
          setDiaryEntries(data);
          localStorage.setItem('louise_diary', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(b.date) - new Date(a.date)));

        unsubscribers.push(subscribeToCollection('blood_pressure', (data) => {
          setBpRecords(data);
          localStorage.setItem('louise_blood_pressure', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))));

        unsubscribers.push(subscribeToCollection('medications', (data) => {
          setMedications(data);
          localStorage.setItem('louise_medications', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))));

        unsubscribers.push(subscribeToCollection('doctor_visits', (data) => {
          setDoctorVisits(data);
          localStorage.setItem('louise_doctor_visits', JSON.stringify(data));
          markLoaded();
        }, (a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))));

        unsubscribers.push(subscribeToBatches((data) => {
          setFeedingBatches(data);
          localStorage.setItem('louise_feeding_batches', JSON.stringify(data));
        }));

      } catch (e) {
        console.error('Firestore 訂閱錯誤:', e.code, e.message, e);
        setFirestoreStatus('error');
        setLoaded(true);
        clearTimeout(timeoutId);
      }
    })();

    // 組件卸載時取消所有訂閱
    return () => {
      unsubscribers.forEach(unsub => { try { unsub(); } catch {} });
      clearTimeout(timeoutId);
    };
  }, []);

  // Growth
  const addGrowthRecord = (r) => {
    const record = { ...r, id: r.id || genId() };
    setGrowthRecords(prev => [...prev, record]);
    saveGrowthToFirestore(record);
  };
  const deleteGrowthRecord = (id) => {
    setGrowthRecords(prev => prev.filter(r => r.id !== id));
    deleteGrowthFromFirestore(id);
  };
  const updateGrowthRecord = (id, updates) => {
    setGrowthRecords(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      const target = updated.find(r => r.id === id);
      if (target) saveGrowthToFirestore(target);
      return updated;
    });
  };

  // Vaccines
  const toggleVaccine = (id) => {
    setVaccineRecords(prev => {
      const updated = prev.map(v =>
        v.id !== id ? v : v.completed ? { ...v, completed: false, date: null } : { ...v, completed: true, date: new Date().toISOString().split('T')[0] }
      );
      saveVaccinesToFirestore(updated);
      return updated;
    });
  };

  // 新增自定義疫苗
  const addCustomVaccine = (vaccine) => {
    const newVaccine = {
      id: 'custom_' + genId(),
      name: vaccine.name,
      dose: vaccine.dose || '1劑',
      recommendedAge: vaccine.recommendedAge || '自訂',
      ageMonths: vaccine.ageMonths || 0,
      dueDate: vaccine.dueDate || '',
      completed: false,
      date: null,
      isCustom: true,
    };
    setVaccineRecords(prev => {
      const updated = [...prev, newVaccine];
      localStorage.setItem('louise_vaccines', JSON.stringify(updated));
      saveVaccinesToFirestore(updated);
      return updated;
    });
  };

  // 手動編輯疫苗日期
  const updateVaccineDate = (id, newDueDate) => {
    setVaccineRecords(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, dueDate: newDueDate } : v);
      localStorage.setItem('louise_vaccines', JSON.stringify(updated));
      saveVaccinesToFirestore(updated);
      return updated;
    });
  };

  // Milestones
  const addMilestone = (r) => {
    const record = { ...r, id: r.id || genId() };
    setMilestones(prev => [record, ...prev]);
    saveMilestoneToFirestore(record);
  };
  const deleteMilestone = (id) => {
    setMilestones(prev => prev.filter(r => r.id !== id));
    deleteMilestoneFromFirestore(id);
  };

  // Diary
  const addDiaryEntry = (r) => {
    const record = { ...r, id: r.id || genId() };
    setDiaryEntries(prev => [record, ...prev]);
    saveDiaryToFirestore(record);
  };
  const deleteDiaryEntry = (id) => {
    setDiaryEntries(prev => prev.filter(r => r.id !== id));
    deleteDiaryFromFirestore(id);
  };

  // Blood Pressure
  const addBpRecord = (r) => {
    const record = { ...r, id: r.id || genId() };
    setBpRecords(prev => [...prev, record]);
    saveBloodPressureToFirestore(record);
  };
  const deleteBpRecord = (id) => {
    setBpRecords(prev => prev.filter(r => r.id !== id));
    deleteBloodPressureFromFirestore(id);
  };

  // Medications
  const addMedication = (r) => {
    const record = { ...r, id: r.id || genId() };
    setMedications(prev => [record, ...prev]);
    saveMedicationToFirestore(record);
  };
  const deleteMedication = (id) => {
    setMedications(prev => prev.filter(r => r.id !== id));
    deleteMedicationFromFirestore(id);
  };
  const updateMedication = (id, updates) => {
    setMedications(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      const target = updated.find(m => m.id === id);
      if (target) saveMedicationToFirestore(target);
      return updated;
    });
  };

  // Doctor Visits
  const addDoctorVisit = (r) => {
    const record = { ...r, id: r.id || genId() };
    setDoctorVisits(prev => [record, ...prev]);
    saveDoctorVisitToFirestore(record);
  };
  const updateDoctorVisit = (id, updates) => {
    setDoctorVisits(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updates } : v);
      const target = updated.find(v => v.id === id);
      if (target) saveDoctorVisitToFirestore(target);
      return updated;
    });
  };
  const deleteDoctorVisit = (id) => {
    setDoctorVisits(prev => prev.filter(r => r.id !== id));
    deleteDoctorVisitFromFirestore(id);
  };

  // 照片批量匯入餵奶記錄
  const importFeedingBatch = async (records, meta = {}) => {
    const batchId = genId();
    const recordIds = [];

    // 1. 批量寫入餵奶記錄
    const newRecords = records.map(r => {
      const id = genId();
      recordIds.push(id);
      const bm = Number(r.breastMilk) || 0;
      const fm = Number(r.formula) || 0;
      return {
        id,
        date: r.date,
        time: r.time || '',
        type: 'feeding',
        unit: 'ml',
        breastMilk: bm,
        formula: fm,
        value: bm + fm,
        note: r.note || '',
        batchId,
      };
    });

    setGrowthRecords(prev => [...prev, ...newRecords]);
    newRecords.forEach(r => saveGrowthToFirestore(r));

    // 2. 上傳原圖到 Storage（可選）
    let imageUrl = '';
    if (meta.imageDataURL) {
      imageUrl = await uploadBatchImage(batchId, meta.imageDataURL);
    }

    // 3. 儲存批次記錄
    const batch = {
      id: batchId,
      uploadedAt: new Date().toISOString(),
      model: meta.model || '',
      recordCount: newRecords.length,
      recordIds,
      imageUrl,
      note: meta.note || '',
    };
    setFeedingBatches(prev => [batch, ...prev]);
    await saveBatchToFirestore(batch);

    return batch;
  };

  // 撤銷整批匯入（刪除該批所有餵奶記錄 + 批次記錄）
  const deleteFeedingBatch = (batchId) => {
    const batch = feedingBatches.find(b => b.id === batchId);
    if (!batch) return;
    // 刪除該批所有記錄
    (batch.recordIds || []).forEach(id => {
      deleteGrowthFromFirestore(id);
    });
    setGrowthRecords(prev => prev.filter(r => !(batch.recordIds || []).includes(r.id)));
    // 刪除批次記錄
    setFeedingBatches(prev => prev.filter(b => b.id !== batchId));
    deleteBatchFromFirestore(batchId);
  };

  // Export / Import
  const exportData = () => {
    const data = { user, growthRecords, vaccineRecords, milestones, diaryEntries, bpRecords, medications, doctorVisits, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `louise-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData) => {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (data.user) {
      const newUser = data.user;
      setUser(newUser);
      saveUserToFirestore(newUser);
    }
    if (Array.isArray(data.growthRecords)) {
      setGrowthRecords(data.growthRecords);
      data.growthRecords.forEach(r => saveGrowthToFirestore(r));
    }
    if (Array.isArray(data.vaccineRecords)) {
      setVaccineRecords(data.vaccineRecords);
      saveVaccinesToFirestore(data.vaccineRecords);
    }
    if (Array.isArray(data.milestones)) {
      setMilestones(data.milestones);
      data.milestones.forEach(r => saveMilestoneToFirestore(r));
    }
    if (Array.isArray(data.diaryEntries)) {
      setDiaryEntries(data.diaryEntries);
      data.diaryEntries.forEach(r => saveDiaryToFirestore(r));
    }
    if (Array.isArray(data.bpRecords)) {
      setBpRecords(data.bpRecords);
      data.bpRecords.forEach(r => saveBloodPressureToFirestore(r));
    }
    if (Array.isArray(data.medications)) {
      setMedications(data.medications);
      data.medications.forEach(r => saveMedicationToFirestore(r));
    }
    if (Array.isArray(data.doctorVisits)) {
      setDoctorVisits(data.doctorVisits);
      data.doctorVisits.forEach(r => saveDoctorVisitToFirestore(r));
    }
    return true;
  };

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

  if (!loaded) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
        fontFamily: 'var(--font-display)',
      }}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>👶</div>
        <p style={{ fontSize: '1.2rem', color: 'var(--fg)', opacity: 0.6, marginTop: 16 }}>載入中...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, setUser: updateUser,
      growthRecords, addGrowthRecord, updateGrowthRecord, deleteGrowthRecord,
      vaccineRecords, toggleVaccine, addCustomVaccine, updateVaccineDate,
      milestones, addMilestone, deleteMilestone,
      diaryEntries, addDiaryEntry, deleteDiaryEntry,
      bpRecords, addBpRecord, deleteBpRecord,
      medications, addMedication, updateMedication, deleteMedication,
      doctorVisits, addDoctorVisit, updateDoctorVisit, deleteDoctorVisit,
      feedingBatches, importFeedingBatch, deleteFeedingBatch,
      exportData, importData,
      firestoreStatus,
      writeError,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
