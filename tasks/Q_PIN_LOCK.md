# PIN 密碼鎖功能

## 🎯 目標

在 App 最外層加一個可愛的 6 位數字 PIN 鎖屏。訪客打開頁面會看到鎖屏，只有知道 PIN 的人才能進入。

### 設計重點
- 6 位數字 PIN（手機友善）
- 可愛手繪風格（沿用 wobbly border、hard shadow、寶寶 emoji）
- 解鎖後 7 天免輸入（localStorage expiry）
- PIN 用 SHA-256 hash 存 localStorage，不存明碼
- 不依賴任何新 npm 套件（用 Web Crypto API）
- 用戶可在 Settings 頁設定 / 修改 / 移除 PIN

### 嚴格約束
- ✅ 不改變現有任何功能行為
- ✅ 沿用手繪 UI 風格
- ❌ 不做後端 PIN 驗證（純前端，Firestore Rules 已擋資料）
- ❌ 不做 PIN 找回功能（清 localStorage 即可重置）

---

## 📋 步驟

| Step | 內容 |
|------|------|
| 1 | 新增 `src/utils/pinLock.js`（hash + storage helpers） |
| 2 | 新增 `src/components/LockScreen.jsx`（鎖屏 UI + 數字鍵盤） |
| 3 | 新增 `src/components/PinSetup.jsx`（設定 / 修改 PIN） |
| 4 | 修改 `src/App.jsx` 整合鎖屏邏輯 |
| 5 | 修改 `src/components/pages/Settings.jsx` 加 PIN 管理區塊 |
| 6 | 修改 `src/styles/globals.css` 加動畫 |
| 7 | 構建驗證 + 部署 |

---

## Step 1：新增 `src/utils/pinLock.js`

```js
// PIN 密碼鎖工具
// 使用 Web Crypto API (SubtleCrypto) 做 SHA-256 hash
// PIN 不以明碼儲存，僅儲存 hash 結果

const PIN_HASH_KEY = 'louise_pin_hash';
const PIN_UNLOCK_KEY = 'louise_pin_unlocked_until';
const UNLOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// SHA-256 hash → hex string
const sha256 = async (text) => {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// 是否已設定 PIN
export const hasPinSet = () => {
  return !!localStorage.getItem(PIN_HASH_KEY);
};

// 設定 PIN（覆蓋舊的）
export const setPin = async (pin) => {
  const hash = await sha256(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
  unlock();
};

// 驗證 PIN
export const verifyPin = async (pin) => {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await sha256(pin);
  return hash === stored;
};

// 移除 PIN
export const removePin = () => {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_UNLOCK_KEY);
};

// 標記為已解鎖（7 天內免輸入）
export const unlock = () => {
  const expireAt = Date.now() + UNLOCK_DURATION_MS;
  localStorage.setItem(PIN_UNLOCK_KEY, String(expireAt));
};

// 鎖定
export const lock = () => {
  localStorage.removeItem(PIN_UNLOCK_KEY);
};

// 檢查目前是否處於解鎖狀態
export const isUnlocked = () => {
  if (!hasPinSet()) return true;
  const expireAt = parseInt(localStorage.getItem(PIN_UNLOCK_KEY) || '0', 10);
  return Date.now() < expireAt;
};
```

---

## Step 2：新增 `src/components/LockScreen.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { verifyPin, unlock } from '../utils/pinLock';

const PIN_LENGTH = 6;

const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleInput = (digit) => {
    if (pin.length >= PIN_LENGTH) return;
    setError(false);
    setPin(prev => prev + digit);
  };

  const handleDelete = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    (async () => {
      const ok = await verifyPin(pin);
      if (ok) {
        unlock();
        setTimeout(() => onUnlock(), 300);
      } else {
        setError(true);
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setPin('');
        }, 500);
      }
    })();
  }, [pin, onUnlock]);

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      padding: '24px',
    }}>
      <div className={shaking ? 'pin-shake' : ''} style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '5rem',
          marginBottom: '12px',
          animation: pin.length === PIN_LENGTH && !error ? 'pin-success 0.5s ease-out' : 'pin-bounce 2s ease-in-out infinite',
        }}>
          {error ? '😢' : pin.length === PIN_LENGTH ? '🎉' : '👶'}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          color: 'var(--fg)', marginBottom: '8px',
        }}>
          {error ? 'PIN 錯誤' : '輸入 PIN'}
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.95rem',
          color: 'var(--fg)', opacity: 0.6, marginBottom: '32px',
        }}>
          {error ? '再試一次吧' : '這是 Louise 的私人空間 ✨'}
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '40px' }}>
          {dots.map((filled, i) => (
            <div key={i} style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid var(--fg)',
              background: filled ? (error ? 'var(--accent)' : 'var(--fg)') : 'transparent',
              transition: 'all 0.15s ease',
              boxShadow: filled ? '2px 2px 0px 0px rgba(45,45,45,0.3)' : 'none',
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: '12px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handleInput(String(n))} className="pin-key"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
                width: '72px', height: '72px', background: '#fff',
                border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
                boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
              }}>{n}</button>
          ))}
          <div />
          <button onClick={() => handleInput('0')} className="pin-key"
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
            }}>0</button>
          <button onClick={handleDelete} className="pin-key"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '1.4rem',
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              opacity: pin.length > 0 ? 1 : 0.4, transition: 'all 0.1s ease',
            }}>⌫</button>
        </div>

        <p style={{ marginTop: '32px', fontFamily: 'var(--font-body)', fontSize: '0.7rem', opacity: 0.4 }}>
          忘記 PIN？清除瀏覽器資料即可重置
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
```

---

## Step 3：新增 `src/components/PinSetup.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { setPin } from '../utils/pinLock';

