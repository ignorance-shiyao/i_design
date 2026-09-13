import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { shouldFlipUp, timeSelectOptions } from '@i-design/common'
import { SelectInput } from './SelectInput'

export interface TimeSelectProps {
  value?: string
  onChange?: (value: string) => void
  /** 首个时间点 */
  start?: string
  /** 末个时间点（含） */
  end?: string
  /** 间隔分钟数 */
  step?: number
  /** 早于它的不可选，用于「结束时间不能早于开始时间」 */
  minTime?: string
  maxTime?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
}

/**
 * 固定间隔的时间下拉。能选任意时刻的用 TimePicker，只在若干个整点或半点里挑的用这个——
 * 用三列滚轮去选「上午九点半」既慢又容易滑过头。
 */
export function TimeSelect({
  value = '',
  onChange,
  start = '09:00',
  end = '18:00',
  step = 30,
  minTime,
  maxTime,
  placeholder = '选择时间',
  disabled = false,
  invalid = false
}: TimeSelectProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  /* 面板贴着触发器绝对定位：触发器靠近视口底缘时整列时间会掉到屏幕外 */
  const [flipUp, setFlipUp] = useState(false)

  /* 量一次当前位置决定方向。开的时候量，不跟着滚动实时翻——半途翻向会让人点空 */
  useLayoutEffect(() => {
    if (!open) {
      setFlipUp(false)
      return
    }
    const trigger = root.current?.getBoundingClientRect()
    const box = panel.current?.getBoundingClientRect()
    if (trigger && box) setFlipUp(shouldFlipUp(trigger, box.height, window.innerHeight))
  }, [open])
  const options = useMemo(
    () => timeSelectOptions({ start, end, step, minTime, maxTime }),
    [start, end, step, minTime, maxTime]
  )

  const pick = (next: string) => {
    onChange?.(next)
    setOpen(false)
  }

  return (
    <div ref={root} className={['i-time-select', flipUp ? 'is-up' : ''].filter(Boolean).join(' ')}>
      {/* 外壳复用 SelectInput：聚焦态、清除键、箭头都该与其他选择器一致 */}
      <SelectInput
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        clearable
        open={open}
        onOpenChange={setOpen}
        onClear={() => pick('')}
      />

      {open && (
        <div ref={panel} className="i-time-select__panel" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              className={['i-time-select__option', option.value === value ? 'is-active' : '']
                .filter(Boolean)
                .join(' ')}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => pick(option.value)}
            >
              {option.value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
