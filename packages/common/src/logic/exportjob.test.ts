/**
 * 导出任务的回归测试。
 *
 * 测的全是「进度条该不该画」「过期之后给什么」「这份表是谁按什么条件导的」——
 * 判错的代价是用户对着一个卡在 90% 的条子不敢离开，或者两个人拿着两份表对账。
 */
import { describe, expect, it } from 'vitest'
import {
  describeExport,
  exportFileName,
  exportProvenance,
  formatStamp,
  humanDuration,
  remainingLife
} from './exportjob'

const now = 1_700_000_000_000

describe('任务状态', () => {
  it('排队中也能取消——这时候取消最省事，不必等它跑完', () => {
    const view = describeExport({ status: 'queued', queuePosition: 3, now })
    expect(view.action).toBe('cancel')
    expect(view.detail).toContain('前面还有 3 个')
  })

  it('轮到自己了说「马上就轮到了」，不说「前面还有 0 个」', () => {
    expect(describeExport({ status: 'queued', queuePosition: 0, now }).detail).toBe('马上就轮到了')
  })

  it('总数未知时不给百分比——假进度条比没有进度条更让人不敢离开', () => {
    const view = describeExport({ status: 'running', processed: 12000, now })
    expect(view.percent).toBeNull()
    expect(view.detail).toBe('已导出 12000 行')
  })

  it('总数已知才给百分比，并把两个数都写出来', () => {
    const view = describeExport({ status: 'running', processed: 3000, total: 12000, now })
    expect(view.percent).toBe(25)
    expect(view.detail).toBe('已导出 3000 / 12000 行')
  })

  it('总数是 0 时不除零，也不画条', () => {
    expect(describeExport({ status: 'running', processed: 0, total: 0, now }).percent).toBeNull()
  })

  it('可下载时说清还能下多久', () => {
    const view = describeExport({ status: 'ready', expiresAt: now + 720_000, now })
    expect(view.action).toBe('download')
    expect(view.detail).toContain('12 分钟')
  })

  it('过了期的 ready 不算 ready：拿到 404 的人会以为是自己权限没了', () => {
    const view = describeExport({ status: 'ready', expiresAt: now - 1, now })
    expect(view.status).toBe('expired')
    expect(view.action).toBe('regenerate')
  })

  it('没有有效期就不编一个出来', () => {
    const view = describeExport({ status: 'ready', now })
    expect(view.detail).toBe('文件已生成')
    expect(view.action).toBe('download')
  })

  it('失败给重试，并把原因说出来；没给原因也要有一句话', () => {
    expect(describeExport({ status: 'failed', error: '超时', now }).detail).toBe('超时')
    expect(describeExport({ status: 'failed', now }).detail).toBe('未知原因')
    expect(describeExport({ status: 'failed', now }).action).toBe('retry')
  })

  it('取消之后明说「没有生成任何文件」', () => {
    const view = describeExport({ status: 'cancelled', now })
    expect(view.detail).toContain('没有生成任何文件')
    expect(view.action).toBe('regenerate')
  })

  it('每一态都有文字标签——颜色不能是唯一线索', () => {
    const states = ['queued', 'running', 'ready', 'expired', 'failed', 'cancelled'] as const
    for (const status of states) {
      expect(describeExport({ status, now }).label.length).toBeGreaterThan(0)
    }
  })

  it('只有排队与生成中算忙，其余都不转圈', () => {
    expect(describeExport({ status: 'queued', now }).busy).toBe(true)
    expect(describeExport({ status: 'running', now }).busy).toBe(true)
    expect(describeExport({ status: 'ready', now }).busy).toBe(false)
  })
})

describe('剩余时间', () => {
  it('向上取整，过期就是 0', () => {
    expect(remainingLife(now + 1500, now)).toBe(2)
    expect(remainingLife(now - 9000, now)).toBe(0)
  })

  it('说成人话时不出现「0 小时」「0 分钟」', () => {
    expect(humanDuration(45)).toBe('45 秒')
    expect(humanDuration(600)).toBe('10 分钟')
    expect(humanDuration(3600)).toBe('1 小时')
    expect(humanDuration(3660)).toBe('1 小时 1 分钟')
    expect(humanDuration(0)).toBe('已过期')
  })
})

describe('时间排版', () => {
  const parts = { year: 2026, month: 9, day: 5, hour: 4, minute: 7 }

  it('月日时分都补零', () => {
    expect(formatStamp(parts)).toBe('2026-09-05 04:07')
  })

  it('文件名里换成连字符，不出现冒号', () => {
    expect(formatStamp(parts, '-')).toBe('2026-09-05-04-07')
  })

  it('只接受拆好的数字，不碰时区——时区留给各端自己转', () => {
    // 这条测的是签名本身：换了时区，这个函数的输出不该跟着变
    expect(formatStamp({ ...parts, hour: 23 })).toBe('2026-09-05 23:07')
  })
})

describe('出处', () => {
  const meta = {
    subject: '销售订单',
    createdAt: now,
    filters: ['负责人：林岚', '状态：已发货'],
    columns: ['单号', '客户', '金额'],
    rows: 8000
  }

  it('四样都在：内容、时间、筛选、列与行数', () => {
    const lines = exportProvenance(meta)
    expect(lines.join('\n')).toContain('销售订单')
    expect(lines.join('\n')).toContain('负责人：林岚；状态：已发货')
    expect(lines.join('\n')).toContain('单号、客户、金额')
    expect(lines.join('\n')).toContain('8000')
  })

  it('没有筛选也要明写「全量」——留空既可能是全量，也可能是忘了记', () => {
    const lines = exportProvenance({ subject: '销售订单', createdAt: now })
    expect(lines.some((l) => l.includes('没有筛选条件（全量）'))).toBe(true)
  })

  it('文件名带主题、时间与筛选摘要——都叫 export.csv 的两份谁也说不清', () => {
    const name = exportFileName(meta)
    expect(name.startsWith('销售订单_')).toBe(true)
    expect(name.endsWith('.csv')).toBe(true)
    expect(name).toContain('负责人：林岚'.replace(/\s/g, ''))
  })

  it('文件系统不认识的字符换成下划线——冒号与斜杠在 Windows 上存不下来', () => {
    const name = exportFileName({ subject: '销售/订单 表', createdAt: now })
    expect(name).not.toMatch(/[\\/:*?"<>|]/)
    expect(name).toContain('销售_订单_表')
  })
})
