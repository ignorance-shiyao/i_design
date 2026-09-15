import { useState } from 'react'
import {
  isActive,
  markAllSeen,
  markSeen,
  taskBadge,
  taskNotice,
  taskOrder,
  taskTrail,
  type AsyncTaskItem,
  type IconName,
  type TaskState,
  type TaskTarget
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'
import { Loading } from './Loading'

export interface TaskCenterProps {
  tasks: AsyncTaskItem[]
  title?: string
  /** 把时间戳排成人话。放在调用方：时区是各端从系统拿的 */
  formatTime?: (ms: number) => string
  showTrail?: boolean
  onOpen?: (target: TaskTarget, task: AsyncTaskItem) => void
  /** 没有业务对象时点「查看任务详情」 */
  onInspect?: (task: AsyncTaskItem) => void
  onRetry?: (task: AsyncTaskItem) => void
  onCancel?: (task: AsyncTaskItem) => void
  onTasksChange?: (tasks: AsyncTaskItem[]) => void
  className?: string
}

/* 状态图标同时给形状与文字：灰度打印下失败与完成是同一个灰 */
const ICONS: Record<TaskState, IconName> = {
  queued: 'clock',
  running: 'refresh',
  succeeded: 'check',
  failed: 'error-circle',
  cancelled: 'close'
}
const STATE_LABELS: Record<TaskState, string> = {
  queued: '排队中',
  running: '进行中',
  succeeded: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

/**
 * 异步任务中心（astra.md 的 B18）。
 *
 * 判断全在 logic/taskcenter.ts，五端共用一份：任务号与影响对象一直摆在界面上、
 * 角标只数「要人处理的」因而有归零的一天、结束的任务给一个点得下去的出口。
 */
export function TaskCenter({
  tasks,
  title = '任务中心',
  formatTime = (ms: number) => new Date(ms).toLocaleString('zh-CN'),
  showTrail = false,
  onOpen,
  onInspect,
  onRetry,
  onCancel,
  onTasksChange,
  className = ''
}: TaskCenterProps) {
  const [opened, setOpened] = useState<string[]>([])
  const ordered = taskOrder(tasks)
  const badge = taskBadge(tasks)
  const trailOpen = (id: string) => showTrail || opened.includes(id)

  const open = (task: AsyncTaskItem) => {
    // 看过了就从角标里去掉——「看过」不等于「处理完了」，失败的也照样标
    onTasksChange?.(markSeen(tasks, task.id))
    if (task.target) onOpen?.(task.target, task)
    else onInspect?.(task)
  }

  return (
    <section className={`i-task-center ${className}`.trim()}>
      <header className="i-task-center__head">
        <span className="i-task-center__title">{title}</span>
        {badge.count > 0 && <span className="i-task-center__badge">{badge.count}</span>}
        <span className="i-task-center__summary" role="status">
          {badge.text}
        </span>
        {badge.count > 0 && (
          <Button size="sm" onClick={() => onTasksChange?.(markAllSeen(tasks))}>
            全部标为已读
          </Button>
        )}
      </header>

      {ordered.length ? (
        <ul className="i-task-center__list">
          {ordered.map((task) => {
            const notice = taskNotice(task)
            const unseen = !isActive(task) && !task.seen
            return (
              <li
                key={task.id}
                className={`i-task-center__item i-task-center__item--${task.state}${
                  unseen ? ' is-unseen' : ''
                }`}
              >
                <span className="i-task-center__icon">
                  {task.state === 'running' ? (
                    <Loading size="sm" />
                  ) : (
                    <Icon name={ICONS[task.state]} size={16} />
                  )}
                </span>

                <div className="i-task-center__main">
                  <div className="i-task-center__name">
                    <span>{task.title}</span>
                    <span className="i-task-center__state">{STATE_LABELS[task.state]}</span>
                  </div>
                  <p className="i-task-center__detail">
                    {notice?.description ??
                      (task.target
                        ? `${task.target.kind}「${task.target.label}」`
                        : `任务 ${task.id}`)}
                  </p>
                </div>

                <div className="i-task-center__actions">
                  {isActive(task) ? (
                    <Button size="sm" onClick={() => onCancel?.(task)}>
                      取消
                    </Button>
                  ) : (
                    <>
                      {task.state === 'failed' && (
                        <Button size="sm" onClick={() => onRetry?.(task)}>
                          重试
                        </Button>
                      )}
                      {/* 出口永远有：没有业务对象时至少能去任务详情 */}
                      <Button size="sm" variant="primary" onClick={() => open(task)}>
                        {notice?.actionLabel ?? '查看任务详情'}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    aria-expanded={trailOpen(task.id)}
                    onClick={() =>
                      setOpened((prev) =>
                        prev.includes(task.id)
                          ? prev.filter((id) => id !== task.id)
                          : [...prev, task.id]
                      )
                    }
                  >
                    {trailOpen(task.id) ? '收起' : '追踪'}
                  </Button>
                </div>

                {/* 追踪行：任务号排第一，用户打给客服时能报出来的只有它 */}
                {trailOpen(task.id) && (
                  <ul className="i-task-center__trail">
                    {taskTrail(task, formatTime).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="i-task-center__empty">
          还没有任务。导出、导入这类要跑一会儿的动作会出现在这里。
        </p>
      )}
    </section>
  )
}
