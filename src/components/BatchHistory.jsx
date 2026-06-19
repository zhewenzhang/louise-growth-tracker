import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

// 照片批量匯入歷史記錄
// 顯示每次 AI 識別匯入的批次，可查看原圖、整批撤銷
const BatchHistory = ({ onClose }) => {
  const { feedingBatches, deleteFeedingBatch, growthRecords } = useApp();
  const [confirmId, setConfirmId] = useState(null);
  const [viewImage, setViewImage] = useState('');

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
  };

  const modelLabel = (id) => {
    if (!id) return '—';
    // 取斜線後的簡短名稱
    return id.split('/').pop().replace(/-preview$/, '');
  };

  // 計算某批次目前還存在的記錄數（可能部分被手動刪除）
  const aliveCount = (batch) => {
    const ids = new Set(batch.recordIds || []);
    return growthRecords.filter(r => ids.has(r.id)).length;
  };

  const sorted = [...(feedingBatches || [])].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={onClose}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', background: 'var(--card-bg)' }}
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
              共 {sorted.length} 次匯入。撤銷會刪除該批所有餵奶記錄。
            </p>

            {sorted.map(batch => {
              const alive = aliveCount(batch);
              const isConfirming = confirmId === batch.id;
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

                  {/* 撤銷操作 */}
                  <div style={{ marginTop: 10 }}>
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--accent)', flex: 1 }}>
                          確定刪除這批 {alive} 筆記錄？
                        </span>
                        <button
                          className="btn-sm"
                          style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
                          onClick={() => { deleteFeedingBatch(batch.id); setConfirmId(null); }}
                        >
                          確認撤銷
                        </button>
                        <button className="btn-sm" onClick={() => setConfirmId(null)}>取消</button>
                      </div>
                    ) : (
                      <button
                        className="btn-sm"
                        style={{ color: 'var(--accent)', fontSize: '0.78rem' }}
                        onClick={() => setConfirmId(batch.id)}
                      >
                        🗑️ 撤銷整批匯入
                      </button>
                    )}
                  </div>
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
