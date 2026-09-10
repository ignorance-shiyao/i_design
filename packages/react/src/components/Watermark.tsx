import type { ReactNode } from 'react'
import { watermarkDataUri, watermarkTile } from '@i-design/common'

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

  return (
    <div className={['i-watermark', className].filter(Boolean).join(' ')}>
      {children}
      {/*
        水印层盖在内容上，但不吃事件——它是标记，不是遮罩。
        aria-hidden 是必须的：读屏把满屏重复的用户名念一遍，内容就没法听了。
      */}
      <div
        className="i-watermark__layer"
        aria-hidden="true"
        style={{
          backgroundImage: watermarkDataUri(tile),
          backgroundSize: `${tile.width}px ${tile.height}px`
        }}
      />
    </div>
  )
}
