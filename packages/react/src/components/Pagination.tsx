import { buildPages, clampPage, pageCountOf, rangeText } from '@i-design/common'
import { Icon } from './Icon'

export interface PaginationProps {
  current?: number
  total: number
  pageSize?: number
  maxVisible?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  showTotal?: boolean
  onChange?: (page: number) => void
}

export function Pagination({
  current = 1,
  total,
  pageSize = 10,
  maxVisible = 5,
  size = 'md',
  disabled = false,
  showTotal = true,
  onChange
}: PaginationProps) {
  // 页码序列、边界收敛与区间文案全部来自公共层，与 Vue 端逐字相同
  const pageCount = pageCountOf(total, pageSize)
  const page = clampPage(current, pageCount)
  const items = buildPages(page, pageCount, maxVisible)

  const go = (next: number) => {
    if (disabled) return
    const target = clampPage(next, pageCount)
    if (target !== page) onChange?.(target)
  }

  return (
    <nav
      className={['i-pagination', `i-pagination--${size}`, disabled ? 'is-disabled' : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="分页"
    >
      {showTotal && <span className="i-pagination__total">{rangeText(page, pageSize, total)}</span>}

      <button
        className="i-pagination__item"
        type="button"
        aria-label="上一页"
        disabled={disabled || page === 1}
        onClick={() => go(page - 1)}
      >
        <Icon name="chevron-left" size={15} />
      </button>

      {items.map((item, index) =>
        typeof item === 'number' ? (
          <button
            key={`${item}-${index}`}
            className={['i-pagination__item', item === page ? 'is-active' : ''].filter(Boolean).join(' ')}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            aria-label={`第 ${item} 页`}
            disabled={disabled}
            onClick={() => go(item)}
          >
            {item}
          </button>
        ) : (
          <button
            key={`${item}-${index}`}
            className="i-pagination__item i-pagination__ellipsis"
            type="button"
            aria-label={item === 'left' ? `向前 ${maxVisible} 页` : `向后 ${maxVisible} 页`}
            disabled={disabled}
            onClick={() => go(page + (item === 'left' ? -maxVisible : maxVisible))}
          >
            <Icon name="more" size={15} />
          </button>
        )
      )}

      <button
        className="i-pagination__item"
        type="button"
        aria-label="下一页"
        disabled={disabled || page === pageCount}
        onClick={() => go(page + 1)}
      >
        <Icon name="chevron-right" size={15} />
      </button>
    </nav>
  )
}
