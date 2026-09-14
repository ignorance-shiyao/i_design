import { icons, filledIcons, hasFilled, FILLED_SECONDARY_OPACITY, type IconName } from '@i-design/common'

export interface IconProps {
  name: IconName
  /**
   * 直接给 path 数据，跳过按名字查表。
   *
   * 只用少数几个图标、又在意体积时用它：`import { iconTrash }` 只会带走那一条，
   * 而按名字查表是整张表一起进产物（表是一个对象，摇树摇不掉没用到的条目）。
   */
  path?: string
  /**
   * 描边还是填充。
   *
   * 填充用在小尺寸、低对比的位置：徽标里的勾、16px 的状态点、
   * 移动端底栏的选中项——描边在那些地方会「化掉」。
   * 没有填充版的图标自动退回描边，任何时候都有东西可画。
   */
  variant?: 'stroke' | 'fill'
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
  path,
  variant = 'stroke',
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
  /* 填充版是可选增补：没有的图标退回描边，而不是画一个空白 */
  const filled = variant === 'fill' && !path && hasFilled(name) ? filledIcons[name] : null
  return (
    <svg
      className={['i-icon', spin ? 'is-spin' : '', className].filter(Boolean).join(' ')}
      style={sizing}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      strokeWidth={filled ? 0 : strokeWidth}
      stroke={filled ? 'none' : 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {/*
        双色靠同一个 currentColor 的两档不透明度，不引第二种颜色：
        引入第二色就得为每个主题、每种底色重新验一遍对比度。
      */}
      {filled ? (
        <>
          {filled.secondary ? <path d={filled.secondary} opacity={FILLED_SECONDARY_OPACITY} /> : null}
          <path d={filled.path} />
        </>
      ) : (
        <path d={path ?? icons[name]} />
      )}
    </svg>
  )
}
