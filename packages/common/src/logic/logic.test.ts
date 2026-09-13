/**
 * 共享逻辑的回归测试。
 *
 * 此前这一层只有 Flutter 的 golden test 在兜——但那份文件是生成的，
 * 期望值来自 TS 实现本身，所以它只能保证「Dart 端与 TS 端算得一样」，
 * 保证不了「TS 端算得对」。TS 侧写错了，golden 会跟着一起错。
 *
 * 优先补**已经出过 bug 的那几处**。它们出过一次，说明这些地方容易写歪，
 * 而不是因为它们最重要：
 *   countdown  模板缺位时并位（曾经显示成「05:30」而实际还有一小时零五分）
 *   virtual    底部撑开的算法（曾经让滚动条比内容长一截）
 *   overflow   判定方向（多行截断拿宽度比，提示一次都不会出现）
 *   locale     局部覆盖（改了 empty 而空态标题没跟着变）
 *   qrcode     纠错与版本选择（格式信息位序曾经写反）
 */
import { describe, expect, it } from 'vitest'
import { countdownParts, countdownInterval, formatCountdown } from './countdown'
import { virtualWindow, scrollToRow, shouldVirtualize } from './virtual'
import { isTextOverflowing, OVERFLOW_EPSILON } from './overflow'
import { resolveLocale, zhCN, enUS } from './locale'
import { shouldFlipUp } from './overlay'
import { alignGuides, anchorOf, edgePath } from './flow'
import { describeAccept } from './upload'
import { contrastRatio, hexToRgb, readableOn, rgbToOklch, solidPair } from './palette'
import { DEFAULT_THEME_CONFIG, resolveThemeTokens } from './theme'
import { qrMatrix, qrVersionFor } from './qrcode'
import { avatarSizePx, initialsOf, tintOf } from './avatar'
import { safeHref } from './href'
import { floatActionDelay, floatActionOffset, floatActionShift } from './float'
import { isSplitterResetKey, paneRatio, resetPaneSize } from './splitter'
import { watermarkTampered } from './watermark'
import { ELAPSED_THRESHOLD, elapsedInterval, elapsedParts, shouldShowElapsed } from './elapsed'
import { detectLang, normalizeLang, tokenize, tokenizeLines } from './highlight'
import { diffLines, diffStat } from './diff'
import { moveCommandIndex, searchCommands, type CommandItem } from './command'
import { summarizeToolChips, toolChipIcon, toolChipStat } from './toolchip'
import {
  defaultOpenSteps,
  summarizeThinking,
  thinkingStepIcon,
  toggleThinkingStep
} from './thinking'

