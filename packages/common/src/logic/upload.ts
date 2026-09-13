export type UploadStatus = 'ready' | 'uploading' | 'success' | 'error'

export interface UploadFile {
  /** 列表内唯一标识；重传时复用同一个 id，避免列表跳位 */
  uid: string
  name: string
  size: number
  status: UploadStatus
  /** 0-100 */
  percent: number
  /** 失败原因，直接展示给用户 */
  error?: string
  /** 上传成功后服务端返回的地址等信息 */
  response?: unknown
  raw?: File
}

/** 把字节数换成人能读的单位；上传场景不需要精确到字节 */
export function formatSize(bytes: number) {
  // 非法值返回空串而不是 NaN B：调用方通常直接把它拼进界面
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  // 小于 10 时保留一位小数：1.4 MB 比 1 MB 有用得多；再大就没必要了
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

/**
 * accept 校验：同时支持扩展名（.png）与 MIME（image/*、image/png）。
 * 浏览器的 accept 属性只是过滤文件选择框，拖拽进来的文件仍需自行校验。
 */
export function matchAccept(file: File, accept: string) {
  if (!accept.trim()) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule)
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
      return type === rule
    })
}

/**
 * 把 `accept` 翻译成人话。
 *
 * `accept` 是给浏览器看的：`.png,.jpg,.jpeg,image/*`。直接印在界面上，
 * 用户看到的是一串开发者才懂的东西——尤其 `image/*`，读者从里面学不到任何事。
 * 这里把扩展名转成大写的格式名，把通配的 MIME 归成类别，
 * 类别对应的词由字典给（它们是要翻译的）。
 *
 * 通配类别覆盖掉的扩展名不再单列：`.png,.jpg,image/*` 说「PNG、JPG、图片」
 * 是在重复，直接说「图片」就够。
 */
export function describeAccept(accept: string): { exts: string[]; kinds: UploadAcceptKind[] } {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)

  const kinds: UploadAcceptKind[] = []
  for (const rule of rules) {
    if (!rule.endsWith('/*')) continue
    const kind = rule.slice(0, -2) as UploadAcceptKind
    if (ACCEPT_KINDS.includes(kind) && !kinds.includes(kind)) kinds.push(kind)
  }

  const exts: string[] = []
  for (const rule of rules) {
    if (!rule.startsWith('.')) continue
    const ext = rule.slice(1)
    if (kinds.some((kind) => COVERED[kind].includes(ext))) continue
    const label = ext.toUpperCase()
    if (!exts.includes(label)) exts.push(label)
  }

  return { exts, kinds }
}

/** 通配 MIME 里值得单独说一句的那几类；其余（application/* 之类）说不清，就不翻译 */
export type UploadAcceptKind = 'image' | 'audio' | 'video' | 'text'
const ACCEPT_KINDS: UploadAcceptKind[] = ['image', 'audio', 'video', 'text']

/** 每个通配类别覆盖哪些扩展名——只用于「说了类别就不再单列扩展名」这一件事 */
const COVERED: Record<UploadAcceptKind, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico', 'heic'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  text: ['txt', 'md', 'csv', 'log']
}

let seed = 0
export const nextUid = () => `i-upload-${Date.now().toString(36)}-${++seed}`
