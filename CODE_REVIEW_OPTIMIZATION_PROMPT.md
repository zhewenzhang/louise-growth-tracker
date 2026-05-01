# Louise 成長記錄 - 代碼審查與優化 Prompt

> 📋 基於全面代碼審查報告  
> 🔴 4 個關鍵問題，需立即修復  
> 🟠 7 個高優先問題  
> 🟡 8 個中優先問題  
> 🟢 4 個低優先問題  
> ⏱️ 預期修復時間：2-3 週

---

## 給 Qwen Code 的優化 Prompt

### 版本 A：完整詳細版（推薦）

```
我有一個 Louise 成長記錄應用（React 18 + Vite + Supabase），經過全面代碼審查發現了 23 個問題。
我需要你幫我按優先級修復這些問題。

【關鍵問題 - 必須立即修復】

1️⃣ 敏感信息洩露（CRITICAL）
問題：.env 文件中的 Supabase URL 和密鑰已提交到版本控制
文件：.env
當前內容：
  VITE_SUPABASE_URL=https://uwvlduprxppwdkjkvwby.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGc...（完整密鑰）

修復步驟：
1. 立即從 Git 歷史中刪除 .env 文件（git filter-branch 或 git filter-repo）
2. 確保 .gitignore 包含 .env 和 .env.local
3. 創建 .env.example 模板（不包含真實值）
4. 在 Supabase 控制面板重新生成密鑰
5. 使用環境變量管理敏感信息（GitHub Secrets、Vercel 環境變量）

代碼示例：
```javascript
// .env.example（上傳到 Git）
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

