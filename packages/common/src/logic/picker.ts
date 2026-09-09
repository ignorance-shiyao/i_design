/**
 * 选择器的列解析。
 *
 * 两种数据形态共用一个组件：并列多列（省 / 市 各给一份候选），
 * 以及级联（省的 children 才是市）。差别只在「第 n 列的候选从哪来」，
 * 放在这里算清楚，各端就只剩滚动与渲染。
 */

export interface PickerOption {
  text: string
  value: string | number
  disabled?: boolean
  /** 有 children 即为级联：下一列的候选由当前选中项决定 */
  children?: PickerOption[]
}

/** 并列多列传 PickerOption[][]，级联传 PickerOption[] */
export type PickerColumns = PickerOption[] | PickerOption[][]

const isCascade = (columns: PickerColumns): columns is PickerOption[] =>
  columns.length > 0 && !Array.isArray(columns[0])

/**
 * 按当前选中值展开出每一列的候选。
 *
 * 级联时上一列变了，后面几列的候选就全变了——这里总是从头重算，
 * 而不是「只改动过的那一列」：后者会留下上一次的残余选项，
 * 出现「广东省 + 杭州市」这种谁也没选过的组合。
 */
export function resolveColumns(columns: PickerColumns, value: (string | number)[]): PickerOption[][] {
  if (!columns.length) return []
  if (!isCascade(columns)) return columns as PickerOption[][]

  const result: PickerOption[][] = []
  let level: PickerOption[] | undefined = columns
  let depth = 0
  // 深度上限：数据里若出现自引用的 children，没有它这里会一直转下去
  while (level && level.length && depth < 10) {
    result.push(level)
    const picked: PickerOption | undefined = level.find((o) => o.value === value[depth]) ?? level[0]
    level = picked?.children
    depth += 1
  }
  return result
}

/**
 * 把选中值补齐 / 纠正到合法组合。
 *
 * 缺项取该列第一个候选；已不存在的值同样退回第一个——
 * 上一列改了以后，旧的下级选项通常已经不在候选里，留着它整条值就是错的。
 */
export function normalizeValue(columns: PickerColumns, value: (string | number)[]): (string | number)[] {
  const resolved = resolveColumns(columns, value)
  const next: (string | number)[] = []
  for (let i = 0; i < resolved.length; i++) {
    const options = resolveColumns(columns, next)[i] ?? resolved[i]
    const hit = options.find((o) => o.value === value[i] && !o.disabled)
    next.push(hit ? hit.value : (options.find((o) => !o.disabled) ?? options[0])?.value)
  }
  return next
}

/** 选中值对应的选项文本，用于回填到输入框 */
export function pickerText(columns: PickerColumns, value: (string | number)[], separator = ' ') {
  return resolveColumns(columns, value)
    .map((options, i) => options.find((o) => o.value === value[i])?.text ?? '')
    .filter(Boolean)
    .join(separator)
}
