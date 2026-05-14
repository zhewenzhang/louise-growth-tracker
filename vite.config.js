import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/louise-growth-tracker/',
  plugins: [react()],
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
