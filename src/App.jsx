import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import ToastProvider from './context/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import Home from './components/pages/Home';
import Growth from './components/pages/Growth';
import Daily from './components/pages/Daily';
import Health from './components/pages/Health';
import Memories from './components/pages/Memories';
import Navigation from './components/Navigation';
import FAB from './components/FAB';
import QuickRecord from './components/pages/QuickRecord';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [quickRecordType, setQuickRecordType] = useState(null);
  const { isDarkMode, user, setUser } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    // Check if user needs onboarding
    const needsOnboarding = !user.name || !user.birthDate || 
      (user.name === 'Louise' && user.birthDate === '2026-04-26');
    
    if (needsOnboarding) {
      // Clear old defaults if present
      if (user.name === 'Louise' && user.birthDate === '2026-04-26') {
        // Don't clear here - let onboarding handle it
      }
      setShowOnboarding(true);
    }
    setInitialized(true);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const pages = {
    home: <Home onOpenQuickRecord={setQuickRecordType} />,
    growth: <Growth />,
    daily: <Daily onOpenQuickRecord={setQuickRecordType} />,
    health: <Health onOpenQuickRecord={setQuickRecordType} />,
    memories: <Memories onOpenQuickRecord={setQuickRecordType} />
  };

  if (!initialized) return null;

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <div
          className="flex flex-col h-screen transition-colors duration-300"
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, #1e0d14 0%, #2d1420 100%)'
              : 'linear-gradient(135deg, #f5f1ed 0%, #ece8e3 100%)'
          }}
        >
          {pages[currentPage]}

          <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <FAB onSelect={setQuickRecordType} />

          {quickRecordType && (
            <QuickRecord type={quickRecordType} onClose={() => setQuickRecordType(null)} />
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
