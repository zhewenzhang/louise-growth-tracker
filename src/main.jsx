import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initTheme } from './utils/theme';

// 初始化主題（在 React 渲染前，避免閃爍）
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 註冊 Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/louise-growth-tracker/sw.js').catch(
      (err) => console.warn('SW registration failed:', err)
    );
  });
}
