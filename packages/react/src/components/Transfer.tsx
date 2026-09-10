import { useState } from 'react'
import {
  checkedAfterMove,
  filterItems,
  headerState,
  moveKeys,
  splitSides,
  toggleAll,
  toggleItem,
  type TransferItem,
  type TransferSide
} from '@i-design/common'
import { Checkbox } from './Checkbox'
import { Icon } from './Icon'
import { Input } from './Input'

export interface TransferProps {
  items: TransferItem[]
  /** 右栏的 key，顺序即用户搬过去的顺序 */
  value?: string[]
  onChange?: (keys: string[]) => void
  titles?: [string, string]
  searchable?: boolean
  height?: number
  className?: string
}

export function Transfer({
  items,
  value = [],
  onChange,
  titles = ['待选', '已选'],
  searchable = true,
  height = 260,
  className = ''
}: TransferProps) {
  const [checked, setChecked] = useState<Record<TransferSide, string[]>>({ source: [], target: [] })
  const [keyword, setKeyword] = useState<Record<TransferSide, string>>({ source: '', target: '' })

  const sides = splitSides(items, value)
  const visible = {
    source: filterItems(sides.source, keyword.source),
    target: filterItems(sides.target, keyword.target)
  }
  const header = {
    source: headerState(visible.source, checked.source),
    target: headerState(visible.target, checked.target)
  }

  function move(to: TransferSide) {
    const from: TransferSide = to === 'target' ? 'source' : 'target'
    const moving = checked[from]
    if (!moving.length) return
    onChange?.(moveKeys(items, value, moving, to))
    // 搬走的要从勾选里清掉，否则会出现「已选 3 项」而屏幕上一个勾都没有
    setChecked({ ...checked, [from]: checkedAfterMove(checked[from], moving) })
  }

  const panes: { side: TransferSide; title: string }[] = [
    { side: 'source', title: titles[0] },
    { side: 'target', title: titles[1] }
  ]

  return (
    <div
      className={['i-transfer', className].filter(Boolean).join(' ')}
      style={{ ['--i-transfer-height' as string]: `${height}px` }}
    >
      {panes.map((pane, index) => (
        <>
          <section key={pane.side} className="i-transfer__pane">
            <header className="i-transfer__head">
              {/*
                表头的全选只管当前可见的条目：搜索状态下用户的意思是「这些」，
                把看不见的一起选中，再点搬运就会搬走一批他从没见过的条目。
              */}
              <Checkbox
                checked={header[pane.side].allChecked}
                indeterminate={header[pane.side].someChecked}
                disabled={header[pane.side].selectable === 0}
                onChange={() =>
                  setChecked({ ...checked, [pane.side]: toggleAll(visible[pane.side], checked[pane.side]) })
                }
              />
              <span className="i-transfer__title">{pane.title}</span>
              <span className="i-transfer__count">
                {header[pane.side].checked} / {visible[pane.side].length}
              </span>
            </header>

            {searchable && (
              <div className="i-transfer__search">
                <Input
                  value={keyword[pane.side]}
                  size="sm"
                  placeholder="搜索"
                  onChange={(next) => setKeyword({ ...keyword, [pane.side]: next })}
                />
              </div>
            )}

            <ul className="i-transfer__list">
              {visible[pane.side].map((item) => (
                <li
                  key={item.key}
                  className={['i-transfer__item', item.disabled ? 'is-disabled' : ''].filter(Boolean).join(' ')}
                >
                  <Checkbox
                    checked={checked[pane.side].includes(item.key)}
                    disabled={item.disabled}
                    onChange={() =>
                      setChecked({ ...checked, [pane.side]: toggleItem(checked[pane.side], item.key) })
                    }
                  >
                    {item.label}
                  </Checkbox>
                </li>
              ))}
              {!visible[pane.side].length && (
                <li className="i-transfer__empty">{keyword[pane.side] ? '没有匹配的条目' : '空'}</li>
              )}
            </ul>
          </section>

          {/*
            按钮列是两栏之间真正的一格，不是浮在上面的绝对定位块。
            绝对定位的网格子项，包含块是它自己那一格——而那一格因为没有内容宽度是 0，
            于是按钮会落到隔壁栏里去。
          */}
          {index === 0 && (
            <div key="actions" className="i-transfer__actions">
              <button
                className="i-transfer__move"
                type="button"
                aria-label="移到右栏"
                disabled={!checked.source.length}
                onClick={() => move('target')}
              >
                <Icon name="chevron-right" size={16} />
              </button>
              <button
                className="i-transfer__move"
                type="button"
                aria-label="移到左栏"
                disabled={!checked.target.length}
                onClick={() => move('source')}
              >
                <Icon name="chevron-left" size={16} />
              </button>
            </div>
          )}
        </>
      ))}
    </div>
  )
}
