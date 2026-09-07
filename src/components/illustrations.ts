/**
 * 插画资源登记表。
 *
 * 这些是绘画稿（连续渐变、数万独立颜色），不适合矢量化，因此以 WebP 位图交付：
 * 按显示尺寸导出 1x / 2x 两份，由 srcset 交给浏览器按 DPR 取用。
 * 经 Vite 处理后带内容哈希，可长期缓存。
 */
import noData from '@/assets/illustrations/empty/no-data.webp'
import noData2x from '@/assets/illustrations/empty/no-data@2x.webp'
import searchEmpty from '@/assets/illustrations/empty/search-empty.webp'
import searchEmpty2x from '@/assets/illustrations/empty/search-empty@2x.webp'
import loadFailed from '@/assets/illustrations/empty/load-failed.webp'
import loadFailed2x from '@/assets/illustrations/empty/load-failed@2x.webp'
import noPermission from '@/assets/illustrations/empty/no-permission.webp'
import noPermission2x from '@/assets/illustrations/empty/no-permission@2x.webp'

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

/** 空状态插画，键与 IEmpty 的 type 一一对应 */
export const emptyIllustrations = {
  empty: pair(noData, noData2x, 180),
  search: pair(searchEmpty, searchEmpty2x, 180),
  error: pair(loadFailed, loadFailed2x, 180),
  permission: pair(noPermission, noPermission2x, 180)
} as const
