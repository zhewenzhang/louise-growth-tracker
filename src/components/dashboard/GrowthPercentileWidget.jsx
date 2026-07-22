import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { calcPercentile } from '../../utils/whoPercentile';

const GrowthPercentileWidget = ({ onOpenChart }) => {
  const { growthRecords, user } = useApp();

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

  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
  const latestHeight = heightRecords.length > 0 ? heightRecords[heightRecords.length - 1] : null;
  const latestHead = headRecords.length > 0 ? headRecords[headRecords.length - 1] : null;

  // 矯正月齡
  const correctedAgeInfo = useMemo(() => {
    if (!user?.birthDate || !user?.dueDate) return null;
    const birth = new Date(user.birthDate);
    const due = new Date(user.dueDate);
    const prematurityDays = Math.floor((due - birth) / (1000 * 60 * 60 * 24));
    const now = new Date();
    const chronologicalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    const correctedDays = chronologicalDays - prematurityDays;
    return { correctedDays, correctedMonths: correctedDays / 30.44 };
  }, [user?.birthDate, user?.dueDate]);

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

  return (
    <div className="card space-y-3" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>📊 成長發育 (WHO 百分位)</h3>
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>點擊卡片查看曲線</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* 體重 */}
        <div
          onClick={() => onOpenChart?.('weight', weightRecords)}
          className="card-sm cursor-pointer hover:opacity-90 transition-all text-center"
          style={{ padding: '10px 8px' }}
        >
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>⚖️ 體重</span>
          <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 700, margin: '2px 0' }}>
            {latestWeight ? latestWeight.value : '—'} <span style={{ fontSize: '0.75rem' }}>kg</span>
          </p>
          {weightPercentile && (
            <span className="badge" style={{
              fontSize: '0.7rem',
              background: weightPercentile.color === 'green' ? '#d1fae5' : '#fef3c7',
              color: weightPercentile.color === 'green' ? '#065f46' : '#92400e',
            }}>
              {weightPercentile.percentile}
            </span>
          )}
        </div>

        {/* 身高 */}
        <div
          onClick={() => onOpenChart?.('height', heightRecords)}
          className="card-sm cursor-pointer hover:opacity-90 transition-all text-center"
          style={{ padding: '10px 8px' }}
        >
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>📐 身高</span>
          <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 700, margin: '2px 0' }}>
            {latestHeight ? latestHeight.value : '—'} <span style={{ fontSize: '0.75rem' }}>cm</span>
          </p>
          {heightPercentile && (
            <span className="badge" style={{
              fontSize: '0.7rem',
              background: heightPercentile.color === 'green' ? '#d1fae5' : '#fef3c7',
              color: heightPercentile.color === 'green' ? '#065f46' : '#92400e',
            }}>
              {heightPercentile.percentile}
            </span>
          )}
        </div>

        {/* 頭圍 */}
        <div
          onClick={() => onOpenChart?.('headCircumference', headRecords)}
          className="card-sm cursor-pointer hover:opacity-90 transition-all text-center"
          style={{ padding: '10px 8px' }}
        >
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>👶 頭圍</span>
          <p style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 700, margin: '2px 0' }}>
            {latestHead ? latestHead.value : '—'} <span style={{ fontSize: '0.75rem' }}>cm</span>
          </p>
          {headPercentile && (
            <span className="badge" style={{
              fontSize: '0.7rem',
              background: headPercentile.color === 'green' ? '#d1fae5' : '#fef3c7',
              color: headPercentile.color === 'green' ? '#065f46' : '#92400e',
            }}>
              {headPercentile.percentile}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowthPercentileWidget;
