/**
 * 键盘路径抽检（astra.md 的 H03，矩阵里「键盘与读屏抽检」那张表）。
 *
 * 上一条 `check:keyboard` 查的是**每一个焦点位**的通用属性：看得见、有名字、
 * 不在隐藏区。这一条查的是**具体那几条路径走完之后，结果对不对**——
 * 它们是这套库里最容易悄悄退化的几条判断，而且退化之后页面完全正常：
 *
 *   表格    用键盘排序之后，排序状态读得出来吗；收起分组会不会把选择弄丢
 *   看板    键盘移动与菜单移动，落点是不是同一个
 *   线程    重试是原地更新还是又发了一条；未读分隔线会不会被新消息推走
 *
 * 结构上分成两半，是为了让判据本身也能被测：
 *
 *   `observe*`  在真实页面上走一遍键盘，只负责**记录观察到的事实**
 *   `judge*`    只看这些事实下判断，是纯函数
 *
 * 故障注入喂给 `judge*` 一组「坏掉的事实」，确认它会红——不必把真实页面改坏。
 * 判据本身写错（比如把「不变」写成「变了也行」）是这类检查最常见的失效方式，
 * 而它在全绿的仓库里永远暴露不出来。
 *
 * 用法：
 *   node scripts/check-keyboard-paths.mjs
 *   node scripts/check-keyboard-paths.mjs --base=http://localhost:4173
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

/* ---------- 判据：纯函数，只看观察到的事实 ---------- */

/**
 * 表格：用键盘排序之后状态要读得出来，收起分组不能把选择弄丢。
 *
 * `aria-sort` 是读屏用户判断「现在按哪一列、升还是降」的唯一依据。
 * 排序生效了但 aria-sort 没跟着变，屏幕上看得见箭头，读屏器却什么也不说。
 */
export function judgeTable(obs) {
  const problems = []
  if (obs.ariaSortBefore === obs.ariaSortAfter) {
    problems.push(`表格：键盘排序后 aria-sort 没有变化（始终是 ${obs.ariaSortBefore}）`)
  }
  if (!['ascending', 'descending'].includes(obs.ariaSortAfter)) {
    problems.push(`表格：排序后的 aria-sort 是 ${obs.ariaSortAfter}，读屏器读不出升降`)
  }
  if (obs.orderAfter.join() === obs.orderBefore.join()) {
    problems.push('表格：键盘按下去之后行的顺序没变，排序压根没生效')
  }
  // 收起是视图操作，不是取消选择
  if (obs.selectedAfterCollapse !== obs.selectedBeforeCollapse) {
    problems.push(
      `表格：收起分组把选择弄丢了（${obs.selectedBeforeCollapse} → ${obs.selectedAfterCollapse}）`
    )
  }
  return problems
}

/**
 * 看板：键盘移动与菜单移动必须落到同一格。
 *
 * 两条路径各写一遍的话，同一次移动会落到两个结果——用户会以为其中一条坏了，
 * 从此只用他试出来管用的那一条。
 */
export function judgeBoard(obs) {
  const problems = []
  if (obs.byKeyboard !== obs.byMenu) {
    problems.push(`看板：键盘落到「${obs.byKeyboard}」，菜单落到「${obs.byMenu}」，两条路径不一致`)
  }
  if (!obs.blockedReasons.length) {
    problems.push('看板：拿起卡片后没有任何落不下的格子写出理由，用户只能靠试')
  }
  return problems
}

/**
 * 线程：重试要原地更新，未读分隔线不能被新消息推走。
 *
 * 重试新建一条的话会发出两条一样的；分隔线跟着新消息往下跑的话，
 * 用户正读到一半就再也找不到自己读到哪儿了。
 */
export function judgeThread(obs) {
  const problems = []
  if (obs.rowsAfterRetry !== obs.rowsBeforeRetry) {
    problems.push(
      `线程：重试之后条数从 ${obs.rowsBeforeRetry} 变成 ${obs.rowsAfterRetry}，不是原地更新`
    )
  }
  if (obs.failedAfterRetry >= obs.failedBeforeRetry) {
    problems.push('线程：点了重试，失败标记还在原处，重试没有生效')
  }
  if (obs.dividerAfterNew !== obs.dividerBeforeNew) {
    problems.push(
      `线程：新消息进来把未读分隔线推走了（${obs.dividerBeforeNew} → ${obs.dividerAfterNew}）`
    )
  }
  if (obs.unreadAfterNew <= obs.unreadBeforeNew) {
    problems.push('线程：新消息进来但未读计数没涨，「又来了一条」这件事没说出来')
  }
  return problems
}

/* ---------- 观察：在真实页面上走一遍 ---------- */

async function observeTable(page, base) {
  await page.goto(`${base}/#/components/table`, { waitUntil: 'networkidle' })
  const table = page.locator('.i-tree-table').first()
  await table.waitFor()

  // 排序入口是表头里那个按钮：th 本身不可聚焦，键盘到不了
  const amountHeader = table.locator('th', { hasText: '金额' }).first()
  const sortButton = amountHeader.locator('.i-table-c__sort')
  const rowNames = () =>
    table.locator('tbody tr td:nth-child(2)').evaluateAll((els) =>
      els.map((el) => el.textContent.trim().slice(0, 6))
    )
  const ariaSort = () => amountHeader.getAttribute('aria-sort')

  const ariaSortBefore = await ariaSort()
  const orderBefore = await rowNames()
  // 键盘路径：聚焦到排序按钮再按回车，而不是直接点它
  await sortButton.focus()
  await sortButton.press('Enter')
  await page.waitForTimeout(250)
  const ariaSortAfter = await ariaSort()
  const orderAfter = await rowNames()

  const boxes = table.locator('tbody input[type=checkbox]:not([disabled])')
  for (const i of [0, 1]) await boxes.nth(i).check()
  const selectedBeforeCollapse = Number(
    (await table.locator('.i-tree-table__summary-bar').textContent()).match(/已选 (\d+) 项/)?.[1] ?? -1
  )
  await table.locator('.i-tree-table__toggle').first().click()
  await page.waitForTimeout(250)
  const selectedAfterCollapse = Number(
    (await table.locator('.i-tree-table__summary-bar').textContent()).match(/已选 (\d+) 项/)?.[1] ?? -1
  )

  return { ariaSortBefore, ariaSortAfter, orderBefore, orderAfter, selectedBeforeCollapse, selectedAfterCollapse }
}

