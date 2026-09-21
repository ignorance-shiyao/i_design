import { describe, expect, it } from 'vitest'
import {
  buildBalance,
  checkFlowBalance,
  type BalanceItemInput,
  type FlowBalanceNodeInput
} from './balance'

const items: BalanceItemInput[] = [
  { id: 'new', label: '新签', value: 42 },
  { id: 'churn', label: '流失', value: -18 },
  { id: 'upsell', label: '增购', value: 9 },
  { id: 'flat', label: '未续未退', value: 0 }
]

describe('贡献（带符号）', () => {
  it('负贡献是数据不是脏数据，照样进账', () => {
    const model = buildBalance(items, { start: 100, unit: ' 万' })
    const churn = model.steps.find((step) => step.id === 'churn')!
    expect(churn.value).toBe(-18)
    expect(churn.direction).toBe('down')
    expect(churn.valueText).toBe('-18 万')
    expect(model.excluded).toHaveLength(0)
    expect(model.end).toBe(133)
  })

  it('台阶首尾相接：每一段从上一段的累计起步', () => {
    const model = buildBalance(items, { start: 100 })
    const changes = model.steps.filter((step) => step.kind === 'change')
    expect(changes[0].from).toBe(100)
    expect(changes[0].to).toBe(142)
    expect(changes[1].from).toBe(142)
    expect(changes[1].to).toBe(124)
    for (let i = 1; i < changes.length; i += 1) {
      expect(changes[i].from).toBe(changes[i - 1].to)
    }
  })

  it('对不上的差额单列，不摊进最后一根柱子', () => {
    // 100 + 33 = 133，而期末声称 140，差 7
    const model = buildBalance(items, { start: 100, end: 140, unit: ' 万' })
    const gap = model.steps.find((step) => step.kind === 'gap')!
    expect(model.gap).toBe(7)
    expect(gap.value).toBe(7)
    expect(gap.label).toBe('未解释的差额')
    expect(gap.description).toContain('没有对应的项目')
    expect(model.caption).toContain('账没平')
    // 最后一根柱子仍然是声称的期末，没有被改写
    expect(model.steps[model.steps.length - 1].value).toBe(140)
  })

  it('对得上时不凭空多出一根柱子', () => {
    const model = buildBalance(items, { start: 100, end: 133 })
    expect(model.gap).toBe(0)
    expect(model.steps.some((step) => step.kind === 'gap')).toBe(false)
    expect(model.caption).toContain('账是平的')
  })

  it('不给期末就不存在对不对得上的问题，合计即期末', () => {
    const model = buildBalance(items, { start: 100 })
    expect(model.end).toBe(133)
    expect(model.gap).toBe(0)
    expect(model.caption).not.toContain('账')
  })

  it('坐标轴恒含 0，累计跌到负的也画得出来', () => {
    const model = buildBalance([{ id: 'a', label: '大额流失', value: -150 }], { start: 100 })
    expect(model.end).toBe(-50)
    expect(model.min).toBe(-50)
    expect(model.max).toBe(100)

    // 全程都在 0 以上时，下界仍然是 0——不含 0 会把「涨了一点」画得像「翻了一倍」
    const up = buildBalance([{ id: 'a', label: '涨一点', value: 2 }], { start: 100 })
    expect(up.min).toBe(0)
    expect(up.max).toBe(102)
  })

  it('0 是「这项没动」，缺失是「这项没报上来」，两者不混为一谈', () => {
    const model = buildBalance(
      [...items, { id: 'todo', label: '待补录', value: null }],
      { start: 100 }
    )
    expect(model.steps.some((step) => step.id === 'flat')).toBe(true)
    expect(model.steps.find((step) => step.id === 'flat')!.direction).toBe('flat')
    expect(model.steps.some((step) => step.id === 'todo')).toBe(false)
    expect(model.excluded[0].reason).toContain('缺失不是 0')
  })

  it('占比按全部变动的绝对值之和算，正负都算「折腾了多少」', () => {
    const model = buildBalance(items, { start: 100 })
    // 42 + 18 + 9 + 0 = 69
    expect(model.churn).toBe(69)
    expect(model.steps.find((step) => step.id === 'churn')!.share).toBeCloseTo(18 / 69)
    // 期初期末不参与占比
    expect(model.steps[0].share).toBeNull()
    expect(model.steps[model.steps.length - 1].share).toBeNull()
  })

  it('顺序照输入给的来——重排会把因果讲反', () => {
    const model = buildBalance(items, { start: 100 })
    expect(model.steps.filter((s) => s.kind === 'change').map((s) => s.id)).toEqual([
      'new',
      'churn',
      'upsell',
      'flat'
    ])
  })

  it('空 ID、重复 ID、与保留 ID 冲突、期初期末不是数，都判无效', () => {
    expect(buildBalance([{ id: '', label: '', value: 1 }]).caption).toContain('不能为空')
    expect(
      buildBalance([
        { id: 'a', label: 'A', value: 1 },
        { id: 'a', label: '又一个', value: 1 }
      ]).caption
    ).toContain('重复')
    expect(buildBalance([{ id: '__gap', label: '假的', value: 1 }]).caption).toContain('冲突')
    expect(buildBalance(items, { start: Number.NaN }).state).toBe('invalid')
    expect(buildBalance(items, { end: Number.POSITIVE_INFINITY }).state).toBe('invalid')
  })

  it('空数据不遗留旧台阶', () => {
    expect(buildBalance([]).state).toBe('empty')
    expect(buildBalance([]).steps).toHaveLength(0)
  })

  it('不修改入参', () => {
    const input = structuredClone(items)
    buildBalance(input, { start: 100, end: 140 })
    expect(input).toEqual(items)
  })
})

