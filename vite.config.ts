import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'
import path from 'path'

const __dirname = import.meta.dirname

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/inertia.tsx',
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  server: {
    port: 3000,
    allowedHosts: true,
  },
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash]-tw2.js',
        chunkFileNames: 'assets/[name]-[hash]-tw2.js',
        assetFileNames: 'assets/[name]-[hash]-tw2.[ext]',
      },
    },
  },
})