const PIN_LENGTH = 6;

const PinSetup = ({ onDone, onSkip, mode = 'setup' }) => {
  const [step, setStep] = useState(1);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  const current = step === 1 ? pin1 : pin2;
  const setCurrent = step === 1 ? setPin1 : setPin2;

  const handleInput = (digit) => {
    if (current.length >= PIN_LENGTH) return;
    setError('');
    setCurrent(prev => prev + digit);
  };

  const handleDelete = () => {
    setError('');
    setCurrent(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (step === 1 && pin1.length === PIN_LENGTH) {
      setTimeout(() => setStep(2), 200);
    }
  }, [pin1, step]);

  useEffect(() => {
    if (step === 2 && pin2.length === PIN_LENGTH) {
      if (pin1 === pin2) {
        (async () => {
          await setPin(pin1);
          onDone?.();
        })();
      } else {
        setError('兩次輸入不一致，請重新設定');
        setTimeout(() => { setPin1(''); setPin2(''); setStep(1); setError(''); }, 1500);
      }
    }
  }, [pin2, step, pin1, onDone]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < current.length);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>
          {step === 1 ? '🔐' : '🔁'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '6px' }}>
          {mode === 'change' ? '修改 PIN' : '設定 PIN'}
        </h1>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.6, marginBottom: '24px' }}>
          {step === 1 ? '輸入 6 位數字 PIN' : '再輸入一次確認'}
        </p>

        {error && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--accent)', marginBottom: '12px', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '32px' }}>
          {dots.map((filled, i) => (
            <div key={i} style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid var(--fg)',
              background: filled ? 'var(--fg)' : 'transparent',
              transition: 'all 0.15s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: '12px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handleInput(String(n))} className="pin-key"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
                width: '72px', height: '72px', background: '#fff',
                border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
                boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
              }}>{n}</button>
          ))}
          <div />
          <button onClick={() => handleInput('0')} className="pin-key"
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
            }}>0</button>
          <button onClick={handleDelete} className="pin-key"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '1.4rem',
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              opacity: current.length > 0 ? 1 : 0.4, transition: 'all 0.1s ease',
            }}>⌫</button>
        </div>

        {mode === 'setup' && step === 1 && onSkip && (
          <button onClick={onSkip}
            style={{
              marginTop: '24px', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
              color: 'var(--fg)', opacity: 0.5, background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
            暫時跳過，之後再設定
          </button>
        )}
      </div>
    </div>
  );
};

export default PinSetup;
```

---

## Step 4：修改 `src/App.jsx`

在頂部 import 區新增：
```jsx
import LockScreen from './components/LockScreen';
import { hasPinSet, isUnlocked } from './utils/pinLock';
```

把原本的 `function App()` 改為：

```jsx
const AppGate = () => {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const pinSet = hasPinSet();

  if (!pinSet || unlocked) {
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    );
  }

  return <LockScreen onUnlock={() => setUnlocked(true)} />;
};

function App() {
  return (
    <ErrorBoundary>
      <AppGate />
    </ErrorBoundary>
  );
}

export default App;
```

---

## Step 5：修改 `src/components/pages/Settings.jsx`

### 5a. 頂部 import 新增：
```jsx
import { hasPinSet, removePin } from '../../utils/pinLock';
import PinSetup from '../PinSetup';
```

### 5b. 在 Settings 函數內 state 區新增：
```jsx
const [showPinSetup, setShowPinSetup] = useState(false);
const [pinSetupMode, setPinSetupMode] = useState('setup');
const [pinExists, setPinExists] = useState(hasPinSet());
const [pinStatus, setPinStatus] = useState('');

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

const handlePinSetupDone = () => {
  setShowPinSetup(false);
  setPinExists(true);
  setPinStatus(pinSetupMode === 'change' ? '✅ PIN 已更新' : '✅ PIN 已設定');
  setTimeout(() => setPinStatus(''), 2000);
};
```

### 5c. 在「雲端同步安全」卡片之後、「關於」卡片之前插入：

```jsx
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

{showPinSetup && (
  <PinSetup mode={pinSetupMode} onDone={handlePinSetupDone} onSkip={() => setShowPinSetup(false)} />
)}
```

---

## Step 6：修改 `src/styles/globals.css` 末尾新增

```css
/* ── PIN 鎖屏動畫 ── */
@keyframes pin-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(8px); }
}
.pin-shake { animation: pin-shake 0.5s ease-in-out; }

@keyframes pin-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pin-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.pin-key:hover {
  background: var(--blue) !important;
  color: #fff !important;
  border-color: var(--blue) !important;
  box-shadow: 2px 2px 0px 0px #2d2d2d !important;
  transform: translate(2px, 2px);
}
.pin-key:active {
  box-shadow: none !important;
  transform: translate(4px, 4px);
}
```

---

## Step 7：構建驗證 + 部署

```bash
npm run build
git add -A
git commit -m "feat: 新增 PIN 密碼鎖功能"
git push origin master
npx gh-pages -d dist
```

驗證清單：
- [ ] 構建無錯誤
- [ ] 沒設 PIN 時直接進入主頁（無變化）
- [ ] 設定 → 點「✨ 設定 PIN」→ 輸入 6 位 → 確認 → 成功
- [ ] 重新整理 → 出現鎖屏（寶寶 emoji + 數字鍵盤）
- [ ] 輸入錯誤 PIN → 搖晃 + 哭臉
- [ ] 輸入正確 PIN → 進入主頁
- [ ] 7 天內重新整理 → 不再要求 PIN
- [ ] 設定頁「🔁 修改 PIN」→ 能設新 PIN
- [ ] 設定頁「🗑️ 移除 PIN」→ 鎖屏消失
- [ ] 鍵盤數字鍵 + Backspace 可用
