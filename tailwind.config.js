/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 主色層級 - 玫瑰粉系 */
        rose: '#e8909a',           // 主色
        'rose-light': '#f0b8c0',   // 淺色版本
        'rose-deep': '#c06878',    // 深色版本

        /* 強調色 */
        'accent-warm': '#f5a85c',  // 溫暖強調
        'accent-cool': '#7acaca',  // 冷色強調

        /* 其他原有顏色 */
        peach: '#e8a87c',
        teal: '#7acaca',
        mauve: '#b09acc',
        sage: '#8ac8a0',
        amber: '#e8c880',
        sky: '#80b8e0',
        coral: '#e89090',

        /* 背景色 */
        'bg-dark': '#1e0d14',
        'bg-light': '#f5f1ed',
        'bg-secondary': '#2d1420',
        'bg-tertiary': '#3a1f2d',
      },
      spacing: {
        /* 8px 基數系統 */
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      backdropBlur: {
        glass: '20px',
        'glass-sm': '12px',
        'glass-nav': '32px',
      },
      keyframes: {
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideInUp: 'slideInUp 0.3s ease-out',
        slideOut: 'slideOut 0.2s ease-in',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
      screens: {
        xs: '320px',
        sm: '480px',
        md: '768px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
}
