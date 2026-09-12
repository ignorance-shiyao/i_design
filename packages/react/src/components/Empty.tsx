import type { ReactNode } from 'react'
import { emptyIllustrations } from '@i-design/common'
import { useConfig } from './ConfigProvider'

export interface EmptyProps {
  type?: 'empty' | 'search' | 'error' | 'permission'
  title?: string
  description?: string
  size?: 'sm' | 'md'
  /** 替换插画；不传使用体系自带的猫咪插画 */
  illustration?: ReactNode
  children?: ReactNode
}


export function Empty({
  type = 'empty',
  title,
  description,
  size = 'md',
  illustration,
  children
}: EmptyProps) {
  /* 四种成因的默认文案跟着字典走，换语言时空态不会是唯一还在说中文的地方 */
  const { locale } = useConfig()
  const preset = locale.emptyPresets[type]

  const art = emptyIllustrations[type]
  return (
    <div className={`i-empty i-empty--${size}`}>
      {illustration ?? (
        <img
          className="i-empty__art"
          src={art.src}
          srcSet={art.srcset}
          width={art.width}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      <p className="i-empty__title">{title || preset.title}</p>
      <p className="i-empty__desc">{description || preset.description}</p>
      {children && <div className="i-empty__action">{children}</div>}
    </div>
  )
}
