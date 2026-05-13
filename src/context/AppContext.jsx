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
  const [loaded, setLoaded] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState('connecting'); // 'connecting' | 'connected' | 'empty' | 'error'

  // 初始化：從 Firestore 同步數據（Firestore 為權威來源）
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

    (async () => {
      // 匿名登入（必須先完成才能讀寫 Firestore，規則要求 auth != null）
      await ensureAuth();

      let anySuccess = false;
      try {
        // User
        const remoteUser = await loadUserFromFirestore();
        if (remoteUser?.name) {
          setUser({ name: remoteUser.name, birthDate: remoteUser.birthDate, gender: remoteUser.gender || 'female' });
          anySuccess = true;
        } else if (!remoteUser) {
          // Firestore 沒有用戶數據，把 localStorage 的推上去
          const lsUser = JSON.parse(localStorage.getItem('louise_user') || 'null');
          if (lsUser?.name) saveUserToFirestore(lsUser);
        }

        // Growth Records — Firestore 優先
        const remoteGrowth = await loadGrowthFromFirestore();
        if (remoteGrowth && remoteGrowth.length > 0) {
          setGrowthRecords(remoteGrowth);
          localStorage.setItem('louise_growth', JSON.stringify(remoteGrowth));
          anySuccess = true;
        } else {
          // Firestore 空的，把 localStorage 數據推上去
          const lsGrowth = JSON.parse(localStorage.getItem('louise_growth') || '[]');
          if (lsGrowth.length > 0) {
            for (const r of lsGrowth) await saveGrowthToFirestore(r);
          }
        }

        // Vaccines — Firestore 優先
        const remoteVaccines = await loadVaccinesFromFirestore();
        if (remoteVaccines && remoteVaccines.length > 0) {
          // 在 setVaccineRecords 之前計算疫苗日期
          const vWithDates = calcVaccineDates(remoteVaccines, user?.birthDate || '2026-04-26');
          setVaccineRecords(vWithDates);
          localStorage.setItem('louise_vaccines', JSON.stringify(vWithDates));
          anySuccess = true;
        } else {
          // Firestore 空的，把 localStorage 數據推上去
          const lsVaccines = JSON.parse(localStorage.getItem('louise_vaccines') || 'null');
          if (lsVaccines && lsVaccines.length > 0) {
            setVaccineRecords(lsVaccines);
            await saveVaccinesToFirestore(lsVaccines);
          }
        }

        // Milestones — Firestore 優先
        const remoteMilestones = await loadMilestonesFromFirestore();
        if (remoteMilestones && remoteMilestones.length > 0) {
          setMilestones(remoteMilestones);
          localStorage.setItem('louise_milestones', JSON.stringify(remoteMilestones));
          anySuccess = true;
        } else {
          const lsMilestones = JSON.parse(localStorage.getItem('louise_milestones') || '[]');
          if (lsMilestones.length > 0) {
            for (const r of lsMilestones) await saveMilestoneToFirestore(r);
          }
        }

        // Diary — Firestore 優先
        const remoteDiary = await loadDiaryFromFirestore();
        if (remoteDiary && remoteDiary.length > 0) {
          setDiaryEntries(remoteDiary);
          localStorage.setItem('louise_diary', JSON.stringify(remoteDiary));
          anySuccess = true;
        } else {
          const lsDiary = JSON.parse(localStorage.getItem('louise_diary') || '[]');
          if (lsDiary.length > 0) {
            for (const r of lsDiary) await saveDiaryToFirestore(r);
          }
        }

        // Blood Pressure — Firestore 優先
        const remoteBp = await loadBloodPressureFromFirestore();
        if (remoteBp && remoteBp.length > 0) {
          setBpRecords(remoteBp);
          localStorage.setItem('louise_blood_pressure', JSON.stringify(remoteBp));
          anySuccess = true;
        } else {
          const lsBp = JSON.parse(localStorage.getItem('louise_blood_pressure') || '[]');
          if (lsBp.length > 0) {
            for (const r of lsBp) await saveBloodPressureToFirestore(r);
          }
        }

        setFirestoreStatus(anySuccess ? 'connected' : 'error');
      } catch (e) {
        console.error('Firestore 初始化錯誤:', e.code, e.message, e);
        setFirestoreStatus('error');
      }
      setLoaded(true);
      clearTimeout(timeoutId);
    })();
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
    setVaccineRecords(prev => [...prev, newVaccine]);
    const all = [...vaccineRecords, newVaccine];
    localStorage.setItem('louise_vaccines', JSON.stringify(all));
    saveVaccinesToFirestore(all);
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

  // Export / Import
  const exportData = () => {
    const data = { user, growthRecords, vaccineRecords, milestones, diaryEntries, exportDate: new Date().toISOString() };
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
    return true;
  };

  // ── User ──
  const updateUser = (u) => {
    const newUser = typeof u === 'function' ? u(user) : u;
    setUser(newUser);
    saveUserToFirestore(newUser);
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
      growthRecords, addGrowthRecord, deleteGrowthRecord,
      vaccineRecords, toggleVaccine, addCustomVaccine, updateVaccineDate,
      milestones, addMilestone, deleteMilestone,
      diaryEntries, addDiaryEntry, deleteDiaryEntry,
      bpRecords, addBpRecord, deleteBpRecord,
      exportData, importData,
      firestoreStatus,
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
