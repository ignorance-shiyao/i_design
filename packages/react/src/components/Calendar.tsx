import { useState } from 'react'
import {
  addMonths,
  buildCalendar,
  groupMarks,
  isInRange,
  isRangeEdge,
  moveFocus,
  parseISO,
  selectRange,
  toISO,
  weekdayLabels,
  type CalendarMark,
  type DateRange
} from '@i-design/common'
import { Icon } from './Icon'

export interface CalendarProps {
  /** 单选：ISO 日期；范围选：起止两个 ISO */
  value?: string | DateRange
  onChange?: (value: string | DateRange) => void
  mode?: 'single' | 'range'
  /** 日程标记 */
  marks?: CalendarMark[]
  weekStart?: 0 | 1
  /** 可选范围之外的日期禁用 */
  min?: string
  max?: string
  className?: string
}

export function Calendar({
  value = '',
  onChange,
  mode = 'single',
  marks = [],
  weekStart = 1,
  min = '',
  max = '',
  className = ''
}: CalendarProps) {
  const initial = typeof value === 'string' ? value : value?.start
  const [view, setView] = useState(() => parseISO(initial) ?? new Date())
  const [focused, setFocused] = useState(() => toISO(parseISO(initial) ?? new Date()))

  const cells = buildCalendar(view, weekStart)
  const marksByDate = groupMarks(marks)
  const labels = weekdayLabels(weekStart)
  const range: DateRange =
    typeof value === 'string' ? { start: value || null, end: null } : value ?? { start: null, end: null }

  const disabled = (iso: string) => Boolean((min && iso < min) || (max && iso > max))

  function pick(iso: string) {
    if (disabled(iso)) return
    setFocused(iso)
    onChange?.(mode === 'range' ? selectRange(range, iso) : iso)
  }

  /*
   * 日历必须能用键盘走完。只能点的话，用键盘操作的人要选一个三个月后的日期，
   * 得先用 Tab 穿过前面所有格子——42 个格子，每换一个月再来一遍。
   */
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(focused)
      return
    }
    const next = moveFocus(focused, event.key)
    if (!next) return
    event.preventDefault()
    setFocused(next)
    // 走出当前月就翻页，否则焦点会落在一个看不见的格子上
    const target = parseISO(next)
    if (target && target.getMonth() !== view.getMonth()) setView(target)
  }

  return (
    <div className={['i-calendar', className].filter(Boolean).join(' ')}>
      <header className="i-calendar__head">
        <button className="i-calendar__nav" type="button" aria-label="上个月" onClick={() => setView(addMonths(view, -1))}>
          <Icon name="chevron-left" size={16} />
        </button>
        <span className="i-calendar__title" aria-live="polite">
          {view.getFullYear()} 年 {view.getMonth() + 1} 月
        </span>
        <button className="i-calendar__nav" type="button" aria-label="下个月" onClick={() => setView(addMonths(view, 1))}>
          <Icon name="chevron-right" size={16} />
        </button>
      </header>

      {/*
        role="grid" 加上格子的 tabIndex 轮换：整块日历只占一个 Tab 停靠点，
        进来之后用方向键走。42 个格子各占一个 Tab 位的话，
        用键盘的人要按四十几下才能穿过这个月。
      */}
      <div className="i-calendar__grid" role="grid" tabIndex={0} onKeyDown={onKeyDown}>
        {labels.map((label) => (
          <span key={label} className="i-calendar__weekday" role="columnheader">
            {label}
          </span>
        ))}

        {cells.map((cell) => {
          const list = marksByDate.get(cell.iso) ?? []
          return (
            <button
              key={cell.iso}
              className={[
                'i-calendar__cell',
                cell.outside ? 'is-outside' : '',
                cell.today ? 'is-today' : '',
                disabled(cell.iso) ? 'is-disabled' : '',
                isRangeEdge(cell.iso, range) !== null ? 'is-selected' : '',
                mode === 'range' && isInRange(cell.iso, range) ? 'is-in-range' : '',
                isRangeEdge(cell.iso, range) === 'start' ? 'is-start' : '',
                isRangeEdge(cell.iso, range) === 'end' ? 'is-end' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              role="gridcell"
              tabIndex={-1}
              aria-selected={isRangeEdge(cell.iso, range) !== null}
              aria-current={cell.today ? 'date' : undefined}
              disabled={disabled(cell.iso)}
              onClick={() => pick(cell.iso)}
            >
              <span className="i-calendar__day">{cell.day}</span>
              {/*
                标记用「淡底色块 + 文字」而不是给整格换底色：
                换底色会和「选中」「今天」抢同一个视觉通道，
                三者叠在一起时读者分不出哪个是哪个。
              */}
              {list.length > 0 && (
                <span className="i-calendar__marks">
                  {list.slice(0, 2).map((mark, i) => (
                    <span key={i} className={`i-calendar__mark is-${mark.type ?? 'brand'}`} title={mark.label}>
                      {mark.label}
                    </span>
                  ))}
                  {list.length > 2 && <span className="i-calendar__more">+{list.length - 2}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
