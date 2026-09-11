import type { ReactNode } from 'react'

export interface FooterLink {
  label: string
  href?: string
}

export interface FooterProps {
  text?: string
  links?: FooterLink[]
  onSelect?: (link: FooterLink) => void
  children?: ReactNode
}

/**
 * 页脚：版权、备案、几个次要链接。
 * 字号与颜色都压到最低一档——它存在的意义是「需要时找得到」，不是被看见。
 */
export function Footer({ text = '', links = [], onSelect, children }: FooterProps) {
  return (
    <footer className="i-footer">
      {links.length > 0 && (
        <div className="i-footer__links">
          {links.map((link, index) => (
            <span key={link.label}>
              {index > 0 && (
                <span className="i-footer__sep" aria-hidden="true">
                  ·
                </span>
              )}
              <a
                className="i-footer__link"
                href={link.href}
                onClick={() => !link.href && onSelect?.(link)}
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>
      )}

      {text && <p className="i-footer__text">{text}</p>}
      {children}
    </footer>
  )
}
