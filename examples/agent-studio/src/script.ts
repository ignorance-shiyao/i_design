/**
 * Agent 第一切片的运行脚本（astra.md 的 G08）。
 *
 * 四条分支——成功、取消、失败、拒绝——都写成**同一种东西**：一串 `RunEvent`。
 * 这不是为了省事，是这条切片的全部意义所在：
 *
 * 真实链路上这四种结局走的是同一条管道，差别只在最后几条事件。示例里若把
 * 「成功」写成一段顺序代码、把「失败」写成一个 try/catch，那么演出来的失败
 * 与真实的失败不是一回事——真实的失败会停在某个中间状态上，而顺序代码里的
 * catch 只会跳过后面全部。做成事件之后，「失败」就是**少了后面几条、多了一条
 * run.failed**，中间那些已经发生过的事（工具已经调过、钱已经查过）照样留在屏幕上，
 * 这正是用户需要看到的：失败不等于什么都没发生。
 *
 * 也因此它们天然可重放：同一串事件喂进同一个 reducer，得到同一个结果。
 */
import type { RunEvent } from '@i-design/common'

export type Outcome = 'success' | 'cancelled' | 'failed' | 'rejected'

export const OUTCOMES: readonly { value: Outcome; label: string; hint: string }[] = [
  { value: 'success', label: '成功', hint: '人确认之后产出报价单' },
  { value: 'rejected', label: '拒绝', hint: '人看过依据后否掉，产物不产出' },
  { value: 'cancelled', label: '取消', hint: '生成到一半被叫停，工具结果仍留在屏幕上' },
  { value: 'failed', label: '失败', hint: '工具返回之后模型失败，已查到的数据不丢' }
]

/*
 * 运行起点默认取**真实的此刻**，而不是一个写死的时间戳。
 *
 * 一开始这里是个固定时刻，为的是截图稳定。结果是：确认卡在屏幕上直接显示
 * 「已过期」，运行状态显示「已等 529332 分钟」——因为这些组件按真实时钟算，
 * 而那个固定时刻早就过去了。截图稳定换来一个从第一眼就是错的界面，不划算。
 *
 * 确定性在这条切片里由**事件序列**保证（同一串事件、同一个投递顺序），
 * 不靠冻结时钟；时间只影响「还有多久过期」这类相对文案。
 */
const RUN_ID = 'run-8842'
const MSG = 'msg-answer'

/** 确认的有效期：演示里给两分钟，正好能演出「快过期」与「已过期」 */
export const APPROVAL_TTL = 2 * 60 * 1000

/**
 * 把一次运行摊成事件。
 *
 * 前半段四条分支完全一样——问题进来、查库存、查历史成交、开始回答、请求确认。
 * 这是刻意的：**分叉点只有一个**，就在人做决定之后。
 */
export function scriptFor(outcome: Outcome, startAt: number = Date.now()): RunEvent[] {
  let seq = 0
  const at = (ms: number) => startAt + ms
  /* 事件是可辨识联合，逐个分支写泛型约束没有意义：这里只补三个公共字段 */
  const next = (event: Record<string, unknown>, ms: number): RunEvent =>
    ({ ...event, runId: RUN_ID, seq: (seq += 1), at: at(ms) }) as RunEvent

  const events: RunEvent[] = [
    next({ type: 'run.started' }, 0),

    // 工具先行：回答要有依据，依据要看得见
    next({
      type: 'tool.called',
      toolCallId: 'tool-stock',
      name: 'query_stock',
      input: { sku: 'PK-200', warehouse: '华东仓' }
    }, 300),
    next({
      type: 'tool.result',
      toolCallId: 'tool-stock',
      status: 'succeeded',
      output: { sku: 'PK-200', onHand: 1840, reserved: 260, available: 1580 }
    }, 900),
    next({
      type: 'tool.called',
      toolCallId: 'tool-deals',
      name: 'query_recent_deals',
      input: { customer: '明远制造', months: 6 }
    }, 950),
    next({
      type: 'tool.result',
      toolCallId: 'tool-deals',
      status: 'succeeded',
      output: { count: 3, avgUnitPrice: 46.5, lastAt: '2026-08-21' }
    }, 1600),

    next({ type: 'message.started', messageId: MSG, role: 'assistant' }, 1700),
    next({
      type: 'part.delta',
      messageId: MSG,
      partId: 'p1',
      kind: 'text',
      text: '明远制造近半年成交 3 单，均价 46.5 元；华东仓 PK-200 可用 1580 件。\n'
    }, 1900),
    next({
      type: 'part.delta',
      messageId: MSG,
      partId: 'p1',
      kind: 'text',
      text: '按 2000 件报价，建议单价 44.8 元（较均价让 3.7%），交期 7 天。'
    }, 2300),
    next({ type: 'part.completed', messageId: MSG, partId: 'p1' }, 2400),

    // 报价要发给客户，这一步必须人点头
    next({
      type: 'approval.requested',
      approvalId: 'ap-1',
      action: 'send_quote',
      summary: '向明远制造发送报价：2000 件 × 44.8 元，交期 7 天',
      expiresAt: at(2400) + APPROVAL_TTL
    }, 2450)
  ]

  if (outcome === 'cancelled') {
    // 取消停在「等人确认」上：工具结果与已写出的正文都还在
    events.push(next({ type: 'run.cancelled' }, 3000))
    return events
  }

  if (outcome === 'failed') {
    events.push(
      next({ type: 'approval.resolved', approvalId: 'ap-1', decision: 'approved' }, 3000),
      next({ type: 'run.failed', error: '报价单服务没有响应（上游超时）' }, 3600)
    )
    return events
  }

  if (outcome === 'rejected') {
    events.push(
      next({ type: 'approval.resolved', approvalId: 'ap-1', decision: 'rejected' }, 3000),
      // 拒绝之后运行是**正常结束**的，不是失败：人做了决定，系统照做了
      next({ type: 'message.completed', messageId: MSG }, 3100),
      next({ type: 'run.completed' }, 3200)
    )
    return events
  }

  events.push(
    next({ type: 'approval.resolved', approvalId: 'ap-1', decision: 'approved' }, 3000),
    next({
      type: 'artifact.emitted',
      artifactId: 'quote',
      kind: 'document',
      title: '明远制造报价单',
      version: 1,
      meta: { summary: '2000 件 × 44.8 元，交期 7 天' }
    }, 3400),
    // 第二版：人确认之后又按财务口径改了付款方式，两版之间要看得出改了哪几行
    next({
      type: 'artifact.emitted',
      artifactId: 'quote',
      kind: 'document',
      title: '明远制造报价单',
      version: 2,
      meta: { summary: '同上，付款方式改为月结 30 天' }
    }, 3800),
    next({ type: 'message.completed', messageId: MSG }, 3900),
    next({ type: 'run.completed' }, 4000)
  )
  return events
}

/** 产物两版的正文。放在这里而不是事件里：事件契约只带元信息，正文由产物服务给 */
export const QUOTE_VERSIONS: Record<number, string> = {
  1:
    '一、标的：PK-200，2000 件\n' +
    '二、单价：44.8 元（较近半年均价让 3.7%）\n' +
    '三、交期：7 个工作日，华东仓直发\n' +
    '四、付款：货到付款',
  2:
    '一、标的：PK-200，2000 件\n' +
    '二、单价：44.8 元（较近半年均价让 3.7%）\n' +
    '三、交期：7 个工作日，华东仓直发\n' +
    '四、付款：月结 30 天，需财务复核\n' +
    '五、本报价有效期 14 天'
}
