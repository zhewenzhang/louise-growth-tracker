import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Heart, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { AppProvider } from './context/AppContext.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import Growth from './components/pages/Growth';
import Health from './components/pages/Health';
import Memories from './components/pages/Memories';
import Settings from './components/pages/Settings';
import LockScreen from './components/LockScreen';
import { hasPinSet, isUnlocked } from './utils/pinLock';

const navPages = [
  { id: 'home', label: '首頁', icon: Home },
  { id: 'growth', label: '成長', icon: TrendingUp },
  { id: 'health', label: '健康', icon: Heart },
  { id: 'memories', label: '回憶', icon: BookOpen },
];

const allPages = [
  { id: 'home', label: '首頁', icon: Home, component: Dashboard },
  { id: 'growth', label: '成長', icon: TrendingUp, component: Growth },
  { id: 'health', label: '健康', icon: Heart, component: Health },
  { id: 'memories', label: '回憶', icon: BookOpen, component: Memories },
  { id: 'settings', label: '設定', icon: SettingsIcon, component: Settings },
];

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigate = (pageId, params = {}) => {
    setCurrentPage(pageId);
    setPageParams(params);
  };

  const ActivePage = allPages.find(p => p.id === currentPage)?.component || Dashboard;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      {/* 📡 離線/連線狀態提示 */}
      {!isOnline && (
        <div style={{
          background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '6px 12px',
          textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#92400e',
          zIndex: 50, flexShrink: 0
        }}>
          📡 離線模式中（記錄將安全存於手機，恢復網路後自動同步）
        </div>
      )}

      {showOnlineToast && (
        <div style={{
          background: '#d1fae5', borderBottom: '2px solid #10b981', padding: '6px 12px',
          textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#065f46',
          zIndex: 50, flexShrink: 0
        }}>
          ✅ 已恢復網路連線，雲端同步中
        </div>
      )}

      {/* Page content — scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(94px + env(safe-area-inset-bottom, 0px))' }}>
        <ActivePage onNavigate={handleNavigate} {...pageParams} />
      </div>

      {/* Bottom navigation — hand-drawn style with Safe Area */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--card-bg)',
        borderTop: '3px solid var(--fg)',
        boxShadow: '0 -4px 0px 0px var(--fg)',
        borderRadius: '255px 25px 225px 25px / 25px 225px 25px 255px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
      }}>
        <div className="flex items-center justify-around" style={{ height: '66px', padding: '0 4px' }}>
          {navPages.map(({ id, label, icon: Icon }) => {
            const isActive = id === currentPage;
            return (
              <button
                key={id}
                onClick={() => { setCurrentPage(id); setPageParams({}); }}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--accent)' : 'var(--fg)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '0.75rem',
                  lineHeight: '1.2',
                  padding: '4px 0',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} style={{ marginBottom: '2px', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: '2px', width: '16px', height: '3px',
                    backgroundColor: 'var(--accent)', borderRadius: '2px',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

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
