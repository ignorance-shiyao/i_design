/**
 * 填充变体。
 *
 * 描边图标在小尺寸、低对比的位置上会「化掉」——16px 的状态点、
 * 徽标里的那个勾、移动端底栏的选中项，都是描边最吃亏的地方。
 * 填充版把同一个形状做成实心，识别距离明显更远。
 *
 * 协议有三条，都是为了不破坏已有调用：
 *
 * 1. **填充是可选的增补，不是替代**。`<IIcon name="check-circle" />` 的行为一个字都不变，
 *    只有显式传 `variant="fill"` 才会用到这里的形状。
 * 2. **不是每个图标都要有填充版**。没有的就退回描边——
 *    这是「单色降级」：任何时候都有东西可画，不会出现空白。
 * 3. **双色靠同一个 currentColor 的两档不透明度，不引第二种颜色**。
 *    引入第二色就得为每个主题、每种底色重新验一遍对比度；
 *    同色两档在任何底色上的对比关系都是确定的，也不会在灰度打印里糊成一块。
 *    次要形状统一用 `secondary` 记，渲染方按 0.32 的不透明度画。
 */

export interface FilledIcon {
  /** 主形状，用 currentColor 实心填充 */
  path: string
  /** 次要形状：同色、低不透明度。没有就是纯单色填充 */
  secondary?: string
}

/*
 * 显式标注成 Record<string, FilledIcon>：用 satisfies 的话，
 * 每一条会被收窄成它自己的字面量类型，调用方读 secondary 时 TS 会说「不存在」——
 * 而它在别的条目上确实存在，这类报错只会让人去改调用方，而不是改这里。
 */
export const filledIcons: Record<string, FilledIcon> = {
  // 状态四件套：填充版用在徽标、消息条这类小而密的位置
  'check-circle': {
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5.2 7.4-6 6.6a1 1 0 0 1-1.5 0L6.8 13a1 1 0 1 1 1.4-1.4l2.2 2.3 5.3-5.8a1 1 0 1 1 1.5 1.3z'
  },
  'info-circle': {
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM13 17h-2v-6h2z'
  },
  'warning-triangle': {
    path: 'M13.7 3.9a2 2 0 0 0-3.4 0L2.2 18.1A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-2.9zM13 18h-2v-2h2zm0-3h-2V9h2z'
  },
  'error-circle': {
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1z'
  },
  // 置顶：列表里那个小图钉，描边版在 12px 下几乎看不出朝向
  pin: {
    path: 'M15 3H9a1 1 0 0 0-1 1.2L9 9l-3 3v2h5v7l1 1 1-1v-7h5v-2l-3-3 1-4.8A1 1 0 0 0 15 3z'
  },
  // 用户：头像占位常用，填充版在小尺寸下比描边稳
  user: {
    path: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
    // 身体作为次要形状：同色低不透明度，灰度下也分得出头与身
    secondary: 'M4 20.5c0-3.6 3.6-6 8-6s8 2.4 8 6v.5H4z'
  }
}

export type FilledIconName = keyof typeof filledIcons

/** 这个图标有没有填充版。没有就退回描边——任何时候都有东西可画 */
export const hasFilled = (name: string): name is FilledIconName => name in filledIcons

/** 次要形状的不透明度。两档同色，不引第二种颜色 */
export const FILLED_SECONDARY_OPACITY = 0.32
