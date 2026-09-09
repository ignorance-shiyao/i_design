import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'
import { normalizeValue, resolveColumns, type PickerColumns } from '@i-design/common'

export interface PickerProps {
  /** 选中值，每列一个 */
  value: (string | number)[]
  /** 并列多列传二维数组；级联传一维数组，下级放在 children 里 */
  columns: PickerColumns
  title?: string
  cancelText?: string
  okText?: string
  /** 可见候选行数，取奇数才有居中的那一行 */
  visibleCount?: number
  onConfirm?: (value: (string | number)[]) => void
  onCancel?: () => void
  className?: string
}

const ROW = 40

export function Picker({
  value,
  columns,
  title = '',
  cancelText = '取消',
  okText = '确定',
  visibleCount = 5,
  onConfirm,
  onCancel,
  className = ''
}: PickerProps) {
  /*
   * 滚动期间先在内部维护草稿值，确认时才抛出去。
   * 每滚一格就回调，调用方拿到的是一串中间态；而选择器的语义本就是「滚完按确定」。
   */
  const [draft, setDraft] = useState(() => normalizeValue(columns, value))
  const wheels = useRef<(HTMLDivElement | null)[]>([])
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)

  const columnList = useMemo(() => resolveColumns(columns, draft), [columns, draft])

  /** 把每一列滚到当前选中项 */
  const syncScroll = useCallback(() => {
    columnList.forEach((options, col) => {
      const index = Math.max(0, options.findIndex((o) => o.value === draft[col]))
      const el = wheels.current[col]
      if (el) el.scrollTop = index * ROW
    })
  }, [columnList, draft])

  useEffect(() => {
    setDraft(normalizeValue(columns, value))
  }, [columns, value])

  useEffect(syncScroll, [syncScroll])

  function onScroll(col: number, event: UIEvent<HTMLDivElement>) {
    /*
     * 没有 scrollend 的浏览器仍占多数，用「停止滚动 80ms」判定落定。
     * 吸附交给 scroll-snap，我们只读出停在第几行——自己写惯性和回弹，
     * 在不同浏览器上手感永远对不齐。
     */
    const el = event.currentTarget
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const options = columnList[col] ?? []
      const index = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)))
      const option = options[index]
      if (!option || option.disabled) {
        syncScroll()
        return
      }
      const next = draft.slice(0, col)
      next[col] = option.value
      // 后面几列由这一列决定，交给 normalizeValue 重算，避免留下不存在的旧值
      setDraft(normalizeValue(columns, next))
    }, 80)
  }

  return (
    <div className={['i-picker', className].filter(Boolean).join(' ')}>
      <div className="i-picker__bar">
        <button type="button" className="i-picker__action" onClick={onCancel}>
          {cancelText}
        </button>
        <span className="i-picker__title">{title}</span>
        <button type="button" className="i-picker__action is-primary" onClick={() => onConfirm?.(draft)}>
          {okText}
        </button>
      </div>

      <div className="i-picker__body" style={{ height: visibleCount * ROW }}>
        {/* 选中行的上下两条线：没有它，用户不知道哪一行才算选中 */}
        <div className="i-picker__indicator" style={{ height: ROW }} />

        {columnList.map((options, col) => (
          <div
            key={`col-${col}`}
            ref={(el) => {
              wheels.current[col] = el
            }}
            className="i-picker__wheel"
            role="listbox"
            aria-label={`第 ${col + 1} 列`}
            onScroll={(event) => onScroll(col, event)}
          >
            {/* 首尾各留半屏空白，第一项和最后一项才滚得到中间那一行 */}
            <div className="i-picker__pad" style={{ height: ((visibleCount - 1) / 2) * ROW }} />
            {options.map((option) => (
              <div
                key={option.value}
                className={[
                  'i-picker__option',
                  option.value === draft[col] ? 'is-active' : '',
                  option.disabled ? 'is-disabled' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ height: ROW }}
                role="option"
                aria-selected={option.value === draft[col]}
              >
                {option.text}
              </div>
            ))}
            <div className="i-picker__pad" style={{ height: ((visibleCount - 1) / 2) * ROW }} />
          </div>
        ))}
      </div>
    </div>
  )
}
