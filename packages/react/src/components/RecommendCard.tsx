import { type ReactNode } from 'react'
import { confidenceOf } from '@i-design/common'
import { Button } from './Button'

export interface RecommendCardProps {
  title: string
  /** 0–1 的置信度；分三档展示，不显示精确数字 */
  confidence?: number
  acceptText?: string
  alternativeText?: string
  /** 不给替代方案时隐藏那个按钮 */
  showAlternative?: boolean
  onAccept?: () => void
  onAlternative?: () => void
  children?: ReactNode
}

export function RecommendCard({
  title,
  confidence = 0.8,
  acceptText = '采纳',
  alternativeText = '换一个',
  showAlternative = true,
  onAccept,
  onAlternative,
  children
}: RecommendCardProps) {
  const level = confidenceOf(confidence)

  return (
    <section className="i-agent-card i-recommend">
      <p className="i-recommend__title">{title}</p>
      <div className="i-recommend__body">{children}</div>

      <footer className="i-recommend__foot">
        {/*
          置信度用三格 + 文字。格子是视觉线索，文字才是主要表达——
          色觉障碍用户与灰度打印下，只剩文字可读。
        */}
        <span className={`i-confidence is-${level.level}`} title={level.label}>
          <span className="i-confidence__bars" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`i-confidence__bar${n <= level.bars ? ' is-on' : ''}`}
              />
            ))}
          </span>
          {level.label}
        </span>

        <div className="i-recommend__actions">
          {showAlternative && (
            <Button size="sm" onClick={onAlternative}>
              {alternativeText}
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={onAccept}>
            {acceptText}
          </Button>
        </div>
      </footer>
    </section>
  )
}