describe('countdown', () => {
  it('不显示毫秒时向上取整到秒：剩 1.4 秒给 2 秒', () => {
    // 向下取整的话，最后那个 00 会挂满整整一秒才结束
    expect(countdownParts(1400).seconds).toBe(2)
    expect(countdownParts(1400, true).seconds).toBe(1)
  })

  it('剩余为负时按 0 处理，不往回走', () => {
    expect(countdownParts(-5000)).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('模板里没有的单位并进相邻的更小单位，而不是丢掉', () => {
    // 一小时零五分三十秒。丢掉小时会显示 05:30——看起来还有五分半
    const remaining = (65 * 60 + 30) * 1000
    expect(formatCountdown(remaining, 'mm:ss')).toBe('65:30')
    expect(formatCountdown(remaining, 'HH:mm:ss')).toBe('01:05:30')
  })

  it('单字母不补零，双字母补两位', () => {
    expect(formatCountdown(5000, 'H:m:s')).toBe('0:0:5')
    expect(formatCountdown(5000, 'HH:mm:ss')).toBe('00:00:05')
  })

  it('天数在模板带 D 时单独成位', () => {
    const remaining = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000
    expect(formatCountdown(remaining, 'D 天 HH:mm:ss')).toBe('2 天 03:04:05')
    expect(formatCountdown(remaining, 'HH:mm:ss')).toBe('51:04:05')
  })

  it('刷新间隔对齐到下一个整秒，避免累积漂移', () => {
    expect(countdownInterval(5400)).toBe(400)
    expect(countdownInterval(5000)).toBe(1000)
    expect(countdownInterval(5400, true)).toBe(50)
  })
})

describe('virtual', () => {
  it('底部撑开按剩余行数算，start 被夹到 0 时也不多算', () => {
    const w = virtualWindow(0, 300, 40, 100)
    expect(w.start).toBe(0)
    // 总高减去已渲染高度的写法会在这里多出一截，滚动条比内容长
    expect(w.paddingTop + (w.end - w.start + 1) * 40 + w.paddingBottom).toBe(w.totalHeight)
  })

  it('滚到中间时上下各留 overscan 行', () => {
    // 首行 50，视口装得下 8 行，上下各留 3 行
    const w = virtualWindow(40 * 50, 300, 40, 1000)
    expect(w.start).toBe(47)
    expect(w.end).toBe(61)
  })

  it('空列表返回一个不渲染任何行的窗口', () => {
    expect(virtualWindow(0, 300, 40, 0)).toMatchObject({ start: 0, end: -1, totalHeight: 0 })
  })

  it('目标行已完整可见时不滚动', () => {
    // 每次都滚到顶部的话，用户会觉得列表在自己乱跳
    expect(scrollToRow(5, 40, 180, 300)).toBe(180)
    expect(scrollToRow(1, 40, 180, 300)).toBe(40)
    expect(scrollToRow(20, 40, 180, 300)).toBe(840 - 300)
  })

  it('行数不够时不值得虚拟化', () => {
    expect(shouldVirtualize(60)).toBe(false)
    expect(shouldVirtualize(61)).toBe(true)
  })
})

describe('overflow', () => {
  const metrics = (w: number, cw: number, h: number, ch: number) => ({
    scrollWidth: w, clientWidth: cw, scrollHeight: h, clientHeight: ch
  })

  it('单行看宽度，多行看高度', () => {
    // 多行截断永远不会横向溢出，拿宽度判断的话提示一次都不会出现
    const tallOnly = metrics(100, 100, 200, 100)
    expect(isTextOverflowing(tallOnly)).toBe(false)
    expect(isTextOverflowing(tallOnly, true)).toBe(true)

    const wideOnly = metrics(200, 100, 100, 100)
    expect(isTextOverflowing(wideOnly)).toBe(true)
    expect(isTextOverflowing(wideOnly, true)).toBe(false)
  })

  it('亚像素差异留容差，短文案不会整列冒浮层', () => {
    expect(isTextOverflowing(metrics(100 + OVERFLOW_EPSILON, 100, 0, 0))).toBe(false)
    expect(isTextOverflowing(metrics(100 + OVERFLOW_EPSILON + 0.5, 100, 0, 0))).toBe(true)
  })
})

describe('locale', () => {
  it('局部覆盖只改传进来的那几句', () => {
    const locale = resolveLocale({ confirm: '好的' })
    expect(locale.confirm).toBe('好的')
    expect(locale.cancel).toBe(zhCN.cancel)
  })

  it('覆盖 empty 时空态标题跟着变', () => {
    // 只改了 empty 却发现空态还写着「暂无数据」，接入方会以为覆盖没生效
    const locale = resolveLocale({ empty: '什么都没有' })
    expect(locale.emptyPresets.empty.title).toBe('什么都没有')
  })

  it('同时传了 emptyPresets 时以传进来的为准', () => {
    const locale = resolveLocale({
      empty: '什么都没有',
      emptyPresets: { ...zhCN.emptyPresets, empty: { ...zhCN.emptyPresets.empty, title: '空空如也' } }
    })
    expect(locale.emptyPresets.empty.title).toBe('空空如也')
  })

  it('可以换一份基准字典', () => {
    const locale = resolveLocale({ confirm: 'Sure' }, enUS)
    expect(locale.confirm).toBe('Sure')
    expect(locale.cancel).toBe(enUS.cancel)
  })
})

describe('qrcode', () => {
  it('版本随内容长度上升，且纠错等级越高容量越小', () => {
    expect(qrVersionFor(10, 'L')).toBeLessThanOrEqual(qrVersionFor(10, 'H'))
    expect(qrVersionFor(10, 'M')).toBeLessThan(qrVersionFor(200, 'M'))
  })

  it('矩阵是方阵，尺寸符合 4 × 版本 + 17', () => {
    const m = qrMatrix('https://example.com', 'M')!
    expect(m).not.toBeNull()
    expect(m.size).toBe(4 * m.version + 17)
    expect(m.modules.length).toBe(m.size)
    expect(m.modules.every((row) => row.length === m.size)).toBe(true)
  })

  it('三个角的定位图形都在', () => {
    // 位序写反过一次，而画出来的码依然「看着像个二维码」
    const m = qrMatrix('hello', 'M')!
    const corner = (r: number, c: number) => m.modules[r][c]
    for (const [r, c] of [[0, 0], [0, m.size - 7], [m.size - 7, 0]]) {
      expect(corner(r, c)).toBe(true)
      expect(corner(r + 1, c + 1)).toBe(false)
      expect(corner(r + 3, c + 3)).toBe(true)
    }
  })

  it('内容超出最大容量时返回 null，而不是画出一个扫不出来的码', () => {
    expect(qrMatrix('x'.repeat(100000), 'H')).toBeNull()
  })
})

describe('avatar', () => {
  it('尺寸档位三端共用同一份', () => {
    expect(avatarSizePx('sm')).toBe(24)
    expect(avatarSizePx('lg')).toBe(44)
    expect(avatarSizePx(56)).toBe(56)
  })

  it('中文取末两字，西文取首字母缩写', () => {
    expect(initialsOf('陆停云')).toBe('停云')
    expect(initialsOf('Ada Lovelace')).toBe('AL')
    expect(initialsOf('   ')).toBe('')
  })

  it('同一个姓名任何时候都得到同一个底色', () => {
    expect(tintOf('林岚')).toBe(tintOf('林岚'))
  })
})

describe('splitter', () => {
  const panes = [{ min: 120 }, { min: 160 }, 4] as const

  it('复位到目标比例', () => {
    expect(resetPaneSize(0.5, 1000, panes[0], panes[1], panes[2])).toBe(498)
    expect(paneRatio(resetPaneSize(0.2, 1000, panes[0], panes[1], panes[2]), 1000, 4)).toBeCloseTo(0.2)
  })

  it('容器太窄时复位仍受两栏下限约束', () => {
    // 300 宽下五五开只有 148，低于第一栏的 120 下限还好；但第二栏只剩 148 < 160，
    // 所以第一栏要让出来。不夹取的话，双击一下会得到一个拖都拖不出来的状态
    const size = resetPaneSize(0.5, 300, panes[0], panes[1], panes[2])
    expect(size).toBeGreaterThanOrEqual(120)
    expect(296 - size).toBeGreaterThanOrEqual(160)
  })

  it('Enter 与空格是双击的键盘等价物', () => {
    expect(isSplitterResetKey('Enter')).toBe(true)
    expect(isSplitterResetKey(' ')).toBe(true)
    expect(isSplitterResetKey('ArrowLeft')).toBe(false)
  })
})

describe('elapsed', () => {
  it('三秒之内不显示数字', () => {
    // 一秒内就返回的请求上挂一个「0 秒」只会让界面更吵
    expect(shouldShowElapsed(2999)).toBe(false)
    expect(shouldShowElapsed(ELAPSED_THRESHOLD)).toBe(true)
  })

  it('向下取整：显示的秒数不会比真实时间还大', () => {
    expect(elapsedParts(5400)).toEqual({ minutes: 0, seconds: 5 })
    expect(elapsedParts(59999)).toEqual({ minutes: 0, seconds: 59 })
    expect(elapsedParts(125000)).toEqual({ minutes: 2, seconds: 5 })
    expect(elapsedParts(-100)).toEqual({ minutes: 0, seconds: 0 })
  })

  it('刷新间隔对齐到下一个整秒，避免累积漂移', () => {
    expect(elapsedInterval(5400)).toBe(600)
    expect(elapsedInterval(1000)).toBe(1000)
  })
})

describe('watermark', () => {
  it('删掉水印层算动过手脚', () => {
    expect(watermarkTampered(true, null)).toBe(true)
  })

  it('改样式、类名与 hidden 算，其余属性不算', () => {
    // 盯得太宽会被自己的样式过渡触发，陷进「改了又恢复」的循环
    expect(watermarkTampered(false, 'style')).toBe(true)
    expect(watermarkTampered(false, 'class')).toBe(true)
    expect(watermarkTampered(false, 'hidden')).toBe(true)
    expect(watermarkTampered(false, 'data-x')).toBe(false)
    expect(watermarkTampered(false, null)).toBe(false)
  })
})

describe('float', () => {
  it('动作从主按钮往外依次排开，间距不靠魔数', () => {
    expect(floatActionOffset(0)).toBe(56)
    expect(floatActionOffset(1) - floatActionOffset(0)).toBe(52)
    expect(floatActionOffset(2) - floatActionOffset(1)).toBe(52)
  })

  it('底边对齐的位移比圆心距多出半个直径之差', () => {
    // 直接拿圆心距当位移，整排动作会统一偏低 4px——肉眼看不出，量一下就跑出来了
    expect(floatActionShift(0) - floatActionOffset(0)).toBe(4)
  })

  it('依次弹出，总时长压在 150ms 内', () => {
    expect(floatActionDelay(0, 3)).toBe(0)
    expect(floatActionDelay(2, 3)).toBeLessThanOrEqual(150)
    // 只有一个动作时没有「依次」可言
    expect(floatActionDelay(0, 1)).toBe(0)
  })
})

describe('href', () => {
  it('放行常见的正当地址', () => {
    for (const href of ['https://example.com', '/docs', '#anchor', './a.png', 'mailto:a@b.c']) {
      expect(safeHref(href)).toBe(href)
    }
  })

  it('挡掉脚本协议，包括中间插了控制字符的变形', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined()
    expect(safeHref('java\tscript:alert(1)')).toBeUndefined()
    expect(safeHref('data:text/html,<script>')).toBeUndefined()
  })

  it('挡掉协议相对地址：它看起来像站内路径，实际指向别的站点', () => {
    expect(safeHref('//evil.com')).toBeUndefined()
    expect(safeHref('\\\\evil.com')).toBeUndefined()
  })
})

describe('highlight', () => {
  it('token 拼回去必须等于原文，一个字符都不能少', () => {
    // 少一个字符就说明切错了，而渲染出来往往看不出来——代码会静悄悄少一个括号
    for (const [code, lang] of [
      ["const a = { b: 'c' } // 注释", 'ts'],
      ['<IButton :disabled="true">确定</IButton>', 'vue'],
      ['.a { color: var(--i-color-brand); }', 'css'],
      ['{"a": 1, "b": [true, null]}', 'json'],
      ['npm run build --if-present', 'bash']
    ] as const) {
      expect(tokenize(code, lang).map((t) => t.text).join('')).toBe(code)
    }
  })

  it('认不出语言时退化成纯文本，而不是乱标', () => {
    expect(tokenize('随便一段中文', 'text')).toEqual([{ type: 'text', text: '随便一段中文' }])
    expect(detectLang('随便一段中文')).toBe('text')
  })

  it('语言别名落到同一套规则', () => {
    expect(normalizeLang('typescript')).toBe('ts')
    expect(normalizeLang('jsx')).toBe('ts')
    expect(normalizeLang('template')).toBe('vue')
    expect(normalizeLang('sh')).toBe('bash')
    expect(normalizeLang('随便')).toBe('text')
  })

  it('按行切分时换行不进 token，行数与原文一致', () => {
    const code = "const a = 1\nconst b = 2\n\nconst c = 3"
    const lines = tokenizeLines(code, 'ts')
    expect(lines.length).toBe(4)
    expect(lines[2]).toEqual([])
    expect(lines.map((l) => l.map((t) => t.text).join('')).join('\n')).toBe(code)
  })
})

describe('diff', () => {
  it('开头插一行时，其余行不算改动', () => {
    // 逐行对齐的写法会把后面所有行都标成改动，那样的 diff 没法用
    const lines = diffLines('b\nc', 'a\nb\nc')
    expect(diffStat(lines)).toEqual({ added: 1, removed: 0 })
    expect(lines[0]).toMatchObject({ kind: 'add', text: 'a', after: 1 })
    expect(lines[1]).toMatchObject({ kind: 'same', text: 'b', before: 1, after: 2 })
  })

  it('同一处改动里删除排在新增之前', () => {
    // 视线顺序是「原来是什么 → 变成了什么」，反过来每一处都要在脑子里倒一次
    const lines = diffLines('x\nold\ny', 'x\nnew\ny')
    expect(lines.map((l) => l.kind)).toEqual(['same', 'remove', 'add', 'same'])
  })

  it('完全相同的两段没有改动', () => {
    expect(diffStat(diffLines('a\nb', 'a\nb'))).toEqual({ added: 0, removed: 0 })
  })

  it('行号按各自的文本编号，新增行没有旧行号', () => {
    const lines = diffLines('a\nb', 'a\nc\nb')
    const added = lines.find((l) => l.kind === 'add')!
    expect(added.before).toBeUndefined()
    expect(added.after).toBe(2)
  })
})

describe('command', () => {
  const items: CommandItem[] = [
    { key: 'button', label: '按钮', description: '触发一个即时操作', keywords: ['Button'] },
    { key: 'button-group', label: '按钮组', description: '一组并列的按钮', keywords: ['ButtonGroup'] },
    { key: 'form', label: '表单 校验', description: '把一组输入组织成一次提交', keywords: ['Form'] },
    { key: 'tag', label: '标签', description: '标记状态或分类；可用按钮触发', keywords: ['Tag'] }
  ]

  it('整串相等排在前缀命中之前', () => {
    // 搜「按钮」时第一条必须是按钮本身，不是以它开头的另一件东西
    expect(searchCommands(items, '按钮').map((m) => m.item.key)).toEqual(['button', 'button-group', 'tag'])
  })

  it('标题命中排在描述命中之前', () => {
    const keys = searchCommands(items, '按钮').map((m) => m.item.key)
    expect(keys.indexOf('button')).toBeLessThan(keys.indexOf('tag'))
  })

  it('英文关键词也能搜到', () => {
    expect(searchCommands(items, 'form')[0].item.key).toBe('form')
  })

  it('词首命中比词中命中分高', () => {
    const [first] = searchCommands(items, '校验')
    expect(first.item.key).toBe('form')
  })

  it('空查询给出全部条目，而不是一片空白', () => {
    // 搜索框刚打开时该看到「有哪些东西可搜」
    expect(searchCommands(items, '   ').length).toBe(items.length)
  })

  it('高亮区间只落在标题上', () => {
    const [first] = searchCommands(items, '按钮')
    expect(first.ranges).toEqual([[0, 2]])
    const viaDesc = searchCommands(items, '分类').find((m) => m.item.key === 'tag')!
    expect(viaDesc.ranges).toEqual([])
  })

  it('上下键到头绕回去', () => {
    // 停在最后一条的话，用户会以为键盘失灵然后去够鼠标
    expect(moveCommandIndex(2, 1, 3)).toBe(0)
    expect(moveCommandIndex(0, -1, 3)).toBe(2)
    expect(moveCommandIndex(0, 1, 0)).toBe(0)
  })
})

describe('工具芯片', () => {
  it('零的那一半不写出来', () => {
    // 「+13 −0」里的 0 不带信息，却和真数字长得一样，读者要多看一眼才知道它是空的
    expect(toolChipStat(13, 0)).toBe('+13')
    expect(toolChipStat(0, 4)).toBe('−4')
    expect(toolChipStat(13, 4)).toBe('+13 −4')
  })

  it('没有改动就不挂统计', () => {
    expect(toolChipStat(0, 0)).toBe('')
    expect(toolChipStat()).toBe('')
  })

  it('减号用的是减号，不是连字符', () => {
    // 连字符比数字矮一截，排在数字前面看着像断开的
    expect(toolChipStat(0, 4).charCodeAt(0)).toBe(0x2212)
  })

  it('汇总把失败单独数出来', () => {
    // 十次里有一次失败与十次全成是两件事，「共 10 次」把它们说成一样的
    const summary = summarizeToolChips([
      { key: 'a', label: 'a.ts', status: 'success', added: 13, removed: 4 },
      { key: 'b', label: 'b.ts', status: 'error' },
      { key: 'c', label: 'c.ts', status: 'running', added: 2 }
    ])
    expect(summary).toEqual({ total: 3, running: 1, failed: 1, added: 15, removed: 4 })
  })

  it('空列表汇总成全零，而不是崩掉', () => {
    expect(summarizeToolChips([])).toEqual({ total: 0, running: 0, failed: 0, added: 0, removed: 0 })
  })

  it('成功与失败用形状不同的图标，不靠颜色区分', () => {
    expect(toolChipIcon('error')).toBe('error-circle')
    expect(toolChipIcon('success')).toBe('check-circle')
    expect(toolChipIcon()).toBe('check-circle')
  })
})

describe('推理轨迹', () => {
  const steps = [
    { key: 'a', title: '拆解问题', status: 'done' as const },
    { key: 'b', title: '检索文档', kind: 'search' as const, status: 'error' as const },
    { key: 'c', title: '写补丁', kind: 'code' as const, status: 'running' as const },
    { key: 'd', title: '复核', status: 'done' as const }
  ]

  it('出错与进行中的那几步默认展开', () => {
    // 出错那步让用户再点一下才看得到，是白费一次操作
    expect(defaultOpenSteps(steps)).toEqual(['b', 'c'])
  })

  it('做完且做对的步骤默认折叠', () => {
    expect(defaultOpenSteps([{ key: 'a', title: '拆解问题', status: 'done' }])).toEqual([])
  })

  it('进度停在进行中的那一步，没有进行中的就是最后一步', () => {
    expect(summarizeThinking(steps).activeIndex).toBe(2)
    expect(summarizeThinking([steps[0], steps[3]]).activeIndex).toBe(1)
    expect(summarizeThinking([]).activeIndex).toBe(-1)
  })

  it('概括把失败单独数出来', () => {
    expect(summarizeThinking(steps)).toEqual({
      total: 4,
      done: 2,
      running: 1,
      failed: 1,
      activeIndex: 2
    })
  })

  it('种类靠形状区分，不靠颜色', () => {
    expect(thinkingStepIcon('search')).toBe('search')
    expect(thinkingStepIcon('code')).toBe('code')
    expect(thinkingStepIcon('tool')).toBe('layers')
    expect(thinkingStepIcon()).toBe('sparkle')
  })

  it('展开与收起返回新数组，各端的响应式才认得出变化', () => {
    const open = ['b']
    expect(toggleThinkingStep(open, 'c')).toEqual(['b', 'c'])
    expect(toggleThinkingStep(open, 'b')).toEqual([])
    expect(open).toEqual(['b'])
  })
})

describe('有颜色的字要读得出来', () => {
  it('填充色调到在自己的淡底上过 4.5', () => {
    // 品牌蓝直接拿来写字，在白底上只有 3.86——而链接是最需要读准的那几个字
    const text = readableOn('#5e7ce0', '#eef3ff')
    expect(contrastRatio(text, '#eef3ff')).toBeGreaterThanOrEqual(4.5)
    // 淡底过了，白底自然也过
    expect(contrastRatio(text, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('色相不变：用户挑的那个颜色不能在链接上变成另一种', () => {
    const before = rgbToOklch(hexToRgb('#f66f6a'))
    const after = rgbToOklch(hexToRgb(readableOn('#f66f6a', '#fdecee')))
    expect(Math.abs(after.h - before.h)).toBeLessThan(2)
  })

  it('深底上往浅里走，而不是一律加深', () => {
    const text = readableOn('#5e7ce0', '#222837')
    expect(contrastRatio(text, '#222837')).toBeGreaterThanOrEqual(4.5)
  })

  it('已经够读的颜色原样返回', () => {
    expect(readableOn('#15705a', '#e8f8f0')).toBe('#15705a')
  })

  it('主题面板换色时，四个 *-text 令牌跟着一起推导', () => {
    // 以前没有这几条：换成红色主题，填充变红而链接还是深蓝的
    const tokens = resolveThemeTokens(
      { ...DEFAULT_THEME_CONFIG, brand: '#d64f8d', danger: '#c2413d' },
      'light'
    )
    for (const key of ['color-brand-text', 'color-text-link', 'color-danger-text']) {
      expect(contrastRatio(tokens[key], '#ffffff')).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('贴着触发器的面板往哪边开', () => {
  const trigger = { y: 400, height: 32 }

  it('下方放得下就往下开', () => {
    expect(shouldFlipUp(trigger, 160, 720)).toBe(false)
  })

  it('下方放不下、上方放得下就翻上去', () => {
    // 实测过：视口 520 时下拉掉出 65px、日期面板掉出 212px——选项还在，但够不着
    expect(shouldFlipUp(trigger, 160, 520)).toBe(true)
  })

  it('两边都放不下时不翻：翻上去只是把问题换个方向', () => {
    expect(shouldFlipUp({ y: 100, height: 32 }, 600, 300)).toBe(false)
  })

  it('正好卡在边上算放得下，不为了几个像素翻一次', () => {
    expect(shouldFlipUp(trigger, 280, 720)).toBe(false)
  })
})

describe('拖动时的对齐辅助线', () => {
  const node = (id: string, x: number, y: number, width = 120, height = 48) => ({
    id,
    x,
    y,
    width,
    height,
    label: id
  })

  it('差几像素就吸上去，并给出一条线', () => {
    // 差一两个像素看得出来，却怎么也拖不准——最后那点距离该由吸附走完
    const result = alignGuides(node('a', 103, 200), [node('b', 100, 20)])
    expect(result.dx).toBe(-3)
    expect(result.guides.some((g) => g.orientation === 'v' && g.at === 100)).toBe(true)
  })

  it('超出阈值就不吸，也不画线', () => {
    expect(alignGuides(node('a', 140, 200), [node('b', 100, 20)])).toEqual({
      dx: 0,
      dy: 0,
      guides: []
    })
  })

  it('宽度不同的两个节点，中心对齐优先于按边对齐', () => {
    // 按边对齐在宽度不同时看着是歪的
    const result = alignGuides(node('a', 100, 300, 60), [node('b', 70, 20, 120)])
    expect(result.dx).toBe(0)
    expect(result.guides[0].at).toBe(130)
  })

  it('两根轴各吸一条，互不干扰', () => {
    const result = alignGuides(node('a', 102, 203), [node('b', 100, 200)])
    expect([result.dx, result.dy]).toEqual([-2, -3])
    expect(new Set(result.guides.map((g) => g.orientation))).toEqual(new Set(['v', 'h']))
  })

  it('左中右同时对齐时三条线都画出来', () => {
    // 只画一条的话，读者会以为只有那一处齐了
    const result = alignGuides(node('a', 103, 200), [node('b', 100, 20)])
    const vertical = result.guides.filter((g) => g.orientation === 'v').map((g) => g.at)
    expect(vertical.sort((a, b) => a - b)).toEqual([100, 160, 220])
  })

  it('线只盖住参与对齐的那两个节点，不贯穿整张画布', () => {
    // 贯穿全画布的线在节点多的图上像一张网格，反而看不出是哪两个对齐了
    const [guide] = alignGuides(node('a', 100, 400), [node('b', 100, 20)]).guides
    expect([guide.from, guide.to]).toEqual([20, 448])
  })

  it('不跟自己对齐', () => {
    const self = node('a', 100, 100)
    expect(alignGuides(self, [self]).guides).toEqual([])
  })
})

describe('把 accept 说成人话', () => {
  it('扩展名转成大写的格式名', () => {
    expect(describeAccept('.png,.jpg')).toEqual({ exts: ['PNG', 'JPG'], kinds: [] })
  })

  it('通配 MIME 归成类别，词由字典给', () => {
    // `image/*` 直接印在界面上，读者从里面学不到任何事
    expect(describeAccept('image/*')).toEqual({ exts: [], kinds: ['image'] })
  })

  it('类别覆盖到的扩展名不再单列', () => {
    // 「PNG、JPG、图片」是在重复，直接说「图片」就够
    expect(describeAccept('.png,.jpg,image/*')).toEqual({ exts: [], kinds: ['image'] })
  })

  it('类别覆盖不到的仍要列出来', () => {
    expect(describeAccept('.pdf,image/*')).toEqual({ exts: ['PDF'], kinds: ['image'] })
  })

  it('说不清的通配类别就不翻译，免得编一个词', () => {
    expect(describeAccept('application/*')).toEqual({ exts: [], kinds: [] })
  })

  it('空的 accept 就什么都不说', () => {
    expect(describeAccept('')).toEqual({ exts: [], kinds: [] })
  })

  it('重复的写法只说一遍', () => {
    expect(describeAccept('.png, .PNG , .png').exts).toEqual(['PNG'])
  })
})

describe('中文与西文之间的空格', () => {
  it('接西文时留一个空格', () => {
    expect(zhCN.uploadHintText(['PNG', 'JPG'], 5)).toBe('支持 PNG、JPG，单个不超过 5 MB')
  })

  it('接中文时不留：「支持 图片」里那个空格看起来像少了个字', () => {
    expect(zhCN.uploadHintText(['图片'], 5)).toBe('支持图片，单个不超过 5 MB')
  })

  it('没有类型限制时只说大小', () => {
    expect(zhCN.uploadHintText([], 5)).toBe('单个不超过 5 MB')
  })

  it('两样都没有就什么都不说', () => {
    expect(zhCN.uploadHintText([], 0)).toBe('')
  })
})

describe('连线锚点可以指定', () => {
  const node = (id: string, x: number, y: number) => ({ id, x, y, width: 120, height: 48, label: id })

  it('不指定时按两点方位自动选', () => {
    // 目标在正下方，就从下边出去
    expect(anchorOf(node('a', 0, 0), { x: 60, y: 400 }).side).toBe('bottom')
  })

  it('指定了就照办，哪怕方位上说不该走那边', () => {
    // 回边要从侧面绕回去，自动选会让它贴着主干直上直下，和正向的线叠在一起
    const a = anchorOf(node('a', 0, 0), { x: 60, y: 400 }, 'right')
    expect(a.side).toBe('right')
    expect([a.x, a.y]).toEqual([120, 24])
  })

  it('四条边各落在自己那条边的中点上', () => {
    const n = node('a', 100, 200)
    expect(anchorOf(n, { x: 0, y: 0 }, 'left')).toEqual({ x: 100, y: 224, side: 'left' })
    expect(anchorOf(n, { x: 0, y: 0 }, 'top')).toEqual({ x: 160, y: 200, side: 'top' })
    expect(anchorOf(n, { x: 0, y: 0 }, 'bottom')).toEqual({ x: 160, y: 248, side: 'bottom' })
  })

  it('指定锚点后连线路径与端点跟着变', () => {
    const from = node('a', 0, 0)
    const to = node('b', 0, 300)
    const auto = edgePath(from, to, 'polyline')
    const manual = edgePath(from, to, 'polyline', { from: 'right', to: 'right' })
    expect(manual).not.toBe(auto)
    expect(manual.startsWith('M120 24')).toBe(true)
  })
})

describe('实心块与压在它上面的字', () => {
  it('够读就原样用白字', () => {
    const pair = solidPair('#3a4da3')
    expect(pair).toEqual({ solid: '#3a4da3', ink: '#ffffff' })
  })

  it('差一点就把底色压深一点点，仍用白字', () => {
    // 品牌蓝白字 3.86，压掉 ΔL 0.04 就够——压完还是同一个蓝，识别色不受影响
    const pair = solidPair('#5e7ce0')
    expect(pair.ink).toBe('#ffffff')
    expect(pair.solid).not.toBe('#5e7ce0')
    expect(contrastRatio(pair.solid, pair.ink)).toBeGreaterThanOrEqual(4.5)
  })

  it('压不动就换深字，而不是把橙色一路压成棕色', () => {
    // 警告橙要压掉 ΔL 0.19 才轮得到白字，那时它已经不是这套体系的颜色了
    const pair = solidPair('#fa9841')
    expect(pair.solid).toBe('#fa9841')
    expect(pair.ink).not.toBe('#ffffff')
    expect(contrastRatio(pair.solid, pair.ink)).toBeGreaterThanOrEqual(4.5)
  })

  it('深字带着同一色相，不是纯黑', () => {
    // 纯黑压在彩色块上显得脏
    expect(solidPair('#3ac295').ink).not.toBe('#000000')
    expect(solidPair('#3ac295').ink).not.toBe('#1d2129')
  })

  it('四个语义色都能凑够 4.5', () => {
    for (const fill of ['#5e7ce0', '#3ac295', '#fa9841', '#f66f6a']) {
      const pair = solidPair(fill)
      expect(contrastRatio(pair.solid, pair.ink)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('主题面板换色时这一对跟着推导', () => {
    const tokens = resolveThemeTokens({ ...DEFAULT_THEME_CONFIG, brand: '#ffd43b' }, 'light')
    // 明黄这种浅主题上，白字怎么压都不够——该转深字，而不是硬顶着白字
    expect(contrastRatio(tokens['color-brand-solid'], tokens['color-on-brand'])).toBeGreaterThanOrEqual(4.5)
    expect(tokens['color-on-brand']).not.toBe('#ffffff')
  })
})
