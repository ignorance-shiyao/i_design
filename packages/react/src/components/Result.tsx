import type { ReactNode } from 'react'
import { errorIllustrations, type IconName } from '@i-design/common'
import { Icon } from './Icon'

export interface ResultProps {
  status?: 'success' | 'info' | 'warning' | 'error' | '403' | '404' | '500'
  title?: string
  description?: string
  size?: 'sm' | 'md'
  illustration?: ReactNode
  extra?: ReactNode
  children?: ReactNode
}

const icons: Record<string, IconName> = {
  success: 'check-circle',
  info: 'info-circle',
  warning: 'warning-triangle',
  error: 'error-circle',
  '403': 'error-circle'
}

const presets: Record<string, { title: string; description: string }> = {
  success: { title: '操作成功', description: '你可以继续下一步，或返回列表查看结果。' },
  info: { title: '处理中', description: '结果稍后可在通知中心查看。' },
  warning: { title: '操作已提交，但有需要注意的地方', description: '请检查下方提示后再继续。' },
  error: { title: '操作失败', description: '请稍后重试；若持续失败请联系管理员。' },
  '403': { title: '无访问权限', description: '当前账号没有该资源的权限，可向管理员申请。' },
  '404': { title: '页面走丢了', description: '地址可能已经变更或删除。' },
  '500': { title: '服务出错了', description: '我们已经记录这次异常，请稍后重试。' }
}

export function Result({
  status = 'info',
  title,
  description,
  size = 'md',
  illustration,
  extra,
  children
}: ResultProps) {
  // 404 / 500 有专门的插画；其余状态用图标即可
  const art = errorIllustrations[status as '404' | '500']
  const text = presets[status]

  return (
    <div className={`i-result i-result--${size} is-${status}`}>
      {illustration ??
        (art ? (
          <img className="i-result__art" src={art.src} srcSet={art.srcset} alt="" />
        ) : (
          <span className="i-result__icon">
            <Icon name={icons[status]} size={size === 'sm' ? 28 : 40} />
          </span>
        ))}
      <h2 className="i-result__title">{title || text.title}</h2>
      <p className="i-result__desc">{description || text.description}</p>
      {children && <div className="i-result__actions">{children}</div>}
      {extra && <div className="i-result__extra">{extra}</div>}
    </div>
  )
}
