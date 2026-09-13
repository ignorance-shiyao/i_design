import {
  summarizeToolChips,
  toolChipIcon,
  toolChipStat,
  type ToolChipItem
} from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'
import { Loading } from './Loading'

/**
 * 工具芯片：把一串工具调用压成一行行芯片。
 *
 * 与 ChatToolCall 的分工：**芯片是折叠态，卡片是展开态**。
 * 智能体一次回答里可能调十几次工具，每次都摊成一张卡片，读者要滚三屏才看得到
 * 结论；全藏起来又没人知道它动了什么。
 */
export interface ToolChipsProps {
  items: ToolChipItem[]
  /** 超过这个数量就折叠，留一个「还有 N 个」的按钮；0 表示不折叠 */
  max?: number
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onSelect?: (item: ToolChipItem) => void
}

export function ToolChips({
  items,
  max = 0,
  expanded = false,
  onExpandedChange,
  onSelect
}: ToolChipsProps) {
  const { locale } = useConfig()
  const clipped = max > 0 && items.length > max && !expanded
  const shown = clipped ? items.slice(0, max) : items
  const rest = items.length - shown.length
  /* 折叠时把被藏起来那部分的统计顶在按钮上：折叠不该等于把信息删掉 */
  const hidden = summarizeToolChips(items.slice(shown.length))
  const hiddenStat = toolChipStat(hidden.added, hidden.removed)

  return (
    <div className="i-chips">
      {shown.map((item) => (
        <button
          key={item.key}
          className={`i-chips__item i-chips__item--${item.status ?? 'success'}`}
          type="button"
          onClick={() => onSelect?.(item)}
        >
          <span className="i-chips__icon">
            {item.status === 'running' ? (
              <Loading size="sm" />
            ) : (
              <Icon name={toolChipIcon(item.status)} size={13} />
            )}
          </span>
          <span className="i-chips__label">{item.label}</span>
          {/*
            统计用文字而不是只用颜色：色觉障碍用户与灰度打印都读不出
            「绿的是加、红的是删」，而「+13 −4」谁都读得出来。
          */}
          {toolChipStat(item.added, item.removed) && (
            <span className="i-chips__stat">
              {!!item.added && <span className="i-chips__stat-add">+{item.added}</span>}
              {!!item.removed && <span className="i-chips__stat-remove">−{item.removed}</span>}
            </span>
          )}
        </button>
      ))}

      {clipped && (
        <button className="i-chips__more" type="button" onClick={() => onExpandedChange?.(true)}>
          <span>{locale.toolMoreText(rest)}</span>
          {hiddenStat && <span className="i-chips__stat">{hiddenStat}</span>}
          {!!hidden.failed && (
            <span className="i-chips__more-failed">{locale.toolFailedText(hidden.failed)}</span>
          )}
        </button>
      )}
    </div>
  )
}
