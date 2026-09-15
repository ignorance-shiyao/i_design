/**
 * 导出任务的纯逻辑（astra.md 的 B11 后半）。
 *
 * 这一层存在的理由只有一句：**导出是「任务」，不是「下载」。**
 *
 * 几十行的导出确实就是一次下载，但业务系统里的导出动辄几万行：要排队、
 * 要跑一段时间、要能中途取消、生成好的文件还有有效期。把它做成一个「点了就等」
 * 的按钮，用户只会反复点，然后在第三次点击之后收到三份一样的文件。
 *
 * 三条规则是这一层的全部内容：
 *
 * **一、不知道总数就不要画进度条。**
 * 假进度条是谎。服务端还没数完总行数时，如实说「已导出 12000 行」，
 * 而不是让一个条子走到 90% 再卡住——那比没有进度条更让人不敢离开。
 *
 * **二、生成好的文件会过期，过期之后给的是「重新生成」，不是一个坏链接。**
 * 用户第二天回来点那个下载，拿到 404 或者一份空文件，会以为是自己权限没了。
 *
 * **三、导出必须带出处。**
 * 「这份是什么时候、按哪套筛选条件、导了哪些列、多少行」——四样缺一样，
 * 两个人拿着两份表就对不上账，而他们会先怀疑数据错了，最后才想到是筛选不同。
 * 文件名里也要带上时间与条件摘要：都叫 export.csv 的两份文件，
 * 谁也说不清哪份是哪份。
 */

export type ExportStatus = 'queued' | 'running' | 'ready' | 'expired' | 'failed' | 'cancelled'

export interface ExportJobInput {
  status: ExportStatus
  /** 队列里前面还有几个。不给表示服务端没有队列信息 */
  queuePosition?: number
  /** 已处理行数 */
  processed?: number
  /** 总行数。**不知道就不要给**——给了一个猜的数就成了假进度条 */
  total?: number
  /** 文件的过期时刻（毫秒时间戳） */
  expiresAt?: number
  /** 失败原因 */
  error?: string
  now: number
}

export type ExportTone = 'neutral' | 'progress' | 'success' | 'danger'
export type ExportAction = 'none' | 'cancel' | 'download' | 'regenerate' | 'retry'

export interface ExportJobView {
  status: ExportStatus
  tone: ExportTone
  /** 状态本身。颜色不是唯一线索，这句话必须出现 */
  label: string
  detail: string
  /**
   * 进度百分比（0–100）。**总数未知时是 null**，界面拿到 null 就不该画进度条，
   * 只显示 detail 里那句「已导出 N 行」。
   */
  percent: number | null
  busy: boolean
  action: ExportAction
}

/** 还能下载多久。过期返回 0 */
export function remainingLife(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000))
}

