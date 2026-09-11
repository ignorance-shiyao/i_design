import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from 'react'
import {
  flattenTree,
  rafThrottle,
  resolveCheckState,
  searchTree,
  shouldVirtualize,
  toggleChecked,
  virtualWindow,
  visibleRows,
  type TreeNode
} from '@i-design/common'
import { Icon } from './Icon'
import { Checkbox } from './Checkbox'
import { Input } from './Input'

export interface TreeProps {
  data: TreeNode[]
  /** 勾选值；父子联动由组件负责，调用方只管收结果 */
  checked?: string[]
  expanded?: string[]
  /** 显示复选框；不显示时点击行即为选中 */
  checkable?: boolean
  /** 顶部带搜索框 */
  searchable?: boolean
  /** 单选场景下当前选中的节点 */
  selected?: string
  /**
   * 列表区高度，如 `320px`。给了才能虚拟化——没有可视高度就算不出该渲染哪几行。
   * 不给时整棵树平铺，由外层页面滚动。
   */
  height?: string
  emptyText?: string
  onCheckedChange?: (keys: string[]) => void
  onExpandedChange?: (keys: string[]) => void
  onSelect?: (node: TreeNode) => void
}

/** 搜索命中的部分用 <mark> 包起来，让用户看清为什么这一行被留下 */
function highlight(label: string, needle: string) {
  const parts: { text: string; hit: boolean }[] = []
  if (!needle) return [{ text: label, hit: false }]
  let rest = label
  let index = rest.toLowerCase().indexOf(needle.toLowerCase())
  while (index !== -1) {
    if (index > 0) parts.push({ text: rest.slice(0, index), hit: false })
    parts.push({ text: rest.slice(index, index + needle.length), hit: true })
    rest = rest.slice(index + needle.length)
    index = rest.toLowerCase().indexOf(needle.toLowerCase())
  }
  if (rest) parts.push({ text: rest, hit: false })
  return parts
}

/** 行高实测不到时的兜底。主题面板能调字号与间距，所以不写死 */
const ROW_FALLBACK_HEIGHT = 32

export function Tree({
  data,
  checked = [],
  expanded = [],
  checkable = false,
  searchable = false,
  selected = '',
  height = '',
  emptyText = '没有匹配的节点',
  onCheckedChange,
  onExpandedChange,
  onSelect
}: TreeProps) {
  const entities = useMemo(() => flattenTree(data), [data])
  const [keyword, setKeyword] = useState('')
  const [localExpanded, setLocalExpanded] = useState<string[]>(expanded)

  const needle = keyword.trim()
  const filtering = needle.length > 0
  const search = useMemo(() => searchTree(entities, keyword), [entities, keyword])

  // 搜索时用命中路径覆盖展开态，但不写回调用方——清空关键字后应回到用户原来的展开状态
  const effectiveExpanded = filtering ? [...search.expand] : localExpanded

  const rows = useMemo(
    () =>
      visibleRows(data, entities, effectiveExpanded, filtering ? search.visible : undefined),
    [data, entities, effectiveExpanded, filtering, search.visible]
  )
  const state = useMemo(() => resolveCheckState(entities, checked), [entities, checked])

  /* ----------------------------------------------------------- 虚拟滚动 */

  /*
   * 展开一棵大树会一次铺出上万行。行本身不复杂，但每行都带一个复选框与一个折叠键，
   * 真正拖慢的是这三样东西乘以行数。
   *
   * 只有给了 height 才虚拟化：没有可视高度就算不出该渲染哪几行，
   * 这时不如老老实实全渲染，也不要拿一个猜的高度去算，那会把行定位到看不见的地方。
   */
  const list = useRef<HTMLUListElement | null>(null)
  const [rowHeight, setRowHeight] = useState(ROW_FALLBACK_HEIGHT)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const virtual = Boolean(height) && shouldVirtualize(rows.length)
  const win = virtualWindow(scrollTop, viewportHeight, rowHeight, rows.length)
  const visible = virtual ? rows.slice(win.start, win.end + 1) : rows

  /* 滚动事件远多于帧，而每次都要读一次布局 */
  const onScroll = useMemo(
    () =>
      rafThrottle(() => {
        if (list.current) setScrollTop(list.current.scrollTop)
      }),
    []
  )
  useEffect(() => () => onScroll.cancel(), [onScroll])

  const measure = useCallback(() => {
    const el = list.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    const first = el.querySelector<HTMLElement>('.i-tree__row')
    if (first && first.offsetHeight > 0) setRowHeight(first.offsetHeight)
  }, [])

  useLayoutEffect(measure, [measure, height, rows.length])

  const toggleExpand = (key: string) => {
    if (filtering) return
    const next = new Set(localExpanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const list = [...next]
    setLocalExpanded(list)
    onExpandedChange?.(list)
  }

  const check = (key: string, next: boolean) => {
    onCheckedChange?.([...toggleChecked(entities, checked, key, next)])
  }

  const onRowActivate = (key: string, disabled: boolean) => {
    if (disabled) return
    const entity = entities.get(key)
    if (!entity) return
    if (checkable) {
      check(key, !state.checked.has(key))
      return
    }
    onSelect?.(entity.node)
  }

  return (
    <div className="i-tree">
      {searchable && (
        <Input
          className="i-tree__search"
          value={keyword}
          placeholder="搜索节点"
          onChange={(value: string) => setKeyword(value)}
        />
      )}

      <ul
        ref={list}
        className={['i-tree__list', height ? 'is-scrollable' : ''].filter(Boolean).join(' ')}
        style={{ height: height || undefined }}
        role="tree"
        onScroll={onScroll}
      >
        {/* 上下两块撑开的空白替代没渲染的那些行，滚动条长度才和真实行数相称 */}
        {virtual && <li className="i-tree__spacer" role="none" style={{ height: win.paddingTop }} />}
        {visible.map((row) => (
          <li
            key={row.key}
            className={[
              'i-tree__row',
              !checkable && selected === row.key ? 'is-selected' : '',
              row.disabled ? 'is-disabled' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            role="treeitem"
            aria-expanded={row.hasChildren ? row.expanded : undefined}
            aria-level={row.level + 1}
            aria-disabled={row.disabled || undefined}
            style={{ paddingLeft: `${row.level * 20 + 4}px` }}
            tabIndex={row.disabled ? -1 : 0}
            onClick={() => onRowActivate(row.key, row.disabled)}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onRowActivate(row.key, row.disabled)
              }
            }}
          >
            <button
              type="button"
              className={[
                'i-tree__toggle',
                row.expanded ? 'is-expanded' : '',
                row.hasChildren ? '' : 'is-leaf'
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={row.expanded ? '折叠' : '展开'}
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(row.key)
              }}
            >
              <Icon name="chevron-right" size={14} />
            </button>

            {checkable && (
              <span onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={state.checked.has(row.key)}
                  indeterminate={state.halfChecked.has(row.key)}
                  disabled={row.disabled}
                  onChange={(next: boolean) => check(row.key, next)}
                />
              </span>
            )}

            <span className="i-tree__label">
              {highlight(row.node.label, needle).map((part, index) =>
                part.hit ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>
              )}
            </span>
          </li>
        ))}
        {virtual && (
          <li className="i-tree__spacer" role="none" style={{ height: win.paddingBottom }} />
        )}
      </ul>

      {!rows.length && <p className="i-tree__empty">{emptyText}</p>}
    </div>
  )
}
