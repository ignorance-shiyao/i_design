import type { ReactNode } from 'react'

export interface InputAdornmentProps {
  /** 固定前缀，例如 https:// */
  prepend?: ReactNode
  /** 固定后缀，例如 .com、元 */
  append?: ReactNode
  children?: ReactNode
}

export function InputAdornment({ prepend, append, children }: InputAdornmentProps) {
  const classes = ['i-input-adornment', prepend ? 'has-prepend' : '', append ? 'has-append' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {prepend && (
        <span className="i-input-adornment__part i-input-adornment__part--prepend">{prepend}</span>
      )}
      <span className="i-input-adornment__body">{children}</span>
      {append && (
        <span className="i-input-adornment__part i-input-adornment__part--append">{append}</span>
      )}
    </div>
  )
}
