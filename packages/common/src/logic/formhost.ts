/**
 * 表单壳的纯逻辑（astra.md 的 B09）。
 *
 * SchemaForm 负责「一张表单里的字段怎么算」，这一层负责「这张表单被放进
 * 页面 / 抽屉 / 弹窗 / 分步流程之后，围着它的那些事怎么算」。四种形态长得
 * 很不一样，但要解决的是同一批问题，而且每一个都是在真实业务里踩出来的：
 *
 *   重复提交    网络慢的时候人一定会再点一次。前端不拦就会发出两笔订单，
 *               而服务端幂等是另一道防线，不是不做这道的理由。
 *   失败保留输入  提交失败就把表单清空，是最容易被当成「它坏了」的行为——
 *               用户刚填的二十个字段没了，他不会再填第二遍。
 *   离开保护    改了一半点了返回、关了抽屉、刷新页面。没改过的表单不该拦，
 *               拦了会让「点错了想退出去」变成一次多余的确认。
 *   重置范围    「重置」到底是清空、还是回到打开时的样子、还是回到上次存的草稿？
 *               三种都有人要，含糊的那一种最危险：用户以为是撤销，结果是清空。
 *   分步不丢数据  返回上一步再回来，填过的必须还在。这一条看着理所当然，
 *               实现上却常常败给「进入某一步就重新初始化」。
 *
 * 这些判断放在这里而不是各端组件里，是因为它们全都是「该不该拦住用户」这类
 * 决定——各端各判一遍，就会出现同一张表在网页上拦住了、在小程序里直接放走。
 */

/* ---------- 提交闸门 ---------- */

export type SubmitPhase = 'idle' | 'submitting' | 'failed' | 'succeeded'

export interface SubmitGateInput {
  phase: SubmitPhase
  /** 表单本身校验通过了吗 */
  valid: boolean
  /** 整张表被外部禁用（没有权限、只读态） */
  disabled?: boolean
  /** 提交成功之后还允许再提交吗。默认不允许——成功了就该走开了 */
  resubmittable?: boolean
}

export interface SubmitGate {
  /** 这一刻能不能真的发出去 */
  allowed: boolean
  /** 按钮要不要显示加载中 */
  busy: boolean
  /** 拦下来的原因。allowed 为 true 时是空串 */
  reason: string
}

/**
 * 这一刻能不能提交。
 *
 * 判定顺序就是给用户的解释顺序：正在发的时候说「正在提交」而不是「表单有错」——
 * 后者会让他以为是自己填错了，回头去逐个字段找。
 */
export function submitGate(input: SubmitGateInput): SubmitGate {
  if (input.disabled) return { allowed: false, busy: false, reason: '当前不可提交' }
  if (input.phase === 'submitting') {
    // 这一档就是重复提交的闸：人一定会在网络慢的时候再点一次
    return { allowed: false, busy: true, reason: '正在提交，请稍候' }
  }
  if (input.phase === 'succeeded' && !input.resubmittable) {
    return { allowed: false, busy: false, reason: '已提交' }
  }
  if (!input.valid) return { allowed: false, busy: false, reason: '还有字段没填对' }
  return { allowed: true, busy: false, reason: '' }
}

/* ---------- 改没改过 ---------- */

/**
 * 与基准相比，哪些字段变了。
 *
 * 用「逐字段比对」而不是「有没有 input 事件」：用户把字改了又改回去，
 * 那就是没改过，这时候拦住他是纯粹的骚扰。
 *
 * 比较用 JSON 序列化：表单值是可序列化的（它最终要发出去），
 * 深比较自己写一份反而会在数组与 null 上各端不一致。
 */
export function changedFields(
  base: Record<string, unknown>,
  current: Record<string, unknown>
): string[] {
  const keys = [...new Set([...Object.keys(base), ...Object.keys(current)])].sort()
  return keys.filter((key) => JSON.stringify(base[key]) !== JSON.stringify(current[key]))
}

export function isDirty(
  base: Record<string, unknown>,
  current: Record<string, unknown>
): boolean {
  return changedFields(base, current).length > 0
}

export interface LeaveGuardInput {
  base: Record<string, unknown>
  current: Record<string, unknown>
  phase: SubmitPhase
  /** 已经存过草稿的话，离开不会丢东西，可以不拦 */
  draftSaved?: boolean
}

export interface LeaveGuard {
  /** 要不要拦一下 */
  blocked: boolean
  /** 拦住时说什么。不拦时是空串 */
  message: string
}

