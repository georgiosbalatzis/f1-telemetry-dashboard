import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  plugins: [tailwindcss(), react()],
  // CRITICAL for GitHub Pages: assets must be loaded relative to /f1-telemetry-dashboard/
  base: '/f1-telemetry-dashboard/',
  build: {
    // Tailwind v4's floor (Safari 16.4, Chrome/Edge 111, Firefox 128); the CSS also relies on color-mix(), :has() and aspect-ratio.
    target: ['es2022', 'safari16.4', 'chrome111', 'edge111', 'firefox128'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

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

          // Everything else in node_modules is Recharts and its dependencies (lodash, d3-*, ...): one lazy 'charts' chunk.
          return 'charts'
        },
      },
    },
  },
})