// vite.config.js（驗證環境變量）
export default defineConfig({
  plugins: [react()],
  define: {
    __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __SUPABASE_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
  }
});
```

---

2️⃣ 文件編碼問題（CRITICAL）
問題：Daily.jsx、Health.jsx、Memories.jsx 使用非 UTF-8 編碼，導致中文亂碼
文件：
  - src/components/pages/Daily.jsx
  - src/components/pages/Health.jsx
  - src/components/pages/Memories.jsx

症狀：文件中的中文顯示為亂碼，構建失敗

修復步驟：
1. 將所有 .jsx 文件轉換為 UTF-8 編碼
2. 在 VS Code 中設置 files.encoding: utf8
3. 使用轉換工具批量處理

修復指令（Windows）：
\`\`\`powershell
Get-ChildItem -Path "src" -Recurse -Include "*.jsx","*.js" | ForEach-Object {
  $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::GetEncoding('GB2312'))
  [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.Encoding]::UTF8)
}
\`\`\`

驗證：所有文件應該正確顯示中文，無亂碼

---

3️⃣ SyncService 不安全的批量刪除（CRITICAL）
問題：syncService.js 中無條件刪除所有舊記錄，導致數據丟失風險
文件：src/services/syncService.js（第 70-75 行）

當前代碼：
\`\`\`javascript
const { error: deleteError } = await supabase
  .from('growth_records')
  .delete()
  .eq('user_id', 'default_user');  // ❌ 無條件刪除
\`\`\`

修復方案：改用 upsert 替代刪除 + 插入

新代碼：
\`\`\`javascript
export const syncGrowthRecords = async (records) => {
  if (!supabase) return { success: false, reason: 'supabase_not_configured' };
  
  try {
    const recordsToSync = records.map(r => ({
      id: r.id,
      user_id: 'default_user',
      record_date: r.date,
      type: r.type,
      value: r.value,
      unit: r.unit,
      note: r.note,
      created_at: r.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('growth_records')
      .upsert(recordsToSync, { onConflict: 'id' });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('同步成長記錄失敗:', error);
    return { success: false, error };
  }
};
\`\`\`

驗證：
- 同步前後記錄數相同
- 可以安全地反覆執行同步
- 沒有數據丟失

---

4️⃣ 生產環境缺少環境變量驗證（CRITICAL）
問題：vite.config.js 沒有驗證必要的環境變量，導致構建時無法檢測缺失的配置

修復步驟：
1. 在 vite.config.js 中添加環境驗證
2. 創建 validateEnv.js 工具函數
3. 在應用啟動時檢查環境變量

代碼：
\`\`\`javascript
// src/utils/validateEnv.js
export const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(
    key => !import.meta.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(
      \`缺少必要的環境變量: \${missing.join(', ')}\`
    );
  }
};

// src/main.jsx
import { validateEnvironment } from './utils/validateEnv';

try {
  validateEnvironment();
} catch (error) {
  console.error(error.message);
  document.body.innerHTML = \`<h1>\${error.message}</h1>\`;
  throw error;
}
\`\`\`

---

【高優先級問題 - 本週修復】

5️⃣ AppContext 循環依賴和過度同步
問題：useEffect 監聽同一數據變化，導致無限循環和過度 API 調用
文件：src/context/AppContext.jsx（第 59-71 行）

修復方案：使用防抖和標記來阻止無限循環

代碼：
\`\`\`javascript
useEffect(() => {
  let isMounted = true;
  let syncTimeout;

  const handleSync = async () => {
    if (!isMounted) return;
    
    if (user.name && user.birthDate) {
      // 嘗試同步
      const result = await syncUserData(user);
      if (!result.success) {
        console.warn('用戶數據同步失敗');
      }
    }
  };

  // 防抖 1 秒，避免頻繁同步
  syncTimeout = setTimeout(() => {
    handleSync();
  }, 1000);

  return () => {
    isMounted = false;
    clearTimeout(syncTimeout);
  };
}, [user]);  // 保持依賴正確
\`\`\`

---

6️⃣ LocalStorage 敏感數據未加密
問題：user、letters 等敏感信息以明文形式存儲在 localStorage
文件：src/context/AppContext.jsx、src/hooks/useLocalStorage.js

修復方案：實現加密存儲

新工具：
\`\`\`javascript
// src/hooks/useSecureLocalStorage.js
import crypto from 'crypto-js';

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'dev-key-change-in-production';

export const useSecureLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const decrypted = crypto.AES.decrypt(item, ENCRYPTION_KEY)
        .toString(crypto.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(\`讀取加密 localStorage 失敗 [\${key}]\`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const encrypted = crypto.AES.encrypt(
        JSON.stringify(valueToStore), 
        ENCRYPTION_KEY
      ).toString();
      window.localStorage.setItem(key, encrypted);
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(\`設置加密 localStorage 失敗 [\${key}]\`, error);
    }
  };

  return [storedValue, setValue];
};
\`\`\`

在 AppContext.jsx 中將 useLocalStorage 替換為 useSecureLocalStorage：
\`\`\`javascript
// 原來：
const [user, setUser] = useLocalStorage('louise_user', {...});

// 改為：
const [user, setUser] = useSecureLocalStorage('louise_user', {...});
\`\`\`

安裝加密庫：
\`\`\`bash
npm install crypto-js
npm install -D @types/crypto-js
\`\`\`

---

7️⃣ 缺少輸入驗證和清理
問題：QuickRecord.jsx、表單輸入沒有驗證，易導致 XSS 或無效數據
文件：src/components/pages/QuickRecord.jsx

修復方案：創建驗證工具

新工具：
\`\`\`javascript
// src/utils/validators.js
export const sanitizeInput = (input, maxLength = 500) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '');  // 移除危險字符
};

export const validateGrowthRecord = (data) => {
  const errors = {};
  
  // 驗證日期
  if (!data.date || !/^\d{4}-\d{2}-\d{2}\$/.test(data.date)) {
    errors.date = '無效的日期格式 (YYYY-MM-DD)';
  }
  
  // 驗證數值
  const value = parseFloat(data.value);
  if (isNaN(value) || value <= 0) {
    errors.value = '必須是正數';
  } else if (value > 9999) {
    errors.value = '數值過大';
  }
  
  // 驗證備註
  if (data.note && data.note.length > 500) {
    errors.note = '備註不能超過 500 字符';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateDate = (dateStr, birthDate) => {
  const date = new Date(dateStr);
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (date < birth) {
    return { valid: false, error: '日期不能早於出生日期' };
  }
  if (date > today) {
    return { valid: false, error: '日期不能是未來日期' };
  }
  return { valid: true };
};
\`\`\`

在 QuickRecord.jsx 中使用驗證：
\`\`\`javascript
const handleSave = () => {
  const validation = validateGrowthRecord(formData);
  
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  const dateValidation = validateDate(formData.date, user.birthDate);
  if (!dateValidation.valid) {
    setErrors({ date: dateValidation.error });
    return;
  }
  
  // 清理數據後保存
  const newRecord = {
    id: Date.now().toString(),
    date: formData.date,
    type: type,
    value: parseFloat(formData.value),
    unit: units[type],
    note: sanitizeInput(formData.note)
  };
  
  // 保存邏輯...
};
\`\`\`

---

8️⃣ ErrorBoundary 不完整
問題：錯誤只記錄，沒有監測服務集成，重新加載會丟失狀態
文件：src/components/ErrorBoundary.jsx

修復方案：增強錯誤處理

新代碼：
\`\`\`javascript
// src/services/errorReporting.js
export const reportError = (error, context) => {
  const errorReport = {
    message: error.toString(),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // 記錄到本地存儲用於調試
  const errorLog = JSON.parse(
    localStorage.getItem('error_log') || '[]'
  );
  errorLog.push(errorReport);
  localStorage.setItem(
    'error_log', 
    JSON.stringify(errorLog.slice(-20))  // 只保存最後 20 個
  );
  
  // 如果集成 Sentry
  if (window.Sentry) {
    window.Sentry.captureException(error, { 
      contexts: context 
    });
  }
  
  // 可以發送到自定義監測服務
  // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
};

// src/components/ErrorBoundary.jsx
import { reportError } from '../services/errorReporting';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: null  // 用於用戶報告參考
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString();
    
    reportError(error, {
      react: errorInfo,
      errorId
    });
    
    this.setState({ errorId });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-2xl mb-2">😔 應用出錯了</p>
          <p className="text-white/50 mb-4">{this.state.error?.message}</p>
          {this.state.errorId && (
            <p className="text-sm text-white/30 mb-4">
              錯誤ID: {this.state.errorId}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="lg px-6 py-2 text-rose hover:bg-white/10"
            >
              刷新頁面
            </button>
            <button
              onClick={() => {
                const errorLog = localStorage.getItem('error_log');
                console.log('錯誤日誌:', errorLog);
                alert('錯誤日誌已輸出到控制台');
              }}
              className="lg px-6 py-2 text-white/50 hover:bg-white/10"
            >
              查看日誌
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
\`\`\`

---

9️⃣ 缺少加載狀態管理
問題：同步操作沒有加載指示器，用戶不知道發生了什麼
文件：src/context/AppContext.jsx

修復方案：添加加載狀態

代碼：
\`\`\`javascript
export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setSyncError(null);
        
        // 檢查 Supabase 連接
        if (isSupabaseAvailable()) {
          const remoteUser = await loadUserData();
          if (remoteUser && !user.name) {
            setUser(remoteUser);
          }
          
          const remoteRecords = await loadGrowthRecords();
          if (remoteRecords.length > 0 && growthRecords.length === 0) {
            setGrowthRecords(remoteRecords);
          }
        }
      } catch (error) {
        setSyncError(error.message);
        console.error('初始化失敗:', error);
      } finally {
        setIsLoading(false);
        setLastSyncTime(new Date());
      }
    };
    
    initializeApp();
  }, []);
  
  return (
    <AppContext.Provider value={{
      // ... 其他值
      isLoading,
      syncError,
      lastSyncTime
    }}>
      {children}
    </AppContext.Provider>
  );
};
\`\`\`

在 Home 頁面顯示加載狀態：
\`\`\`javascript
const { isLoading, syncError, lastSyncTime } = useApp();

return (
  <div>
    {isLoading && (
      <div className="p-4 text-center text-white/60">
        <p>正在同步數據...</p>
      </div>
    )}
    
    {syncError && (
      <div className="p-4 bg-red-500/20 text-red-200 rounded">
        <p>同步失敗: {syncError}</p>
      </div>
    )}
    
    {lastSyncTime && (
      <p className="text-xs text-white/40">
        最後同步: {lastSyncTime.toLocaleTimeString()}
      </p>
    )}
  </div>
);
\`\`\`

---

🔟 缺少導出數據的加密和安全控制
問題：導出功能直接下載明文 JSON，包含所有敏感信息
文件：src/context/AppContext.jsx（第 107-121 行）

修復方案：添加加密導出

新代碼：
\`\`\`javascript
const exportData = async (encrypted = false) => {
  const allData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user,
    growthRecords,
    feedingRecords,
    sleepRecords,
    healthRecords,
    vaccineRecords,
    milestones,
    letters
  };

  let dataStr = JSON.stringify(allData, null, 2);
  
  if (encrypted) {
    const password = prompt('🔐 請輸入備份密碼（至少 8 字符）:');
    
    if (!password) {
      alert('已取消備份');
      return;
    }
    
    if (password.length < 8) {
      alert('❌ 密碼必須至少 8 字符');
      return;
    }
    
    // 加密數據
    try {
      dataStr = crypto.AES.encrypt(dataStr, password).toString();
    } catch (error) {
      alert('❌ 加密失敗: ' + error.message);
      return;
    }
  }

  // 下載文件
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = \`louise-backup-\${encrypted ? 'encrypted-' : ''}\${
    new Date().toISOString().split('T')[0]
  }.json\`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  alert(\`✅ 備份成功 (\${encrypted ? '已加密' : '未加密'})\`);
};

// 在 Home.jsx 中提供兩個導出選項
<div className="flex gap-2">
  <button onClick={() => exportData(false)}>
    💾 導出備份（未加密）
  </button>
  <button onClick={() => exportData(true)}>
    🔐 導出備份（加密）
  </button>
</div>
\`\`\`

---

【中優先級問題 - 本月修復】

1️⃣1️⃣ 大列表性能優化
問題：超過 100 條記錄時，列表渲染性能下降
文件：Growth.jsx、Daily.jsx、Health.jsx

修復方案：使用虛擬化列表

安裝：
\`\`\`bash
npm install react-window
\`\`\`

實現：
\`\`\`javascript
import { FixedSizeList } from 'react-window';

const RecordsList = ({ records }) => {
  const Row = ({ index, style }) => (
    <div style={style} className="glass-card p-3 mb-2">
      {/* 記錄項內容 */}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={records.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
\`\`\`

---

1️⃣2️⃣ 添加 ARIA 屬性和無障礙支持
問題：許多交互元素缺少 ARIA 屬性
文件：多個組件

修復方案：
\`\`\`javascript
// Navigation.jsx - 添加 aria-label
<button
  onClick={() => setCurrentPage('home')}
  aria-label="首頁"
  aria-current={currentPage === 'home' ? 'page' : undefined}
  className="..."
>
  🏠
</button>

// FAB.jsx - 添加完整 ARIA
<button
  onClick={() => setIsOpen(!isOpen)}
  aria-label="快速記錄"
  aria-expanded={isOpen}
  className="..."
>
  ➕
</button>

// 表單輸入 - 添加關聯標籤
<label htmlFor="baby-name">寶寶名字</label>
<input id="baby-name" type="text" required />
\`\`\`

---

1️⃣3️⃣ 添加單元測試
問題：沒有測試覆蓋

修復方案：
\`\`\`bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
\`\`\`

創建測試：
\`\`\`javascript
// src/utils/__tests__/whoData.test.js
import { describe, it, expect } from 'vitest';
import { getPercentile } from '../whoData';

describe('WHO 數據', () => {
  it('應該計算正確的百分位', () => {
    const result = getPercentile('weight', 6, 7.5);
    expect(result).toBeLessThanOrEqual(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// src/utils/__tests__/validators.test.js
import { describe, it, expect } from 'vitest';
import { validateGrowthRecord } from '../validators';

describe('驗證器', () => {
  it('應該驗證有效的成長記錄', () => {
    const result = validateGrowthRecord({
      date: '2026-05-01',
      value: '7.5',
      note: 'Test'
    });
    expect(result.isValid).toBe(true);
  });
  
  it('應該拒絕無效的日期', () => {
    const result = validateGrowthRecord({
      date: 'invalid-date',
      value: '7.5'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });
});
\`\`\`

在 package.json 添加：
\`\`\`json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
\`\`\`

---

1️⃣4️⃣ 添加網絡連接檢查
問題：缺少網絡可用性檢查

修復方案：
\`\`\`javascript
// src/utils/networkStatus.js
export const isOnline = () => navigator.onLine;

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// 在 syncService.js 中使用
export const syncUserData = async (user) => {
  if (!navigator.onLine) {
    console.warn('📴 離線模式 - 無法同步用戶數據');
    return { success: false, reason: 'offline' };
  }
  
  // ... 同步邏輯
};

// 在應用中顯示離線狀態
const isOnline = useNetworkStatus();

{!isOnline && (
  <div className="p-2 bg-yellow-500/20 text-yellow-200 text-sm text-center">
    📴 你現在處於離線模式。數據將在恢復連接時同步。
  </div>
)}
\`\`\`

---

1️⃣5️⃣ 優化圖表重新渲染性能
問題：Chart.js 圖表可能頻繁重新渲染

修復方案：
\`\`\`javascript
// GrowthChart.jsx
const monthLabels = useMemo(
  () => Array.from({ length: 25 }, (_, i) => \`\${i}月\`),
  []  // 空依賴數組 - 只創建一次
);

const chartData = useMemo(() => ({
  labels: monthLabels,
  datasets: [...]
}), [data, whoData, label, color, monthLabels]);

const options = useMemo(() => ({
  responsive: true,
  maintainAspectRatio: true,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  // ...
}), [unit]);

// 使用 React.memo 包裝組件
export default React.memo(GrowthChart);
\`\`\`

---

1️⃣6️⃣ 添加生產環境特定配置
問題：開發和生產環境沒有區分

修復方案：
\`\`\`javascript
// src/config/environment.js
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

export const apiConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  enableLogging: isDevelopment,
  enableErrorReporting: isProduction,
};

// src/utils/logger.js
export const log = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const error = (...args) => {
  console.error(...args);
  if (isProduction) {
    reportErrorToSentry(...args);
  }
};
\`\`\`

---

1️⃣7️⃣ 添加 ESLint 和 Prettier
問題：代碼風格不一致

安裝：
\`\`\`bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks prettier
\`\`\`

配置：
\`\`\`javascript
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
\`\`\`

在 package.json 添加：
\`\`\`json
{
  "scripts": {
    "lint": "eslint src --ext .jsx,.js",
    "lint:fix": "eslint src --ext .jsx,.js --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css}\""
  }
}
\`\`\`

---

【執行優先級時間表】

## Week 1-2：關鍵問題（必須完成）
- [ ] 清除敏感信息並重新生成密鑰
- [ ] 修復文件編碼問題
- [ ] 修復 syncService 不安全刪除
- [ ] 添加環境變量驗證

## Week 3：高優先級問題
- [ ] 修復 AppContext 循環依賴
- [ ] 實現加密存儲
- [ ] 添加輸入驗證
- [ ] 增強 ErrorBoundary
- [ ] 添加加載狀態
- [ ] 改進導出安全性

## Week 4+：中優先級問題
- [ ] 大列表虛擬化
- [ ] 添加 ARIA 屬性
- [ ] 寫基本測試
- [ ] 網絡狀態檢查
- [ ] 優化圖表性能
- [ ] 添加 ESLint/Prettier

---

【驗證步驟】

完成後，請驗證：

安全性檢查：
\`\`\`
- [ ] .env 文件不在 Git 中
- [ ] localStorage 中的敏感數據已加密
- [ ] 導出的備份可以加密
- [ ] 沒有 console.log 輸出敏感信息
\`\`\`

功能檢查：
\`\`\`
- [ ] 應用正常啟動（無缺失環境變量錯誤）
- [ ] 數據同步不會導致重複或丟失
- [ ] 表單輸入被驗證和清理
- [ ] 錯誤有適當的日誌記錄
- [ ] 大數據集（1000+ 記錄）性能良好
\`\`\`

---

執行這個 Prompt 時，請按順序完成關鍵問題，然後逐週推進其他問題。有任何問題隨時告訴我！
```

