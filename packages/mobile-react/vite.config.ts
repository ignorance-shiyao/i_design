import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@i-design/common': fileURLToPath(new URL('../common/src', import.meta.url)),
      '@i-design/react': fileURLToPath(new URL('../react/src', import.meta.url))
    }
  },
  build: { outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)), emptyOutDir: true }
})
