import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ViteYaml from '@modyfi/vite-plugin-yaml'
import { resolve } from 'path'

import packageJson from './package.json'

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version)
  },
  plugins: [vue(), ViteYaml()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      external: [
        'electron',
        'electron-store',
        'better-sqlite3',
        '@the-andb/core',
        'mysql2',
        'path',
        'fs'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    exclude: [
      'electron',
      'electron-store',
      'better-sqlite3',
      '@andb/core',
      'mysql2'
    ]
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.unit.test.ts']
  }
})
