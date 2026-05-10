import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

// ====== WHO 女嬰 0-12 週參考數據 ======
const WHO = {
  weight: {
    P3:  [2.4,2.6,2.8,3.0,3.2,3.4,3.5,3.7,3.8,3.9,4.0,4.1,4.2],
    P15: [2.7,2.9,3.2,3.4,3.6,3.8,4.0,4.1,4.3,4.4,4.5,4.6,4.7],
    P50: [3.2,3.4,3.7,3.9,4.1,4.3,4.5,4.7,4.8,5.0,5.1,5.2,5.4],
    P85: [3.7,4.0,4.3,4.6,4.8,5.1,5.3,5.5,5.6,5.8,5.9,6.1,6.2],
    P97: [4.2,4.5,4.8,5.1,5.3,5.5,5.7,5.9,6.1,6.3,6.5,6.7,6.8],
    yMin: 1.5, yMax: 7.5, yStep: 0.5, unit: 'kg', label: '體重',
  },
  height: {
    P3:  [45.6,46.7,47.8,48.8,49.7,50.5,51.3,52.0,52.6,53.3,53.9,54.5,55.0],
    P15: [47.2,48.4,49.5,50.5,51.5,52.3,53.1,53.8,54.5,55.2,55.8,56.4,57.0],
    P50: [49.4,50.5,51.7,52.7,53.7,54.6,55.5,56.3,57.0,57.7,58.4,59.0,59.7],
    P85: [51.5,52.7,53.8,54.9,56.0,56.9,57.8,58.6,59.4,60.1,60.8,61.5,62.1],
    P97: [53.1,54.3,55.4,56.5,57.5,58.4,59.3,60.1,60.9,61.6,62.3,63.0,63.6],
    yMin: 42, yMax: 68, yStep: 2, unit: 'cm', label: '身高',
  },
  headCircumference: {
    P3:  [31.7,32.3,33.0,33.6,34.1,34.6,35.1,35.5,35.9,36.2,36.5,36.8,37.1],
    P15: [32.6,33.3,34.0,34.6,35.1,35.6,36.1,36.5,36.9,37.2,37.5,37.8,38.1],
    P50: [34.0,34.7,35.4,36.0,36.6,37.1,37.6,38.0,38.4,38.8,39.1,39.5,39.8],
    P85: [35.3,36.1,36.8,37.4,38.0,38.5,39.0,39.5,39.9,40.3,40.7,41.0,41.3],
    P97: [36.3,37.0,37.7,38.3,38.9,39.4,39.9,40.4,40.8,41.2,41.6,41.9,42.2],
    yMin: 28, yMax: 45, yStep: 2, unit: 'cm', label: '頭圍',
  },
};

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

  const color = BABY_COLORS[metric] || '#2d2d2d';
  const label = LABELS[metric] || metric;
  const unit = UNITS[metric] || '';
  const whoRef = WHO[metric];
  const isWHO = !!whoRef;

  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  // ===== 寶寶數據 =====
  const babyPoints = useMemo(() => {
    if (isWHO && user?.birthDate) {
      return sorted.map(r => ({
        x: parseFloat(calcCorrectedWeek(user.birthDate, user.dueDate, r.date).toFixed(1)),
        y: r.value, date: r.date,
      }));
    }
    // 非 WHO：用日期字串 X 軸
    return sorted.map((r, i) => ({
      x: `${new Date(r.date).getMonth()+1}/${new Date(r.date).getDate()}`,
      y: r.value, date: r.date, idx: i,
    }));
  }, [sorted, isWHO, user?.birthDate, user?.dueDate]);

  // ===== WHO 百分位線 =====
  const whoDatasets = useMemo(() => {
    if (!whoRef) return [];
    const firstX = babyPoints[0]?.x ?? -2;
    const lastX = babyPoints[babyPoints.length-1]?.x ?? 4;
    const pad = Math.max(0.5, (lastX - firstX) * 0.1);
    const x0 = Math.floor(Math.min(firstX, 0) - pad);
    const x1 = Math.ceil(lastX + pad);
    const pts = [];
    for (let w = Math.max(0, x0); w <= x1; w += 0.25) pts.push(parseFloat(w.toFixed(2)));
    return ['P3','P15','P50','P85','P97'].map(p => ({
      label: `WHO ${p}`,
      data: pts.map(w => ({ x: w, y: parseFloat(lerp(whoRef[p], w).toFixed(2)) })),
      borderColor: p==='P50'?'rgba(45,93,161,0.7)':p==='P15'||p==='P85'?'rgba(150,150,150,0.4)':'rgba(200,200,200,0.35)',
      backgroundColor:'transparent',
      borderWidth: p==='P50'?2.5:1.2,
      borderDash: p==='P50'?[]:[5,5],
      pointRadius:0, fill:false, tension:0.3,
    }));
  }, [whoRef, babyPoints]);

  // ===== Y 軸 =====
  const yMin = whoRef?.yMin;
  const yMax = whoRef?.yMax;
  const yStep = whoRef?.yStep;

  // ===== X 軸（WHO: 線性週齡 / 非WHO: 日期類別） =====
  const xScale = isWHO ? {
    type: 'linear',
    min: Math.min(babyPoints[0]?.x ?? 0, 0) - 0.5,
    max: Math.ceil((babyPoints[babyPoints.length-1]?.x ?? 4)) + 0.5,
    title: { display: true, text: '矯正週齡', font: { family: 'Patrick Hand', size: 11 }, color: '#999' },
    grid: { display: false },
    ticks: { color: '#999', font: { family: 'Patrick Hand', size: 10 }, stepSize: 2, callback: v => v>=0 ? v+'w' : '' },
  } : {
    type: 'category',
    title: { display: true, text: '日期', font: { family: 'Patrick Hand', size: 11 }, color: '#999' },
    grid: { display: false },
    ticks: { color: '#999', font: { family: 'Patrick Hand', size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 8 },
  };

  const chartData = {
    datasets: [
      { label, data: babyPoints, borderColor: color, backgroundColor: color+'18',
        borderWidth: 3, pointBackgroundColor: color, pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 6, pointHoverRadius: 8,
        tension: 0.2, fill: false, spanGaps: true },
      ...whoDatasets,
    ],
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px' }}
      onClick={onClose}>
      <div className="card fade-in" style={{ width:'100%',maxWidth:'440px',maxHeight:'88vh',overflow:'auto',background:'#fff',padding:'18px 14px 12px' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
          <h3 style={{ fontFamily:'var(--font-display)',fontSize:'1.25rem' }}>
            📈 {label}{isWHO ? '（矯正週齡）' : ''}
          </h3>
          <button onClick={onClose} className="btn-sm" style={{ color:'var(--accent)' }}>✕</button>
        </div>
        <div style={{ height: 250 }}>
          <Line data={chartData} options={{
            responsive:true, maintainAspectRatio:false, animation:{duration:200},
            plugins:{
              legend:{display:false},
              tooltip:{
                backgroundColor:'#fff',titleColor:'#2d2d2d',bodyColor:'#2d2d2d',
                borderColor:'#2d2d2d',borderWidth:2,cornerRadius:0,padding:10,
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
                ticks:{ color:'#999',font:{family:'Inter',size:11},callback:v=>v+' '+unit, ...(yStep?{stepSize:yStep}:{}) },
              },
            },
          }} />
        </div>
        <div style={{ marginTop:8,textAlign:'center',fontFamily:'var(--font-body)',fontSize:'0.7rem',opacity:0.4 }}>
          共 {sorted.length} 筆記錄
          {whoDatasets.length>0 && ' · ━ P50 · - - P15/P85/P3/P97 · WHO 女嬰'}
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
