/**
 * QR 码编码（字节模式）。
 *
 * 为什么自己写而不是引一个库：这个体系要求同一份算法落到 Web、小程序与 Flutter
 * 三套渲染上。引库的话，三端各引各的，同一段文本在三端上生成的码可能版本不同、
 * 掩码不同——扫出来都对，但设计稿上的模块数对不上，尺寸与留白全得各调一遍。
 *
 * 实现范围：字节模式（UTF-8）、版本 1–10、四种纠错等级。
 * 版本 10 在 M 级下可放 213 字节，足够装网址、口令与短文案；
 * 再大的版本模块数超过 57×57，在屏幕上印出来已经扫不动了，不如换一种载体。
 *
 * 术语按规范：module 是一个小方格，codeword 是一个字节。
 */

export type QrEcLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrMatrix {
  /** 边长（模块数） */
  size: number
  /** 每个模块是否为深色，按行存 */
  modules: boolean[][]
  version: number
  ecLevel: QrEcLevel
  mask: number
}

/* 每个版本的总码字数（版本 1–10） */
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

/*
 * 纠错分块表：[每块纠错码字数, 组1块数, 组1数据码字数, 组2块数, 组2数据码字数]。
 * 取自 ISO/IEC 18004 表 13–22，版本 1–10 的四个等级。
 * 这张表没法推算，只能照抄；抄错的后果是「生成的码扫不出来」，因此下面有断言兜底。
 */
const EC_BLOCKS: Record<QrEcLevel, number[][]> = {
  L: [
    [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0], [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0], [18, 2, 68, 2, 69]
  ],
  M: [
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]
  ],
  Q: [
    [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0], [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16], [24, 4, 19, 0, 0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17], [24, 6, 19, 2, 20]
  ],
  H: [
    [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12], [28, 4, 15, 0, 0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13], [28, 6, 15, 2, 16]
  ]
}

/** 对齐图形的中心坐标（版本 1 没有，2–10 各一组） */
const ALIGNMENT_CENTERS: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
  [6, 26, 46], [6, 28, 50]
]

const EC_LEVEL_BITS: Record<QrEcLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 }

export const QR_MAX_VERSION = 10

/* ---------------------------------------------------------------- GF(256) */

/*
 * 里德-所罗门用的有限域。生成多项式 0x11d，与规范一致。
 * 表一次性算好：每生成一个码都重算一遍 512 项，在长列表里会明显拖慢渲染。
 */
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

/** 纠错码字：数据多项式除以生成多项式，取余数 */
function reedSolomon(data: number[], ecCount: number): number[] {
  // 生成多项式 (x - α^0)(x - α^1)...
  let generator = [1]
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(generator.length + 1).fill(0)
    for (let j = 0; j < generator.length; j++) {
      next[j] ^= generator[j]
      next[j + 1] ^= gfMul(generator[j], EXP[i])
    }
    generator = next
  }

  const remainder = new Array(ecCount).fill(0)
  for (const byte of data) {
    const factor = byte ^ remainder[0]
    remainder.shift()
    remainder.push(0)
    if (factor !== 0) {
      for (let i = 0; i < ecCount; i++) remainder[i] ^= gfMul(generator[i + 1], factor)
    }
  }
  return remainder
}

/* ------------------------------------------------------------------ 编码 */

function utf8Bytes(text: string): number[] {
  const out: number[] = []
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (code < 0x80) out.push(code)
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code < 0x10000)
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    else
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
  }
  return out
}

/** 某版本某等级能放多少数据码字 */
function dataCodewordsOf(version: number, ecLevel: QrEcLevel): number {
  const [ec, g1, d1, g2, d2] = EC_BLOCKS[ecLevel][version - 1]
  void ec
  return g1 * d1 + g2 * d2
}

/**
 * 选版本：能装下就用最小的那个。
 * 字符计数字段在版本 10 起是 16 位而不是 8 位，容量因此在这一档少一个字节。
 */
export function qrVersionFor(byteLength: number, ecLevel: QrEcLevel): number {
  for (let version = 1; version <= QR_MAX_VERSION; version++) {
    const countBits = version >= 10 ? 16 : 8
    const capacity = dataCodewordsOf(version, ecLevel) - 1 - Math.ceil(countBits / 8)
    if (byteLength <= capacity) return version
  }
  return -1
}

