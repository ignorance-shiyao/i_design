/**
 * 图表联动：选择、下钻、返回。
 *
 * 一个看板上的图不是各自独立的：点饼图的一块要过滤旁边的表，
 * 在趋势图上刷一段要收窄所有图的时间范围，双击一根柱要下钻到它的明细。
 * 这些交互各写各的话，会出现两个几乎必然的问题：
 *
 * - **循环联动**：A 过滤 B，B 又把过滤条件回传给 A，两张图互相触发直到栈溢出。
 *   一旦发生，页面就是白的，而日志里只有一串一模一样的更新。
 * - **返回回不去**：下钻三层之后点返回，只退了筛选条件却没退层级，
 *   或者反过来。用户于是卡在一个既不是上一级也不是当前级的状态里。
 *
 * 所以把它们收成一个控制器：所有交互都表达成同一种事件，
 * 下钻是压栈、返回是弹栈，并且同一轮里同一个来源只处理一次。
 */

/** 所有联动交互都表达成这一种事件——各图表各定义一套的话，接线处会变成翻译层 */
export interface SelectionEvent {
  /** 谁发出的。循环检测靠它 */
  source: string
  kind: 'filter' | 'brush' | 'drill' | 'clear'
  /** 维度字段 */
  field?: string
  /** filter / drill：选中的值 */
  values?: (string | number)[]
  /** brush：数值或时间区间，闭区间 */
  range?: [number, number]
  /** drill：下钻到哪个维度 */
  into?: string
}

export interface LinkageFilter {
  field: string
  values?: (string | number)[]
  range?: [number, number]
}

export interface LinkageLevel {
  /** 这一级是被谁下钻进来的；顶层为空 */
  field: string
  /** 进入这一级时选中的值 */
  values: (string | number)[]
  /** 进入这一级之前的筛选条件，返回时原样恢复 */
  filters: LinkageFilter[]
}

export interface LinkageState {
  filters: LinkageFilter[]
  /** 下钻栈。栈顶是当前级 */
  stack: LinkageLevel[]
  /** 当前维度：栈顶的 into，没有下钻时是初始维度 */
  dimension: string
  /** 被忽略的事件与原因，用于排查「点了没反应」 */
  ignored: { source: string; reason: 'same-source' | 'noop' }[]
}

export function emptyLinkage(dimension: string): LinkageState {
  return { filters: [], stack: [], dimension, ignored: [] }
}

const sameFilter = (a: LinkageFilter, b: LinkageFilter) =>
  a.field === b.field &&
  JSON.stringify(a.values ?? null) === JSON.stringify(b.values ?? null) &&
  JSON.stringify(a.range ?? null) === JSON.stringify(b.range ?? null)

/**
 * 应用一个事件。
 *
 * `origin` 是当前这一轮更新的发起者：当一张图因为联动而重新渲染、
 * 又把自己的选择原样发回来时，`source === origin` 就成立，直接忽略。
 * 这就是循环联动的终止条件——不靠计数器，也不靠「最多联动三层」这类经验值，
 * 那两种做法在链条稍长时都会误伤正常交互。
 */
export function applySelection(
  state: LinkageState,
  event: SelectionEvent,
  origin?: string
): LinkageState {
  if (origin && event.source === origin) {
    return { ...state, ignored: [...state.ignored, { source: event.source, reason: 'same-source' }] }
  }

  switch (event.kind) {
    case 'clear':
      // 清空只清筛选，不退出下钻：那是两个动作，合并会让「返回」变得不可预测
      return { ...state, filters: [], ignored: [] }

    case 'filter':
    case 'brush': {
      if (!event.field) return { ...state, ignored: [...state.ignored, { source: event.source, reason: 'noop' }] }
      const next: LinkageFilter = { field: event.field, values: event.values, range: event.range }
      const existing = state.filters.find((f) => f.field === next.field)
      // 同一个条件再点一次＝取消，这是列表与图表里都通行的约定
      if (existing && sameFilter(existing, next)) {
        return { ...state, filters: state.filters.filter((f) => f.field !== next.field), ignored: [] }
      }
      return {
        ...state,
        filters: [...state.filters.filter((f) => f.field !== next.field), next],
        ignored: []
      }
    }

    case 'drill': {
      if (!event.into || !event.field || !event.values?.length) {
        return { ...state, ignored: [...state.ignored, { source: event.source, reason: 'noop' }] }
      }
      return {
        ...state,
        // 进入下一级之前把当前筛选整个存进栈：返回时原样恢复，而不是逐条回滚
        stack: [...state.stack, { field: event.field, values: event.values, filters: state.filters }],
        /*
         * 同一个字段只留一条。先筛「华东」再从「华东」下钻时，
         * 不去重会得到 region=华东 两条——重复条件不会改变结果，
         * 但会原样出现在筛选摘要里，读者以为自己点错了什么。
         */
        filters: [...state.filters.filter((f) => f.field !== event.field), { field: event.field, values: event.values }],
        dimension: event.into,
        ignored: []
      }
    }

    default:
      return state
  }
}

/** 返回上一级：恢复进入这一级之前的筛选条件与维度 */
export function drillUp(state: LinkageState, rootDimension: string): LinkageState {
  if (!state.stack.length) return state
  const stack = state.stack.slice(0, -1)
  const previous = state.stack[state.stack.length - 1]
  return {
    filters: previous.filters,
    stack,
    dimension: stack.length ? (stack[stack.length - 1].field ?? rootDimension) : rootDimension,
    ignored: []
  }
}

/** 面包屑：当前在第几级、每一级是什么。下钻超过两级时用户很容易迷路 */
export function drillPath(state: LinkageState, rootLabel = '全部'): string[] {
  return [rootLabel, ...state.stack.map((level) => level.values.join('、'))]
}

/** 某一行数据是否落在当前筛选里。图与表共用它，两边的口径才不会分叉 */
export function matchesFilters(
  row: Record<string, string | number | null>,
  filters: readonly LinkageFilter[]
): boolean {
  return filters.every((filter) => {
    const value = row[filter.field]
    if (filter.values?.length) return value !== null && filter.values.includes(value)
    if (filter.range) {
      const numeric = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(numeric) && numeric >= filter.range[0] && numeric <= filter.range[1]
    }
    return true
  })
}
