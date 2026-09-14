/**
 * 查询条件契约（astra.md 的 B03）。
 *
 * QueryFilter 是 pro 层的第一个垂直切片：它的状态要在五个端之间一模一样，
 * 但「地址栏」只有 Web 有。所以契约里**没有 URL**——只有一个字符串到字符串的
 * 参数记录。Web 端把它编码成 query string，小程序把它塞进页面参数，
 * Flutter 把它放进路由参数对象。三者是同一份数据的三种承载方式，
 * 不是三套各写一遍的逻辑。
 */

export type FilterKind = 'text' | 'select' | 'multi-select' | 'number-range' | 'date-range'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  name: string
  label: string
  kind: FilterKind
  /** select / multi-select 用 */
  options?: FilterOption[]
  placeholder?: string
  /** 折叠时是否仍然显示。常用的一两个字段应当常驻 */
  always?: boolean
}

/**
 * 范围类字段的值。两端都可以缺，表示单边开区间。
 *
 * 不复用 logic/range 的 RangeValue（那是个二元组）：筛选里「只填了开始」
 * 是常态，用元组就得拿空串占位，而空串与「没填」在参数里是两回事。
 */
export interface FilterRange {
  from?: string
  to?: string
}

export type FilterValue = string | string[] | FilterRange | undefined

export type FilterValues = Record<string, FilterValue>

export interface QueryState {
  values: FilterValues
  /** 页码从 1 起 */
  page: number
  pageSize: number
}

export interface InvalidParam {
  name: string
  raw: string
  reason: string
}

/** 快捷筛选：一组预置条件，点一下整套替换掉当前条件 */
export interface QuickFilter {
  key: string
  label: string
  values: FilterValues
}
