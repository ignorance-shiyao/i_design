import { useState } from 'react'
import { Icon } from '@i-design/react'

export interface DropdownMenuOption {
  value: string
  label: string
}
export interface DropdownMenuField {
  name: string
  label: string
  options: DropdownMenuOption[]
}

export interface DropdownMenuProps {
  fields: DropdownMenuField[]
  /** 各字段当前选中的值，形如 { sort: 'new' } */
  value: Record<string, string>
  onChange?: (value: Record<string, string>, changed: { name: string; value: string }) => void
}

/**
 * 移动端筛选条：一排筛选项，点开从条下方通栏展开。
 * 手机上「从哪儿弹出来的」比「弹在哪儿」更重要——
 * 一个飘在半空的小面板，用户不知道它属于哪一项。
 */
export function DropdownMenu({ fields, value, onChange }: DropdownMenuProps) {
  const [openName, setOpenName] = useState('')

  const labelOf = (field: DropdownMenuField) =>
    field.options.find((option) => option.value === value[field.name])?.label ?? field.label

  const pick = (field: DropdownMenuField, option: DropdownMenuOption) => {
    onChange?.({ ...value, [field.name]: option.value }, { name: field.name, value: option.value })
    // 选完就收起：手机上留着面板会挡住刚筛出来的结果
    setOpenName('')
  }

  return (
    <div className="i-dropdown-menu">
      <div className="i-dropdown-menu__bar">
        {fields.map((field) => (
          <button
            key={field.name}
            className={[
              'i-dropdown-menu__item',
              openName === field.name ? 'is-open' : '',
              value[field.name] ? 'is-filtered' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            aria-expanded={openName === field.name}
            onClick={() => setOpenName(openName === field.name ? '' : field.name)}
          >
            <span className="i-dropdown-menu__label">{labelOf(field)}</span>
            <Icon className="i-dropdown-menu__arrow" name="chevron-down" size={14} />
          </button>
        ))}
      </div>

      {fields.map((field) =>
        openName === field.name ? (
          <div key={`panel-${field.name}`}>
            <div className="i-dropdown-menu__mask" onClick={() => setOpenName('')} />
            <div className="i-dropdown-menu__panel" role="listbox">
              {field.options.map((option) => (
                <button
                  key={option.value}
                  className={[
                    'i-dropdown-menu__option',
                    value[field.name] === option.value ? 'is-active' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  role="option"
                  aria-selected={value[field.name] === option.value}
                  onClick={() => pick(field, option)}
                >
                  {option.label}
                  {value[field.name] === option.value && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  )
}
