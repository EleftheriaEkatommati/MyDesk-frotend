import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // This plugin automatically generates your route tree
    tanstackRouter(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Since you have @types/node installed, this will work perfectly
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Highly recommended for virtual environments (WSL/VM)
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // Essential if you notice HMR isn't updating when you save files
      usePolling: true,
    },
  },
})
