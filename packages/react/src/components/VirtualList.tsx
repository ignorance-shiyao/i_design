import { useCallback, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { scrollToRow, shouldVirtualize, virtualWindow } from '@i-design/common'

export interface VirtualListHandle {
  scrollTo(index: number): void
}

export interface VirtualListProps<T> {
  items: T[]
  children: (item: T, index: number) => ReactNode
  /** 每行高度，像素。定高才能不量元素直接算窗口 */
  itemHeight?: number
  height?: number
  /** 上下各多渲染几行 */
  overscan?: number
  handle?: Ref<VirtualListHandle>
  className?: string
}

export function VirtualList<T>({
  items,
  children,
  itemHeight = 40,
  height = 320,
  overscan = 3,
  handle,
  className = ''
}: VirtualListProps<T>) {
  const scroller = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      setScrollTop(scroller.current?.scrollTop ?? 0)
    })
  }, [])

  useImperativeHandle(handle, () => ({
    scrollTo(index: number) {
      const el = scroller.current
      if (!el) return
      el.scrollTop = scrollToRow(index, itemHeight, el.scrollTop, height)
    }
  }))

  /*
   * 条目太少时不虚拟化：那时它只是徒增复杂度与一次布局计算，
   * 而且会平白丢掉浏览器自带的查找（Ctrl+F 找不到没渲染的行）。
   */
  const virtual = shouldVirtualize(items.length)
  const win = virtualWindow(scrollTop, height, itemHeight, items.length, overscan)
  const visible = virtual
    ? items.slice(win.start, win.end + 1).map((item, i) => ({ item, index: win.start + i }))
    : items.map((item, index) => ({ item, index }))

  return (
    <div
      ref={scroller}
      className={['i-virtual', className].filter(Boolean).join(' ')}
      style={{ height }}
      role="list"
      tabIndex={0}
      onScroll={onScroll}
    >
      {/*
        上下用两块空白撑开，而不是绝对定位每一行：
        撑开的写法让滚动条长度天然正确，也不必为每一行算 top。
      */}
      {virtual && <div style={{ height: win.paddingTop }} aria-hidden="true" />}
      {visible.map((row) => (
        <div key={row.index} className="i-virtual__row" role="listitem" style={{ height: itemHeight }}>
          {children(row.item, row.index)}
        </div>
      ))}
      {virtual && <div style={{ height: win.paddingBottom }} aria-hidden="true" />}
    </div>
  )
}
