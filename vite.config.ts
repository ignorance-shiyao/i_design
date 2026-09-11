import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径：GitHub Pages 部署在 /<repo>/ 子路径下也能正确取到资源
  base: './',
  plugins: [vue()],
  // 文档站只扫描自己的入口；各框架 demo 由各自的 Vite 配置构建。
  optimizeDeps: { entries: ['index.html'] },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@i-design/common': fileURLToPath(new URL('./packages/common/src', import.meta.url))
    }
  }
})
