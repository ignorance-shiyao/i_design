/**
 * 示例应用共用的 Vite 配置。
 *
 * 每个应用独立构建、独立启动：一个应用构建失败不该把其它几个一起拖下水，
 * 而门户与应用之间只靠相对路径互链——所以 base 用 './'，
 * 部署到任何子路径都能打开（G02 的验收条件之一）。
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export function exampleConfig(dir: string) {
  const at = (p: string) => fileURLToPath(new URL(p, dir))
  return defineConfig({
    base: './',
    plugins: [vue()],
    // 复用文档站的 favicon：不给的话浏览器会去要 /favicon.ico，
    // 每个示例页面的控制台里都躺着一条 404
    publicDir: at('../../public'),
    resolve: {
      alias: {
        // 仓库自身开发时一律走源码：指向 dist 的话，改了组件要先构建才看得见
        '@i-design/common': at('../../packages/common/src'),
        '@i-design/vue-next': at('../../packages/vue-next/src'),
        '@i-design/examples-shared': at('../shared/src'),
        '@i-design/examples-shell': at('../shell/src')
      }
    }
  })
}
