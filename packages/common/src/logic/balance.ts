/**
 * 贡献与流量平衡的口径契约（astra.md 的 D05）。
 *
 * 这张图回答的是「从上期的 A 变成本期的 B，中间是哪些事各推了多少」。
 * 它和这一族里的另外几张有一条根本差别：**负值是数据，不是脏数据。**
 * 帕累托、旭日、Icicle 都把负值排除——它们算的是构成，一块负的面积没有意义；
 * 而这里负贡献正是要看的东西，排除掉就等于把「掉的那部分」从故事里抹了。
 * 所以那套「负值一律排除」不能沿用，这一层得自己定。
 *
 * 三件事定死：
 *
 * **一、对不上的差额要显式摊出来，不许摊进最后一根柱子。**
 * 期初 100、各项贡献加起来 +18、期末声称 125，差着 7。
 * 最常见的做法是把最后一根柱子画到 125 了事——图上严丝合缝，
 * 而那 7 是哪来的没人知道。这里把它单列成一项「未解释的差额」，
 * 有自己的柱子、自己的名字，谁都能看见账没平。
 * 不给期末就不存在对不对得上的问题，那时合计就是算出来的。
 *
 * **二、总量必须能是负的，柱子的基线因此不能钉死在 0。**
 * 累计跌到 0 以下是常事（净流失、亏损）。把基线钉在 0，负的那一段要么被裁掉、
 * 要么被画成正的。基线由数据范围定，并且**一定包含 0**——
 * 不含 0 的贡献图会把「涨了一点」画得像「翻了一倍」。
 *
 * **三、流量平衡是「进来的等于出去的」，差额同样要报出来。**
 * 一个节点流入 100、流出 95，剩下的 5 是留下了、漏了，还是没统计到？
 * 这张图不替谁回答，但必须把 5 摆出来，而不是让两边各自看起来都对。
 */

export interface BalanceItemInput {
  id: string
  label: string
  /** 带符号的贡献。正是增、负是减；0 也是一项真实的「没动」 */
  value: number | null
}

export type BalanceStepKind = 'start' | 'change' | 'gap' | 'end'

export interface BalanceStep {
  id: string
  label: string
  kind: BalanceStepKind
  value: number
  /** 这一段的起止（在数值坐标里），渲染层据此画柱子 */
  from: number
  to: number
  /** 走完这一步之后的累计 */
  cumulative: number
  direction: 'up' | 'down' | 'flat'
  sourceIndex: number | null
  valueText: string
  cumulativeText: string
  /** 占「所有变动绝对值之和」的比例；总变动为 0 时无定义 */
  share: number | null
  shareText: string
  description: string
}

export interface BalanceModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  steps: BalanceStep[]
  start: number
  end: number
  /** 各项贡献的绝对值之和，用来衡量「这一期一共折腾了多少」 */
  churn: number
  /** 声称的期末与算出来的期末之差；对得上时为 0 */
  gap: number
  /** 坐标轴的上下界，恒包含 0 */
  min: number
  max: number
  excluded: { id: string; label: string; sourceIndex: number; reason: string }[]
  unit: string
  caption: string
}

const numberText = (n: number, unit: string) => {
  const text =
    n !== 0 && Math.abs(n) < 0.000001
      ? n.toExponential(3)
      : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)
  return `${text}${unit}`
}

const signedText = (n: number, unit: string) =>
  `${n > 0 ? '+' : ''}${numberText(n, unit)}`

const percentText = (n: number | null) => (n === null ? '—' : `${(n * 100).toFixed(1)}%`)

function invalid(base: BalanceModel, caption: string): BalanceModel {
  return { ...base, state: 'invalid', caption }
}

export interface BalanceOptions {
  /** 期初。不给按 0 起算 */
  start?: number
  /**
   * 声称的期末。给了就对账：对不上的差额单列成一项，不摊进别的柱子。
   * 不给就不存在对不对得上的问题，期末即算出来的合计。
   */
  end?: number | null
  unit?: string
  startLabel?: string
  endLabel?: string
}

/**
 * 把带符号的各项贡献算成一串可直接渲染的台阶。
 *
 * 不修改入参；顺序照输入给的来——贡献图的顺序通常是业务叙述的顺序（先说大头），
 * 自作主张按大小重排会把因果讲反。
 */
