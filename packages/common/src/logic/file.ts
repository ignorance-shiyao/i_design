/**
 * 文件类型识别：附件与上传列表共用的同一份判断。
 *
 * 「按扩展名给图标和颜色」这件事一旦让每处 UI 自己写，映射表就会分叉——
 * 上传列表把 .webp 当图片、附件条却当成未知类型，两处对同一个文件显示不同图标。
 */

import type { IconName } from '../icons'

export type FileKind = 'image' | 'document' | 'sheet' | 'code' | 'archive' | 'media' | 'other'

export interface FileTypeInfo {
  kind: FileKind
  /** 图标名，取自本体系的图标库 */
  icon: IconName
  /**
   * 分类色槽位（对应 --i-chart-N）。
   * 文件类型是「身份」而不是「程度」，因此用分类色而不是顺序色阶；
   * 也不能用状态色——绿色的表格文件会被读成「校验通过」。
   */
  slot: number
  /** 给读屏用的中文类型名，不能只靠颜色区分 */
  label: string
}

const EXT: Record<string, FileKind> = {
  // 图片
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  svg: 'image', bmp: 'image', avif: 'image', ico: 'image', heic: 'image',
  // 文档
  pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
  md: 'document', rtf: 'document', odt: 'document', pages: 'document',
  ppt: 'document', pptx: 'document', key: 'document',
  // 表格
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet', tsv: 'sheet', numbers: 'sheet',
  // 代码与数据
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', vue: 'code', dart: 'code',
  json: 'code', yaml: 'code', yml: 'code', xml: 'code', html: 'code',
  css: 'code', scss: 'code', py: 'code', go: 'code', rs: 'code',
  java: 'code', sh: 'code', sql: 'code',
  // 压缩包
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
  gz: 'archive', bz2: 'archive', xz: 'archive',
  // 音视频
  mp4: 'media', mov: 'media', avi: 'media', mkv: 'media', webm: 'media',
  mp3: 'media', wav: 'media', flac: 'media', aac: 'media', m4a: 'media'
}

const KIND: Record<FileKind, Omit<FileTypeInfo, 'kind'>> = {
  image: { icon: 'file-image', slot: 3, label: '图片' },
  document: { icon: 'file-text', slot: 1, label: '文档' },
  sheet: { icon: 'file-sheet', slot: 2, label: '表格' },
  code: { icon: 'file-code', slot: 4, label: '代码' },
  archive: { icon: 'file-zip', slot: 6, label: '压缩包' },
  media: { icon: 'file-media', slot: 5, label: '音视频' },
  other: { icon: 'file', slot: 0, label: '文件' }
}

/** 从文件名取扩展名；没有扩展名或全是点的情况都算未知 */
export function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

/** 按文件名判断类型，给出图标、配色槽位与中文类型名 */
export function fileTypeOf(name: string): FileTypeInfo {
  const kind = EXT[extensionOf(name)] ?? 'other'
  return { kind, ...KIND[kind] }
}