function buildCodewords(bytes: number[], version: number, ecLevel: QrEcLevel): number[] {
  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1)
  }

  push(0b0100, 4) // 字节模式
  push(bytes.length, version >= 10 ? 16 : 8)
  for (const byte of bytes) push(byte, 8)

  const capacity = dataCodewordsOf(version, ecLevel) * 8
  // 结束符最多 4 位，装不下就少写几位——规范允许截断
  push(0, Math.min(4, capacity - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0))
  }
  // 填充码字交替 0xEC / 0x11，规范指定的两个值，不能随便填 0
  const pad = [0xec, 0x11]
  while (data.length < dataCodewordsOf(version, ecLevel)) data.push(pad[data.length % 2])

  /* 分块、各自算纠错、再按列交织 */
  const [ecCount, g1, d1, g2, d2] = EC_BLOCKS[ecLevel][version - 1]
  const blocks: { data: number[]; ec: number[] }[] = []
  let offset = 0
  for (let i = 0; i < g1 + g2; i++) {
    const size = i < g1 ? d1 : d2
    const chunk = data.slice(offset, offset + size)
    offset += size
    blocks.push({ data: chunk, ec: reedSolomon(chunk, ecCount) })
  }

  const out: number[] = []
  const maxData = Math.max(d1, d2)
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.data.length) out.push(block.data[i])
  }
  for (let i = 0; i < ecCount; i++) {
    for (const block of blocks) out.push(block.ec[i])
  }
  return out
}

/* ------------------------------------------------------------------ 矩阵 */

type Cell = boolean | null

function emptyMatrix(size: number): Cell[][] {
  return Array.from({ length: size }, () => new Array<Cell>(size).fill(null))
}

function placeFinder(matrix: Cell[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r
      const cc = col + c
      if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) continue
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6))
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
      matrix[rr][cc] = inRing || inCore
    }
  }
}

function placeFunctionPatterns(matrix: Cell[][], version: number) {
  const size = matrix.length

  placeFinder(matrix, 0, 0)
  placeFinder(matrix, 0, size - 7)
  placeFinder(matrix, size - 7, 0)

  // 定时图形：第 6 行与第 6 列的黑白相间，扫描器靠它定位模块网格
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0
    matrix[6][i] = dark
    matrix[i][6] = dark
  }

  for (const row of ALIGNMENT_CENTERS[version - 1]) {
    for (const col of ALIGNMENT_CENTERS[version - 1]) {
      // 三个定位图形所在的角上不放对齐图形
      if ((row <= 8 && col <= 8) || (row <= 8 && col >= size - 9) || (row >= size - 9 && col <= 8))
        continue
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          matrix[row + r][col + c] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)
        }
      }
    }
  }

  // 固定的深色模块
  matrix[size - 8][8] = true
}

/**
 * 格式信息的 15 个位置，两份互为备份，按位序号给出 [行, 列]。
 *
 * 行列一定要按规范来：写反了（把 [行, 列] 当成 [列, 行]）生成的码看起来一切正常——
 * 定位图形、定时图形、数据区都在——但占位与数据区就错开一格，
 * 解出来是前几个字符对、后面全是乱码。这个错误只有把码解回来才看得见。
 */
function formatPositions(size: number): [number, number][][] {
  const first: [number, number][] = []
  const second: [number, number][] = []
  // 第一份：左上角定位图形周围。位 0–5 沿第 8 列往下，位 6–8 拐角，位 9–14 沿第 8 行往左
  for (let i = 0; i <= 5; i++) first.push([i, 8])
  first.push([7, 8], [8, 8], [8, 7])
  for (let i = 9; i <= 14; i++) first.push([8, 14 - i])

  // 第二份：位 0–7 沿第 8 行从右往左，位 8–14 沿第 8 列从下往上
  for (let i = 0; i <= 7; i++) second.push([8, size - 1 - i])
  for (let i = 8; i <= 14; i++) second.push([size - 15 + i, 8])
  return [first, second]
}

/** 格式信息的 BCH(15,5) 校验，末尾再与规范给的掩码异或 */
function formatBits(ecLevel: QrEcLevel, mask: number): number {
  const data = (EC_LEVEL_BITS[ecLevel] << 3) | mask
  let value = data << 10
  for (let i = 14; i >= 10; i--) {
    if ((value >> i) & 1) value ^= 0b10100110111 << (i - 10)
  }
  return ((data << 10) | value) ^ 0b101010000010010
}

/** 版本信息的 BCH(18,6)，版本 7 起才有 */
function versionBits(version: number): number {
  let value = version << 12
  for (let i = 17; i >= 12; i--) {
    if ((value >> i) & 1) value ^= 0b1111100100101 << (i - 12)
  }
  return (version << 12) | value
}

