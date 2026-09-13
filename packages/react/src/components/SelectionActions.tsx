/**
 * 选区操作：选中一段文字，就地把它交给智能体。
 *
 * 浮在选区旁边而不是页面角上：选中一段话之后再把视线挪到别处去找入口，
 * 中途很容易碰一下页面把选区清掉——那时用户得重选一遍，而他并不知道
 * 自己做错了什么。浮条跟着选区走，手不用离开刚才那片。
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  cleanSelection,
  hasSelection,
  selectionAnchor,
  selectionCount,
  selectionExcerpt,
  selectionTooLong,
  type SelectionAction
} from '@i-design/common'
import { Icon } from './Icon'

export interface SelectionActionsProps {
  actions: SelectionAction[]
  /** 选区上限；超过就只提示、不给动作 */
  max?: number
  /** 选了哪个动作、对哪段文字。怎么改写由调用方决定，组件不碰内容 */
  onSelect?: (payload: { action: SelectionAction; text: string }) => void
  children?: ReactNode
}

export function SelectionActions({
  actions,
  max = 2000,
  onSelect,
  children
}: SelectionActionsProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  /* 关掉之后在原地不再弹出：否则点「改写」的那一下会让浮条立刻又出来一次 */
  const [dismissed, setDismissed] = useState(false)
  const [at, setAt] = useState<{ x: number; y: number; placement: 'top' | 'bottom' }>({
    x: 0,
    y: 0,
    placement: 'top'
  })

  const readSelection = useCallback(() => {
    const sel = window.getSelection()
    const raw = sel?.toString() ?? ''
    if (!sel || sel.rangeCount === 0 || (!hasSelection(raw, max) && !selectionTooLong(raw, max))) {
      setText('')
      setDismissed(false)
      return
    }
    // 只接管落在自己范围内的选区：整页监听会让页面上任何一处选中都弹出这排按钮
    const range = sel.getRangeAt(0)
    if (rootRef.current && !rootRef.current.contains(range.commonAncestorContainer)) {
      setText('')
      return
    }
    setText(raw)
    setDismissed(false)

    const rect = range.getBoundingClientRect()
    // 浮条尺寸取实测值：写死一个宽度的话，动作多一个就夹不回视口了
    const bar = barRef.current?.getBoundingClientRect()
    setAt(
      selectionAnchor(
        { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        { width: bar?.width || 240, height: bar?.height || 40 },
        { width: window.innerWidth, height: window.innerHeight }
      )
    )
  }, [max])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true)
    }
    document.addEventListener('selectionchange', readSelection)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('selectionchange', readSelection)
      document.removeEventListener('keydown', onKey)
    }
  }, [readSelection])

  const open = !dismissed && text.length > 0
  const tooLong = selectionTooLong(text, max)

  const run = (action: SelectionAction) => {
    if (action.disabled || tooLong) return
    onSelect?.({ action, text: cleanSelection(text) })
    setDismissed(true)
  }

  return (
    <div ref={rootRef} className="i-selact">
      {children}

      {/*
        浮条用 fixed 定位并挂在原地，而不是传送到 body：传送之后点浮条会先让
        文档失去选区，按钮拿到的就是空字符串了。
      */}
      <div
        ref={barRef}
        className={`i-selact__bar i-selact__bar--${at.placement}`}
        style={{ left: at.x, top: at.y, display: open ? undefined : 'none' }}
        role="toolbar"
        aria-label="对选中文字的操作"
        onMouseDown={(e) => e.preventDefault()}
      >
        {tooLong ? (
          // 说清楚为什么没有按钮：一排灰按钮不告诉用户该怎么办
          <span className="i-selact__hint">
            选中了 {selectionCount(text)} 字，超过 {max} 字就不好逐句核对了，选短一些
          </span>
        ) : (
          <>
            <span className="i-selact__quote" title={selectionExcerpt(text)}>
              {selectionExcerpt(text)}
            </span>
            <span className="i-selact__sep" aria-hidden="true" />
            {actions.map((action) => (
              <button
                key={action.id}
                className="i-selact__action"
                type="button"
                disabled={action.disabled}
                onClick={() => run(action)}
              >
                {action.icon ? <Icon name={action.icon} size={13} /> : null}
                {action.label}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
