/**
 * 批量导入的纯逻辑（astra.md 的 B11）。
 *
 * 导入向导通常长这样：上传 → 列映射 → 预校验 → 真正导入。四步里有三处
 * 一做错就会让用户付出真实代价，这一层只管这三处：
 *
 * **一、预校验不写业务数据。**
 * 「先看看有没有问题」和「导进去」必须是两件事。预检一旦落库，用户看完报告
 * 点了取消，数据已经脏了——而他以为自己什么也没做。这条在类型上钉住：
 * 预检函数只接受一个**纯校验器**，拿不到任何写入口；报告里的 `wrote` 永远是
 * false，它是契约的一部分，不是一个碰巧的值。
 *
 * **二、列映射可回退。**
 * 映射是数据，不是一次性的向导步骤：随时能改某一列、能整个重来、能看出
 * 「哪个必填字段还没映上」。自动猜一版当默认值，但猜错的那几列用户要改得动——
 * 表头叫「联系人」而字段叫「负责人」这种事，每个客户的表都不一样。
 *
 * **三、部分失败可重试且幂等。**
 * 导入十有八九是部分成功。重试只发失败的那些行（B07 的 bulkOutcome 那套），
 * 而且同一份文件 + 同一套映射要算出同一个幂等键——用户手抖点两次「开始导入」，
 * 或者断线之后重发，不该导出两份。
 *
 * 错误清单要能下载，并且**带上原始行号**：用户拿到的是一个几千行的表格，
 * 「第 3 行客户为空」他找得到，「有 217 行有问题」他只能从头看。
 */

export interface SourceColumn {
  /** 文件表头里的原文 */
  key: string
  /** 第一行的样例值，帮人确认这一列是不是他以为的那一列 */
  sample?: string
}

export interface TargetField {
  key: string
  label: string
  required?: boolean
  /** 常见的别名，自动映射靠它。表头叫「联系人」而字段叫「负责人」是常态 */
  aliases?: readonly string[]
}

/** 目标字段 → 来源列。null 表示还没映上 */
export type ColumnMapping = Record<string, string | null>

const normalize = (text: string) => text.trim().toLowerCase().replace(/[\s_-]/g, '')

/**
 * 自动猜一版映射，当默认值用。
 *
 * 只按名字与别名精确匹配，不做模糊匹配：猜错的成本比没猜到高得多——
 * 没猜到用户会去选，猜错了他多半直接点下一步。
 * 一个来源列只会被用一次，先到先得，剩下的留空让人自己指。
 */
export function guessMapping(
  sources: readonly SourceColumn[],
  fields: readonly TargetField[]
): ColumnMapping {
  const used = new Set<string>()
  const mapping: ColumnMapping = {}
  for (const field of fields) {
    const names = [field.key, field.label, ...(field.aliases ?? [])].map(normalize)
    const hit = sources.find((s) => !used.has(s.key) && names.includes(normalize(s.key)))
    mapping[field.key] = hit ? hit.key : null
    if (hit) used.add(hit.key)
  }
  return mapping
}

export interface MappingIssue {
  level: 'error' | 'warning'
  /** 出问题的目标字段 */
  field: string
  message: string
}

/**
 * 映射有什么问题。
 *
 * 必填没映上是 error（导不了），一个来源列映给两个字段是 error（多半是手滑），
 * 选填没映上只是 warning——那一列会留空，是个合法的选择。
 */
export function mappingIssues(
  mapping: ColumnMapping,
  fields: readonly TargetField[]
): MappingIssue[] {
  const issues: MappingIssue[] = []
  const seen = new Map<string, string[]>()

  for (const field of fields) {
    const source = mapping[field.key] ?? null
    if (!source) {
      issues.push({
        level: field.required ? 'error' : 'warning',
        field: field.key,
        message: field.required ? `必填字段「${field.label}」还没映上` : `「${field.label}」没映上，导入后留空`
      })
      continue
    }
    seen.set(source, [...(seen.get(source) ?? []), field.label])
  }

  for (const [source, labels] of seen) {
    if (labels.length < 2) continue
    issues.push({
      level: 'error',
      field: source,
      message: `来源列「${source}」同时映给了 ${labels.join('、')}`
    })
  }
  return issues
}

