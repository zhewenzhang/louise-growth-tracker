import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 構建時注入版本資訊
const buildTime = new Date().toISOString();
const version = `1.0.${Date.now()}`;

export default defineConfig({
  base: '/louise-growth-tracker/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    cssMinify: true,
  },
})
