import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const TemperaturePanel = () => {
  const { tempRecords, addTempRecord, deleteTempRecord } = useApp();
  const [tempDate, setTempDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempTime, setTempTime] = useState(new Date().toTimeString().slice(0, 5));
  const [tempValue, setTempValue] = useState('');
  const [tempMethod, setTempMethod] = useState('ear'); // 'ear' | 'armpit' | 'forehead'
  const [tempMed, setTempMed] = useState('');
  const [tempNote, setTempNote] = useState('');

  // 換算參考體溫（腋溫自動 +0.5°C）
  const getRefTemp = (val, method) => {
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return method === 'armpit' ? parseFloat((num + 0.5).toFixed(1)) : num;
  };

  const currentRefTemp = getRefTemp(tempValue, tempMethod);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tempValue) return;
    const rawVal = parseFloat(tempValue);
    const refVal = getRefTemp(tempValue, tempMethod);
    const feverStatus = refVal >= 38.5 ? 'high' : refVal >= 37.5 ? 'mild' : 'normal';

    addTempRecord({
      date: tempDate,
      time: tempTime,
      temperature: rawVal,
      method: tempMethod,
      refTemperature: refVal,
      feverStatus,
      medicationName: tempMed,
      note: tempNote,
    });
    setTempValue('');
    setTempMed('');
    setTempNote('');
  };

  // 最新記錄
  const latest = tempRecords.length > 0 ? tempRecords[0] : null;
  const latestRef = latest ? (latest.refTemperature || getRefTemp(latest.temperature, latest.method || 'ear')) : null;
  const isHigh = latestRef !== null && latestRef >= 38.5;
  const isMild = latestRef !== null && latestRef >= 37.5 && latestRef < 38.5;

  return (
    <div className="space-y-4">
      {/* 發燒警告 Banner */}
      {latest && (isHigh || isMild) && (
        <div className="sticky-note" style={{
          background: isHigh ? '#fee2e2' : '#fef3c7',
          borderColor: isHigh ? '#ef4444' : '#f59e0b',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: isHigh ? '#dc2626' : '#d97706' }}>
            {isHigh ? '🔥 注意：高燒中！' : '⚠️ 注意：微燒中'}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
            最新量測：<strong>{latest.temperature} °C</strong> ({latest.method === 'armpit' ? '腋溫' : latest.method === 'forehead' ? '額溫' : '耳溫'})
            <span style={{ marginLeft: 6, fontWeight: 700 }}>➔ 實際參考體溫：{latestRef} °C</span>
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.8 }}>
            📅 {latest.date} {latest.time} {latest.medicationName && ` · 💊 已服藥：${latest.medicationName}`}
          </p>
        </div>
      )}

      {/* 新增體溫表單 */}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>🌡️ 量測體溫</h3>

        {/* 量測部位選擇 */}
        <div>
          <label className="block mb-1 font-bold">量測部位 / 方式</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTempMethod('ear')}
              className={`btn-sm ${tempMethod === 'ear' ? 'btn-blue' : ''}`}
              style={{ flex: 1 }}
            >
              👂 耳溫 (直讀)
            </button>
            <button
              type="button"
              onClick={() => setTempMethod('armpit')}
              className={`btn-sm ${tempMethod === 'armpit' ? 'btn-blue' : ''}`}
              style={{ flex: 1 }}
            >
              🦾 腋溫 (+0.5°C參考)
            </button>
            <button
              type="button"
              onClick={() => setTempMethod('forehead')}
              className={`btn-sm ${tempMethod === 'forehead' ? 'btn-blue' : ''}`}
              style={{ flex: 1 }}
            >
              🌡️ 額溫 / 其他
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label className="block mb-1 font-bold">日期</label>
            <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-bold">時間</label>
            <input type="time" value={tempTime} onChange={(e) => setTempTime(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-bold">量測體溫 (°C)</label>
          <input
            type="number" step="0.1" min="34" max="43"
            placeholder="例如：37.3"
            value={tempValue} onChange={(e) => setTempValue(e.target.value)}
            required
          />
        </div>

        {/* 雙體溫參考卡片 */}
        {currentRefTemp !== null && (
          <div style={{
            background: tempMethod === 'armpit' ? '#fef3c7' : 'var(--bg)',
            border: '2px solid var(--fg)',
            borderRadius: 'var(--wobbly-sm)',
            padding: '10px',
            fontSize: '0.9rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📏 數字量測：<strong>{tempValue} °C</strong> ({tempMethod === 'armpit' ? '腋溫' : tempMethod === 'forehead' ? '額溫' : '耳溫'})</span>
              {tempMethod === 'armpit' && <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>腋溫+0.5</span>}
            </div>
            <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: currentRefTemp >= 38.5 ? '#dc2626' : currentRefTemp >= 37.5 ? '#d97706' : '#10b981' }}>
              🎯 實際參考體溫：<strong>{currentRefTemp} °C</strong>
              <span style={{ fontSize: '0.85rem', marginLeft: 8 }}>
                ({currentRefTemp >= 38.5 ? '🔥 高燒' : currentRefTemp >= 37.5 ? '⚠️ 微燒' : '✅ 正常'})
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block mb-1 font-bold">退燒藥 / 處置（選填）</label>
          <input
            type="text" placeholder="例如：安佳熱 2.5ml"
            value={tempMed} onChange={(e) => setTempMed(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-bold">備註（選填）</label>
          <input
            type="text" placeholder="例如：洗溫水澡、活動力正常"
            value={tempNote} onChange={(e) => setTempNote(e.target.value)}
          />
        </div>
        <button type="submit" className="btn w-full btn-blue">✅ 新增體溫記錄</button>
      </form>

      {/* 歷史體溫 */}
      <div>
        <h3 className="section-title">體溫歷史 ({tempRecords.length} 筆)</h3>
        {tempRecords.length === 0 ? (
          <div className="card text-center text-sm opacity-60">尚無體溫記錄</div>
        ) : (
          <div className="space-y-2">
            {tempRecords.map(r => {
              const method = r.method || 'ear';
              const refTemp = r.refTemperature || getRefTemp(r.temperature, method);
              const itemHigh = refTemp >= 38.5;
              const itemMild = refTemp >= 37.5 && refTemp < 38.5;

              return (
                <div key={r.id} className="card p-3 flex justify-between items-center" style={{
                  borderLeft: itemHigh ? '5px solid #ef4444' : itemMild ? '5px solid #f59e0b' : '5px solid #10b981',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.2rem', fontWeight: 700 }}>
                        {r.temperature} °C
                      </span>
                      <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px' }}>
                        {method === 'armpit' ? '腋溫' : method === 'forehead' ? '額溫' : '耳溫'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: itemHigh ? '#dc2626' : itemMild ? '#d97706' : '#10b981' }}>
                        ➔ 實際參考 {refTemp} °C
                      </span>
                      {itemHigh && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px' }}>高燒</span>}
                      {itemMild && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px' }}>發燒</span>}
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 2 }}>
                      📅 {r.date} {r.time}
                      {r.medicationName && ` · 💊 ${r.medicationName}`}
                    </p>
                    {r.note && <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>📝 {r.note}</p>}
                  </div>
                  <button
                    onClick={() => { if (window.confirm('確定刪除此體溫記錄？')) deleteTempRecord(r.id); }}
                    className="btn-sm"
                    style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0, marginLeft: 8 }}
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
    </div>
  );
};

export default TemperaturePanel;
