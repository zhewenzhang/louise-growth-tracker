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
    id: 'first_milestone',
    emoji: '🌈',
    title: '第一個里程碑',
    description: '記下第一個重要時刻',
    category: 'record',
    check: (s) => s.milestones?.length >= 1,
  },
  {
    id: 'milestone_10',
    emoji: '✨',
    title: '里程碑收藏家',
    description: '記錄滿 10 個里程碑',
    category: 'record',
    check: (s) => s.milestones?.length >= 10,
  },
  {
    id: 'diary_first',
    emoji: '📝',
    title: '初次寫日記',
    description: '寫下第一篇成長日記',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 1,
  },
  {
    id: 'diary_10',
    emoji: '📚',
    title: '日記達人',
    description: '寫滿 10 篇日記',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 10,
  },
  {
    id: 'diary_30',
    emoji: '🎓',
    title: '日記大師',
    description: '寫滿 30 篇日記',
    category: 'record',
    check: (s) => s.diaryEntries?.length >= 30,
  },

  // ========== 飲食成就 ==========
  {
    id: 'feeding_first',
    emoji: '🍼',
    title: '第一次餵奶記錄',
    description: '開始追蹤奶量',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 1,
  },
  {
    id: 'feeding_50',
    emoji: '🥛',
    title: '餵奶 50 次',
    description: '累計餵奶記錄 50 次',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 50,
  },
  {
    id: 'feeding_200',
    emoji: '🏅',
    title: '餵奶 200 次',
    description: '累計餵奶記錄 200 次',
    category: 'feeding',
    check: (s) => s.feedingRecords?.length >= 200,
  },
];

// 計算寶寶天數
export const getAgeDays = (birthDate) => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.floor((now - birth) / (1000 * 60 * 60 * 24));
};

// 計算所有徽章狀態
export const calcBadgeStatus = (data) => {
  const stats = {
    ageDays: getAgeDays(data.user?.birthDate),
    weightRecords: data.growthRecords?.filter(r => r.type === 'weight') || [],
    heightRecords: data.growthRecords?.filter(r => r.type === 'height') || [],
    feedingRecords: data.growthRecords?.filter(r => r.type === 'feeding') || [],
    vaccineRecords: data.vaccineRecords || [],
    milestones: data.milestones || [],
    diaryEntries: data.diaryEntries || [],
    medications: data.medications || [],
    doctorVisits: data.doctorVisits || [],
  };

  return BADGES.map(b => ({
    ...b,
    unlocked: b.check(stats),
  }));
};

export const CATEGORY_LABELS = {
  growth: '🌱 成長里程',
  weight: '⚖️ 體重達標',
  vaccine: '💉 疫苗達人',
  record: '📝 記錄狂熱',
  feeding: '🍼 飲食成就',
};
