/**
 * 智能体屏幕：看着智能体操作一块屏幕。
 *
 * 难点不在画面，在围着画面的那几行字：一张静止的画面，看起来和一张卡住的
 * 画面一模一样。不写出「这张画面是什么时候的」，用户会把一次卡死当成
 * 智能体在思考，白等好几分钟。
 */
import { useEffect, useState } from 'react'
import {
  canTakeOver,
  frameAge,
  frameStale,
  frameStaleText,
  screenAspect,
  screenStatusIcon,
  screenStatusText,
  type AgentScreenState
} from '@i-design/common'
import { Icon } from './Icon'
import { Loading } from './Loading'

export interface AgentScreenProps {
  state?: AgentScreenState
  /** 当前在做什么。有它就显示它——「工作中」三个字没有信息量 */
  action?: string
  /** 当前画面的图片地址。没有时显示占位，框的大小不变 */
  frame?: string
  /** 画面的时间戳（毫秒） */
  updatedAt?: number
  frameWidth?: number
  frameHeight?: number
  title?: string
  onTakeOver?: () => void
}

export function AgentScreen({
  state = 'connecting',
  action = '',
  frame = '',
  updatedAt = 0,
  frameWidth,
  frameHeight,
  title = '智能体屏幕',
  onTakeOver
}: AgentScreenProps) {
  /* 自己走一个秒表：画面的时间戳不变，但「几秒前」得一直往前走 */
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const status = screenStatusText(state, action)
  const age = updatedAt ? frameAge(now, updatedAt) : ''
  const stale = updatedAt ? frameStale(now, updatedAt, state) : false

  return (
    <section className={`i-screen i-screen--${state}`}>
      <header className="i-screen__head">
        <span className="i-screen__status">
          {/* 连接中与操作中用转圈，其余用图标：转圈本身就说明「还在动」 */}
          {state === 'connecting' || state === 'working' ? (
            <Loading size="sm" />
          ) : (
            <Icon name={screenStatusIcon(state)} size={14} />
          )}
          {status}
        </span>
        {age ? (
          <span className={`i-screen__age${stale ? ' is-stale' : ''}`}>
            {stale ? <Icon name="warning-triangle" size={12} /> : null}
            {age}
          </span>
        ) : null}
        <button
          className="i-screen__takeover"
          type="button"
          disabled={!canTakeOver(state)}
          onClick={() => onTakeOver?.()}
        >
          <Icon name="user" size={13} />
          接管
        </button>
      </header>

      <div
        className="i-screen__frame"
        style={{ aspectRatio: screenAspect(frameWidth, frameHeight) }}
      >
        {frame ? (
          <img className="i-screen__img" src={frame} alt={`${title}：${status}`} />
        ) : (
          // 没有画面时占位，框的大小不变——大小一变，连上的那一刻整页就跳了
          <div className="i-screen__placeholder">
            {state === 'connecting' ? (
              <Loading size="md" />
            ) : (
              <Icon name={screenStatusIcon(state)} size={20} />
            )}
            <span>{status}</span>
          </div>
        )}

        {/* 卡住的提醒压在画面上，而不是挤在头部：用户此刻正看着画面 */}
        {stale ? (
          <p className="i-screen__stale">
            <Icon name="warning-triangle" size={14} />
            {frameStaleText(now, updatedAt)}
          </p>
        ) : null}
      </div>
    </section>
  )
}
