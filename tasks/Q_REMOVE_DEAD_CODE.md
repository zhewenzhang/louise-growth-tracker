<!-- AUTOCLAUDE FORMAT INSTRUCTION -->
After completing ALL steps, output: ## Completion Checklist
| Step | Role | Status |
| Planning | Claude | ✅ |
| Dispatching | AutoClaude | ✅ |
| Execute | Qwen Code | ✅ |
<!-- END FORMAT INSTRUCTION -->

# 移除未使用函數

**嚴格約束**：不修改任何現有功能。只刪除無任何引用的「死」程式碼。

## Step 1：驗證函數真未被使用

- `calcCorrectedAge` in `src/utils/calculations.js:7` — 定義後從未被任何檔案 import 或內部呼叫
- `getPercentileDatasets` in `src/utils/whoPercentile.js:52` — 同上

## Step 2：移除 calcCorrectedAge

修改 D:\louise-growth-tracker-gh-pages\src\utils\calculations.js：

刪除 `calcCorrectedAge` 函數（第 7-23 行）：

```js
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
```

## Step 3：移除 getPercentileDatasets

修改 D:\louise-growth-tracker-gh-pages\src\utils\whoPercentile.js：

刪除 `getPercentileDatasets` 函數（第 52-85 行）：

```js
// 生成 WHO 百分位參考線（用於疊加在 ChartModal）
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
    order: 1,
  }));
};
```

## Step 4：建構驗證

```bash
cd D:\louise-growth-tracker-gh-pages
npm run build
```
