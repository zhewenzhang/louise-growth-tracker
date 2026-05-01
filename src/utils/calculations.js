import { differenceInMonths, parse } from 'date-fns';

// 計算 Louise 的月齡
export const calculateMonthAge = (birthdateStr) => {
  const birthdate = parse(birthdateStr, 'yyyy-MM-dd', new Date());
  return differenceInMonths(new Date(), birthdate);
};

// 格式化月齡為 "X月 Y週"
export const formatAge = (birthdateStr) => {
  const birthdate = parse(birthdateStr, 'yyyy-MM-dd', new Date());
  const months = differenceInMonths(new Date(), birthdate);
  const weeks = Math.floor((new Date() - new Date(birthdate.getFullYear(), birthdate.getMonth() + months, birthdate.getDate())) / (7 * 24 * 60 * 60 * 1000));
  return `${months}個月${weeks}週`;
};

// 計算體重增長趨勢
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

// 轉換時間格式
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
