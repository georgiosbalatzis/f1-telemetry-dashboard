import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const env = loadEnv('production', '.', '')
// Keep the standalone Pages target; aggregation sets APP_BASE=/telemetry/.
const base = env.APP_BASE || '/f1-telemetry-dashboard/'
// Canonical/OG URL: the f1-stories.gr build names the primary domain; the standalone build names its own page,
// which is where it is served until the github.io site hands over to f1-stories.gr/telemetry/.
const canonical = (env.VITE_F1STORIES_BUILD === 'true' ? 'https://f1-stories.gr' : 'https://georgiosbalatzis.github.io') + base

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  plugins: [
    tailwindcss(),
    react(),
    { name: 'canonical-url', transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%CANONICAL_URL%', canonical) } },
  ],
  base,
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
