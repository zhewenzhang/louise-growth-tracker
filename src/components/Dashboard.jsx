import React, { useMemo, useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useApp } from '../context/AppContext.jsx';
import { formatBabyAge } from '../utils/calculations';
import { calcPercentile } from '../utils/whoPercentile';
import ChartModal from './ChartModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = ({ onNavigate }) => {
  const { user, growthRecords, vaccineRecords, milestones, doctorVisits, firestoreStatus } = useApp();
  const [chartMetric, setChartMetric] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const babyAge = useMemo(() => {
    return formatBabyAge(user?.birthDate, user?.dueDate);
  }, [user?.birthDate, user?.dueDate, tick]);

  const weightRecords = useMemo(() =>
    growthRecords.filter(r => r.type === 'weight').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [growthRecords]
  );

  const heightRecords = useMemo(() =>
    growthRecords.filter(r => r.type === 'height').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [growthRecords]
  );

  const headRecords = useMemo(() =>
    growthRecords.filter(r => r.type === 'headCircumference').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [growthRecords]
  );
  const chestRecords = useMemo(() =>
    growthRecords.filter(r => r.type === 'chestCircumference').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [growthRecords]
  );
  const feedingRecords = useMemo(() =>
    growthRecords.filter(r => r.type === 'feeding').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [growthRecords]
  );

  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const latestHeight = heightRecords.length > 0 ? heightRecords[heightRecords.length - 1] : null;
  const latestHead = headRecords.length > 0 ? headRecords[headRecords.length - 1] : null;
  const latestChest = chestRecords.length > 0 ? chestRecords[chestRecords.length - 1] : null;
  const latestMilestone = milestones.length > 0 ? milestones[0] : null;
  const vaccineCompleted = vaccineRecords.filter(v => v.completed).length;

  // 今日奶量統計（含母乳/配方明細）
  const todayFeedingStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayFeeding = feedingRecords.filter(r => r.date === todayStr);
    return {
      breastMilk: todayFeeding.reduce((s, r) => s + (r.breastMilk || 0), 0),
      formula: todayFeeding.reduce((s, r) => s + (r.formula || 0), 0),
      total: todayFeeding.reduce((s, r) => s + (r.value || 0), 0),
      count: todayFeeding.length,
    };
  }, [feedingRecords]);

  // 矯正月齡（供百分位計算用）
  const correctedAgeInfo = useMemo(() => {
    if (!user?.birthDate || !user?.dueDate) return null;
    const birth = new Date(user.birthDate);
    const due = new Date(user.dueDate);
    const prematurityDays = Math.floor((due - birth) / (1000 * 60 * 60 * 24));
    const now = new Date();
    const chronologicalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    const correctedDays = chronologicalDays - prematurityDays;
    return { correctedDays, correctedMonths: correctedDays / 30.44 };
  }, [user?.birthDate, user?.dueDate, tick]);

  // 體重百分位評估
  const weightPercentile = useMemo(() => {
    if (!latestWeight || !correctedAgeInfo || correctedAgeInfo.correctedMonths < 0) return null;
    return calcPercentile('weight', latestWeight.value, correctedAgeInfo.correctedMonths);
  }, [latestWeight, correctedAgeInfo]);

  const heightPercentile = useMemo(() => {
    if (!latestHeight || !correctedAgeInfo || correctedAgeInfo.correctedMonths < 0) return null;
    return calcPercentile('height', latestHeight.value, correctedAgeInfo.correctedMonths);
  }, [latestHeight, correctedAgeInfo]);

  const headPercentile = useMemo(() => {
    if (!latestHead || !correctedAgeInfo || correctedAgeInfo.correctedMonths < 0) return null;
    return calcPercentile('headCircumference', latestHead.value, correctedAgeInfo.correctedMonths);
  }, [latestHead, correctedAgeInfo]);

  // 奶量評估（含預估投影）
  const feedingAssessment = useMemo(() => {
    if (!latestWeight || todayFeedingStats.total === 0) return null;

    const isPremature = user?.dueDate && new Date(user.dueDate) > new Date(user.birthDate);

    // 矯正月齡（天）
    const correctedDays = correctedAgeInfo?.correctedDays ?? 0;
    const correctedMonths = correctedDays / 30.44;

    // ── 依月齡設定目標範圍（ml/kg/天）──
    // 參考：台灣新生兒科醫學會 + WHO 哺育指引
    // 早產兒出院後前幾週需要更高熱量密度
    let minTarget, maxTarget, tooHighTarget;
    if (isPremature && correctedMonths < 0) {
      // 矯正未足月（仍在 NICU 等級護理）
      minTarget = 150; maxTarget = 180; tooHighTarget = 200;
    } else if (correctedMonths < 1) {
      // 0–1 個月：新生兒期，胃容量小，少量多餐
      minTarget = 150; maxTarget = 180; tooHighTarget = 200;
    } else if (correctedMonths < 3) {
      // 1–3 個月：攝取量逐漸增加
      minTarget = 150; maxTarget = 180; tooHighTarget = 210;
    } else if (correctedMonths < 6) {
      // 3–6 個月：趨於穩定
      minTarget = 120; maxTarget = 160; tooHighTarget = 200;
    } else {
      // 6 個月以上：開始副食品，奶量需求下降
      minTarget = 100; maxTarget = 150; tooHighTarget = 180;
    }

    // ── 推估全天總量 ──
    // 根據矯正月齡估算每天餵奶次數（而非固定 6 次）
    const estimatedFeedsPerDay =
      correctedMonths < 1 ? 8 :   // 新生兒：8–12 次，取中間值 8
      correctedMonths < 3 ? 7 :   // 1–3 個月：7–8 次
      correctedMonths < 6 ? 6 :   // 3–6 個月：6 次
      5;                           // 6 個月以上：5 次

    const avgPerFeed = todayFeedingStats.count > 0
      ? todayFeedingStats.total / todayFeedingStats.count
      : 0;

    // 記錄次數 < 一半預估次數時才投影，否則用實際值
    const shouldProject = todayFeedingStats.count < Math.ceil(estimatedFeedsPerDay / 2);
    const projectedTotal = shouldProject
      ? avgPerFeed * estimatedFeedsPerDay
      : todayFeedingStats.total;

    const mlPerKg = todayFeedingStats.total / latestWeight.value;
    const projectedMlPerKg = projectedTotal / latestWeight.value;

    // ── 狀態判斷（5 個等級）──
    let status;
    if (projectedMlPerKg >= tooHighTarget) {
      status = 'high';      // 偏多（超過上限）
    } else if (projectedMlPerKg >= maxTarget) {
      status = 'good';      // 達標（在目標範圍內）
    } else if (projectedMlPerKg >= minTarget) {
      status = 'ok';        // 尚可（在最低標準以上）
    } else if (projectedMlPerKg >= minTarget * 0.8) {
      status = 'low';       // 偏低（低於最低標準 20% 以內）
    } else {
      status = 'veryLow';   // 明顯不足
    }

    return {
      mlPerKg: Math.round(mlPerKg),
      projectedMlPerKg: Math.round(projectedMlPerKg),
      projectedTotal: Math.round(projectedTotal),
      isProjected: shouldProject,
      minTarget, maxTarget, tooHighTarget,
      estimatedFeedsPerDay,
      status,
    };
  }, [latestWeight, todayFeedingStats, correctedAgeInfo, user?.dueDate, user?.birthDate, tick]);

  const chartData = useMemo(() => {
    if (weightRecords.length < 2) return null;
    const recent = weightRecords.slice(-10);
    return {
      labels: recent.map(r => {
        const d = new Date(r.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
      datasets: [{
        label: '體重 (kg)',
        data: recent.map(r => r.value),
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.08)',
        borderWidth: 3,
        pointBackgroundColor: '#ff4d4d',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
      }],
    };
  }, [weightRecords]);

  const [isDark, setIsDark] = useState(document.documentElement.dataset.theme === 'dark');

  // 監聽主題切換（Settings 頁面切換深色模式時即時更新圖表顏色）
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.dataset.theme === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#252540' : '#fff',
        titleColor: isDark ? '#eaeaea' : '#2d2d2d',
        bodyColor: isDark ? '#eaeaea' : '#2d2d2d',
        borderColor: isDark ? '#eaeaea' : '#2d2d2d',
        borderWidth: 2,
        cornerRadius: 0,
        padding: 12,
        displayColors: false,
        titleFont: { family: 'Patrick Hand', size: 14 },
        bodyFont: { family: 'Inter', size: 14, weight: '600' },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#999', font: { family: 'Patrick Hand', size: 11 } } },
      y: { grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }, ticks: { color: '#999', font: { family: 'Inter', size: 11 }, callback: v => v + ' kg' } },
    },
  };

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '20px' }}>
      {/* Greeting */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', lineHeight: 1.2, color: 'var(--fg)' }}>
              {(() => { const h = new Date().getHours(); return h < 12 ? '早安 ☀️' : h < 18 ? '午安 🌤️' : '晚安 🌙'; })()}
            </h1>
            {user?.name && (
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)', marginTop: 2 }}>
                {user.name}
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigate?.('settings')}
            style={{
              background: 'var(--card-bg)',
              border: '2px solid var(--fg)',
              borderRadius: 'var(--wobbly-sm)',
              padding: '8px 10px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="設定"
          >
            ⚙️
          </button>
        </div>
        {babyAge && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--fg)', opacity: 0.6, marginTop: 4 }}>
            {babyAge}
          </p>
        )}
      </div>

      {/* Weight chart */}
      <div className="card" style={{ padding: '20px 20px 12px 20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>📈 體重趨勢</h3>
        {chartData ? (
          <div style={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontFamily: 'var(--font-body)' }}>
            需要至少 2 筆體重記錄才能顯示圖表
          </div>
        )}
      </div>

      {/* Summary cards — row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <button
          className="card-sm"
          style={{ textAlign: 'center', transform: 'rotate(-1deg)', width: '100%', cursor: weightRecords.length >= 2 ? 'pointer' : 'default', opacity: weightRecords.length >= 2 ? 1 : 0.6 }}
          onClick={() => weightRecords.length >= 2 && setChartMetric('weight')}
          disabled={weightRecords.length < 2}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>⚖️</div>
          <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 600 }}>
            {latestWeight ? latestWeight.value : '--'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6 }}>kg</div>
          {weightPercentile && weightPercentile.percentile !== '—' && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', marginTop: 2,
              color: { green: '#2d7d46', yellow: '#e67e22', red: '#ff4d4d', muted: '#999' }[weightPercentile.color] || '#999'
            }}>
              {weightPercentile.percentile} · {weightPercentile.label}
            </div>
          )}
        </button>
        <button
          className="card-sm"
          style={{ textAlign: 'center', transform: 'rotate(1deg)', width: '100%', cursor: heightRecords.length >= 2 ? 'pointer' : 'default', opacity: heightRecords.length >= 2 ? 1 : 0.6 }}
          onClick={() => heightRecords.length >= 2 && setChartMetric('height')}
          disabled={heightRecords.length < 2}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📐</div>
          <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 600 }}>
            {latestHeight ? latestHeight.value : '--'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6 }}>cm</div>
          {heightPercentile && heightPercentile.percentile !== '—' && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', marginTop: 2,
              color: { green: '#2d7d46', yellow: '#e67e22', red: '#ff4d4d', muted: '#999' }[heightPercentile.color] || '#999'
            }}>
              {heightPercentile.percentile} · {heightPercentile.label}
            </div>
          )}
        </button>
        <div className="card-sm" style={{ textAlign: 'center', transform: 'rotate(-0.5deg)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>💉</div>
          <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 600 }}>
            {vaccineCompleted}/{vaccineRecords.length}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6 }}>疫苗</div>
        </div>
      </div>

      {/* Summary cards — row 2: 頭圍 + 胸圍 + 奶量 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <button
          className="card-sm"
          style={{ textAlign: 'center', transform: 'rotate(1deg)', width: '100%', cursor: headRecords.length >= 2 ? 'pointer' : 'default', opacity: headRecords.length >= 2 ? 1 : 0.6 }}
          onClick={() => headRecords.length >= 2 && setChartMetric('headCircumference')}
          disabled={headRecords.length < 2}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👶</div>
          <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 600 }}>
            {latestHead ? latestHead.value : '--'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6 }}>頭圍 cm</div>
          {headPercentile && headPercentile.percentile !== '—' && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', marginTop: 2,
              color: { green: '#2d7d46', yellow: '#e67e22', red: '#ff4d4d', muted: '#999' }[headPercentile.color] || '#999'
            }}>
              {headPercentile.percentile} · {headPercentile.label}
            </div>
          )}
        </button>
        <button
          className="card-sm"
          style={{ textAlign: 'center', transform: 'rotate(-1deg)', width: '100%', cursor: chestRecords.length >= 2 ? 'pointer' : 'default', opacity: chestRecords.length >= 2 ? 1 : 0.6 }}
          onClick={() => chestRecords.length >= 2 && setChartMetric('chestCircumference')}
          disabled={chestRecords.length < 2}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👕</div>
          <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 600 }}>
            {latestChest ? latestChest.value : '--'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6 }}>胸圍 cm</div>
        </button>
        {todayFeedingStats.count > 0 ? (
          <button
            className="card-sm"
            style={{
              textAlign: 'center', transform: 'rotate(0.5deg)', width: '100%',
              cursor: feedingRecords.length >= 2 ? 'pointer' : 'default',
              padding: '12px 10px',
            }}
            onClick={() => feedingRecords.length >= 2 && setChartMetric('feeding')}
            disabled={feedingRecords.length < 2}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>🍼</div>
            <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.2 }}>
              {todayFeedingStats.total}<span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.6 }}> ml</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', opacity: 0.5, marginTop: 2 }}>
              {todayFeedingStats.count} 次 · {todayFeedingStats.count > 0 && Math.round(todayFeedingStats.total / todayFeedingStats.count)}ml/次
            </div>
            {feedingAssessment && (
              <div style={{
                marginTop: 6, padding: '4px 8px',
                borderRadius: 'var(--wobbly-sm)',
                background:
                  feedingAssessment.status === 'good' ? '#e8f5e9' :
                  feedingAssessment.status === 'ok'   ? '#fff8e1' :
                  feedingAssessment.status === 'high' ? '#fff3e0' :
                  '#ffebee',
                fontFamily: 'var(--font-body)', fontSize: '0.65rem',
                color:
                  feedingAssessment.status === 'good' ? '#2d7d46' :
                  feedingAssessment.status === 'ok'   ? '#e67e22' :
                  feedingAssessment.status === 'high' ? '#e65100' :
                  '#c62828',
              }}>
                {feedingAssessment.isProjected
                  ? `預估 ${feedingAssessment.projectedTotal}ml · ${feedingAssessment.projectedMlPerKg} ml/kg`
                  : `${feedingAssessment.mlPerKg} ml/kg/天`}
                <br/>
                {feedingAssessment.status === 'good'   ? '✅ 達標' :
                 feedingAssessment.status === 'ok'     ? '尚可' :
                 feedingAssessment.status === 'high'   ? `⚠️ 偏多 (>${feedingAssessment.tooHighTarget})` :
                 feedingAssessment.status === 'low'    ? `偏低 (${feedingAssessment.minTarget}-${feedingAssessment.maxTarget})` :
                 `⚠️ 不足 (<${feedingAssessment.minTarget})`}
              </div>
            )}
          </button>
        ) : (
          <div className="card-sm" style={{ textAlign: 'center', transform: 'rotate(0.5deg)', opacity: 0.35, padding: '12px 10px' }}>
            <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>🍼</div>
            <div style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 600 }}>--</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', opacity: 0.6 }}>奶量 ml</div>
          </div>
        )}
      </div>

      {/* Latest milestone */}
      {latestMilestone && (
        <div className="sticky-note" style={{ transform: 'rotate(-1.5deg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: '2rem' }}>{latestMilestone.emoji || '🎉'}</span>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>最近里程碑</h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', marginTop: 2 }}>{latestMilestone.title}</p>
              {latestMilestone.date && (
                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 4 }}>
                  {new Date(latestMilestone.date).toLocaleDateString('zh-TW')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming follow-up reminders */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (doctorVisits || [])
          .filter(v => {
            const targetDate = v.followUpDate || (v.status === 'scheduled' ? v.date : null);
            if (!targetDate) return false;
            const d = new Date(targetDate);
            d.setHours(0, 0, 0, 0);
            return d >= today;
          })
          .sort((a, b) => {
            const da = new Date(a.followUpDate || a.date);
            const db = new Date(b.followUpDate || b.date);
            return da - db;
          })
          .slice(0, 3);

        if (upcoming.length === 0) return null;

        return (
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 10 }}>🏥 即將回診</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(v => {
                const targetDate = v.followUpDate || v.date;
                const d = new Date(targetDate);
                d.setHours(0, 0, 0, 0);
                const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
                const isToday = diffDays === 0;
                const isSoon = diffDays <= 3;

                const bgColor = isToday ? '#ffebee' : isSoon ? '#fff8e1' : 'var(--card-bg)';
                const borderColor = isToday ? '#ff4d4d' : isSoon ? '#f0a500' : 'var(--fg)';
                const tagColor = isToday ? '#ff4d4d' : isSoon ? '#e67e22' : '#2d7d46';
                const tagBg = isToday ? '#ffebee' : isSoon ? '#fff8e1' : '#e8f5e9';
                const tagText = isToday ? '今天' : diffDays === 1 ? '明天' : `${diffDays} 天後`;

                return (
                  <button
                    key={v.id}
                    onClick={() => onNavigate?.('health', { tab: 'visit' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 'var(--wobbly-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🏥</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--fg)' }}>
                          {v.hospital || '回診'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                          background: tagBg, color: tagColor,
                          border: `1.5px solid ${tagColor}`,
                          borderRadius: 'var(--wobbly-sm)',
                          padding: '1px 7px',
                          fontWeight: 600,
                        }}>
                          {tagText}
                        </span>
                      </div>
                      {(v.department || v.location || v.visitNumber) && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.75, marginTop: 2 }}>
                          {v.department && `🏷️ ${v.department}`}
                          {v.location && `　📍 ${v.location}`}
                          {v.visitNumber && `　🔢 ${v.visitNumber}`}
                        </div>
                      )}
                      {v.reason && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.65, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.reason}
                        </div>
                      )}
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>
                        {new Date(targetDate).toLocaleDateString('zh-TW')}
                        {v.doctor && ` · ${v.doctor}`}
                        {v.department && ` · ${v.department}`}
                      </div>
                    </div>
                    <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Quick nav buttons */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>📋 快速操作</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <button className="btn" onClick={() => onNavigate?.('growth')} style={{ transform: 'rotate(-1deg)' }}>
            ⚖️ 記錄成長
          </button>
          <button className="btn" onClick={() => onNavigate?.('health')} style={{ transform: 'rotate(0.5deg)' }}>
            💉 疫苗管理
          </button>
          <button className="btn" onClick={() => onNavigate?.('memories')} style={{ transform: 'rotate(1deg)' }}>
            🌟 回憶錄
          </button>
        </div>
      </div>

      {/* Firestore 狀態指示器 */}
      <div style={{ textAlign: 'center', padding: '16px', opacity: 0.5 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
          {firestoreStatus === 'connecting' && '🔄 正在連接 Firestore...'}
          {firestoreStatus === 'connected' && '☁️ Firestore 已連接'}
          {firestoreStatus === 'empty' && '☁️ Firestore 已連接（尚無數據）'}
          {firestoreStatus === 'error' && (
            <>
              ⚠️ Firestore 離線 — 使用本地存儲{' '}
              <button
                onClick={() => window.location.reload()}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                  color: 'var(--blue)', textDecoration: 'underline',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                重新連線
              </button>
            </>
          )}
        </span>
      </div>

      {/* Chart Modal */}
      {chartMetric && (
        <ChartModal
          metric={chartMetric}
          records={chartMetric === 'weight' ? weightRecords :
                   chartMetric === 'height' ? heightRecords :
                   chartMetric === 'headCircumference' ? headRecords :
                   chartMetric === 'chestCircumference' ? chestRecords : feedingRecords}
          user={user}
          onClose={() => setChartMetric(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