/**
 * 现在离开要不要拦。
 *
 * 三种不拦：没改过、正在提交（提交完自己会走）、已经提交成功。
 * 存过草稿也不拦——东西没丢，拦住只会让人以为出了事。
 */
export function leaveGuard(input: LeaveGuardInput): LeaveGuard {
  if (input.phase === 'submitting' || input.phase === 'succeeded') {
    return { blocked: false, message: '' }
  }
  const changed = changedFields(input.base, input.current)
  if (!changed.length) return { blocked: false, message: '' }
  if (input.draftSaved) return { blocked: false, message: '' }
  return {
    blocked: true,
    message: `有 ${changed.length} 项修改还没保存，确定离开吗？`
  }
}

/* ---------- 重置范围 ---------- */

/**
 * 「重置」到底重置到哪儿。
 *
 * `initial` 回到打开这张表时的样子（编辑态下就是原始数据），
 * `draft` 回到上次存的草稿，`empty` 才是真的清空。
 *
 * 默认是 `initial` 而不是 `empty`：多数人按下「重置」时想的是「撤销我刚才的改动」，
 * 而不是「把这条记录的原始内容也一起抹掉」。
 */
export type ResetScope = 'initial' | 'draft' | 'empty'

export function resetValues(
  scope: ResetScope,
  initial: Record<string, unknown>,
  draft?: Record<string, unknown>
): Record<string, unknown> {
  if (scope === 'empty') return {}
  // 要回到草稿却没有草稿时，退回到初始值而不是清空：
  // 「没有草稿」不是「用户想清空」的理由
  if (scope === 'draft') return { ...(draft ?? initial) }
  return { ...initial }
}

/** 重置按钮上该写什么。含糊的「重置」正是最危险的那一种 */
export function resetLabel(scope: ResetScope, hasDraft = false): string {
  if (scope === 'empty') return '清空'
  if (scope === 'draft') return hasDraft ? '回到草稿' : '撤销修改'
  return '撤销修改'
}

/* ---------- 分步 ---------- */

export interface StepSpec {
  key: string
  title: string
  /** 这一步用到哪些字段。校验与「哪一步出了错」都靠它 */
  fields: string[]
  /** 可跳过的步骤不拦「下一步」 */
  optional?: boolean
}

export interface StepStateInput {
  steps: StepSpec[]
  index: number
  /** 当前所有字段的错误路径 */
  errorPaths: string[]
  /** 已经走过的步骤下标。返回上一步再回来时，它决定要不要显示错误 */
  visited: number[]
}

export interface StepState {
  index: number
  /** 这一步自己有没有错 */
  blocked: boolean
  canPrev: boolean
  canNext: boolean
  isLast: boolean
  /** 每一步的状态，给步骤条用 */
  marks: { key: string; title: string; state: 'done' | 'current' | 'error' | 'todo' }[]
}

/**
 * 分步表单此刻的状态。
 *
 * 两条不显然的规则：
 *
 * - **只用「这一步自己的字段」判断能不能往下走**。拿整张表的错误去拦，
 *   会出现第一步填得好好的却点不动下一步，而错在他还没看到的第三步。
 * - **没走到过的步骤不标红**。一进来就满屏红叉，说的是「你还没填」，
 *   不是「你填错了」——那会让人以为自己已经搞砸了。
 */
export function stepState(input: StepStateInput): StepState {
  const { steps, index, errorPaths, visited } = input
  const errored = new Set(errorPaths)
  const stepHasError = (step: StepSpec) => step.fields.some((f) => errored.has(f))

  const current = steps[index]
  const blocked = current ? !current.optional && stepHasError(current) : false

  return {
    index,
    blocked,
    canPrev: index > 0,
    canNext: index < steps.length - 1 && !blocked,
    isLast: index === steps.length - 1,
    marks: steps.map((step, i) => ({
      key: step.key,
      title: step.title,
      state:
        i === index
          ? 'current'
          : // 没走到过的不标红：那说的是「还没填」，不是「填错了」
            visited.includes(i) && stepHasError(step)
            ? 'error'
            : visited.includes(i)
              ? 'done'
              : 'todo'
    }))
  }
}

/**
 * 提交失败时该跳到哪一步。
 *
 * 服务端把错误落回字段之后，光在当前步显示一句「提交失败」没有用——
 * 错的字段可能在第一步，而用户正站在第三步上，他只会反复点提交。
 * 返回 -1 表示错误不属于任何一步（表单级错误），原地显示即可。
 */
export function stepOfError(steps: StepSpec[], errorPaths: string[]): number {
  const errored = new Set(errorPaths)
  return steps.findIndex((step) => step.fields.some((f) => errored.has(f)))
}
