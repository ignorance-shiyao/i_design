/** H02 第一版：在独立构建产物上操作，断言业务结果。OA 尚未覆盖。 */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

export async function checkE2E({ only, mutate } = {}) {
  const root = resolve('dist-examples')
  const server = createServer(async (req, res) => {
    const name = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'))
    if (!name.startsWith(root + sep)) { res.writeHead(403).end(); return }
    try {
      const body = await readFile(name)
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(name)] || 'application/octet-stream')
      res.end(body)
    } catch { res.writeHead(404).end() }
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  let browser
  const results = []
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
    const base = `http://127.0.0.1:${server.address().port}`
    async function scenario(name, action) {
      if (only && only !== name) return
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
      page.setDefaultTimeout(10000)
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      if (mutate) await page.route('**/*.js', async route => {
        const response = await route.fetch()
        const original = await response.text()
        await route.fulfill({ response, body: mutate(original) })
      })
      try { await action(page, base); assert.deepEqual(errors, [], '浏览器运行错误'); results.push(name); console.log(`业务结果通过：${name}`) }
      catch (e) { throw new Error(`${name}: ${e.message}`, { cause: e }) }
      finally { await page.close() }
    }
    const button = (p, name) => p.getByRole('button', { name, exact: true })
    const text = async (p, selector, expected) => {
      await p.locator(selector).filter({ hasText: expected }).first().waitFor()
    }
    await scenario('erp', async (p, base) => {
      await p.goto(`${base}/erp/#/orders/new`)
      await p.getByRole('textbox').fill('回归客户')
      await button(p, '清空明细（演示 422）').click()
      await button(p, '提交').click()
      await text(p, '.create__error', '422')
      assert.equal(await p.getByRole('textbox').inputValue(), '回归客户', '422 丢失输入')
      assert.equal(await p.locator('.create__ok').count(), 0, '422 不应建单')
      await button(p, '加一行').click()
      await button(p, '提交').click()
      await text(p, '.create__ok', '已创建')
      const id = (await p.locator('.create__ok').innerText()).match(/已创建\s+([^。\s]+)。/)[1]
      await button(p, '提交').click()
      await text(p, '.create__ok', '重复提交')
      assert.ok((await p.locator('.create__ok').innerText()).includes(id), '幂等返回不同单号')
      await p.getByRole('link', { name: '去看详情' }).click()
      await text(p, '.i-detail-page__title', id)
      await text(p, '.i-detail-page__summary', '回归客户')
      await button(p, '已提交').click()
      await text(p, '.detail__notice', '已变为「已提交」')
      await button(p, '审批中').click()
      await text(p, '.detail__notice', '已变为「审批中」')
      assert.equal(await button(p, '已通过').isDisabled(), true, '自己的订单不能审批')
      await text(p, '.i-detail-page__reasons', '不能审批自己提交的单据')
      await button(p, '模拟他人修改（演示 409）').click()
      await p.locator('.i-detail-page__stale').waitFor()
      assert.equal(await button(p, '已发货').isDisabled(), true, '过期版本不能写入')
      await button(p, '刷新看最新').click()
      await button(p, '已发货').click()
      await text(p, '.detail__notice', '已变为「已发货」')
      await button(p, '已关闭').click()
      await text(p, '.detail__notice', '已变为「已关闭」')
      await p.getByRole('link', { name: '返回列表', exact: true }).click()
      await p.getByPlaceholder('单号或客户').fill('回归客户')
      await text(p, 'tbody tr', id)
      assert.equal(await p.locator('tbody tr').count(), 1, '重复提交生成了额外订单')
      await text(p, 'tbody tr', '已关闭')
    })
    for (const outcome of ['成功', '拒绝', '取消', '失败']) {
      for (const delivery of ['正常', '乱序', '断线重连']) {
        await scenario(`agent-${outcome}-${delivery}`, async (p, base) => {
          await p.goto(`${base}/agent-studio/`)
          await p.getByRole('radio', { name: outcome, exact: true }).click()
          await p.getByRole('radio', { name: delivery, exact: true }).click()
          async function finish() {
            if (outcome !== '取消') {
              await p.locator('.studio__waiting').waitFor()
              // 等一个投递周期，确认不会绕过人类确认自动产出。
              await p.waitForTimeout(600)
              assert.equal(await p.locator('.i-artifact-workspace').count(), 0, '确认前已产出')
              await p.getByRole('radio', { name: outcome === '拒绝' ? '先不发' : '同意发出', exact: true }).click()
              await p.locator('.i-approval').getByRole('button', { name: '确定', exact: true }).click()
            }
            await p.waitForFunction(() => {
              const m = document.querySelector('.studio__meta')?.textContent.match(/已投递\s*(\d+)\s*\/\s*(\d+)/)
              return m && Number(m[1]) > 0 && m[1] === m[2]
            })
            await text(p, '.studio__thread', '1580')
            assert.equal(await p.locator('.i-chat-tool').count(), 2, '工具结果应保留两条')
            const toolData = (await p.locator('.i-chat-tool__body').allTextContents()).join('\n')
            assert.match(toolData, /"available":\s*1580/, '库存工具结果丢失')
            assert.match(toolData, /"avgUnitPrice":\s*46\.5/, '成交工具结果丢失')
            if (outcome === '成功') {
              await text(p, '.i-artifact-workspace__preview', '月结 30 天')
              await button(p, 'v1').click()
              await text(p, '.i-artifact-workspace__preview', '货到付款')
              await button(p, 'v2').click()
            } else {
              assert.equal(await p.locator('.i-artifact-workspace').count(), 0, '非成功结局不应产出')
              if (outcome === '拒绝') await text(p, '.studio__decided', '否掉了')
              if (outcome === '取消') await text(p, '.studio__cancelled', '已取消')
              if (outcome === '失败') await text(p, '.studio__failed', '上游超时')
            }
            return p.locator('.studio__thread').innerText()
          }
          const first = await finish()
          await button(p, '重放这一局').click()
          assert.equal(await finish(), first, '重放业务结果不一致')
          if (outcome === '成功' && delivery === '乱序') {
            for (const width of [1440, 390, 320]) {
              await p.setViewportSize({ width, height: 1000 })
              const measured = await p.evaluate(() => ({
                width: innerWidth,
                overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
                paragraphEm: Math.max(0, ...Array.from(document.querySelectorAll('.studio p')).flatMap(el => {
                  const range = document.createRange()
                  range.selectNodeContents(el)
                  return Array.from(range.getClientRects()).map(rect => rect.width / parseFloat(getComputedStyle(el).fontSize))
                }))
              }))
              console.log('Agent 渲染测量', measured)
              if (width === 1440) await p.screenshot({ path: '/tmp/h02-agent-shuffle.png', fullPage: true })
            }
          }
        })
      }
    }
    assert.ok(results.length, '不能空跑')
    return results
  } finally { await browser?.close(); await new Promise(r => server.close(r)) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('H02 第一版业务回归通过（OA 未覆盖）：', await checkE2E())
}
