/**
 * 表单校验规则。
 *
 * 一条规则只表达一件事，多条规则按声明顺序依次执行，
 * 遇到第一条不通过即停止——用户一次只需要看到一个错误。
 */
export interface FormRule {
  required?: boolean
  /** 字符串长度 / 数组元素个数 / 数字大小的下限与上限 */
  min?: number
  max?: number
  pattern?: RegExp
  /** 自定义校验：返回 true 通过，返回字符串作为错误信息；支持异步 */
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>
  /** 该条规则的错误提示；validator 返回字符串时以返回值优先 */
  message?: string
  /** 触发时机，默认两者都触发 */
  trigger?: 'change' | 'blur' | 'both'
}

function isEmpty(value: unknown) {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** 取长度用于 min/max：字符串按字符数，数组按元素数，数字按其自身大小 */
function sizeOf(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value.length
  if (Array.isArray(value)) return value.length
  return undefined
}

async function checkOne(value: unknown, rule: FormRule): Promise<string | null> {
  if (rule.required && isEmpty(value)) return rule.message ?? '此项为必填项'

  // 非必填项留空时跳过其余校验，否则「选填但有格式要求」的字段无法留空
  if (isEmpty(value) && !rule.required) return null

  const size = sizeOf(value)
  if (rule.min !== undefined && size !== undefined && size < rule.min) {
    return rule.message ?? `不能少于 ${rule.min}`
  }
  if (rule.max !== undefined && size !== undefined && size > rule.max) {
    return rule.message ?? `不能超过 ${rule.max}`
  }
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return rule.message ?? '格式不正确'
  }
  if (rule.validator) {
    const result = await rule.validator(value)
    if (result === false) return rule.message ?? '校验未通过'
    if (typeof result === 'string') return result
  }
  return null
}

/** 依次执行规则，返回第一条错误信息；全部通过返回 null */
export async function runRules(
  value: unknown,
  rules: FormRule[],
  trigger?: 'change' | 'blur'
): Promise<string | null> {
  for (const rule of rules) {
    const scope = rule.trigger ?? 'both'
    if (trigger && scope !== 'both' && scope !== trigger) continue
    const error = await checkOne(value, rule)
    if (error) return error
  }
  return null
}
