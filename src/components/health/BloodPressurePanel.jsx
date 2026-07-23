import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useApp } from '../../context/AppContext.jsx';

const BloodPressurePanel = () => {
  const { bpRecords, addBpRecord, deleteBpRecord } = useApp();
  const [bpDate, setBpDate] = useState(new Date().toISOString().split('T')[0]);
  const [bpTime, setBpTime] = useState(new Date().toTimeString().slice(0, 5));
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpPulse, setBpPulse] = useState('');

  const isDark = document.documentElement.dataset.theme === 'dark';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bpSystolic || !bpDiastolic || !bpDate) return;
    addBpRecord({
      date: bpDate,
      time: bpTime,
      systolic: Number(bpSystolic),
      diastolic: Number(bpDiastolic),
      pulse: Number(bpPulse) || 0,
    });
    setBpDate(new Date().toISOString().split('T')[0]);
    setBpTime(new Date().toTimeString().slice(0, 5));
    setBpSystolic(''); setBpDiastolic(''); setBpPulse('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReadings = bpRecords.filter(r => r.date === todayStr);
  const latest = todayReadings.length > 0 ? todayReadings[todayReadings.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* 今日快速摘要 */}
      {latest && (
        <div className="card-sm" style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 4 }}>今日最新</h3>
          <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.6rem', fontWeight: 600, color: latest.systolic >= 140 ? 'var(--accent)' : 'var(--fg)' }}>
            {latest.systolic}/{latest.diastolic}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, marginLeft: 8 }}>mmHg</span>
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.6 }}>
            脈搏 {latest.pulse} bpm · {latest.time}
          </p>
        </div>
      )}

      {/* 趨勢圖 */}
      {bpRecords.length >= 2 && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>📈 血壓趨勢</h3>
          <div style={{ height: 200 }}>
            <Line data={(() => {
              const recent = bpRecords.slice(-20);
              return {
                labels: recent.map(r => {
                  const d = new Date(r.date);
                  return `${d.getMonth()+1}/${d.getDate()}`;
                }),
                datasets: [
                  {
                    label: '高壓',
                    data: recent.map(r => r.systolic),
                    borderColor: '#ff4d4d',
                    backgroundColor: 'rgba(255,77,77,0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                  },
                  {
                    label: '低壓',
                    data: recent.map(r => r.diastolic),
                    borderColor: '#2d5da1',
                    backgroundColor: 'rgba(45,93,161,0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                  },
                ],
              };
            })()} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { font: { family: 'Patrick Hand', size: 12 } } } },
              scales: {
                x: {
                  ticks: {
                    color: '#888',
                    font: { family: 'Patrick Hand', size: 10 },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 6,
                  }
                },
                y: { ticks: { color: '#888', font: { family: 'Inter', size: 11 } } },
              },
            }} />
          </div>
        </div>
      )}

      {/* 新增血壓表單 */}
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>❤️ 新增血壓記錄</h3>
        <div className="space-y-2">
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={bpDate} onChange={e => setBpDate(e.target.value)} required style={{ flex: 1 }} />
            <input type="time" value={bpTime} onChange={e => setBpTime(e.target.value)} required style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} placeholder="高壓" required min={60} max={250} style={{ flex: 1 }} />
            <input type="number" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} placeholder="低壓" required min={30} max={150} style={{ flex: 1 }} />
            <input type="number" value={bpPulse} onChange={e => setBpPulse(e.target.value)} placeholder="脈搏" min={30} max={250} style={{ flex: 1 }} />
          </div>
          <button type="submit" className="btn w-full">✅ 新增記錄</button>
        </div>
      </form>

      {/* 歷史列表 */}
      <div>
        <h3 className="section-title">記錄歷史 ({bpRecords.length} 筆)</h3>
        {bpRecords.length === 0 ? (
          <div className="card text-center">
            <p className="text-4xl mb-2">❤️</p>
            <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有血壓記錄</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...bpRecords].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))).map(r => (
              <div key={r.id} className="card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.1rem', fontWeight: 600 }}>
                    {r.systolic}/{r.diastolic}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5, marginLeft: 6 }}>mmHg</span>
                  {r.pulse > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5, marginLeft: 8 }}>❤️{r.pulse}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5 }}>
                    {r.date} {r.time}
                  </span>
                  <button
                    onClick={() => { if (window.confirm('確定刪除此血壓記錄？')) deleteBpRecord(r.id); }}
                    className="btn-sm"
                    style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }}
                    title="刪除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodPressurePanel;
