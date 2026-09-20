/** 帕累托模型：各端消费相同 JSON，不在渲染层重新排序或计算累计占比。 */
export interface ParetoInput { id: string; label: string; value: number | null }
export interface ParetoRow {
  id: string; label: string; value: number; sourceIndex: number; rank: number
  share: number | null; cumulative: number | null; relative: number
  valueText: string; shareText: string; cumulativeText: string; description: string
}
export interface ParetoModel {
  version: 1
  state: 'ready' | 'empty' | 'zero' | 'invalid'
  rows: ParetoRow[]
  excluded: { id: string; label: string; sourceIndex: number; reason: string }[]
  total: number; max: number; threshold: number; thresholdText: string; cutoffRank: number | null
  totalText: string; maxText: string; caption: string; unit: string
}
const numberText = (n: number) => n !== 0 && n < 0.000001 ? n.toExponential(3) : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(n)
const percentText = (n: number | null) => n === null ? '—' : `${(n * 100).toFixed(1)}%`

/** 相同值保持输入次序。重复 ID、无效阈值或溢出使整个模型无效，不能悄悄合并。 */
export function buildPareto(input: readonly ParetoInput[], { threshold = 0.8, unit = '' } = {}): ParetoModel {
  const base: ParetoModel = { version: 1, state: 'empty', rows: [], excluded: [], total: 0, max: 0,
    threshold: 0.8, thresholdText: '80.0%', cutoffRank: null, totalText: '0', maxText: '0', caption: '', unit }
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) return { ...base, state: 'invalid', caption: '累计阈值须大于 0 且不超过 100%' }
  base.threshold = threshold; base.thresholdText = percentText(threshold)
  const ids = new Set<string>()
  for (const item of input) {
    if (!item.id || ids.has(item.id)) return { ...base, state: 'invalid', caption: '类别 ID 不能为空或重复，请先明确聚合口径' }
    ids.add(item.id)
  }
  const included: { item: ParetoInput; sourceIndex: number }[] = []
  input.forEach((item, sourceIndex) => {
    const reason = item.value === null ? '值缺失，未计入分母' : !Number.isFinite(item.value) ? '值非有限数，未计入分母' : item.value < 0 ? '负值不适用，未计入分母' : ''
    if (reason) base.excluded.push({ id: item.id, label: item.label, sourceIndex, reason })
    else included.push({ item, sourceIndex })
  })
  included.sort((a, b) => b.item.value! - a.item.value! || a.sourceIndex - b.sourceIndex)
  const total = included.reduce((sum, row) => sum + row.item.value!, 0)
  if (!Number.isFinite(total)) return { ...base, state: 'invalid', caption: '合计超出可表示范围，请先调整单位' }
  const max = included[0]?.item.value ?? 0
  let cumulativeValue = 0
  const rows = included.map(({ item, sourceIndex }, index): ParetoRow => {
    const value = item.value!
    cumulativeValue += value
    const share = total > 0 ? value / total : null
    const cumulative = total > 0 ? Math.min(1, cumulativeValue / total) : null
    const valueText = `${numberText(value)}${unit}`
    const shareText = percentText(share), cumulativeText = percentText(cumulative)
    return { id: item.id, label: item.label, value, sourceIndex, rank: index + 1, share, cumulative,
      relative: max > 0 ? value / max : 0, valueText, shareText, cumulativeText,
      description: `第 ${index + 1} 项 ${item.label}：${valueText}，占比 ${shareText}，累计 ${cumulativeText}` }
  })
  const cutoff = total > 0 ? rows.find(row => row.cumulative! >= threshold) : undefined
  const quality = base.excluded.length ? `；${base.excluded.length} 项未计入，累计只代表已知有效值` : ''
  return { ...base, state: !rows.length ? 'empty' : total === 0 ? 'zero' : 'ready', rows, total, max,
    cutoffRank: cutoff?.rank ?? null, totalText: `${numberText(total)}${unit}`, maxText: `${numberText(max)}${unit}`,
    caption: !rows.length ? `没有可绘制的有效类别${quality}` : total === 0 ? `有效值合计为 0，累计占比无定义${quality}`
      : `有效值合计 ${numberText(total)}${unit}；前 ${cutoff!.rank} 项达到 ${percentText(threshold)} 累计阈值${quality}` }
}
