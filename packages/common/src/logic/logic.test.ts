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
import { qrMatrix, qrVersionFor } from './qrcode'
import { avatarSizePx, initialsOf, tintOf } from './avatar'
import { safeHref } from './href'
import { floatActionDelay, floatActionOffset, floatActionShift } from './float'
import { isSplitterResetKey, paneRatio, resetPaneSize } from './splitter'

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