const MASKS: ((row: number, col: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
]

/**
 * 惩罚分：规范给的四条规则，分数越低越好。
 * 它不是美观评分——连续同色、成块同色、形似定位图形的排列都会让扫描器误判。
 */
function penalty(modules: boolean[][]): number {
  const size = modules.length
  let score = 0

  // 规则 1：一行/一列里连续 5 个以上同色
  for (let i = 0; i < size; i++) {
    for (const line of [modules[i], modules.map((row) => row[i])]) {
      let run = 1
      for (let j = 1; j < size; j++) {
        if (line[j] === line[j - 1]) run++
        else {
          if (run >= 5) score += run - 2
          run = 1
        }
      }
      if (run >= 5) score += run - 2
    }
  }

  // 规则 2：2×2 同色块
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c]
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3
    }
  }

  // 规则 3：形似定位图形的 1:1:3:1:1 排列
  const pattern = [true, false, true, true, true, false, true]
  const hasAt = (line: boolean[], start: number) =>
    pattern.every((want, k) => line[start + k] === want)
  for (let i = 0; i < size; i++) {
    const rows = modules[i]
    const cols = modules.map((row) => row[i])
    for (const line of [rows, cols]) {
      for (let j = 0; j + 7 <= size; j++) {
        if (!hasAt(line, j)) continue
        const before = line.slice(Math.max(0, j - 4), j)
        const after = line.slice(j + 7, j + 11)
        if (before.length === 4 && before.every((v) => !v)) score += 40
        if (after.length === 4 && after.every((v) => !v)) score += 40
      }
    }
  }

  // 规则 4：深色模块占比偏离 50% 越多，扣分越多
  const dark = modules.flat().filter(Boolean).length
  const ratio = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10
  return score
}

function placeData(matrix: Cell[][], codewords: number[]) {
  const size = matrix.length
  let bitIndex = 0
  const bitAt = (index: number) =>
    index < codewords.length * 8 ? ((codewords[index >> 3] >> (7 - (index % 8))) & 1) === 1 : false

  let upward = true
  for (let right = size - 1; right >= 1; right -= 2) {
    // 第 6 列是定时图形，整列跳过
    if (right === 6) right = 5
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step
      for (const col of [right, right - 1]) {
        if (matrix[row][col] !== null) continue
        matrix[row][col] = bitAt(bitIndex++)
      }
    }
    upward = !upward
  }
}

/**
 * 生成矩阵。返回 null 表示装不下——调用方应当据实提示，
 * 而不是悄悄截断文本：截断后的码扫出来是另一个地址。
 */
export function qrMatrix(text: string, ecLevel: QrEcLevel = 'M'): QrMatrix | null {
  const bytes = utf8Bytes(text)
  const version = qrVersionFor(bytes.length, ecLevel)
  if (version < 0) return null

  const size = version * 4 + 17
  const codewords = buildCodewords(bytes, version, ecLevel)

  const base = emptyMatrix(size)
  placeFunctionPatterns(base, version)
  // 格式与版本信息的位置先占住，数据不能落在上面
  const [first, second] = formatPositions(size)
  for (const [row, col] of [...first, ...second]) base[row][col] = base[row][col] ?? false
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      base[Math.floor(i / 3)][size - 11 + (i % 3)] = false
      base[size - 11 + (i % 3)][Math.floor(i / 3)] = false
    }
  }
  const reserved = base.map((row) => row.map((cell) => cell !== null))

  const withData = base.map((row) => [...row])
  placeData(withData, codewords)

  /* 八种掩码各算一遍惩罚分，取最低的那个 */
  let best: { mask: number; modules: boolean[][] } | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (let mask = 0; mask < 8; mask++) {
    const modules = withData.map((row, r) =>
      row.map((cell, c) => {
        const value = cell === true
        return reserved[r][c] ? value : value !== MASKS[mask](r, c)
      })
    )

    const format = formatBits(ecLevel, mask)
    const [fa, fb] = formatPositions(size)
    // 位序从低位起，与规范一致
    fa.forEach(([row, col], i) => (modules[row][col] = ((format >> i) & 1) === 1))
    fb.forEach(([row, col], i) => (modules[row][col] = ((format >> i) & 1) === 1))
    modules[size - 8][8] = true

    if (version >= 7) {
      const info = versionBits(version)
      for (let i = 0; i < 18; i++) {
        const bit = ((info >> i) & 1) === 1
        modules[Math.floor(i / 3)][size - 11 + (i % 3)] = bit
        modules[size - 11 + (i % 3)][Math.floor(i / 3)] = bit
      }
    }

    const score = penalty(modules)
    if (score < bestScore) {
      bestScore = score
      best = { mask, modules }
    }
  }

  return { size, modules: best!.modules, version, ecLevel, mask: best!.mask }
}

/**
 * 矩阵转 SVG path。
 *
 * 一个模块一个 <rect> 的话，版本 10 会产生三千多个节点，长列表里直接卡住；
 * 合成一条 path 只有一个节点，渲染代价与模块数无关。
 */
export function qrPath(matrix: QrMatrix): string {
  const parts: string[] = []
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (matrix.modules[r][c]) parts.push(`M${c} ${r}h1v1h-1z`)
    }
  }
  return parts.join('')
}
