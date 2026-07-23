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
  { id: 'sleep', label: '😴 睡眠', unit: '小時', showSleep: true },
  { id: 'diaper', label: '💩 尿布', unit: '次', showDiaper: true },
];

const TAB_COLORS = {
  weight: '#ff4d4d',
  height: '#2d5da1',
  headCircumference: '#8b5cf6',
  chestCircumference: '#06b6d4',
  feeding: '#f59e0b',
  sleep: '#3b82f6',
  diaper: '#10b981',
};

const Growth = () => {
  const ctx = useApp();
  const growthRecords = Array.isArray(ctx?.growthRecords) ? ctx.growthRecords : [];
  const sleepRecords = Array.isArray(ctx?.sleepRecords) ? ctx.sleepRecords : [];
  const diaperRecords = Array.isArray(ctx?.diaperRecords) ? ctx.diaperRecords : [];

  const addGrowthRecord = ctx?.addGrowthRecord;
  const deleteGrowthRecord = ctx?.deleteGrowthRecord;
  const addSleepRecord = ctx?.addSleepRecord;
  const deleteSleepRecord = ctx?.deleteSleepRecord;
  const addDiaperRecord = ctx?.addDiaperRecord;
  const deleteDiaperRecord = ctx?.deleteDiaperRecord;

  const [activeTab, setActiveTab] = useState('weight');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [value, setValue] = useState('');
  const [breastMilk, setBreastMilk] = useState('');
  const [formulaMilk, setFormulaMilk] = useState('');
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  // 睡眠表單
  const [startTime, setStartTime] = useState('21:00');
  const [endTime, setEndTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState('good');
  const [sleepNote, setSleepNote] = useState('');

  // 尿布表單
  const [diaperType, setDiaperType] = useState('wet'); // 'wet' | 'poop' | 'both'
  const [poopColor, setPoopColor] = useState('金黃');
  const [poopTexture, setPoopTexture] = useState('糊狀');
  const [diaperNote, setDiaperNote] = useState('');

  const activeTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];
  const activeColor = TAB_COLORS[activeTab] || '#2d5da1';

  // 刪除確認防誤觸 UX
  const handleDeleteSleep = (id) => {
    if (window.confirm('確定要刪除這筆睡眠記錄嗎？')) {
      deleteSleepRecord?.(id);
    }
  };
  const handleDeleteDiaper = (id) => {
    if (window.confirm('確定要刪除這筆尿布記錄嗎？')) {
      deleteDiaperRecord?.(id);
    }
  };
  const handleDeleteGrowth = (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      deleteGrowthRecord?.(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) return;

    if (activeTab === 'sleep') {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let startM = (sh || 0) * 60 + (sm || 0);
      let endM = (eh || 0) * 60 + (em || 0);
      if (endM <= startM) endM += 24 * 60; // 跨夜
      const durationMinutes = endM - startM;

      addSleepRecord?.({
        date,
        startTime,
        endTime,
        durationMinutes,
        quality: sleepQuality,
        note: sleepNote,
      });
      setSleepNote('');
      return;
    }

    if (activeTab === 'diaper') {
      addDiaperRecord?.({
        date,
        time,
        type: diaperType,
        poopColor: diaperType !== 'wet' ? poopColor : '',
        poopTexture: diaperType !== 'wet' ? poopTexture : '',
        note: diaperNote,
      });
      setDiaperNote('');
      return;
    }

    const record = {
      id: genId(),
      date,
      type: activeTab,
      unit: activeTabInfo.unit,
    };
    if (activeTabInfo.showTime) {
      record.time = time;
    }

    if (activeTab === 'feeding') {
      const bm = parseInt(breastMilk) || 0;
      const fm = parseInt(formulaMilk) || 0;
      if (bm === 0 && fm === 0) return;
      record.breastMilk = bm;
      record.formula = fm;
      record.value = bm + fm;
      record._schemaVersion = 2;
    } else {
      if (!value) return;
      record.value = parseFloat(value);
    }

    addGrowthRecord?.(record);
    setValue('');
    setBreastMilk('');
    setFormulaMilk('');
  };

  const records = growthRecords.filter(r => r && r.type === activeTab);
  const sortedRecords = [...records].sort((a, b) => {
    if (a.date === b.date && a.time && b.time) return b.time.localeCompare(a.time);
    return new Date(b.date) - new Date(a.date);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedingStats = growthRecords
    .filter(r => r && r.type === 'feeding' && r.date === todayStr)
    .reduce((stats, r) => {
      stats.breastMilk += (r.breastMilk || 0);
      stats.formula += (r.formula || 0);
      stats.total += (r.value || 0);
      stats.count += 1;
      return stats;
    }, { breastMilk: 0, formula: 0, total: 0, count: 0 });

  return (
    <div className="p-4 space-y-4" style={{ paddingBottom: '30px' }}>
      <h2 className="section-title">📏 成長與作息追蹤</h2>

      {/* Tabs：可滑動單行 / 不卡行的橫向滾動條排版 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setValue(''); }}
              className="btn-sm"
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: isActive ? activeColor : 'var(--card-bg)',
                color: isActive ? '#fff' : 'var(--fg)',
                borderColor: isActive ? activeColor : 'var(--fg)',
                fontWeight: isActive ? 700 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 奶量 今日總計 */}
      {activeTab === 'feeding' && todayFeedingStats.total > 0 && (
        <div className="sticky-note" style={{ transform: 'rotate(-0.5deg)', textAlign: 'center', padding: '12px 14px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', margin: 0 }}>
            🤱 {todayFeedingStats.breastMilk}ml + 🍼 {todayFeedingStats.formula}ml = <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{todayFeedingStats.total}</span> ml（{todayFeedingStats.count} 次）
          </p>
        </div>
      )}

      {/* 奶量 照片識別匯入與歷史 - 1:1 平行等寬 */}
      {activeTab === 'feeding' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            className="btn"
            onClick={() => setShowPhotoImport(true)}
            style={{ background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)', padding: '8px 10px', fontSize: '0.9rem', minHeight: '42px' }}
          >
            📷 拍照識別匯入
          </button>
          <button
            className="btn"
            onClick={() => setShowBatchHistory(true)}
            style={{ padding: '8px 10px', fontSize: '0.9rem', minHeight: '42px' }}
          >
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

          {/* ── 睡眠專屬表單 ── */}
          {activeTab === 'sleep' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="block mb-1 font-bold">睡覺時間</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div>
                  <label className="block mb-1 font-bold">起床時間</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-bold">睡眠品質</label>
                <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)}>
                  <option value="good">😊 熟睡 / 良好</option>
                  <option value="normal">😐 一般 / 中途醒來</option>
                  <option value="restless">😫 哭鬧 / 夜驚不安</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-bold">備註（選填）</label>
                <input type="text" value={sleepNote} onChange={e => setSleepNote(e.target.value)} placeholder="例如：睡前喝奶 150ml" />
              </div>
            </>
          )}

          {/* ── 尿布專屬表單 ── */}
          {activeTab === 'diaper' && (
            <>
              <div>
                <label className="block mb-1 font-bold">時間</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1 font-bold">類型</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setDiaperType('wet')}
                    className="btn-sm"
                    style={{
                      background: diaperType === 'wet' ? 'var(--blue)' : 'var(--card-bg)',
                      color: diaperType === 'wet' ? '#fff' : 'var(--fg)',
                      borderColor: diaperType === 'wet' ? 'var(--blue)' : 'var(--fg)',
                      padding: '4px 6px', fontSize: '0.82rem', whiteSpace: 'nowrap',
                    }}
                  >
                    💦 尿尿
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiaperType('poop')}
                    className="btn-sm"
                    style={{
                      background: diaperType === 'poop' ? 'var(--blue)' : 'var(--card-bg)',
                      color: diaperType === 'poop' ? '#fff' : 'var(--fg)',
                      borderColor: diaperType === 'poop' ? 'var(--blue)' : 'var(--fg)',
                      padding: '4px 6px', fontSize: '0.82rem', whiteSpace: 'nowrap',
                    }}
                  >
                    💩 便便
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiaperType('both')}
                    className="btn-sm"
                    style={{
                      background: diaperType === 'both' ? 'var(--blue)' : 'var(--card-bg)',
                      color: diaperType === 'both' ? '#fff' : 'var(--fg)',
                      borderColor: diaperType === 'both' ? 'var(--blue)' : 'var(--fg)',
                      padding: '4px 4px', fontSize: '0.78rem', whiteSpace: 'nowrap',
                    }}
                  >
                    💦💩 兩者都有
                  </button>
                </div>
              </div>
              {diaperType !== 'wet' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="block mb-1 font-bold">便便顏色</label>
                    <select value={poopColor} onChange={e => setPoopColor(e.target.value)}>
                      <option value="金黃">黃色 / 金黃</option>
                      <option value="綠色">墨綠 / 綠色</option>
                      <option value="褐色">褐色 / 棕色</option>
                      <option value="異常白色">⚠️ 灰白 (需注意)</option>
                      <option value="異常血絲">⚠️ 帶血絲 (需注意)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold">便便質地</label>
                    <select value={poopTexture} onChange={e => setPoopTexture(e.target.value)}>
                      <option value="糊狀">糊狀 (正常)</option>
                      <option value="水稀">水稀 / 水便</option>
                      <option value="成形">成形 / 軟便</option>
                      <option value="硬塊">硬塊 / 便秘</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block mb-1 font-bold">備註（選填）</label>
                <input type="text" value={diaperNote} onChange={e => setDiaperNote(e.target.value)} placeholder="例如：量多、換尿布時順便洗屁屁" />
              </div>
            </>
          )}

          {/* ── 奶量專屬表單 ── */}
          {activeTab === 'feeding' && (
            <>
              <div>
                <label className="block mb-1 font-bold">時間</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1 font-bold">🤱 母乳 (ml)</label>
                <input
                  type="number" step="1" min="0" max="500"
                  value={breastMilk} onChange={(e) => setBreastMilk(e.target.value)}
                  placeholder="例如：40"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">🍼 配方奶 (ml)</label>
                <input
                  type="number" step="1" min="0" max="500"
                  value={formulaMilk} onChange={(e) => setFormulaMilk(e.target.value)}
                  placeholder="例如：20"
                />
              </div>
            </>
          )}

          {/* ── 通用身高/體重/頭圍/胸圍表單 ── */}
          {!activeTabInfo.showFeeding && !activeTabInfo.showSleep && !activeTabInfo.showDiaper && (
            <div>
              <label className="block mb-1 font-bold">
                數值 ({activeTabInfo.unit})
              </label>
              <input
                type="number" step={activeTabInfo.step} min="0"
                value={value} onChange={(e) => setValue(e.target.value)}
                placeholder={activeTabInfo.placeholder} required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn w-full"
            style={{ background: activeColor, color: '#fff', borderColor: activeColor, fontWeight: 700 }}
          >
            ✅ 新增{activeTabInfo.label.replace(/[^一-龥]/g, '')}記錄
          </button>
        </div>
      </form>

      {/* History */}
      <div>
        {/* ── 睡眠歷史 ── */}
        {activeTab === 'sleep' && (
          <div>
            <h3 className="section-title">睡眠歷史 ({sleepRecords.length} 筆)</h3>
            {sleepRecords.length === 0 ? (
              <div className="card text-center opacity-60">尚無睡眠記錄</div>
            ) : (
              <div className="space-y-2">
                {sleepRecords.map(r => {
                  if (!r) return null;
                  const dur = Number(r.durationMinutes) || 0;
                  return (
                    <div key={r.id} className="card flex justify-between items-center" style={{ padding: '8px 12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.15rem', fontWeight: 600 }}>
                          🌙 {(dur / 60).toFixed(1)} 小時
                        </span>
                        <span style={{ fontSize: '0.8rem', marginLeft: 8, opacity: 0.8 }}>
                          ({r.startTime || ''} ~ {r.endTime || ''})
                        </span>
                        <p style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 2 }}>
                          📅 {r.date || ''} · {r.quality === 'good' ? '😊 熟睡' : r.quality === 'normal' ? '😐 一般' : '😫 哭鬧'}
                          {r.note && ` · ${r.note}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSleep(r.id)}
                        className="btn-sm"
                        style={{ color: 'var(--accent)', flexShrink: 0, padding: '4px 8px', marginLeft: '8px' }}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 尿布歷史 ── */}
        {activeTab === 'diaper' && (
          <div>
            <h3 className="section-title">尿布記錄 ({diaperRecords.length} 筆)</h3>
            {diaperRecords.length === 0 ? (
              <div className="card text-center opacity-60">尚無尿布記錄</div>
            ) : (
              <div className="space-y-2">
                {diaperRecords.map(r => {
                  if (!r) return null;
                  return (
                    <div key={r.id} className="card flex justify-between items-center" style={{ padding: '8px 12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600 }}>
                          {r.type === 'wet' ? '💦 尿尿' : r.type === 'poop' ? '💩 便便' : '💦💩 兩者都有'}
                        </span>
                        {r.poopColor && <span style={{ fontSize: '0.8rem', marginLeft: 8, opacity: 0.8 }}>{r.poopColor} ({r.poopTexture})</span>}
                        <p style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 2 }}>
                          📅 {r.date || ''} {r.time || ''}
                          {r.note && ` · ${r.note}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDiaper(r.id)}
                        className="btn-sm"
                        style={{ color: 'var(--accent)', flexShrink: 0, padding: '4px 8px', marginLeft: '8px' }}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 身高/體重/奶量歷史 ── */}
        {activeTab !== 'sleep' && activeTab !== 'diaper' && (
          <div>
            <h3 className="section-title">記錄歷史 ({records.length} 筆)</h3>
            {sortedRecords.length === 0 ? (
              <div className="card text-center">
                <p className="text-4xl mb-2">📊</p>
                <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有記錄，開始添加第一筆數據吧！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedRecords.map(record => {
                  if (!record) return null;
                  return (
                    <div key={record.id} className="card flex justify-between items-center animate-in" style={{ padding: '8px 12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {record.type === 'feeding' ? (() => {
                          const bm = Number(record.breastMilk) || 0;
                          const fm = Number(record.formula) || 0;
                          const total = Number(record.value) || 0;
                          const hasDetail = bm > 0 || fm > 0;
                          return (
                            <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.15rem', fontWeight: 600 }}>
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
                                <>🍼 {total} ml</>
                              )}
                            </span>
                          );
                        })() : (
                          <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.15rem', fontWeight: 600 }}>
                            {record.value} {record.unit}
                          </span>
                        )}
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', opacity: 0.6, marginTop: 2 }}>
                          {record.date}
                          {record.time && ` ${record.time}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGrowth(record.id)}
                        className="btn-sm"
                        style={{ color: 'var(--accent)', flexShrink: 0, padding: '4px 8px', marginLeft: '8px' }}
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Growth;
