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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

let seed = 0
export const nextUid = () => `i-upload-${Date.now().toString(36)}-${++seed}`
