/**
 * 故障注入：把三类键盘故障真的做出来，确认 check:keyboard 抓得到；
 * 再把同一页改回正确写法，确认它不再报。
 *
 * 为什么必须有这一篇：这条检查最后是绿的，而「一条永远绿的检查」与
 * 「没有检查」是一回事。它第一次跑出来报了六条，其中四条是它自己判错的
 * （原生控件视觉隐藏、焦点环画在外层容器上、焦点环由 JS 切类而 DOM 异步更新）——
 * 把误报调没之后，更要证明真故障还拦得住，否则等于把判据调成了「永远通过」。
 *
 * 用内联页面而不是文档站：故障要能被精确地做出来、也能被精确地撤掉。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { auditInPage, MAX_TABS } from './check-keyboard.mjs'

const page = (body, css = '') => `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>
  /* 默认给一个看得见的焦点环，这样每个用例只需要破坏它关心的那一处 */
  :focus-visible { outline: 2px solid #5e7ce0; outline-offset: 2px; }
  ${css}
</style></head><body>${body}</body></html>`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
test.after(() => browser.close())

async function audit(html) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const tab = await context.newPage()
  await tab.exposeFunction('__tab', () => tab.keyboard.press('Tab'))
  await tab.setContent(html)
  const result = await tab.evaluate(auditInPage, { maxTabs: MAX_TABS })
  await context.close()
  return result
}

test('焦点环被 outline:none 抹掉——必须报出来', async () => {
  const { findings } = await audit(
    page('<button id="a">确定</button>', '#a:focus, #a:focus-visible { outline: none; }')
  )
  const hits = findings.filter((f) => f.kind === '焦点不可见')
  assert.equal(hits.length, 1, JSON.stringify(findings))
  assert.match(hits[0].selector, /^button/)
})

test('把焦点环还回去——不再报', async () => {
  const { findings } = await audit(page('<button>确定</button>'))
  assert.deepEqual(findings, [])
})

test('原生控件视觉隐藏、焦点环画在旁边的 span 上——这是正确写法，不能报', async () => {
  // 单选与复选框都是这么写的：input 藏起来，:focus-visible + span 上画环
  const { findings } = await audit(
    page(
      '<label><input type="checkbox" id="c"><span id="box">同意</span></label>',
      '#c { position: absolute; opacity: 0; width: 1px; height: 1px; }\n' +
        '#c:focus-visible + #box { outline: 2px solid #5e7ce0; }'
    )
  )
  assert.deepEqual(findings, [])
})

test('焦点环由 JS 切类、DOM 异步更新——也不能报（这条防的是量得太早）', async () => {
  const { findings } = await audit(
    page(
      // 带上 aria-label：这一条要验的是焦点环，别让「没有名字」混进来
      '<div id="wrap"><input id="f" aria-label="数量"></div>' +
        '<script>const w=document.getElementById("wrap"),f=document.getElementById("f");' +
        // 故意推迟到下一帧再改类，模拟框架的异步更新
        'f.addEventListener("focus",()=>requestAnimationFrame(()=>w.classList.add("is-focused")));' +
        'f.addEventListener("blur",()=>requestAnimationFrame(()=>w.classList.remove("is-focused")));<\/script>',
      '#f:focus { outline: none; }\n#wrap.is-focused { box-shadow: 0 0 0 3px rgba(94,124,224,.18); }'
    )
  )
  assert.deepEqual(findings, [])
})

test('藏起来却还留在 Tab 序里的按钮——必须报出来', async () => {
  const { findings } = await audit(
    page('<button id="ghost">上一张</button>', '#ghost { opacity: 0; }')
  )
  const hits = findings.filter((f) => f.kind === '隐藏焦点')
  assert.equal(hits.length, 1, JSON.stringify(findings))
})

test('悬停才显形、但聚焦时会显形的按钮——不报：用键盘的人看得见它', async () => {
  const { findings } = await audit(
    page('<button id="arrow">下一张</button>', '#arrow { opacity: 0; }\n#arrow:focus-visible { opacity: 1; }')
  )
  assert.deepEqual(findings, [])
})

test('没有可访问名称的按钮——必须报出来', async () => {
  const { findings } = await audit(page('<button id="x"><svg width="16" height="16"></svg></button>'))
  const hits = findings.filter((f) => f.kind === '无名可聚焦元素')
  assert.equal(hits.length, 1, JSON.stringify(findings))
})

test('补上 aria-label 之后——不再报', async () => {
  const { findings } = await audit(
    page('<button aria-label="关闭"><svg width="16" height="16"></svg></button>')
  )
  assert.deepEqual(findings, [])
})

test('走过的焦点位数要如实报出来：一个都没走到的话，全绿说明不了任何事', async () => {
  const { visited } = await audit(page('<button>一</button><button>二</button><a href="#">三</a>'))
  assert.equal(visited, 3)
})
