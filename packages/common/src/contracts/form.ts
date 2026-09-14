/**
 * 表单 schema 契约（astra.md 的 B08）。
 *
 * **为什么条件是数据而不是字符串。** 见过太多 schema 里写
 * `"visible": "values.type === 'company'"` 然后在运行时 eval 的做法：
 * 那等于把任意代码执行权交给 schema 的来源——而 schema 常常来自接口。
 * 所以这里的条件是一棵可判定的数据结构，求值器只认识固定的几个算子，
 * 遇到不认识的算子报错而不是想办法执行它。
 *
 * **为什么依赖要显式。** 字段之间的显隐与联动构成一张图，图里有环的话
 * （A 显示依赖 B，B 显示又依赖 A）求值会摆动或者死循环。环必须在装配时
 * 就报出来，而不是等用户填到那一步。
 */

/** 名字带 Form 前缀是为了和图表契约里的 FieldKind（维度/度量/时间）区分开 */
export type FormFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'switch'
  | 'date'
  | 'array'

export interface FormFieldOption {
  value: string
  label: string
  /** 不可选的原因。禁用而不说原因，用户只会反复点它 */
  disabledReason?: string
}

/** 条件的算子表。求值器只认识这几个——扩算子要改这里，而不是往 schema 里塞代码 */
export type ConditionOp = 'eq' | 'ne' | 'in' | 'not-in' | 'truthy' | 'falsy' | 'gt' | 'lt'

export interface Condition {
  /** 依赖哪个字段的值 */
  field: string
  op: ConditionOp
  /** truthy / falsy 不需要 value */
  value?: unknown
}

export interface ConditionGroup {
  all?: (Condition | ConditionGroup)[]
  any?: (Condition | ConditionGroup)[]
  not?: Condition | ConditionGroup
}

export type Visibility = Condition | ConditionGroup

export interface FormFieldRule {
  kind: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'async'
  /** min / max 的界，pattern 的正则源文本 */
  value?: number | string
  message: string
  /** async 规则的标识，由宿主注册真正的实现——schema 里不出现函数 */
  handler?: string
}

export interface FormFieldSpec {
  name: string
  label: string
  kind: FormFieldKind
  placeholder?: string
  help?: string
  options?: FormFieldOption[]
  rules?: FormFieldRule[]
  /** 满足条件时才显示。不写＝总是显示 */
  when?: Visibility
  /** kind 为 array 时的子表字段 */
  item?: FormFieldSpec[]
  /** 数组子表的行数下限与上限 */
  minItems?: number
  maxItems?: number
}

export interface FormSchema {
  fields: FormFieldSpec[]
}

export interface FormFieldError {
  /** 字段路径，数组子表写成 lines[2].quantity */
  path: string
  message: string
  /** 服务端返回但对不上任何字段时为 true，界面要把它显示在表单级别 */
  orphan?: boolean
}
