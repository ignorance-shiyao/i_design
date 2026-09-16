/**
 * 故障注入：把两种版面故障真的做出来，确认 check:layout 抓得到；
 * 再把同一页改成正确的写法，确认它不再报。
 *
 * 为什么要这么测：一条永远绿的检查和没有检查是一回事，而版面检查特别容易
 * 悄悄失效——选择器换了名字、判据被放宽、量的时机提前到了渲染之前，
 * 跑起来照样是绿的。所以这里不测「函数返回了什么形状」，
 * 测的是「页面坏掉时它红不红」。
 *
 * 用的是内联页面而不是文档站：故障要能被精确地做出来、也能被精确地撤掉，
 * 而整站的页面上永远有别的东西在动。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { auditInPage, MAX_MEASURE, MAX_STRETCH_PX, MAX_STRETCH_PCT } from './check-layout.mjs'

const LIMITS = {
  maxMeasure: MAX_MEASURE,
  maxStretchPx: MAX_STRETCH_PX,
  maxStretchPct: MAX_STRETCH_PCT
}

/** 一段足够长的中文，保证在宽容器里一行排得下几十个字、且不止一行 */
const PROSE = '每张图都要有一条不看图也能拿到数的路，读屏读不了矢量图，色觉障碍分不清相邻两个系列，'.repeat(4)

const page = (body, css = '') => `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<style>body{margin:0;font:15px/1.7 system-ui}${css}</style></head>
<body><main style="width:1000px">${body}</main></body></html>`

async function audit(browser, html) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const tab = await context.newPage()
  await tab.setContent(html)
  const result = await tab.evaluate(auditInPage, LIMITS)
  await context.close()
  return result
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
test.after(() => browser.close())

test('通栏的段落——行长超限时必须报出来', async () => {
  const { findings: found } = await audit(browser, page(`<p>${PROSE}</p>`))
  const hits = found.filter((f) => f.kind === '行长')
  assert.equal(hits.length, 1, `应当报出一条行长问题，实际：${JSON.stringify(found)}`)
  // 量的是渲染后的结果：1000px ÷ 15px ≈ 66 个汉字一行
  assert.match(hits[0].detail, /一行 6[0-9] 个汉字/)
})

test('加了行长上限的同一段落——不再报', async () => {
  const { findings: found } = await audit(browser, page(`<p style="max-width:45em">${PROSE}</p>`))
  assert.deepEqual(found.filter((f) => f.kind === '行长'), [])
})

test('代码块与表格不算行长：它们的宽度由内容决定', async () => {
  const { findings: found } = await audit(
    browser,
    page(`<pre><code>${PROSE}</code></pre><table><tr><td>${PROSE}</td></tr></table>`)
  )
  assert.deepEqual(found.filter((f) => f.kind === '行长'), [])
})

/** 三张卡片，其中一张比另两张高出一大截——网格默认会把矮的两张拉到同样高 */
const CARDS = `<ul id="g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0;padding:0;list-style:none">
  <li style="border:1px solid #ddd;border-radius:8px;padding:12px"><span>一行字</span></li>
  <li style="border:1px solid #ddd;border-radius:8px;padding:12px"><span>一行字</span></li>
  <li style="border:1px solid #ddd;border-radius:8px;padding:12px"><span style="display:block;height:300px">很高的一格</span></li>
</ul>`

test('被同行最高的格子撑高的卡片网格——必须报出来', async () => {
  const { findings: found } = await audit(browser, page(CARDS))
  const hits = found.filter((f) => f.kind === '撑高')
  assert.equal(hits.length, 1, `应当报出一条撑高问题，实际：${JSON.stringify(found)}`)
  assert.match(hits[0].detail, /最惨一格被拉高 2[0-9][0-9]px/)
})

test('同一片网格改成按内容定高——不再报', async () => {
  const { findings: found } = await audit(browser, page(CARDS, '#g{align-items:start}'))
  assert.deepEqual(found.filter((f) => f.kind === '撑高'), [])
})

test('子项不是卡片的网格不算：组件内部用网格拼出来的构件不在此列', async () => {
  const bare = CARDS.replaceAll('border:1px solid #ddd;border-radius:8px;', '')
  const { findings: found } = await audit(browser, page(bare))
  assert.deepEqual(found.filter((f) => f.kind === '撑高'), [])
})

test('量的是渲染后的结果，不是 CSS 里写了什么——被盖掉的上限照样报', async () => {
  const { findings: found } = await audit(
    browser,
    page(`<p class="prose" style="max-width:45em">${PROSE}</p>`, '.prose{max-width:none!important}')
  )
  assert.equal(found.filter((f) => f.kind === '行长').length, 1)
})

/* ——— 写明理由的豁免：空白本身就是落点的那种网格 ——— */

test('写了理由的网格不再报，理由原样带出来', async () => {
  const { findings, exempted } = await audit(
    browser,
    page(CARDS.replace('id="g"', 'id="g" data-stretch-reason="看板的列：空白本身就是放卡片的落点"'))
  )
  assert.deepEqual(findings.filter((f) => f.kind === '撑高'), [])
  // 豁免不是静音：它要带着理由出现在报告里，好让下一个人判断还成不成立
  assert.equal(exempted.length, 1)
  assert.equal(exempted[0].reason, '看板的列：空白本身就是放卡片的落点')
})

test('理由留空不算豁免——一个不用写理由的开关，半年后会长在每一处', async () => {
  const { findings, exempted } = await audit(
    browser,
    page(CARDS.replace('id="g"', 'id="g" data-stretch-reason="   "'))
  )
  assert.equal(findings.filter((f) => f.kind === '撑高').length, 1)
  assert.deepEqual(exempted, [])
})

test('豁免只挡撑高那一条，行长照报', async () => {
  const { findings } = await audit(
    browser,
    page(`<div data-stretch-reason="落点"><p>${PROSE}</p></div>`)
  )
  assert.equal(findings.filter((f) => f.kind === '行长').length, 1)
})
