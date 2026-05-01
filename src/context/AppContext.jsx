import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isSupabaseAvailable, syncUserData, loadUserData, syncGrowthRecords, loadGrowthRecords, subscribeToChanges } from '../services/syncService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 用戶信息
  const [user, setUser] = useLocalStorage('louise_user', {
    name: '',
    birthDate: '',
    gender: ''
  });

  // 成長記錄
  const [growthRecords, setGrowthRecords] = useLocalStorage('louise_growth', []);

  // 餵食記錄
  const [feedingRecords, setFeedingRecords] = useLocalStorage('louise_feeding', []);

  // 睡眠記錄
  const [sleepRecords, setSleepRecords] = useLocalStorage('louise_sleep', []);

  // 健康記錄
  const [healthRecords, setHealthRecords] = useLocalStorage('louise_health', []);

  // 疫苗追蹤
  const [vaccineRecords, setVaccineRecords] = useLocalStorage('louise_vaccines', [
    { id: 'vaccine_1', name: 'B肝疫苗', completed: false, dates: [] },
    { id: 'vaccine_2', name: '卡介苗', completed: false, dates: [] },
    { id: 'vaccine_3', name: '脊髓灰質炎', completed: false, dates: [] },
    { id: 'vaccine_4', name: '百日咳/白喉/破傷風', completed: false, dates: [] },
    { id: 'vaccine_5', name: '小兒麻痺', completed: false, dates: [] },
    { id: 'vaccine_6', name: '流感嗜血桿菌', completed: false, dates: [] },
    { id: 'vaccine_7', name: '肺炎球菌', completed: false, dates: [] },
    { id: 'vaccine_8', name: '麻疹/腮腺炎/風疹', completed: false, dates: [] },
    { id: 'vaccine_9', name: '輪狀病毒', completed: false, dates: [] },
    { id: 'vaccine_10', name: '水痘', completed: false, dates: [] },
    { id: 'vaccine_11', name: '肝炎A', completed: false, dates: [] }
  ]);

  // 里程碑
  const [milestones, setMilestones] = useLocalStorage('louise_milestones', []);

  // 信件
  const [letters, setLetters] = useLocalStorage('louise_letters', []);

  // 主題模式
  const [isDarkMode, setIsDarkMode] = useLocalStorage('louise_dark_mode', true);

  // 同步狀態跟蹤
  const [syncStatus, setSyncStatus] = useLocalStorage('louise_sync_status', 'idle');
  const [syncError, setSyncError] = useLocalStorage('louise_sync_error', null);

  // 導出數據
  const exportData = () => {
    const allData = {
      user, growthRecords, feedingRecords, sleepRecords,
      healthRecords, vaccineRecords, milestones, letters
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `louise-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 導入數據
  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);

      // 驗證數據結構
      if (!data.user || !Array.isArray(data.growthRecords)) {
        throw new Error('無效的備份文件格式');
      }

      // 導入所有數據
      setUser(data.user);
      setGrowthRecords(data.growthRecords || []);
      setFeedingRecords(data.feedingRecords || []);
      setSleepRecords(data.sleepRecords || []);
      setHealthRecords(data.healthRecords || []);
      setVaccineRecords(data.vaccineRecords || []);
      setMilestones(data.milestones || []);
      setLetters(data.letters || []);

      return true;
    } catch (error) {
      console.error('導入失敗:', error);
      return false;
    }
  };

  // 修復循環依賴：使用 ref 追蹤初始化狀態
  const initRef = useRef(false);
  const subscriptionRef = useRef(null);

  // 修復：初始化邏輯 - 只運行一次
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let subscription = null;

    const initSupabase = async () => {
      if (isSupabaseAvailable()) {
        console.log('🔄 初始化 Supabase...');
        setSyncStatus('connecting');

        try {
          // 加載用戶數據（只在本地為空時）
          const remoteUser = await loadUserData();
          if (remoteUser && !user.name) {
            setUser(remoteUser);
          }

          // 加載成長記錄（只在本地為空時）
          const remoteRecords = await loadGrowthRecords();
          if (remoteRecords.length > 0 && growthRecords.length === 0) {
            setGrowthRecords(remoteRecords);
          }

          // 訂閱實時變化
          subscription = subscribeToChanges(async () => {
            try {
              const updatedRecords = await loadGrowthRecords();
              setGrowthRecords(updatedRecords);
              setSyncStatus('synced');
              setSyncError(null);
            } catch (subError) {
              console.error('❌ 實時訂閱更新失敗:', subError);
              setSyncError(subError.message);
              setSyncStatus('error');
            }
          });

          subscriptionRef.current = subscription;
          setSyncStatus('synced');
          setSyncError(null);
          console.log('✅ Supabase 初始化完成');
        } catch (error) {
          console.error('❌ Supabase 初始化失敗:', error);
          setSyncError(error.message);
          setSyncStatus('offline');
          console.log('📱 使用本地模式');
        }
      } else {
        setSyncStatus('unconfigured');
        console.log('📱 Supabase 未配置 - 使用本地模式');
        console.log('💡 配置方法：複製 .env.example 到 .env 並填寫 Supabase 信息');
      }
    };

    initSupabase();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []); // 空依賴數組 - 只運行一次

  // 修復：用戶數據同步 - 只在初始化後執行
  useEffect(() => {
    if (!initRef.current) return;
    if (!user.name || !user.birthDate) return;

    syncUserData(user);
  }, [user]);

  // 修復：成長記錄同步 - 只在初始化後執行
  useEffect(() => {
    if (!initRef.current) return;
    if (growthRecords.length === 0) return;

    syncGrowthRecords(growthRecords);
  }, [growthRecords]);

  const value = {
    user, setUser,
    growthRecords, setGrowthRecords,
    feedingRecords, setFeedingRecords,
    sleepRecords, setSleepRecords,
    healthRecords, setHealthRecords,
    vaccineRecords, setVaccineRecords,
    milestones, setMilestones,
    letters, setLetters,
    isDarkMode, setIsDarkMode,
    exportData,
    importData,
    syncStatus,
    syncError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
