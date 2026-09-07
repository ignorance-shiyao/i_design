import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  base: './',
  plugins: [vue2()],
  resolve: {
    alias: {
      // 本包做了嵌套安装，vue 在此解析到 2.7；根目录的 vue 仍是 3.x，互不干扰
      '@i-design/common': fileURLToPath(new URL('../common/src', import.meta.url))
    }
  },
  build: { outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)), emptyOutDir: true }
})
