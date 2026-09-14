/**
 * 查询条件的状态机与参数往返（astra.md 的 B03）。
 *
 * 三件事在这里定死，五端共用：
 *
 * 1. **条件一变就回第一页。** 不回的话，用户改完筛选看到的是空白的第 7 页，
 *    而数据其实只有两页——这是分页列表最常见的「没有结果」假象。
 * 2. **参数往返必须无损且稳定。** 同一组条件每次序列化出来的键顺序一样，
 *    否则地址栏会因为顺序不同而产生两条不同的历史记录，「后退」就不听话了。
 * 3. **无效参数不静默丢弃。** 别人粘给你的链接里带着已经下线的状态值时，
 *    退回默认并把这条说出来；静默丢掉的话，用户看到的是一份他没要的结果，
 *    却以为那就是链接的内容。
 */
import type {
  FilterField,
  FilterValue,
  FilterValues,
  InvalidParam,
  QueryState,
  QuickFilter,
  FilterRange
} from '../contracts/query'

export const DEFAULT_PAGE_SIZE = 20

const isRange = (v: FilterValue): v is FilterRange =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** 空条件：空串、空数组、两端都空的范围都算空，不进参数 */
export function isEmptyValue(value: FilterValue): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return !value.from && !value.to
}

export function activeCount(values: FilterValues): number {
  return Object.values(values).filter((v) => !isEmptyValue(v)).length
}

/**
 * 条件变更。返回新状态，页码回到 1。
 *
 * 只有条件变了才回第一页：把同一个值再选一遍不该打断翻页。
 */
export function changeFilter(state: QueryState, name: string, value: FilterValue): QueryState {
  const before = state.values[name]
  const same = JSON.stringify(before ?? null) === JSON.stringify(value ?? null)
  const values = { ...state.values }
  if (isEmptyValue(value)) delete values[name]
  else values[name] = value
  return { ...state, values, page: same ? state.page : 1 }
}

/** 清空：条件全清，页码回到 1，每页条数保留——那是显示偏好，不是筛选条件 */
export function clearFilters(state: QueryState): QueryState {
  return { ...state, values: {}, page: 1 }
}

/** 快捷筛选整套替换当前条件，而不是叠加：叠加的话点两次会得到互相矛盾的条件 */
export function applyQuickFilter(state: QueryState, quick: QuickFilter): QueryState {
  return { ...state, values: { ...quick.values }, page: 1 }
}

/**
 * 当前条件是否正好等于某个快捷筛选——用来把那个按钮显示成选中态。
 *
 * 比的是「去掉空值之后」的条件：用户手工把条件删空，和点快捷筛选之前的状态，
 * 在用户眼里是同一件事。
 */
export function matchQuickFilter(values: FilterValues, quick: QuickFilter): boolean {
  return normalizeForCompare(values) === normalizeForCompare(quick.values)
}

/** 排序 + 去掉空值后的稳定文本，只用于比较 */
function normalizeForCompare(values: FilterValues): string {
  const entries = Object.entries(values)
    .filter(([, v]) => !isEmptyValue(v))
    .map(([k, v]) => [k, Array.isArray(v) ? [...v].sort() : v] as const)
    .sort((a, b) => a[0].localeCompare(b[0]))
  return JSON.stringify(entries)
}

const RANGE_SEP = '~'
const LIST_SEP = ','

/**
 * 条件 → 参数记录。键按字段名排序，保证同一组条件每次出来都一样。
 *
 * 空条件不进参数：`?status=` 这种空参数会让链接越来越长，
 * 也让「有没有筛选」这件事变得要看值而不是看键。
 */
export function serializeValues(values: FilterValues, fields: FilterField[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of [...fields].sort((a, b) => a.name.localeCompare(b.name))) {
    const value = values[field.name]
    if (isEmptyValue(value)) continue
    if (typeof value === 'string') out[field.name] = value.trim()
    else if (Array.isArray(value)) out[field.name] = value.join(LIST_SEP)
    else if (isRange(value)) out[field.name] = `${value.from ?? ''}${RANGE_SEP}${value.to ?? ''}`
  }
  return out
}

