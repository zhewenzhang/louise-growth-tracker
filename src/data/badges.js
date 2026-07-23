// 成就徽章系統
// 每個徽章有：id, emoji, title, description, category, check 函數
// check(stats) 回傳 true 表示已達成

// stats 物件包含計算徽章用到的所有資料：
// {
//   ageDays: 實際天數,
//   correctedDays: 矯正天數,
//   weightRecords: [],
//   heightRecords: [],
//   feedingRecords: [],
//   vaccineRecords: [],
//   milestones: [],
//   diaryEntries: [],
//   medications: [],
//   doctorVisits: [],
// }

export const BADGES = [
  // ========== 成長里程 ==========
  {
    id: 'first_day',
    emoji: '👶',
    title: '初來報到',
    description: '寶寶誕生第一天',
    category: 'growth',
    check: (s) => s.ageDays >= 0,
  },
  {
    id: 'one_week',
    emoji: '🌱',
    title: '滿週',
    description: '出生滿 7 天',
    category: 'growth',
    check: (s) => s.ageDays >= 7,
  },
  {
    id: 'one_month',
    emoji: '🌟',
    title: '滿月',
    description: '出生滿 30 天',
    category: 'growth',
    check: (s) => s.ageDays >= 30,
  },
  {
    id: 'hundred_days',
    emoji: '🎂',
    title: '百日',
    description: '出生滿 100 天',
    category: 'growth',
    check: (s) => s.ageDays >= 100,
  },
  {
    id: 'half_year',
    emoji: '🎯',
    title: '半歲',
    description: '出生滿 6 個月',
    category: 'growth',
    check: (s) => s.ageDays >= 180,
  },
  {
    id: 'one_year',
    emoji: '🎉',
    title: '週歲',
    description: '出生滿 1 歲',
    category: 'growth',
    check: (s) => s.ageDays >= 365,
  },

  // ========== 體重達標 ==========
  {
    id: 'weight_4kg',
    emoji: '⚖️',
    title: '4 公斤',
    description: '體重首次達到 4 公斤',
    category: 'weight',
    check: (s) => s.weightRecords?.some(r => r.value >= 4),
  },
  {
    id: 'weight_5kg',
    emoji: '💪',
    title: '5 公斤',
    description: '體重首次達到 5 公斤',
    category: 'weight',
    check: (s) => s.weightRecords?.some(r => r.value >= 5),
  },
  {
    id: 'weight_7kg',
    emoji: '🍎',
    title: '7 公斤',
    description: '體重首次達到 7 公斤',
    category: 'weight',
    check: (s) => s.weightRecords?.some(r => r.value >= 7),
  },
  {
    id: 'weight_10kg',
    emoji: '🏆',
    title: '10 公斤',
    description: '體重首次達到 10 公斤',
    category: 'weight',
    check: (s) => s.weightRecords?.some(r => r.value >= 10),
  },

  // ========== 疫苗達人 ==========
  {
    id: 'vaccine_first',
    emoji: '💉',
    title: '第一針',
    description: '完成第一劑疫苗',
    category: 'vaccine',
    check: (s) => s.vaccineRecords?.filter(v => v.completed).length >= 1,
  },
  {
    id: 'vaccine_5',
    emoji: '🛡️',
    title: '疫苗 5 劑',
    description: '完成 5 劑疫苗',
    category: 'vaccine',
    check: (s) => s.vaccineRecords?.filter(v => v.completed).length >= 5,
  },
  {
    id: 'vaccine_10',
    emoji: '⚔️',
    title: '疫苗 10 劑',
    description: '完成 10 劑疫苗',
    category: 'vaccine',
    check: (s) => s.vaccineRecords?.filter(v => v.completed).length >= 10,
  },

  // ========== 記錄狂熱 ==========
  {
    id: 'streak_30d',
    emoji: '🛡️',
    title: '鋼鐵爸媽',
    description: '連續打卡記錄 30 天',
    category: 'record',
    check: (s) => s.maxStreakDays >= 30,
    getProgress: (s) => {
      const cur = s.maxStreakDays || 0;
      const pct = Math.min(100, Math.round((cur / 30) * 100));
      return { current: cur, total: 30, unit: '天', percent: pct, remainingText: cur >= 30 ? '🎉 已達成！' : `還差 ${30 - cur} 天連續打卡即可解鎖` };
    },
  },
  {
    id: 'first_milestone',
    emoji: '🌈',
    title: '第一個里程碑',
    description: '記下第一個重要時刻',
    category: 'record',
    check: (s) => s.milestones?.length >= 1,
    getProgress: (s) => {
      const cur = s.milestones?.length || 0;
      return { current: cur, total: 1, unit: '個', percent: Math.min(100, cur * 100), remainingText: cur >= 1 ? '🎉 已達成！' : '還差 1 個里程碑即可解鎖' };
    },
  },
  {
    id: 'milestone_10',
    emoji: '✨',
    title: '里程碑收藏家',
    description: '記錄滿 10 個里程碑',
    category: 'record',
    check: (s) => s.milestones?.length >= 10,
    getProgress: (s) => {
      const cur = s.milestones?.length || 0;
      const pct = Math.min(100, Math.round((cur / 10) * 100));
      return { current: cur, total: 10, unit: '個', percent: pct, remainingText: cur >= 10 ? '🎉 已達成！' : `還差 ${10 - cur} 個里程碑即可解鎖` };
    },
  },
  {
    id: 'diary_first',
    emoji: '📝',
    title: '初次寫日記',
    description: '寫下第一篇成長日記',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 1,
    getProgress: (s) => {
      const cur = s.diaryEntries?.length || 0;
      return { current: cur, total: 1, unit: '篇', percent: Math.min(100, cur * 100), remainingText: cur >= 1 ? '🎉 已達成！' : '寫下第一篇日記即可解鎖' };
    },
  },
  {
    id: 'diary_10',
    emoji: '📚',
    title: '日記達人',
    description: '寫滿 10 篇日記',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 10,
    getProgress: (s) => {
      const cur = s.diaryEntries?.length || 0;
      const pct = Math.min(100, Math.round((cur / 10) * 100));
      return { current: cur, total: 10, unit: '篇', percent: pct, remainingText: cur >= 10 ? '🎉 已達成！' : `還差 ${10 - cur} 篇日記即可解鎖` };
    },
  },
  {
    id: 'diary_30',
    emoji: '🎓',
    title: '育兒史官',
    description: '日記達到 30 篇',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 30,
    getProgress: (s) => {
      const cur = s.diaryEntries?.length || 0;
      const pct = Math.min(100, Math.round((cur / 30) * 100));
      return { current: cur, total: 30, unit: '篇', percent: pct, remainingText: cur >= 30 ? '🎉 已達成！' : `還差 ${30 - cur} 篇日記即可解鎖` };
    },
  },

  // ========== 睡眠與日常 ==========
  {
    id: 'sleep_8h',
    emoji: '🌙',
    title: '睡過夜神童',
    description: '單次睡眠達 8 小時',
    category: 'growth',
    check: (s) => s.maxSleepMins >= 480,
    getProgress: (s) => {
      const cur = s.maxSleepMins || 0;
      const pct = Math.min(100, Math.round((cur / 480) * 100));
      const remMins = Math.max(0, 480 - cur);
      const hrs = (remMins / 60).toFixed(1);
      return {
        current: (cur / 60).toFixed(1),
        total: 8,
        unit: '小時',
        percent: pct,
        remainingText: cur >= 480 ? '🎉 已達成！' : `最高單次睡眠 ${(cur / 60).toFixed(1)}h，還差 ${hrs} 小時即可解鎖`,
      };
    },
  },

  // ========== 飲食成就 ==========
  {
    id: 'feeding_first',
    emoji: '🍼',
    title: '第一次餵奶記錄',
    description: '開始追蹤奶量',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 1,
    getProgress: (s) => {
      const cur = s.feedingRecords?.length || 0;
      return { current: cur, total: 1, unit: '次', percent: Math.min(100, cur * 100), remainingText: cur >= 1 ? '🎉 已達成！' : '記錄一次餵奶即可解鎖' };
    },
  },
  {
    id: 'feeding_50',
    emoji: '🥛',
    title: '餵奶 50 次',
    description: '累計餵奶記錄 50 次',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 50,
    getProgress: (s) => {
      const cur = s.feedingRecords?.length || 0;
      const pct = Math.min(100, Math.round((cur / 50) * 100));
      return { current: cur, total: 50, unit: '次', percent: pct, remainingText: cur >= 50 ? '🎉 已達成！' : `還差 ${50 - cur} 次餵奶記錄即可解鎖` };
    },
  },
  {
    id: 'feeding_200',
    emoji: '🏅',
    title: '餵奶 200 次',
    description: '累計餵奶記錄 200 次',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 200,
    getProgress: (s) => {
      const cur = s.feedingRecords?.length || 0;
      const pct = Math.min(100, Math.round((cur / 200) * 100));
      return { current: cur, total: 200, unit: '次', percent: pct, remainingText: cur >= 200 ? '🎉 已達成！' : `還差 ${200 - cur} 次餵奶記錄即可解鎖` };
    },
  },
  {
    id: 'feeding_10k',
    emoji: '🥂',
    title: '乾杯吧奶霸',
    description: '累計奶量破萬 (10,000ml)',
    category: 'feeding',
    check: (s) => s.totalMilkVolume >= 10000,
    getProgress: (s) => {
      const cur = s.totalMilkVolume || 0;
      const pct = Math.min(100, Math.round((cur / 10000) * 100));
      const rem = Math.max(0, 10000 - cur);
      return {
        current: cur,
        total: 10000,
        unit: 'ml',
        percent: pct,
        remainingText: cur >= 10000 ? '🎉 已達成！' : `已喝 ${cur} ml，還差 ${rem} ml 即可解鎖`,
      };
    },
  },
];

