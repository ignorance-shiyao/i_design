/**
 * 属性检查器的纯逻辑。
 *
 * 智能体生成了一个东西（一张图、一个组件、一段配置），人接着微调它的属性。
 * 这跟一张普通的表单差在一件事上：**要随时看得出「哪几项被我改过」，
 * 并且能单独退回去**。没有这条，用户调了七八下之后就不敢再动了——
 * 他不知道自己已经偏离原始结果多远，也不知道怎么退回某一项。
 *
 * 所以这里的函数都围绕「当前值与原始值的差」来写，而不是围绕「当前值」。
 */

export type FineTuneKind = 'number' | 'select' | 'switch' | 'color' | 'text'

/** 一个可调属性 */
export interface FineTuneField {
  key: string
  label: string
  kind: FineTuneKind
  /** number 用：范围与步长 */
  min?: number
  max?: number
  step?: number
  /** number 用：显示时跟在数字后面的单位，不做本地化 */
  unit?: string
  /** select 用 */
  options?: { value: string; label: string }[]
  /** 这一项为什么存在。折起来放在标签旁边，不占一行 */
  hint?: string
  disabled?: boolean
}

export type FineTuneValue = number | string | boolean
export type FineTuneValues = Record<string, FineTuneValue>

/**
 * 把输入夹回这个属性允许的范围。
 *
 * 夹范围与吸步长都在这里做，而不是交给各端的输入框：`<input type=range>` 会
 * 自己吸附，手输的数字框不会，于是同一个属性用拖的得到 12、用敲的得到 12.7。
 */
export function clampFieldValue(field: FineTuneField, value: FineTuneValue): FineTuneValue {
  if (field.kind !== 'number') return value
  const raw = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(raw)) return field.min ?? 0
  const min = field.min ?? Number.NEGATIVE_INFINITY
  const max = field.max ?? Number.POSITIVE_INFINITY
  const step = field.step
  let next = Math.min(max, Math.max(min, raw))
  if (step && step > 0) {
    const base = field.min ?? 0
    next = base + Math.round((next - base) / step) * step
    // 吸附之后可能越界（上限不是步长的整数倍），再夹一次
    next = Math.min(max, Math.max(min, next))
    // 浮点步长会留下 0.30000000000000004 这样的尾巴，按步长的小数位收一下
    const decimals = (String(step).split('.')[1] ?? '').length
    next = Number(next.toFixed(decimals))
  }
  return next
}

/**
 * 与原始值不同的那几项。
 *
 * 按 key 的给定顺序返回，而不是按改动先后：改动顺序对读者没有意义，
 * 而面板上的顺序是固定的，两者一致才找得到。
 */
export function changedKeys(
  fields: FineTuneField[],
  original: FineTuneValues,
  current: FineTuneValues
): string[] {
  return fields.filter((f) => !sameValue(original[f.key], current[f.key])).map((f) => f.key)
}

/** 值是否相同。数字按值比，不按字面量——「12」与 12 是同一个设置 */
function sameValue(a: FineTuneValue | undefined, b: FineTuneValue | undefined): boolean {
  if (a === undefined && b === undefined) return true
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b)
  return a === b
}

/** 单项退回原始值。整份退回用 `original` 本身即可，不必再给一个函数 */
export function resetField(
  original: FineTuneValues,
  current: FineTuneValues,
  key: string
): FineTuneValues {
  const next = { ...current }
  if (key in original) next[key] = original[key]
  else delete next[key]
  return next
}

/**
 * 改了几项的说法。
 *
 * 零项时给的是「与原始结果一致」而不是「改了 0 项」：后者要读者自己
 * 把 0 翻译成「没改」，而这行字存在的意义正是省掉这一步。
 */
export function fineTuneSummary(count: number): string {
  return count === 0 ? '与原始结果一致' : `改了 ${count} 项`
}

/** 属性值的显示文字。面板上要能一眼看出当前是什么，而不是只看到一个滑块位置 */
export function formatFieldValue(field: FineTuneField, value: FineTuneValue | undefined): string {
  if (value === undefined || value === '') return '—'
  switch (field.kind) {
    case 'switch':
      return value ? '开' : '关'
    case 'select':
      return field.options?.find((o) => o.value === value)?.label ?? String(value)
    case 'number':
      return `${value}${field.unit ?? ''}`
    default:
      return String(value)
  }
}

/** 滑块的填充比例（0–1）。范围缺省时给 0，不让 NaN 流到样式里 */
export function fieldRatio(field: FineTuneField, value: FineTuneValue | undefined): number {
  if (field.kind !== 'number' || field.min === undefined || field.max === undefined) return 0
  const span = field.max - field.min
  if (span <= 0) return 0
  const raw = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(raw)) return 0
  return Math.min(1, Math.max(0, (raw - field.min) / span))
}
