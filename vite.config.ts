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
          // Recharts + d3 → vendor-charts (~440KB, cached separately)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }
          // Lucide icons → vendor-icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // React core → vendor-react
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})
