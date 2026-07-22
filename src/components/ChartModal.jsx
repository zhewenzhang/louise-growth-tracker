import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { WHO_WEEKLY } from '../data/whoData';

const BABY_COLORS = { weight: '#ff4d4d', height: '#2d5da1', headCircumference: '#2d7d46', chestCircumference: '#e67e22', feeding: '#e91e63' };
const LABELS = { weight: '體重', height: '身高', headCircumference: '頭圍', chestCircumference: '胸圍', feeding: '奶量' };
const UNITS = { weight: 'kg', height: 'cm', headCircumference: 'cm', chestCircumference: 'cm', feeding: 'ml' };

const lerp = (arr, week) => {
  const w = Math.max(0, Math.min(week, 12));
  const i = Math.floor(w);
  if (i >= 12) return arr[12];
  return arr[i] + (arr[i+1] - arr[i]) * (w - i);
};

const calcCorrectedWeek = (birthDate, dueDate, recordDate) => {
  const birth = new Date(birthDate);
  const due = dueDate ? new Date(dueDate) : birth;
  const target = new Date(recordDate);
  return ((target - birth) - (due - birth)) / (1000*60*60*24*7);
};

const ChartModal = ({ metric, records, user, onClose }) => {
  if (!records || records.length < 2) return null;

  const isDark = document.documentElement.dataset.theme === 'dark';
  const tooltipBg = isDark ? '#252540' : '#fff';
  const tooltipFg = isDark ? '#eaeaea' : '#2d2d2d';

  const color = BABY_COLORS[metric] || '#2d2d2d';
  const label = LABELS[metric] || metric;
  const unit = UNITS[metric] || '';
  const whoRef = WHO_WEEKLY[metric];
  const isWHO = !!whoRef;

  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  // ===== 奶量：按日聚合（min/max/avg） =====
  const isFeeding = metric === 'feeding';
  const feedingDaily = useMemo(() => {
    if (!isFeeding) return null;
    const map = new Map();
    for (const r of sorted) {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(Number(r.value) || 0);
    }
    return Array.from(map.entries())
      .map(([date, vals]) => {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = sum / vals.length;
        return { date, min, max, avg, sum, count: vals.length };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sorted, isFeeding]);

  // ===== 寶寶數據 =====
  const babyPoints = useMemo(() => {
    if (isWHO && user?.birthDate) {
      return sorted.map(r => ({
        x: parseFloat(calcCorrectedWeek(user.birthDate, user.dueDate, r.date).toFixed(1)),
        y: r.value, date: r.date,
      }));
    }
    // 奶量：用每日聚合資料
    if (isFeeding && feedingDaily) {
      return feedingDaily.map(d => ({
        x: `${new Date(d.date).getMonth()+1}/${new Date(d.date).getDate()}`,
        y: parseFloat(d.avg.toFixed(1)),
        date: d.date, min: d.min, max: d.max, avg: d.avg, count: d.count,
      }));
    }
    // 非 WHO：用日期字串 X 軸
    return sorted.map((r, i) => ({
      x: `${new Date(r.date).getMonth()+1}/${new Date(r.date).getDate()}`,
      y: r.value, date: r.date, idx: i,
    }));
  }, [sorted, isWHO, user?.birthDate, user?.dueDate, isFeeding, feedingDaily]);

  // ===== WHO 百分位線 =====
  // WHO 標準資料只有 0-12 週（足月起算）
  // 早產兒的矯正週齡可能是負數，但 WHO 線永遠從 0 週畫到 12 週（或寶寶最後資料 +1 週，取較小者）
  const whoDatasets = useMemo(() => {
    if (!whoRef) return [];
    const lastBabyX = babyPoints[babyPoints.length-1]?.x ?? 4;
    const whoEnd = Math.min(12, Math.max(4, Math.ceil(lastBabyX) + 1));
    const pts = [];
    for (let w = 0; w <= whoEnd; w += 0.25) pts.push(parseFloat(w.toFixed(2)));

    const p3Data = pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef['P3'], w).toFixed(2)) }));
    const p15Data = pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef['P15'], w).toFixed(2)) }));
    const p50Data = pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef['P50'], w).toFixed(2)) }));
    const p85Data = pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef['P85'], w).toFixed(2)) }));
    const p97Data = pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef['P97'], w).toFixed(2)) }));

    return [
      {
        label: 'P15–P85 (正常健康區)',
        data: p85Data,
        borderColor: 'transparent',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: '-1', // 填充到 p15
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'WHO P15',
        data: p15Data,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'WHO P50 (標準中位數)',
        data: p50Data,
        borderColor: 'rgba(45, 93, 161, 0.85)',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'WHO P85',
        data: p85Data,
        borderColor: 'rgba(245, 158, 11, 0.4)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'WHO P3 (下限)',
        data: p3Data,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderWidth: 1.2,
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'WHO P97 (上限)',
        data: p97Data,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderWidth: 1.2,
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
    ];
  }, [whoRef, babyPoints]);

  // ===== Y 軸 =====
  const yMin = whoRef?.yMin;
  const yMax = whoRef?.yMax;
  const yStep = whoRef?.yStep;

  // ===== X 軸（WHO: 線性週齡 / 非WHO: 日期類別） =====
  const babyFirstX = babyPoints[0]?.x ?? 0;
  const babyLastX = babyPoints[babyPoints.length-1]?.x ?? 4;
  const xMin = Math.floor(Math.min(babyFirstX, 0) - 0.5);
  const xMax = Math.ceil(Math.max(babyLastX, 4) + 0.5);

  const xScale = isWHO ? {
    type: 'linear',
    min: xMin,
    max: xMax,
    title: { display: true, text: '矯正週齡', font: { family: 'Patrick Hand', size: 11 }, color: '#999' },
    grid: { display: false },
    ticks: {
      color: '#999',
      font: { family: 'Patrick Hand', size: 10 },
      stepSize: 2,
      callback: v => v >= 0 ? v + 'w' : `−${Math.abs(v)}w`,
    },
  } : {
    type: 'category',
    title: { display: true, text: '日期', font: { family: 'Patrick Hand', size: 11 }, color: '#999' },
    grid: { display: false },
    ticks: { color: '#999', font: { family: 'Patrick Hand', size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 8 },
  };

  // ===== 奶量 min/max 範圍帶 =====
  const feedingRangeDatasets = useMemo(() => {
    if (!isFeeding || !babyPoints.length) return [];
    const maxData = babyPoints.map(p => ({ x: p.x, y: p.max }));
    const minData = babyPoints.map(p => ({ x: p.x, y: p.min }));
    return [
      {
        label: '最高', data: maxData,
        borderColor: 'rgba(233,30,99,0.35)',
        backgroundColor: 'rgba(233,30,99,0.10)',
        borderWidth: 1.5, borderDash: [4, 4],
        pointRadius: 0, fill: '+1', tension: 0.3,
      },
      {
        label: '最低', data: minData,
        borderColor: 'rgba(233,30,99,0.35)',
        backgroundColor: 'transparent',
        borderWidth: 1.5, borderDash: [4, 4],
        pointRadius: 0, fill: false, tension: 0.3,
      },
    ];
  }, [isFeeding, babyPoints]);

  const chartData = {
    datasets: [
      ...feedingRangeDatasets,
      { label, data: babyPoints, borderColor: color, backgroundColor: color+'18',
        borderWidth: 3, pointBackgroundColor: color, pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 6, pointHoverRadius: 8,
        tension: 0.2, fill: false, spanGaps: true },
      ...whoDatasets,
    ],
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px' }}
      onClick={onClose}>
      <div className="card fade-in" style={{ width:'100%',maxWidth:'440px',maxHeight:'88vh',overflow:'auto',background:'var(--card-bg)',padding:'18px 14px 12px' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
          <h3 style={{ fontFamily:'var(--font-display)',fontSize:'1.25rem' }}>
            📈 {label}{isWHO ? '（矯正週齡）' : isFeeding ? '（每日統計）' : ''}
          </h3>
          <button onClick={onClose} className="btn-sm" style={{ color:'var(--accent)' }}>✕</button>
        </div>
        <div style={{ height: 250 }}>
          <Line data={chartData} options={{
            responsive:true, maintainAspectRatio:false, animation:{duration:200},
            plugins:{
              legend:{display:false},
              tooltip:{
                backgroundColor: tooltipBg,
                titleColor: tooltipFg,
                bodyColor: tooltipFg,
                borderColor: tooltipFg,
                borderWidth:2,cornerRadius:0,padding:10,
                displayColors:false,
                titleFont:{family:'Patrick Hand',size:13},
                bodyFont:{family:'Inter',size:13,weight:'600'},
                callbacks:{
                  title:(items)=>{
                    if(!items.length) return '';
                    const raw=items[0].raw;
                    if(raw?.date && isWHO) return `${raw.date} · 矯正 ${raw.x>=0?raw.x.toFixed(1)+'週':'未足月'}`;
                    if(raw?.date) return raw.date;
                    return items[0].dataset.label||'';
                  },
                  label:(ctx)=>{
                    if(ctx.dataset.label?.startsWith('WHO')) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} ${unit}`;
                    if(isFeeding && ctx.dataset.label === label) {
                      const r = ctx.raw;
                      return [
                        `日均：${r.avg.toFixed(1)} ${unit}`,
                        `最高：${r.max} ${unit}`,
                        `最低：${r.min} ${unit}`,
                        `共 ${r.count} 筆`,
                      ];
                    }
                    if(isFeeding && (ctx.dataset.label === '最高' || ctx.dataset.label === '最低')) return null;
                    return `${label}: ${ctx.parsed.y} ${unit}`;
                  },
                },
              },
            },
            scales:{
              x: xScale,
              y:{
                min:yMin, max:yMax,
                grid:{color:'rgba(0,0,0,0.04)'},
                ticks:{ color:'#999',font:{family:'Inter',size:11},callback:v=>Number(v.toFixed(2))+' '+unit, ...(yStep?{stepSize:yStep}:{}) },
              },
            },
          }} />
        </div>
        <div style={{ marginTop:8,textAlign:'center',fontFamily:'var(--font-body)',fontSize:'0.7rem',opacity:0.4 }}>
          {isFeeding && feedingDaily ? (
            <>
              共 {sorted.length} 筆 · {feedingDaily.length} 天
              {' · 日均 '}
              {(sorted.reduce((s, r) => s + (Number(r.value)||0), 0) / feedingDaily.length).toFixed(0)} ml/天
              {' · 單次 '}
              {Math.min(...sorted.map(r => Number(r.value)||0))}~{Math.max(...sorted.map(r => Number(r.value)||0))} ml
            </>
          ) : (
            <>
              共 {sorted.length} 筆記錄
              {whoDatasets.length>0 && ' · ━ P50 · - - P15/P85/P3/P97 · WHO 女嬰'}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
