import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { genId } from '../../utils/id';

const MedicationPanel = () => {
  const { medications, addMedication, updateMedication, deleteMedication } = useApp();
  const [medForm, setMedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    name: '', dose: '', frequency: '', reason: '', note: ''
  });
  const [editMedId, setEditMedId] = useState(null);
  const [editMedForm, setEditMedForm] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!medForm.name || !medForm.date) return;
    addMedication({ id: genId(), ...medForm });
    setMedForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      name: '', dose: '', frequency: '', reason: '', note: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* 新增用藥表單 */}
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>💊 新增用藥記錄</h3>
        <div className="space-y-2">
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={medForm.date} onChange={e => setMedForm(p => ({ ...p, date: e.target.value }))} required style={{ flex: 1 }} />
            <input type="time" value={medForm.time} onChange={e => setMedForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
          </div>
          <input type="text" value={medForm.name} onChange={e => setMedForm(p => ({ ...p, name: e.target.value }))} placeholder="藥品名稱（如：退燒藥）" required />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={medForm.dose} onChange={e => setMedForm(p => ({ ...p, dose: e.target.value }))} placeholder="劑量（如：1ml）" style={{ flex: 1 }} />
            <input type="text" value={medForm.frequency} onChange={e => setMedForm(p => ({ ...p, frequency: e.target.value }))} placeholder="頻率（如：每6小時）" style={{ flex: 1 }} />
          </div>
          <input type="text" value={medForm.reason} onChange={e => setMedForm(p => ({ ...p, reason: e.target.value }))} placeholder="用藥原因（如：發燒38.5°C）" />
          <input type="text" value={medForm.note} onChange={e => setMedForm(p => ({ ...p, note: e.target.value }))} placeholder="備註（選填）" />
          <button type="submit" className="btn w-full">✅ 新增記錄</button>
        </div>
      </form>

      {/* 用藥歷史 */}
      <div>
        <h3 className="section-title">用藥歷史 ({medications.length} 筆)</h3>
        {medications.length === 0 ? (
          <div className="card text-center">
            <p className="text-4xl mb-2">💊</p>
            <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有用藥記錄</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...medications].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))).map(r => (
              <div key={r.id} className="card-sm animate-in" style={{ padding: '12px 14px' }}>
                {editMedId === r.id ? (
                  /* ── 編輯模式 ── */
                  <div className="space-y-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>✏️ 編輯用藥記錄</span>
                      <button onClick={() => setEditMedId(null)} className="btn-sm" style={{ fontSize: '0.7rem' }}>✕ 取消</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="date" value={editMedForm.date || ''} onChange={e => setEditMedForm(p => ({ ...p, date: e.target.value }))} style={{ flex: 1 }} />
                      <input type="time" value={editMedForm.time || ''} onChange={e => setEditMedForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1 }} />
                    </div>
                    <input type="text" value={editMedForm.name || ''} onChange={e => setEditMedForm(p => ({ ...p, name: e.target.value }))} placeholder="藥品名稱" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={editMedForm.dose || ''} onChange={e => setEditMedForm(p => ({ ...p, dose: e.target.value }))} placeholder="劑量" style={{ flex: 1 }} />
                      <input type="text" value={editMedForm.frequency || ''} onChange={e => setEditMedForm(p => ({ ...p, frequency: e.target.value }))} placeholder="頻率" style={{ flex: 1 }} />
                    </div>
                    <input type="text" value={editMedForm.reason || ''} onChange={e => setEditMedForm(p => ({ ...p, reason: e.target.value }))} placeholder="用藥原因" />
                    <input type="text" value={editMedForm.note || ''} onChange={e => setEditMedForm(p => ({ ...p, note: e.target.value }))} placeholder="備註" />
                    <button onClick={() => {
                      if (!editMedForm.name || !editMedForm.date) return;
                      updateMedication(r.id, editMedForm);
                      setEditMedId(null);
                    }} className="btn w-full" style={{ fontSize: '0.9rem' }}>✅ 儲存修改</button>
                  </div>
                ) : (
                  /* ── 顯示模式 ── */
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>💊 {r.name}</h4>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7 }}>
                        {r.dose && `${r.dose}`}{r.frequency && ` · ${r.frequency}`}
                      </p>
                      {r.reason && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.55 }}>原因：{r.reason}</p>}
                      {r.note && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.55 }}>備註：{r.note}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingRight: '2px' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5 }}>{r.date} {r.time || ''}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <button
                          onClick={() => { setEditMedId(r.id); setEditMedForm({ date: r.date, time: r.time, name: r.name, dose: r.dose, frequency: r.frequency, reason: r.reason, note: r.note }); }}
                          className="btn-sm"
                          style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}
                          title="編輯"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`確定刪除用藥記錄「${r.name}」？`)) deleteMedication(r.id); }}
                          className="btn-sm"
                          style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }}
                          title="刪除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationPanel;
