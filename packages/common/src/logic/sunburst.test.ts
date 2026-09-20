import { describe, expect, it } from 'vitest'
import { buildHierarchy, hierarchyView, type HierarchyInput } from './hierarchy'
import { CHART_PALETTE_SIZE, sunburstSectors } from './sunburst'

const tree: HierarchyInput[] = [
  { id: 'a', parentId: null, label: 'A', value: null },
  { id: 'a1', parentId: 'a', label: 'A1', value: 30 },
  { id: 'a2', parentId: 'a', label: 'A2', value: 20 },
  { id: 'b', parentId: null, label: 'B', value: 50 }
]

describe('旭日图几何', () => {
  it('从十二点开始顺时针走', () => {
    const [first] = sunburstSectors(buildHierarchy(tree).nodes)
    expect(first.a0).toBeCloseTo(-Math.PI / 2)
    expect(first.a1).toBeGreaterThan(first.a0)
  })

  it('整圈拆成两个半弧，否则 SVG 画出来是一个点', () => {
    const single = buildHierarchy([{ id: 'only', parentId: null, label: '唯一', value: 1 }])
    const [sector] = sunburstSectors(single.nodes)
    expect(sector.a1 - sector.a0).toBeCloseTo(Math.PI * 2)
    // 两段外弧 + 两段内弧，起止点不重合才画得出来
    expect(sector.path.match(/A /g)).toHaveLength(4)
    expect(sector.path).not.toMatch(/A [\d.]+ [\d.]+ 0 [01] 1 NaN/)
  })

  it('半圈以上用 large-arc 标志，否则会画成短的那一边', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'big', parentId: 'r', label: '大', value: 90 },
      { id: 'small', parentId: 'r', label: '小', value: 10 }
    ])
    const big = sunburstSectors(model.nodes).find((s) => s.id === 'big')!
    const small = sunburstSectors(model.nodes).find((s) => s.id === 'small')!
    expect(big.path).toContain(' 0 1 1 ')
    expect(small.path).toContain(' 0 0 1 ')
  })

  it('环宽按实际要画的层数均分，下钻之后把剩下的层撑满', () => {
    const model = buildHierarchy(tree)
    const full = sunburstSectors(model.nodes, { size: 200, innerRadius: 20 })
    // 两层：(100 - 20) / 2 = 40
    expect(full[0].r1 - full[0].r0).toBeCloseTo(40)

    const drilled = sunburstSectors(hierarchyView(model, 'a'), { size: 200, innerRadius: 20 })
    expect(drilled[0].r1 - drilled[0].r0).toBeCloseTo(40)
    const a = drilled.find((s) => s.id === 'a')!
    expect(a.a1 - a.a0).toBeCloseTo(Math.PI * 2)
  })

  it('maxDepth 之外的层不画，环宽跟着重新均分', () => {
    const model = buildHierarchy(tree)
    const shallow = sunburstSectors(model.nodes, { size: 200, innerRadius: 20, maxDepth: 0 })
    expect(shallow.map((s) => s.id).sort()).toEqual(['a', 'b'])
    expect(shallow[0].r1 - shallow[0].r0).toBeCloseTo(80)
  })

  it('细到看不见的扇段不画——画出来是一条看不见的缝，却能被 Tab 到', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'most', parentId: 'r', label: '几乎全部', value: 1_000_000 },
      { id: 'dust', parentId: 'r', label: '一粒灰', value: 0.00001 }
    ])
    expect(sunburstSectors(model.nodes).some((s) => s.id === 'dust')).toBe(false)
  })

  it('同层扇段首尾相接，不重叠也不留缝', () => {
    const sectors = sunburstSectors(buildHierarchy(tree).nodes).filter((s) => s.depth === 1)
    for (let i = 1; i < sectors.length; i += 1) {
      expect(sectors[i].a0).toBeCloseTo(sectors[i - 1].a1)
    }
  })

  it('扇段中点落在环带正中，可以直接拿来放标签', () => {
    const [sector] = sunburstSectors(buildHierarchy(tree).nodes, { size: 200, innerRadius: 20 })
    const r = Math.hypot(sector.cx - 100, sector.cy - 100)
    expect(r).toBeCloseTo((sector.r0 + sector.r1) / 2, 1)
  })

  it('「未细分」带着自己的类型出来，渲染层才能把它画成另一种填充', () => {
    const model = buildHierarchy([
      { id: 'p', parentId: null, label: '父', value: 100 },
      { id: 'c', parentId: 'p', label: '子', value: 60 }
    ])
    const rest = sunburstSectors(model.nodes).find((s) => s.kind === 'rest')!
    expect(rest.label).toContain('未细分')
    expect(rest.a1 - rest.a0).toBeCloseTo(Math.PI * 2 * 0.4)
  })
})

describe('旭日图取色', () => {
  it('同一支的各层同色，不同支不同色', () => {
    const sectors = sunburstSectors(buildHierarchy(tree).nodes)
    const byId = new Map(sectors.map((s) => [s.id, s]))
    expect(byId.get('a1')!.colorIndex).toBe(byId.get('a')!.colorIndex)
    expect(byId.get('a2')!.colorIndex).toBe(byId.get('a')!.colorIndex)
    expect(byId.get('b')!.colorIndex).not.toBe(byId.get('a')!.colorIndex)
  })

  it('下钻之后焦点那一支仍用它原来的颜色，不会整张图换个色', () => {
    const model = buildHierarchy(tree)
    const full = sunburstSectors(model.nodes)
    const drilled = sunburstSectors(hierarchyView(model, 'b'))
    expect(drilled[0].colorIndex).toBe(full.find((s) => s.id === 'b')!.colorIndex)
  })
})

describe('超出调色板的支', () => {
  it('第九支的取色号越界，渲染层据此改用中性色而不是绕回第一个色', () => {
    const input = Array.from({ length: 9 }, (_, i) => ({
      id: `r${i}`,
      parentId: null,
      label: `第 ${i + 1} 支`,
      value: 9 - i
    }))
    const sectors = sunburstSectors(buildHierarchy(input).nodes)
    const ninth = sectors.find((s) => s.id === 'r8')!
    expect(ninth.colorIndex).toBe(8)
    expect(ninth.colorIndex).toBeGreaterThanOrEqual(CHART_PALETTE_SIZE)
  })
})
