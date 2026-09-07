import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  buildCalendar,
  formatDate,
  isSameDay,
  parseISO,
  startOfMonth,
  toISO,
  weekdayLabels
} from '@i-design/common'
import { Icon } from './Icon'

export interface DatePickerProps {
  /** YYYY-MM-DD 字符串；空值用 null 表示 */
  value?: string | null
  onChange?: (value: string | null) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  min?: string
  max?: string
  disabledDate?: (date: Date) => boolean
  /** 仅影响显示，对外的值始终是 YYYY-MM-DD */
  format?: string
  weekStart?: 0 | 1
}

export function DatePicker({
  value = null,
  onChange,
  placeholder = '请选择日期',
  size = 'md',
  disabled = false,
  invalid = false,
  clearable = false,
  min = '',
  max = '',
  disabledDate,
  format = 'YYYY-MM-DD',
  weekStart = 1
}: DatePickerProps) {
  const root = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseISO(value), [value])
  const [viewDate, setViewDate] = useState(() => startOfMonth(selected ?? new Date()))
  // 焦点日期与选中值分离：方向键浏览时不立刻改值
  const [cursor, setCursor] = useState<Date>(selected ?? new Date())

  useEffect(() => {
    if (!selected) return
    setViewDate(startOfMonth(selected))
    setCursor(selected)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [open])

  const cells = useMemo(() => buildCalendar(viewDate, weekStart), [viewDate, weekStart])
  const weekdays = useMemo(() => weekdayLabels(weekStart), [weekStart])

  const isDisabled = (date: Date) => {
    const iso = toISO(date)
    if (min && iso < min) return true
    if (max && iso > max) return true
    return disabledDate ? disabledDate(date) : false
  }

  const openPanel = () => {
    if (disabled) return
    const base = selected ?? new Date()
    setViewDate(startOfMonth(base))
    setCursor(base)
    setOpen(true)
  }

  const pick = (date: Date) => {
    if (isDisabled(date)) return
    onChange?.(toISO(date))
    setOpen(false)
  }

  const moveCursor = (days: number) => {
    const next = addDays(cursor, days)
    setCursor(next)
    if (next.getMonth() !== viewDate.getMonth()) setViewDate(startOfMonth(next))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); openPanel() }
      return
    }
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); moveCursor(-1); break
      case 'ArrowRight': e.preventDefault(); moveCursor(1); break
      case 'ArrowUp': e.preventDefault(); moveCursor(-7); break
      case 'ArrowDown': e.preventDefault(); moveCursor(7); break
      case 'PageUp': e.preventDefault(); setViewDate(addMonths(viewDate, -1)); break
      case 'PageDown': e.preventDefault(); setViewDate(addMonths(viewDate, 1)); break
      case 'Enter':
      case ' ': e.preventDefault(); pick(cursor); break
      case 'Escape': setOpen(false); break
    }
  }

  const title = `${viewDate.getFullYear()} 年 ${viewDate.getMonth() + 1} 月`

  return (
    <div ref={root} className={['i-date', `i-date--${size}`, open ? 'is-open' : ''].filter(Boolean).join(' ')}>
      <button
        className={['i-date__trigger', invalid ? 'is-invalid' : '', !selected ? 'is-placeholder' : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
      >
        <Icon className="i-date__calendar" name="calendar" size={15} />
        <span className="i-date__value">{selected ? formatDate(selected, format) : placeholder}</span>
        {clearable && selected && !disabled && (
          <span
            className="i-date__clear"
            role="button"
            aria-label="清除日期"
            onClick={(e) => { e.stopPropagation(); onChange?.(null) }}
          >
            <Icon name="close" size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="i-date__panel" role="dialog" aria-label={title}>
          <header className="i-date__head">
            <button type="button" className="i-date__nav" aria-label="上一月" onClick={() => setViewDate(addMonths(viewDate, -1))}>
              <Icon name="chevron-left" size={15} />
            </button>
            <span className="i-date__title">{title}</span>
            <button type="button" className="i-date__nav" aria-label="下一月" onClick={() => setViewDate(addMonths(viewDate, 1))}>
              <Icon name="chevron-right" size={15} />
            </button>
          </header>

          <div className="i-date__week">
            {weekdays.map((label) => <span key={label}>{label}</span>)}
          </div>

          <div className="i-date__grid">
            {cells.map((cell) => (
              <button
                key={cell.iso}
                type="button"
                className={[
                  'i-date__cell',
                  cell.outside ? 'is-outside' : '',
                  cell.today ? 'is-today' : '',
                  isSameDay(cell.date, selected) ? 'is-selected' : '',
                  isSameDay(cell.date, cursor) ? 'is-cursor' : '',
                  isDisabled(cell.date) ? 'is-disabled' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isDisabled(cell.date)}
                aria-current={cell.today ? 'date' : undefined}
                onClick={() => pick(cell.date)}
              >
                {cell.day}
              </button>
            ))}
          </div>

          <footer className="i-date__foot">
            <button type="button" className="i-date__action" onClick={() => { const t = new Date(); setViewDate(startOfMonth(t)); setCursor(t); if (!isDisabled(t)) pick(t) }}>
              今天
            </button>
            {clearable && (
              <button type="button" className="i-date__action" onClick={() => { onChange?.(null); setOpen(false) }}>
                清除
              </button>
            )}
          </footer>
        </div>
      )}
    </div>
  )
}
