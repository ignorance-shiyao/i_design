/**
 * ProTable 的列能力（astra.md 的 B05）：显隐、顺序、宽度、固定、密度、保存的视图。
 *
 * 三件事值得先说清楚：
 *
 * 1. **隐藏列不等于没有这一列。** 列被藏起来只影响显示，不影响权限与导出口径——
 *    真实事故是：有人把「成本价」列藏了，于是导出时也跳过了它的权限校验，
 *    结果无权看成本的人导出的文件里有成本。所以这里的隐藏只产出 visible，
 *    权限字段单独保留在 `restricted`，两者不许合并。
 * 2. **固定列要有上限。** 全固定等于没固定，还会让窄屏上没有可滚动的区域。
 *    超过可视宽度一半的固定列在这里就被拒绝，而不是等到界面上挤成一团。
 * 3. **视图要能重置。** 存了一份自己的列设置之后，用户最需要的是「回到默认」——
 *    没有这个出口，调乱了的表格就永远乱着。
 */
export type ColumnFixed = 'left' | 'right' | null

export type TableDensity = 'compact' | 'default' | 'loose'

export interface ColumnSpec {
  key: string
  title: string
  /** 默认宽度，CSS 长度。不给则由内容决定 */
  width?: string
  /** 这一列是否受权限控制。隐藏它不影响这个标记 */
  restricted?: boolean
  /** 不允许用户隐藏（例如主键列）。藏掉之后行就认不出来了 */
  locked?: boolean
  sortable?: boolean
}

export interface ColumnSetting {
  key: string
  hidden?: boolean
  width?: string
  fixed?: ColumnFixed
}

export interface TableView {
  /** 视图 id；'default' 是内置的那一份，不可覆盖 */
  id: string
  name: string
  settings: ColumnSetting[]
  density: TableDensity
}

export interface ColumnState {
  /** 用户调整过的列设置，按当前顺序排列 */
  settings: ColumnSetting[]
  density: TableDensity
}

export const DENSITY_ROW_HEIGHT: Record<TableDensity, number> = {
  compact: 32,
  default: 40,
  loose: 52
}

/** 默认状态：全部显示、原始顺序、不固定 */
export function defaultColumnState(columns: ColumnSpec[]): ColumnState {
  return {
    settings: columns.map((c) => ({ key: c.key, width: c.width, fixed: null })),
    density: 'default'
  }
}

/**
 * 解析出实际要渲染的列。
 *
 * 顺序以 settings 为准，settings 里没有的列（新版本加的）追加在末尾并默认显示——
 * 丢掉它们的话，用户存过一次视图之后就再也看不到后来新增的列，
 * 而他完全不知道有这么一列存在。
 */
// 名字带 Table：logic/picker 里已经有一个 resolveColumns（选择器的列），
// 两者撞名的话，谁先被 import 进来谁说了算，而那种错只在运行时才看得见
export function resolveTableColumns(columns: ColumnSpec[], state: ColumnState) {
  const byKey = new Map(columns.map((c) => [c.key, c]))
  const known = new Set(state.settings.map((s) => s.key))
  const ordered: ColumnSetting[] = [
    ...state.settings.filter((s) => byKey.has(s.key)),
    ...columns
      .filter((c) => !known.has(c.key))
      .map((c) => ({ key: c.key, width: c.width, fixed: null as ColumnFixed }))
  ]

  return ordered.map((setting) => {
    const spec = byKey.get(setting.key)!
    return {
      ...spec,
      width: setting.width ?? spec.width,
      fixed: setting.fixed ?? null,
      // 锁定列不许隐藏：主键藏掉之后行就认不出来了
      hidden: spec.locked ? false : !!setting.hidden
    }
  })
}

export const visibleTableColumns = (columns: ColumnSpec[], state: ColumnState) =>
  resolveTableColumns(columns, state).filter((c) => !c.hidden)

/**
 * 受权限控制的列，与显隐无关。
 *
 * 导出与接口按它做校验——把它和 visible 合并的话，用户藏掉一列就等于
 * 跳过了那一列的权限检查。
 */
export const restrictedTableColumns = (columns: ColumnSpec[]) =>
  columns.filter((c) => c.restricted).map((c) => c.key)

