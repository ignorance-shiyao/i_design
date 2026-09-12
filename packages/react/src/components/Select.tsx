import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  collapseTags,
  indexOfValue,
  moveActive,
  rafThrottle,
  scrollToRow,
  shouldVirtualize,
  toggleValue,
  virtualWindow,
  type OptionLike
} from '@i-design/common'
import { Icon } from './Icon'
import { useConfig } from './ConfigProvider'

export interface SelectOption extends OptionLike {
  label: string
}

export type SelectValue = string | number | null
export type SelectModel = SelectValue | (string | number)[]

export interface SelectProps {
  value?: SelectModel
  options: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  /** 多选。值变成数组，触发器里改成一排标签 */
  multiple?: boolean
  /** 多选时最多完整显示几个标签，其余折成「+N」。0 表示全部显示 */
  maxTagCount?: number
  onChange?: (value: SelectModel) => void
}

/** 行高实测不到时的兜底。主题面板能调字号与间距，所以不写死 */
const OPTION_FALLBACK_HEIGHT = 36

export function Select({
  value = null,
  options,
  placeholder = '',
  size = 'md',
  disabled = false,
  invalid = false,
  clearable = false,
  multiple = false,
  maxTagCount = 0,
  onChange
}: SelectProps) {
  const { locale } = useConfig()
  /* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
  const placeholderText = placeholder || locale.placeholder

  const root = useRef<HTMLDivElement | null>(null)
  const menu = useRef<HTMLUListElement | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const values = useMemo<(string | number)[]>(() => {
    if (!multiple) return value === null ? [] : [value as string | number]
    return Array.isArray(value) ? value : []
  }, [multiple, value])

  const selectedOptions = useMemo(
    () =>
      values
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is SelectOption => Boolean(o)),
    [values, options]
  )
  const selected = multiple ? null : (selectedOptions[0] ?? null)
  const hasValue = values.length > 0
  const isSelected = (option: SelectOption) => values.includes(option.value)

  /* 折几个、至少留一个的规则来自公共层，与 Vue 端同一份实现 */
  const tags = collapseTags(selectedOptions, maxTagCount)

  /* ----------------------------------------------------------- 虚拟滚动 */

  const [optionHeight, setOptionHeight] = useState(OPTION_FALLBACK_HEIGHT)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(240)

  const virtual = shouldVirtualize(options.length)
  const win = virtualWindow(scrollTop, viewportHeight, optionHeight, options.length)
  const visible = useMemo(() => {
    if (!virtual) return options.map((option, index) => ({ option, index }))
    const out: { option: SelectOption; index: number }[] = []
    for (let i = win.start; i <= win.end; i++) out.push({ option: options[i], index: i })
    return out
  }, [virtual, options, win.start, win.end])

  /* 滚动事件远多于帧，而每次都要读一次布局 */
  const onScroll = useMemo(
    () =>
      rafThrottle(() => {
        if (menu.current) setScrollTop(menu.current.scrollTop)
      }),
    []
  )
  useEffect(() => () => onScroll.cancel(), [onScroll])

  const measure = useCallback(() => {
    const el = menu.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    const first = el.querySelector<HTMLElement>('.i-select__option')
    if (first && first.offsetHeight > 0) setOptionHeight(first.offsetHeight)
  }, [])

  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure])

  /* 高亮走到窗口外时把它带回视野，否则按方向键看起来毫无反应 */
  useEffect(() => {
    if (!virtual || !menu.current || active < 0) return
    const next = scrollToRow(active, optionHeight, menu.current.scrollTop, menu.current.clientHeight)
    if (next !== menu.current.scrollTop) menu.current.scrollTop = next
  }, [active, virtual, optionHeight])

  /* --------------------------------------------------------------- 交互 */

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [open])

  const toggle = () => {
    if (disabled) return
    if (!open) setActive(multiple ? options.findIndex((o) => isSelected(o)) : indexOfValue(options, value))
    setOpen(!open)
  }

  const pick = (option: SelectOption) => {
    if (option.disabled) return
    if (multiple) {
      // 多选不关闭面板：一次要选好几个，每选一个都收起来再展开是折磨
      onChange?.(toggleValue(values, option.value))
      return
    }
    onChange?.(option.value)
    setOpen(false)
    setActive(-1)
  }

  // 「跳过禁用项、到边界即停」的规则来自公共层，与 Vue 端同一份实现
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        if (!open) toggle()
        else setActive((i) => moveActive(options, i, event.key === 'ArrowDown' ? 1 : -1))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) toggle()
        else if (active >= 0) pick(options[active])
        break
      case 'Backspace':
        // 多选时退格删掉最后一个标签，这是选完一串之后最顺手的撤销
        if (multiple && values.length) {
          event.preventDefault()
          onChange?.(values.slice(0, -1))
        }
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={root}
      className={[
        'i-select',
        `i-select--${size}`,
        open ? 'is-open' : '',
        disabled ? 'is-disabled' : '',
        multiple ? 'is-multiple' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        className={['i-select__trigger', invalid ? 'is-invalid' : '', !hasValue ? 'is-placeholder' : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        {multiple && hasValue ? (
          <span className="i-select__tags">
            {tags.shown.map((option) => (
              <span key={option.value} className="i-select__tag">
                {option.label}
                <span
                  className="i-select__tag-close"
                  role="button"
                  aria-label={`移除 ${option.label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!disabled) onChange?.(toggleValue(values, option.value))
                  }}
                >
                  <Icon name="close" size={12} />
                </span>
              </span>
            ))}
            {tags.rest > 0 && <span className="i-select__tag i-select__tag--rest">+{tags.rest}</span>}
          </span>
        ) : (
          <span className="i-select__label">
            {multiple ? placeholderText : (selected?.label ?? placeholderText)}
          </span>
        )}

        {clearable && hasValue && !disabled && (
          <span
            className="i-select__clear"
            role="button"
            aria-label="清除"
            onClick={(e) => {
              e.stopPropagation()
              onChange?.(multiple ? [] : null)
            }}
          >
            <Icon name="close" size={14} />
          </span>
        )}
        <Icon className="i-select__arrow" name="chevron-down" size={16} />
      </button>

      {open && (
        <ul
          ref={menu}
          className="i-select__menu"
          role="listbox"
          aria-multiselectable={multiple || undefined}
          onScroll={onScroll}
        >
          {/* 上下两块撑开的空白替代没渲染的那些行，滚动条长度才和真实条数相称 */}
          {virtual && <li className="i-select__spacer" style={{ height: win.paddingTop }} />}
          {visible.map(({ option, index }) => (
            <li
              key={option.value}
              className={[
                'i-select__option',
                isSelected(option) ? 'is-selected' : '',
                index === active ? 'is-active' : '',
                option.disabled ? 'is-disabled' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={isSelected(option)}
              aria-disabled={option.disabled || undefined}
              onClick={() => pick(option)}
              onMouseEnter={() => !option.disabled && setActive(index)}
            >
              <span className="i-select__option-label">{option.label}</span>
              {multiple && isSelected(option) && <Icon name="check" size={14} />}
            </li>
          ))}
          {virtual && <li className="i-select__spacer" style={{ height: win.paddingBottom }} />}
          {!options.length && <li className="i-select__empty">{locale.empty}</li>}
        </ul>
      )}
    </div>
  )
}
