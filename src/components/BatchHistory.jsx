import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

// 照片批量匯入歷史記錄
// 顯示每次 AI 識別匯入的批次，可展開查看每筆、單獨修改/刪除、或整批撤銷
const BatchHistory = ({ onClose }) => {
  const { feedingBatches, deleteFeedingBatch, growthRecords, updateGrowthRecord, deleteGrowthRecord } = useApp();
  const [confirmId, setConfirmId] = useState(null);
  const [viewImage, setViewImage] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editRecId, setEditRecId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
  };

  const modelLabel = (id) => {
    if (!id) return '—';
    return id.split('/').pop().replace(/-preview$/, '');
  };

  // 取得某批次目前還存在的記錄（依時間排序）
  const batchRecords = (batch) => {
    const ids = new Set(batch.recordIds || []);
    return growthRecords
      .filter(r => ids.has(r.id))
      .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
  };

  const startEdit = (rec) => {
    setEditRecId(rec.id);
    setEditForm({
      date: rec.date || '',
      time: rec.time || '',
      breastMilk: Number(rec.breastMilk) || 0,
      formula: Number(rec.formula) || 0,
    });
  };

  const saveEdit = (recId) => {
    const bm = Number(editForm.breastMilk) || 0;
    const fm = Number(editForm.formula) || 0;
    updateGrowthRecord(recId, {
      date: editForm.date,
      time: editForm.time,
      breastMilk: bm,
      formula: fm,
      value: bm + fm,
    });
    setEditRecId(null);
  };

  const sorted = [...(feedingBatches || [])].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={onClose}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', background: 'var(--card-bg)' }}
        onClick={e => e.stopPropagation()}>

        {/* 標題 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>📋 匯入歷史</h3>
          <button onClick={onClose} className="btn-sm" style={{ color: 'var(--accent)' }}>✕</button>
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📭</div>
            <p style={{ fontFamily: 'var(--font-body)', opacity: 0.6 }}>還沒有照片批量匯入記錄</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.6 }}>
              共 {sorted.length} 次匯入。點「查看明細」可單獨修改或刪除某一筆。
            </p>

            {sorted.map(batch => {
              const recs = batchRecords(batch);
              const alive = recs.length;
              const isConfirming = confirmId === batch.id;
              const isExpanded = expandedId === batch.id;
              return (
                <div key={batch.id} style={{ border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)', padding: 12, background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                        📷 {formatTime(batch.uploadedAt)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', opacity: 0.7, marginTop: 2 }}>
                        匯入 {batch.recordCount} 筆
                        {alive !== batch.recordCount && (
                          <span style={{ color: 'var(--accent)' }}>（現存 {alive} 筆）</span>
                        )}
                        {batch.model && ` · 🤖 ${modelLabel(batch.model)}`}
                      </div>
                    </div>
                    {batch.imageUrl && (
                      <button
                        onClick={() => setViewImage(batch.imageUrl)}
                        style={{ flexShrink: 0, border: '1.5px solid var(--fg)', borderRadius: 'var(--wobbly-sm)', padding: 0, overflow: 'hidden', width: 48, height: 48, cursor: 'pointer', background: 'none' }}
                        title="查看原圖"
                      >
                        <img src={batch.imageUrl} alt="原圖" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    )}
                  </div>

                  {/* 操作列 */}
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn-sm"
                      onClick={() => { setExpandedId(isExpanded ? null : batch.id); setEditRecId(null); }}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {isExpanded ? '▲ 收起明細' : `▼ 查看明細 (${alive})`}
                    </button>
                    {!isConfirming ? (
                      <button
                        className="btn-sm"
                        style={{ color: 'var(--accent)', fontSize: '0.78rem' }}
                        onClick={() => setConfirmId(batch.id)}
                      >
                        🗑️ 撤銷整批
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--accent)', flex: 1 }}>
                          刪除整批 {alive} 筆？
                        </span>
                        <button className="btn-sm" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', fontSize: '0.75rem' }}
                          onClick={() => { deleteFeedingBatch(batch.id); setConfirmId(null); }}>確認</button>
                        <button className="btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmId(null)}>取消</button>
                      </div>
                    )}
                  </div>

                  {/* 展開的明細列表 */}
                  {isExpanded && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {recs.length === 0 ? (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', padding: '8px 0' }}>
                          這批記錄已全部刪除
                        </p>
                      ) : recs.map(rec => (
                        <div key={rec.id} style={{ border: '1px solid var(--fg)', borderRadius: 'var(--wobbly-sm)', padding: 8, background: 'var(--card-bg)' }}>
                          {editRecId === rec.id ? (
                            /* 編輯模式 */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={{ flex: 1.4, fontSize: '0.78rem', padding: '5px 7px' }} />
                                <input type="time" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} style={{ flex: 1, fontSize: '0.78rem', padding: '5px 7px' }} />
                              </div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', flexShrink: 0 }}>🤱</label>
                                <input type="number" min="0" max="500" value={editForm.breastMilk} onChange={e => setEditForm(p => ({ ...p, breastMilk: Number(e.target.value) || 0 }))} style={{ flex: 1, fontSize: '0.78rem', padding: '5px 7px' }} />
                                <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', flexShrink: 0 }}>🍼</label>
                                <input type="number" min="0" max="500" value={editForm.formula} onChange={e => setEditForm(p => ({ ...p, formula: Number(e.target.value) || 0 }))} style={{ flex: 1, fontSize: '0.78rem', padding: '5px 7px' }} />
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn-sm" style={{ flex: 1, background: 'var(--green)', color: '#fff', borderColor: 'var(--green)', fontSize: '0.75rem' }} onClick={() => saveEdit(rec.id)}>✅ 儲存</button>
                                <button className="btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => setEditRecId(null)}>取消</button>
                              </div>
                            </div>
                          ) : (
                            /* 顯示模式 */
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
                                <span style={{ opacity: 0.6 }}>{rec.date}{rec.time && ` ${rec.time}`}</span>
                                <br/>
                                <span style={{ fontFamily: 'var(--font-number)', fontWeight: 600 }}>
                                  {Number(rec.breastMilk) > 0 && `🤱${rec.breastMilk}`}
                                  {Number(rec.breastMilk) > 0 && Number(rec.formula) > 0 && ' + '}
                                  {Number(rec.formula) > 0 && `🍼${rec.formula}`}
                                  <span style={{ opacity: 0.6, fontWeight: 400 }}> = {rec.value} ml</span>
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button className="btn-sm" style={{ fontSize: '0.7rem' }} onClick={() => startEdit(rec)}>✏️</button>
                                <button className="btn-sm" style={{ fontSize: '0.7rem', color: 'var(--accent)' }} onClick={() => deleteGrowthRecord(rec.id)}>🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 原圖檢視 */}
      {viewImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setViewImage('')}>
          <img src={viewImage} alt="原圖" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
          <button
            onClick={() => setViewImage('')}
            style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: '1.2rem', cursor: 'pointer' }}
          >✕</button>
        </div>
      )}
    </div>
  );
};

export default BatchHistory;
