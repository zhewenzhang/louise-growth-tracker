import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

const TodaySummaryCards = ({ onNavigate }) => {
  const { growthRecords, tempRecords, sleepRecords, diaperRecords, user } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // 今日奶量
  const feedingRecords = growthRecords.filter(r => r.type === 'feeding' && r.date === todayStr);
  const todayFeedingStats = {
    breastMilk: feedingRecords.reduce((s, r) => s + (r.breastMilk || 0), 0),
    formula: feedingRecords.reduce((s, r) => s + (r.formula || 0), 0),
    total: feedingRecords.reduce((s, r) => s + (r.value || 0), 0),
    count: feedingRecords.length,
  };

  // 今日最新體溫
  const todayTemps = tempRecords.filter(r => r.date === todayStr);
  const latestTemp = todayTemps.length > 0 ? todayTemps[0] : (tempRecords.length > 0 ? tempRecords[0] : null);
  const isFever = latestTemp && (latestTemp.refTemperature || latestTemp.temperature) >= 37.5;

  // 今日睡眠
  const todaySleeps = sleepRecords.filter(r => r.date === todayStr);
  const totalSleepMinutes = todaySleeps.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // 今日尿布
  const todayDiapers = diaperRecords.filter(r => r.date === todayStr);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 奶量卡片 */}
      <div
        onClick={() => onNavigate?.('growth')}
        className="card cursor-pointer hover:opacity-90 transition-opacity"
        style={{ padding: '12px 14px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', opacity: 0.7 }}>🍼 今日奶量</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>{todayFeedingStats.count} 次</span>
        </div>
        <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
          {todayFeedingStats.total} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>ml</span>
        </p>
        {(todayFeedingStats.breastMilk > 0 || todayFeedingStats.formula > 0) && (
          <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 2 }}>
            🤱{todayFeedingStats.breastMilk} + 🍼{todayFeedingStats.formula}
          </p>
        )}
      </div>

      {/* 體溫卡片 */}
      <div
        onClick={() => onNavigate?.('health')}
        className="card cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          padding: '12px 14px',
          borderLeft: isFever ? '5px solid #ef4444' : '3px solid var(--fg)',
          background: isFever ? '#fef3c7' : 'var(--card-bg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', opacity: 0.7 }}>🌡️ 最新體溫</span>
          {isFever && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: '4px' }}>發燒</span>}
        </div>
        {latestTemp ? (
          <>
            <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.5rem', fontWeight: 700, color: isFever ? '#dc2626' : 'var(--fg)', marginTop: 4 }}>
              {latestTemp.temperature} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>°C</span>
            </p>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 2 }}>
              {latestTemp.method === 'armpit' ? '腋溫 (+0.5°C參考)' : '耳溫'} · {latestTemp.time}
            </p>
          </>
        ) : (
          <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: 8 }}>今日未量測</p>
        )}
      </div>

      {/* 睡眠卡片 */}
      <div
        onClick={() => onNavigate?.('growth')}
        className="card cursor-pointer hover:opacity-90 transition-opacity"
        style={{ padding: '12px 14px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', opacity: 0.7 }}>😴 今日睡眠</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>{todaySleeps.length} 段</span>
        </div>
        <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>
          {(totalSleepMinutes / 60).toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>小時</span>
        </p>
      </div>

      {/* 尿布卡片 */}
      <div
        onClick={() => onNavigate?.('growth')}
        className="card cursor-pointer hover:opacity-90 transition-opacity"
        style={{ padding: '12px 14px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', opacity: 0.7 }}>💩 尿布/便便</span>
        </div>
        <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>
          {todayDiapers.length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>次</span>
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 2 }}>
          💦 {todayDiapers.filter(d => d.type === 'wet' || d.type === 'both').length} · 💩 {todayDiapers.filter(d => d.type === 'poop' || d.type === 'both').length}
        </p>
      </div>
    </div>
  );
};

export default TodaySummaryCards;