const flows: FlowBalanceNodeInput[] = [
  { id: 'warehouse', label: '仓库', inflow: 100, outflow: 100 },
  { id: 'transit', label: '在途', inflow: 100, outflow: 95 },
  { id: 'store', label: '门店', inflow: 95, outflow: 98 }
]

describe('流量平衡', () => {
  it('逐节点核对进出，差额摆出来但不替谁解释', () => {
    const model = checkFlowBalance(flows, { unit: ' 件' })
    expect(model.nodes[0].balanced).toBe(true)
    expect(model.nodes[1].residual).toBe(5)
    expect(model.nodes[1].balanced).toBe(false)
    expect(model.nodes[1].description).toContain('不替你回答')
    // 出得比进得多同样算对不上，不是「负的留存」
    expect(model.nodes[2].residual).toBe(-3)
    expect(model.nodes[2].balanced).toBe(false)
    expect(model.unbalanced).toBe(2)
    expect(model.caption).toContain('2 个进出对不上')
  })

  it('容差按节点自身规模取相对值，不是一个写死的绝对值', () => {
    const big = checkFlowBalance([
      { id: 'a', label: '大账', inflow: 1e9, outflow: 1e9 + 0.5 }
    ])
    const small = checkFlowBalance([
      { id: 'a', label: '小账', inflow: 1, outflow: 1.5 }
    ])
    // 同样差 0.5：大账里是舍入噪声，小账里是一半
    expect(big.nodes[0].balanced).toBe(true)
    expect(small.nodes[0].balanced).toBe(false)
  })

  it('缺数的节点不当成 0 核对，列为无法核对', () => {
    const model = checkFlowBalance([
      { id: 'a', label: '没报流出', inflow: 10, outflow: null },
      ...flows
    ])
    expect(model.nodes.some((node) => node.id === 'a')).toBe(false)
    expect(model.excluded[0].reason).toContain('缺失不是 0')
    expect(model.caption).toContain('无法核对')
  })

  it('空数据与空 ID、重复 ID 各有各的说法', () => {
    expect(checkFlowBalance([]).state).toBe('empty')
    expect(checkFlowBalance([{ id: '', label: '', inflow: 1, outflow: 1 }]).state).toBe('invalid')
    expect(
      checkFlowBalance([
        { id: 'a', label: 'A', inflow: 1, outflow: 1 },
        { id: 'a', label: 'A2', inflow: 1, outflow: 1 }
      ]).state
    ).toBe('invalid')
  })
})
