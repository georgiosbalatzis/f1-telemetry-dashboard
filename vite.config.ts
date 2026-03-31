import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  // CRITICAL for GitHub Pages: assets must be loaded relative to /f1-telemetry-dashboard/
  base: '/f1-telemetry-dashboard/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (
            id.includes('/node_modules/recharts/')
            || id.includes('/node_modules/recharts-scale/')
            || id.includes('/node_modules/victory-vendor/')
            || id.includes('/node_modules/react-smooth/')
          ) {
            return 'charts'
          }

          if (
            id.includes('/node_modules/react/')
            || id.includes('/node_modules/react-dom/')
            || id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons'
          }

          return 'vendor'
        },
      },
    },
  },
})
