import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dashboardBase = process.env.APP_BASE || '/f1-telemetry-dashboard/'

export default defineConfig({
  plugins: [react()],
  base: `${dashboardBase.replace(/\/$/, '')}/interactive/`,
  build: {
    target: ['es2022', 'safari16.4', 'chrome111', 'edge111', 'firefox128'],
    outDir: 'dist-interactive',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: 'src/embeds/interactive-entry.tsx',
      output: {
        entryFileNames: 'assets/interactive-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('/node_modules')) return undefined
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) return 'react-vendor'
          return 'charts'
        },
      },
    },
  },
})
