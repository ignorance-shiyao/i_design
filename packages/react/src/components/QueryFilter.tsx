/**
 * 查询筛选条：列表页上方那一排条件（astra.md 的 B03）。
 *
 * 条件一变就回第一页：不回的话，改完筛选看到的是空白的第 7 页，
 * 而结果其实只有两页——用户会以为「没有数据」，而不是「翻过头了」。
 *
 * 无效条件要说出来而不是丢掉：这一排条件大多是从别人那儿粘来的链接带进来的，
 * 静默丢掉的话，用户看到的是一份他没要的结果，却以为那就是链接的内容。
 *
 * 组件不碰地址栏，只吐出参数记录——只有 Web 有地址栏，而这一层要跨端。
 */
import { useEffect, useState } from 'react'
import {
  activeCount,
  applyQuickFilter,
  changeFilter,
  clearFilters,
  matchQuickFilter,
  serializeQuery,
  type FilterField,
  type FilterRange,
  type FilterValue,
  type InvalidParam,
  type QueryState,
  type QuickFilter
} from '@i-design/common'
import { Button } from './Button'
import { Icon } from './Icon'
import { Input } from './Input'
import { Select } from './Select'

export interface QueryFilterProps {
  /** 字段定义；顺序即显示顺序 */
  fields: FilterField[]
  /** 当前条件与分页。受控：组件不自己存状态 */
  value: QueryState
  /** 快捷筛选：点一下整套替换当前条件 */
  quickFilters?: QuickFilter[]
  /** 解析链接时认不出来的参数，逐条显示 */
  invalid?: InvalidParam[]
  /** 折叠时最多显示几个字段；标了 always 的不计入 */
  collapsedCount?: number
  /** 默认是否折叠 */
  collapsed?: boolean
  onChange?: (payload: { state: QueryState; params: Record<string, string> }) => void
  className?: string
}

export function QueryFilter({
  fields,
  value,
  quickFilters = [],
  invalid = [],
  collapsedCount = 3,
  collapsed = true,
  onChange,
  className = ''
}: QueryFilterProps) {
  const [folded, setFolded] = useState(collapsed)
  useEffect(() => setFolded(collapsed), [collapsed])

  const alwaysFields = fields.filter((f) => f.always)
  const restFields = fields.filter((f) => !f.always)
  const shownFields = folded
    ? [...alwaysFields, ...restFields.slice(0, collapsedCount)]
    : fields
  const hiddenCount = fields.length - shownFields.length
  const active = activeCount(value.values)

  const push = (next: QueryState) =>
    onChange?.({ state: next, params: serializeQuery(next, fields) })
  const change = (name: string, next: FilterValue) => push(changeFilter(value, name, next))
  const rangeOf = (name: string) => (value.values[name] ?? {}) as FilterRange
  const textOf = (name: string) => (value.values[name] as string) ?? ''
  const listOf = (name: string) => (value.values[name] as string[]) ?? []
  const onRange = (name: string, part: 'from' | 'to', raw: string) =>
    change(name, { ...rangeOf(name), [part]: raw || undefined })

  return (
    <section className={['i-query', className].filter(Boolean).join(' ')} aria-label="查询筛选">
      {/* 快捷筛选在最前：它替代的是「手工把三个条件依次选一遍」 */}
      {quickFilters.length > 0 && (
        <div className="i-query__quick">
          {quickFilters.map((quick) => {
            const on = matchQuickFilter(value.values, quick)
            return (
              <button
                key={quick.key}
                type="button"
                className={`i-query__quick-item${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => push(applyQuickFilter(value, quick))}
              >
                {quick.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="i-query__grid">
        {shownFields.map((field) => (
          <label className="i-query__field" key={field.name}>
            <span className="i-query__label">{field.label}</span>

            {field.kind === 'text' && (
              <Input
                value={textOf(field.name)}
                placeholder={field.placeholder}
                onChange={(v) => change(field.name, v)}
              />
            )}

            {field.kind === 'select' && (
              <Select
                value={textOf(field.name)}
                options={[{ value: '', label: '全部' }, ...(field.options ?? [])]}
                onChange={(v) => change(field.name, Array.isArray(v) || v == null ? '' : String(v))}
              />
            )}

            {/* 多选用一排可切换的标签：下拉里的多选要点开才看得见已选了什么 */}
            {field.kind === 'multi-select' && (
              <span className="i-query__tags">
                {(field.options ?? []).map((option) => {
                  const on = listOf(field.name).includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`i-query__tag${on ? ' is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() =>
                        change(
                          field.name,
                          on
                            ? listOf(field.name).filter((v) => v !== option.value)
                            : [...listOf(field.name), option.value]
                        )
                      }
                    >
                      {option.label}
                    </button>
                  )
                })}
              </span>
            )}

            {(field.kind === 'date-range' || field.kind === 'number-range') && (
              <span className="i-query__range">
                <Input
                  value={rangeOf(field.name).from ?? ''}
                  type={field.kind === 'date-range' ? 'date' : 'number'}
                  onChange={(v) => onRange(field.name, 'from', v)}
                />
                <span className="i-query__range-sep" aria-hidden="true">–</span>
                <Input
                  value={rangeOf(field.name).to ?? ''}
                  type={field.kind === 'date-range' ? 'date' : 'number'}
                  onChange={(v) => onRange(field.name, 'to', v)}
                />
              </span>
            )}
          </label>
        ))}

        <div className="i-query__actions">
          {active > 0 && (
            <Button size="sm" onClick={() => push(clearFilters(value))}>
              清空条件（{active}）
            </Button>
          )}
          {(hiddenCount > 0 || !folded) && (
            <button
              type="button"
              className="i-query__fold"
              aria-expanded={!folded}
              onClick={() => setFolded(!folded)}
            >
              <Icon name={folded ? 'chevron-down' : 'chevron-up'} size={14} />
              {folded ? `展开其余 ${hiddenCount} 项` : '收起'}
            </button>
          )}
        </div>
      </div>

      {/*
        无效参数逐条说：链接是别人粘给你的，你有权知道哪一条没生效。
        role="status" 而不是 alert——这不是错误，是「这一条被忽略了」。
      */}
      {invalid.length > 0 && (
        <p className="i-query__invalid" role="status">
          链接里有 {invalid.length} 个条件没生效：
          {invalid.map((item, i) => (
            <span key={item.name}>
              {i > 0 ? '；' : ''}
              {item.name}=「{item.raw}」{item.reason}
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
