import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { prepareImages } from '../utils/imageCompress';
import { recognizeFeedingImage, hasApiKey, getModel } from '../lib/openrouter';

// 照片識別批量匯入餵奶記錄
// 流程：拍照/選圖 → AI 識別 → 確認頁面（可編輯）→ 批量上傳
const PhotoImport = ({ onClose }) => {
  const { importFeedingBatch } = useApp();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('select'); // 'select' | 'recognizing' | 'confirm' | 'uploading' | 'done'
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [aiImageURL, setAiImageURL] = useState('');
  const [archiveImageURL, setArchiveImageURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [resultCount, setResultCount] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!hasApiKey()) {
      setError('尚未設定 OpenRouter API Key，請先到「設定 → 🤖 AI 識別設定」填入');
      return;
    }

    try {
      setStep('recognizing');
      const { aiImage, archiveImage } = await prepareImages(file);
      setAiImageURL(aiImage.dataURL);
      setArchiveImageURL(archiveImage.dataURL);
      setPreviewURL(aiImage.dataURL);

      const result = await recognizeFeedingImage(aiImage.dataURL);
      if (!result || result.length === 0) {
        setError('沒有辨識到任何餵奶記錄，請換一張更清晰的照片');
        setStep('select');
        return;
      }
      setRecords(result);
      setStep('confirm');
    } catch (err) {
      setError(err.message || '識別失敗');
      setStep('select');
    }
  };

  const updateRecord = (idx, field, value) => {
    setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const deleteRecord = (idx) => {
    setRecords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    // 過濾無效記錄
    const valid = records.filter(r => r.date && (Number(r.breastMilk) > 0 || Number(r.formula) > 0));
    if (valid.length === 0) {
      setError('沒有有效的記錄可上傳');
      return;
    }
    try {
      setStep('uploading');
      await importFeedingBatch(valid, {
        imageDataURL: archiveImageURL,
        model: getModel(),
      });
      setResultCount(valid.length);
      setStep('done');
    } catch (err) {
      setError('上傳失敗：' + (err.message || ''));
      setStep('confirm');
    }
  };

  const totalMl = records.reduce((s, r) => s + (Number(r.breastMilk) || 0) + (Number(r.formula) || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={onClose}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', background: 'var(--card-bg)' }}
        onClick={e => e.stopPropagation()}>

        {/* 標題 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>📷 照片識別匯入</h3>
          <button onClick={onClose} className="btn-sm" style={{ color: 'var(--accent)' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#ffebee', border: '2px solid var(--accent)', borderRadius: 'var(--wobbly-sm)', padding: '10px 12px', marginBottom: 12, fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--accent)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step: 選圖 */}
        {step === 'select' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🍼📋</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', opacity: 0.7, marginBottom: 20, lineHeight: 1.6 }}>
              拍攝或選擇手寫餵奶記錄表照片<br/>
              AI 會自動辨識日期、時間、母奶、配方奶
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button className="btn w-full" onClick={() => fileInputRef.current?.click()}>
              📷 拍照 / 選擇照片
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 12 }}>
              💡 提示：照片越清晰、光線越足，辨識越準確
            </p>
          </div>
        )}

        {/* Step: 識別中 */}
        {step === 'recognizing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {previewURL && (
              <img src={previewURL} alt="預覽" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--fg)', marginBottom: 16 }} />
            )}
            <div style={{ fontSize: '2rem', animation: 'pulse 1.5s ease-in-out infinite' }}>🤖</div>
            <p style={{ fontFamily: 'var(--font-body)', marginTop: 8 }}>AI 識別中，請稍候...</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5, marginTop: 4 }}>
              通常需要 10～30 秒
            </p>
          </div>
        )}

        {/* Step: 確認 */}
        {step === 'confirm' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
              <span>共辨識 <strong>{records.length}</strong> 筆 · 合計 <strong>{totalMl}</strong> ml</span>
              {previewURL && (
                <button className="btn-sm" onClick={() => window.open(previewURL, '_blank')} style={{ fontSize: '0.7rem' }}>🔍 看原圖</button>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', opacity: 0.6, marginBottom: 10 }}>
              請核對下方資料，可直接修改數字或刪除錯誤列：
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '40vh', overflow: 'auto', marginBottom: 14 }}>
              {records.map((r, idx) => (
                <div key={idx} style={{ border: '1.5px solid var(--fg)', borderRadius: 'var(--wobbly-sm)', padding: 10, background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input type="date" value={r.date} onChange={e => updateRecord(idx, 'date', e.target.value)} style={{ flex: 1.4, fontSize: '0.8rem', padding: '6px 8px' }} />
                    <input type="time" value={r.time} onChange={e => updateRecord(idx, 'time', e.target.value)} style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} />
                    <button onClick={() => deleteRecord(idx)} className="btn-sm" style={{ color: 'var(--accent)', fontSize: '0.7rem', flexShrink: 0 }}>🗑️</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', flexShrink: 0 }}>🤱母奶</label>
                    <input type="number" min="0" max="500" value={r.breastMilk} onChange={e => updateRecord(idx, 'breastMilk', Number(e.target.value) || 0)} style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} />
                    <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', flexShrink: 0 }}>🍼配方</label>
                    <input type="number" min="0" max="500" value={r.formula} onChange={e => updateRecord(idx, 'formula', Number(e.target.value) || 0)} style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} />
                  </div>
                  {r.note && (
                    <input type="text" value={r.note} onChange={e => updateRecord(idx, 'note', e.target.value)} placeholder="備註" style={{ fontSize: '0.75rem', padding: '5px 8px', marginTop: 6, opacity: 0.8 }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => { setStep('select'); setRecords([]); }}>
                ← 重新選圖
              </button>
              <button className="btn btn-blue" style={{ flex: 1.5 }} onClick={handleUpload}>
                ✅ 批量上傳 {records.length} 筆
              </button>
            </div>
          </div>
        )}

        {/* Step: 上傳中 */}
        {step === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '2rem', animation: 'pulse 1.5s ease-in-out infinite' }}>☁️</div>
            <p style={{ fontFamily: 'var(--font-body)', marginTop: 8 }}>上傳中...</p>
          </div>
        )}

        {/* Step: 完成 */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>匯入成功！</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.7, marginTop: 6 }}>
              已新增 {resultCount} 筆餵奶記錄
            </p>
            <button className="btn w-full" style={{ marginTop: 20 }} onClick={onClose}>
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoImport;
