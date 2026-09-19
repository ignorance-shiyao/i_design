import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { FIXED_WORKLOADS, judgeFixed, measureFixed } from './check-perf.mjs'

test('固定负载的真实浏览器故障注入', { timeout: 120000 }, async () => {
  const base = 'http://localhost:5186'
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5186', '--strictPort'], { stdio: 'ignore' })
  let browser
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error('性能夹具服务启动失败')
      try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.ok(ready, '性能夹具服务未就绪')
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
    for (const budget of FIXED_WORKLOADS) {
      for (const fault of ['none', 'missing', 'duplicate', 'bloat']) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
        const page = await context.newPage()
        let changed = false
        if (fault !== 'none') {
          await page.route('**/scripts/perf/fixture.mjs*', async (route) => {
            const response = await route.fetch()
            const source = await response.text()
            const body = fault === 'bloat'
              ? source.replace('document.body.dataset.ready', `for (let i = 0; i < 31000; i++) document.querySelector('#workload').append(document.createElement('span')); document.body.dataset.ready`)
              : source.replace('100 : 1000', fault === 'missing' ? '50 : 500' : '200 : 2000')
            changed = source !== body
            await route.fulfill({ response, body })
          })
        }
        const measurement = await measureFixed(page, base, budget)
        const problems = judgeFixed(budget, measurement)
        if (fault === 'none') assert.deepEqual(problems, [])
        else {
          assert.ok(changed, '必须确实改坏浏览器执行的夹具代码')
          assert.match(problems.join('\n'), fault === 'bloat' ? /固定负载.*超过/ : /应完整渲染/)
        }
        console.log(`${budget.name} ${fault}: ${JSON.stringify(measurement)} ${problems.join('; ')}`)
        await context.close()
      }
    }
  } finally {
    await browser?.close()
    server.kill()
  }
})
