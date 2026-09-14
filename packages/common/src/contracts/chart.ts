/**
 * 图表的数据契约。
 *
 * 现在各图表组件各收各的形状：折线收 `series + labels`，饼图收 `items`，
 * 散点收带 x/y 的点。数据从同一个接口来，却要在页面里被揉成四五种形状，
 * 而每一次揉都是一次可能出错的地方——尤其是缺失值：最常见的写法是
 * `?? 0`，于是「这天没上报」在图上变成了「这天是 0」，两者在业务上天差地别。
 *
 * 所以先定一层数据集：字段带单位与语义，缺失值就是缺失值。
 * 各图表继续保留原有属性（由适配函数转换），这一层只是多给一条路。
 */

/** 单元格：数值、分类、时间，或明确的「没有值」 */
export type CellValue = number | string | null

export type FieldKind = 'dimension' | 'measure' | 'time'

export interface ChartField {
  key: string
  label: string
  kind: FieldKind
  /** 单位。显示时跟在数值后面，也用于判断两个系列能不能共用一根轴 */
  unit?: string
  /** 数值的显示精度（小数位） */
  precision?: number
  /** 时间字段的时区偏移（分钟）。不给则按 UTC 分桶，不按浏览器所在时区 */
  tzOffsetMinutes?: number
}

export interface ChartDataset {
  fields: ChartField[]
  rows: Record<string, CellValue>[]
  /**
   * 数据口径：这份数据是怎么来的。
   * 图上必须能看到它——同一张图换个统计口径就是另一回事，
   * 而读者无从分辨，除非写出来。
   */
  note?: string
}

export type Aggregation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'p95'

export interface ChartSpec {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter'
  /** 横轴字段（维度或时间） */
  x: string
  /** 纵轴字段（度量），可多个 */
  y: string[]
  /** 分组字段：把一列拆成多个系列 */
  groupBy?: string
  aggregate?: Aggregation
  /** 时间分桶粒度；只有 x 是时间字段时有意义 */
  bucket?: 'hour' | 'day' | 'week' | 'month'
  stacked?: boolean
}

/** 一份数据集里发现的问题。图上要能说出来，而不是默默把它们抹平 */
export type DataIssue =
  | { kind: 'empty' }
  | { kind: 'single-point' }
  | { kind: 'all-zero' }
  | { kind: 'has-negative'; count: number }
  | { kind: 'missing-values'; count: number }
  | { kind: 'invalid-numbers'; count: number }
  | { kind: 'missing-dimension'; count: number }
  | { kind: 'mixed-units'; units: string[] }
