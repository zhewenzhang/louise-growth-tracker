import React, { createContext, useContext, useEffect } from 'react';
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

  // 初始化：從 Supabase 加載數據（如果可用）
  useEffect(() => {
    let subscription = null;
    
    const initSupabase = async () => {
      if (isSupabaseAvailable()) {
        console.log('🔄 初始化 Supabase...');
        
        // 加載用戶數據
        const remoteUser = await loadUserData();
        if (remoteUser && !user.name) {
          setUser(remoteUser);
        }
        
        // 加載成長記錄
        const remoteRecords = await loadGrowthRecords();
        if (remoteRecords.length > 0 && growthRecords.length === 0) {
          setGrowthRecords(remoteRecords);
        }
        
        // 訂閱實時變化
        subscription = subscribeToChanges(async () => {
          // 收到遠程更新時重新加載
          const updatedRecords = await loadGrowthRecords();
          setGrowthRecords(updatedRecords);
        });
      } else {
        console.log('📱 Supabase 未配置 - 使用本地模式');
        console.log('💡 配置方法：複製 .env.example 到 .env 並填寫 Supabase 信息');
      }
    };
    
    initSupabase();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // 當用戶數據變化時同步到 Supabase
  useEffect(() => {
    if (user.name && user.birthDate) {
      syncUserData(user);
    }
  }, [user]);

  // 當成長記錄變化時同步到 Supabase
  useEffect(() => {
    if (growthRecords.length > 0) {
      syncGrowthRecords(growthRecords);
    }
  }, [growthRecords]);

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
    importData
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
