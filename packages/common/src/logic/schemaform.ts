/**
 * SchemaForm 的纯逻辑（astra.md 的 B08）。
 *
 * 四件事在这里，五端共用：条件求值、依赖排序与环检测、按 schema 校验、
 * 把服务端错误落回具体字段。
 *
 * 一条红线：**不执行 schema 里的任何字符串**。条件是数据，异步规则只给一个
 * handler 名字由宿主注册实现。schema 常常来自接口，能 eval 就等于把任意代码
 * 执行权交给了接口。
 */
import type {
  Condition,
  ConditionGroup,
  FormFieldError,
  FormFieldSpec,
  FormSchema,
  Visibility
} from '../contracts/form'

const isGroup = (v: Visibility): v is ConditionGroup =>
  typeof v === 'object' && v !== null && ('all' in v || 'any' in v || 'not' in v)

const isEmpty = (value: unknown) => {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** 条件求值。算子表是封闭的——不认识的算子直接报错，而不是猜它想干什么 */
export function evaluate(condition: Visibility, values: Record<string, unknown>): boolean {
  if (isGroup(condition)) {
    if (condition.all) return condition.all.every((c) => evaluate(c, values))
    if (condition.any) return condition.any.some((c) => evaluate(c, values))
    if (condition.not) return !evaluate(condition.not, values)
    // all: [] 这类空分支当作「无条件」，而不是 false——否则整段字段会凭空消失
    return true
  }
  if (!('field' in condition) || !condition.field) {
    // 既没有 field 也没有 all/any/not：这不是「空条件」，是写坏了的条件。
    // 当成 true 放过去的话，坏掉的 schema 会表现为「字段莫名其妙一直显示」
    throw new Error('条件里既没有 field，也没有 all / any / not')
  }
  const actual = values[condition.field]
  switch (condition.op) {
    case 'eq': return actual === condition.value
    case 'ne': return actual !== condition.value
    case 'in': return Array.isArray(condition.value) && condition.value.includes(actual as never)
    case 'not-in': return Array.isArray(condition.value) && !condition.value.includes(actual as never)
    case 'truthy': return !isEmpty(actual) && actual !== false
    case 'falsy': return isEmpty(actual) || actual === false
    case 'gt': return Number(actual) > Number(condition.value)
    case 'lt': return Number(actual) < Number(condition.value)
    default:
      throw new Error(`不认识的条件算子：${(condition as Condition).op}`)
  }
}

/** 一个条件依赖哪些字段 */
export function dependenciesOf(condition: Visibility): string[] {
  if (!isGroup(condition)) return [condition.field]
  const parts = [...(condition.all ?? []), ...(condition.any ?? []), ...(condition.not ? [condition.not] : [])]
  return parts.flatMap(dependenciesOf)
}

/**
 * 按依赖拓扑排序，顺便检出环。
 *
 * 环必须在装配时报出来并点名参与的字段——等到用户填到那一步才摆动的话，
 * 现场根本看不出是 schema 的问题。
 */
export function dependencyOrder(schema: FormSchema): string[] {
  const fields = schema.fields
  const deps = new Map<string, string[]>()
  for (const field of fields) {
    deps.set(field.name, field.when ? [...new Set(dependenciesOf(field.when))] : [])
  }

  const order: string[] = []
  const state = new Map<string, 'visiting' | 'done'>()
  const stack: string[] = []

  const visit = (name: string) => {
    if (state.get(name) === 'done') return
    if (state.get(name) === 'visiting') {
      const cycle = [...stack.slice(stack.indexOf(name)), name]
      throw new Error(`字段显隐依赖成环：${cycle.join(' → ')}`)
    }
    state.set(name, 'visiting')
    stack.push(name)
    for (const dep of deps.get(name) ?? []) {
      // 依赖一个不存在的字段：条件永远取不到值，等于这个字段被悄悄藏起来
      if (!deps.has(dep)) throw new Error(`${name} 的显隐依赖了不存在的字段：${dep}`)
      visit(dep)
    }
    stack.pop()
    state.set(name, 'done')
    order.push(name)
  }

  for (const field of fields) visit(field.name)
  return order
}

/** 当前该显示哪些字段。顺序保持 schema 里的声明顺序，不按依赖顺序打乱界面 */
export function visibleFields(schema: FormSchema, values: Record<string, unknown>): FormFieldSpec[] {
  dependencyOrder(schema)
  return schema.fields.filter((f) => (f.when ? evaluate(f.when, values) : true))
}

/**
 * 隐藏字段的值不参与提交。
 *
 * 留着的话，用户先选了「企业」填了税号、又改回「个人」，税号会跟着提交上去——
 * 服务端看到一个不该存在的字段，轻则报错重则存下脏数据。
 */
export function submitValues(
  schema: FormSchema,
  values: Record<string, unknown>
): Record<string, unknown> {
  const visible = new Set(visibleFields(schema, values).map((f) => f.name))
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (visible.has(key)) out[key] = value
  }
  return out
}

