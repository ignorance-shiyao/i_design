import { useMemo, useState } from 'react'
import {
  cascaderActivate,
  cascaderColumns,
  flattenTree,
  labelPath,
  nodePath,
  type TreeNode
} from '@i-design/common'
import { Icon } from './Icon'
import { Popover } from './Popover'

export interface CascaderProps {
  data: TreeNode[]
  /** 选中的叶子 key */
  value?: string
  placeholder?: string
  disabled?: boolean
  /** 允许选中非叶子节点；默认只有叶子才算完成选择 */
  changeOnSelect?: boolean
  separator?: string
  onChange?: (key: string, path: string[]) => void
}

export function Cascader({
  data,
  value = '',
  placeholder = '请选择',
  disabled = false,
  changeOnSelect = false,
  separator = ' / ',
  onChange
}: CascaderProps) {
  const entities = useMemo(() => flattenTree(data), [data])
  // 打开时从当前值恢复路径，用户看到的是上次停在哪儿，而不是从头开始
  const [active, setActive] = useState<string[]>(value ? nodePath(entities, value) : [])
  // 选完就收起：选择类控件停在展开态，用户会以为还没选上
  const [open, setOpen] = useState(false)

  const columns = useMemo(
    () => cascaderColumns(data, entities, active),
    [data, entities, active]
  )
  const display = value ? labelPath(entities, value).join(separator) : ''

  const choose = (node: TreeNode) => {
    if (node.disabled) return
    const next = cascaderActivate(entities, active, node.key)
    setActive(next)
    const isLeaf = !node.children?.length
    if (isLeaf || changeOnSelect) onChange?.(node.key, nodePath(entities, node.key))
    // 只有选到叶子才算完成，收起面板；中间层级要留着让用户继续往下走
    if (isLeaf) setOpen(false)
  }

  return (
    <Popover
      placement="bottom"
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      align="start"
      content={
        <div className="i-cascader__panel">
          {columns.map((column, columnIndex) => (
            <ul key={columnIndex} className="i-cascader__column">
              {column.map((node) => (
                <li key={node.key}>
                  <button
                    type="button"
                    className={[
                      'i-cascader__option',
                      active[columnIndex] === node.key ? 'is-active' : '',
                      value === node.key ? 'is-selected' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={node.disabled}
                    onClick={() => choose(node)}
                  >
                    <span>{node.label}</span>
                    {!!node.children?.length && (
                      <Icon name="chevron-right" size={14} className="i-cascader__arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      }
    >
      <button
        type="button"
        className={[
          'i-select__trigger',
          disabled ? 'is-disabled' : '',
          display ? '' : 'is-placeholder'
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        aria-label={display || placeholder}
      >
        <span className="i-select__label">{display || placeholder}</span>
        <Icon name="chevron-down" size={14} />
      </button>
    </Popover>
  )
}
