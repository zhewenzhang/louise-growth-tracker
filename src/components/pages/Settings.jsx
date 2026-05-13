import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const Settings = () => {
  const { user, setUser, exportData, importData } = useApp();
  const [form, setForm] = useState({
    name: user?.name || '',
    birthDate: user?.birthDate || '',
    dueDate: user?.dueDate || '',
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleSave = (e) => {
    e.preventDefault();
    setUser({ ...user, ...form });
    setSaveStatus('✅ 已儲存');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('⚠️ 匯入會覆蓋目前所有資料，確定要繼續嗎？')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importData(event.target.result);
        setImportStatus('✅ 匯入成功');
        setTimeout(() => setImportStatus(''), 3000);
        // 更新表單
        setForm({
          name: user?.name || '',
          birthDate: user?.birthDate || '',
          dueDate: user?.dueDate || '',
        });
      } catch (err) {
        setImportStatus(`❌ 匯入失敗：${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 space-y-5" style={{ paddingBottom: '80px' }}>
      <h2 className="section-title">⚙️ 設定</h2>

      {/* 寶寶資料 */}
      <form onSubmit={handleSave} className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>👶 寶寶資料</h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>名字</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>出生日期</label>
            <input type="date" value={form.birthDate}
              onChange={(e) => setForm(p => ({ ...p, birthDate: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>預產期（早產計算用）</label>
            <input type="date" value={form.dueDate}
              onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>
              若為足月兒，預產期 = 出生日期
            </p>
          </div>
          <button type="submit" className="btn w-full">✅ 儲存</button>
          {saveStatus && (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--green)' }}>{saveStatus}</p>
          )}
        </div>
      </form>

      {/* 資料備份 */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>💾 資料備份</h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="btn w-full">📤 匯出 JSON 備份</button>
          <button onClick={handleImportClick} className="btn w-full">📥 從 JSON 還原</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {importStatus && (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)' }}>{importStatus}</p>
          )}
          <p style={{ fontSize: '0.8rem', opacity: 0.6, fontFamily: 'var(--font-body)' }}>
            ⚠️ 匯入會覆蓋目前資料，建議先匯出一份作為還原點。
          </p>
        </div>
      </div>

      {/* 關於 */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 8 }}>ℹ️ 關於</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.7 }}>
          Louise 成長記錄 v1.0.0<br/>
          雲端同步：Firebase Firestore<br/>
          離線存儲：localStorage
        </p>
      </div>
    </div>
  );
};

export default Settings;
