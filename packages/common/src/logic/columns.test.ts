import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VIEW_ID,
  applyView,
  defaultColumnState,
  fixColumn,
  moveColumn,
  parseViews,
  removeView,
  resetColumns,
  resizeColumn,
  resolveTableColumns,
  restrictedTableColumns,
  saveView,
  serializeViews,
  setDensity,
  toggleColumn,
  visibleTableColumns,
  type ColumnSpec,
  type TableView
} from './columns'

const columns: ColumnSpec[] = [
  { key: 'id', title: '单号', width: '120px', locked: true },
  { key: 'customer', title: '客户' },
  { key: 'cost', title: '成本价', width: '120px', restricted: true },
  { key: 'amount', title: '金额', width: '140px' }
]

describe('显隐', () => {
  it('默认全部显示', () => {
    expect(visibleTableColumns(columns, defaultColumnState(columns))).toHaveLength(4)
  })

  it('藏起来的列不渲染', () => {
    const state = toggleColumn(defaultColumnState(columns), 'cost', columns)
    expect(visibleTableColumns(columns, state).map((c) => c.key)).not.toContain('cost')
  })

  it('锁定列藏不掉——主键藏掉之后行就认不出来了', () => {
    const state = toggleColumn(defaultColumnState(columns), 'id', columns)
    expect(visibleTableColumns(columns, state).map((c) => c.key)).toContain('id')
  })

  it('不允许把所有列都藏掉', () => {
    let state = defaultColumnState([{ key: 'a', title: 'A' }])
    state = toggleColumn(state, 'a', [{ key: 'a', title: 'A' }])
    expect(visibleTableColumns([{ key: 'a', title: 'A' }], state)).toHaveLength(1)
  })

  it('隐藏与权限是两件事：藏掉成本列不影响它仍然受权限控制', () => {
    const state = toggleColumn(defaultColumnState(columns), 'cost', columns)
    expect(visibleTableColumns(columns, state).map((c) => c.key)).not.toContain('cost')
    expect(restrictedTableColumns(columns)).toContain('cost')
  })
})

describe('顺序与新增列', () => {
  it('顺序以设置为准', () => {
    const state = moveColumn(defaultColumnState(columns), 3, 0)
    expect(resolveTableColumns(columns, state).map((c) => c.key)).toEqual(['amount', 'id', 'customer', 'cost'])
  })

  it('越界的移动不动', () => {
    const state = defaultColumnState(columns)
    expect(moveColumn(state, 9, 0)).toBe(state)
  })

  it('保存视图之后新增的列仍然出现，并默认显示——否则用户永远看不到它', () => {
    const state = defaultColumnState(columns)
    const withNew = [...columns, { key: 'tax', title: '税额' }]
    const resolved = resolveTableColumns(withNew, state)
    expect(resolved.map((c) => c.key)).toContain('tax')
    expect(resolved.find((c) => c.key === 'tax')!.hidden).toBe(false)
  })

  it('已经删掉的列不会因为存在旧设置而复活', () => {
    const state = defaultColumnState(columns)
    expect(resolveTableColumns(columns.slice(0, 2), state).map((c) => c.key)).toEqual(['id', 'customer'])
  })
})

describe('宽度与固定', () => {
  it('改宽度只改那一列', () => {
    const state = resizeColumn(defaultColumnState(columns), 'customer', '320px')
    expect(resolveTableColumns(columns, state).find((c) => c.key === 'customer')!.width).toBe('320px')
  })

  it('固定列生效', () => {
    const { state, rejected } = fixColumn(defaultColumnState(columns), 'id', 'left', { viewportWidth: 960 })
    expect(rejected).toBeUndefined()
    expect(resolveTableColumns(columns, state).find((c) => c.key === 'id')!.fixed).toBe('left')
  })

  it('固定总宽超过可视宽度一半时拒绝，并说清为什么', () => {
    let state = fixColumn(defaultColumnState(columns), 'id', 'left', { viewportWidth: 400 }).state
    const second = fixColumn(state, 'amount', 'left', { viewportWidth: 400 })
    expect(second.rejected).toMatch(/没有可滚动的区域/)
    expect(resolveTableColumns(columns, second.state).find((c) => c.key === 'amount')!.fixed).toBeNull()
  })

  it('取消固定不受上限限制', () => {
    const fixed = fixColumn(defaultColumnState(columns), 'id', 'left', { viewportWidth: 400 }).state
    expect(fixColumn(fixed, 'id', null, { viewportWidth: 400 }).rejected).toBeUndefined()
  })
})

describe('密度与视图', () => {
  it('密度只改密度', () => {
    expect(setDensity(defaultColumnState(columns), 'compact').density).toBe('compact')
  })

  it('默认视图不可覆盖——它是「恢复默认」的出口', () => {
    const view: TableView = { id: DEFAULT_VIEW_ID, name: '默认', settings: [], density: 'default' }
    expect(() => saveView([], view)).toThrow(/默认视图不可覆盖/)
    expect(removeView([{ ...view }], DEFAULT_VIEW_ID)).toHaveLength(1)
  })

  it('同 id 再存是覆盖而不是追加', () => {
    const a: TableView = { id: 'mine', name: '我的', settings: [], density: 'default' }
    const views = saveView(saveView([], a), { ...a, name: '我的（改）' })
    expect(views).toHaveLength(1)
    expect(views[0].name).toBe('我的（改）')
  })

  it('应用视图后可以一键回到默认', () => {
    const view: TableView = {
      id: 'mine',
      name: '我的',
      settings: [{ key: 'amount', hidden: true }],
      density: 'compact'
    }
    const applied = applyView(view)
    expect(applied.density).toBe('compact')
    expect(resetColumns(columns).density).toBe('default')
    expect(visibleTableColumns(columns, resetColumns(columns))).toHaveLength(4)
  })

  it('应用视图不共享引用：改了当前设置不该把存下的视图也改掉', () => {
    const view: TableView = {
      id: 'mine',
      name: '我的',
      settings: [{ key: 'amount', hidden: true }],
      density: 'compact'
    }
    const applied = applyView(view)
    applied.settings[0].hidden = false
    expect(view.settings[0].hidden).toBe(true)
  })
})

describe('持久化', () => {
  const view: TableView = { id: 'mine', name: '我的', settings: [{ key: 'id' }], density: 'loose' }

  it('往返无损', () => {
    expect(parseViews(serializeViews([view])).views).toEqual([view])
  })

  it('版本对不上时退回默认并说出来，而不是把旧结构当新结构解释', () => {
    const r = parseViews(JSON.stringify({ version: 0, views: [view] }))
    expect(r.views).toEqual([])
    expect(r.issue).toMatch(/第 0 版/)
  })

  it('坏掉的存储不炸，退回默认', () => {
    expect(parseViews('{ 不是 JSON').views).toEqual([])
    expect(parseViews('{"version":1}').issue).toMatch(/结构不对/)
  })
})
