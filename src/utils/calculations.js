import { differenceInMonths, parse } from 'date-fns';

// 计算 Louise 的月龄
export const calculateMonthAge = (birthdateStr) => {
  const birthdate = parse(birthdateStr, 'yyyy-MM-dd', new Date());
  return differenceInMonths(new Date(), birthdate);
};

// 格式化月龄为 "X月 Y週"
export const formatAge = (birthdateStr) => {
  const birthdate = parse(birthdateStr, 'yyyy-MM-dd', new Date());
  const months = differenceInMonths(new Date(), birthdate);
  const weeks = Math.floor((new Date() - new Date(birthdate.getFullYear(), birthdate.getMonth() + months, birthdate.getDate())) / (7 * 24 * 60 * 60 * 1000));
  return `${months}個月${weeks}週`;
};

/**
 * 计算宝宝月龄为 "x月x週x天" 格式
 * @param {string} birthDate - ISO 日期字符串 (YYYY-MM-DD)
 * @returns {string} 例如 "3月2週4天"
 */
export const formatAgeDetailed = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'string') {
    return '年龄未知';
  }

  try {
    const birth = new Date(birthDate + 'T00:00:00Z');
    const today = new Date();

    if (isNaN(birth.getTime())) {
      return '日期无效';
    }

    const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));

    if (totalDays < 0) {
      return '未出生';
    }

    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    const weeks = Math.floor(remainingDays / 7);
    const days = remainingDays % 7;

    return `${months}月${weeks}週${days}天`;
  } catch (error) {
    console.error('计算年龄出错:', error);
    return '计算失败';
  }
};

/**
 * 简化版 - 只显示月龄
 */
export const formatAgeSimple = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'string') {
    return '年龄未知';
  }

  try {
    const birth = new Date(birthDate + 'T00:00:00Z');
    const today = new Date();
    const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);
    return `${months}個月`;
  } catch (error) {
    return '年龄未知';
  }
};

// 计算体重增长趋势
export const calculateWeightTrend = (records) => {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0].value;
  const previous = sorted[1].value;
  return {
    change: latest - previous,
    percentage: ((latest - previous) / previous * 100).toFixed(1)
  };
};

// 转换时间格式
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