export function serializeQuery(state: QueryState, fields: FilterField[]): Record<string, string> {
  const out = serializeValues(state.values, fields)
  // 第一页与默认页长不进参数：它们是默认值，写进去只会让链接变长
  if (state.page > 1) out.page = String(state.page)
  if (state.pageSize !== DEFAULT_PAGE_SIZE) out.pageSize = String(state.pageSize)
  return out
}

/**
 * 参数记录 → 条件。认不出来的一律退回默认，并逐条报出原因。
 *
 * 认不出来有四种：字段本身不存在（改版删掉的筛选项）、枚举值不在选项里
 * （下线的状态）、范围写反（开始晚于结束）、页码不是正整数。
 * 每一种都要说出来——用户是从别人那儿粘来的链接，他有权知道哪一条没生效。
 */
export function parseQuery(
  params: Record<string, string | undefined>,
  fields: FilterField[]
): { state: QueryState; invalid: InvalidParam[] } {
  const invalid: InvalidParam[] = []
  const values: FilterValues = {}
  const byName = new Map(fields.map((f) => [f.name, f]))

  for (const [name, raw] of Object.entries(params)) {
    if (raw === undefined || raw === '') continue
    if (name === 'page' || name === 'pageSize') continue
    const field = byName.get(name)
    if (!field) {
      invalid.push({ name, raw, reason: '这个筛选项已经不存在了' })
      continue
    }
    if (field.kind === 'text') {
      values[name] = raw
    } else if (field.kind === 'select' || field.kind === 'multi-select') {
      const allowed = new Set((field.options ?? []).map((o) => o.value))
      const picked = (field.kind === 'multi-select' ? raw.split(LIST_SEP) : [raw])
        .map((v) => v.trim())
        .filter(Boolean)
      const good = picked.filter((v) => allowed.has(v))
      const bad = picked.filter((v) => !allowed.has(v))
      if (bad.length) {
        invalid.push({ name, raw: bad.join(LIST_SEP), reason: `${field.label} 里没有这个取值` })
      }
      if (good.length) values[name] = field.kind === 'multi-select' ? good : good[0]
    } else {
      const [from, to] = raw.split(RANGE_SEP)
      if (from === undefined || to === undefined) {
        invalid.push({ name, raw, reason: `${field.label} 的范围要写成「开始${RANGE_SEP}结束」` })
        continue
      }
      if (field.kind === 'number-range') {
        const nums = [from, to].filter(Boolean)
        if (nums.some((n) => !Number.isFinite(Number(n)))) {
          invalid.push({ name, raw, reason: `${field.label} 的范围不是数字` })
          continue
        }
      }
      if (from && to && from > to) {
        // 不替用户对调：他可能是把字段填错了位置，悄悄换过来会掩盖这件事
        invalid.push({ name, raw, reason: `${field.label} 的开始晚于结束` })
        continue
      }
      if (from || to) values[name] = { from: from || undefined, to: to || undefined }
    }
  }

  let page = 1
  if (params.page !== undefined && params.page !== '') {
    const n = Number(params.page)
    if (!Number.isInteger(n) || n < 1) {
      invalid.push({ name: 'page', raw: params.page, reason: '页码不是正整数' })
    } else {
      page = n
    }
  }

  let pageSize = DEFAULT_PAGE_SIZE
  if (params.pageSize !== undefined && params.pageSize !== '') {
    const n = Number(params.pageSize)
    if (!Number.isInteger(n) || n < 1) {
      invalid.push({ name: 'pageSize', raw: params.pageSize, reason: '每页条数不是正整数' })
    } else {
      pageSize = n
    }
  }

  return { state: { values, page, pageSize }, invalid }
}

/* ---------- Web 端的承载：query string ----------
 * 只有 Web 有地址栏，所以编解码放在这里而不是契约里；
 * 小程序与 Flutter 直接用上面的参数记录。
 */

export function toSearch(params: Record<string, string>): string {
  const search = new URLSearchParams()
  // 键已经排过序，这里保持插入顺序即可：同一组条件每次出来的字符串要一样，
  // 否则「后退」会踩进两条只是顺序不同的历史记录
  for (const [k, v] of Object.entries(params)) search.set(k, v)
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function fromSearch(search: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(search.replace(/^\?/, ''))) out[k] = v
  return out
}
