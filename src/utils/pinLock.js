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
