import type { ReactNode } from 'react'
import { emptyIllustrations } from '@i-design/common'

export interface EmptyProps {
  type?: 'empty' | 'search' | 'error' | 'permission'
  title?: string
  description?: string
  size?: 'sm' | 'md'
  /** 替换插画；不传使用体系自带的猫咪插画 */
  illustration?: ReactNode
  children?: ReactNode
}

const presets: Record<string, { title: string; description: string }> = {
  empty: { title: '暂无数据', description: '这里还没有内容，创建第一条试试。' },
  search: { title: '没有匹配结果', description: '换个关键词，或减少筛选条件。' },
  error: { title: '加载失败', description: '请检查网络后重试。' },
  permission: { title: '无访问权限', description: '请联系管理员申请该资源的访问权限。' }
}

export function Empty({
  type = 'empty',
  title,
  description,
  size = 'md',
  illustration,
  children
}: EmptyProps) {
  const art = emptyIllustrations[type]
  return (
    <div className={`i-empty i-empty--${size}`}>
      {illustration ?? (
        <img
          className="i-empty__art"
          src={art.src}
          srcSet={art.srcset}
          width={art.width}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      <p className="i-empty__title">{title || presets[type].title}</p>
      <p className="i-empty__desc">{description || presets[type].description}</p>
      {children && <div className="i-empty__action">{children}</div>}
    </div>
  )
}
