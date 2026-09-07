import { useEffect } from 'react'

export interface ActionSheetAction {
  label: string
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
}

export interface ActionSheetProps {
  open: boolean
  title?: string
  actions: ActionSheetAction[]
  cancelText?: string
  onClose: () => void
}

/** 从底部升起的操作列表：移动端没有右键菜单，破坏性操作也不适合塞进下拉 */
export function ActionSheet({
  open,
  title,
  actions,
  cancelText = '取消',
  onClose
}: ActionSheetProps) {
  // 打开时锁住页面滚动，否则背后的列表会跟着手势一起动
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div className="i-action-sheet" onClick={onClose}>
      <div
        className="i-action-sheet__panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="i-action-sheet__title">{title}</div>}
        {actions.map((action) => (
          <button
            key={action.label}
            className={[
              'i-action-sheet__item',
              action.danger ? 'is-danger' : '',
              action.disabled ? 'is-disabled' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            disabled={action.disabled}
            onClick={() => { action.onSelect?.(); onClose() }}
          >
            {action.label}
          </button>
        ))}
        <button className="i-action-sheet__item i-action-sheet__cancel" type="button" onClick={onClose}>
          {cancelText}
        </button>
      </div>
    </div>
  )
}
