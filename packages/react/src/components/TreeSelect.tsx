import { useMemo, useState } from 'react'
import { flattenTree, labelPath, leafKeys, type TreeNode } from '@i-design/common'
import { Icon } from './Icon'
import { Popover } from './Popover'
import { Tree } from './Tree'

export interface TreeSelectProps {
  data: TreeNode[]
  /** 单选值 */
  value?: string
  /** 多选值；传了 multiple 时用这个 */
  checked?: string[]
  multiple?: boolean
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  /** 单选时是否显示完整路径，如「平台 / 权限 / 角色」 */
  showPath?: boolean
  separator?: string
  /** 多选时最多展示几项，超出折叠为「等 N 项」 */
  maxDisplay?: number
  onChange?: (value: string) => void
  onCheckedChange?: (keys: string[]) => void
}

export function TreeSelect({
  data,
  value = '',
  checked = [],
  multiple = false,
  placeholder = '请选择',
  disabled = false,
  searchable = true,
  showPath = true,
  separator = ' / ',
  maxDisplay = 2,
  onChange,
  onCheckedChange
}: TreeSelectProps) {
  const entities = useMemo(() => flattenTree(data), [data])
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  /*
   * 多选时只展示叶子：父节点在选中集合里只是「它的子节点都选了」的推论，
   * 把它也列出来会让用户以为多选了一项。
   */
  const display = useMemo(() => {
    if (multiple) {
      const leaves = leafKeys(entities, checked)
      if (!leaves.length) return ''
      const labels = leaves.map((key) => entities.get(key)?.node.label ?? key)
      if (labels.length <= maxDisplay) return labels.join('、')
      return `${labels.slice(0, maxDisplay).join('、')} 等 ${labels.length} 项`
    }
    if (!value) return ''
    return showPath
      ? labelPath(entities, value).join(separator)
      : (entities.get(value)?.node.label ?? value)
  }, [multiple, entities, checked, value, showPath, separator, maxDisplay])

  return (
    <Popover
      placement="bottom"
      align="start"
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      content={
        <div className="i-tree-select__panel">
          <Tree
            data={data}
            checkable={multiple}
            searchable={searchable}
            checked={checked}
            selected={value}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onSelect={(node) => {
              onChange?.(node.key)
              // 单选选完即收起；多选要留着让用户继续勾
              setOpen(false)
            }}
            onCheckedChange={onCheckedChange}
          />
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
