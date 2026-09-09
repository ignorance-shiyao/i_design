import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  flattenTree,
  resolveCheckState,
  searchTree,
  toggleChecked,
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

export function Tree({
  data,
  checked = [],
  expanded = [],
  checkable = false,
  searchable = false,
  selected = '',
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

      <ul className="i-tree__list" role="tree">
        {rows.map((row) => (
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
      </ul>

      {!rows.length && <p className="i-tree__empty">{emptyText}</p>}
    </div>
  )
}
