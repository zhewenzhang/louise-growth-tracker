import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { genId } from '../../utils/id';
import PhotoImport from '../PhotoImport';
import BatchHistory from '../BatchHistory';

const TABS = [
  { id: 'weight', label: '⚖️ 體重', unit: 'kg', step: '0.001', placeholder: '例如：3.256', showTime: false },
  { id: 'height', label: '📐 身高', unit: 'cm', step: '0.1', placeholder: '例如：52.3', showTime: false },
  { id: 'headCircumference', label: '👶 頭圍', unit: 'cm', step: '0.1', placeholder: '例如：34.5', showTime: false },
  { id: 'chestCircumference', label: '👕 胸圍', unit: 'cm', step: '0.1', placeholder: '例如：33.0', showTime: false },
  { id: 'feeding', label: '🍼 奶量', unit: 'ml', step: '1', placeholder: '例如：60', showTime: true, showFeeding: true },
];

const Growth = () => {
  const { growthRecords, addGrowthRecord, deleteGrowthRecord } = useApp();
  const [activeTab, setActiveTab] = useState('weight');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [value, setValue] = useState('');
  const [breastMilk, setBreastMilk] = useState('');
  const [formulaMilk, setFormulaMilk] = useState('');
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) return;
    const record = {
      id: genId(),
      date,
      type: activeTab,
      unit: activeTabInfo.unit,
    };
    // 奶量記錄附帶時間
    if (activeTabInfo.showTime) {
      record.time = time;
    }
    
    if (activeTab === 'feeding') {
      const bm = parseInt(breastMilk) || 0;
      const fm = parseInt(formulaMilk) || 0;
      if (bm === 0 && fm === 0) return; // 至少一個有值
      record.breastMilk = bm;
      record.formula = fm;
      record.value = bm + fm; // 總量供統計用
      // 防衛：標記資料來自新版本（後續可用於診斷）
      record._schemaVersion = 2;
    } else {
      if (!value) return;
      record.value = parseFloat(value);
    }
    
    addGrowthRecord(record);
    setValue('');
    setBreastMilk('');
    setFormulaMilk('');
  };

  const records = growthRecords.filter(r => r.type === activeTab);
  const sortedRecords = [...records].sort((a, b) => {
    // 同一天內按時間排
    if (a.date === b.date && a.time && b.time) return b.time.localeCompare(a.time);
    return new Date(b.date) - new Date(a.date);
  });

  // 今天奶量總計（分開母乳和配方）
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedingStats = growthRecords
    .filter(r => r.type === 'feeding' && r.date === todayStr)
    .reduce((stats, r) => {
      stats.breastMilk += (r.breastMilk || 0);
      stats.formula += (r.formula || 0);
      stats.total += (r.value || 0);
      stats.count += 1;
      return stats;
    }, { breastMilk: 0, formula: 0, total: 0, count: 0 });

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '20px' }}>
      <h2 className="section-title">📏 成長追蹤</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setValue(''); }}
            className={`btn-sm ${activeTab === tab.id ? 'btn-blue' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 奶量 今日總計 */}
      {activeTab === 'feeding' && todayFeedingStats.total > 0 && (
        <div className="sticky-note" style={{ transform: 'rotate(-0.5deg)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
            🤱 {todayFeedingStats.breastMilk}ml + 🍼 {todayFeedingStats.formula}ml = <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>{todayFeedingStats.total}</span> ml（{todayFeedingStats.count} 次）
          </p>
        </div>
      )}

      {/* 奶量 照片識別匯入按鈕 */}
      {activeTab === 'feeding' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowPhotoImport(true)} style={{ flex: 1.5, background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' }}>
            📷 拍照識別匯入
          </button>
          <button className="btn" onClick={() => setShowBatchHistory(true)} style={{ flex: 1 }}>
            📋 匯入歷史
          </button>
        </div>
      )}

      {showPhotoImport && <PhotoImport onClose={() => setShowPhotoImport(false)} />}
      {showBatchHistory && <BatchHistory onClose={() => setShowBatchHistory(false)} />}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>
          新增{activeTabInfo.label.replace(/[^一-龥]/g, '')}記錄
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {activeTabInfo.showTime && (
            <div>
              <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>時間</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          )}
          {activeTabInfo.showFeeding ? (
            <>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>🤱 母乳 (ml)</label>
                <input
                  type="number" step="1" min="0" max="500"
                  value={breastMilk} onChange={(e) => setBreastMilk(e.target.value)}
                  placeholder="例如：40"
                />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>🍼 配方奶 (ml)</label>
                <input
                  type="number" step="1" min="0" max="500"
                  value={formulaMilk} onChange={(e) => setFormulaMilk(e.target.value)}
                  placeholder="例如：20"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                數值 ({activeTabInfo.unit})
              </label>
              <input
                type="number" step={activeTabInfo.step} min="0"
                value={value} onChange={(e) => setValue(e.target.value)}
                placeholder={activeTabInfo.placeholder} required
              />
            </div>
          )}
          <button type="submit" className="btn w-full">✅ 新增記錄</button>
        </div>
      </form>

      {/* History */}
      <div>
        <h3 className="section-title">記錄歷史 ({records.length} 筆)</h3>
        {sortedRecords.length === 0 ? (
          <div className="card text-center">
            <p className="text-4xl mb-2">📊</p>
            <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有記錄，開始添加第一筆數據吧！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedRecords.map(record => (
              <div key={record.id} className="card p-3 flex justify-between items-center animate-in">
                <div>
                  {record.type === 'feeding' ? (() => {
                    const bm = Number(record.breastMilk) || 0;
                    const fm = Number(record.formula) || 0;
                    const total = Number(record.value) || 0;
                    // 如果有 breastMilk/formula 明細，顯示詳細
                    const hasDetail = bm > 0 || fm > 0;
                    return (
                      <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.2rem', fontWeight: 600 }}>
                        {hasDetail ? (
                          <>
                            {bm > 0 && `🤱${bm}`}
                            {bm > 0 && fm > 0 && ' + '}
                            {fm > 0 && `🍼${fm}`}
                            {(bm + fm !== total) && (
                              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}> = {total} ml</span>
                            )}
                            {(bm + fm === total) && (
                              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}> ml</span>
                            )}
                          </>
                        ) : (
                          // 缺明細時，至少顯示總量（避免空白只剩 "= 89 ml"）
                          <>🍼 {total} ml</>
                        )}
                      </span>
                    );
                  })() : (
                    <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.2rem', fontWeight: 600 }}>
                      {record.value} {record.unit}
                    </span>
                  )}
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.6 }}>
                    {record.date}
                    {record.time && ` ${record.time}`}
                  </p>
                </div>
                <button onClick={() => deleteGrowthRecord(record.id)} className="btn-sm" style={{ color: 'var(--accent)' }} title="刪除">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Growth;