export function buildBalance(
  input: readonly BalanceItemInput[],
  {
    start = 0,
    end = null,
    unit = '',
    startLabel = '期初',
    endLabel = '期末'
  }: BalanceOptions = {}
): BalanceModel {
  const base: BalanceModel = {
    version: 1,
    state: 'empty',
    steps: [],
    start,
    end: start,
    churn: 0,
    gap: 0,
    min: 0,
    max: 0,
    excluded: [],
    unit,
    caption: ''
  }

  if (!Number.isFinite(start)) return invalid(base, '期初不是有效的数')
  if (end !== null && !Number.isFinite(end)) return invalid(base, '期末不是有效的数')

  const seen = new Set<string>()
  for (const item of input) {
    if (!item.id) return invalid(base, '项目 ID 不能为空，否则无法回溯到源数据')
    if (seen.has(item.id)) return invalid(base, `项目 ID 重复：${item.id}，请先明确口径`)
    if (item.id === '__gap') return invalid(base, '项目 ID __gap 与「未解释的差额」冲突')
    seen.add(item.id)
  }

  /*
   * 这里只排除「不是数」的，负值照收——负贡献正是这张图要看的东西。
   * 缺失同样不当成 0：0 是「这项没动」，缺失是「这项没报上来」，
   * 前者该画一根零高的柱子，后者不该出现在账上。
   */
  const kept: { item: BalanceItemInput; sourceIndex: number; value: number }[] = []
  let sourceIndex = -1
  for (const item of input) {
    sourceIndex += 1
    const value = item.value
    if (value === null || !Number.isFinite(value)) {
      base.excluded.push({
        id: item.id,
        label: item.label,
        sourceIndex,
        reason: value === null ? '没有报数，未计入合计（缺失不是 0）' : '值不是有限数，未计入合计'
      })
      continue
    }
    kept.push({ item, sourceIndex, value })
  }

  const sum = kept.reduce((acc, row) => acc + row.value, 0)
  if (!Number.isFinite(sum)) return invalid(base, '各项之和超出可表示范围，请先调整单位')
  const computed = start + sum
  const churn = kept.reduce((acc, row) => acc + Math.abs(row.value), 0)
  const gap = end === null ? 0 : end - computed
  const finalEnd = end === null ? computed : end

  const steps: BalanceStep[] = []
  const push = (
    id: string,
    label: string,
    kind: BalanceStepKind,
    value: number,
    from: number,
    to: number,
    cumulative: number,
    index: number | null,
    description: string
  ) => {
    const share = kind === 'start' || kind === 'end' || churn === 0 ? null : Math.abs(value) / churn
    steps.push({
      id,
      label,
      kind,
      value,
      from,
      to,
      cumulative,
      direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat',
      sourceIndex: index,
      valueText: kind === 'start' || kind === 'end' ? numberText(value, unit) : signedText(value, unit),
      cumulativeText: numberText(cumulative, unit),
      share,
      shareText: percentText(share),
      description
    })
  }

  push(
    '__start',
    startLabel,
    'start',
    start,
    0,
    start,
    start,
    null,
    `${startLabel}：${numberText(start, unit)}`
  )

  let running = start
  for (const { item, sourceIndex: index, value } of kept) {
    const from = running
    running += value
    push(
      item.id,
      item.label,
      'change',
      value,
      from,
      running,
      running,
      index,
      `${item.label}：${signedText(value, unit)}${churn ? `，占全部变动的 ${percentText(Math.abs(value) / churn)}` : ''}，之后累计 ${numberText(running, unit)}`
    )
  }

  if (gap !== 0) {
    const from = running
    running += gap
    push(
      '__gap',
      '未解释的差额',
      'gap',
      gap,
      from,
      running,
      running,
      null,
      `未解释的差额：${signedText(gap, unit)}——各项加起来到 ${numberText(computed, unit)}，而${endLabel}声称是 ${numberText(finalEnd, unit)}，这一段没有对应的项目`
    )
  }

  push(
    '__end',
    endLabel,
    'end',
    finalEnd,
    0,
    finalEnd,
    finalEnd,
    null,
    `${endLabel}：${numberText(finalEnd, unit)}`
  )

  /*
   * 坐标轴恒含 0。
   *
   * 范围只取各步走到的累计值，再显式把 0 并进去——不靠「期初那根柱子本来就从 0 画起」
   * 顺带带上 0。不含 0 的贡献图会把「从 100 涨到 102」画得像翻了一倍。
   */
  const reached = steps.map((step) => step.to)
  const min = Math.min(0, ...reached)
  const max = Math.max(0, ...reached)

  const quality = base.excluded.length
    ? `；${base.excluded.length} 项未计入，原因见下`
    : ''
  const gapNote =
    gap !== 0
      ? `；账没平，差 ${signedText(gap, unit)}，已单列为「未解释的差额」`
      : end === null
        ? ''
        : '；账是平的'

  return {
    ...base,
    state: kept.length ? 'ready' : 'empty',
    steps: kept.length ? steps : [],
    end: finalEnd,
    churn,
    gap,
    min,
    max,
    caption: kept.length
      ? `${numberText(start, unit)} → ${numberText(finalEnd, unit)}，${kept.length} 项变动合计 ${signedText(sum, unit)}${gapNote}${quality}`
      : `没有可用的变动项${quality}`
  }
}

