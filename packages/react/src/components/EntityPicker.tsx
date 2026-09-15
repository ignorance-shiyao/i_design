import {
  offPageChosen,
  pickerHint,
  pickerRows,
  pickerSummary,
  removePick,
  togglePick,
  type EntityOption
} from '@i-design/common'
import { Icon } from './Icon'
import { Input } from './Input'

export interface EntityPickerProps {
  /** 当前这一页的检索结果。由调用方去请求 */
  page?: EntityOption[]
  /** 已选。完整对象，不是 id——回显不能依赖它还在当前页里 */
  value?: EntityOption[]
  keyword?: string
  loading?: boolean
  multiple?: boolean
  /** 最多选几个 */
  max?: number
  /** 「人」「个部门」「台设备」——摘要里那个量词 */
  unit?: string
  placeholder?: string
  onChange?: (chosen: EntityOption[]) => void
  onKeywordChange?: (keyword: string) => void
  className?: string
}

/**
 * 人员 / 组织 / 资源的选择器（astra.md 的 B10）。
 *
 * 检索本身交给调用方；这个组件管的是翻页之后已选还看不看得见、
 * 不能选的为什么不能、停用的怎么办。判断全在 logic/entitypicker.ts。
 */
export function EntityPicker({
  page = [],
  value = [],
  keyword = '',
  loading = false,
  multiple = false,
  max,
  unit = '项',
  placeholder = '搜索姓名、工号或部门',
  onChange,
  onKeywordChange,
  className = ''
}: EntityPickerProps) {
  const input = { page, chosen: value, multiple, max }
  const rows = pickerRows(input)
  const summary = pickerSummary(value, max, unit)
  /** 已选里不在当前页的那些也要显示——不然翻一页就看不见自己选了谁 */
  const offPage = offPageChosen(value, page)
  const hint = pickerHint(keyword, loading, page.length)

  return (
    <div className={['i-entity-picker', className].filter(Boolean).join(' ')}>
      <Input
        value={keyword}
        placeholder={placeholder}
        onChange={(v) => onKeywordChange?.(v)}
      />

      <p className="i-entity-picker__summary">
        <span className="i-entity-picker__count">{summary.text}</span>
        {/* 不说「请移除」：历史记录里的停用项本来就该留着 */}
        {summary.notice && <span className="i-entity-picker__notice">{summary.notice}</span>}
        {offPage.length > 0 && (
          <span className="i-entity-picker__notice">
            其中 {offPage.length} {unit}不在当前结果里，仍然算数
          </span>
        )}
      </p>

      {/* 已选排在结果之上：翻页时它不该跟着滚出视野 */}
      {value.length > 0 && (
        <ul className="i-entity-picker__chosen">
          {value.map((item) => (
            <li
              key={item.id}
              className={`i-entity-picker__chip${item.inactive ? ' is-inactive' : ''}`}
            >
              <span>{item.label}</span>
              {/* 「已停用」四个字必须在：颜色不单独承担这个信息 */}
              {item.inactive && <span className="i-entity-picker__chip-tag">已停用</span>}
              <button
                type="button"
                className="i-entity-picker__chip-off"
                aria-label={`移除 ${item.label}`}
                onClick={() => onChange?.(removePick(value, item.id))}
              >
                <Icon name="close" size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint ? (
        <p className="i-entity-picker__hint">{hint}</p>
      ) : (
        <ul className="i-entity-picker__list">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={`i-entity-picker__row${row.selected ? ' is-selected' : ''}`}
                role="checkbox"
                aria-checked={row.selected}
                disabled={row.disabled}
                onClick={() => onChange?.(togglePick(input, row.id))}
              >
                <Icon name={row.selected ? 'check-circle' : multiple ? 'plus' : 'user'} size={14} />
                <span className="i-entity-picker__label">{row.label}</span>
                {row.hint && <span className="i-entity-picker__sub">{row.hint}</span>}
                {/* 不能选的理由写在行里，不是 title：触摸屏没有悬停 */}
                {row.reason && <span className="i-entity-picker__reason">{row.reason}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