---

### 版本 B：簡化版（快速執行）

```
Louise 應用代碼審查發現 23 個問題，需要修復。

【4 個關鍵問題 - 立即修復】
1. .env 文件敏感信息洩露 → 清除 Git 歷史並重新生成密鑰
2. Daily.jsx/Health.jsx/Memories.jsx 文件編碼亂碼 → 轉換為 UTF-8
3. syncService 不安全的批量刪除 → 改用 upsert
4. 生產環境缺少環境變量驗證 → 添加驗證邏輯

【7 個高優先級問題 - 本週修復】
5. AppContext 循環依賴 → 添加防抖
6. localStorage 未加密敏感數據 → 使用 crypto-js 加密
7. 缺少輸入驗證 → 創建 validators.js
8. ErrorBoundary 不完整 → 集成錯誤監測
9. 缺少加載狀態 → 在 AppContext 添加 isLoading
10. 導出數據未加密 → 提供加密導出選項
11. 缺少 Supabase RLS 設置 → 配置行級安全

【8 個中優先級問題 - 本月修復】
- 大列表虛擬化（react-window）
- 添加 ARIA 屬性（無障礙）
- 單元測試（vitest）
- 網絡連接檢查
- 圖表重新渲染優化
- 生產環境配置
- ESLint + Prettier
- README 文檔

詳細實施方案見文件。按優先級依次執行，有問題隨時告訴我。
```

---

## 📊 問題統計與優先級

```
┌─────────────────────────────┐
│  代碼審查結果統計            │
├─────────────────────────────┤
│ 🔴 關鍵問題：4 個（必須）    │
│ 🟠 高優先級：7 個（本週）    │
│ 🟡 中優先級：8 個（本月）    │
│ 🟢 低優先級：4 個（之後）    │
│ ────────────────────────     │
│ 總計：23 個問題              │
└─────────────────────────────┘
```

---

## 🎯 立即行動清單

複製完整版 Prompt 給 Qwen Code：

```bash
# 步驟 1：清除敏感信息
git filter-branch --tree-filter 'rm -f .env' HEAD
git push origin --force-with-lease

# 步驟 2：轉換文件編碼
# （按照 Prompt 中的 PowerShell 指令執行）

# 步驟 3：更新 syncService.js
# （按照 Prompt 中的代碼替換）

# 步驟 4：添加環境驗證
# （創建 validateEnv.js）

# 之後逐週推進其他問題
```

---

**準備好了嗎？複製 Prompt 給 Qwen Code，開始修復！** 🚀

