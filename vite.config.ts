import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  // CRITICAL for GitHub Pages: assets must be loaded relative to /f1-telemetry-dashboard/
  base: '/f1-telemetry-dashboard/',
})
