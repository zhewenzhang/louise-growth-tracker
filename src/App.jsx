import React, { useState } from 'react';
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

  const handleNavigate = (pageId, params = {}) => {
    setCurrentPage(pageId);
    setPageParams(params);
  };

  const ActivePage = allPages.find(p => p.id === currentPage)?.component || Dashboard;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      {/* Page content — scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '80px' }}>
        <ActivePage onNavigate={handleNavigate} {...pageParams} />
      </div>

      {/* Bottom navigation — hand-drawn style */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: '#fff',
        borderTop: '3px solid var(--fg)',
        boxShadow: '0 -4px 0px 0px #2d2d2d',
        borderRadius: '255px 25px 225px 25px / 25px 225px 25px 255px',
      }}>
        <div className="flex items-center justify-around" style={{ height: '72px', padding: '0 8px' }}>
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
                  fontSize: '11px',
                  transition: 'all 0.15s ease',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 4, borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                    background: 'var(--accent)',
                  }} />
                )}
                <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 3 : 2} />
                <span style={{ marginTop: 2 }}>{label}</span>
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
