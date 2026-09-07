import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE_FILE=1 时把整站打进一个 HTML，用于发布可分享的在线预览页
const singleFile = process.env.SINGLE_FILE === '1'

export default defineConfig({
  base: './',
  build: singleFile ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : {},
  plugins: [vue(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
