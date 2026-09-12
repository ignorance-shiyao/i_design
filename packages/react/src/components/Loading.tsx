import type { ReactNode } from 'react'
import { useConfig } from './ConfigProvider'

export interface LoadingProps {
  loading?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
  children?: ReactNode
}

/** 有子元素时作为区域遮罩，内容仍在下方可见，加载结束不产生布局跳动 */
export function Loading({
  loading = true,
  text = '',
  size = 'md',
  fullscreen = false,
  children
}: LoadingProps) {
  const { locale } = useConfig()
  const indicator = (
    <span className={`i-loading i-loading--${size}`} role="status" aria-label={text || locale.loading}>
      <span className="i-loading__spinner" />
      {text && <span className="i-loading__text">{text}</span>}
    </span>
  )

  if (!children) return loading ? indicator : null

  return (
    <div className="i-loading-wrap">
      {children}
      {loading && (
        <div className={['i-loading-mask', fullscreen ? 'is-fullscreen' : ''].filter(Boolean).join(' ')}>
          {indicator}
        </div>
      )}
    </div>
  )
}