const sizeOf = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value.length
  if (Array.isArray(value)) return value.length
  return undefined
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 同步校验。只校验当前可见的字段——隐藏字段的必填不该挡住提交，
 * 那会变成「有个看不见的字段没填」，用户永远找不到它。
 *
 * async 规则不在这里跑：它们要由宿主注册实现，见 asyncRulesOf。
 */
export function validateSchema(
  schema: FormSchema,
  values: Record<string, unknown>
): FormFieldError[] {
  const errors: FormFieldError[] = []

  const checkField = (field: FormFieldSpec, value: unknown, path: string) => {
    for (const rule of field.rules ?? []) {
      if (rule.kind === 'async') continue
      if (rule.kind === 'required') {
        if (isEmpty(value)) errors.push({ path, message: rule.message })
        continue
      }
      // 选填留空时跳过其余规则，否则「选填但有格式要求」的字段无法留空
      if (isEmpty(value)) continue
      if (rule.kind === 'min' && (sizeOf(value) ?? 0) < Number(rule.value)) {
        errors.push({ path, message: rule.message })
      }
      if (rule.kind === 'max' && (sizeOf(value) ?? 0) > Number(rule.value)) {
        errors.push({ path, message: rule.message })
      }
      if (rule.kind === 'pattern' && !new RegExp(String(rule.value)).test(String(value))) {
        errors.push({ path, message: rule.message })
      }
      if (rule.kind === 'email' && !EMAIL.test(String(value))) {
        errors.push({ path, message: rule.message })
      }
    }

    if (field.kind === 'array') {
      const rows = Array.isArray(value) ? value : []
      if (field.minItems !== undefined && rows.length < field.minItems) {
        errors.push({ path, message: `至少要有 ${field.minItems} 行` })
      }
      if (field.maxItems !== undefined && rows.length > field.maxItems) {
        errors.push({ path, message: `最多 ${field.maxItems} 行` })
      }
      rows.forEach((row, index) => {
        for (const sub of field.item ?? []) {
          checkField(sub, (row as Record<string, unknown>)?.[sub.name], `${path}[${index}].${sub.name}`)
        }
      })
    }
  }

  for (const field of visibleFields(schema, values)) {
    checkField(field, values[field.name], field.name)
  }
  return errors
}

/** 需要宿主执行的异步规则：schema 里只有名字，实现由宿主注册 */
export function asyncRulesOf(schema: FormSchema): { path: string; handler: string; message: string }[] {
  return schema.fields.flatMap((field) =>
    (field.rules ?? [])
      .filter((r) => r.kind === 'async' && r.handler)
      .map((r) => ({ path: field.name, handler: r.handler as string, message: r.message }))
  )
}

/**
 * 服务端错误落回字段。
 *
 * 对不上任何字段的错误标成 orphan 并保留原文——丢掉它等于「提交失败但没有原因」，
 * 而这正是最让人卡住的一种失败。数组子表的路径按 lines[2].quantity 解析。
 */
export function applyServerErrors(
  schema: FormSchema,
  serverErrors: { path: string; message: string }[]
): FormFieldError[] {
  const known = new Set<string>()
  for (const field of schema.fields) {
    known.add(field.name)
    for (const sub of field.item ?? []) known.add(`${field.name}.${sub.name}`)
  }

  return serverErrors.map((e) => {
    const normalized = e.path.replace(/\[\d+\]/g, '')
    return known.has(normalized)
      ? { path: e.path, message: e.message }
      : { path: e.path, message: e.message, orphan: true }
  })
}

/** 第一个出错的字段：提交失败后要把焦点送到它身上，而不是让用户自己找 */
export const firstErrorPath = (errors: FormFieldError[]): string | null =>
  errors.find((e) => !e.orphan)?.path ?? null