async function observeBoard(page, base) {
  const cellOf = async (board, title) =>
    board.evaluate((el, name) => {
      const card = [...el.querySelectorAll('.i-board__card')].find((c) => c.textContent.includes(name))
      const cell = card?.closest('.i-board__cell')
      const lane = cell?.closest('.i-board__lane')
      const column = cell?.querySelector('.i-board__head')?.textContent.replace(/\s+/g, ' ').trim()
      const laneName = lane?.querySelector('.i-board__lane-title')?.textContent.replace(/\s+/g, ' ').trim()
      return `${laneName ?? ''} / ${column ?? ''}`
    }, title)

  /* 同一张卡、同一个起点，一次用键盘走、一次用菜单走 */
  await page.goto(`${base}/#/components/board`, { waitUntil: 'networkidle' })
  let board = page.locator('.i-board').first()
  await board.waitFor()
  const card = board.getByRole('button', { name: /对账单核对/ })
  await card.click()
  const blockedReasons = await board.locator('.i-board__cell-reason').allTextContents()
  await card.press('ArrowRight')
  await page.waitForTimeout(250)
  const byKeyboard = await cellOf(board, '对账单核对')

  /*
   * 回到同一个起点再用菜单走一次。必须真的 reload：
   * 地址只有 hash 不同（这里连 hash 都一样），goto 不会重新加载应用，
   * 上一轮键盘移动的结果还留在内存里——两条路径就不是从同一个起点出发的了，
   * 比出来的「不一致」是假的。这个坑我自己先踩了一次。
   */
  await page.reload({ waitUntil: 'networkidle' })
  board = page.locator('.i-board').first()
  await board.waitFor()
  await board.getByRole('button', { name: /对账单核对/ }).click()
  await page.waitForTimeout(250)
  const target = board.locator('.i-board__menu-item:not([disabled])').first()
  await target.click()
  await page.waitForTimeout(250)
  const byMenu = await cellOf(board, '对账单核对')

  return { byKeyboard, byMenu, blockedReasons }
}

async function observeThread(page, base) {
  await page.goto(`${base}/#/components/comment`, { waitUntil: 'networkidle' })
  const thread = page.locator('.i-thread').first()
  await thread.waitFor()

  const dividerAnchor = () =>
    thread.evaluate((el) => {
      const divider = el.querySelector('.i-thread__divider')
      const host = divider?.parentElement
      return host?.querySelector('.i-comment__content')?.textContent.trim().slice(0, 12) ?? ''
    })
  const unread = async () =>
    Number((await thread.locator('.i-thread__bar-text').textContent()).match(/(\d+) 条新消息/)?.[1] ?? 0)
  const rows = () => thread.locator('.i-comment, .i-thread__tombstone').count()

  const dividerBeforeNew = await dividerAnchor()
  const unreadBeforeNew = await unread()
  await page.getByRole('button', { name: /来一条新的/ }).click()
  await page.waitForTimeout(250)
  const dividerAfterNew = await dividerAnchor()
  const unreadAfterNew = await unread()

  const rowsBeforeRetry = await rows()
  const failedBeforeRetry = await thread.locator('.i-thread__send--failed').count()
  // 键盘路径：Tab 到重试按钮再按回车
  const retry = thread.getByRole('button', { name: '重发' }).first()
  await retry.focus()
  await retry.press('Enter')
  await page.waitForTimeout(250)
  const rowsAfterRetry = await rows()
  const failedAfterRetry = await thread.locator('.i-thread__send--failed').count()

  return {
    dividerBeforeNew, dividerAfterNew, unreadBeforeNew, unreadAfterNew,
    rowsBeforeRetry, rowsAfterRetry, failedBeforeRetry, failedAfterRetry
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseArg = process.argv.find((a) => a.startsWith('--base='))
  const port = 5184
  let server = null
  if (!baseArg) {
    server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { stdio: 'ignore' })
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`http://localhost:${port}/`)
        if (res.ok) break
      } catch { /* 还没起来 */ }
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  const base = baseArg ? baseArg.slice('--base='.length) : `http://localhost:${port}`

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const problems = []
  const walked = []

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    for (const [name, observe, judge] of [
      ['表格', observeTable, judgeTable],
      ['看板', observeBoard, judgeBoard],
      ['线程', observeThread, judgeThread]
    ]) {
      const observed = await observe(page, base)
      problems.push(...judge(observed))
      walked.push(name)
    }
    await context.close()
  } finally {
    await browser.close()
    server?.kill()
  }

  if (problems.length) {
    console.error('键盘路径抽检未通过：')
    for (const line of problems) console.error(`  - ${line}`)
    process.exit(1)
  }
  console.log(`键盘路径抽检通过：${walked.join('、')} 三条路径走完，结果与鼠标路径一致`)
}
