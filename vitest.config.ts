import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 仓库内测试直接读共享源码，不能依赖尚未执行 build:packages 的 dist 入口。
  resolve: {
    alias: { '@i-design/common': fileURLToPath(new URL('./packages/common/src/index.ts', import.meta.url)) }
  },
  test: {
    /*
     * 只跑各包源码里的测试。
     *
     * `scripts/` 下已经有一份用 node:test 写的目录回归测试（check:catalog 在跑它）。
     * 让 vitest 也去收那个文件的话，它会因为断言库不同而直接失败——
     * 不是那份测试有问题，是两套跑法撞在了一起。
     */
    include: ['packages/*/src/**/*.test.ts', 'src/**/*.test.ts', 'examples/*/src/**/*.test.ts']
  }
})
