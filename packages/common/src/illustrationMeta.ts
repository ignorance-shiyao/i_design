/**
 * 插画矩阵：每张图是什么、画在哪儿用、在深色下怎么办、读屏器该念什么。
 *
 * 单独一个纯数据模块，不 import 任何 .webp——校验脚本（scripts/check-illustrations.mjs）
 * 要能在不打包二进制素材的前提下把它读进来，和磁盘上的文件对一遍。
 *
 * 三件事在这里定死：
 *
 * 1. 分类。SVG 图标与位图插画是两类东西：图标表意、跟随 currentColor、任意尺寸；
 *    插画表情绪、颜色是画出来的、只能按导出尺寸缩小使用。混用的后果是把一张
 *    几十 KB 的猫塞进 16px 的按钮里，或者试图给插画染色而得到一团脏颜色。
 * 2. 深色。插画四角必须是全透明——素材里不许烤进白底，否则深色页面上会出现一个白盒子。
 *    实测四角 alpha 全为 0，因此除 Hero 外的插画在两个主题下直接通用；
 *    Hero 因为画了背景氛围，才成对提供 light / dark。
 * 3. 替代文本。alt 写「图里画了什么」，由使用处决定念不念：
 *    空状态、错误页的标题已经把信息说全了，那里渲染成 alt=""（装饰性）；
 *    资源页把插画本身当内容展示，就念 alt。同一句话只念一次，是无障碍的要求，
 *    不是可选项。
 */

/** 用途分类。icon 不在此列——图标走 icons/meta.ts */
export type IllustrationCategory = 'empty' | 'error' | 'hero' | 'mascot'

export type IllustrationTheme = 'any' | 'light' | 'dark'

export interface IllustrationMeta {
  /** 注册表里的键，形如 empty.search */
  key: string
  /** 1x 素材相对仓库根的路径；2x 是同名加 @2x */
  file: string
  category: IllustrationCategory
  /** 画了什么 */
  alt: string
  /** 什么场合用它 */
  usage: string
  /** any 表示两个主题通用（四角透明、无烤进去的底） */
  theme: IllustrationTheme
  /** CSS 显示宽度（px），与 srcset 的 1x 宽度一致 */
  width: number
}

const dir = 'packages/common/src/assets/illustrations'

export const illustrationMeta: IllustrationMeta[] = [
  {
    key: 'empty.empty',
    file: `${dir}/empty/no-data.webp`,
    category: 'empty',
    alt: '小白趴在空荡荡的纸箱边',
    usage: '空状态 · 从未创建过内容',
    theme: 'any',
    width: 180
  },
  {
    key: 'empty.search',
    file: `${dir}/empty/search-empty.webp`,
    category: 'empty',
    alt: '十五举着放大镜四处张望',
    usage: '空状态 · 筛选或搜索没有结果',
    theme: 'any',
    width: 180
  },
  {
    key: 'empty.error',
    file: `${dir}/empty/load-failed.webp`,
    category: 'empty',
    alt: '小白对着断了线的插头发愣',
    usage: '空状态 · 数据加载失败',
    theme: 'any',
    width: 180
  },
  {
    key: 'empty.permission',
    file: `${dir}/empty/no-permission.webp`,
    category: 'empty',
    alt: '十五被一道上了锁的门挡在外面',
    usage: '空状态 · 没有访问权限',
    theme: 'any',
    width: 180
  },
  {
    key: 'error.404',
    file: `${dir}/error/404.webp`,
    category: 'error',
    alt: '小白与十五在写着 404 的路牌下找路',
    usage: '错误页 · 地址不存在',
    theme: 'any',
    width: 360
  },
  {
    key: 'error.500',
    file: `${dir}/error/500.webp`,
    category: 'error',
    alt: '十五守着一台冒烟的服务器',
    usage: '错误页 · 服务异常',
    theme: 'any',
    width: 360
  },
  {
    key: 'hero.light',
    file: `${dir}/hero/hero-light.webp`,
    category: 'hero',
    alt: '小白与十五在浅色的设计世界里',
    usage: '首页 Hero · 浅色主题',
    theme: 'light',
    width: 600
  },
  {
    key: 'hero.dark',
    file: `${dir}/hero/hero-dark.webp`,
    category: 'hero',
    alt: '小白与十五在深色的设计世界里',
    usage: '首页 Hero · 深色主题',
    theme: 'dark',
    width: 600
  },
  {
    key: 'mascot.mascot',
    file: `${dir}/mascot/mascot.webp`,
    category: 'mascot',
    alt: '小白与十五主形象',
    usage: '品牌展示 · 资源页与关于页',
    theme: 'any',
    width: 320
  }
]

export const illustrationOf = (key: string): IllustrationMeta | undefined =>
  illustrationMeta.find((m) => m.key === key)
