import { useEffect, useRef, type ReactNode } from 'react'
import {
  WATERMARK_GUARD_ATTRS,
  watermarkDataUri,
  watermarkTampered,
  watermarkTile
} from '@i-design/common'

export interface WatermarkProps {
  children?: ReactNode
  /** 一行或多行文字。多行时逐行往下排 */
  text: string | string[]
  fontSize?: number
  /** 逆时针角度 */
  rotate?: number
  gapX?: number
  gapY?: number
  opacity?: number
  /** 不传时跟随文字色，深浅主题都能看见 */
  color?: string
  /** 水印层被删除或被改样式时自动重建 */
  guard?: boolean
  className?: string
}

export function Watermark({
  children,
  text,
  fontSize = 14,
  rotate = -22,
  gapX = 100,
  gapY = 100,
  opacity = 0.12,
  color = '',
  guard = true,
  className = ''
}: WatermarkProps) {
  const tile = watermarkTile({
    text,
    fontSize,
    rotate,
    gapX,
    gapY,
    opacity,
    // 不写死黑色：深色主题上黑水印等于没有
    color: color || 'currentColor'
  })

  const background = watermarkDataUri(tile)
  const backgroundSize = `${tile.width}px ${tile.height}px`

  /*
   * 被删掉或被改样式时恢复。
   *
   * 不守的话，水印在开发者工具里一秒就能抹掉——那这个组件基本没有意义。
   *
   * 恢复的是 React 自己创建的那个节点：把它放回去、清掉被改过的行内样式，
   * 而不是新建一个。让框架重建反而不行——节点已经被移出 DOM 之后，
   * 框架插新节点时拿到的锚点已经没有父节点了。
   *
   * 能力边界要说清楚：这挡的是随手删一下的人，挡不住关掉 JavaScript、
   * 改本地代码、或者截图前把页面存下来的人。
   */
  const root = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!guard || !root.current || typeof MutationObserver === 'undefined') return
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...WATERMARK_GUARD_ATTRS]
    }
    const observer = new MutationObserver((records) => {
      const tampered = records.some((record) =>
        watermarkTampered(
          [...record.removedNodes].some((node) =>
            (node as HTMLElement).classList?.contains('i-watermark__layer')
          ),
          record.attributeName
        )
      )
      if (!tampered) return
      // 恢复自身也会触发变动，先断开再接回，否则会一直循环下去
      observer.disconnect()
      const el = layer.current
      if (el && root.current) {
        if (!el.isConnected) root.current.appendChild(el)
        el.removeAttribute('hidden')
        el.className = 'i-watermark__layer'
        // 整条清掉再写回：只补背景的话，被塞进来的 display: none 还留着
        el.style.cssText = ''
        el.style.backgroundImage = background
        el.style.backgroundSize = backgroundSize
      }
      if (root.current) observer.observe(root.current, options)
    })
    observer.observe(root.current, options)
    return () => observer.disconnect()
  }, [guard, background, backgroundSize])


  return (
    <div ref={root} className={['i-watermark', className].filter(Boolean).join(' ')}>
      {children}
      {/*
        水印层盖在内容上，但不吃事件——它是标记，不是遮罩。
        aria-hidden 是必须的：读屏把满屏重复的用户名念一遍，内容就没法听了。
      */}
      <div
        ref={layer}
        className="i-watermark__layer"
        aria-hidden="true"
        style={{ backgroundImage: background, backgroundSize }}
      />
    </div>
  )
}
