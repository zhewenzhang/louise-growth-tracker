import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { APP_VERSION } from '../../utils/version';

const BabyProfileHeader = ({ user, babyAge, onNavigate }) => {
  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? '早安 ☀️' : h < 18 ? '午安 🌤️' : '晚安 🌙';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.3rem', lineHeight: 1.2, color: 'var(--fg)' }}>
          {getGreeting()}
        </h1>
        {user?.name && (
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--accent)', marginTop: 2 }}>
            {user.name}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'var(--yellow)', color: '#2d2d2d', fontSize: '0.85rem' }}>
            👶 {typeof babyAge === 'string' ? babyAge : (babyAge?.chronological || '計算中...')}
          </span>
          {typeof babyAge === 'object' && babyAge?.isPremature && babyAge?.corrected && (
            <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.85rem' }}>
              🍼 矯正 {babyAge.corrected}
            </span>
          )}
        </div>
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
          gap: '6px',
        }}
        title="設定"
      >
        <SettingsIcon size={16} />
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>v{APP_VERSION.split('.')[0]}.{APP_VERSION.split('.')[1]}</span>
      </button>
    </div>
  );
};

export default BabyProfileHeader;