export function toggleColumn(state: ColumnState, key: string, columns: ColumnSpec[]): ColumnState {
  const spec = columns.find((c) => c.key === key)
  if (spec?.locked) return state
  const settings = state.settings.map((s) => (s.key === key ? { ...s, hidden: !s.hidden } : s))
  // 不允许把所有列都藏掉：空表格没有信息量，只会让人以为坏了
  const anyVisible = resolveTableColumns(columns, { ...state, settings }).some((c) => !c.hidden)
  return anyVisible ? { ...state, settings } : state
}

/** 拖动改顺序。from / to 是可见列里的下标，换算回 settings 的下标再移动 */
export function moveColumn(state: ColumnState, from: number, to: number): ColumnState {
  const settings = [...state.settings]
  if (from < 0 || from >= settings.length || to < 0 || to >= settings.length) return state
  const [moved] = settings.splice(from, 1)
  settings.splice(to, 0, moved)
  return { ...state, settings }
}

export function resizeColumn(state: ColumnState, key: string, width: string): ColumnState {
  return { ...state, settings: state.settings.map((s) => (s.key === key ? { ...s, width } : s)) }
}

/**
 * 固定列。固定总宽超过可视宽度一半时拒绝——
 * 全固定等于没固定，窄屏上还会让可滚动区域变成零。
 */
export function fixColumn(
  state: ColumnState,
  key: string,
  fixed: ColumnFixed,
  { viewportWidth = 960, defaultWidth = 160 }: { viewportWidth?: number; defaultWidth?: number } = {}
): { state: ColumnState; rejected?: string } {
  const settings = state.settings.map((s) => (s.key === key ? { ...s, fixed } : s))
  const fixedWidth = settings
    .filter((s) => s.fixed)
    .reduce((sum, s) => sum + (Number.parseFloat(s.width ?? '') || defaultWidth), 0)
  if (fixed && fixedWidth > viewportWidth / 2) {
    return {
      state,
      rejected: `固定列总宽 ${Math.round(fixedWidth)}px 超过可视宽度的一半（${Math.round(viewportWidth / 2)}px），再固定就没有可滚动的区域了`
    }
  }
  return { state: { ...state, settings } }
}

export const setDensity = (state: ColumnState, density: TableDensity): ColumnState => ({
  ...state,
  density
})

/* ---------- 视图 ---------- */

export const DEFAULT_VIEW_ID = 'default'

export function saveView(views: TableView[], view: TableView): TableView[] {
  if (view.id === DEFAULT_VIEW_ID) {
    // 默认视图是那个「回到原样」的出口，覆盖掉它就再也回不去了
    throw new Error('默认视图不可覆盖：它是「恢复默认」的出口')
  }
  const index = views.findIndex((v) => v.id === view.id)
  if (index < 0) return [...views, view]
  return views.map((v, i) => (i === index ? view : v))
}

export const removeView = (views: TableView[], id: string) =>
  id === DEFAULT_VIEW_ID ? views : views.filter((v) => v.id !== id)

export function applyView(view: TableView): ColumnState {
  return { settings: view.settings.map((s) => ({ ...s })), density: view.density }
}

/** 恢复默认：这个出口必须一直在，否则调乱了的表格就永远乱着 */
export const resetColumns = (columns: ColumnSpec[]): ColumnState => defaultColumnState(columns)

/**
 * 视图的持久化文本。带 version：以后列设置的结构变了，
 * 读到旧版本要能识别出来并退回默认，而不是把旧结构当新结构解释。
 */
export const VIEW_STORAGE_VERSION = 1

export function serializeViews(views: TableView[]): string {
  return JSON.stringify({ version: VIEW_STORAGE_VERSION, views })
}

export function parseViews(raw: string): { views: TableView[]; issue?: string } {
  try {
    const parsed = JSON.parse(raw) as { version?: number; views?: TableView[] }
    if (parsed.version !== VIEW_STORAGE_VERSION) {
      return { views: [], issue: `保存的列设置是第 ${parsed.version ?? '未知'} 版，这一版读不了，已回到默认` }
    }
    if (!Array.isArray(parsed.views)) return { views: [], issue: '保存的列设置结构不对，已回到默认' }
    return { views: parsed.views }
  } catch {
    return { views: [], issue: '保存的列设置解析失败，已回到默认' }
  }
}
