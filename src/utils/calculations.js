// 全部用原生 Date API，不再依賴 date-fns

// 計算矯正月齡（天）
// birthDate: 實際出生日期
// dueDate: 預產期（足月 40 週）
// 返回 { chronologicalDays, correctedDays, prematurityDays, prematurityWeeks }
export const calcCorrectedAge = (birthDate, dueDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const chronologicalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));

  if (!dueDate) {
    return { chronologicalDays, correctedDays: chronologicalDays, prematurityDays: 0, prematurityWeeks: 0 };
  }

  const due = new Date(dueDate);
  const prematurityDays = Math.floor((due - birth) / (1000 * 60 * 60 * 24));
  const correctedDays = chronologicalDays - prematurityDays;
  const prematurityWeeks = (prematurityDays / 7).toFixed(1);

  return { chronologicalDays, correctedDays, prematurityDays, prematurityWeeks };
};

// 統一年齡顯示（取代 formatCorrectedAge + formatAgeDetailed）
// 一歲前：X個月Y天（Z週W天）· 矯正資訊（如有早產）
// 一歲後：X歲Y個月Z天
export const formatBabyAge = (birthDate, dueDate) => {
  if (!birthDate) return '';

  const birth = new Date(birthDate);
  const now = new Date();
  const chronologicalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));

  // 計算早產
  let prematurityDays = 0;
  if (dueDate) {
    const due = new Date(dueDate);
    prematurityDays = Math.floor((due - birth) / (1000 * 60 * 60 * 24));
  }
  const correctedDays = chronologicalDays - prematurityDays;

  // [helper] 天數轉月+日
  const toMonthsDays = (d) => {
    const m = Math.floor(d / 30);
    return { months: m, days: d - m * 30 };
  };

  // ===== 一歲前 =====
  if (chronologicalDays < 365) {
    const { months, days } = toMonthsDays(chronologicalDays);
    const weeks = Math.floor(chronologicalDays / 7);
    const wDays = chronologicalDays % 7;

    // 主顯示：幾個月幾天
    let text;
    if (months > 0) {
      text = `${months}個月`;
      if (days > 0) text += `${days}天`;
    } else {
      text = `${chronologicalDays}天`;
    }

    // 括號：幾週幾天
    text += `（${weeks}週`;
    if (wDays > 0) text += `${wDays}天`;
    text += `）`;

    // 早產標註
    if (prematurityDays > 0) {
      if (correctedDays < 0) {
        text += ` · 矯正尚未足月`;
      } else if (correctedDays < 730) {
        const cm = Math.floor(correctedDays / 30);
        const cd = correctedDays % 30;
        text += ` · 矯正${cm}個月`;
        if (cd > 0) text += `${cd}天`;
      }
    }

    return text;
  }

  // ===== 一歲後 =====
  const years = Math.floor(chronologicalDays / 365);
  const remain = chronologicalDays % 365;
  const months = Math.floor(remain / 30);
  const days = remain % 30;

  let text = `${years}歲${months}個月`;
  if (days > 0) text += `${days}天`;
  return text;
};

// 保留舊函數供 ChartModal 使用
export const calcCorrectedWeeks = (birthDate, dueDate, targetDate) => {
  const birth = new Date(birthDate);
  const due = dueDate ? new Date(dueDate) : birth;
  const target = targetDate ? new Date(targetDate) : new Date();
  const prematurityDays = (due - birth) / (1000 * 60 * 60 * 24);
  const chronologicalDays = (target - birth) / (1000 * 60 * 60 * 24);
  return (chronologicalDays - prematurityDays) / 7;
};
