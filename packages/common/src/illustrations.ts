/**
 * 插画资源登记表（跨端共享）。
 *
 * 这些是绘画稿（连续渐变、7–15 万独立颜色），矢量化会抹平毛发或产生数万条路径，
 * 因此以 WebP 位图交付：按显示尺寸导出 1x / 2x，由 srcset 按屏幕像素密度取用。
 * 经打包器处理后带内容哈希，可长期缓存。
 */
import noData from './assets/illustrations/empty/no-data.webp'
import noData2x from './assets/illustrations/empty/no-data@2x.webp'
import searchEmpty from './assets/illustrations/empty/search-empty.webp'
import searchEmpty2x from './assets/illustrations/empty/search-empty@2x.webp'
import loadFailed from './assets/illustrations/empty/load-failed.webp'
import loadFailed2x from './assets/illustrations/empty/load-failed@2x.webp'
import noPermission from './assets/illustrations/empty/no-permission.webp'
import noPermission2x from './assets/illustrations/empty/no-permission@2x.webp'
import err404 from './assets/illustrations/error/404.webp'
import err4042x from './assets/illustrations/error/404@2x.webp'
import err500 from './assets/illustrations/error/500.webp'
import err5002x from './assets/illustrations/error/500@2x.webp'
import heroLight from './assets/illustrations/hero/hero-light.webp'
import heroLight2x from './assets/illustrations/hero/hero-light@2x.webp'
import heroDark from './assets/illustrations/hero/hero-dark.webp'
import heroDark2x from './assets/illustrations/hero/hero-dark@2x.webp'
import mascot from './assets/illustrations/mascot/mascot.webp'
import mascot2x from './assets/illustrations/mascot/mascot@2x.webp'

export interface Illustration {
  src: string
  srcset: string
  width: number
}

const pair = (src: string, src2x: string, width: number): Illustration => ({
  src,
  srcset: `${src} 1x, ${src2x} 2x`,
  width
})

/** 空状态插画，键与 Empty 的 type 一一对应 */
export const emptyIllustrations = {
  empty: pair(noData, noData2x, 180),
  search: pair(searchEmpty, searchEmpty2x, 180),
  error: pair(loadFailed, loadFailed2x, 180),
  permission: pair(noPermission, noPermission2x, 180)
} as const

export const errorIllustrations = {
  '404': pair(err404, err4042x, 360),
  '500': pair(err500, err5002x, 360)
} as const

export const heroIllustrations = {
  light: pair(heroLight, heroLight2x, 600),
  dark: pair(heroDark, heroDark2x, 600)
} as const

export const mascotIllustration = pair(mascot, mascot2x, 320)
