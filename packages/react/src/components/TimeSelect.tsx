import { useMemo, useState } from 'react'
import { timeSelectOptions } from '@i-design/common'
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
  const options = useMemo(
    () => timeSelectOptions({ start, end, step, minTime, maxTime }),
    [start, end, step, minTime, maxTime]
  )

  const pick = (next: string) => {
    onChange?.(next)
    setOpen(false)
  }

  return (
    <div className="i-time-select">
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
        <div className="i-time-select__panel" role="listbox">
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
