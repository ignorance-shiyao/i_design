import { useMemo, useState } from 'react'
import { summarizeTasks, type AgentTask } from '@i-design/common'
import { Icon } from './Icon'
import { Loading } from './Loading'

export interface AgentTasksProps {
  tasks: AgentTask[]
  /** 胶囊适合稀疏展示，列表适合密集场景 */
  variant?: 'capsule' | 'list'
  /** 显示底部的完成计数 */
  showSummary?: boolean
  onSelect?: (task: AgentTask) => void
}

export function AgentTasks({
  tasks,
  variant = 'capsule',
  showSummary = true,
  onSelect
}: AgentTasksProps) {
  const [opened, setOpened] = useState<Set<string>>(new Set())
  const summary = useMemo(() => summarizeTasks(tasks), [tasks])

  const toggle = (task: AgentTask) => {
    onSelect?.(task)
    if (!task.detail) return
    setOpened((current) => {
      const next = new Set(current)
      if (next.has(task.id)) next.delete(task.id)
      else next.add(task.id)
      return next
    })
  }

  return (
    <div className={`i-tasks i-tasks--${variant}`}>
      {tasks.map((task) => (
        <div key={task.id}>
          <div
            className={`i-task is-${task.status}`}
            role="button"
            tabIndex={0}
            aria-expanded={task.detail ? opened.has(task.id) : undefined}
            onClick={() => toggle(task)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                toggle(task)
              }
            }}
          >
            {/*
              状态标记同时用形状与颜色：完成是勾、失败是叉、进行中是转圈、待办是序号。
              只靠颜色的话，灰绿两色在灰度打印下分不出来。
            */}
            <span className="i-task__mark">
              {task.status === 'completed' && <Icon name="check" size={13} strokeWidth={2.6} />}
              {task.status === 'failed' && <Icon name="close" size={13} strokeWidth={2.6} />}
              {task.status === 'running' && <Loading size="sm" />}
              {task.status === 'pending' && (task.step ?? '')}
            </span>

            <span className="i-task__title">{task.title}</span>
            {task.meta && <span className="i-task__meta">{task.meta}</span>}
            {task.detail && (
              <Icon
                className={`i-task__arrow${opened.has(task.id) ? ' is-open' : ''}`}
                name="chevron-right"
                size={14}
              />
            )}
          </div>

          {task.detail && opened.has(task.id) && (
            <p className="i-task__detail">{task.detail}</p>
          )}
        </div>
      ))}

      {showSummary && tasks.length > 0 && (
        <p className="i-tasks__summary">
          {summary.completed} / {summary.total} 已完成
          {summary.failed > 0 && ` · ${summary.failed} 项失败`}
          {summary.running > 0 && ` · ${summary.running} 项进行中`}
        </p>
      )}
    </div>
  )
}
