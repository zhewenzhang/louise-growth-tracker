import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { getCurrentUid } from '../../lib/firebase';
import { hasPinSet, removePin } from '../../utils/pinLock';
import { getTheme, setTheme } from '../../utils/theme';
import PinSetup from '../PinSetup';

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
  const [uid, setUid] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupMode, setPinSetupMode] = useState('setup');
  const [pinExists, setPinExists] = useState(hasPinSet());
  const [pinStatus, setPinStatus] = useState('');
  const [theme, setThemeState] = useState(getTheme());

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    getCurrentUid().then(id => setUid(id || '未登入'));
  }, []);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(uid);
    setCopyStatus('✅ 已複製');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const rulesTemplate = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth.uid in [
        "${uid}"
      ];
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesTemplate);
    setCopyStatus('✅ 規則已複製');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handlePinSetupDone = () => {
    setShowPinSetup(false);
    setPinExists(true);
    setPinStatus(pinSetupMode === 'change' ? '✅ PIN 已更新' : '✅ PIN 已設定');
    setTimeout(() => setPinStatus(''), 2000);
  };

  const handleSetPin = () => {
    setPinSetupMode(pinExists ? 'change' : 'setup');
    setShowPinSetup(true);
  };

  const handleRemovePin = () => {
    if (!confirm('⚠️ 確定要移除 PIN 鎖嗎？移除後所有人都能直接打開 App。')) return;
    removePin();
    setPinExists(false);
    setPinStatus('✅ PIN 鎖已移除');
    setTimeout(() => setPinStatus(''), 2000);
  };

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
    <>
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

        {/* 外觀主題 */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>
            🎨 外觀主題
          </h3>
          <div className="space-y-3">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.7 }}>
              當前模式：<strong>{theme === 'dark' ? '🌙 深色模式' : '☀️ 淺色模式'}</strong>
            </p>
            <button onClick={handleToggleTheme} className="btn w-full">
              {theme === 'dark' ? '☀️ 切換到淺色模式' : '🌙 切換到深色模式'}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.5 }}>
              深色模式適合夜間使用，保護眼睛 ✨
            </p>
          </div>
        </div>

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

        {/* 雲端同步 */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>
            🔒 雲端同步安全
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                當前裝置 UID
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={uid}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
                <button type="button" onClick={handleCopyUid} className="btn-sm" style={{ flexShrink: 0 }}>
                  📋
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>
                每個裝置/瀏覽器有獨立 UID。清除瀏覽器資料會產生新 UID。
              </p>
            </div>

            <details>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                📖 如何設定 Firestore 存取規則（必讀）
              </summary>
              <div style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: '0.85rem', opacity: 0.8 }}>
                <p style={{ marginBottom: 8 }}>
                  前往 <a
                    href="https://console.firebase.google.com/project/louise-tracker/firestore/rules"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--blue)', textDecoration: 'underline' }}
                  >Firebase Console → Firestore Rules</a>
                  ，複製下方規則貼上並發布：
                </p>
                <pre style={{
                  background: '#2d2d2d', color: '#fdfbf7',
                  padding: 12, borderRadius: 'var(--wobbly-sm)',
                  fontSize: '0.7rem', overflow: 'auto', fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>{rulesTemplate}</pre>
                <button type="button" onClick={handleCopyRules} className="btn-sm" style={{ marginTop: 8 }}>
                  📋 複製規則
                </button>
                <p style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.7 }}>
                  ⚠️ 其他裝置登入時會有不同 UID，需在 <code>request.auth.uid in [...]</code> 陣列中新增該 UID。
                </p>
              </div>
            </details>

            {copyStatus && (
              <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--green)' }}>{copyStatus}</p>
            )}
          </div>
        </div>

        {/* PIN 密碼鎖 */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 12 }}>
            🔐 PIN 密碼鎖
          </h3>
          <div className="space-y-3">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.7 }}>
              狀態：{pinExists
                ? <strong style={{ color: 'var(--green)' }}>✅ 已啟用</strong>
                : <strong style={{ color: 'var(--accent)' }}>❌ 未啟用</strong>}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', opacity: 0.6 }}>
              啟用後，每次打開 App 需輸入 6 位 PIN（解鎖後 7 天內免再輸入）。
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleSetPin} className="btn" style={{ flex: 1, minWidth: '140px' }}>
                {pinExists ? '🔁 修改 PIN' : '✨ 設定 PIN'}
              </button>
              {pinExists && (
                <button onClick={handleRemovePin} className="btn" style={{ flex: 1, minWidth: '140px' }}>
                  🗑️ 移除 PIN
                </button>
              )}
            </div>
            {pinStatus && (
              <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--green)' }}>{pinStatus}</p>
            )}
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

      {showPinSetup && (
        <PinSetup mode={pinSetupMode} onDone={handlePinSetupDone} onSkip={() => setShowPinSetup(false)} />
      )}
    </>
  );
};

export default Settings;
