import React, { useMemo, useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useApp } from '../context/AppContext.jsx';
import { formatBabyAge } from '../utils/calculations';
import { calcPercentile } from '../utils/whoPercentile';
import { APP_VERSION } from '../utils/version';
import ChartModal from './ChartModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = ({ onNavigate }) => {
  const { user, growthRecords, vaccineRecords, milestones, doctorVisits, firestoreStatus, writeError } = useApp();
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
      y: { grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }, ticks: { color: '#999', font: { family: 'Inter', size: 11 }, callback: v => Number(v.toFixed(2)) + ' kg' } },
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

      {/* ── 重要提醒區：優化版關懷提醒與貼士 ── */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. 篩選逾期疫苗 (dueDate < today 且未完成)
        const overdueVaccines = [...(vaccineRecords || [])]
          .filter(v => !v.completed && v.dueDate && new Date(v.dueDate) < today)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // 2. 篩選 14 天內即將到期疫苗
        const upcomingVaccines = [...(vaccineRecords || [])]
          .filter(v => !v.completed && v.dueDate && new Date(v.dueDate) >= today && new Date(v.dueDate) <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000))
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // 3. 篩選今日與即將回診 (今日看診 + 7天內回診)
        const todayVisits = (doctorVisits || []).filter(v => {
          const targetDate = v.followUpDate || (v.status === 'scheduled' ? v.date : null);
          if (!targetDate) return false;
          const d = new Date(targetDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        const upcomingVisits = (doctorVisits || [])
          .filter(v => {
            const targetDate = v.followUpDate || (v.status === 'scheduled' ? v.date : null);
            if (!targetDate) return false;
            const d = new Date(targetDate);
            d.setHours(0, 0, 0, 0);
            return d > today && d <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          })
          .sort((a, b) => new Date(a.followUpDate || a.date) - new Date(b.followUpDate || b.date))
          .slice(0, 2);

        // 4. 生長記錄量測提醒 (大於 14 天)
        const lastGrowthDate = growthRecords && growthRecords.length > 0
          ? new Date(Math.max(...growthRecords.map(r => new Date(r.date))))
          : null;
        const daysSinceLastGrowth = lastGrowthDate
          ? Math.round((today - lastGrowthDate) / (1000 * 60 * 60 * 24))
          : null;
        const showGrowthAlert = daysSinceLastGrowth === null || daysSinceLastGrowth > 14;

        // 5. 分月齡小貼士
        const getDevelopmentTip = (months) => {
          if (months < 0) {
            return {
              title: "👶 矯正未足月護理",
              content: "寶寶為早產兒，目前矯正月齡尚未足月。此階段以保暖、建立穩定的餵養節律、充足睡眠為主，請多觀察寶寶的精神與呼吸狀態。"
            };
          }
          if (months < 1) {
            return {
              title: "👶 新生兒適應期",
              content: "Louise 目前還在適應新世界。多注意抱姿、按需餵養。滿月記得施打B肝第2劑疫苗，並可開始做黑白圖卡視覺刺激。"
            };
          } else if (months < 2) {
            return {
              title: "👀 視覺與眼神交流",
              content: "寶寶開始能注視人臉並追隨移動物體。可以多與她對視、說話。滿2個月有五合一及肺炎鏈球菌疫苗喔！"
            };
          } else if (months < 4) {
            return {
              title: "💪 練習抬頭 (Tummy Time)",
              content: "3個月左右是訓練頸部肌肉的黃金期。每天清醒時可練習趴撐數分鐘，有助於大動作發展。滿4個月記得打第2劑疫苗。"
            };
          } else if (months < 6) {
            return {
              title: "🍼 準備副食品",
              content: "4-6個月寶寶唾液分泌變多、對大人的食物有興趣。如果脖子夠挺、可扶坐，可以開始嘗試少量副食品泥囉！"
            };
          } else if (months < 9) {
            return {
              title: "🧘 學習坐立與抓握",
              content: "6個月後寶寶開始練習坐，手部抓握也更精準。可以準備手指食物 (finger foods)。同時請注意居家環境防護，防跌落。"
            };
          } else if (months < 12) {
            return {
              title: "🧗 爬行與探索世界",
              content: "9個月左右是爬行活躍期。多陪伴她探索，並注意把地上的細小物品、插座封好。此時寶寶也開始發音，多與她交流。"
            };
          } else {
            return {
              title: "🎉 滿週歲的探索家",
              content: "1歲後可以逐漸以固體食物為主食。多帶寶寶到戶外活動、曬太陽，並注意1歲後的常規疫苗（如MMR、水痘疫苗等）。"
            };
          }
        };

        const correctedMonths = correctedAgeInfo?.correctedMonths ?? 0;
        const devTip = getDevelopmentTip(correctedMonths);

        // 日期標籤 helper
        const dayTag = (dateStr) => {
          const d = new Date(dateStr);
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
          if (diff < 0) return { text: `${Math.abs(diff)} 天前`, color: '#999', bg: '#f5f5f5' };
          if (diff === 0) return { text: '今天', color: '#ff4d4d', bg: '#ffebee' };
          if (diff === 1) return { text: '明天', color: '#e67e22', bg: '#fff8e1' };
          if (diff <= 7) return { text: `${diff} 天後`, color: '#e67e22', bg: '#fff8e1' };
          return { text: `${diff} 天後`, color: '#2d7d46', bg: '#e8f5e9' };
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 2 }}>📌 重要提醒與關懷提示</h3>

            {/* 1. 逾期疫苗 */}
            {overdueVaccines.map((v, index) => {
              const tag = dayTag(v.dueDate);
              return (
                <button
                  key={v.id}
                  onClick={() => onNavigate?.('health', { initialTab: 'vaccine' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#ffebee',
                    border: '2px solid #ff4d4d',
                    borderRadius: 'var(--wobbly-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '12px 14px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transform: `rotate(${(index % 2 === 0 ? -0.5 : 0.5)}deg)`
                  }}
                >
                  <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c62828', fontWeight: 600 }}>
                        {v.name} ({v.dose})
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                        background: '#ffebee', color: '#ff4d4d',
                        border: '1.5px solid #ff4d4d',
                        borderRadius: 'var(--wobbly-sm)', padding: '1px 7px', fontWeight: 600,
                      }}>已逾期 {tag.text.replace(' 前', '')}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.7, marginTop: 2 }}>
                      建議月齡：{v.recommendedAge}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>
                      📅 預計日期：{new Date(v.dueDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
                </button>
              );
            })}

            {/* 2. 今日看診 */}
            {todayVisits.map(v => (
              <button
                key={v.id}
                onClick={() => onNavigate?.('health', { initialTab: 'visit' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff8e1',
                  border: '2px solid #e67e22',
                  borderRadius: 'var(--wobbly-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transform: 'rotate(-0.5deg)'
                }}
              >
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🏥</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--fg)', fontWeight: 600 }}>
                      今天就診：{v.hospital || '回診'}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                      background: '#ffebee', color: '#ff4d4d',
                      border: '1.5px solid #ff4d4d',
                      borderRadius: 'var(--wobbly-sm)', padding: '1px 7px', fontWeight: 600,
                    }}>今日</span>
                  </div>
                  {(v.department || v.location || v.visitNumber) && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.8, marginTop: 2 }}>
                      {v.department && ` department: ${v.department}`}
                      {v.location && `　📍 ${v.location}`}
                      {v.visitNumber && `　🔢 診號 ${v.visitNumber}`}
                    </div>
                  )}
                  {v.time && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6, marginTop: 2 }}>
                      ⏰ 時間：{v.time} {v.doctor && `· ${v.doctor} 醫師`}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
              </button>
            ))}

            {/* 3. 即將接種疫苗 */}
            {upcomingVaccines.slice(0, 2).map((v, index) => {
              const tag = dayTag(v.dueDate);
              return (
                <button
                  key={v.id}
                  onClick={() => onNavigate?.('health', { initialTab: 'vaccine' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--card-bg)',
                    border: '2px solid var(--fg)',
                    borderRadius: 'var(--wobbly-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '12px 14px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transform: `rotate(${(index % 2 === 0 ? 0.5 : -0.5)}deg)`
                  }}
                >
                  <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>💉</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--fg)' }}>
                        {v.name} ({v.dose})
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                        background: tag.bg, color: tag.color,
                        border: `1.5px solid ${tag.color}`,
                        borderRadius: 'var(--wobbly-sm)', padding: '1px 7px', fontWeight: 600,
                      }}>{tag.text}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.7, marginTop: 2 }}>
                      建議月齡：{v.recommendedAge}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>
                      📅 預計日期：{new Date(v.dueDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
                </button>
              );
            })}

            {/* 4. 即將回診 */}
            {upcomingVisits.map((v, index) => {
              const targetDate = v.followUpDate || v.date;
              const tag = dayTag(targetDate);
              return (
                <button
                  key={v.id}
                  onClick={() => onNavigate?.('health', { initialTab: 'visit' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--card-bg)',
                    border: `2px solid ${tag.color === '#e67e22' ? '#f0a500' : 'var(--fg)'}`,
                    borderRadius: 'var(--wobbly-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '12px 14px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transform: `rotate(${(index % 2 === 0 ? -0.5 : 0.5)}deg)`
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
                        background: tag.bg, color: tag.color,
                        border: `1.5px solid ${tag.color}`,
                        borderRadius: 'var(--wobbly-sm)', padding: '1px 7px', fontWeight: 600,
                      }}>{tag.text}</span>
                    </div>
                    {(v.department || v.location || v.visitNumber) && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.75, marginTop: 2 }}>
                        {v.department && `🏷️ ${v.department}`}
                        {v.location && `　📍 ${v.location}`}
                        {v.visitNumber && `　🔢 診號 ${v.visitNumber}`}
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>
                      📅 {new Date(targetDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {v.time && ` ⏰ ${v.time}`}
                      {v.doctor && ` · ${v.doctor}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
                </button>
              );
            })}

            {/* 5. 生長指標量測提醒 */}
            {showGrowthAlert && (
              <button
                onClick={() => onNavigate?.('growth')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#e8f5e9',
                  border: '2px solid #2d7d46',
                  borderRadius: 'var(--wobbly-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transform: 'rotate(0.5deg)'
                }}
              >
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⚖️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#2d7d46', fontWeight: 600 }}>
                    生長指標量測提醒
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.8, marginTop: 2, color: 'var(--fg)' }}>
                    {daysSinceLastGrowth === null 
                      ? "目前尚未記錄生長數據，請記錄寶寶的第一筆身高、體重吧！" 
                      : `已經有 ${daysSinceLastGrowth} 天沒有測量寶寶的身高體重囉！建議每兩週記錄一次以更新百分位。`}
                  </div>
                </div>
                <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>›</span>
              </button>
            )}

            {/* 6. 每日奶量貼心提示 */}
            {feedingAssessment && (() => {
              const { status, projectedTotal, mlPerKg, projectedMlPerKg, minTarget, maxTarget } = feedingAssessment;
              
              let icon = "🍼";
              let title = "奶量攝取提醒";
              let content = "";
              let bgColor = "var(--card-bg)";
              let borderColor = "var(--fg)";
              let titleColor = "var(--fg)";
              
              if (status === 'good') {
                icon = "🌟";
                title = "今日奶量達標";
                content = `目前今日已餵奶量良好，預估全天奶量 ${projectedTotal}ml (${projectedMlPerKg} ml/kg) 符合標準範圍！繼續保持。`;
                bgColor = '#e8f5e9';
                borderColor = '#2d7d46';
                titleColor = '#2d7d46';
              } else if (status === 'ok') {
                icon = "🍼";
                title = "今日奶量尚可";
                content = `目前預估全天奶量 ${projectedTotal}ml (${projectedMlPerKg} ml/kg)，已達到最低標，可視寶寶需求適度增減。`;
                bgColor = '#fff8e1';
                borderColor = '#e67e22';
                titleColor = '#e67e22';
              } else if (status === 'high') {
                icon = "⚠️";
                title = "今日奶量偏多";
                content = `預估今日總量 ${projectedTotal}ml (${projectedMlPerKg} ml/kg) 偏高。若寶寶精神良好無溢奶，通常是猛長期現象，請順應餵養。`;
                bgColor = '#fff3e0';
                borderColor = '#e65100';
                titleColor = '#e65100';
              } else {
                icon = "⚠️";
                title = "今日奶量偏低";
                content = `預估今日奶量 ${projectedTotal}ml 偏低 (標準為 ${minTarget}-${maxTarget} ml/kg)。建議觀察寶寶的濕尿布次數（每日應 5-6 片以上）。`;
                bgColor = '#ffebee';
                borderColor = '#ff4d4d';
                titleColor = '#c62828';
              }
              
              return (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 'var(--wobbly-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '12px 14px',
                    transform: 'rotate(-0.5deg)'
                  }}
                >
                  <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: titleColor, fontWeight: 600 }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.8, marginTop: 2, color: 'var(--fg)' }}>
                      {content}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 7. 寶寶分月齡育兒貼士 (便利貼風格) */}
            <div className="sticky-note" style={{ transform: 'rotate(-1deg)', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '2rem' }}>{devTip.title.split(' ')[0]}</span>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--fg)', fontWeight: 600 }}>
                    {devTip.title}
                  </h4>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', marginTop: 2, lineHeight: 1.4, opacity: 0.8 }}>
                    {devTip.content}
                  </p>
                </div>
              </div>
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

      {/* Firestore 寫入錯誤警告（避免靜默吞掉錯誤） */}
      {writeError && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffebee',
          border: '2px solid var(--accent)',
          borderRadius: 'var(--wobbly-sm)',
          boxShadow: 'var(--shadow-sm)',
          padding: '10px 16px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'var(--accent)',
          zIndex: 100,
          maxWidth: '90%',
          textAlign: 'center',
        }}>
          ⚠️ 雲端同步失敗：{writeError.operation}<br/>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            資料已存本地，請檢查網路或 Firestore Rules
          </span>
        </div>
      )}

      {/* Firestore 狀態指示器 + 版本號 */}
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
        <br/>
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.6 }}>
          v {APP_VERSION}
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
