/**
 * 水印的排布与绘制参数。
 *
 * 水印是「拦不住有心人、但能让随手截图的人留下痕迹」的东西。
 * 它的价值全在细节：太密挡内容，太疏截一小块就没有；角度、间距、透明度
 * 三者任何一个各端写得不一样，同一份文档在两端截出来的水印就对不上。
 */

export interface WatermarkOptions {
  /** 一行或多行文字。多行时逐行往下排 */
  text: string | string[]
  fontSize?: number
  /** 逆时针角度。负值表示从左下往右上，符合大多数产品的习惯 */
  rotate?: number
  /** 单块水印的间距 */
  gapX?: number
  gapY?: number
  opacity?: number
  color?: string
}

export interface WatermarkTile {
  /** 单块水印的画布尺寸，重复平铺用 */
  width: number
  height: number
  lines: string[]
  fontSize: number
  rotate: number
  opacity: number
  color: string
  /** 文字绘制的起点，已算好居中 */
  originX: number
  originY: number
  lineHeight: number
}

/**
 * 算出一块水印的尺寸与绘制参数。
 *
 * 尺寸要把旋转后的外接框算进去，不能只用文字本身的宽高：
 * 只算文字宽高的话，倾斜之后四个角会被相邻的块裁掉，
 * 平铺出来是一片断头断尾的字。
 */
export function watermarkTile(options: WatermarkOptions): WatermarkTile {
  const {
    text,
    fontSize = 14,
    rotate = -22,
    gapX = 100,
    gapY = 100,
    opacity = 0.12,
    color = '#000000'
  } = options

  const lines = Array.isArray(text) ? text : [text]
  const lineHeight = Math.round(fontSize * 1.5)
  const textWidth = Math.max(...lines.map((line) => measureWidth(line, fontSize)), fontSize)
  const textHeight = lines.length * lineHeight

  const radians = (Math.abs(rotate) * Math.PI) / 180
  const rotatedWidth = textWidth * Math.cos(radians) + textHeight * Math.sin(radians)
  const rotatedHeight = textWidth * Math.sin(radians) + textHeight * Math.cos(radians)

  const width = Math.ceil(rotatedWidth + gapX)
  const height = Math.ceil(rotatedHeight + gapY)

  return {
    width,
    height,
    lines,
    fontSize,
    rotate,
    opacity,
    color,
    originX: width / 2,
    originY: height / 2,
    lineHeight
  }
}

/**
 * 水印的 SVG 数据 URI，可直接作为 background-image 平铺。
 *
 * 用 SVG 而不是 canvas.toDataURL：SVG 在高分屏上不会糊，
 * 而且不需要等一帧再取图，首屏就能带上水印——canvas 方案在慢设备上
 * 会有一小段「先看到没水印的内容」的窗口，那正是要防的场景。
 */
export function watermarkDataUri(tile: WatermarkTile): string {
  const texts = tile.lines
    .map(
      (line, i) =>
        `<text x="${tile.originX}" y="${tile.originY + (i - (tile.lines.length - 1) / 2) * tile.lineHeight}" ` +
        `text-anchor="middle" dominant-baseline="middle" ` +
        `font-size="${tile.fontSize}" fill="${tile.color}" fill-opacity="${tile.opacity}" ` +
        `font-family="sans-serif">${escapeXml(line)}</text>`
    )
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile.width}" height="${tile.height}">` +
    `<g transform="rotate(${tile.rotate} ${tile.originX} ${tile.originY})">${texts}</g>` +
    `</svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * 估算一行文字的宽度。
 *
 * 不能一律按「字数 × 字号」算：那对西文是接近两倍的高估，
 * 一个 21 个字符的邮箱会被估成 294px，加上间距后单块水印比容器还大——
 * 结果整个容器里只落得下一块，截图截走大半屏也带不上水印，
 * 而水印的全部意义正在于此。
 *
 * 中日韩字符按一个字宽算，其余按 0.55 字宽——西文小写字母的平均宽度就在这附近。
 */
function measureWidth(line: string, fontSize: number): number {
  let units = 0
  for (const char of line) {
    units += /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(char) ? 1 : 0.55
  }
  return units * fontSize
}

/** XML 转义。水印文字常带用户名与邮箱，出现 & < > 是常事 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
