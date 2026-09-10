/**
 * 图片预览的状态与变换。
 *
 * 缩放边界、旋转归一化、多图翻页这几件事写在组件里，各端就会各自解释一遍：
 * 一端能缩到 10 倍、另一端 3 倍就到头，同一份设计稿在两端上体验不同。
 */

export interface ImageTransform {
  scale: number
  /** 角度，始终归一化到 [0, 360) */
  rotate: number
  x: number
  y: number
}

export const IMAGE_IDENTITY: ImageTransform = { scale: 1, rotate: 0, x: 0, y: 0 }

/** 缩放范围。上限 4 倍：再大就只剩噪点，而用户会以为是图糊了 */
export const IMAGE_MIN_SCALE = 0.5
export const IMAGE_MAX_SCALE = 4

export function zoomImage(transform: ImageTransform, delta: number): ImageTransform {
  const scale = Math.min(IMAGE_MAX_SCALE, Math.max(IMAGE_MIN_SCALE, transform.scale + delta))
  // 缩回 1 倍时把位移一并归零：否则图缩小了却还偏在角落，用户得再拖回来
  return scale === 1 ? { ...transform, scale, x: 0, y: 0 } : { ...transform, scale }
}

/**
 * 旋转。角度归一化到 [0, 360)，不让它一路加到 720——
 * 数字本身会漏进 aria 文案与调试信息里，「已旋转 720 度」没有意义。
 */
export function rotateImage(transform: ImageTransform, delta: number): ImageTransform {
  return { ...transform, rotate: ((transform.rotate + delta) % 360 + 360) % 360 }
}

/** 拖动。只有放大之后才允许拖——原尺寸时拖动会让图莫名其妙地跑出框 */
export function panImage(transform: ImageTransform, dx: number, dy: number): ImageTransform {
  if (transform.scale <= 1) return transform
  return { ...transform, x: transform.x + dx, y: transform.y + dy }
}

export function resetImage(): ImageTransform {
  return { ...IMAGE_IDENTITY }
}

/** CSS transform 串。各端的写法一致，避免一端漏掉 translate 导致拖动没反应 */
export function imageTransformStyle(transform: ImageTransform): string {
  return `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`
}

/**
 * 多图翻页。到头不循环。
 *
 * 循环会让「这是最后一张」这个信息消失——用户点着点着又回到第一张，
 * 分不清是翻完了还是自己看漏了。
 */
export function stepImage(current: number, total: number, delta: number): number {
  if (total <= 0) return 0
  return Math.min(total - 1, Math.max(0, current + delta))
}

export type ImageStatus = 'loading' | 'loaded' | 'error'

/**
 * 加载失败时显示什么。
 *
 * 失败要显式说出来，而不是留一块空白或一个碎图标。
 * 空白会被当成「这里本来就没图」，而实际上是加载失败——两者的处理完全不同。
 */
export function imageAlt(status: ImageStatus, alt: string): string {
  if (status === 'error') return alt ? `${alt}（加载失败）` : '图片加载失败'
  if (status === 'loading') return alt ? `${alt}（加载中）` : '图片加载中'
  return alt
}
