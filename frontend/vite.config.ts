import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep app code separate from heavy third-party libs for better caching and faster initial load.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'vendor-reports'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('zustand')) return 'vendor-zustand'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'

          return undefined
        },
      },
    },
  },
})
