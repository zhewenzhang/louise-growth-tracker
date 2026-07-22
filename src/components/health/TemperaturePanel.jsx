import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const TemperaturePanel = () => {
  const { tempRecords, addTempRecord, deleteTempRecord } = useApp();
  const [tempDate, setTempDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempTime, setTempTime] = useState(new Date().toTimeString().slice(0, 5));
  const [tempValue, setTempValue] = useState('');
  const [tempMed, setTempMed] = useState('');
  const [tempNote, setTempNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tempValue) return;
    const val = parseFloat(tempValue);
    addTempRecord({
      date: tempDate,
      time: tempTime,
      temperature: val,
      feverStatus: val >= 38.5 ? 'high' : val >= 37.5 ? 'mild' : 'normal',
      medicationName: tempMed,
      note: tempNote,
    });
    setTempValue('');
    setTempMed('');
    setTempNote('');
  };

  const latest = tempRecords.length > 0 ? tempRecords[0] : null;
  const isHigh = latest && latest.temperature >= 38.5;
  const isMild = latest && latest.temperature >= 37.5 && latest.temperature < 38.5;

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
            最新體溫：<strong>{latest.temperature} °C</strong>（{latest.date} {latest.time}）
            {latest.medicationName && ` · 已服藥：${latest.medicationName}`}
          </p>
        </div>
      )}

      {/* 新增體溫表單 */}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>🌡️ 量測體溫</h3>
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
          <label className="block mb-1 font-bold">體溫 (°C)</label>
          <input
            type="number" step="0.1" min="34" max="43"
            placeholder="例如：37.8"
            value={tempValue} onChange={(e) => setTempValue(e.target.value)}
            required
          />
        </div>
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
              const itemHigh = r.temperature >= 38.5;
              const itemMild = r.temperature >= 37.5 && r.temperature < 38.5;
              return (
                <div key={r.id} className="card p-3 flex justify-between items-center" style={{
                  borderLeft: itemHigh ? '5px solid #ef4444' : itemMild ? '5px solid #f59e0b' : '5px solid #10b981',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-number)', fontSize: '1.3rem', fontWeight: 700, color: itemHigh ? '#dc2626' : itemMild ? '#d97706' : 'var(--fg)' }}>
                        {r.temperature} °C
                      </span>
                      {itemHigh && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px' }}>高燒</span>}
                      {itemMild && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px' }}>發燒</span>}
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      📅 {r.date} {r.time}
                      {r.medicationName && ` · 💊 ${r.medicationName}`}
                    </p>
                    {r.note && <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>📝 {r.note}</p>}
                  </div>
                  <button onClick={() => deleteTempRecord(r.id)} className="btn-sm" style={{ color: 'var(--accent)' }} title="刪除">🗑️</button>
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
