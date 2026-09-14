import { icons, type IconName } from '@i-design/common'

export interface IconProps {
  name: IconName
  /** 尺寸跟随字号更自然，传数字则按 px */
  size?: number | string
  strokeWidth?: number
  /** 无障碍标签；不传时视为装饰性图标，对读屏隐藏 */
  label?: string
  spin?: boolean
  className?: string
}

export function Icon({
  name,
  size = '1em',
  strokeWidth = 1.8,
  label,
  spin = false,
  className = ''
}: IconProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size
  /*
   * 默认尺寸由 .i-icon 的类给出，这里就不写内联样式了——
   * 不带 unsafe-inline 的 CSP 会拒绝整个 style 属性，那样图标会全部塌成 0。
   */
  const sizing = dimension === '1em' ? undefined : { width: dimension, height: dimension }
  return (
    <svg
      className={['i-icon', spin ? 'is-spin' : '', className].filter(Boolean).join(' ')}
      style={sizing}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <path d={icons[name]} />
    </svg>
  )
}