/** 能不能往下走。只看 error，warning 不拦 */
export function canProceed(issues: readonly MappingIssue[]): boolean {
  return !issues.some((i) => i.level === 'error')
}

/** 清掉某一个字段的映射。映射是数据，随时能改、能整个重来 */
export function clearMapping(mapping: ColumnMapping, field: string): ColumnMapping {
  return { ...mapping, [field]: null }
}

/** 把某个来源列指给某个字段；它若已被别的字段占着，先从那儿摘掉 */
export function assignMapping(
  mapping: ColumnMapping,
  field: string,
  source: string | null
): ColumnMapping {
  const next: ColumnMapping = { ...mapping }
  if (source) {
    for (const key of Object.keys(next)) if (next[key] === source) next[key] = null
  }
  next[field] = source
  return next
}

/* ---------- 预校验 ---------- */

export interface RowProblem {
  /** 文件里的原始行号，从 1 起（表头不算）。用户拿着它去找那一行 */
  row: number
  /** 哪一列出的问题。整行问题时不给 */
  column?: string
  message: string
}

export interface DryRunReport {
  total: number
  okRows: number[]
  problems: RowProblem[]
  /**
   * 预检写没写业务数据。**永远是 false**——它是契约的一部分，
   * 不是一个碰巧的值。谁把它改成 true，就是把「先看看」变成了「已经导了」。
   */
  wrote: false
  summary: string
}

/**
 * 跑一遍预检。
 *
 * 第二个参数是**纯校验器**：给一行数据，返回这一行的问题。它拿不到任何写入口，
 * 所以这个函数在类型上就不可能落库。这不是自律，是把规则写进签名里。
 */
export function dryRun<T>(
  rows: readonly T[],
  validate: (row: T, index: number) => readonly Omit<RowProblem, 'row'>[]
): DryRunReport {
  const problems: RowProblem[] = []
  const okRows: number[] = []
  rows.forEach((row, index) => {
    const found = validate(row, index)
    if (!found.length) {
      okRows.push(index + 1)
      return
    }
    for (const item of found) problems.push({ ...item, row: index + 1 })
  })
  const badRows = new Set(problems.map((p) => p.row)).size
  return {
    total: rows.length,
    okRows,
    problems,
    wrote: false,
    summary:
      badRows === 0
        ? `预检通过：${rows.length} 行都能导入`
        : `预检发现 ${badRows} 行有问题，其余 ${rows.length - badRows} 行可以导入`
  }
}

/**
 * 错误清单的 CSV。
 *
 * 第一列是原始行号，因为用户手里那份文件是几千行的表格：
 * 「第 3 行客户为空」他找得到，「有 217 行有问题」他只能从头看。
 * 逗号、引号与换行按 CSV 规矩转义——客户名里带逗号是常事。
 */
export function problemsCsv(problems: readonly RowProblem[]): string {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const head = '行号,列,问题'
  const body = problems.map((p) => [String(p.row), p.column ?? '', p.message].map(escape).join(','))
  return [head, ...body].join('\n')
}

/* ---------- 幂等 ---------- */

/**
 * 同一份文件 + 同一套映射 = 同一个幂等键。
 *
 * 用户手抖点两次「开始导入」，或者断线之后重发，不该导出两份。
 * 映射参与计算是因为改了映射就是另一次导入——同一份文件按不同映射导两次
 * 是合法操作，不该被当成重复。
 *
 * 用排序后的键值对而不是对象序列化：JS 的对象顺序与用户点映射的顺序有关，
 * 同一套映射点的顺序不同就会算出两个键，幂等立刻失效。
 */
export function importKey(fileFingerprint: string, mapping: ColumnMapping): string {
  const pairs = Object.keys(mapping)
    .sort()
    .map((key) => `${key}=${mapping[key] ?? ''}`)
    .join('&')
  return `${fileFingerprint}|${pairs}`
}
