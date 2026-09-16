import { useState } from 'react'
import {
  columnStat,
  dropTargets,
  moveCard,
  moveMenu,
  nextDropTarget,
  type BoardCard,
  type BoardColumn,
  type BoardLane,
  type MoveTarget
} from '@i-design/common'
import { Icon } from './Icon'

export interface BoardProps {
  cards: BoardCard[]
  columns: BoardColumn[]
  /** 人员泳道。不给就是一张平看板 */
  lanes?: BoardLane[]
  onCardsChange?: (cards: BoardCard[]) => void
  /** 每次移动都抛出来：成了说动了什么，没成说为什么 */
  onMoved?: (message: string, ok: boolean) => void
  className?: string
}

/**
 * 看板与人员泳道（astra.md 的 B15）。
 *
 * 拖动、「移动到…」菜单、键盘方向键，**三条路径调的是同一个 `moveCard`**：
 * 各写一遍的话，同一次移动会落到三个结果，用户会以为其中一条坏了。
 * 落不下的格子在拿起卡片的那一刻就压暗并写出理由。
 */
export function Board({
  cards,
  columns,
  lanes = [],
  onCardsChange,
  onMoved,
  className = ''
}: BoardProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const pickedCard = cards.find((c) => c.id === picked) ?? null

  /* 拿起的那一刻一次算完：每个格子能不能落、不能的理由是什么 */
  const targets = pickedCard ? dropTargets(pickedCard, columns, cards, lanes) : []
  const menu = pickedCard ? moveMenu(pickedCard, columns, cards, lanes) : []
  const laneList: (BoardLane | undefined)[] = lanes.length ? lanes : [undefined]

  const targetOf = (columnId: string, laneId?: string) =>
    targets.find((t) => t.columnId === columnId && (t.laneId ?? undefined) === (laneId ?? undefined))

  const cardsIn = (columnId: string, laneId?: string) =>
    cards.filter(
      (card) => card.columnId === columnId && (card.laneId ?? undefined) === (laneId ?? undefined)
    )

  const pick = (card: BoardCard) => {
    // 锁着的卡拿不起来，但理由一直写在卡上，用户不必反复试
    if (card.lockedReason) return
    setPicked((prev) => (prev === card.id ? null : card.id))
  }

  /** 拖动、菜单、键盘都落到这里——三条路径的结果因此必然一致 */
  const commit = (to: MoveTarget) => {
    if (!pickedCard) return
    const result = moveCard(cards, pickedCard.id, to, columns, lanes)
    onMoved?.(result.message, result.ok)
    if (!result.ok) return
    onCardsChange?.(result.cards)
    setPicked(null)
  }

  const onKey = (event: React.KeyboardEvent, card: BoardCard) => {
    if (card.lockedReason) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(card)
      return
    }
    if (!pickedCard || pickedCard.id !== card.id) return
    if (event.key === 'Escape') {
      setPicked(null)
      return
    }
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    // 方向键跳过落不下的格子，而不是停在上面等用户发现按了没反应
    const next = nextDropTarget(targets, { columnId: card.columnId, laneId: card.laneId }, delta)
    if (!next) {
      onMoved?.('这张卡现在没有能落的地方', false)
      return
    }
    commit({ columnId: next.columnId, laneId: next.laneId })
  }

  return (
    <section className={`i-board ${className}`.trim()}>
      {pickedCard && (
        <p className="i-board__hint" role="status">
          <Icon name="arrow-right" size={14} />
          拿起「{pickedCard.title}」：拖到别的格子，或用 ← → 移动、Esc 放下。落不下的格子已经压暗并写明原因。
        </p>
      )}

      {laneList.map((lane) => (
        <div className="i-board__lane" key={lane?.id ?? '__flat__'}>
          {lane && (
            <div className="i-board__lane-title">
              {lane.title}
              {/* 不收新卡的泳道：理由跟在名字后面，而不是只把它变灰 */}
              {lane.blockedReason && (
                <span className="i-board__lane-blocked">{lane.blockedReason}</span>
              )}
            </div>
          )}

          {/* 这片网格的空白是落点，不是浪费：check:layout 的豁免要写明理由 */}
          <div
            className="i-board__columns"
            data-stretch-reason="看板的列：格子里的空白本身就是放卡片的落点，压到内容高度就没地方放了"
            style={{ ['--i-board-columns' as string]: columns.length }}
          >
            {columns.map((column) => {
              const target = targetOf(column.id, lane?.id)
              const stat = columnStat(column, cards, lane?.id)
              return (
                <div
                  key={column.id}
                  className={`i-board__cell${
                    pickedCard && target?.allowed ? ' is-droppable' : ''
                  }${pickedCard && target?.allowed === false ? ' is-blocked' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    commit({ columnId: column.id, laneId: lane?.id })
                  }}
                >
                  <div className="i-board__head">
                    <span>{column.title}</span>
                    {/* 计数写成 2/2：没有分母，用户要等到拖不进去才知道有上限 */}
                    <span className={`i-board__count${stat.over ? ' is-over' : ''}`}>
                      {stat.text}
                    </span>
                  </div>

                  {cardsIn(column.id, lane?.id).map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={`i-board__card${picked === card.id ? ' is-picked' : ''}${
                        card.lockedReason ? ' is-locked' : ''
                      }`}
                      draggable={!card.lockedReason}
                      aria-pressed={picked === card.id}
                      aria-disabled={!!card.lockedReason}
                      onClick={() => pick(card)}
                      onKeyDown={(e) => onKey(e, card)}
                      onDragStart={() => setPicked(card.id)}
                      onDragEnd={() => setPicked(null)}
                    >
                      <span>{card.title}</span>
                      {/* 锁着的卡说清为什么，而不是只变灰让人反复试 */}
                      {card.lockedReason && (
                        <span className="i-board__card-locked">{card.lockedReason}</span>
                      )}
                    </button>
                  ))}

                  {/* 落不下的原因就写在格子里，不靠悬停提示 */}
                  {pickedCard && target?.allowed === false && (
                    <p className="i-board__cell-reason">{target.reason}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* 「移动到…」：与拖动同一份清单，落不下的也列出来并写明理由 */}
      {pickedCard && (
        <ul className="i-board__menu">
          {menu.map((target) => (
            <li key={`${target.laneId ?? ''}/${target.columnId}`}>
              <button
                type="button"
                className="i-board__menu-item"
                disabled={!target.allowed}
                onClick={() => commit({ columnId: target.columnId, laneId: target.laneId })}
              >
                <span>移动到 {target.title}</span>
                {!target.allowed && <span className="i-board__menu-reason">{target.reason}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
