/**
 * 留存的口径契约（astra.md 的 D05）。
 *
 * 留存图上的每一个百分比都要能回答同一个问题：**分母是哪一批人、第几期**。
 * 答不上来的百分比没有意义，而答错的比答不上来更糟——它看起来一样正经。
 * 下面四件事全都不会报错，只会让人读到一条不存在的趋势：
 *
 * **一、分母恒为这一批自己的期初人数，不是上一期。**
 * 「第 3 期留存 80%」，是一百个人里还剩八十，还是第 2 期的八十人里还剩
 * 六十四？两个数一个是 80%、一个是 64%，都叫「留存」。这里只认前者
 * （经典留存），另一种是逐期流失率，语义不同，要用就另开一列，
 * 不能混在同一张图上——混了之后连写这张图的人都说不清看到的是哪个。
 *
 * **二、「还没到那一期」不是 0。**
 * 上个月才进来的那一批，第 6 期根本还没发生。画成 0，曲线会在右下角
 * 齐刷刷跌到底，看起来像是产品突然崩了。未到期必须是空格，而不是零。
 *
 * **三、每期平均只在可比的那些批次上算。**
 * 第 6 期只有老批次到得了，把「所有到得了第 6 期的批次」平均一下，
 * 得到的是幸存者的平均——它几乎必然高于真实水平，而且会随着新批次的
 * 加入忽上忽下。所以平均值要说清是几个批次算出来的，并且只有当
 * **所有批次都到得了这一期**时才标为可比；否则照样给数，但标明不可比。
 *
 * **四、人数超过期初是矛盾，不是好消息。**
 * 回流的人可以让第 3 期比第 2 期多，这很正常；但比期初还多，
 * 说明这一批的口径里混进了不属于它的人。补不出来，整批作废并说明原因。
 */

export interface RetentionCohortInput {
  id: string
  /** 批次名，例如「2026-01 进来的」 */
  label: string
  /** 期初人数，也就是这一批所有百分比的分母 */
  size: number | null
  /**
   * 第 1、2、3……期还留着的人数。
   * `null` 表示这一期还没到、或者还没上报——两种都不是 0。
   */
  values: readonly (number | null)[]
}

export type RetentionCellState = 'ready' | 'pending'

export interface RetentionCell {
  cohortId: string
  /** 第几期，从 1 开始；第 0 期恒为期初本身，不进表 */
  period: number
  state: RetentionCellState
  value: number | null
  /** 占这一批期初的比例。未到期为 null */
  rate: number | null
  rateText: string
  valueText: string
  description: string
}

export interface RetentionCohort {
  id: string
  label: string
  size: number
  sourceIndex: number
  sizeText: string
  cells: RetentionCell[]
  /** 这一批已经到得了第几期；后面的都是空格 */
  reach: number
}

export interface RetentionAverage {
  period: number
  rate: number | null
  rateText: string
  /** 算这个平均用到了几个批次 */
  cohorts: number
  /**
   * 所有批次都到得了这一期吗。
   * 否的话这个平均是幸存者平均，会随新批次加入而跳动，图上必须标出来。
   */
  comparable: boolean
  description: string
}

export interface RetentionModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  cohorts: RetentionCohort[]
  /** 表格一共几期（取最长的那一批） */
  periods: number
  averages: RetentionAverage[]
  excluded: { id: string; label: string; sourceIndex: number; reason: string }[]
  /** 口径说明，必须显示在图上 */
  basis: string
  unit: string
  caption: string
}

const percentText = (n: number | null) => (n === null ? '—' : `${(n * 100).toFixed(1)}%`)

const countText = (n: number, unit: string) =>
  `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)}${unit}`

function invalid(base: RetentionModel, caption: string): RetentionModel {
  return { ...base, state: 'invalid', caption }
}

/**
 * 把各批次的逐期人数算成一张可直接渲染的留存表。
 *
 * 不修改入参；批次顺序照输入给的来——留存表的行序是时间，重排会让人读错。
 */
