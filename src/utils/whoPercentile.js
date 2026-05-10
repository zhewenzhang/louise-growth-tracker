import { WHO_WEIGHT_GIRLS, WHO_HEIGHT_GIRLS, WHO_HEAD_GIRLS } from '../data/whoData';

const TABLES = {
  weight: WHO_WEIGHT_GIRLS,
  height: WHO_HEIGHT_GIRLS,
  headCircumference: WHO_HEAD_GIRLS,
};

const PERCENTILE_LABELS = ['P3', 'P15', 'P50', 'P85', 'P97'];

// 根據矯正月齡取得 WHO 參考值
// metric: 'weight' | 'height' | 'headCircumference'
// correctedAgeMonths: 矯正月齡（可為負數 = 尚未足月）
export const getWHOReference = (metric, correctedAgeMonths) => {
  const table = TABLES[metric];
  if (!table || correctedAgeMonths < 0) return null; // 矯正月齡 < 0 無參考值

  const age = Math.min(correctedAgeMonths, 24);
  const lower = table[Math.floor(age)];
  const upper = table[Math.min(Math.ceil(age), 23)];

  if (lower === upper) {
    return { ageMonths: lower[0], P3: lower[1], P15: lower[2], P50: lower[3], P85: lower[4], P97: lower[5] };
  }

  // 線性內插
  const frac = age - Math.floor(age);
  const ref = { ageMonths: age };
  PERCENTILE_LABELS.forEach((label, i) => {
    ref[label] = lower[i + 1] + (upper[i + 1] - lower[i + 1]) * frac;
  });
  return ref;
};

// 計算百分位
// 返回 { percentile: 'P50-P85', label: '正常', color: 'green' }
export const calcPercentile = (metric, value, correctedAgeMonths) => {
  const ref = getWHOReference(metric, correctedAgeMonths);
  if (!ref) return { percentile: '—', label: '矯正月齡未到', color: 'muted' };

  const v = value;
  if (v < ref.P3) return { percentile: '<P3', label: '需關注', color: 'red' };
  if (v < ref.P15) return { percentile: 'P3-P15', label: '偏輕/偏矮', color: 'yellow' };
  if (v < ref.P50) return { percentile: 'P15-P50', label: '正常', color: 'green' };
  if (v < ref.P85) return { percentile: 'P50-P85', label: '正常', color: 'green' };
  if (v < ref.P97) return { percentile: 'P85-P97', label: '偏重/偏高', color: 'yellow' };
  return { percentile: '>P97', label: '需關注', color: 'red' };
};

// 為 ChartModal 生成百分位參考線 datasets
// maxCorrectedMonths: 寶寶的最大矯正月齡
export const getPercentileDatasets = (metric, maxCorrectedMonths) => {
  if (maxCorrectedMonths < 0) return [];

  const ageMax = Math.max(2, Math.ceil(maxCorrectedMonths) + 1);
  const agePoints = [];
  for (let a = 0; a <= ageMax; a += 0.25) {
    agePoints.push(Math.round(a * 100) / 100);
  }

  const lineStyles = {
    P3: { color: 'rgba(255,77,77,0.25)', width: 1, dash: [6, 4] },
    P15: { color: 'rgba(255,165,0,0.2)', width: 1, dash: [6, 4] },
    P50: { color: 'rgba(45,93,161,0.5)', width: 2.5, dash: [] },
    P85: { color: 'rgba(255,165,0,0.2)', width: 1, dash: [6, 4] },
    P97: { color: 'rgba(255,77,77,0.25)', width: 1, dash: [6, 4] },
  };

  return PERCENTILE_LABELS.map(label => ({
    label: `WHO ${label}`,
    data: agePoints.map(a => {
      const ref = getWHOReference(metric, a);
      return ref ? ref[label] : null;
    }),
    borderColor: lineStyles[label].color,
    backgroundColor: 'transparent',
    borderWidth: lineStyles[label].width,
    borderDash: lineStyles[label].dash,
    pointRadius: 0,
    fill: false,
    tension: 0.3,
    order: 1, // 讓參考線畫在數據線後面
  }));
};
