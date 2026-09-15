/**
 * 运行还没开始出字的那几种状态，怎么说给人听。
 *
 * 一次智能体调用在真正吐出第一个字之前，可能已经过去十几秒。
 * 这段时间里界面完全静止，而静止有好几种完全不同的原因：
 *
 *   排队中    服务端并发满了，请求在队里。用户什么也做不了，只能等或者取消，
 *             但只要知道「前面还有 3 个」，等就是有尽头的。
 *   连接中    已经轮到它了，正在建立连接。通常一两秒，久了就是网络有问题。
 *   重连中    连接断过，正在自动重试。这一态最不能含糊：用户必须知道
 *             「它会自己再试一次」和「下一次是几秒之后」，否则他会去刷新页面，
 *             而刷新会把已经生成的那半截答案丢掉。
 *   等人确认  停在这儿不是机器慢，是在等人点一下。这时候转圈是误导。
 *
 * 全都只显示一个转圈的话，这四种状态在屏幕上长得一模一样，
 * 用户没有任何依据判断该继续等、该重试，还是该去检查网络。
 * `run.ts` 的 reducer 里这些状态一直都在，只是从来没说出来过。
 *
 * 判定放在这里而不是各端组件里，是因为「什么时候能取消」「倒计时怎么进位」
 * 这类规则一旦各端各写一遍，就会出现同一个运行在网页上还能取消、
 * 在小程序里按钮已经灰了。
 */
import type { IconName } from '../icons'
import type { RunStatus } from '../contracts/run'

/** 传输层的连接态。与 RunStatus 分开：一次运行的状态与一条连接的状态不是一回事 */
export type ConnectionPhase = 'idle' | 'connecting' | 'streaming' | 'reconnecting' | 'closed'

export interface RunProgress {
  status: RunStatus
  /** 队列里前面还有几个。0 表示轮到它了；不给表示服务端没有队列信息 */
  queuePosition?: number
  /** 连接态。`reconnecting` 只能从这里来——它不是运行的状态，是连接的 */
  connection?: ConnectionPhase
  /** 第几次连接尝试，从 0 起。0 是首次，大于 0 是重连 */
  attempt?: number
  /** 下一次重试的时刻（毫秒时间戳）。断线等待期间用它倒计时 */
  retryAt?: number
  /** 这次运行开始等待的时刻 */
  startedAt?: number
  now: number
}

/** 四类语气。决定图标的前景色与淡底色块，不决定有没有文字——文字永远有 */
export type NoticeTone = 'neutral' | 'progress' | 'success' | 'danger'

export interface RunNotice {
  tone: NoticeTone
  /*
   * 图标名。用图标表的联合类型而不是 string：写错一个名字，
   * 界面上是一个空位，没有任何报错——而这一条正是要说清状态的那一格。
   */
  icon: IconName
  /** 状态本身。颜色不是唯一线索，灰度打印与色觉障碍都只能靠它 */
  label: string
  /** 补充：排第几、第几次重连、还有几秒重试。没有补充时是空串 */
  detail: string
  /** 要不要转圈。等人确认时不转——那不是机器在忙 */
  busy: boolean
  /** 这一刻能不能取消 */
  cancelable: boolean
  /** 已经等了多久（毫秒）。没给 startedAt 时是 0 */
  waited: number
}

/**
 * 距离下一次重试还有几秒。
 *
 * 向上取整：显示「3 秒后重试」时真实剩余时间不超过 3 秒，
 * 向下取整会先显示「0 秒后重试」再干等一下，那比不显示还让人起疑。
 */
export function retryCountdown(retryAt: number, now: number): number {
  return Math.max(0, Math.ceil((retryAt - now) / 1000))
}

/**
 * 这一刻在排队还是在连接。
 *
 * 只看 `status` 是不够的：重连是连接的状态，运行的状态在重连期间仍然是
 * `streaming`（它确实已经开始流式输出了，只是断了）。两者取其重——
 * 断线比「正在出字」更需要说出来。
 */
export function describeRun(progress: RunProgress): RunNotice {
  const { status, connection, now, startedAt } = progress
  const waited = startedAt === undefined ? 0 : Math.max(0, now - startedAt)
  const attempt = progress.attempt ?? 0

  const notice = (
    tone: NoticeTone,
    icon: IconName,
    label: string,
    detail: string,
    busy: boolean,
    cancelable: boolean
  ): RunNotice => ({ tone, icon, label, detail, busy, cancelable, waited })

  // 终态优先：已经结束的运行不该因为连接还没关干净而显示「重连中」
  if (status === 'completed') return notice('success', 'check-circle', '已完成', '', false, false)
  if (status === 'failed') return notice('danger', 'error-circle', '生成失败', '', false, false)
  if (status === 'cancelled') return notice('neutral', 'close', '已取消', '', false, false)

  // 断线压过一切进行中的状态：它是唯一一个「用户不做什么就可能永远停在这儿」的情况
  if (connection === 'reconnecting') {
    const rounds = attempt > 0 ? `第 ${attempt} 次重连` : '正在重连'
    const countdown =
      progress.retryAt === undefined ? '' : `，${retryCountdown(progress.retryAt, now)} 秒后重试`
    return notice('danger', 'offline', '连接断开', `${rounds}${countdown}`, true, true)
  }

  if (status === 'awaiting-approval') {
    // 不转圈：停在这儿是在等人，转圈会让人以为再等等就好了
    return notice('neutral', 'help-circle', '等待确认', '需要你确认后继续', false, true)
  }

  if (status === 'queued') {
    const { queuePosition } = progress
    const detail =
      queuePosition === undefined
        ? ''
        : queuePosition > 0
          ? `前面还有 ${queuePosition} 个请求`
          : '马上就轮到了'
    return notice('neutral', 'clock', '排队中', detail, true, true)
  }

  if (status === 'connecting' || connection === 'connecting') {
    return notice('progress', 'network', '连接中', '正在建立连接', true, true)
  }

  return notice('progress', 'sparkle', '生成中', '', true, true)
}