export interface FlowBalanceNodeInput {
  id: string
  label: string
  inflow: number | null
  outflow: number | null
}

export interface FlowBalanceNode {
  id: string
  label: string
  inflow: number
  outflow: number
  /** 进来的减去出去的。正是留下/积压，负是凭空多出来的 */
  residual: number
  balanced: boolean
  sourceIndex: number
  inflowText: string
  outflowText: string
  residualText: string
  description: string
}

export interface FlowBalanceModel {
  version: 1
  state: 'ready' | 'empty' | 'invalid'
  nodes: FlowBalanceNode[]
  excluded: { id: string; label: string; sourceIndex: number; reason: string }[]
  unbalanced: number
  unit: string
  caption: string
}

/**
 * 逐节点核对「进来的等于出去的」。
 *
 * 不替谁回答那点差额是留下了还是漏了——那要看业务；
 * 但必须把它摆出来，而不是让进和出各自看起来都对。
 * `tolerance` 按节点自身的规模取相对值：定一个绝对值，在以亿为单位的数据上
 * 什么也拦不住，在以毫克为单位的数据上又会把真实差额吃掉。
 */
export function checkFlowBalance(
  input: readonly FlowBalanceNodeInput[],
  { unit = '', tolerance = 1e-9 } = {}
): FlowBalanceModel {
  const base: FlowBalanceModel = {
    version: 1,
    state: 'empty',
    nodes: [],
    excluded: [],
    unbalanced: 0,
    unit,
    caption: ''
  }

  const seen = new Set<string>()
  for (const item of input) {
    if (!item.id) return { ...base, state: 'invalid', caption: '节点 ID 不能为空' }
    if (seen.has(item.id)) return { ...base, state: 'invalid', caption: `节点 ID 重复：${item.id}` }
    seen.add(item.id)
  }

  const nodes: FlowBalanceNode[] = []
  let sourceIndex = -1
  for (const item of input) {
    sourceIndex += 1
    const { inflow, outflow } = item
    if (
      inflow === null ||
      outflow === null ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      base.excluded.push({
        id: item.id,
        label: item.label,
        sourceIndex,
        reason: '流入或流出没有报数，无法核对（缺失不是 0）'
      })
      continue
    }
    const residual = inflow - outflow
    const scale = Math.max(Math.abs(inflow), Math.abs(outflow))
    const balanced = Math.abs(residual) <= scale * tolerance
    nodes.push({
      id: item.id,
      label: item.label,
      inflow,
      outflow,
      residual,
      balanced,
      sourceIndex,
      inflowText: numberText(inflow, unit),
      outflowText: numberText(outflow, unit),
      residualText: signedText(residual, unit),
      description: balanced
        ? `${item.label}：进 ${numberText(inflow, unit)}、出 ${numberText(outflow, unit)}，对得上`
        : `${item.label}：进 ${numberText(inflow, unit)}、出 ${numberText(outflow, unit)}，差 ${signedText(residual, unit)}——是留下了、漏了还是没统计到，这张图不替你回答`
    })
  }

  const unbalanced = nodes.filter((node) => !node.balanced).length
  return {
    ...base,
    state: nodes.length ? 'ready' : 'empty',
    nodes,
    unbalanced,
    caption: nodes.length
      ? `${nodes.length} 个节点，${unbalanced ? `${unbalanced} 个进出对不上` : '进出都对得上'}${base.excluded.length ? `；${base.excluded.length} 个节点无法核对` : ''}`
      : `没有可核对的节点${base.excluded.length ? `；${base.excluded.length} 个节点缺数` : ''}`
  }
}
