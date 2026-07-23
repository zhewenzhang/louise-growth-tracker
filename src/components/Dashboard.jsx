import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatBabyAge } from '../utils/calculations';
import BabyProfileHeader from './dashboard/BabyProfileHeader';
import TodaySummaryCards from './dashboard/TodaySummaryCards';
import DayTimeline from './dashboard/DayTimeline';
import GrowthPercentileWidget from './dashboard/GrowthPercentileWidget';
import ChartModal from './ChartModal';

const Dashboard = ({ onNavigate }) => {
  const ctx = useApp();
  const user = ctx?.user;
  const milestones = Array.isArray(ctx?.milestones) ? ctx.milestones : [];
  const vaccineRecords = Array.isArray(ctx?.vaccineRecords) ? ctx.vaccineRecords : [];

  const [chartMetric, setChartMetric] = useState(null);
  const [chartRecords, setChartRecords] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const babyAge = useMemo(() => {
    return formatBabyAge(user?.birthDate, user?.dueDate);
  }, [user?.birthDate, user?.dueDate, tick]);

  const latestMilestone = milestones.length > 0 ? milestones[0] : null;
  const vaccineCompleted = vaccineRecords.filter(v => v && v.completed).length;

  const handleOpenChart = (metric, records) => {
    if (!records || records.length < 2) {
      alert('資料不足兩筆，暫無法繪製曲線圖喔！');
      return;
    }
    setChartMetric(metric);
    setChartRecords(records);
  };

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '20px' }}>
      {/* 1. 寶寶問候與月齡 Header */}
      <BabyProfileHeader user={user} babyAge={babyAge} onNavigate={onNavigate} />

      {/* 2. 24 小時晝夜作息手繪時間軸 */}
      <DayTimeline />

      {/* 3. 今日概況快捷卡片（奶量、體溫、睡眠、尿布） */}
      <TodaySummaryCards onNavigate={onNavigate} />

      {/* 4. WHO 成長發育百分位 Widget */}
      <GrowthPercentileWidget onOpenChart={handleOpenChart} />

      {/* 5. 最新里程碑與疫苗概況 */}
      <div className="grid grid-cols-2 gap-3">
        <div onClick={() => onNavigate?.('memories')} className="card cursor-pointer hover:opacity-90 transition-opacity" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>🎉 最新里程碑</span>
          {latestMilestone ? (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.98rem',
              lineHeight: 1.35,
              marginTop: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {latestMilestone.emoji} {latestMilestone.title}
            </p>
          ) : (
            <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: 4 }}>尚未解鎖里程碑</p>
          )}
        </div>

        <div onClick={() => onNavigate?.('health')} className="card cursor-pointer hover:opacity-90 transition-opacity" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>💉 疫苗進度</span>
          <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
            {vaccineCompleted} / {vaccineRecords.length} <span style={{ fontSize: '0.85rem', fontWeight: 400, opacity: 0.8, marginLeft: '2px' }}>劑</span>
          </p>
        </div>
      </div>

      {/* 6. WHO 百分位與成長曲線 Modal */}
      {chartMetric && (
        <ChartModal
          metric={chartMetric}
          records={chartRecords}
          user={user}
          onClose={() => setChartMetric(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