export function buildRetention(
  input: readonly RetentionCohortInput[],
  { unit = ' 人', periodLabel = '期' } = {}
): RetentionModel {
  const base: RetentionModel = {
    version: 1,
    state: 'empty',
    cohorts: [],
    periods: 0,
    averages: [],
    excluded: [],
    basis: `每格的分母都是所在批次的期初人数，不是上一${periodLabel}`,
    unit,
    caption: ''
  }

  const seen = new Set<string>()
  for (const item of input) {
    if (!item.id) return invalid(base, '批次 ID 不能为空，否则无法回溯到源数据')
    if (seen.has(item.id)) return invalid(base, `批次 ID 重复：${item.id}，请先明确批次口径`)
    seen.add(item.id)
  }

  const cohorts: RetentionCohort[] = []
  let sourceIndex = -1
  for (const item of input) {
    sourceIndex += 1
    const size = item.size
    /*
     * 分母为空、为零或不是有限数，这一批的每个百分比都无从谈起。
     * 不画成 0%：0% 是「一个都没留下」，和「不知道有多少人」是两回事。
     */
    if (size === null || !Number.isFinite(size) || size <= 0) {
      base.excluded.push({
        id: item.id,
        label: item.label,
        sourceIndex,
        reason:
          size === null
            ? '没有期初人数，这一批的留存率没有分母'
            : size === 0
              ? '期初人数为 0，留存率无定义'
              : '期初人数不是有效的正数'
      })
      continue
    }

    const cells: RetentionCell[] = []
    let reach = 0
    let broken = ''
    item.values.forEach((value, index) => {
      const period = index + 1
      if (value === null) {
        cells.push({
          cohortId: item.id,
          period,
          state: 'pending',
          value: null,
          rate: null,
          rateText: '—',
          valueText: '—',
          description: `${item.label} 第 ${period} ${periodLabel}：还没到这一${periodLabel}，不是 0`
        })
        return
      }
      if (!Number.isFinite(value) || value < 0) {
        broken ||= `第 ${period} ${periodLabel}的人数不是有效的非负数`
        return
      }
      if (value > size) {
        broken ||= `第 ${period} ${periodLabel}留下的人比期初还多（${countText(value, unit)} > ${countText(size, unit)}），口径里混进了不属于这一批的人`
        return
      }
      const rate = value / size
      reach = period
      cells.push({
        cohortId: item.id,
        period,
        state: 'ready',
        value,
        rate,
        rateText: percentText(rate),
        valueText: countText(value, unit),
        description: `${item.label} 第 ${period} ${periodLabel}：${countText(value, unit)}，占本批期初${countText(size, unit)}的 ${percentText(rate)}`
      })
    })

    if (broken) {
      base.excluded.push({ id: item.id, label: item.label, sourceIndex, reason: broken })
      continue
    }

    cohorts.push({
      id: item.id,
      label: item.label,
      size,
      sourceIndex,
      sizeText: countText(size, unit),
      cells,
      reach
    })
  }

  if (!cohorts.length) {
    const quality = base.excluded.length
      ? `；${base.excluded.length} 个批次未计入，原因见下`
      : ''
    return { ...base, caption: `没有可用的批次${quality}` }
  }

  const periods = cohorts.reduce((acc, cohort) => Math.max(acc, cohort.cells.length), 0)

  const averages: RetentionAverage[] = []
  for (let period = 1; period <= periods; period += 1) {
    const ready = cohorts
      .map((cohort) => cohort.cells.find((cell) => cell.period === period))
      .filter((cell): cell is RetentionCell => !!cell && cell.state === 'ready')
    const comparable = ready.length === cohorts.length
    const rate = ready.length
      ? ready.reduce((sum, cell) => sum + cell.rate!, 0) / ready.length
      : null
    averages.push({
      period,
      rate,
      rateText: percentText(rate),
      cohorts: ready.length,
      comparable,
      description: comparable
        ? `第 ${period} ${periodLabel}：${cohorts.length} 个批次都到得了，平均 ${percentText(rate)}`
        : `第 ${period} ${periodLabel}：只有 ${ready.length} / ${cohorts.length} 个批次到得了，平均 ${percentText(rate)}——这是幸存者平均，不能和左边几${periodLabel}比`
    })
  }

  const partial = averages.filter((average) => !average.comparable).length
  const quality = base.excluded.length
    ? `；${base.excluded.length} 个批次未计入，原因见下`
    : ''
  const note = partial
    ? `；右边 ${partial} ${periodLabel}还有批次没到，那几${periodLabel}的平均只代表已到期的批次`
    : ''

  return {
    ...base,
    state: 'ready',
    cohorts,
    periods,
    averages,
    caption: `${cohorts.length} 个批次、${periods} ${periodLabel}${note}${quality}`
  }
}

/** 色阶一共五档，和 --i-chart-seq-N / -ink 一一对应 */
export const RETENTION_SHADES = 5

/**
 * 某一格落在色阶的第几档，1–5；未到期返回 null。
 *
 * **按比例本身分档，不按「在本图所有格子里排第几」。**
 * 按排名分档会让 5% 和 50% 在两张图上看着一样深，而留存图最常见的用法
 * 就是横向比两个产品、两个时间段——一归一化，这种比较就废了。
 *
 * 用离散的五档而不是连续的透明度：色阶的每一档都自带配好的字色
 * （`-ink`，按 0 预算推导，不许为了对比度压深——色阶编码的是量级，
 * 压深任何一档都等于改了数据的含义）。连续透明度上压什么字色都是猜。
 *
 * 未到期返回 null，渲染层据此留空，而不是涂成最浅的一档：
 * 最浅的一档是「几乎没人留下」，和「这一期还没到」是两回事。
 */
export function retentionShade(cell: RetentionCell): number | null {
  if (cell.state !== 'ready' || cell.rate === null) return null
  const step = Math.ceil(cell.rate * RETENTION_SHADES)
  return Math.min(RETENTION_SHADES, Math.max(1, step))
}
