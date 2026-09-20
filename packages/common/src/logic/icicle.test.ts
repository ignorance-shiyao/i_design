import { describe, expect, it } from 'vitest'
import { buildHierarchy, hierarchyView, type HierarchyInput } from './hierarchy'
import { icicleCells, icicleHeight } from './icicle'
import { sunburstSectors } from './sunburst'

const tree: HierarchyInput[] = [
  { id: 'a', parentId: null, label: 'A', value: null },
  { id: 'a1', parentId: 'a', label: 'A1', value: 30 },
  { id: 'a2', parentId: 'a', label: 'A2', value: 20 },
  { id: 'b', parentId: null, label: 'B', value: 50 }
]

describe('Icicle 几何', () => {
  it('第一层铺满整幅宽度，下一层在它下面按比例分', () => {
    const cells = icicleCells(buildHierarchy(tree).nodes, { width: 400, rowHeight: 20 })
    const byId = new Map(cells.map((c) => [c.id, c]))
    expect(byId.get('a')!.x).toBe(0)
    expect(byId.get('a')!.width).toBe(200)
    expect(byId.get('b')!.x).toBe(200)
    expect(byId.get('b')!.width).toBe(200)
    expect(byId.get('a1')!.y).toBe(20)
    expect(byId.get('a1')!.width).toBe(120)
    // 子级左右相接，且不越出父级
    expect(byId.get('a2')!.x).toBe(byId.get('a1')!.x + byId.get('a1')!.width)
    expect(byId.get('a2')!.x + byId.get('a2')!.width).toBe(byId.get('a')!.x + byId.get('a')!.width)
  })

  it('和旭日共用同一份顺序与取色号——两张图在同一份数据上必须对得上', () => {
    const model = buildHierarchy(tree)
    const cells = icicleCells(model.nodes)
    const sectors = sunburstSectors(model.nodes)
    expect(cells.map((c) => c.id)).toEqual(sectors.map((s) => s.id))
    expect(cells.map((c) => c.colorIndex)).toEqual(sectors.map((s) => s.colorIndex))
  })

  it('画布高度按实际画出来的层数算，空数据时是 0 而不是一条空白带', () => {
    const model = buildHierarchy(tree)
    expect(icicleHeight(model.nodes, { rowHeight: 20 })).toBe(40)
    expect(icicleHeight(model.nodes, { rowHeight: 20, maxDepth: 0 })).toBe(20)
    expect(icicleHeight(buildHierarchy([]).nodes, { rowHeight: 20 })).toBe(0)
  })

  it('下钻之后焦点那一支铺满整幅宽度', () => {
    const model = buildHierarchy(tree)
    const cells = icicleCells(hierarchyView(model, 'a'), { width: 400 })
    expect(cells[0].id).toBe('a')
    expect(cells[0].x).toBe(0)
    expect(cells[0].width).toBe(400)
    expect(cells[0].y).toBe(0)
  })

  it('窄到写不下标签的格子标出来，免得文字溢到隔壁格子上', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'wide', parentId: 'r', label: '很宽的一格', value: 95 },
      { id: 'narrow', parentId: 'r', label: '很窄的一格', value: 5 }
    ])
    const cells = icicleCells(model.nodes, { width: 600, charWidth: 14 })
    expect(cells.find((c) => c.id === 'wide')!.labelFits).toBe(true)
    expect(cells.find((c) => c.id === 'narrow')!.labelFits).toBe(false)
  })

  it('细到看不见的格子不画', () => {
    const model = buildHierarchy([
      { id: 'r', parentId: null, label: '根', value: null },
      { id: 'most', parentId: 'r', label: '几乎全部', value: 1_000_000 },
      { id: 'dust', parentId: 'r', label: '一粒灰', value: 0.00001 }
    ])
    expect(icicleCells(model.nodes, { width: 600 }).some((c) => c.id === 'dust')).toBe(false)
  })

  it('「未细分」带着类型出来，渲染层才能把它画成中性色', () => {
    const model = buildHierarchy([
      { id: 'p', parentId: null, label: '父', value: 100 },
      { id: 'c', parentId: 'p', label: '子', value: 60 }
    ])
    const rest = icicleCells(model.nodes, { width: 100 }).find((c) => c.kind === 'rest')!
    expect(rest.width).toBeCloseTo(40)
    expect(rest.x).toBeCloseTo(60)
  })
})

describe('百分比那一组', () => {
  it('和像素那一组描述同一件事，只是换了单位', () => {
    const cells = icicleCells(buildHierarchy(tree).nodes, { width: 400 })
    for (const cell of cells) {
      expect(cell.xPercent).toBeCloseTo((cell.x / 400) * 100, 2)
      expect(cell.widthPercent).toBeCloseTo((cell.width / 400) * 100, 2)
    }
  })

  it('百分比不随传入的宽度变，像素随宽度变——HTML 端才能既排得准又不缩字', () => {
    const narrow = icicleCells(buildHierarchy(tree).nodes, { width: 200 })
    const wide = icicleCells(buildHierarchy(tree).nodes, { width: 800 })
    expect(narrow.map((c) => c.xPercent)).toEqual(wide.map((c) => c.xPercent))
    expect(narrow.map((c) => c.width)).not.toEqual(wide.map((c) => c.width))
  })
})
