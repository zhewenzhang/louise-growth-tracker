import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const DayTimeline = () => {
  const ctx = useApp();
  const growthRecords = Array.isArray(ctx?.growthRecords) ? ctx.growthRecords : [];
  const sleepRecords = Array.isArray(ctx?.sleepRecords) ? ctx.sleepRecords : [];
  const diaperRecords = Array.isArray(ctx?.diaperRecords) ? ctx.diaperRecords : [];
  const tempRecords = Array.isArray(ctx?.tempRecords) ? ctx.tempRecords : [];

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 切換日期
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  // 1. 篩選當日數據
  const dayFeedings = growthRecords.filter(r => r && r.type === 'feeding' && r.date === selectedDate);
  const daySleeps = sleepRecords.filter(r => r && r.date === selectedDate);
  const dayDiapers = diaperRecords.filter(r => r && r.date === selectedDate);
  const dayTemps = tempRecords.filter(r => r && r.date === selectedDate);

  // 輔助：時間字串 "HH:MM" 轉 24h 分鐘數 (0 ~ 1440)
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = String(timeStr).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // 輔助：時間字串 "HH:MM" 轉百分比 (0% ~ 100%)
  const timeToPercent = (timeStr) => {
    const mins = timeToMinutes(timeStr);
    return Math.min(100, Math.max(0, (mins / 1440) * 100));
  };

  const totalEvents = dayFeedings.length + daySleeps.length + dayDiapers.length + dayTemps.length;

  return (
    <div className="card space-y-3" style={{ padding: '16px' }}>
      {/* 標題與日期選擇 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⏱️ 24h 晝夜作息時間軸
        </h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="btn-sm" onClick={handlePrevDay} title="前一天">👈</button>
          <button className={`btn-sm ${isToday ? 'btn-blue' : ''}`} onClick={handleToday} style={{ fontSize: '0.8rem' }}>
            {selectedDate} {isToday ? '(今天)' : ''}
          </button>
          <button className="btn-sm" onClick={handleNextDay} title="後一天">👉</button>
        </div>
      </div>

      {/* 24 小時主要時間軸槽 */}
      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '8px' }}>
        {/* 背景時間軌道 */}
        <div style={{
          height: '36px',
          backgroundColor: 'var(--card-bg)',
          border: '2px solid var(--fg)',
          borderRadius: 'var(--wobbly-sm)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
        }}>
          {/* 夜間 00-06 */}
          <div style={{ flex: 6, background: 'rgba(30, 41, 59, 0.08)', borderRight: '1px solid var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', opacity: 0.5 }}>🌙 夜間</div>
          {/* 白天 06-18 */}
          <div style={{ flex: 12, background: 'rgba(251, 191, 36, 0.08)', borderRight: '1px solid var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', opacity: 0.5 }}>☀️ 白天</div>
          {/* 晚間 18-24 */}
          <div style={{ flex: 6, background: 'rgba(30, 41, 59, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', opacity: 0.5 }}>🌙 晚間</div>

          {/* 🟦 睡眠色塊渲染 */}
          {daySleeps.map((s, idx) => {
            if (!s) return null;
            const startPct = timeToPercent(s.startTime);
            const endPct = timeToPercent(s.endTime);
            const widthPct = endPct >= startPct ? (endPct - startPct) : (100 - startPct + endPct);
            const dur = Number(s.durationMinutes) || 0;

            return (
              <div
                key={s.id || idx}
                title={`睡眠: ${s.startTime || ''} ~ ${s.endTime || ''} (${(dur / 60).toFixed(1)}h)`}
                style={{
                  position: 'absolute',
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  height: '100%',
                  background: 'rgba(59, 130, 246, 0.45)',
                  borderLeft: '2px solid #2563eb',
                  borderRight: '2px solid #2563eb',
                  top: 0,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: '#1e40af',
                  fontWeight: 700,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                😴 {(dur / 60).toFixed(1)}h
              </div>
            );
          })}

          {/* 🍼 奶量打點 */}
          {dayFeedings.map((f, idx) => {
            if (!f) return null;
            const pct = timeToPercent(f.time || '12:00');
            return (
              <div
                key={f.id || idx}
                title={`餵奶: ${f.time || ''} (${f.value || 0}ml)`}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 4,
                  fontSize: '0.9rem',
                  background: 'var(--bg)',
                  border: '1px solid var(--fg)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                🍼
              </div>
            );
          })}

          {/* 💩/💦 尿布打點 */}
          {dayDiapers.map((d, idx) => {
            if (!d) return null;
            const pct = timeToPercent(d.time || '12:00');
            const icon = d.type === 'wet' ? '💦' : '💩';
            return (
              <div
                key={d.id || idx}
                title={`尿布: ${d.time || ''} (${d.type || ''})`}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '80%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                  fontSize: '0.85rem',
                }}
              >
                {icon}
              </div>
            );
          })}

          {/* 🌡️ 體溫打點 */}
          {dayTemps.map((t, idx) => {
            if (!t) return null;
            const pct = timeToPercent(t.time || '12:00');
            const isFever = (t.refTemperature || t.temperature || 0) >= 37.5;
            return (
              <div
                key={t.id || idx}
                title={`體溫: ${t.time || ''} (${t.temperature || 0}°C)`}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '20%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5,
                  fontSize: '0.85rem',
                  color: isFever ? '#dc2626' : '#10b981',
                }}
              >
                🌡️
              </div>
            );
          })}
        </div>

        {/* 時間刻度標籤 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', opacity: 0.6, fontFamily: 'var(--font-number)' }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* 當日作息事件清單圖例 / 摘要 */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem', background: 'var(--bg)', padding: '8px 12px', borderRadius: 'var(--wobbly-sm)' }}>
        <div>😴 總睡眠: <strong>{(daySleeps.reduce((sum, s) => sum + (s?.durationMinutes || 0), 0) / 60).toFixed(1)}h</strong> ({daySleeps.length} 次)</div>
        <div>🍼 總奶量: <strong>{dayFeedings.reduce((sum, f) => sum + (f?.value || 0), 0)}ml</strong> ({dayFeedings.length} 次)</div>
        <div>💩 尿布/便便: <strong>{dayDiapers.length} 次</strong></div>
        {dayTemps.length > 0 && <div>🌡️ 體溫: <strong>{dayTemps.length} 次</strong></div>}
      </div>

      {totalEvents === 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
          今天尚無作息記錄，可以在【成長】与【健康】頁面添加喔！
        </p>
      )}
    </div>
  );
};

export default DayTimeline;
