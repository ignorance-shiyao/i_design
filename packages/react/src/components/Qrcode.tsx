import { useMemo } from 'react'
import { qrMatrix, qrPath, type QrEcLevel } from '@i-design/common'

export interface QrcodeProps {
  value: string
  /** 边长（px），不含静默区 */
  size?: number
  /** 纠错等级。加了中心图标就要提到 Q 或 H，否则遮住的部分无法恢复 */
  level?: QrEcLevel
  /** 码点颜色。默认纯黑：中等明度的颜色会让对比度掉到扫不出来 */
  color?: string
  background?: string
  /** 码下方的说明文字 */
  label?: string
  className?: string
}

/* 静默区四个模块，规范给的下限 */
const QUIET = 4

export function Qrcode({
  value,
  size = 160,
  level = 'M',
  color = '#000000',
  background = '#ffffff',
  label = '',
  className = ''
}: QrcodeProps) {
  const matrix = useMemo(() => qrMatrix(value, level), [value, level])
  const path = useMemo(() => (matrix ? qrPath(matrix) : ''), [matrix])

  return (
    <div className={['i-qrcode', className].filter(Boolean).join(' ')}>
      {matrix ? (
        // 整张码一条 path：版本 10 有三千多个模块，三千多个节点会卡住长列表
        <svg
          className="i-qrcode__canvas"
          width={size}
          height={size}
          viewBox={`${-QUIET} ${-QUIET} ${matrix.size + QUIET * 2} ${matrix.size + QUIET * 2}`}
          style={{ background }}
          role="img"
          aria-label={label || `二维码：${value}`}
        >
          <path d={path} fill={color} />
        </svg>
      ) : (
        <div className="i-qrcode__error">
          内容过长，超出二维码容量。
          <br />
          请改用更短的链接，或降低纠错等级。
        </div>
      )}

      {label && <span className="i-qrcode__label">{label}</span>}
    </div>
  )
}
