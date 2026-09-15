import { useEffect, useState } from 'react'
import {
  describeRun,
  elapsedInterval,
  elapsedParts,
  shouldShowElapsed,
  type ConnectionPhase,
  type RunStatus as RunLifecycleStatus
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface RunStatusProps {
  status: RunLifecycleStatus
  /** 队列里前面还有几个。不给表示服务端没有队列信息，界面就不编一个出来 */
  queuePosition?: number
  connection?: ConnectionPhase
  /** 第几次连接尝试，从 0 起 */
  attempt?: number
  /** 下一次重试的时刻（毫秒时间戳） */
  retryAt?: number
  /** 这次运行开始等待的时刻。给了才显示「已等 N 秒」 */
  startedAt?: number
  cancelText?: string
  onCancel?: () => void
  className?: string
}

/**
 * 一次运行停在哪儿。
 *
 * 出字之前那段静止有好几种原因——在排队、在连接、断了正在重连、在等人点一下。
 * 只转一个圈的话它们长得一模一样。判定在 logic/lifecycle.ts，各端共用一份。
 */
export function RunStatus({
  status,
  queuePosition,
  connection,
  attempt = 0,
  retryAt,
  startedAt,
  cancelText = '取消',
  onCancel,
  className = ''
}: RunStatusProps) {
  const [now, setNow] = useState(() => Date.now())
  const notice = describeRun({ status, queuePosition, connection, attempt, retryAt, startedAt, now })

  /*
   * 自己走的时钟，只在还没结束时跑。对齐到整秒而不是固定 1000ms：
   * 固定间隔会累积漂移，等上两分钟显示的秒数会明显比真实时间慢。
   */
  useEffect(() => {
    if (!notice.busy) return
    const id = setTimeout(() => setNow(Date.now()), elapsedInterval(Date.now()))
    return () => clearTimeout(id)
  }, [notice.busy, now])

  /** 三秒以内的等待不挂计时：那点时间还来不及让人怀疑是不是卡了 */
  let waited = ''
  if (startedAt !== undefined && shouldShowElapsed(notice.waited)) {
    const { minutes, seconds } = elapsedParts(notice.waited)
    waited = minutes > 0 ? `已等 ${minutes} 分 ${seconds} 秒` : `已等 ${seconds} 秒`
  }

  return (
    <div
      className={['i-run-status', `i-run-status--${notice.tone}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-label={notice.detail ? `${notice.label}，${notice.detail}` : notice.label}
    >
      <span className="i-run-status__icon">
        <Icon name={notice.icon} size={16} />
        {/* 转圈是纯装饰：状态已经由上面的 aria-label 说过了 */}
        {notice.busy ? <span className="i-run-status__spinner" aria-hidden="true" /> : null}
      </span>

      <span className="i-run-status__body">
        <span className="i-run-status__label">{notice.label}</span>
        {notice.detail ? <span className="i-run-status__detail">{notice.detail}</span> : null}
      </span>

      {waited ? <span className="i-run-status__waited">{waited}</span> : null}

      {notice.cancelable ? (
        <Button className="i-run-status__cancel" size="sm" onClick={onCancel}>
          {cancelText}
        </Button>
      ) : null}
    </div>
  )
}