// 計算寶寶天數
export const getAgeDays = (birthDate) => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.max(0, Math.floor((now - birth) / (1000 * 60 * 60 * 24)));
};

// 計算連續打卡天數
export const getStreakDays = (allDates) => {
  if (!allDates || allDates.length === 0) return 0;
  const uniqueSorted = Array.from(new Set(allDates)).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  for (const dateStr of uniqueSorted) {
    const d = new Date(dateStr);
    if (!prevDate) {
      currentStreak = 1;
    } else {
      const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    prevDate = d;
    if (currentStreak > maxStreak) maxStreak = currentStreak;
  }
  return maxStreak;
};

// 計算所有徽章狀態
export const calcBadgeStatus = (data) => {
  const feedingRecords = data.growthRecords?.filter(r => r.type === 'feeding') || [];
  
  // 計算總奶量
  const totalMilkVolume = feedingRecords.reduce((sum, r) => {
    const bm = Number(r.breastMilk) || 0;
    const fm = Number(r.formula) || 0;
    const val = Number(r.value) || 0;
    return sum + (bm + fm || val);
  }, 0);

  // 計算最高單次睡眠
  const sleepRecords = data.sleepRecords || [];
  const maxSleepMins = sleepRecords.reduce((max, r) => {
    return Math.max(max, Number(r.durationMinutes) || 0);
  }, 0);

  // 收集所有打卡日期
  const dateList = [];
  (data.growthRecords || []).forEach(r => r.date && dateList.push(r.date));
  (data.sleepRecords || []).forEach(r => r.date && dateList.push(r.date));
  (data.diaperRecords || []).forEach(r => r.date && dateList.push(r.date));
  (data.tempRecords || []).forEach(r => r.date && dateList.push(r.date));
  (data.medications || []).forEach(r => r.date && dateList.push(r.date));
  (data.doctorVisits || []).forEach(r => r.date && dateList.push(r.date));
  (data.milestones || []).forEach(r => r.date && dateList.push(r.date));
  (data.diaryEntries || []).forEach(r => r.date && dateList.push(r.date));

  const maxStreakDays = getStreakDays(dateList);

  const stats = {
    ageDays: getAgeDays(data.user?.birthDate),
    weightRecords: data.growthRecords?.filter(r => r.type === 'weight') || [],
    heightRecords: data.growthRecords?.filter(r => r.type === 'height') || [],
    feedingRecords,
    vaccineRecords: data.vaccineRecords || [],
    milestones: data.milestones || [],
    diaryEntries: data.diaryEntries || [],
    medications: data.medications || [],
    doctorVisits: data.doctorVisits || [],
    totalMilkVolume,
    maxSleepMins,
    maxStreakDays,
  };

  return BADGES.map(b => {
    const unlocked = b.check(stats);
    let progress = null;
    if (b.getProgress) {
      progress = b.getProgress(stats);
    } else {
      progress = {
        current: unlocked ? 1 : 0,
        total: 1,
        unit: '項',
        percent: unlocked ? 100 : 0,
        remainingText: unlocked ? '🎉 已達成！' : '尚未解鎖',
      };
    }

    return {
      ...b,
      unlocked,
      progress,
    };
  });
};

export const CATEGORY_LABELS = {
  growth: '🌱 成長里程',
  weight: '⚖️ 體重達標',
  vaccine: '💉 疫苗達人',
  record: '📝 記錄狂熱',
  feeding: '🍼 飲食成就',
};
