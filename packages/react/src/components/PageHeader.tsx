import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface PageHeaderProps {
  title?: ReactNode
  subtitle?: ReactNode
  /** 返回键文案；传空字符串则只显示箭头 */
  backText?: string
  /** 不需要返回时整块去掉，而不是留一个点不动的箭头 */
  back?: boolean
  onBack?: () => void
  extra?: ReactNode
  children?: ReactNode
}

/**
 * 页头：返回、标题、副标题、右侧操作。
 * 返回键与标题同一行而不是叠在标题上方——叠起来会让标题看着像副标题。
 */
export function PageHeader({
  title,
  subtitle,
  backText = '返回',
  back = true,
  onBack,
  extra,
  children
}: PageHeaderProps) {
  return (
    <header className="i-page-header">
      {back && (
        <>
          <button className="i-page-header__back" type="button" onClick={onBack}>
            <Icon name="chevron-left" size={18} />
            {backText && <span>{backText}</span>}
          </button>
          <span className="i-page-header__divider" aria-hidden="true" />
        </>
      )}

      <div className="i-page-header__main">
        <h1 className="i-page-header__title">{title}</h1>
        {subtitle && <p className="i-page-header__subtitle">{subtitle}</p>}
      </div>

      {extra && <div className="i-page-header__extra">{extra}</div>}
      {children && <div className="i-page-header__content">{children}</div>}
    </header>
  )
}
