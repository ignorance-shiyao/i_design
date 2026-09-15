/**
 * 批量导入的回归测试。
 *
 * 测的全是「预检有没有写东西」「映射改不改得动」「重发会不会导两份」——
 * 判错的代价是用户点了取消而数据已经脏了，或者同一批货导进去两遍。
 */
import { describe, expect, it } from 'vitest'
import {
  assignMapping,
  canProceed,
  clearMapping,
  dryRun,
  guessMapping,
  importKey,
  mappingIssues,
  problemsCsv
} from './importjob'

const sources = [
  { key: '客户', sample: '明远制造' },
  { key: '联系人', sample: '林岚' },
  { key: '备注', sample: '急' }
]
const fields = [
  { key: 'customer', label: '客户', required: true },
  { key: 'owner', label: '负责人', required: true, aliases: ['联系人'] },
  { key: 'note', label: '备注' },
  { key: 'amount', label: '金额', required: true }
]

describe('列映射', () => {
  it('按名字与别名猜一版当默认值', () => {
    const mapping = guessMapping(sources, fields)
    expect(mapping.customer).toBe('客户')
    // 表头叫「联系人」而字段叫「负责人」是常态，别名得管用
    expect(mapping.owner).toBe('联系人')
    expect(mapping.note).toBe('备注')
    expect(mapping.amount).toBeNull()
  })

  it('一个来源列只会被猜中一次，先到先得', () => {
    const twins = [
      { key: 'name', label: '客户', required: true },
      { key: 'alias', label: '客户' }
    ]
    const mapping = guessMapping([{ key: '客户' }], twins)
    expect(mapping.name).toBe('客户')
    expect(mapping.alias).toBeNull()
  })

  it('必填没映上是 error，选填没映上只是 warning', () => {
    const issues = mappingIssues(guessMapping(sources, fields), fields)
    const amount = issues.find((i) => i.field === 'amount')!
    expect(amount.level).toBe('error')
    expect(canProceed(issues)).toBe(false)
  })

  it('选填留空不拦人：那一列会留空，是个合法的选择', () => {
    const mapping = { customer: '客户', owner: '联系人', note: null, amount: '备注' }
    const issues = mappingIssues(mapping, fields)
    expect(issues.every((i) => i.level === 'warning')).toBe(true)
    expect(canProceed(issues)).toBe(true)
  })

  it('一个来源列映给两个字段是 error——多半是手滑', () => {
    const mapping = { customer: '客户', owner: '客户', note: null, amount: '备注' }
    const issues = mappingIssues(mapping, fields)
    expect(issues.some((i) => i.level === 'error' && i.message.includes('同时映给'))).toBe(true)
  })

  it('映射是数据：改得动、能清掉', () => {
    const mapping = guessMapping(sources, fields)
    expect(clearMapping(mapping, 'customer').customer).toBeNull()
    expect(assignMapping(mapping, 'amount', '备注').amount).toBe('备注')
  })

  it('把一个已被占用的来源列指给别人时，先从原处摘掉', () => {
    // 不摘的话就会悄悄变成「一列映给两个字段」，而用户以为自己只改了一处
    const mapping = guessMapping(sources, fields)
    const next = assignMapping(mapping, 'amount', '备注')
    expect(next.note).toBeNull()
    expect(next.amount).toBe('备注')
  })
})

describe('预校验', () => {
  const rows = [
    { customer: '明远制造', amount: 100 },
    { customer: '', amount: 100 },
    { customer: '合力重工', amount: -1 }
  ]
  const validate = (row: { customer: string; amount: number }) => {
    const out = []
    if (!row.customer) out.push({ column: '客户', message: '客户为空' })
    if (row.amount < 0) out.push({ column: '金额', message: '金额不能为负' })
    return out
  }

  it('报告里的 wrote 永远是 false——它是契约的一部分', () => {
    // 预检一旦落库，用户看完报告点了取消，数据已经脏了
    expect(dryRun(rows, validate).wrote).toBe(false)
    expect(dryRun([], validate).wrote).toBe(false)
  })

  it('行号从 1 起，且是文件里的原始行号', () => {
    const report = dryRun(rows, validate)
    expect(report.okRows).toEqual([1])
    expect(report.problems.map((p) => p.row)).toEqual([2, 3])
  })

  it('一行上的多个问题各记一条，不合并成一句', () => {
    const report = dryRun([{ customer: '', amount: -1 }], validate)
    expect(report.problems).toHaveLength(2)
  })

  it('摘要把能导的那部分也说出来，而不是只报坏消息', () => {
    expect(dryRun(rows, validate).summary).toContain('其余 1 行可以导入')
    expect(dryRun([rows[0]], validate).summary).toContain('都能导入')
  })
})

describe('错误清单', () => {
  it('第一列是原始行号：用户手里那份是几千行的表格', () => {
    const csv = problemsCsv([{ row: 3, column: '客户', message: '客户为空' }])
    expect(csv.split('\n')[0]).toBe('行号,列,问题')
    expect(csv.split('\n')[1]).toBe('3,客户,客户为空')
  })

  it('带逗号与引号的值按 CSV 规矩转义——客户名里带逗号是常事', () => {
    const csv = problemsCsv([{ row: 1, column: '客户', message: '「明远,制造」不存在' }])
    expect(csv.split('\n')[1]).toBe('1,客户,"「明远,制造」不存在"')
    const quoted = problemsCsv([{ row: 1, message: '含"引号"' }])
    expect(quoted.split('\n')[1]).toBe('1,,"含""引号"""')
  })
})

describe('幂等键', () => {
  const mapping = { customer: '客户', owner: '联系人', note: null }

  it('同一份文件 + 同一套映射算出同一个键', () => {
    expect(importKey('sha-1', mapping)).toBe(importKey('sha-1', { ...mapping }))
  })

  it('映射相同但键的书写顺序不同，仍是同一个键', () => {
    // 对象顺序跟用户点映射的顺序有关，不排序的话幂等立刻失效
    const reordered = { note: null, owner: '联系人', customer: '客户' }
    expect(importKey('sha-1', reordered)).toBe(importKey('sha-1', mapping))
  })

  it('换了文件或换了映射就是另一次导入', () => {
    expect(importKey('sha-2', mapping)).not.toBe(importKey('sha-1', mapping))
    expect(importKey('sha-1', { ...mapping, note: '备注' })).not.toBe(importKey('sha-1', mapping))
  })
})
