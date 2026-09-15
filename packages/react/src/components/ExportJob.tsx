import {
  describeExport,
  exportFileName,
  exportProvenance,
  type ExportMeta,
  type ExportStatus,
  type IconName
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface ExportJobProps {
  status?: ExportStatus
  /** 队列里前面还有几个 */
  queuePosition?: number
  processed?: number
  /** 总行数。**不知道就不要给**——给一个猜的数就成了假进度条 */
  total?: number
  /** 文件的过期时刻（毫秒时间戳） */
  expiresAt?: number
  error?: string
  /** 这份导出的出处。永远显示 */
  meta?: ExportMeta
  /** 当前时间，受控——好让演示与测试给得出确定的值 */
  now?: number
  onCancel?: () => void
  onDownload?: (fileName: string) => void
  /** 重新生成一份（过期、取消之后） */
  onRegenerate?: () => void
  onRetry?: () => void
  className?: string
}

/* 图标名用图标表的类型：写错一个名字界面上是个空位，不会有任何报错 */
const ICONS: Record<ExportStatus, IconName> = {
  queued: 'clock',
  running: 'refresh',
  ready: 'download',
  expired: 'history',
  failed: 'error-circle',
  cancelled: 'close'
}

/**
 * 导出任务卡（astra.md 的 B11 后半）。
 *
 * 任务怎么排队、文件怎么生成、下载走哪个地址，都在调用方手里——
 * 这个组件不碰任何 IO。进度条只在总数已知时出现（假进度条是谎）；
 * 出处永远在，它是这份文件能不能拿去对账的前提。
 */
export function ExportJob({
  status = 'queued',
  queuePosition,
  processed,
  total,
  expiresAt,
  error = '',
  meta,
  now,
  onCancel,
  onDownload,
  onRegenerate,
  onRetry,
  className = ''
}: ExportJobProps) {
  const view = describeExport({
    status,
    queuePosition,
    processed,
    total,
    expiresAt,
    error,
    now: now ?? Date.now()
  })
  const provenance = meta ? exportProvenance(meta) : []
  const fileName = meta ? exportFileName(meta) : ''

  return (
    <section
      className={['i-export-job', `i-export-job--${view.tone}`, className].filter(Boolean).join(' ')}
      role="status"
    >
      <div className="i-export-job__head">
        <span className="i-export-job__icon">
          <Icon name={ICONS[view.status]} size={16} />
        </span>
        <span className="i-export-job__text">
          <span className="i-export-job__label">{view.label}</span>
          <span className="i-export-job__detail">{view.detail}</span>
        </span>
        <span className="i-export-job__actions">
          {view.action === 'cancel' && (
            <Button size="sm" onClick={onCancel}>
              取消
            </Button>
          )}
          {view.action === 'download' && (
            <Button size="sm" variant="primary" onClick={() => onDownload?.(fileName)}>
              下载
            </Button>
          )}
          {view.action === 'regenerate' && (
            <Button size="sm" onClick={onRegenerate}>
              重新生成
            </Button>
          )}
          {view.action === 'retry' && (
            <Button size="sm" onClick={onRetry}>
              重试
            </Button>
          )}
        </span>
      </div>

      {/* 总数未知时这里什么也不画：走到 90% 就卡住的条子比没有条子更让人不敢离开 */}
      {view.percent !== null && (
        <div
          className="i-export-job__bar"
          role="progressbar"
          aria-valuenow={view.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${view.label}，${view.detail}`}
        >
          <div className="i-export-job__bar-fill" style={{ width: `${view.percent}%` }} />
        </div>
      )}

      {/* 出处永远在：它是这份文件能不能拿去对账的前提 */}
      {provenance.length > 0 && (
        <ul className="i-export-job__provenance">
          {provenance.map((line) => (
            <li key={line}>{line}</li>
          ))}
          {fileName && <li className="i-export-job__file">{fileName}</li>}
        </ul>
      )}
    </section>
  )
}