/** 把秒数说成人话。小时以下不说「0 小时」，分钟以下不说「0 分钟」 */
export function humanDuration(seconds: number): string {
  if (seconds <= 0) return '已过期'
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

export function describeExport(input: ExportJobInput): ExportJobView {
  const { status, processed, total } = input

  // 总数未知就不给百分比：假进度条比没有进度条更让人不敢离开
  const percent =
    total !== undefined && total > 0 && processed !== undefined
      ? Math.min(100, Math.floor((processed / total) * 100))
      : null

  if (status === 'queued') {
    const detail =
      input.queuePosition === undefined
        ? '已提交，等待服务端安排'
        : input.queuePosition > 0
          ? `前面还有 ${input.queuePosition} 个任务`
          : '马上就轮到了'
    // 排队中也能取消：这时候取消是最省事的，不必等它跑完
    return { status, tone: 'neutral', label: '排队中', detail, percent: null, busy: true, action: 'cancel' }
  }

  if (status === 'running') {
    const detail =
      processed === undefined
        ? '正在生成'
        : total === undefined
          ? `已导出 ${processed} 行`
          : `已导出 ${processed} / ${total} 行`
    return { status, tone: 'progress', label: '生成中', detail, percent, busy: true, action: 'cancel' }
  }

  if (status === 'ready') {
    const life = input.expiresAt === undefined ? null : remainingLife(input.expiresAt, input.now)
    // 已经到点的文件不算 ready：拿到 404 的人会以为是自己权限没了
    if (life !== null && life <= 0) {
      return {
        status: 'expired',
        tone: 'neutral',
        label: '已过期',
        detail: '生成好的文件已经过期，重新生成一份即可',
        percent: null,
        busy: false,
        action: 'regenerate'
      }
    }
    return {
      status,
      tone: 'success',
      label: '可下载',
      detail: life === null ? '文件已生成' : `文件已生成，还可下载 ${humanDuration(life)}`,
      percent: 100,
      busy: false,
      action: 'download'
    }
  }

  if (status === 'expired') {
    return {
      status,
      tone: 'neutral',
      label: '已过期',
      detail: '生成好的文件已经过期，重新生成一份即可',
      percent: null,
      busy: false,
      action: 'regenerate'
    }
  }

  if (status === 'failed') {
    return {
      status,
      tone: 'danger',
      label: '生成失败',
      detail: input.error?.trim() || '未知原因',
      percent: null,
      busy: false,
      action: 'retry'
    }
  }

  return {
    status: 'cancelled',
    tone: 'neutral',
    label: '已取消',
    detail: '没有生成任何文件',
    percent: null,
    busy: false,
    action: 'regenerate'
  }
}

/* ---------- 出处 ---------- */

export interface ExportMeta {
  /** 导出的是什么。「销售订单」「库存流水」 */
  subject: string
  /** 生成时刻（毫秒时间戳） */
  createdAt: number
  /** 当时的筛选条件，已经翻译成人话：「负责人：林岚」「状态：已发货」 */
  filters?: readonly string[]
  /** 导了哪些列 */
  columns?: readonly string[]
  /** 多少行 */
  rows?: number
}

export interface StampParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

/**
 * 把年月日时分排成 `2026-09-15 14:30`（文件名里用 `2026-09-15-14-30`）。
 *
 * 只接受拆好的数字，不接受时间戳：时间戳转成年月日要看时区，而时区是各端
 * 从系统拿的。把转换留在各端、只把**排版规则**共享出来，两端才对得上——
 * 否则跨端对齐测试会在 CI 与开发机的时区不同时无缘无故变红，
 * 而那红跟这套规则没有任何关系。
 */
export function formatStamp(parts: StampParts, separator = ' '): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
  const time =
    separator === ' ' ? `${pad(parts.hour)}:${pad(parts.minute)}` : `${pad(parts.hour)}${separator}${pad(parts.minute)}`
  return `${date}${separator}${time}`
}

/** 本地时区的年月日时分。转换在这一端做，排版交给 formatStamp */
function stamp(at: number, separator = ' '): string {
  const d = new Date(at)
  return formatStamp(
    {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes()
    },
    separator
  )
}

/**
 * 出处清单，逐条摆在文件旁边。
 *
 * 四样缺一样，两个人拿着两份表就对不上账——而他们会先怀疑数据错了，
 * 最后才想到是筛选不同。没有筛选也要明写「没有筛选条件（全量）」，
 * 不能留空：留空既可能是「全量」也可能是「忘了记」。
 */
export function exportProvenance(meta: ExportMeta): string[] {
  const lines = [`导出内容：${meta.subject}`, `生成时间：${stamp(meta.createdAt)}`]
  lines.push(
    meta.filters && meta.filters.length
      ? `筛选条件：${meta.filters.join('；')}`
      : '筛选条件：没有筛选条件（全量）'
  )
  if (meta.columns && meta.columns.length) lines.push(`导出列：${meta.columns.join('、')}`)
  if (meta.rows !== undefined) lines.push(`行数：${meta.rows}`)
  return lines
}

/**
 * 文件名。
 *
 * 带上主题、时间与筛选摘要：都叫 export.csv 的两份文件，谁也说不清哪份是哪份。
 * 文件系统不认识的字符换成下划线——冒号与斜杠在 Windows 上直接存不下来。
 */
export function exportFileName(meta: ExportMeta, extension = 'csv'): string {
  const safe = (text: string) => text.replace(/[\\/:*?"<>|\s]+/g, '_')
  const parts = [safe(meta.subject), stamp(meta.createdAt, '-')]
  if (meta.filters && meta.filters.length) parts.push(safe(meta.filters.join('_')))
  return `${parts.join('_')}.${extension}`
}
