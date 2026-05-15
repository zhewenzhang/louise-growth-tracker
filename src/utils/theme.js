// 主題管理工具
const THEME_KEY = 'louise_theme';

export const getTheme = () => {
  return localStorage.getItem(THEME_KEY) || 'light';
};

export const setTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};

export const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

// App 啟動時呼叫
export const initTheme = () => {
  applyTheme(getTheme());
};
