import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ZERO,
  clampTime,
  formatTime,
  isUnitEnabled,
  parseTime,
  resolveOverlay,
  timeColumn,
  type TimeValue
} from '@i-design/common'
import { Icon } from './Icon'

type Unit = 'hour' | 'minute' | 'second'

export interface TimePickerProps {
  /** HH:mm 或 HH:mm:ss；空串表示未选 */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  showSecond?: boolean
  /** 时 / 分 / 秒各自的步长 */
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  /** 可选范围，含端点 */
  min?: string
  max?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export function TimePicker({
  value = '',
  onChange,
  placeholder = '选择时间',
  showSecond = true,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  min = '',
  max = '',
  disabled = false,
  clearable = true,
  className = ''
}: TimePickerProps) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const bounds = {
    min: min ? parseTime(min) ?? undefined : undefined,
    max: max ? parseTime(max) ?? undefined : undefined
  }
  /** 未选时落在范围起点，而不是 00:00——那可能根本不可选 */
  const draft: TimeValue = (value ? parseTime(value) : null) ?? bounds.min ?? ZERO

  const units: Unit[] = showSecond ? ['hour', 'minute', 'second'] : ['hour', 'minute']
  const stepOf = (unit: Unit) =>
    unit === 'hour' ? hourStep : unit === 'minute' ? minuteStep : secondStep

  useLayoutEffect(() => {
    if (!open) return
    const trigger = root.current?.getBoundingClientRect()
    const box = panel.current
    if (!trigger || !box) return
    const resolved = resolveOverlay({
      trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
      // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
      // 用带变换的尺寸算出来的位置会偏几个像素
      popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
      viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      placement: 'bottom',
      align: 'start',
      offset: 4
    })
    setPosition({ x: resolved.x, y: resolved.y })
  }, [open])

  /*
   * 打开时把当前值滚到列的中间。
   *
   * 不滚的话，选 23:45 时打开面板看到的是 00 开头的一列——用户会以为值丢了，
   * 而实际上它在下面五百像素处。
   */
  useEffect(() => {
    if (!open) return
    panel.current?.querySelectorAll('.i-timepicker__col').forEach((col) => {
      const active = col.querySelector<HTMLElement>('.is-active')
      if (active) col.scrollTop = active.offsetTop - col.clientHeight / 2 + active.clientHeight / 2
    })
  }, [open])

  const commit = (next: TimeValue) => {
    const clamped = clampTime(next, {
      min: bounds.min,
      max: bounds.max,
      showSecond,
      step: { hour: hourStep, minute: minuteStep, second: secondStep }
    })
    onChange?.(formatTime(clamped, showSecond))
  }

  const pick = (unit: Unit, next: number) => {
    if (!isUnitEnabled(unit, next, draft, bounds)) return
    commit({ ...draft, [unit]: next })
  }

  const now = () => {
    const d = new Date()
    commit({ hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() })
  }

  return (
    <div
      ref={root}
      className={['i-timepicker', disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ')}
    >
      <button
        className="i-timepicker__trigger"
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        <Icon name="clock" size={15} />
        <span className={value ? undefined : 'is-placeholder'}>{value || placeholder}</span>
        {clearable && value && !disabled && (
          <span
            className="i-timepicker__clear"
            role="button"
            aria-label="清除"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange?.('')
              setOpen(false)
            }}
          >
            <Icon name="close" size={12} />
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panel}
            className="i-timepicker__panel"
            style={{ left: position.x, top: position.y }}
          >
            <div className="i-timepicker__cols">
              {units.map((unit) => (
                <ul key={unit} className="i-timepicker__col" role="listbox">
                  {timeColumn(unit, stepOf(unit)).map((n) => (
                    <li
                      key={n}
                      className={[
                        'i-timepicker__cell',
                        draft[unit] === n ? 'is-active' : '',
                        isUnitEnabled(unit, n, draft, bounds) ? '' : 'is-disabled'
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      role="option"
                      aria-selected={draft[unit] === n}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        pick(unit, n)
                      }}
                    >
                      {pad(n)}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
            <footer className="i-timepicker__foot">
              {/* 「此刻」不是装饰：绝大多数时间输入填的就是现在，让人少滚三列 */}
              <button
                type="button"
                className="i-timepicker__now"
                onMouseDown={(e) => {
                  e.preventDefault()
                  now()
                }}
              >
                此刻
              </button>
              <button
                type="button"
                className="i-timepicker__done"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setOpen(false)
                }}
              >
                确定
              </button>
            </footer>
          </div>,
          document.body
        )}
    </div>
  )
}
